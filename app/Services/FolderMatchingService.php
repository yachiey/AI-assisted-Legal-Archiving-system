<?php

namespace App\Services;

use App\Models\Folder;
use Illuminate\Support\Facades\Log;

/**
 * Service for intelligently matching documents to folders based on AI analysis
 */
class FolderMatchingService
{
    /**
     * Intelligently match folder from AI analysis based on database folders
     */
    public function matchFolderFromAI(array $aiAnalysis): ?Folder
    {
        // Get all available folders from database
        $availableFolders = Folder::all();

        if ($availableFolders->isEmpty()) {
            Log::warning('No folders available in database for matching');
            return null;
        }

        Log::info('Starting intelligent folder matching', [
            'available_folders' => $availableFolders->pluck('folder_name')->toArray(),
            'ai_suggested_folder' => $aiAnalysis['suggested_folder'] ?? null,
            'ai_category' => $aiAnalysis['category'] ?? null,
            'ai_document_type' => $aiAnalysis['document_type'] ?? null
        ]);

        // Detect document type from description/title for smart filtering
        $docType = $this->detectDocumentType($aiAnalysis);
        Log::info('Detected document type for folder matching', ['doc_type' => $docType]);

        $folder = null;

        // Strategy 1: Exact match on suggested_folder (with validation)
        if (!empty($aiAnalysis['suggested_folder'])) {
            $suggestedFolder = strtolower(trim($aiAnalysis['suggested_folder']));

            // REJECT generic/redundant folder names
            $rejectedTerms = ['legal document', 'legal documents', 'document', 'documents', 'general', 'misc', 'miscellaneous', 'other'];
            foreach ($rejectedTerms as $term) {
                if (str_contains($suggestedFolder, $term)) {
                    Log::warning('Rejected generic AI folder suggestion', [
                        'suggested_folder' => $aiAnalysis['suggested_folder'],
                        'rejected_term' => $term
                    ]);
                    $suggestedFolder = null;
                    break;
                }
            }

            if ($suggestedFolder) {
                // Validate the suggestion against document type
                if (!$this->isValidFolderForDocType($suggestedFolder, $docType)) {
                    Log::warning('Rejected mismatched folder suggestion', [
                        'suggested_folder' => $suggestedFolder,
                        'doc_type' => $docType,
                        'reason' => 'Document type does not match folder purpose'
                    ]);
                    $suggestedFolder = null;
                }
            }

            if ($suggestedFolder) {
                foreach ($availableFolders as $dbFolder) {
                    $dbFolderName = strtolower(trim($dbFolder->folder_name));

                    // Skip if folder doesn't make sense for this doc type
                    if (!$this->isValidFolderForDocType($dbFolderName, $docType)) {
                        continue;
                    }

                    // Exact match
                    if ($dbFolderName === $suggestedFolder) {
                        Log::info('Folder matched: Exact match', ['folder' => $dbFolder->folder_name]);
                        return $dbFolder;
                    }

                    // Contains match (bidirectional)
                    if (strpos($dbFolderName, $suggestedFolder) !== false || strpos($suggestedFolder, $dbFolderName) !== false) {
                        Log::info('Folder matched: Partial match', ['folder' => $dbFolder->folder_name]);
                        $folder = $dbFolder;
                        break;
                    }
                }
            }
        }

        // Strategy 2: Match by document_type using keyword mapping
        if (!$folder && !empty($aiAnalysis['document_type'])) {
            $docTypeStr = strtolower(trim($aiAnalysis['document_type']));

            // Define keyword to folder mappings based on your database folders
            $keywordMappings = $this->getKeywordMappings();

            foreach ($keywordMappings as $keyword => $targetFolderName) {
                if (strpos($docTypeStr, $keyword) !== false) {
                    // Find folder by name
                    $matchedFolder = $availableFolders->first(function($f) use ($targetFolderName, $docType) {
                        $folderName = strtolower(trim($f->folder_name));
                        // Validate folder is appropriate for this doc type
                        if (!$this->isValidFolderForDocType($folderName, $docType)) {
                            return false;
                        }
                        return $folderName === strtolower(trim($targetFolderName));
                    });

                    if ($matchedFolder) {
                        Log::info('Folder matched: Document type keyword', [
                            'keyword' => $keyword,
                            'folder' => $matchedFolder->folder_name
                        ]);
                        return $matchedFolder;
                    }
                }
            }
        }

        return $folder;
    }

