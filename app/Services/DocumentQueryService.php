<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentEmbedding;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Service for handling document queries and retrieval operations
 */
class DocumentQueryService
{
    /**
     * Get documents with filtering support
     */
    public function getDocuments(Request $request)
    {
        $query = Document::with(['folder', 'user']);

        // Apply status filter
        if ($request->has('status') && $request->status !== null && $request->status !== '') {
            // If status is explicitly provided (e.g., 'active', 'processing', 'failed')
            $query->where('status', $request->status);
        }

        // Apply folder filter
        if ($request->has('folder_id') && $request->folder_id !== null && $request->folder_id !== '') {
            $query->where('folder_id', $request->folder_id);
        }

        // Apply physical location (cabinet) filter
        if ($request->has('physical_location') && $request->physical_location !== null && $request->physical_location !== '') {
            if ($request->physical_location === '__none__') {
                // Documents with no assigned physical location
                $query->where(function ($q) {
                    $q->whereNull('physical_location')->orWhere('physical_location', '');
                });
            } else {
                $query->where('physical_location', $request->physical_location);
            }
        }

        // Apply managed location filter (includes the whole subtree of that location)
        if ($request->filled('location_id')) {
            if ($request->location_id === 'none') {
                $query->whereNull('location_id');
            } else {
                $ids = $this->descendantLocationIds((int) $request->location_id);
                $query->whereIn('location_id', $ids);
            }
        }

        // Apply year filter
        if ($request->has('year') && $request->year) {
            $query->whereYear('created_at', $request->year);
        }

        // Apply search filter - searches title, description, remarks, document content AND semantic (AI) search
        if ($request->has('search') && $request->search) {
            $searchTerm = $request->search;
            $lowerSearchTerm = '%' . strtolower($searchTerm) . '%';

            // Get document IDs that have matching content in embeddings (extracted text)
            $contentMatchDocIds = DocumentEmbedding::whereRaw('LOWER(chunk_text) LIKE ?', [$lowerSearchTerm])
                ->distinct()
                ->pluck('doc_id')
                ->toArray();

            // Try AI semantic search (falls back to empty array if API fails)
            $semanticDocIds = $this->getSemanticSearchResults($searchTerm);

            $query->where(function ($q) use ($lowerSearchTerm, $contentMatchDocIds, $semanticDocIds) {
                // Search in document metadata
                $q->whereRaw('LOWER(title) LIKE ?', [$lowerSearchTerm])
                  ->orWhereRaw('LOWER(COALESCE(description, \'\')) LIKE ?', [$lowerSearchTerm])
                  ->orWhereRaw('LOWER(COALESCE(remarks, \'\')) LIKE ?', [$lowerSearchTerm])
                  ->orWhereRaw('LOWER(COALESCE(physical_location, \'\')) LIKE ?', [$lowerSearchTerm]);

                // Also include documents with matching content
                if (!empty($contentMatchDocIds)) {
                    $q->orWhereIn('doc_id', $contentMatchDocIds);
                }

                // Also include documents found by AI semantic search
                if (!empty($semanticDocIds)) {
                    $q->orWhereIn('doc_id', $semanticDocIds);
                }
            });
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'updated_at');
        $sortOrder = $request->get('sort_order', 'desc');
        
        $query->orderBy($sortBy, $sortOrder);

        $paginate = $request->get('paginate', false);
        if (filter_var($paginate, FILTER_VALIDATE_BOOLEAN)) {
            $perPage = $request->get('per_page', 12);
            return $query->paginate((int)$perPage);
        }

        return $query->get();
    }

    /**
     * Collect a location's ID plus all descendant location IDs (recursive subtree).
     */
    private function descendantLocationIds(int $locationId): array
    {
        $ids = [$locationId];

        $children = \App\Models\Location::where('parent_id', $locationId)
            ->pluck('id')
            ->toArray();

        foreach ($children as $childId) {
            $ids = array_merge($ids, $this->descendantLocationIds($childId));
        }

        return $ids;
    }

    /**
     * Get document counts
     */
    public function getDocumentCounts(): array
    {
        $totalDocuments = Document::count();
        $documentsByStatus = Document::select('status')
            ->selectRaw('count(*) as count')
            ->groupBy('status')
            ->pluck('count', 'status')
            ->toArray();

        return [
            'total_documents' => $totalDocuments,
            'documents_by_status' => $documentsByStatus
        ];
    }

    /**
     * Get bulk folder document counts (optimized)
     * Includes documents in subfolders (recursive)
     */
    public function getBulkFolderCounts(array $folderIds): array
    {
        $result = [];
        foreach ($folderIds as $folderId) {
            $result[$folderId] = $this->getFolderDocumentCount($folderId);
        }
        return $result;
    }

    /**
     * Get single folder document count including all descendant subfolders
     * Only counts active documents
     */
    public function getFolderDocumentCount(int $folderId): int
    {
        // Collect this folder + all descendant subfolder IDs
        $allFolderIds = $this->getAllDescendantFolderIds($folderId);

        return Document::whereIn('folder_id', $allFolderIds)
            ->where('status', 'active')
            ->count();
    }

