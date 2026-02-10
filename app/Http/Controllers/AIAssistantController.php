<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\AIConversation;
use App\Models\AIHistory;
use App\Models\Document;
use App\Models\DocumentEmbedding;
use App\Services\GroqService;

class AIAssistantController extends Controller
{
    private $aiServiceUrl;
    private $aiBridgeUrl;
    private $aiServiceType;
    private GroqService $groqService;
    private $stopWords;
    private $folderAliases;

    public function __construct(GroqService $groqService)
    {
        $this->aiServiceUrl = env('AI_SERVICE_URL', 'http://localhost:5000');
        $this->aiBridgeUrl = env('AI_BRIDGE_URL', 'http://localhost:5003');
        $this->aiServiceType = env('AI_SERVICE_TYPE', 'local');
        $this->groqService = $groqService;

        $this->folderAliases = [
            'MOA' => ['Mode of Agreement', 'Memorandum of Agreement'],
        ];
        
        $this->stopWords = [
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 
            'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 
            'will', 'would', 'could', 'should', 'can', 'may', 'might', 'this', 'that', 'these', 'those', 
            'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 
            'how', 'get', 'me', 'give', 'show', 'find', 'document', 'documents', 'file', 'files', 'about',
            'tell', 'ask', 'say', 'look', 'search', 'find', 'please', 'thanks', 'thank', 'hi', 'hello', 'hey',
            'many', 'count', 'list', 'total', 'all', 'every', 'check', 'view', 'see', 'folder', 'folders'
        ];
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
            'document_ids' => 'nullable|array',
            'document_ids.*' => 'integer|exists:documents,doc_id',
            'conversation_id' => [
                'nullable',
                function ($attribute, $value, $fail) {
                    if ($value !== null) {
                        if (is_string($value) && !is_numeric($value)) {
                            return;
                        }

                        if (!AIConversation::where('conversation_id', $value)
                            ->where('user_id', Auth::id())
                            ->exists()) {
                            $fail('The selected conversation is invalid.');
                        }
                    }
                },
            ],
        ]);

        try {
            // Increase execution time limit for document processing
            set_time_limit(300); // 5 minutes

            $userId = Auth::id();
            $conversationId = $request->conversation_id;

            Log::info('AI Chat Request', [
                'user_id' => $userId,
                'conversation_id' => $conversationId,
                'message_length' => strlen($request->message),
                'ai_service_url' => $this->aiServiceUrl
            ]);

            // Handle special conversation IDs
            if ($conversationId && !is_numeric($conversationId)) {
                if (str_starts_with($conversationId, 'starred-')) {
                    $conversation = AIConversation::create([
                        'user_id' => $userId,
                        'started_at' => now(),
                    ]);
                    $conversationId = $conversation->conversation_id;
                }
            }

            // Create new conversation if none provided
            if (!$conversationId) {
                $conversation = AIConversation::create([
                    'user_id' => $userId,
                    'started_at' => now(),
                ]);
                $conversationId = $conversation->conversation_id;
                
                Log::info('Created new conversation', ['conversation_id' => $conversationId]);
            } else {
                if (is_numeric($conversationId)) {
                    $conversation = AIConversation::where('conversation_id', $conversationId)
                        ->where('user_id', $userId)
                        ->firstOrFail();
                }
            }



            $documentContext = ''; // Initialize context

            // DOCUMENT SCOPING: If the user explicitly selected documents, use ONLY those.
            // Skip all other document discovery (metadata search, semantic search, conversation carryover).
            $hasExplicitDocuments = !empty($request->document_ids);

            if ($hasExplicitDocuments) {
                Log::info('Explicit document selection detected — skipping search/carryover', [
                    'document_ids' => $request->document_ids
                ]);
            }

            $detectedFolder = null;
            $folderConstraintId = null;
            $dateParams = [];
            $metadataResults = [];
            $semanticResults = [];

            if (!$hasExplicitDocuments) {
                // Detect folder context globally for the request
                $detectedFolder = $this->detectFolder($request->message);
                $folderConstraintId = $detectedFolder['id'] ?? null;
                if ($folderConstraintId) {
                    Log::info('Global folder constraint detected', ['folder_id' => $folderConstraintId, 'name' => $detectedFolder['name']]);
                }
                
                // Extract date parameters (years) first
                $dateParams = $this->extractDateParams($request->message);

                // Perform metadata search (fast SQL search on title/description)
                $metadataResults = $this->searchDocumentsMetadata($request->message, $userId, $dateParams);

                // Perform semantic search if query contains names or specific search terms
                $semanticResults = $this->performSemanticSearch($request->message, $userId);
            }

            // Collect all relevant document IDs
            $allDocumentIds = $request->document_ids ?? [];
            
            // Add IDs from search results (only when no explicit documents are selected)
            if (!$hasExplicitDocuments && !empty($metadataResults['documents'])) {
                foreach ($metadataResults['documents'] as $doc) {
                    $allDocumentIds[] = $doc['doc_id'];
                }
            }

            // NEW: Get Analytics Stats if requested
            $analyticsContext = $this->getAnalyticsStats($request->message, $userId);
            if (!empty($analyticsContext)) {
                $documentContext .= "\n\n" . $analyticsContext;
                Log::info('Analytics stats added to context');
            }

            // NEW: List all folders/categories context if requested
            $folderListContext = $this->getAllFoldersContext($request->message);
            if (!empty($folderListContext)) {
                $documentContext .= "\n\n" . $folderListContext;
                Log::info('Folder list context added');
            }

            // Carry over documents from the previous message in this conversation
            // This allows the user to say "compare it" referring to documents found in the previous turn
            // BUT NOT when the user has explicitly selected documents (those override everything)
            if (!$hasExplicitDocuments && $conversationId) {
                $lastHistory = AIHistory::where('conversation_id', $conversationId)
                    ->where('user_id', $userId)
                    ->orderBy('created_at', 'desc')
                    ->first();

                if ($lastHistory && $lastHistory->document_references) {
                    $prevDocs = json_decode($lastHistory->document_references, true);
                    if (is_array($prevDocs)) {
                        foreach ($prevDocs as $prevDoc) {
                            if (isset($prevDoc['doc_id'])) {
                                $allDocumentIds[] = $prevDoc['doc_id'];
                            }
                        }
                    }
                }
            }

            // VALIDATION: If user asks to compare but no documents are selected or found
            if (empty($allDocumentIds) && preg_match('/\b(compare|comparison|diff|versus|vs|contrast)\b/i', $request->message)) {
                // Create conversation if needed so we can return a session_id
                return response()->json([
                    'id' => time(),
                    'content' => 'I\'d be happy to compare documents for you! However, no documents are currently selected. Please use the 📎 attachment icon to select the documents you want me to compare, then ask again.',
                    'session_id' => $conversationId,
                    'type' => 'ai',
                    'timestamp' => now()->toISOString(),
                    'documents' => [],
                    'more_documents_count' => 0,
                    'auto_open_doc_id' => null,
                ]);
            }

            $allDocumentIds = array_unique($allDocumentIds);

            // Retrieve document context if we have any relevant documents
            // Use higher limits for Groq API
            // $documentContext initialized above
            $useGroqLimits = $this->aiServiceType === 'groq';
            
            if (count($allDocumentIds) > 0) {
                Log::info('Retrieving context for documents', [
                    'count' => count($allDocumentIds),
                    'ids' => array_values($allDocumentIds)
                ]);
                
                $retrievedDocs = $this->retrieveDocumentContext($allDocumentIds, $userId, $useGroqLimits);
                if (!empty($retrievedDocs)) {
                    $documentContext .= "\n\n" . $retrievedDocs;
                }

                Log::info('Document context retrieved', [
                    'document_count' => count($allDocumentIds),
                    'context_length' => strlen($documentContext),
                    'using_groq_limits' => $useGroqLimits
                ]);
            }



            // Add metadata search results to document context if found (only when no explicit docs)
            if (!$hasExplicitDocuments && !empty($metadataResults) && !empty($metadataResults['context'])) {
                $documentContext .= "\n\n" . $metadataResults['context'];
                Log::info('Metadata search results added to context', [
                    'documents_found' => $metadataResults['count'] ?? 0
                ]);
            }

            // Add semantic search results to document context if found (only when no explicit docs)
            if (!$hasExplicitDocuments && !empty($semanticResults) && !empty($semanticResults['results'])) {
                $documentContext .= "\n\n" . $semanticResults['context'];
                Log::info('Semantic search results added to context', [
                    'chunks_found' => count($semanticResults['results'])
                ]);
            }

            // Generate AI response with automatic fallback
            // Try Groq first if configured, fall back to local if it fails
            $aiResponse = null;
            $primaryService = $this->aiServiceType;

            try {
                if ($primaryService === 'groq') {
                    Log::info('Attempting Groq API for chat...');
                    $aiResponse = $this->callGroqAPI($request->message, $conversationId, $documentContext);
                } else {
                    Log::info('Attempting local AI service...');
                    $aiResponse = $this->callLocalAIService($request->message, $conversationId, $documentContext);
                }
            } catch (\Exception $e) {
                Log::warning("Primary AI service ({$primaryService}) failed: " . $e->getMessage());

                // Automatic fallback to alternative service
                try {
                    if ($primaryService === 'groq') {
                        Log::info('Groq failed, falling back to local AI service...');
                        $aiResponse = $this->callLocalAIService($request->message, $conversationId, $documentContext);
                    } else {
                        Log::info('Local AI failed, falling back to Groq API...');
                        $aiResponse = $this->callGroqAPI($request->message, $conversationId, $documentContext);
                    }
                } catch (\Exception $fallbackError) {
                    Log::error('Both AI services failed', [
                        'primary_error' => $e->getMessage(),
                        'fallback_error' => $fallbackError->getMessage()
                    ]);
                    throw new \Exception('All AI services are currently unavailable. Please ensure either the local AI server is running or you have internet connection for Groq API.');
                }
            }

            Log::info('AI response generated successfully', [
                'response_length' => strlen($aiResponse)
            ]);

            // Get document metadata for response if documents were provided OR found via search
            $allRefs = collect([]);

            // 1. Manually attached documents
            if ($request->document_ids && count($request->document_ids) > 0) {
                $documents = Document::whereIn('doc_id', $request->document_ids)
                    ->with('folder:folder_id,folder_name')
                    ->get(['doc_id', 'title', 'folder_id']);

                $manualRefs = $documents->map(function($doc) {
                    return [
                        'doc_id' => $doc->doc_id,
                        'title' => $doc->title,
                        'folder_id' => $doc->folder_id,
                        'folder_name' => $doc->folder ? $doc->folder->folder_name : null,
                    ];
                });
                $allRefs = $allRefs->merge($manualRefs);
            }
            

            
            // 3. Metadata Search Results (only when no explicit document selection)
            if (!$hasExplicitDocuments && !empty($metadataResults) && !empty($metadataResults['documents'])) {
                $allRefs = $allRefs->merge($metadataResults['documents']);
            }
            
            // 4. Semantic Search Results (only when no explicit document selection)
            if (!$hasExplicitDocuments && !empty($semanticResults) && !empty($semanticResults['documents'])) {
                $semanticRefs = [];
                foreach ($semanticResults['documents'] as $semanticDoc) {
                    $doc = Document::with('folder:folder_id,folder_name')
                        ->find($semanticDoc['doc_id']);

                    if ($doc) {
                        // CRITICAL FIX: Enforce folder constraint
                        // If a global folder constraint was detected (e.g. "MOA"), 
                        // exclude any semantic results that are NOT in that folder.
                        if ($folderConstraintId && $doc->folder_id !== $folderConstraintId) {
                            Log::info('Filtered out relevant document due to folder constraint', [
                                'doc_id' => $doc->doc_id,
                                'doc_folder' => $doc->folder_id,
                                'constraint_folder' => $folderConstraintId
                            ]);
                            continue;
                        }

                        $semanticRefs[] = [
                            'doc_id' => $doc->doc_id,
                            'title' => $doc->title,
                            'folder_id' => $doc->folder_id,
                            'folder_name' => $doc->folder ? $doc->folder->folder_name : null,
                            'matches' => $semanticDoc['matches'] ?? 1
                        ];
                    }
                }
                $allRefs = $allRefs->merge($semanticRefs);
            }

            // Deduplicate by doc_id and convert to array
            $documentReferences = $allRefs->unique('doc_id')->values()->toArray();

            // Detect "open document" command - should auto-open the viewer
            $isOpenCommand = preg_match('/\b(open|view|display|show me)\b.*(document|file|it|this|that|pdf)/i', $request->message) ||
                             preg_match('/\b(open|view|display)\b.*\b(it|this|that)\b/i', $request->message) ||
                             preg_match('/^(open|view)\s+(the\s+)?(document|file|pdf)/i', $request->message);
            
            Log::info('Open command detection', [
                'message' => $request->message,
                'isOpenCommand' => $isOpenCommand,
                'document_refs_count' => count($documentReferences),
                'all_doc_ids_count' => count($allDocumentIds)
            ]);
            
            // If it's an open command and we have documents (from references or session), set auto_open
            $autoOpenDocId = null;
            if ($isOpenCommand) {
                // Prioritize: use document references first, then fall back to all document IDs
                if (count($documentReferences) > 0) {
                    $autoOpenDocId = $documentReferences[0]['doc_id'];
                } elseif (count($allDocumentIds) > 0) {
                    $autoOpenDocId = $allDocumentIds[0];
                }
                
                if ($autoOpenDocId) {
                    Log::info('Auto-open document triggered', ['doc_id' => $autoOpenDocId]);
                }
            }

            // Save chat history to database
            $timestamp = now();
            AIHistory::create([
                'conversation_id' => $conversationId,
                'user_id' => $userId,
                'doc_id' => null,
                'question' => $request->message,
                'answer' => $aiResponse,
                'status' => 'completed',
                'document_references' => !empty($documentReferences) ? json_encode($documentReferences) : null,
                'created_at' => $timestamp,
            ]);

            // Limit referenced documents to 5 and calculate remainder
            $totalReferences = count($documentReferences);
            $limit = 5;
            $moreDocumentsCount = max(0, $totalReferences - $limit);
            
            // Slice the array if needed (preserving keys not strictly necessary as it returns array of objects, but values() ensures indexed array)
            if ($totalReferences > $limit) {
                $documentReferences = array_slice($documentReferences, 0, $limit);
            }

            return response()->json([
                'id' => time(),
                'content' => $aiResponse,
                'session_id' => $conversationId,
                'type' => 'ai',
                'timestamp' => $timestamp->toISOString(),
                'documents' => $documentReferences,
                'more_documents_count' => $moreDocumentsCount,
                'auto_open_doc_id' => $autoOpenDocId,
            ]);

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('AI service connection failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'service_url' => $this->aiServiceUrl
            ]);
            
            return response()->json([
                'error' => 'Cannot connect to AI service. Please ensure the AI server is running.',
                'details' => 'Connection timeout or refused'
            ], 503);
            
        } catch (\Illuminate\Http\Client\RequestException $e) {
            Log::error('AI service request failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id()
            ]);
            
            return response()->json([
                'error' => 'AI service request failed',
                'details' => $e->getMessage()
            ], 500);
            
        } catch (\Exception $e) {
            // DEBUG: Write to a separate log file
            file_put_contents(storage_path('logs/ai_debug.log'), date('Y-m-d H:i:s') . " ERROR: " . $e->getMessage() . "\n" . $e->getTraceAsString() . "\n----------------\n", FILE_APPEND);

            Log::error('Chat failed', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to process message: ' . $e->getMessage(),
                'details' => 'Internal server error'
            ], 500);
        }
    }

    public function index()
    {
        $conversations = AIConversation::where('user_id', Auth::id())
            ->orderBy('started_at', 'desc')
            ->limit(20)
            ->get();

        return Inertia::render('Admin/Aiassistant/index', [
            'conversations' => $conversations,
        ]);
    }

    public function getConversations()
    {
        // Only get conversations that have actual chat history
        $conversationIds = AIHistory::where('user_id', Auth::id())
            ->distinct()
            ->pluck('conversation_id')
            ->toArray();

        if (empty($conversationIds)) {
            return response()->json([]);
        }

        // Get all first and last messages in one query to avoid N+1
        $firstMessages = AIHistory::where('user_id', Auth::id())
            ->whereIn('conversation_id', $conversationIds)
            ->select('conversation_id', 'question', 'created_at')
            ->orderBy('created_at', 'asc')
            ->get()
            ->groupBy('conversation_id')
            ->map(fn($group) => $group->first());

        $lastMessages = AIHistory::where('user_id', Auth::id())
            ->whereIn('conversation_id', $conversationIds)
            ->select('conversation_id', 'answer', 'created_at')
            ->orderBy('created_at', 'desc')
            ->get()
            ->groupBy('conversation_id')
            ->map(fn($group) => $group->first());

        $conversations = AIConversation::whereIn('conversation_id', $conversationIds)
            ->where('user_id', Auth::id())
            ->orderBy('started_at', 'desc')
            ->get()
            ->map(function($conv) use ($firstMessages, $lastMessages) {
                $firstHistory = $firstMessages->get($conv->conversation_id);
                $lastHistory = $lastMessages->get($conv->conversation_id);

                // Create a meaningful title from the first question (truncate if too long)
                $title = $firstHistory
                    ? (strlen($firstHistory->question) > 50
                        ? substr($firstHistory->question, 0, 50) . '...'
                        : $firstHistory->question)
                    : 'Chat ' . $conv->conversation_id;

                // Get last message preview
                $lastMessage = $lastHistory
                    ? (strlen($lastHistory->answer) > 60
                        ? substr($lastHistory->answer, 0, 60) . '...'
                        : $lastHistory->answer)
                    : null;

                return [
                    'id' => (string)$conv->conversation_id,
                    'title' => $title,
                    'lastMessage' => $lastMessage,
                    'created_at' => $conv->started_at,
                    'updated_at' => $conv->started_at,
                    'starred' => (bool)$conv->starred,
                ];
            });

        return response()->json($conversations);
    }

    public function getChatHistory($sessionId)
    {
        try {
            if (is_numeric($sessionId)) {
                AIConversation::where('conversation_id', $sessionId)
                    ->where('user_id', Auth::id())
                    ->firstOrFail();
            }

            // Get chat history from ai_histories table
            $history = AIHistory::where('conversation_id', $sessionId)
                ->where('user_id', Auth::id())
                ->orderBy('created_at', 'asc')
                ->get();

            // Format messages for frontend
            $messages = [];
            foreach ($history as $item) {
                // Add user message
                $messages[] = [
                    'id' => $item->ai_history_id * 2 - 1,
                    'type' => 'user',
                    'content' => $item->question,
                    'timestamp' => $item->created_at->toISOString(),
                ];

                // Add AI response
                $aiMessage = [
                    'id' => $item->ai_history_id * 2,
                    'type' => 'ai',
                    'content' => $item->answer,
                    'timestamp' => $item->created_at->toISOString(),
                ];

                // Add document references if they exist
                if ($item->document_references) {
                    $aiMessage['documents'] = json_decode($item->document_references, true);
                }

                $messages[] = $aiMessage;
            }

            return response()->json($messages);

        } catch (\Exception $e) {
            Log::error('Get chat history failed', [
                'session_id' => $sessionId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Conversation not found'], 404);
        }
    }

    public function deleteConversation($conversationId)
    {
        try {
            $deleted = AIConversation::where('conversation_id', $conversationId)
                ->where('user_id', Auth::id())
                ->delete();

            if (!$deleted) {
                return response()->json(['error' => 'Conversation not found'], 404);
            }

            // Delete related chat history to prevent orphaned records
            AIHistory::where('conversation_id', $conversationId)
                ->where('user_id', Auth::id())
                ->delete();

            return response()->json(['message' => 'Conversation deleted']);
        } catch (\Exception $e) {
            Log::error('Delete conversation failed', [
                'conversation_id' => $conversationId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Delete failed'], 500);
        }
    }

    public function starConversation($conversationId)
    {
        try {
            $conversation = AIConversation::where('conversation_id', $conversationId)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $conversation->starred = true;
            $conversation->save();

            return response()->json(['message' => 'Conversation starred']);
        } catch (\Exception $e) {
            Log::error('Star conversation failed', [
                'conversation_id' => $conversationId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to star conversation'], 500);
        }
    }

    public function unstarConversation($conversationId)
    {
        try {
            $conversation = AIConversation::where('conversation_id', $conversationId)
                ->where('user_id', Auth::id())
                ->firstOrFail();

            $conversation->starred = false;
            $conversation->save();

            return response()->json(['message' => 'Conversation unstarred']);
        } catch (\Exception $e) {
            Log::error('Unstar conversation failed', [
                'conversation_id' => $conversationId,
                'user_id' => Auth::id(),
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Failed to unstar conversation'], 500);
        }
    }

    /**
     * Retrieve document context from embeddings for the given document IDs
     */
    /**
     * Retrieve document context from embeddings for the given document IDs
     */
    private function retrieveDocumentContext(array $documentIds, int $userId, bool $useGroqLimits = false): string
    {
        try {
            // Allow all users to access all active documents
            $accessibleDocuments = Document::whereIn('doc_id', $documentIds)
                ->where('status', 'active')
                ->pluck('doc_id')
                ->toArray();

            if (empty($accessibleDocuments)) {
                Log::warning('No accessible documents found', [
                    'user_id' => $userId,
                    'requested_docs' => $documentIds
                ]);
                return '';
            }

            // Get document embeddings/chunks for accessible documents
            // We fetch ALL chunks first, then select them in a round-robin fashion
            $embeddings = DocumentEmbedding::whereIn('doc_id', $accessibleDocuments)
                ->with(['document:doc_id,title,folder_id', 'document.folder:folder_id,folder_name'])
                ->orderBy('doc_id')
                ->orderBy('chunk_index')
                ->get();

            if ($embeddings->isEmpty()) {
                Log::warning('No embeddings found for documents', [
                    'document_ids' => $accessibleDocuments
                ]);
                return '';
            }

            // Group embeddings by document ID
            $groupedEmbeddings = $embeddings->groupBy('doc_id');
            $docIds = $groupedEmbeddings->keys()->toArray();
            
            // Round Robin Selection
            // Create a flat list interleaving chunks: DocA-1, DocB-1, DocA-2, DocB-2...
            $interleavedEmbeddings = [];
            $maxChunksPerDoc = $embeddings->count(); // Upper bound
            
            for ($i = 0; $i < $maxChunksPerDoc; $i++) {
                $addedAny = false;
                foreach ($docIds as $docId) {
                    if (isset($groupedEmbeddings[$docId][$i])) {
                        $interleavedEmbeddings[] = $groupedEmbeddings[$docId][$i];
                        $addedAny = true;
                    }
                }
                if (!$addedAny) break;
            }

            // Build document context
            $context = "The user has attached documents to this conversation. Below is the extracted content from their attached documents that you should use to answer their questions:\n\n";

            $chunkCount = 0;

            // Use moderate limits for Groq to avoid rate limits on free tier (12K tokens/min)
            // Groq: ~8K chars ≈ 2K tokens, leaving room for prompt + response (est. 4 chars/token)
            // Local: 15 chunks, 6000 chars for comparison queries
            $maxChunks = $useGroqLimits ? 12 : 15;
            $maxContextLength = $useGroqLimits ? 8000 : 6000;
            
            // Variable to track which documents we've already added a header for in the current block
            // Since we're interleaving, we might switch back and forth.
            // A better approach for the LLM is to group by document in the FINAL output, 
            // OR strictly label each chunk. 
            // Labeling each chunk is safer for "Compare these" queries so the LLM knows which doc is which.
            
            foreach ($interleavedEmbeddings as $embedding) {
                if ($chunkCount >= $maxChunks) {
                    break;
                }

                $docTitle = $embedding->document?->title ?? 'Document ' . $embedding->doc_id;
                $folderName = $embedding->document?->folder?->folder_name ?? 'Uncategorized';
                
                // Content with clear attribution and folder context
                $chunkContent = "--- Excerpt from Document: \"{$docTitle}\" (Folder: {$folderName}) ---\n{$embedding->chunk_text}\n";

                // Check if adding this chunk would exceed our length limit
                if (strlen($context . $chunkContent) > $maxContextLength) {
                    break;
                }

                $context .= $chunkContent . "\n";
                $chunkCount++;
            }

            $context .= "\n--- End of Attached Document Content ---\n\n";
            $context .= "IMPORTANT: The content above is from the user's attached documents. When the user compares documents, refers to 'this document', 'the attached file', or asks you to summarize/analyze documents, they are referring to the content provided above. You have access to this document content and should answer based on it.";

            Log::info('Document context built (Round Robin)', [
                'total_chunks' => $chunkCount,
                'documents_count' => count($docIds),
                'context_length' => strlen($context)
            ]);

            return $context;

        } catch (\Exception $e) {
            Log::error('Failed to retrieve document context', [
                'error' => $e->getMessage(),
                'document_ids' => $documentIds,
                'user_id' => $userId
            ]);
            return '';
        }
    }



    /**
     * Build folder path string for a folder
     */
    private function buildFolderPath($folder): string
    {
        if (!$folder) {
            return 'Root Folder';
        }

        $path = [$folder->folder_name];
        $current = $folder;

        // Traverse up the folder hierarchy (limit to 10 levels to prevent infinite loops)
        $maxLevels = 10;
        $level = 0;

        while ($current->parent_folder_id && $level < $maxLevels) {
            $parent = \App\Models\Folder::find($current->parent_folder_id);
            if (!$parent) break;

            array_unshift($path, $parent->folder_name);
            $current = $parent;
            $level++;
        }

        return implode(' > ', $path);
    }

    /**
     * Call Groq API for chat completion with document context
     */
    private function callGroqAPI(string $message, $conversationId, string $documentContext = ''): string
    {
        try {
            if (!$this->groqService->isConfigured()) {
                throw new \Exception('Groq API key is not configured. Please set GROQ_API_KEY in .env file.');
            }

            // Get conversation history for context
            $conversationHistory = [];
            if ($conversationId && is_numeric($conversationId)) {
                $history = AIHistory::where('conversation_id', $conversationId)
                    ->where('user_id', Auth::id())
                    ->orderBy('created_at', 'desc')
                    ->limit(6) // Last 3 exchanges (6 messages)
                    ->get()
                    ->reverse();

                foreach ($history as $item) {
                    $conversationHistory[] = ['role' => 'user', 'content' => $item->question];
                    $conversationHistory[] = ['role' => 'assistant', 'content' => $item->answer];
                }
            }

            // Build system prompt
            $systemPrompt = $this->groqService->buildDocumentSystemPrompt($documentContext);

            // Add document context to message if available
            $userMessage = $message;
            if (!empty($documentContext)) {
                $userMessage = $documentContext . "\n\nUser Question: " . $message;
            }

            Log::info('Groq API request', [
                'model' => $this->groqService->getModel(),
                'history_messages' => count($conversationHistory),
                'has_document_context' => !empty($documentContext)
            ]);

            // Call Groq service with chat history
            $aiResponse = $this->groqService->chatWithHistory(
                $userMessage,
                $conversationHistory,
                $systemPrompt,
                [
                    'temperature' => 0.7,
                    'max_tokens' => 2000,
                    'timeout' => 60
                ]
            );

            Log::info('Groq API response received', [
                'response_length' => strlen($aiResponse),
                'model' => $this->groqService->getModel()
            ]);

            return $aiResponse;

        } catch (\Exception $e) {
            Log::error('Groq API call failed', [
                'error' => $e->getMessage(),
                'conversation_id' => $conversationId
            ]);
            throw $e;
        }
    }

    /**
     * Call local AI service (Python Flask)
     */
    private function callLocalAIService(string $message, $conversationId, string $documentContext = ''): string
    {
        try {
            // First, check if AI service is available
            Log::info('Checking local AI service health...');

            $healthResponse = Http::timeout(15)->get("{$this->aiServiceUrl}/health");

            if (!$healthResponse->successful()) {
                throw new \Exception('AI service health check failed: ' . $healthResponse->status());
            }

            $healthData = $healthResponse->json();
            Log::info('AI service health check', $healthData);

            if (!$healthData['model_loaded']) {
                throw new \Exception('AI model not loaded in service');
            }

            // Call Python AI service with document context as separate parameter
            Log::info('Sending request to local AI service...', [
                'has_document_context' => !empty($documentContext),
                'context_length' => strlen($documentContext)
            ]);

            $response = Http::timeout(240)
                ->retry(2, 1000)
                ->post("{$this->aiServiceUrl}/chat", [
                    'message' => $message,
                    'conversation_id' => $conversationId,
                    'document_context' => $documentContext,
                ]);

            Log::info('Local AI service response received', [
                'status' => $response->status(),
                'response_size' => strlen($response->body())
            ]);

            if (!$response->successful()) {
                $errorBody = $response->body();
                Log::error('Local AI service error response', [
                    'status' => $response->status(),
                    'body' => $errorBody
                ]);

                throw new \Exception('AI service error (HTTP ' . $response->status() . '): ' . $errorBody);
            }

            $data = $response->json();

            if (!isset($data['response'])) {
                throw new \Exception('Invalid response format from AI service');
            }

            return $data['response'];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('Local AI service connection failed', [
                'error' => $e->getMessage(),
                'service_url' => $this->aiServiceUrl
            ]);

            throw new \Exception('Cannot connect to AI service. Please ensure the AI server is running.');

        } catch (\Exception $e) {
            Log::error('Local AI service call failed', [
                'error' => $e->getMessage(),
                'conversation_id' => $conversationId
            ]);
            throw $e;
        }
    }

    /**
     * Perform semantic search across document content using AI embeddings
     */
    private function performSemanticSearch(string $message, int $userId): array
    {
        try {
            if (!$this->shouldTriggerSemanticSearch($message)) {
                return [];
            }

            $searchResults = $this->callSemanticSearchService($message, $userId);

            if (empty($searchResults)) {
                return [];
            }

            return [
                'context' => $this->buildSemanticSearchContext($searchResults),
                'results' => $searchResults,
                'documents' => $this->extractDocumentMap($searchResults)
            ];

        } catch (\Exception $e) {
            Log::error('Semantic search failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Detect if the message refers to a specific folder
     */
    private function detectFolder(string $message): ?array
    {
        // 1. Check for specific aliases/acronyms using centralized mapping
        $aliases = $this->folderAliases;

        foreach ($aliases as $acronym => $targets) {
            // Check for whole word match of acronym
            if (preg_match('/\b' . preg_quote($acronym, '/') . '\b/i', $message)) {
                foreach ($targets as $target) {
                    $folder = \App\Models\Folder::where('folder_name', 'ILIKE', $target)->first();
                    if ($folder) {
                        return [
                            'id' => $folder->folder_id, 
                            'name' => $folder->folder_name,
                            'is_alias' => true
                        ];
                    }
                }
            }
        }

        // 2. Standard Folder Search
        $allFolders = \App\Models\Folder::pluck('folder_name', 'folder_id')->toArray();
        
        // Sort folders by length (descending) to match "Legal Documents" before "Documents"
        uasort($allFolders, function($a, $b) {
            return strlen($b) - strlen($a);
        });

        foreach ($allFolders as $id => $name) {
            // Skip very short folder names to avoid false matches (e.g., "hi" matching folder "Hi")
            if (strlen($name) < 3) continue;
            if (stripos($message, $name) !== false) {
                return ['id' => $id, 'name' => $name, 'is_alias' => false];
            }
        }

        return null;
    }

    private function getFolderSummary($folderId, $folderName): array
    {
        // Fetch ALL documents for accurate count and references
        $allDocs = Document::where('folder_id', $folderId)
            ->where('status', 'active')
            ->with('folder:folder_id,folder_name')
            ->orderBy('created_at', 'desc')
            ->get();
            
        $count = $allDocs->count();

        $context = "\n\n=== FOLDER SUMMARY ===\n";
        $context .= "You mentioned the '{$folderName}' folder.\n";
        $context .= "This folder contains {$count} active documents.\n";
        
        // Show only 5 most recent in context for readability
        $recentDocs = $allDocs->take(5);
        if ($recentDocs->count() > 0) {
            $context .= "Here are the most recent ones:\n";
            foreach ($recentDocs as $doc) {
                $context .= "- \"{$doc->title}\"\n";
            }
        }
        
        // Return ALL documents for accurate reference count
        return [
            'context' => $context,
            'count' => $count,
            'documents' => $allDocs->map(function($doc) {
                return [
                    'doc_id' => $doc->doc_id,
                    'title' => $doc->title,
                    'folder_id' => $doc->folder_id,
                    'folder_name' => $doc->folder ? $doc->folder->folder_name : null,
                ];
            })->toArray()
        ];
    }

    /**
     * Search documents by metadata (title, description) - Fast SQL search
     */
    private function searchDocumentsMetadata(string $message, int $userId, array $dateParams = []): array
    {
        try {
            // Extract potential search terms from the message
            $cleanMessage = preg_replace('/[[:punct:]]+/', ' ', $message);
            $words = preg_split('/\s+/', $cleanMessage);
            
            $stopWords = $this->stopWords;
            
            // Detect folder using centralized method
            $detectedFolder = $this->detectFolder($message);
            $detectedFolderId = $detectedFolder['id'] ?? null;
            $detectedFolderName = $detectedFolder['name'] ?? null;

            if ($detectedFolderId) {
                Log::info('Detected folder in query', ['folder_name' => $detectedFolderName, 'folder_id' => $detectedFolderId]);
            }
            
            // Filter out folder name from search terms if it was found via direct string match (not alias)
            $searchTerms = array_filter($words, function($word) use ($stopWords, $detectedFolder) {
                $wordLower = strtolower($word);
                
                // If we detected a folder and this word is part of the folder name (and not an alias match), skip it
                if ($detectedFolder && !$detectedFolder['is_alias'] && stripos($detectedFolder['name'], $word) !== false) {
                    return false;
                }

                // NEW: Strict Stopwords (Question/List words) that are NEVER proper names in this context
                // This prevents "How" from being treated as a proper name and becoming a mandatory search term
                $strictStopWords = ['how', 'what', 'where', 'why', 'when', 'who', 'which', 'many', 'count', 'list', 'show', 'total', 'find', 'search', 'have'];
                if (in_array($wordLower, $strictStopWords)) {
                    return false;
                }

                // NEW: Folder Alias Exception
                // If we matched an alias like "MOA", we MUST NOT search for "moa" as a text term.
                // It is redundant and causes failures if the acronym isn't literally in the document title.
                if ($detectedFolder && $detectedFolder['is_alias']) {
                    foreach (array_keys($this->folderAliases) as $acronym) {
                        if (strcasecmp($word, $acronym) === 0) {
                            return false;
                        }
                    }
                }

                $isProperName = ctype_upper($word[0] ?? '');
                return strlen($word) >= 3 && (!in_array($wordLower, $stopWords) || $isProperName);
            });

            // If we only detected a folder and no entity terms, return empty (don't return all docs in folder)
            if (empty($searchTerms) && !$detectedFolderId) {
                return [];
            }

            // Detect if user is asking for ALL documents in a folder (list/count query)
            $isListQuery = preg_match('/\b(how many|list|all|every|show all|display all|what documents|documents are|count)\b/i', $message);
            
            Log::info('Metadata search triggered', [
                'original_message' => $message,
                'search_terms' => array_values($searchTerms),
                'detected_folder' => $detectedFolderName,
                'is_list_query' => $isListQuery
            ]);

            // Search for documents matching the terms in title or description
            $query = Document::where('status', 'active')
                ->with('folder:folder_id,folder_name,parent_folder_id');

            // Apply folder filter if detected
            if ($detectedFolderId) {
                $query->where('folder_id', $detectedFolderId);
            }

            // Apply Date Filter if present
            if (!empty($dateParams['years'])) {
                $query->where(function($q) use ($dateParams) {
                    foreach ($dateParams['years'] as $year) {
                        $q->orWhereYear('created_at', $year);
                        $q->orWhere('title', 'LIKE', "%{$year}%");
                    }
                });
            }

            // Use AND logic for search terms
            if (!empty($searchTerms)) {
                
                foreach ($searchTerms as $term) {
                    $query->where(function($q) use ($term) {
                        $q->where('title', 'ILIKE', "%{$term}%")
                          ->orWhere('description', 'ILIKE', "%{$term}%");
                    });
                }
            } else if ($isListQuery && $detectedFolderId) {
                // List query with folder - return all documents in that folder
                Log::info('List query for folder - returning all folder documents', ['folder' => $detectedFolderName]);
            } else if (empty($searchTerms) && !$isListQuery) {
                // No search terms and not a list query 
                if ($detectedFolderId) {
                    $context = $this->getFolderSummary($detectedFolderId, $detectedFolderName);
                    return [
                        'context' => $context['context'],
                        'count' => $context['count'],
                        'documents' => $context['documents']
                    ];
                }
                return [];
            }

            // Get total count before limiting
            $totalCount = $query->count();
            $documents = $query->limit(15)->get();

            if ($documents->isEmpty()) {
                if ($isListQuery && $detectedFolderId) {
                     return [
                        'context' => "\n\n=== SEARCH RESULT ===\nI checked the folder '{$detectedFolderName}' and found 0 documents.\n",
                        'count' => 0,
                        'documents' => []
                     ];
                }
                return [];
            }

            // Build context for AI
            $context = "\n\n=== DOCUMENT METADATA SEARCH RESULTS ===\n\n";
            
            if ($detectedFolderName) {
                $context .= "Refined Search: Documents in folder '{$detectedFolderName}'\n";
            }
            $context .= "Total matching documents found in database: {$totalCount}\n";
            $context .= "Showing the most relevant {$documents->count()} documents:\n\n";

            $documentReferences = [];

            foreach ($documents as $doc) {
                $folderPath = $this->buildFolderPath($doc->folder);
                $context .= "Document: \"{$doc->title}\"\n";
                $context .= "  └─ Folder: {$folderPath}\n";
                if ($doc->description) {
                    $context .= "  └─ Description: {$doc->description}\n";
                }
                $context .= "\n";

                $documentReferences[] = [
                    'doc_id' => $doc->doc_id,
                    'title' => $doc->title,
                    'folder_id' => $doc->folder_id,
                    'folder_name' => $doc->folder ? $doc->folder->folder_name : null,
                ];
            }

            $context .= "\n=== RESPONSE INSTRUCTIONS ===\n";
            $context .= "Tell the user you found these documents. List them by title and mention clickable links will appear below.\n";

            return [
                'context' => $context,
                'count' => $documents->count(),
                'documents' => $documentReferences
            ];

        } catch (\Exception $e) {
            Log::error('Metadata search failed', [
                'error' => $e->getMessage(),
                'message' => $message,
                'user_id' => $userId
            ]);
            return [];
        }
    }

    /**
     * Check if semantic search should be triggered
     */
    private function shouldTriggerSemanticSearch(string $message): bool
    {
        // Trigger on content queries
        $hasContentQuery = preg_match('/(does|has|find|search|look for|check if|tell me if|show me).*(have|has|contain|include|mention)/i', $message) ||
                          preg_match('/\b(affidavit|certificate|resolution|contract|agreement|document|file)\b/i', $message);

        // Content queries already handled
        if ($hasContentQuery) return true;

        // NEW LOGIC: Trigger on ANY significant keyword (case-insensitive)
        // This replaces the strict Capitalized Name check
        
        // Strip punctuation
        $cleanMessage = preg_replace('/[[:punct:]]+/', ' ', $message);
        $words = preg_split('/\s+/', $cleanMessage);
        
        foreach ($words as $word) {
            $wordLower = strtolower($word);
            
            // If word is significant (>=3 chars and not a stopword)
            if (strlen($wordLower) >= 3 && !in_array($wordLower, $this->stopWords)) {
                // It's a significant term (like "oliver", "housing", "salary") -> Trigger Semantic Search
                return true;
            }
        }

        // Trigger on search keywords (fallback)
        $hasSearchKeywords = preg_match('/\b(find|search|locate|where|which|show|list)\b/i', $message);

        return $hasSearchKeywords;
    }

    /**
     * Call AI Bridge semantic search service
     */
    private function callSemanticSearchService(string $message, int $userId): array
    {
        // Use Groq intelligent search if configured
        if ($this->aiServiceType === 'groq') {
            return $this->groqIntelligentSearch($message, $userId);
        }

        // Use BERT embeddings semantic search
        $response = Http::timeout(30)
            ->post("{$this->aiBridgeUrl}/api/documents/search", [
                'query' => $message,
                'limit' => 5,
                'user_id' => $userId
            ]);

        if (!$response->successful()) {
            Log::warning('Semantic search API error', ['status' => $response->status()]);
            return [];
        }

        $data = $response->json();
        return $data['results'] ?? [];
    }

    /**
     * Use Groq to intelligently search through documents
     */
    private function groqIntelligentSearch(string $query, int $userId): array
    {
        try {
            // Fetch all active documents with embeddings (content excerpts)
            $documents = Document::where('status', 'active')
                ->with(['folder:folder_id,folder_name', 'embeddings'])
                ->orderBy('created_at', 'desc')
                ->take(50)
                ->get();

            if ($documents->isEmpty()) {
                Log::info('No documents found for Groq intelligent search');
                return [];
            }

            // Build document list for Groq
            $documentList = $this->buildDocumentListForGroq($documents);

            // Call Groq to identify relevant documents
            $relevantDocIds = $this->askGroqToIdentifyDocuments($query, $documentList);

            if (empty($relevantDocIds)) {
                Log::info('Groq found no matching documents');
                return [];
            }

            // Build results from identified documents
            return $this->buildGroqSearchResults($documents, $relevantDocIds);

        } catch (\Exception $e) {
            Log::error('Groq intelligent search failed', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Build document list for Groq analysis
     */
    private function buildDocumentListForGroq($documents): string
    {
        $list = "=== AVAILABLE DOCUMENTS ===\n\n";

        foreach ($documents as $doc) {
            $list .= "ID: {$doc->doc_id}\n";
            $list .= "Title: {$doc->title}\n";
            $list .= "Type: {$doc->document_type}\n";

            // Get content preview from embeddings or extracted text
            $preview = '';
            if ($doc->embeddings->isNotEmpty()) {
                $preview = substr($doc->embeddings->first()->chunk_text, 0, 300);
            } elseif ($doc->extracted_text) {
                $preview = substr($doc->extracted_text, 0, 300);
            }

            if (!empty($preview)) {
                $list .= "Content Preview: {$preview}...\n";
            }

            $list .= "\n";
        }

        return $list;
    }

    /**
     * Ask Groq to identify relevant document IDs
     */
    private function askGroqToIdentifyDocuments(string $query, string $documentList): array
    {
        $searchKey = env('GROQ_SEARCH_API_KEY');
        
        // Option 1: Try with Search Key if available
        if ($searchKey) {
            try {
                return $this->groqService->identifyRelevantDocuments($query, $documentList, ['apiKey' => $searchKey]);
            } catch (\Exception $e) {
                Log::warning('Groq Search API Key failed, falling back to default key', ['error' => $e->getMessage()]);
                // Proceed to fallback
            }
        }
        
        // Option 2: Default Key (fallback or primary if no search key)
        return $this->groqService->identifyRelevantDocuments($query, $documentList);
    }

    /**
     * Build search results from Groq-identified documents
     */
    private function buildGroqSearchResults($documents, array $relevantDocIds): array
    {
        $results = [];

        // Cast relevantDocIds to integers for proper comparison
        $relevantDocIds = array_map('intval', $relevantDocIds);

        foreach ($documents as $doc) {
            if (!in_array((int)$doc->doc_id, $relevantDocIds, true)) {
                continue;
            }

            // Get full content from embeddings or extracted text
            $content = '';
            if ($doc->embeddings->isNotEmpty()) {
                $content = $doc->embeddings->first()->chunk_text;
            } elseif ($doc->extracted_text) {
                $content = substr($doc->extracted_text, 0, 1000);
            }

            $results[] = [
                'doc_id' => $doc->doc_id,
                'title' => $doc->title,
                'matched_chunk' => $content,
                'similarity_score' => 0.95 // High score since Groq identified it as relevant
            ];
        }

        Log::info('Groq search results built', ['count' => count($results)]);
        return $results;
    }

    /**
     * Build context string from semantic search results
     */
    private function buildSemanticSearchContext(array $results): string
    {
        $context = "\n\n=== DOCUMENT CONTENT SEARCH RESULTS ===\n\n";

        foreach ($results as $result) {
            $doc = Document::with('folder:folder_id,folder_name')->find($result['doc_id']);
            $folderName = $doc?->folder?->folder_name ?? 'No folder assigned';
            $similarity = round($result['similarity_score'] * 100, 1);
            $excerpt = substr($result['matched_chunk'], 0, 400);

            $context .= "Document: \"{$result['title']}\" (ID: {$result['doc_id']})\n";
            $context .= "Folder: {$folderName}\n";
            $context .= "Relevance: {$similarity}%\n";
            $context .= "Content: \"{$excerpt}...\"\n\n";
        }

        $context .= $this->getSemanticSearchInstructions();
        return $context;
    }

    /**
     * Get AI instructions for semantic search responses
     */
    private function getSemanticSearchInstructions(): string
    {
        return "\n=== RESPONSE INSTRUCTIONS ===\n" .
               "MUST DO:\n" .
               "- Answer using ONLY the content shown above\n" .
               "- Quote specific text from the excerpts\n" .
               "- State document titles only\n" .
               "- If asked 'what folder?', reply with ONLY the folder name\n" .
               "- Correct obvious OCR errors (e.g., 'IOLIVER' -> 'OLIVER') SILENTLY\n" .
               "- Do not explain the correction, just use the clean name\n" .
               "- Do not quote messy text verbatim\n\n" .
               "FORBIDDEN:\n" .
               "- Creating multi-level folder paths\n" .
               "- Using phrases like 'located in', 'found in'\n" .
               "- Mentioning folders unless directly asked\n" .
               "- Inventing information not in the context\n\n" .
               "RESPONSE FORMATTING RULES:\n" .
               "- CHECK FOR DUPLICATES: Treat documents with the same person's name and same subject as ONE record.\n" .
               "- ANSWER ONLY what is asked in 1-2 sentences. Be extremely concise.\n" .
               "- If multiple documents refer to the SAME person, state: 'Found multiple documents for [Name] relating to [Subject].' and stop.\n" .
               "- Distinguish between 'Identity Count' (people) and 'Document Count' (files).\n" .
               "- Use neutral, factual language.";
    }

    /**
     * Extract document map from search results
     */
    private function extractDocumentMap(array $results): array
    {
        $map = [];
        foreach ($results as $result) {
            $docId = $result['doc_id'];
            if (!isset($map[$docId])) {
                $map[$docId] = [
                    'doc_id' => $docId,
                    'title' => $result['title'],
                    'matches' => 0
                ];
            }
            $map[$docId]['matches']++;
        }
        return array_values($map);
    }
    private function extractDateParams(string $message): array
    {
        $params = ['years' => []];
        
        // Match 4-digit years starting with 20 or 19 (e.g., 2024, 2023, 1999)
        if (preg_match_all('/\b(20\d{2}|19\d{2})\b/', $message, $matches)) {
            $params['years'] = array_unique($matches[1]);
        }
        
        return $params;
    }

    /**
     * Generate analytics statistics based on user query
     */
    private function getAnalyticsStats(string $message, int $userId): string
    {
        try {
            // Check if analytics are requested
            $isAnalyticsQuery = preg_match('/(analytics|stats|statistics|breakdown|report|trend|summary|count|how many)/i', $message);
            
            if (!$isAnalyticsQuery) {
                return '';
            }

            // Detect Folder using centralized method
            $detectedFolder = $this->detectFolder($message);
            $folderId = $detectedFolder['id'] ?? null;
            $folderName = $detectedFolder['name'] ?? null;
            
            // CRITICAL CHECK:
            // If the user is asking for stats ("how many") but we DID NOT detect a folder,
            // we should only return global stats (Total Active Documents) if the query refers to "documents" or "files" generally.
            // If they asked for "how many [specific term]" and we didn't find a folder for [specific term], 
            // DO NOT return global stats, because "Total Active Documents: 13" is misleading for "How many Apples?".
            
            if (!$folderId) {
                // Check if message has specific search terms (words >= 3 chars not in stoplist)
                $cleanMessage = preg_replace('/[[:punct:]]+/', ' ', $message);
                $words = preg_split('/\s+/', $cleanMessage);
                $hasSignificantTerms = false;
                
                foreach ($words as $word) {
                    $wordLower = strtolower($word);
                    if (strlen($wordLower) >= 3 && !in_array($wordLower, $this->stopWords)) {
                        $hasSignificantTerms = true;
                        break;
                    }
                }
                
                // If the user entered specific terms (like "MOA" which didn't match a folder alias yet, or "Contracts"),
                // and we didn't find a folder, then return EMPTY analytics.
                // This forces the system to rely on Metadata Search or Semantic Search results instead.
                if ($hasSignificantTerms) {
                    return ''; 
                }
            }

            $context = "\n=== DATABASE ANALYTICS & STATISTICS ===\n";
            
            // Detect grouping
            $groupBy = 'month'; // Default
            if (stripos($message, 'yearly') !== false || stripos($message, 'by year') !== false) {
                $groupBy = 'year';
            } elseif (stripos($message, 'weekly') !== false || stripos($message, 'by week') !== false) {
                $groupBy = 'week';
            }

            if ($folderId) {
                $context .= "Filter: Folder '{$folderName}'\n";
            }

            // Base Query
            $query = Document::where('status', 'active');
            if ($folderId) {
                $query->where('folder_id', $folderId);
            }

            // 1. Total Count
            $totalCount = $query->count();
            
            // If filtering by folder, say "Documents in [Folder]: X". Else "Total Active Documents: X"
            if ($folderId) {
                $context .= "Documents in '{$folderName}': {$totalCount}\n\n";
            } else {
                $context .= "Total Active Documents: {$totalCount}\n\n";
            }

            $needsBreakdown = preg_match('/(analytics|stats|breakdown|report|trend|summary|monthly|yearly|weekly)/i', $message);

            if ($needsBreakdown || $totalCount > 0) {
                $context .= "Breakdown by " . ucfirst($groupBy) . ":\n";
                
                $stats = [];
                if ($groupBy === 'year') {
                    // PostgreSQL Year
                    $stats = $query->selectRaw("EXTRACT(YEAR FROM created_at) as period, count(*) as count")
                        ->groupBy('period')
                        ->orderBy('period', 'desc')
                        ->get();
                } elseif ($groupBy === 'week') {
                    // PostgreSQL Week
                    $stats = $query->selectRaw("TO_CHAR(created_at, 'YYYY-IW') as period, count(*) as count")
                        ->groupBy('period')
                        ->orderBy('period', 'desc')
                        ->limit(12)
                        ->get();
                } else {
                    // PostgreSQL Month (Default)
                    $stats = $query->selectRaw("TO_CHAR(created_at, 'Month YYYY') as period, count(*) as count")
                         ->selectRaw("MAX(created_at) as sort_date") // For sorting
                        ->groupBy('period')
                        ->orderBy('sort_date', 'desc')
                        ->limit(12)
                        ->get();
                }

                foreach ($stats as $stat) {
                    $period = trim($stat->period); // Postgres TO_CHAR might add padding
                    $context .= "- {$period}: {$stat->count} documents\n";
                }
            }
            
            return $context . "\n";

        } catch (\Exception $e) {
            Log::error('Analytics generation failed', ['error' => $e->getMessage()]);
            return "\n[Analytics error: could not generate statistics]\n";
        }
    }

    /**
     * Get context for all folders if user asks "what folders", "list folders", etc.
     */
    private function getAllFoldersContext(string $message): string
    {
        // Expanded triggers to catch more folder-related queries
        $pattern = '/(folders|directories|categories|what.*have|list.*all|show.*folder|all.*folder|folder.*list)/i';
        
        if (!preg_match($pattern, $message)) {
            Log::debug('getAllFoldersContext: Pattern did not match', ['message' => $message, 'pattern' => $pattern]);
            return '';
        }
        
        Log::info('getAllFoldersContext: Pattern matched, building folder context', ['message' => $message]);

        try {
            // Get all folders with document counts and creator info
            $folders = \App\Models\Folder::withCount(['documents' => function($query) {
                $query->where('status', 'active');
            }])->with('creator:user_id,firstname,lastname')->get();

            if ($folders->isEmpty()) {
                 return "\n=== FOLDER LIST ===\nThere are no folders created in the system yet.\n";
            }

            // Get root folders (no parent)
            $rootFolders = $folders->whereNull('parent_folder_id');
            $allSubfolders = $folders->whereNotNull('parent_folder_id');
            
            $totalFolders = $folders->count();
            $rootCount = $rootFolders->count();
            $subfolderCount = $allSubfolders->count();

            $context = "\n=== FOLDER LIST ===\n";
            $context .= "Total folders in the system: {$totalFolders} ({$rootCount} main folders, {$subfolderCount} subfolders)\n\n";
            
            // Recursively list folders starting from root
            foreach ($rootFolders as $root) {
                $context .= $this->buildFolderTree($root, $folders, 0);
            }
            
            // Instructions for AI response
            $context .= "\n=== RESPONSE INSTRUCTIONS ===\n";
            $context .= "Present the folder list EXACTLY as shown above. Use ONLY the data provided (names, dates, creators). Do NOT invent any information.\n";
            
            return $context . "\n";

        } catch (\Exception $e) {
             Log::error('Get all folders context failed', ['error' => $e->getMessage()]);
             return '';
        }
    }

    /**
     * Recursively build folder tree with proper indentation
     */
    private function buildFolderTree($folder, $allFolders, int $depth): string
    {
        $indent = str_repeat('   ', $depth);
        $prefix = $depth === 0 ? '📁 ' : '└─ ';
        
        // Get creator name
        $creatorName = 'Unknown';
        if ($folder->creator) {
            $creatorName = trim($folder->creator->firstname . ' ' . $folder->creator->lastname);
        }
        
        // Format creation date
        $createdAt = $folder->created_at ? $folder->created_at->format('M d, Y h:i A') : 'Unknown date';
        
        $line = "{$indent}{$prefix}{$folder->folder_name} ({$folder->documents_count} documents)\n";
        $line .= "{$indent}   Created: {$createdAt} by {$creatorName}\n";
        
        // Find children of this folder
        $children = $allFolders->where('parent_folder_id', $folder->folder_id);
        
        foreach ($children as $child) {
            $line .= $this->buildFolderTree($child, $allFolders, $depth + 1);
        }
        
        return $line;
    }
}