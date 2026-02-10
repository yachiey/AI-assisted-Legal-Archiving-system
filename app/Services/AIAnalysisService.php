<?php

namespace App\Services;

use App\Models\Folder;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Service for AI-powered document analysis using Groq and AI Bridge
 */
class AIAnalysisService
{
    private string $aiServiceType;
    private string $aiBridgeUrl;
    private string $groqApiKey;
    private string $groqModel;

    public function __construct()
    {
        $this->aiServiceType = env('AI_SERVICE_TYPE', 'groq');
        $this->aiBridgeUrl = env('AI_BRIDGE_URL', 'http://localhost:5003');
        $this->groqApiKey = env('GROQ_API_KEY', '');
        $this->groqModel = env('GROQ_MODEL', 'llama-3.3-70b-versatile');
    }

    /**
     * Analyze document with hybrid approach (Groq online / AI Bridge offline)
     * Automatically falls back to AI Bridge if Groq is unavailable
     */
    public function analyzeDocument(int $docId, string $fullText, string $originalTitle): array
    {
        try {
            // If local is preferred, try AI Bridge first
            if ($this->aiServiceType === 'local') {
                try {
                    Log::info('Using local AI Bridge (preferred mode)', ['doc_id' => $docId]);
                    return $this->analyzeWithAIBridge($docId, $fullText);
                } catch (\Exception $bridgeError) {
                    Log::warning('Local AI Bridge failed, falling back to Groq if available', [
                        'doc_id' => $docId,
                        'error' => $bridgeError->getMessage()
                    ]);
                    // Fall through to Groq
                }
            }

            // Try Groq if configured (either as preferred or fallback)
            if ($this->groqApiKey && $fullText) {
                try {
                    Log::info('Attempting Groq AI', ['doc_id' => $docId]);
                    $analysis = $this->analyzeWithGroq($fullText, $originalTitle);
                    Log::info('Groq AI succeeded', ['doc_id' => $docId]);
                    return $analysis;
                } catch (\Exception $groqError) {
                    Log::warning('Groq failed', [
                        'doc_id' => $docId,
                        'error' => $groqError->getMessage()
                    ]);
                    // If preferred was Groq, fallback to Local
                    if ($this->aiServiceType === 'groq') {
                        Log::info('Falling back to local AI Bridge from Groq', ['doc_id' => $docId]);
                        return $this->analyzeWithAIBridge($docId, $fullText);
                    }
                }
            }

            // Final fallback: Use local AI Bridge if not already tried
            if ($this->aiServiceType !== 'local') {
                return $this->analyzeWithAIBridge($docId, $fullText);
            }
            
            throw new \Exception('All AI analysis available methods failed');

        } catch (\Exception $e) {
            Log::error('All AI analysis methods failed', [
                'doc_id' => $docId,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Call Groq API for document analysis (online)
     */
    private function analyzeWithGroq(string $fullText, string $originalTitle): array
    {
        try {
            if (!$this->groqApiKey) {
                throw new \Exception('Groq API key not configured');
            }

            // Limit text to first 3000 characters for analysis (to save tokens)
            $textSample = substr($fullText, 0, 3000);

            // Get available folders from database
            $availableFolders = Folder::pluck('folder_name')->toArray();
            $foldersList = implode(', ', $availableFolders);

            $systemPrompt = 'You are an AI assistant specialized in analyzing legal and business documents for a university legal office. Your task is to analyze document content and extract key metadata in JSON format.';

            $userPrompt = <<<EOT
Analyze this document and provide metadata in JSON format with these fields:

1. "title": A specific title formatted STRICTLY as "YYYY-MM-DD-FullName-DocumentType". The FullName MUST be PascalCase with NO spaces, NO hyphens, NO periods (e.g. "OliverDFuentevilla" NOT "OLIVER D. FUENTEVILLA" or "Oliver-D-Fuentevilla"). DocumentType MUST be the FULL SPECIFIC type in PascalCase - NEVER use just "Affidavit", always include the subtype like "AffidavitOfNoViolation", "AffidavitOfLoss", "AffidavitOfCompliance". Examples: "2025-09-02-OliverDFuentevilla-AffidavitOfNoViolation", "2024-01-20-JuanDelaCruz-AffidavitOfLoss", "2024-03-15-MariaClara-MemorandumOfAgreement", "2023-11-10-CmuSecurityAgency-ServiceContract".
2. "description": A 2-3 sentence summary (max 500 chars). MUST follow this structure: "[Document Type] filed by [FULL NAME OF PERSON], a resident of [ADDRESS/LOCATION], regarding [PURPOSE]. [Date or details]." The FIRST sentence MUST contain the person's FULL NAME - never skip the name.
3. "category": The document category (choose from: MOA, Resolution, Contract, Policy, Memorandum, Correspondence, Student Records, Criminal Case, Civil Case, Housing, Other)
4. "document_type": Specific type (e.g., "Memorandum of Agreement", "Board Resolution", "Employment Contract", etc.)
5. "key_topics": Array of 3-5 main topics/keywords
6. "suggested_folder": IMPORTANT - Available folders: {$foldersList}. If one of these folders is appropriate for this document type, use it. However, if NONE of the existing folders match the document type well (e.g., Certificate of Employment should NOT go to "MODE OF AGREEMENT"), suggest a NEW descriptive folder name instead (e.g., "Employment Records", "Certificates", "HR Documents"). Do NOT use generic terms like "Legal Document" or "Documents".
7. "urgency": "high", "medium", or "low"
8. "requires_review": true/false - if document needs legal/compliance review

Document Title: {$originalTitle}

Document Content:
{$textSample}

Return ONLY valid JSON, no other text.
EOT;

            Log::info('Calling Groq API for document analysis', [
                'original_title' => $originalTitle,
                'text_length' => strlen($fullText),
                'sample_length' => strlen($textSample)
            ]);

            $response = Http::withHeaders([
                'Authorization' => 'Bearer ' . $this->groqApiKey,
                'Content-Type' => 'application/json',
            ])
            ->timeout(30)
            ->post('https://api.groq.com/openai/v1/chat/completions', [
                'model' => $this->groqModel,
                'messages' => [
                    ['role' => 'system', 'content' => $systemPrompt],
                    ['role' => 'user', 'content' => $userPrompt]
                ],
                'temperature' => 0.3,
                'max_tokens' => 1000,
                'response_format' => ['type' => 'json_object']
            ]);

            if (!$response->successful()) {
                $errorBody = $response->json();
                throw new \Exception('Groq API error: ' . ($errorBody['error']['message'] ?? 'Unknown error'));
            }

            $data = $response->json();
            $aiResponse = $data['choices'][0]['message']['content'] ?? '';

            // Parse JSON response
            $analysis = json_decode($aiResponse, true);

            if (!$analysis) {
                throw new \Exception('Invalid JSON response from Groq AI');
            }

            Log::info('Groq AI document analysis completed', [
                'analysis' => $analysis,
                'tokens_used' => $data['usage'] ?? []
            ]);

            // Build remarks from AI analysis
            $remarks = [];
            if (!empty($analysis['urgency'])) {
                $remarks[] = "Urgency: " . ucfirst($analysis['urgency']);
            }
            if (!empty($analysis['requires_review'])) {
                $remarks[] = $analysis['requires_review'] ? "Requires legal review" : "No review needed";
            }
            if (!empty($analysis['key_topics']) && is_array($analysis['key_topics'])) {
                $remarks[] = "Topics: " . implode(', ', array_slice($analysis['key_topics'], 0, 3));
            }

            return [
                'title' => $analysis['title'] ?? null,
                'description' => $analysis['description'] ?? null,
                'suggested_folder' => $analysis['suggested_folder'] ?? null,
                'category' => $analysis['category'] ?? null,
                'document_type' => $analysis['document_type'] ?? null,
                'remarks' => !empty($remarks) ? implode(' • ', $remarks) : null,
            ];

        } catch (\Exception $e) {
            Log::error('Groq AI document analysis failed', [
                'error' => $e->getMessage(),
                'original_title' => $originalTitle
            ]);
            throw $e;
        }
    }

    /**
     * Call AI Bridge service for document analysis (local, offline)
     */
    private function analyzeWithAIBridge(int $docId, string $documentText): array
    {
        try {
            // Fetch available folders to pass to AI context
            $folders = Folder::select('folder_id', 'folder_name', 'folder_path')
                ->get()
                ->toArray();

            $response = Http::timeout(180)->post("{$this->aiBridgeUrl}/api/documents/analyze", [
                'docId' => $docId,
                'documentText' => $documentText,
                'folders' => $folders
            ]);

            if (!$response->successful()) {
                throw new \Exception('AI Bridge error: HTTP ' . $response->status());
            }

            $data = $response->json();

            Log::info('AI Bridge analysis completed', ['analysis' => $data]);

            return [
                'title' => $data['title'] ?? null,
                'description' => $data['description'] ?? null,
                'suggested_folder' => $data['suggested_folder'] ?? null,
                'category' => null, // Categories removed as per requirements
                'document_type' => $data['document_type'] ?? null,
                'remarks' => $data['remarks'] ?? null,
            ];

        } catch (\Exception $e) {
            Log::error('AI Bridge analysis failed', [
                'error' => $e->getMessage(),
                'doc_id' => $docId
            ]);
            throw $e;
        }
    }

    /**
     * Check if Groq is configured
     */
    public function isGroqConfigured(): bool
    {
        return !empty($this->groqApiKey);
    }

    /**
     * Check if AI Bridge is configured
     */
    public function isAIBridgeConfigured(): bool
    {
        return !empty($this->aiBridgeUrl);
    }
}
