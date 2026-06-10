<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\DocumentTracking;
use App\Models\Location;
use App\Services\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Manages hierarchical physical storage locations (Cabinet > Tray > Partition)
 * and moving documents between them.
 */
class LocationController extends Controller
{
    /**
     * Full location tree with subtree document counts, plus the count of
     * documents that have no assigned location.
     */
    public function tree(Request $request)
    {
        $locations = Location::orderBy('name')->get();

        $counts = Document::query()
            ->where('status', 'active')
            ->whereNotNull('location_id')
            ->select('location_id')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw("SUM(CASE WHEN tracking_status = 'checked_out' THEN 1 ELSE 0 END) as checked_out")
            ->groupBy('location_id')
            ->get()
            ->keyBy('location_id');

        // Folder breakdown per location (direct documents)
        $folderRows = Document::query()
            ->where('documents.status', 'active')
            ->whereNotNull('documents.location_id')
            ->whereNotNull('documents.folder_id')
            ->leftJoin('folders', 'documents.folder_id', '=', 'folders.folder_id')
            ->select('documents.location_id', 'documents.folder_id', 'folders.folder_name')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('documents.location_id', 'documents.folder_id', 'folders.folder_name')
            ->get()
            ->groupBy('location_id');

        $byParent = $locations->groupBy('parent_id');

        $build = function ($parentId) use (&$build, $byParent, $counts, $folderRows) {
            $nodes = [];
            foreach ($byParent->get($parentId, collect()) as $loc) {
                $children = $build($loc->id);

                $direct      = $counts->get($loc->id);
                $total       = (int) ($direct->total ?? 0);
                $checkedOut  = (int) ($direct->checked_out ?? 0);

                // Folders for this node's direct documents
                $folderMap = [];
                foreach ($folderRows->get($loc->id, collect()) as $fr) {
                    $folderMap[$fr->folder_id] = [
                        'folder_id'   => (int) $fr->folder_id,
                        'folder_name' => $fr->folder_name ?? 'Untitled folder',
                        'total'       => (int) $fr->total,
                    ];
                }

                foreach ($children as $child) {
                    $total      += $child['total'];
                    $checkedOut += $child['checked_out'];

                    // Merge children's folder breakdown up into this node (subtree)
                    foreach ($child['folders'] as $cf) {
                        if (isset($folderMap[$cf['folder_id']])) {
                            $folderMap[$cf['folder_id']]['total'] += $cf['total'];
                        } else {
                            $folderMap[$cf['folder_id']] = $cf;
                        }
                    }
                }

                $folders = array_values($folderMap);
                usort($folders, fn ($a, $b) => strcasecmp($a['folder_name'], $b['folder_name']));

                $nodes[] = [
                    'id'          => $loc->id,
                    'name'        => $loc->name,
                    'parent_id'   => $loc->parent_id,
                    'path'        => $loc->path,
                    'total'       => $total,
                    'checked_out' => $checkedOut,
                    'folders'     => $folders,
                    'children'    => $children,
                ];
            }
            return $nodes;
        };

        $tree = $build(null);

        $noLocation = Document::where('status', 'active')->whereNull('location_id')->count();

        return response()->json([
            'success'     => true,
            'tree'        => $tree,
            'no_location' => $noLocation,
        ]);
    }

    /**
     * Create a new location (optionally nested under a parent).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'      => 'required|string|max:255',
            'parent_id' => 'nullable|integer|exists:locations,id',
        ]);

        if (!$this->canEdit($request)) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to manage locations'], 403);
        }

        $parent = !empty($validated['parent_id']) ? Location::find($validated['parent_id']) : null;
        $name   = trim($validated['name']);
        $path   = $parent ? $parent->path . ' > ' . $name : $name;

        $location = Location::create([
            'name'       => $name,
            'parent_id'  => $parent?->id,
            'path'       => $path,
            'created_by' => $request->user()->user_id ?? null,
        ]);

        return response()->json(['success' => true, 'location' => $location]);
    }

    /**
     * Rename a location (and re-path its descendants + their documents).
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        if (!$this->canEdit($request)) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to manage locations'], 403);
        }

        $location = Location::findOrFail($id);
        $oldPath  = $location->path;
        $name     = trim($validated['name']);
        $parent   = $location->parent_id ? Location::find($location->parent_id) : null;
        $newPath  = $parent ? $parent->path . ' > ' . $name : $name;

        DB::transaction(function () use ($location, $name, $oldPath, $newPath) {
            $location->name = $name;
            $location->path = $newPath;
            $location->save();

            if ($oldPath !== $newPath) {
                // Re-path descendants
                $descendants = Location::where('path', 'like', $oldPath . ' > %')->get();
                foreach ($descendants as $d) {
                    $d->path = $newPath . substr($d->path, strlen($oldPath));
                    $d->save();
                }

                // Keep documents' denormalized physical_location in sync
                $ids = $descendants->pluck('id')->push($location->id);
                foreach (Location::whereIn('id', $ids)->get() as $l) {
                    Document::where('location_id', $l->id)->update(['physical_location' => $l->path]);
                }
            }
        });

        return response()->json(['success' => true, 'location' => $location->fresh()]);
    }

    /**
     * Delete a location (only when empty — no sub-locations and no documents).
     */
    public function destroy(Request $request, $id)
    {
        if (!$this->canEdit($request)) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to manage locations'], 403);
        }

