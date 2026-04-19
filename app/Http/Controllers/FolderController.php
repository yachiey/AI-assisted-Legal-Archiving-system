<?php
namespace App\Http\Controllers;
use App\Models\Folder;
use App\Models\Document;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class FolderController extends Controller
{
    private const BASE_PATH = 'd:/legal_office';
    private const DEFAULT_RELATIONS = ['children', 'creator'];

    /**
     * Get all folders (optimized - no relations for faster loading)
     */
    public function index()
    {
        return response()->json(
            Folder::with('creator')
                ->select('folder_id', 'folder_name', 'folder_path', 'folder_type', 'parent_folder_id', 'created_by', 'created_at', 'updated_at')
                ->orderBy('updated_at', 'desc')
                ->get()
        );
    }

    /**
     * Create a new folder (supports subfolders via parent_folder_id)
     */
    public function store(Request $request)
    {
        Log::info('Folder creation attempt', [
            'user' => $request->user()?->getKey(),
            'request_data' => $request->all()
        ]);

        $validated = $request->validate([
            'folder_name' => 'required|string|max:255',
            'folder_path' => 'required|string',
            'folder_type' => 'required|string',
            'parent_folder_id' => 'nullable|integer|exists:folders,folder_id',
        ]);

        $path = $this->buildFolderPath($validated['parent_folder_id'], $validated['folder_name']);

        try {
            DB::beginTransaction();

            // Create physical directory
            if (!File::exists($path)) {
                File::makeDirectory($path, 0755, true);
            }

            $folder = Folder::create([
                'folder_name'       => $validated['folder_name'],
                'folder_path'       => $path,
                'folder_type'       => $validated['folder_type'],
                'parent_folder_id'  => $validated['parent_folder_id'] ?? null,
                'created_by'        => $request->user()->getKey(),
            ]);

            DB::commit();

            Log::info('Folder created successfully', ['folder_id' => $folder->getKey()]);

            return response()->json([
                'message' => 'Folder created successfully',
                'folder'  => $folder->load(self::DEFAULT_RELATIONS)
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Folder creation failed', [
                'error' => $e->getMessage(),
                'user_id' => $request->user()?->getKey()
            ]);

            return response()->json([
                'message' => 'Failed to create folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Search folders by name or path (optimized)
     */
    public function search(Request $request, $term)
    {
        $folders = Folder::with('creator')
            ->select('folder_id', 'folder_name', 'folder_path', 'folder_type', 'parent_folder_id', 'created_by', 'created_at', 'updated_at')
            ->where(DB::raw('LOWER(folder_name)'), 'LIKE', '%' . strtolower($term) . '%')
            ->orWhere(DB::raw('LOWER(folder_path)'), 'LIKE', '%' . strtolower($term) . '%')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json($folders);
    }

    /**
     * Get recent folders
     */
    public function recent($limit = 5)
    {
        $folders = Folder::orderBy('updated_at', 'desc')
            ->take($limit)
            ->with(self::DEFAULT_RELATIONS)
            ->get();

        return response()->json($folders);
    }

    /**
     * Get paginated folders
     */
    public function getPaginatedFolders(Request $request)
    {
        $perPage = $request->input('per_page', 10);
        $parentId = $request->input('parent_id');
        $search = $request->input('search');

        $query = Folder::with('creator')
            ->select('folder_id', 'folder_name', 'folder_path', 'folder_type', 'parent_folder_id', 'created_by', 'created_at', 'updated_at');

        if ($parentId !== null && $parentId !== 'null' && $parentId !== '') {
            $query->where('parent_folder_id', $parentId);
        } else if ($search === null || $search === '') {
            // Only enforce null parent if we are not globally searching
            $query->whereNull('parent_folder_id');
        }

        if ($search !== null && $search !== '') {
            $term = strtolower($search);
            $query->where(function($q) use ($term) {
                $q->where(DB::raw('LOWER(folder_name)'), 'LIKE', '%' . $term . '%')
                  ->orWhere(DB::raw('LOWER(folder_path)'), 'LIKE', '%' . $term . '%');
            });
        }

        $paginated = $query->orderBy('updated_at', 'desc')->paginate($perPage);

        return response()->json($paginated);
    }

    /**
     * Get single folder with relations
     */
    public function show($id)
    {
        $folder = Folder::with(self::DEFAULT_RELATIONS)->findOrFail($id);
        return response()->json($folder);
    }

    /**
     * Update folder
     */
    public function update(Request $request, $id)
    {
        $folder = Folder::findOrFail($id);

        $validated = $request->validate([
            'folder_name' => 'sometimes|string|max:255',
            'folder_type' => 'sometimes|string',
        ]);

        try {
            DB::beginTransaction();

            // If folder_name changed, sync path, physical dir, children, and documents
            if (isset($validated['folder_name']) && $validated['folder_name'] !== $folder->folder_name) {
                $oldName = $folder->folder_name;
                $oldPath = $folder->folder_path;
                $newPath = preg_replace('/' . preg_quote($oldName, '/') . '$/', $validated['folder_name'], $oldPath);

                // 1. Rename physical directory
                if (File::exists($oldPath) && $oldPath !== $newPath) {
                    File::move($oldPath, $newPath);
                }

                // 2. Update this folder's path
                $validated['folder_path'] = $newPath;

                // 3. Update all descendant folder paths
                Folder::where('folder_path', 'LIKE', $oldPath . '/%')
                    ->update([
                        'folder_path' => DB::raw("REPLACE(folder_path, '" . addslashes($oldPath) . "', '" . addslashes($newPath) . "')")
                    ]);

                // 4. Update ai_suggested_folder on documents
                Document::where('ai_suggested_folder', $oldName)
                    ->update(['ai_suggested_folder' => $validated['folder_name']]);

                // 5. Update file_path on documents in this folder and subfolders
                Document::where('file_path', 'LIKE', addslashes($oldName) . '/%')
                    ->update([
                        'file_path' => DB::raw("REPLACE(file_path, '" . addslashes($oldName) . "/', '" . addslashes($validated['folder_name']) . "/')")
                    ]);
            }

            $folder->update($validated);

            DB::commit();

            return response()->json($folder->load(self::DEFAULT_RELATIONS));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Folder update failed', ['error' => $e->getMessage(), 'folder_id' => $id]);
            return response()->json(['message' => 'Failed to update folder', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete folder and its physical directory
     */
    public function destroy($id)
    {
        $folder = Folder::findOrFail($id);

        try {
            DB::beginTransaction();

            // Delete physical folder if exists
            if (File::exists($folder->folder_path)) {
                File::deleteDirectory($folder->folder_path);
            }

            $folder->delete();

            DB::commit();

            Log::info('Folder deleted successfully', ['folder_id' => $id]);

            return response()->json(['message' => 'Folder deleted successfully'], 200);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('Folder deletion failed', [
                'error' => $e->getMessage(),
                'folder_id' => $id
            ]);

            return response()->json([
                'message' => 'Failed to delete folder',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get folder tree structure (hierarchical display with subfolders)
     */
    public function tree()
    {
        $folders = Folder::with(['children.children', 'creator'])
            ->whereNull('parent_folder_id')
            ->orderBy('folder_name')
            ->get();

        return response()->json($folders);
    }

    /**
     * Get subfolders of a specific folder (optimized)
     */
    public function getSubfolders($parentId)
    {
        Log::info("Getting subfolders for parent_id: {$parentId}");

        $subfolders = Folder::with('creator')
            ->select('folder_id', 'folder_name', 'folder_path', 'folder_type', 'parent_folder_id', 'created_by', 'created_at', 'updated_at')
            ->where('parent_folder_id', $parentId)
            ->orderBy('folder_name')
            ->get();

        // Extra safety: filter out the parent folder itself in case of corrupted data
        $filteredSubfolders = $subfolders->filter(function ($folder) use ($parentId) {
            return $folder->folder_id != $parentId;
        })->values();

        Log::info("Found {$filteredSubfolders->count()} subfolders (after filtering)", [
            'parent_id' => $parentId,
            'folder_ids' => $filteredSubfolders->pluck('folder_id')->toArray()
        ]);

        return response()->json($filteredSubfolders);
    }

    /**
     * Build folder path based on parent folder
     */
    private function buildFolderPath(?int $parentFolderId, string $folderName): string
    {
        if ($parentFolderId) {
            $parent = Folder::findOrFail($parentFolderId);
            return $parent->folder_path . '/' . $folderName;
        }

        return self::BASE_PATH . '/' . $folderName;
    }
}