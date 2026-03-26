<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Http\Controllers\Controller;
use App\Models\Document;
use App\Services\ActivityLogger;
use App\Services\DocumentProcessingService;
use App\Services\AIAnalysisService;
use App\Services\DocumentStorageService;
use App\Services\FolderMatchingService;
use App\Services\DocumentQueryService;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Jobs\ProcessDocumentJob;

class DocumentController extends Controller
{
    protected $processingService;
    protected $aiAnalysisService;
    protected $storageService;
    protected $folderMatchingService;
    protected $queryService;

    public function __construct(
        DocumentProcessingService $processingService,
        AIAnalysisService $aiAnalysisService,
        DocumentStorageService $storageService,
        FolderMatchingService $folderMatchingService,
        DocumentQueryService $queryService
    ) {
        $this->processingService = $processingService;
        $this->aiAnalysisService = $aiAnalysisService;
        $this->storageService = $storageService;
        $this->folderMatchingService = $folderMatchingService;
        $this->queryService = $queryService;
    }

    public function index()
    {
        return Inertia::render('Admin/Document/index');
    }

    /**
     * Handle file upload with text processing and embedding generation
     */
    public function store(Request $request)
    {
        // Validate the uploaded file
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,txt|max:51200',
            'folder_id' => 'nullable|integer',
            'title' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        if (!$user->can_upload && $user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to upload documents'
            ], 403);
        }

        try {
            set_time_limit(600); // 10 minutes for large PDF OCR processing

            $file = $request->file('file');

            // Compute file hash for content-based duplicate detection
            $fileHash = hash_file('sha256', $file->getRealPath());

            // Check if this exact file content already exists in the system
            $existingDoc = Document::where('file_hash', $fileHash)
                ->where('status', 'active')
                ->first();

            if ($existingDoc) {
                Log::info('Duplicate document detected by file hash', [
                    'file_hash' => $fileHash,
                    'existing_doc_id' => $existingDoc->doc_id,
                    'existing_title' => $existingDoc->title,
                ]);

                $folderName = $existingDoc->folder
                    ? $existingDoc->folder->folder_name
                    : 'No folder';

                return response()->json([
                    'success' => false,
                    'duplicate' => true,
                    'message' => 'This document already exists in the system.',
                    'existing_document' => [
                        'doc_id' => $existingDoc->doc_id,
                        'title' => $existingDoc->title,
                        'folder_name' => $folderName,
                        'folder_id' => $existingDoc->folder_id,
                    ]
                ], 409);
            }

            // Also check for in-progress duplicates (same user, same title, still processing)
            $title = $request->title ?? pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
            $pendingDoc = Document::where('file_hash', $fileHash)
                ->whereIn('status', ['processing', 'pending'])
                ->where('created_by', auth()->id())
                ->first();

            if ($pendingDoc) {
                Log::info('In-progress duplicate detected', ['doc_id' => $pendingDoc->doc_id]);
                return response()->json([
                    'success' => true,
                    'message' => 'Document uploaded successfully',
                    'document' => [
                        'id' => $pendingDoc->doc_id,
                        'doc_id' => $pendingDoc->doc_id,
                        'title' => $pendingDoc->title,
                        'file_path' => $pendingDoc->file_path,
                        'status' => $pendingDoc->status,
                    ]
                ]);
            }

            // Store the file using storage service
            $path = $this->storageService->storeUploadedFile($file, $request->folder_id);

            // Create document record with file hash
            $document = Document::create([
                'title' => $title,
                'file_path' => $path,
                'file_hash' => $fileHash,
                'folder_id' => $request->folder_id,
                'remarks' => $request->description,
                'status' => 'processing',
                'created_by' => auth()->id(),
            ]);

            Log::info('Document uploaded successfully', [
                'doc_id' => $document->doc_id,
                'title' => $document->title,
                'file_path' => $document->file_path,
            ]);

            // Dispatch background job for processing
            ProcessDocumentJob::dispatch(
                $document->doc_id, 
                $file->getMimeType(), 
                auth()->id()
            );

            Log::info('Document processing job dispatched', ['doc_id' => $document->doc_id]);

            return response()->json([
                'success' => true,
                'message' => 'Document uploaded and processing started',
                'document' => [
                    'id' => $document->doc_id,
                    'title' => $document->title,
                    'filename' => basename($document->file_path),
                    'status' => $document->status,
                    'created_at' => $document->created_at
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Handle scanner service uploads (public endpoint, no auth required)
     * This is specifically for the local scanner bridge service
     */
    public function scannerUpload(Request $request)
    {
        // Validate the uploaded file
        $request->validate([
            'file' => 'required|file|mimes:pdf,doc,docx,txt|max:51200',
        ]);

        try {
            set_time_limit(600); // 10 minutes for large PDF OCR processing

            $file = $request->file('file');
            $systemUserId = 1;

            // Compute file hash for content-based duplicate detection
            $fileHash = hash_file('sha256', $file->getRealPath());

            // Check if this exact file content already exists
            $existingDoc = Document::where('file_hash', $fileHash)
                ->where('status', 'active')
                ->first();

            if ($existingDoc) {
                Log::info('Scanner duplicate detected by file hash', [
                    'file_hash' => $fileHash,
                    'existing_doc_id' => $existingDoc->doc_id,
                ]);

                $folderName = $existingDoc->folder
                    ? $existingDoc->folder->folder_name
                    : 'No folder';

                return response()->json([
                    'success' => false,
                    'duplicate' => true,
                    'message' => 'This document already exists in the system.',
                    'existing_document' => [
                        'doc_id' => $existingDoc->doc_id,
                        'title' => $existingDoc->title,
                        'folder_name' => $folderName,
                        'folder_id' => $existingDoc->folder_id,
                    ]
                ], 409);
            }

            // Check for in-progress duplicates
            $pendingDoc = Document::where('file_hash', $fileHash)
                ->whereIn('status', ['processing', 'pending'])
                ->where('created_by', $systemUserId)
                ->first();

            if ($pendingDoc) {
                Log::info('Scanner upload in-progress duplicate detected', ['doc_id' => $pendingDoc->doc_id]);
                return response()->json([
                    'success' => true,
                    'message' => 'Document already exists and is processing',
                    'file' => [
                        'id' => $pendingDoc->doc_id,
                        'original_name' => basename($pendingDoc->file_path),
                        'title' => $pendingDoc->title,
                        'status' => $pendingDoc->status,
                        'created_at' => $pendingDoc->created_at
                    ]
                ]);
            }

            // Store the file using storage service (no folder specified for scanner uploads)
            $path = $this->storageService->storeUploadedFile($file, null);
            $originalFilename = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);

            $document = Document::create([
                'title' => $originalFilename,
                'file_path' => $path,
                'file_hash' => $fileHash,
                'folder_id' => null,
                'remarks' => 'Uploaded via scanner service',
                'status' => 'processing',
                'created_by' => $systemUserId,
            ]);

            Log::info('Scanner document uploaded successfully', [
                'doc_id' => $document->doc_id,
                'title' => $document->title,
                'file_path' => $document->file_path,
            ]);

            // Log scanner upload activity
            ActivityLogger::log(
                ActivityLogger::DOCUMENT_UPLOADED,
                $document,
                $systemUserId,
                'Document scanned and uploaded: ' . ActivityLogger::resolveTitle($document),
                ['source' => 'scanner']
            );

            // Dispatch background job for processing
            ProcessDocumentJob::dispatch(
                $document->doc_id, 
                $file->getMimeType(), 
                $systemUserId
            );

            Log::info('Scanner document processing job dispatched', ['doc_id' => $document->doc_id]);

            // Return response in format expected by scanner service
            return response()->json([
                'success' => true,
                'message' => 'Scanner document uploaded and processing started',
                'file' => [
                    'id' => $document->doc_id,
                    'original_name' => basename($document->file_path),
                    'title' => $document->title,
                    'status' => $document->status,
                    'created_at' => $document->created_at
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Scanner upload failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Scanner upload failed: ' . $e->getMessage()
            ], 500);
        }
    }

    /**

     * Get documents with filtering support
     */
    public function getDocuments(Request $request)
    {
        $documents = $this->queryService->getDocuments($request);
        return response()->json($documents);
    }

    /**
     * Get document counts
     */
    public function getDocumentCounts(Request $request)
    {
        try {
            $counts = $this->queryService->getDocumentCounts();
            return response()->json($counts);
        } catch (\Exception $e) {
            Log::error('Failed to get document counts', [
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document counts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get bulk folder document counts (optimized)
     */
    public function getBulkFolderCounts(Request $request)
    {
        $validated = $request->validate([
            'folder_ids' => 'required|array',
            'folder_ids.*' => 'integer|exists:folders,folder_id'
        ]);

        try {
            $result = $this->queryService->getBulkFolderCounts($validated['folder_ids']);
            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get folder counts',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single folder document count (optimized)
     */
    public function getFolderDocumentCount($folderId)
    {
        try {
            $count = $this->queryService->getFolderDocumentCount($folderId);
            return response()->json(['count' => $count]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to get folder document count',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Show AI processing page with latest uploaded document
     */
    public function aiProcessing(Request $request)
    {
        $latestDocument = $this->queryService->getLatestProcessingDocument(auth()->id());

        $documentData = [];

        if ($latestDocument) {
            $documentData = [
                'doc_id' => $latestDocument->doc_id,
                'fileName' => basename($latestDocument->file_path) ?: $latestDocument->title,
                'title' => $latestDocument->title,
                'createdAt' => $latestDocument->created_at->format('Y-m-d'),
                'createdBy' => $latestDocument->created_by,
                'filePath' => $latestDocument->file_path,
                'suggestedLocation' => $latestDocument->ai_suggested_folder, // Added missing field
            ];
        } else {
            $documentData = [
                'doc_id' => $request->query('docId', null),
                'fileName' => $request->query('fileName', 'No file selected'),
                'title' => $request->query('title', $request->query('fileName', 'No file selected')),
                'createdAt' => now()->format('Y-m-d'),
                'createdBy' => 'System AI',
            ];
        }

        return Inertia::render('Admin/Document/components/FileUpload/AIProcessing', [
            'documentData' => $documentData
        ]);
    }

    public function getAICategories()
    {
        return response()->json([
            'success' => true,
            'data' => []
        ]);
    }

    /**
     * Get folders for AI suggestions
     */
    public function getAIFolders()
    {
        try {
            $folders = \App\Models\Folder::select('folder_id', 'folder_name', 'folder_path', 'folder_type', 'created_by')
                ->orderBy('folder_name')
                ->get()
                ->toArray();

            return response()->json([
                'success' => true,
                'data' => $folders
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to get folders for AI', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'error' => 'Failed to retrieve folders',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store embeddings from AI Bridge Service
     */
    public function storeEmbeddings(Request $request)
    {
        try {
            $validated = $request->validate([
                'doc_id' => 'required|integer',
                'embeddings' => 'required|array',
                'total_chunks' => 'required|integer',
                'model_used' => 'required|string'
            ]);

            $totalStored = $this->queryService->storeEmbeddings(
                $validated['doc_id'],
                $validated['embeddings'],
                $validated['model_used']
            );

            return response()->json([
                'success' => true,
                'message' => 'Embeddings stored successfully',
                'total_stored' => $totalStored
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to store embeddings', [
                'error' => $e->getMessage(),
                'doc_id' => $request->get('doc_id')
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to store embeddings',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get document text for AI processing
     */
    public function getDocumentText($docId)
    {
        try {
            $document = Document::findOrFail($docId);
            $fullText = $this->storageService->getDocumentText($document);

            return response()->json([
                'success' => true,
                'data' => [
                    'text' => $fullText,
                    'length' => strlen($fullText),
                    'doc_id' => $docId
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get document text', [
                'error' => $e->getMessage(),
                'doc_id' => $docId
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to get document text',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get embeddings for a document
     */
    public function getEmbeddings($docId)
    {
        try {
            $result = $this->queryService->getEmbeddings($docId);
            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Failed to get embeddings', [
                'error' => $e->getMessage(),
                'doc_id' => $docId
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve embeddings',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all document embeddings for semantic search
     */
    public function getAllEmbeddings()
    {
        try {
            $result = $this->queryService->getAllEmbeddings();
            return response()->json($result);

        } catch (\Exception $e) {
            Log::error('Failed to get all embeddings', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to retrieve embeddings',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get single document by ID
     */
    public function show($id)
    {
        try {
            $document = $this->queryService->getDocument($id);

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'doc_id' => $document->doc_id,
                    'title' => $document->title,
                    'file_path' => $document->file_path,
                    'status' => $document->status,
                    'folder_id' => $document->folder_id,
                    'created_by' => $document->created_by,
                    'created_at' => $document->created_at,
                    'updated_at' => $document->updated_at,
                    'remarks' => $document->remarks,
                    'description' => $document->description,
                    'folder' => $document->folder,
                    'suggestedLocation' => $document->ai_suggested_folder, // Added missing field for AI suggestion
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching document', [
                'doc_id' => $id,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve document'
            ], 500);
        }
    }

    /**
     * Update document metadata (called by AI Bridge Service)
     */
    public function updateMetadata(Request $request, $id)
    {
        try {
            $document = Document::findOrFail($id);

            $validated = $request->validate([
                'title' => 'sometimes|string|max:255',
                'description' => 'sometimes|string|max:1000',
                'folder_id' => 'sometimes|integer|exists:folders,folder_id',
                'remarks' => 'sometimes|string|max:1000',
                'file_path' => 'sometimes|string|max:500',
            ]);

            $user = $request->user();
            if (!$user->can_edit && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'message' => 'You do not have permission to edit documents'
                ], 403);
            }

            $document->update($validated);

            // Log document metadata edit
            ActivityLogger::log(
                ActivityLogger::DOCUMENT_METADATA_UPDATED,
                $document,
                $user->user_id,
                'Document metadata updated: ' . ActivityLogger::resolveTitle($document),
                ['updated_fields' => array_keys($validated)]
            );

            Log::info('Document metadata updated by AI', [
                'doc_id' => $id,
                'updated_fields' => array_keys($validated),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document metadata updated successfully by AI',
                'document' => [
                    'doc_id' => $document->doc_id,
                    'title' => $document->title,
                    'folder_id' => $document->folder_id,
                    'status' => $document->status,
                    'remarks' => $document->remarks
                ]
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Document not found'
            ], 404);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error updating document metadata', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update document metadata'
            ], 500);
        }
    }

    /**
     * Get document content for viewing
     */
    public function getContent($id)
    {
        try {
            $document = Document::findOrFail($id);
            
            $user = auth()->user();
            if (!$user->can_view && $user->role !== 'admin') {
                return response()->json([
                    'success' => false,
                    'error' => 'You do not have permission to view documents'
                ], 403);
            }

            $fileInfo = $this->storageService->getDocumentContent($document);
            return $this->storageService->getFileResponse($document, $fileInfo);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Document not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error getting document content', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to load document content: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Stream document content as base64 to bypass ad blockers
     */
    public function streamContent($id)
    {
        try {
            $document = Document::findOrFail($id);
            $result = $this->storageService->streamContent($document);
            return response()->json($result);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'Document not found'
            ], 404);

        } catch (\Exception $e) {
            Log::error('Error streaming document content', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to load document content: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Log document download activity
     */
    public function logDownload(Request $request, $id)
    {
        try {
            $user = $request->user('sanctum') ?? $request->user();

            if (!$user) {
                return response()->json(['success' => false, 'error' => 'Unauthorized'], 401);
            }

            $document = Document::find($id);

            if (!$document) {
                return response()->json(['success' => false, 'error' => 'Document not found'], 404);
            }

            ActivityLogger::log(
                ActivityLogger::DOCUMENT_DOWNLOADED,
                $document,
                $user->user_id,
                'Downloaded document: ' . ActivityLogger::resolveTitle($document)
            );

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            Log::error('Download logging failed: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Delete a document (soft delete)
     */
    public function destroy($docId)
    {
        try {
            $document = Document::where('doc_id', $docId)->first();

            if (!$document) {
                return response()->json([
                    'success' => false,
                    'message' => 'Document not found'
                ], 404);
            }

            $user = auth()->user();
            
            // Allow deletion if user has permission OR if it's their own document in 'processing', 'failed', or 'ready' state
            // This allows staff to "Cancel" an upload in progress or after AI analysis
            $isOwner = (int)$document->created_by === (int)($user->user_id ?? $user->id ?? 0);
            $isDeletableStatus = in_array($document->status, ['processing', 'failed', 'ready']);
            
            // Allow active documents to be deleted by owner if created recently (e.g. user cancels upload after processing)
            if ($document->status === 'active' && $document->created_at->diffInHours(now()) < 24) {
                $isDeletableStatus = true;
            }
            
            if (!$user->can_delete && $user->role !== 'admin') {
                // If they don't have global delete permission, check if it's their own draft/failed upload/ready for review
                if (!($isOwner && $isDeletableStatus)) {
                    return response()->json([
                        'success' => false,
                        'message' => 'You do not have permission to delete documents'
                    ], 403);
                }
            }

            // Log the activity BEFORE deleting
            ActivityLogger::log(
                ActivityLogger::DOCUMENT_DELETED,
                $document,
                auth()->id(),
                'Document deleted: ' . ActivityLogger::resolveTitle($document)
            );

            // Delete physical file and embeddings
            $this->storageService->deleteDocument($document);

            // Delete the document record
            $document->delete();

            Log::info('Document deleted successfully', [
                'doc_id' => $docId,
                'title' => $document->title,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Document deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Document deletion failed', [
                'doc_id' => $docId,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete document',
                'error' => $e->getMessage()
            ], 500);
        }
    }


    /**
     * Bulk delete documents
     */
    public function bulkDelete(Request $request)
    {
        try {
            $request->validate([
                'document_ids' => 'required|array',
                'document_ids.*' => 'integer|exists:documents,doc_id'
            ]);

            $documentIds = $request->document_ids;
            $deletedCount = 0;

            foreach ($documentIds as $docId) {
                $document = Document::find($docId);
                if ($document) {
                    // Log before deletion
                    ActivityLogger::log(
                        ActivityLogger::DOCUMENT_DELETED,
                        $document,
                        auth()->id(),
                        'Document deleted (bulk): ' . ActivityLogger::resolveTitle($document)
                    );

                    // Delete file and embeddings
                    $this->storageService->deleteDocument($document);

                    // Delete document record
                    $document->delete();
                    $deletedCount++;
                }
            }

            return response()->json([
                'success' => true,
                'message' => "{$deletedCount} documents deleted successfully",
                'deleted_count' => $deletedCount
            ]);
        } catch (\Exception $e) {
            Log::error('Failed to bulk delete documents', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to delete documents',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Download document file
     */
    public function download($id)
    {
        try {
            $document = Document::findOrFail($id);
            
            // Check permissions
            $user = auth()->user() ?? request()->user('sanctum');
            if (!$user || (!$user->can_view && $user->role !== 'admin')) {
                return response()->json([
                    'success' => false,
                    'error' => 'You do not have permission to download documents'
                ], 403);
            }

            if (!Storage::disk('documents')->exists($document->file_path)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Document file not found'
                ], 404);
            }

            // Log the download activity
            ActivityLogger::log(
                ActivityLogger::DOCUMENT_DOWNLOADED,
                $document,
                $user->user_id,
                'Downloaded document: ' . ActivityLogger::resolveTitle($document)
            );

            $fullPath = Storage::disk('documents')->path($document->file_path);
            $extension = pathinfo($document->file_path, PATHINFO_EXTENSION);
            $fileName = $document->title;
            
            // Add extension if not present in title
            if (!str_ends_with(strtolower($fileName), '.' . strtolower($extension))) {
                $fileName .= '.' . $extension;
            }

            return response()->download($fullPath, $fileName);

        } catch (\Exception $e) {
            Log::error('Error downloading document', [
                'doc_id' => $id,
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Failed to download document: ' . $e->getMessage()
            ], 500);
        }
    }
}