        $location = Location::findOrFail($id);

        if (Location::where('parent_id', $id)->exists()) {
            return response()->json(['success' => false, 'message' => 'This location has sub-locations. Delete or move them first.'], 422);
        }

        if (Document::where('location_id', $id)->exists()) {
            return response()->json(['success' => false, 'message' => 'This location still has files. Move them out first.'], 422);
        }

        $location->delete();

        return response()->json(['success' => true, 'message' => 'Location deleted']);
    }

    /**
     * Move one or many documents to a location (or to "no location" when null).
     */
    public function moveDocuments(Request $request)
    {
        $validated = $request->validate([
            'document_ids'   => 'required|array|min:1',
            'document_ids.*' => 'integer|exists:documents,doc_id',
            'location_id'    => 'nullable|integer|exists:locations,id',
        ]);

        if (!$this->canEdit($request)) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to move documents'], 403);
        }

        $location = !empty($validated['location_id']) ? Location::find($validated['location_id']) : null;
        $path     = $location?->path;
        $userId   = $request->user()->user_id ?? null;
        $moved    = 0;

        DB::transaction(function () use ($validated, $location, $path, $userId, &$moved) {
            foreach ($validated['document_ids'] as $docId) {
                $document = Document::find($docId);
                if (!$document) {
                    continue;
                }

                $from = $document->physical_location;
                $document->location_id       = $location?->id;
                $document->physical_location = $path;
                $document->save();

                DocumentTracking::create([
                    'doc_id'        => $document->doc_id,
                    'action'        => 'moved',
                    'from_location' => $from,
                    'to_location'   => $path,
                    'performed_by'  => $userId,
                ]);

                ActivityLogger::log(
                    ActivityLogger::DOCUMENT_MOVED,
                    $document,
                    $userId,
                    'Document moved: ' . ActivityLogger::resolveTitle($document)
                        . ' (' . ($from ?: 'Unassigned') . ' → ' . ($path ?: 'Unassigned') . ')',
                    ['from' => $from, 'to' => $path]
                );

                $moved++;
            }
        });

        return response()->json([
            'success' => true,
            'message' => $moved . ' ' . ($moved === 1 ? 'document' : 'documents') . ' moved',
            'moved'   => $moved,
        ]);
    }

    /**
     * Assign one or many documents to a logical folder (drag-to-folder).
     */
    public function assignFolder(Request $request)
    {
        $validated = $request->validate([
            'document_ids'   => 'required|array|min:1',
            'document_ids.*' => 'integer|exists:documents,doc_id',
            'folder_id'      => 'nullable|integer|exists:folders,folder_id',
        ]);

        if (!$this->canEdit($request)) {
            return response()->json(['success' => false, 'message' => 'You do not have permission to move documents'], 403);
        }

        $userId = $request->user()->user_id ?? null;
        $moved  = 0;

        DB::transaction(function () use ($validated, $userId, &$moved) {
            foreach ($validated['document_ids'] as $docId) {
                $document = Document::find($docId);
                if (!$document) {
                    continue;
                }
                $document->folder_id = $validated['folder_id'];
                $document->save();

                ActivityLogger::log(
                    ActivityLogger::DOCUMENT_METADATA_UPDATED,
                    $document,
                    $userId,
                    'Document folder changed: ' . ActivityLogger::resolveTitle($document),
                    ['folder_id' => $validated['folder_id']]
                );
                $moved++;
            }
        });

        return response()->json([
            'success' => true,
            'message' => $moved . ' ' . ($moved === 1 ? 'document' : 'documents') . ' moved',
            'moved'   => $moved,
        ]);
    }

    private function canEdit(Request $request): bool
    {
        $user = $request->user();
        return $user && ($user->can_edit || $user->role === 'admin');
    }
}
