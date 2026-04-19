<?php
use App\Http\Controllers\FolderController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\UploadController;
use App\Http\Controllers\AIAssistantController;
use App\Http\Controllers\AIProcessController;
use App\Http\Controllers\ManualProcessController;

/*
|--------------------------------------------------------------------------|
| API Routes                                                                |
|--------------------------------------------------------------------------|
*/

// Public routes
Route::post('/login', [LoginController::class, 'login']);

// Health check route (public)
Route::get('/ai/health', function () {
    try {
        $response = Http::timeout(5)->get('http://localhost:5000/health');
        return response()->json([
            'laravel' => 'healthy',
            'ai_service' => $response->successful() ? 'healthy' : 'unavailable',
            'ai_service_response' => $response->json()
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'laravel' => 'healthy', 
            'ai_service' => 'unavailable',
            'error' => $e->getMessage()
        ], 503);
    }
});

// Public AI helper routes (for Flask AI Bridge Service)
Route::get('/ai/categories/public', [DocumentController::class, 'getAICategories']);
Route::get('/ai/folders/public', [DocumentController::class, 'getAIFolders']);
Route::get('/document-embeddings/all', [DocumentController::class, 'getAllEmbeddings']); // Public endpoint for semantic search

// Public scanner upload endpoint (for local scanner service)
Route::post('/scanner/upload', [DocumentController::class, 'scannerUpload']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    // Folder routes - specific routes BEFORE apiResource
    Route::get('folders/search/{term}', [FolderController::class, 'search']);
    Route::get('folders/recent/{limit?}', [FolderController::class, 'recent']);
    Route::get('folders/tree', [FolderController::class, 'tree']);
    Route::get('folders/paginated', [FolderController::class, 'getPaginatedFolders']);
    Route::get('folders/{parentId}/subfolders', [FolderController::class, 'getSubfolders']);
    Route::apiResource('folders', FolderController::class);

    // Upload and category routes
    Route::post('/upload', [DocumentController::class, 'store']);
    Route::get('/categories', [CategoryController::class, 'index']);

    // Document routes - IMPORTANT: Specific routes MUST come before wildcard {id} routes
    Route::get('/documents', [DocumentController::class, 'getDocuments']);
    Route::get('/documents/counts', [DocumentController::class, 'getDocumentCounts']);
    Route::get('/counts', [DocumentController::class, 'getDocumentCounts']); // Alias for frontend compatibility

    // Optimized folder document count routes
    Route::post('/documents/folders/bulk-counts', [DocumentController::class, 'getBulkFolderCounts']);
    Route::get('/documents/folder/{folderId}/count', [DocumentController::class, 'getFolderDocumentCount']);

    // Bulk document operations
    Route::post('/documents/bulk-delete', [DocumentController::class, 'bulkDelete']);

    // Manual Processing routes
    Route::get('/manual-process/folders', [ManualProcessController::class, 'getFolders']);
    Route::post('/manual-process/update', [ManualProcessController::class, 'updateDocument']);

    // Document routes with {id} parameter - MUST come after all specific document routes
    Route::get('/documents/{id}/content', [DocumentController::class, 'getContent']); // Get document content for viewing
    Route::get('/documents/{id}/text', [DocumentController::class, 'getDocumentText']); // Get document text for AI processing
    Route::get('/documents/{id}/download', [DocumentController::class, 'download']); // Download document
    Route::put('/documents/{id}/metadata', [DocumentController::class, 'updateMetadata']); // Update document metadata (AI)
    Route::post('/documents/{id}/log-download', [DocumentController::class, 'logDownload']); // Log download activity
    Route::delete('/documents/{id}', [DocumentController::class, 'destroy']); // Delete document
    Route::get('/documents/{id}', [DocumentController::class, 'show']); // Get single document - MUST be last

    Route::get('/doc/{id}/view', [DocumentController::class, 'getContent']); // Alternative endpoint to avoid ad blockers
    Route::post('/files/stream/{id}', [DocumentController::class, 'streamContent']); // Stream content as base64 to bypass ad blockers

    // Document embedding routes
    Route::post('/document-embeddings/store', [DocumentController::class, 'storeEmbeddings']); // Store embeddings
    Route::get('/document-embeddings/{docId}', [DocumentController::class, 'getEmbeddings']); // Get embeddings

    // AI Processing helper routes - get categories and folders for AI suggestions
    Route::get('/ai/categories', [DocumentController::class, 'getAICategories']); // Get categories for AI
    Route::get('/ai/folders', [DocumentController::class, 'getAIFolders']); // Get folders for AI

    // AI Processing route (legacy)
    Route::post('/documents/process-ai', [AIProcessController::class, 'processWithAI']); // Process document with AI

    // Keep legacy routes for backward compatibility
    Route::post('/documents/save', [ManualProcessController::class, 'saveDocument']); // Manual document save
    Route::post('/documents/update', [ManualProcessController::class, 'updateDocument']); // Update uploaded document

    // Auth routes
    Route::post('/logout', [LogoutController::class, 'logout']);
    
    // User permission status endpoint (for real-time updates)
    Route::get('/user/status', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'permissions' => [
                'can_edit' => $user->can_edit,
                'can_delete' => $user->can_delete,
                'can_upload' => $user->can_upload,
                'can_view' => $user->can_view,
            ],
            'unread_notifications' => \App\Models\Notification::where('user_id', $user->user_id)
                ->where('is_read', false)
                ->count(),
        ]);
    });
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    // User profile route
    Route::get('/user/profile', [App\Http\Controllers\AdminController::class, 'getUserProfile']);

    // User list for filters (activity log export)
    Route::get('/users/list', function () {
        return \App\Models\User::select('user_id', 'firstname', 'lastname', 'role')
            ->where('status', 'active')
            ->orderBy('role')
            ->orderBy('firstname')
            ->get();
    });


    // AI Assistant routes (moved inside auth middleware)
    Route::prefix('ai')->group(function () {
        Route::post('/send-message', [AIAssistantController::class, 'sendMessage']);
        Route::get('/conversations', [AIAssistantController::class, 'getConversations']);
        Route::get('/chat-history/{sessionId}', [AIAssistantController::class, 'getChatHistory']);
        Route::delete('/conversations/{conversationId}', [AIAssistantController::class, 'deleteConversation']);
        Route::post('/conversations/{conversationId}/star', [AIAssistantController::class, 'starConversation']);
        Route::post('/conversations/{conversationId}/unstar', [AIAssistantController::class, 'unstarConversation']);
    });
});