    /**
     * Recursively collect a folder's ID and all its children's IDs
     */
    private function getAllDescendantFolderIds(int $folderId): array
    {
        $ids = [$folderId];

        $children = \App\Models\Folder::where('parent_folder_id', $folderId)
            ->pluck('folder_id')
            ->toArray();

        foreach ($children as $childId) {
            $ids = array_merge($ids, $this->getAllDescendantFolderIds($childId));
        }

        return $ids;
    }

    /**
     * Get single document by ID
     */
    public function getDocument(int $id): ?Document
    {
        return Document::with(['folder', 'user'])
            ->where('doc_id', $id)
            ->first();
    }

    /**
     * Get embeddings for a document
     */
    public function getEmbeddings(int $docId): array
    {
        $document = Document::findOrFail($docId);

        $embeddings = DocumentEmbedding::where('doc_id', $docId)
            ->orderBy('chunk_index')
            ->get()
            ->map(function ($embedding) {
                return [
                    'embedding_id' => $embedding->embedding_id,
                    'chunk_index' => $embedding->chunk_index,
                    'chunk_text' => $embedding->chunk_text,
                    'embedding_vector' => json_decode($embedding->embedding_vector),
                    'metadata' => $embedding->metadata,
                    'created_at' => $embedding->created_at
                ];
            });

        return [
            'success' => true,
            'doc_id' => $docId,
            'document_title' => $document->title,
            'total_embeddings' => $embeddings->count(),
            'embeddings' => $embeddings
        ];
    }

    /**
     * Get all document embeddings for semantic search
     */
    public function getAllEmbeddings(): array
    {
        $embeddings = DocumentEmbedding::with('document:doc_id,title,status')
            ->whereHas('document', function($query) {
                $query->where('status', 'active');
            })
            ->orderBy('doc_id')
            ->orderBy('chunk_index')
            ->get()
            ->map(function ($embedding) {
                return [
                    'embedding_id' => $embedding->embedding_id,
                    'doc_id' => $embedding->doc_id,
                    'document_title' => $embedding->document ? $embedding->document->title : 'Unknown',
                    'chunk_index' => $embedding->chunk_index,
                    'chunk_text' => $embedding->chunk_text,
                    'embedding_vector' => json_decode($embedding->embedding_vector),
                    'created_at' => $embedding->created_at
                ];
            });

        return [
            'success' => true,
            'total_embeddings' => $embeddings->count(),
            'data' => $embeddings
        ];
    }

    /**
     * Get latest uploaded document by user
     */
    public function getLatestProcessingDocument(int $userId): ?Document
    {
        return Document::where('created_by', $userId)
            ->whereIn('status', ['processing', 'processed'])
            ->latest('created_at')
            ->first();
    }

    /**
     * AI semantic search using Groq API
     * Returns doc IDs that semantically match the search term.
     * Falls back to empty array (SQL-only results) if API fails or times out.
     */
    private function getSemanticSearchResults(string $searchTerm): array
    {
        try {
            $searchApiKey = env('GROQ_SEARCH_API_KEY');
            if (empty($searchApiKey)) {
                return [];
            }

            $groqService = app(GroqService::class);

            // Get all active documents with titles and short descriptions
            $documents = Document::where('status', 'active')
                ->select('doc_id', 'title', 'description')
                ->get();

            if ($documents->isEmpty()) {
                return [];
            }

            // Build compact document list for Groq
            $documentList = "Available Documents:\n";
            foreach ($documents as $doc) {
                $preview = $doc->description ? ' - ' . mb_substr($doc->description, 0, 120) : '';
                $documentList .= "ID:{$doc->doc_id} | {$doc->title}{$preview}\n";
            }

            // Use Groq with 3-second timeout and the dedicated search API key
            $ids = $groqService->identifyRelevantDocuments($searchTerm, $documentList, [
                'timeout' => 3,
                'apiKey' => $searchApiKey,
            ]);

            Log::info('Semantic search results', [
                'search_term' => $searchTerm,
                'found_ids' => $ids,
            ]);

            return array_map('intval', $ids);
        } catch (\Exception $e) {
            Log::warning('Semantic search failed, falling back to SQL search only', [
                'error' => $e->getMessage(),
                'search_term' => $searchTerm,
            ]);
            return [];
        }
    }

    /**
     * Store embeddings from AI Bridge Service
     */
    public function storeEmbeddings(int $docId, array $embeddings, string $modelUsed): int
    {
        $document = Document::findOrFail($docId);

        // Clear existing embeddings for this document
        DocumentEmbedding::where('doc_id', $docId)->delete();

        // Store new embeddings
        foreach ($embeddings as $index => $embeddingData) {
            DocumentEmbedding::create([
                'doc_id' => $docId,
                'chunk_index' => $index,
                'chunk_text' => $embeddingData['chunk_text'],
                'embedding_vector' => json_encode($embeddingData['embedding']),
                'metadata' => [
                    'model_type' => $modelUsed,
                    'embedding_dimensions' => count($embeddingData['embedding']),
                    'chunk_length' => strlen($embeddingData['chunk_text']),
                    'generated_at' => now()->toISOString(),
                    'service_url' => env('AI_BRIDGE_URL', 'http://127.0.0.1:5003'),
                    'service_response' => true
                ],
                'created_at' => now(),
            ]);
        }

        return count($embeddings);
    }
}