    /**
     * Detect document type from AI analysis for smart folder filtering
     */
    private function detectDocumentType(array $aiAnalysis): string
    {
        $text = strtolower(
            ($aiAnalysis['description'] ?? '') . ' ' .
            ($aiAnalysis['title'] ?? '') . ' ' .
            ($aiAnalysis['document_type'] ?? '') . ' ' .
            ($aiAnalysis['suggested_folder'] ?? '')
        );

        // Employment-related keywords
        $employmentKeywords = [
            'certificate of employment', 'employment certificate', 
            'employed', 'employer', 'employee', 'compensation',
            'company', 'corporation', 'inc.', 'ventures',
            'work', 'salary', 'hired', 'resignation', 'termination'
        ];

        // Student-related keywords (ONLY for actual student documents)
        $studentKeywords = [
            'transcript', 'enrollment', 'grades', 'semester',
            'school year', 'student id', 'registrar', 'dean',
            'college', 'university', 'academic', 'curriculum'
        ];

        // Affidavit keywords
        $affidavitKeywords = ['affidavit', 'sworn', 'deponent', 'affiant'];

        // Criminal case keywords
        $criminalKeywords = ['criminal case', 'accused', 'prosecution', 'felony'];

        // Contract keywords
        $contractKeywords = ['memorandum of agreement', 'moa', 'contract'];

        // Check each type (order matters - more specific first)
        foreach ($employmentKeywords as $kw) {
            if (strpos($text, $kw) !== false) {
                return 'employment';
            }
        }
        foreach ($affidavitKeywords as $kw) {
            if (strpos($text, $kw) !== false) {
                return 'affidavit';
            }
        }
        foreach ($criminalKeywords as $kw) {
            if (strpos($text, $kw) !== false) {
                return 'criminal';
            }
        }
        foreach ($contractKeywords as $kw) {
            if (strpos($text, $kw) !== false) {
                return 'contract';
            }
        }
        foreach ($studentKeywords as $kw) {
            if (strpos($text, $kw) !== false) {
                return 'student';
            }
        }

        return 'general';
    }

    /**
     * Check if a folder is valid for a given document type
     * This prevents mismatches like employment docs going to Student Records
     */
    private function isValidFolderForDocType(string $folderName, string $docType): bool
    {
        $folderLower = strtolower($folderName);

        // Employment documents should NOT go to Student/School folders
        if ($docType === 'employment') {
            if (strpos($folderLower, 'student') !== false || strpos($folderLower, 'school') !== false) {
                return false;
            }
        }

        // Affidavits should NOT go to Student Records
        if ($docType === 'affidavit') {
            if (strpos($folderLower, 'student') !== false) {
                return false;
            }
        }

        // Student documents should NOT go to Criminal/MOA folders
        if ($docType === 'student') {
            if (strpos($folderLower, 'criminal') !== false || strpos($folderLower, 'moa') !== false) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get keyword to folder mappings
     */
    private function getKeywordMappings(): array
    {
        return [
            // MOA folder keywords
            'memorandum' => 'MOA',
            'agreement' => 'MOA',
            'resolution' => 'MOA',
            'moa' => 'MOA',
            'memorandum of agreement' => 'MOA',

            // Criminal folder keywords
            'criminal' => 'CRIMINAL',
            'felony' => 'CRIMINAL',
            'misdemeanor' => 'CRIMINAL',
            'arrest' => 'CRIMINAL',
            'indictment' => 'CRIMINAL',

            // Civil Cases folder keywords
            'civil' => 'Civil Cases',
            'lawsuit' => 'Civil Cases',
            'complaint' => 'Civil Cases',
            'petition' => 'Civil Cases',
            'litigation' => 'Civil Cases',

            // Certificate/Employment keywords
            'certificate of employment' => 'Certificates',
            'employment certificate' => 'Certificates',
            'certificate' => 'Certificates',
        ];
    }

    /**
     * Get all available folders
     */
    public function getAvailableFolders(): array
    {
        return Folder::pluck('folder_name')->toArray();
    }

    /**
     * Validate folder exists
     */
    public function folderExists(int $folderId): bool
    {
        return Folder::where('folder_id', $folderId)->exists();
    }
}

