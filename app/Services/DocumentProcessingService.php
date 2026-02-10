<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentEmbedding;
use App\Models\Folder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\GroqService;

/**
 * Service for handling document text extraction, chunking, and embedding generation.
 * This service is optimized to reuse pre-extracted text to avoid redundant OCR.
 */
class DocumentProcessingService
{
    private string $textExtractionUrl;
    private string $embeddingUrl;
    private string $aiBridgeUrl;
    private string $aiServiceType;
    private int $chunkSize;
    private int $chunkOverlap;
    private GroqService $groqService;

    public function __construct(GroqService $groqService)
    {
        $this->textExtractionUrl = env('TEXT_EXTRACTION_URL', 'http://127.0.0.1:5002');
        $this->embeddingUrl = env('LOCAL_EMBEDDING_URL', 'http://127.0.0.1:5001');
        $this->aiBridgeUrl = env('AI_BRIDGE_URL', 'http://127.0.0.1:5003');
        $this->aiServiceType = env('AI_SERVICE_TYPE', 'groq');
        $this->chunkSize = env('CHUNK_SIZE', 1000);
        $this->chunkOverlap = env('CHUNK_OVERLAP', 200);
        $this->groqService = $groqService;
    }

    /**
     * Process document content and generate embeddings.
     * Metadata generation is handled separately by AIAnalysisService.
     * 
     * @param Document $document
     * @param string $mimeType
     * @param string|null $fullText Pre-extracted text to avoid redundant processing
     */
    public function processDocument(Document $document, string $mimeType, ?string $fullText = null): void
    {
        try {
            $fullPath = Storage::disk('documents')->path($document->file_path);

            // Extract text using AI or local service if not provided
            if ($fullText === null) {
                $fullText = $this->extractTextFromFile($fullPath, $mimeType);
            }

            if (empty($fullText)) {
                $document->update(['status' => 'failed', 'remarks' => 'Could not extract text from document']);
                return;
            }

            // Split text into chunks
            $chunks = $this->chunkText($fullText);

            if (empty($chunks)) {
                $document->update(['status' => 'failed', 'remarks' => 'Document text too short for processing']);
                return;
            }

            // Generate embeddings for chunks
            $embeddings = $this->generateEmbeddings($chunks);

            // Store embeddings in database
            $this->storeEmbeddings($document, $embeddings);

            // Update status
            $document->update([
                'status' => 'ready',
                'updated_at' => now()
            ]);

            Log::info('Document processed successfully (Embeddings generated)', [
                'doc_id' => $document->doc_id,
                'chunks' => count($chunks)
            ]);

        } catch (\Exception $e) {
            Log::error('Document processing failed', [
                'doc_id' => $document->doc_id,
                'error' => $e->getMessage()
            ]);

            $document->update([
                'status' => 'failed',
                'remarks' => 'Processing failed: ' . $e->getMessage()
            ]);
        }
    }

