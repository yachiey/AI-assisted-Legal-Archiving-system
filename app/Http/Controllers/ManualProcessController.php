<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use App\Models\Folder;
use App\Services\ActivityLogger;
use App\Services\DocumentStorageService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class ManualProcessController extends Controller
{
    protected DocumentStorageService $storageService;

    public function __construct(DocumentStorageService $storageService)
    {
        $this->storageService = $storageService;
    }
    public function show(Request $request)
    {
        // Get specific document by ID if provided, or latest uploaded document by the current user
        $docId = $request->query('docId');
        
        \Log::info('ManualProcessController - show() called', [
            'url' => $request->fullUrl(),
            'all_params' => $request->all(),
            'query_params' => $request->query(),
            'docId' => $docId,
            'user_id' => auth()->id()
        ]);
        
        // Debug logging
        \Log::info('ManualProcessController - Document lookup', [
            'user_id' => auth()->id(),
            'auth_check' => auth()->check(),
            'docId_from_query' => $docId,
            'all_query_params' => $request->query()
        ]);
        
        if ($docId) {
            // If we have a document ID, find it (don't restrict by user for now to debug)
            $latestDocument = Document::where('doc_id', $docId)->first();
                
            \Log::info('ManualProcessController - Document search by ID', [
                'doc_id' => $docId,
                'found_document' => $latestDocument ? [
                    'doc_id' => $latestDocument->doc_id,
                    'title' => $latestDocument->title,
                    'status' => $latestDocument->status,
                    'created_by' => $latestDocument->created_by
                ] : null
            ]);
        } else {
            // If no auth, try to get the latest document overall for debugging
            if (!auth()->id()) {
                $latestDocument = Document::latest('created_at')->first();
            } else {
                $latestDocument = Document::where('created_by', auth()->id())
                    ->latest('created_at')
                    ->first();
            }
                
            \Log::info('ManualProcessController - Document search latest', [
                'user_id' => auth()->id(),
                'found_document' => $latestDocument ? [
                    'doc_id' => $latestDocument->doc_id,
                    'title' => $latestDocument->title,
                    'status' => $latestDocument->status,
                    'created_by' => $latestDocument->created_by
                ] : null,
                'user_documents_count' => Document::where('created_by', auth()->id())->count(),
                'all_documents_count' => Document::count(),
                'all_user_docs' => Document::where('created_by', auth()->id())->get(['doc_id', 'title', 'status', 'created_at'])->toArray()
            ]);
        }
            
        if ($latestDocument) {
            // Load user relationship
            $latestDocument->load('user');

            // Construct full name from user (same pattern as AIProcessController)
            $createdByName = 'Unknown User';
            if ($latestDocument->user) {
                $nameParts = array_filter([
                    $latestDocument->user->firstname,
                    $latestDocument->user->middle_name,
                    $latestDocument->user->lastname
                ]);
                $createdByName = implode(' ', $nameParts) ?: 'Unknown User';
            }

            $documentData = [
                'doc_id' => $latestDocument->doc_id,
                'fileName' => basename($latestDocument->file_path) ?: $latestDocument->title,
                'title' => $latestDocument->title,
                'description' => $latestDocument->description,
                'createdAt' => $latestDocument->created_at->format('Y-m-d'),
                'createdBy' => $createdByName,
                'category_id' => $latestDocument->category_id,
                'folder_id' => $latestDocument->folder_id,
                'remarks' => $latestDocument->remarks,
                'physical_location' => $latestDocument->physical_location,
                'document_ref_id' => $latestDocument->document_ref_id,
                'suggestedLocation' => $latestDocument->ai_suggested_folder, // Added missing field
            ];
        } else {
            // Construct current user's full name
            $currentUserName = 'Current User';
            if (auth()->check() && auth()->user()) {
                $nameParts = array_filter([
                    auth()->user()->firstname,
                    auth()->user()->middle_name,
                    auth()->user()->lastname
                ]);
                $currentUserName = implode(' ', $nameParts) ?: 'Current User';
            }

            $documentData = [
                'doc_id' => null,
                'fileName' => 'No file selected',
                'title' => 'No file selected',
                'createdAt' => now()->format('Y-m-d'),
                'createdBy' => $currentUserName,
            ];
        }

        return Inertia::render('Admin/Document/components/FileUpload/ManualProcessing', [
            'documentData' => $documentData
        ]);
    }

    /**
     * Get folders for dropdown
     */
    public function getFolders()
    {
        $folders = Folder::select('folder_id', 'folder_name', 'folder_path', 'folder_type', 'parent_folder_id')
            ->orderBy('folder_name')
            ->get();

        return response()->json($folders);
    }

    /**
     * Update document metadata - same fields as AI upload
     */
    public function updateDocument(Request $request)
    {
        try {
            // Log incoming request for debugging
            \Log::info('ManualProcessController - updateDocument called', [
                'request_data' => $request->all(),
                'has_folder_id' => $request->has('folder_id'),
                'folder_id_value' => $request->folder_id,
                'folder_id_is_null' => $request->folder_id === null
            ]);

            $request->validate([
                'doc_id' => 'required|integer|exists:documents,doc_id',
                'title' => 'required|string|max:255',
                'folder_id' => 'nullable|exists:folders,folder_id',
                'description' => 'nullable|string',
                'remarks' => 'nullable|string|max:1000',
                'physical_location' => 'nullable|string|max:255',
                'document_ref_id' => 'required|string|max:255|unique:documents,document_ref_id,' . $request->doc_id . ',doc_id',
            ]);

            $document = Document::find($request->doc_id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            $newFilePath = $document->file_path; // Keep original path by default
            $titleToUse = $request->title ?? $document->title;

            // ALWAYS rename the physical file to match the title
            // This ensures hash filenames like "hecxRBwvss8C8FiWseray4c6pF5OdrPt3irUBl2Q.pdf" become "Document Title.pdf"
            if ($titleToUse) {
                $newFilePath = $this->storageService->renameFileToTitle($document, $titleToUse);
                $document->file_path = $newFilePath;
            }

            // If a folder is selected, move the file to that folder
            if ($request->folder_id) {
                $folder = \App\Models\Folder::find($request->folder_id);
                if ($folder) {
                    try {
                        // Get the current file name (after rename)
                        $fileName = basename($newFilePath);

                        // Use folder_name directly as the relative path from storage root
                        $targetFolderPath = $folder->folder_name;
                        $targetFilePath = $targetFolderPath . '/' . $fileName;

                        \Log::info('Attempting to move file to folder', [
                            'from' => $newFilePath,
                            'to' => $targetFilePath,
                            'folder_name' => $folder->folder_name,
                            'folder_path' => $folder->folder_path
                        ]);

                        // Create folder if it doesn't exist
                        if (!Storage::disk('documents')->exists($targetFolderPath)) {
                            Storage::disk('documents')->makeDirectory($targetFolderPath);
                        }

                        // Move the file from current location to new folder
                        if (Storage::disk('documents')->exists($newFilePath)) {
                            Storage::disk('documents')->move($newFilePath, $targetFilePath);
                            $newFilePath = $targetFilePath;

                            \Log::info('File moved successfully', [
                                'from' => $document->file_path,
                                'to' => $newFilePath,
                                'folder_name' => $folder->folder_name
                            ]);
                        } else {
                            \Log::warning('Source file not found', ['path' => $newFilePath]);
                        }
                    } catch (\Exception $e) {
                        \Log::error('Failed to move file', [
                            'error' => $e->getMessage(),
                            'from' => $newFilePath,
                            'folder' => $folder->folder_name
                        ]);
                    }
                }
            }

            // Track changes for activity log
            $changes = [];
            if ($document->title !== $request->title) {
                $changes[] = "Title changed from '{$document->title}' to '{$request->title}'";
            }
            if ($document->folder_id !== $request->folder_id) {
                $oldFolder = $document->folder_id ? Folder::find($document->folder_id)?->folder_name : 'None';
                $newFolder = $request->folder_id ? Folder::find($request->folder_id)?->folder_name : 'None';
                $changes[] = "Folder changed from '{$oldFolder}' to '{$newFolder}'";
            }
            if ($document->description !== $request->description) {
                $changes[] = "Description updated";
            }
            if ($document->remarks !== $request->remarks) {
                $changes[] = "Remarks updated";
            }
            if ($document->physical_location !== $request->physical_location) {
                $changes[] = "Physical location updated";
            }
            if ($document->document_ref_id !== $request->document_ref_id) {
                $changes[] = "Document ID updated";
            }

            // Update document with new metadata and potentially new file path
            // Same fields as AI upload: title, folder_id, description, remarks, physical_location, file_path, status, document_ref_id
            $updateData = [
                'title' => $request->title,
                'description' => $request->description,
                'remarks' => $request->remarks,
                'physical_location' => $request->physical_location,
                'document_ref_id' => $request->document_ref_id,
                'file_path' => $newFilePath,
                'status' => 'active',
            ];

            // Only update folder_id if it's explicitly provided (not null)
            if ($request->has('folder_id') && $request->folder_id !== null) {
                $updateData['folder_id'] = $request->folder_id;
            }

            $document->update($updateData);

            // Log what was actually saved
            \Log::info('Document updated successfully', [
                'doc_id' => $document->doc_id,
                'final_folder_id' => $document->folder_id,
                'update_data_keys' => array_keys($updateData),
                'folder_id_in_update' => $updateData['folder_id'] ?? 'not included'
            ]);

            // Log the activity — this is a metadata confirmation, not a generic update
            ActivityLogger::log(
                ActivityLogger::DOCUMENT_METADATA_CONFIRMED,
                $document,
                auth()->id(),
                'Metadata confirmed: ' . ActivityLogger::resolveTitle($document),
                ['changes' => $changes]
            );

            \Log::info('Document updated via manual processing', [
                'doc_id' => $document->doc_id,
                'user_id' => auth()->id(),
                'changes' => $changes
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document updated successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update document',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}