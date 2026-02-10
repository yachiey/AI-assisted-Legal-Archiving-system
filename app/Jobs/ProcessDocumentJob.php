<?php

namespace App\Jobs;

use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;


use App\Models\Document;
use App\Services\DocumentProcessingService;
use App\Services\AIAnalysisService;
use App\Services\FolderMatchingService;
use App\Models\ActivityLog;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class ProcessDocumentJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $docId;
    protected $mimeType;
    protected $userId;

    /**
     * Create a new job instance.
     */
    public function __construct($docId, $mimeType, $userId)
    {
        $this->docId = $docId;
        $this->mimeType = $mimeType;
        $this->userId = $userId;
    }

    /**
     * Execute the job.
     */
    public function handle(
        DocumentProcessingService $processingService,
        AIAnalysisService $aiAnalysisService,
        FolderMatchingService $folderMatchingService
    ): void
    {
        Log::info('Job started: Processing document', ['doc_id' => $this->docId]);

        $document = Document::find($this->docId);

        // 1. Check if document still exists (Cancellation handling)
        if (!$document) {
            Log::info('Document not found (likely cancelled), aborting job', ['doc_id' => $this->docId]);
            return;
        }

        try {
            $fullText = null;

            // Extract text ONCE to share between all services
            try {
                $fullPath = Storage::disk('documents')->path($document->file_path);
                $fullText = $processingService->extractTextFromFile($fullPath, $this->mimeType);
            } catch (\Exception $extractError) {
                Log::warning('Text extraction failed, proceeding without AI analysis', [
                    'doc_id' => $document->doc_id,
                    'error' => $extractError->getMessage()
                ]);
            }

            // Process document content and generate embeddings
            $processingService->processDocument($document, $this->mimeType, $fullText);

            // Use AI to analyze and auto-fill metadata
            if ($fullText) {
                try {
                    $aiAnalysis = $aiAnalysisService->analyzeDocument(
                        $document->doc_id,
                        $fullText,
                        $document->title
                    );

                    // Update document with AI suggestions
                    if (!empty($aiAnalysis['title']) || !empty($aiAnalysis['description'])) {
                        $updateData = [
                            'title' => $aiAnalysis['title'] ?? $document->title,
                            'description' => $aiAnalysis['description'] ?? $document->description,
                            'ai_suggested_folder' => $aiAnalysis['suggested_folder'] ?? null,
                        ];

                        if (!empty($aiAnalysis['remarks'])) {
                            $updateData['remarks'] = $aiAnalysis['remarks'];
                        }

                        // Match folder intelligently
                        $folder = $folderMatchingService->matchFolderFromAI($aiAnalysis);

                        if ($folder) {
                            $updateData['folder_id'] = $folder->folder_id;
                        }
                    }
                    
                    // Mark as active regardless of AI success (processing done)
                    $updateData['status'] = 'active';
                    $document->update($updateData);

                } catch (\Exception $aiError) {
                    Log::warning('AI auto-fill failed', ['error' => $aiError->getMessage()]);
                    // Still mark as active even if AI failed
                    $document->update(['status' => 'active']);
                }
            } else {
                 // No text extracted, but processing finished
                 $document->update(['status' => 'active']);
            }

            // Log successful upload activity
            ActivityLog::create([
                'user_id' => $this->userId,
                'doc_id' => $document->doc_id,
                'activity_type' => 'upload',
                'activity_time' => now(),
                'activity_details' => 'Document processed successfully: ' . $document->title
            ]);

            Log::info('Job finished: Document processed', ['doc_id' => $this->docId]);

        } catch (\Exception $e) {
            Log::error('Job failed: Document processing error', [
                'doc_id' => $this->docId,
                'error' => $e->getMessage()
            ]);
            
            if ($document) {
                $document->update([
                    'status' => 'failed',
                    'remarks' => 'Processing timeout or error: ' . $e->getMessage()
                ]);
            }
        }
    }
}