    /**
     * Public method to extract text from a file path.
     * Used by controllers to get text once and share it.
     */
    public function extractTextFromFile(string $filePath, string $mimeType): string
    {
        try {
            $apiUrl = config('services.ai.text_extraction_url', 'http://localhost:5002/extract');
            
            Log::info('Attempting local text extraction', ['file' => basename($filePath)]);

            $response = Http::attach(
                'file', file_get_contents($filePath), basename($filePath)
            )->timeout(300)->post($apiUrl);

            if ($response->successful()) {
                $data = $response->json();
                $extractedText = $data['text'] ?? '';
                
                if (!empty($extractedText)) {
                    Log::info('Local text extraction successful', ['length' => strlen($extractedText)]);
                    return $extractedText;
                }
            }

            Log::error('Local text extraction failed or returned empty text', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            throw new \Exception('Offline or Local AI service is not reachable. Please ensure \'python run_text_extraction.py\' is running on port 5002.');

        } catch (\Exception $e) {
            Log::error('Text extraction failed: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Split text into chunks with overlap
     */
    private function chunkText(string $text): array
    {
        if (empty($text)) return [];

        $chunks = [];
        $sentences = preg_split('/(?<=[.!?])\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
        $sentences = array_filter($sentences, fn($sentence) => strlen(trim($sentence)) > 10);

        $currentChunk = '';
        $currentLength = 0;

        foreach ($sentences as $sentence) {
            $sentenceLength = strlen($sentence);

            if ($currentLength + $sentenceLength > $this->chunkSize && !empty($currentChunk)) {
                $chunks[] = trim($currentChunk);
                $overlapText = $this->getOverlapText($currentChunk, $this->chunkOverlap);
                $currentChunk = $overlapText . ' ' . $sentence;
                $currentLength = strlen($currentChunk);
            } else {
                $currentChunk .= ' ' . $sentence;
                $currentLength += $sentenceLength + 1;
            }
        }

        if (!empty($currentChunk)) $chunks[] = trim($currentChunk);

        return array_filter($chunks, fn($chunk) => strlen(trim($chunk)) > 50);
    }

    private function getOverlapText(string $text, int $overlapLength): string
    {
        if (strlen($text) <= $overlapLength) return $text;
        $overlap = substr($text, -$overlapLength);
        $spacePos = strpos($overlap, ' ');
        return ($spacePos !== false) ? substr($overlap, $spacePos + 1) : $overlap;
    }

    /**
     * Generate embeddings for segments
     */
    private function generateEmbeddings(array $chunks): array
    {
        if (empty($chunks)) {
            return [];
        }

        try {
            // Send batch request to Python service
            // This is significantly faster than looping through single requests
            $response = Http::timeout(60)->post($this->embeddingUrl . '/embed', [
                'texts' => array_values($chunks) // Ensure indexed array
            ]);

            if ($response->successful()) {
                $data = $response->json();
                $embeddingsMatrix = $data['embeddings'] ?? [];
                $dimensions = $data['dimensions'] ?? 384;
                
                $results = [];
                // Map embeddings back to chunks
                // array_values on chunks above ensures alignment with response list
                $chunksList = array_values($chunks);
                
                foreach ($chunksList as $index => $chunk) {
                    if (isset($embeddingsMatrix[$index])) {
                        $results[] = [
                            'chunk_text' => $chunk,
                            'embedding' => $embeddingsMatrix[$index],
                            'model_type' => 'all-MiniLM-L6-v2',
                            'dimensions' => $dimensions,
                            'service_response' => true
                        ];
                    } else {
                        // Fallback if specific embedding missing (rare)
                        $results[] = $this->createMockEmbedding($chunk, false, 'Missing from batch response');
                    }
                }
                return $results;
            } else {
                Log::error('Batch embedding failed', ['status' => $response->status(), 'body' => $response->body()]);
                // Fallback to mock for all
                return array_map(fn($chunk) => $this->createMockEmbedding($chunk, false, 'Batch service failed'), $chunks);
            }
        } catch (\Exception $e) {
            Log::error('Batch embedding exception', ['error' => $e->getMessage()]);
            // Fallback to mock for all
            return array_map(fn($chunk) => $this->createMockEmbedding($chunk, false, $e->getMessage()), $chunks);
        }
    }

    private function createMockEmbedding(string $chunk, bool $success, string $error = ''): array
    {
        return [
            'chunk_text' => $chunk,
            'embedding' => $this->generateMockValues($chunk),
            'model_type' => 'mock-fallback',
            'dimensions' => 384,
            'service_response' => $success,
            'error' => $error
        ];
    }

    private function generateMockValues(string $text): array
    {
        $hash = md5($text);
        $values = [];
        for ($i = 0; $i < 32; $i += 2) {
            $values[] = round((hexdec(substr($hash, $i, 2)) / 255.0) * 2.0 - 1.0, 6);
        }
        while (count($values) < 384) $values = array_merge($values, $values);
        return array_slice($values, 0, 384);
    }

    private function storeEmbeddings(Document $document, array $embeddings): void
    {
        $batchData = [];
        $now = now();

        foreach ($embeddings as $index => $data) {
            $batchData[] = [
                'doc_id' => $document->doc_id,
                'chunk_index' => $index,
                'chunk_text' => $data['chunk_text'],
                'embedding_vector' => json_encode($data['embedding']),
                'metadata' => json_encode([
                    'model_type' => $data['model_type'] ?? 'unknown',
                    'embedding_dimensions' => count($data['embedding']),
                    'generated_at' => now()->toISOString(),
                    'service_response' => $data['service_response'] ?? false
                ]),
                'created_at' => $now,
            ];
        }

        if (!empty($batchData)) {
             // Split into chunks of 500 to safe against max placeholder limits
             foreach (array_chunk($batchData, 500) as $chunk) {
                 DocumentEmbedding::insert($chunk);
             }
        }
    }

    public function getMimeType(string $fileName): string
    {
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $map = [
            'pdf' => 'application/pdf', 
            'doc' => 'application/msword', 
            'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
            'txt' => 'text/plain'
        ];
        return $map[$ext] ?? 'application/octet-stream';
    }
}
