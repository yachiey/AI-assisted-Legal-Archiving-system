<?php

namespace App\Services;

use App\Models\Document;
use App\Models\DocumentEmbedding;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

/**
 * Service for handling document file storage operations
 */
class DocumentStorageService
{
    /**
     * Get document content for viewing
     */
    public function getDocumentContent(Document $document): array
    {
        $filePath = $document->file_path;
        $storagePath = Storage::disk('documents')->path($filePath);

        // Check if file exists
        if (!Storage::disk('documents')->exists($filePath)) {
            throw new \Exception('Document file not found');
        }

        // Get file info
        $mimeType = Storage::disk('documents')->mimeType($filePath);
        $size = Storage::disk('documents')->size($filePath);
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        return [
            'path' => $storagePath,
            'mime_type' => $mimeType,
            'size' => $size,
            'extension' => $extension
        ];
    }

    /**
     * Get file content as response based on file type
     */
    public function getFileResponse(Document $document, array $fileInfo)
    {
        $extension = $fileInfo['extension'];
        $storagePath = $fileInfo['path'];
        $mimeType = $fileInfo['mime_type'];

        // Handle different file types
        switch ($extension) {
            case 'pdf':
                return response()->file($storagePath, [
                    'Content-Type' => 'application/pdf',
                    'Content-Disposition' => 'inline; filename="' . basename($document->title) . '.pdf"',
                    'Access-Control-Allow-Origin' => '*',
                    'Access-Control-Allow-Methods' => 'GET',
                    'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                    'Cache-Control' => 'no-cache, must-revalidate'
                ]);

            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
            case 'bmp':
            case 'webp':
                return response()->file($storagePath, [
                    'Content-Type' => $mimeType,
                    'Content-Disposition' => 'inline; filename="' . basename($document->title) . '.' . $extension . '"',
                    'Access-Control-Allow-Origin' => '*',
                    'Access-Control-Allow-Methods' => 'GET',
                    'Access-Control-Allow-Headers' => 'Content-Type, Authorization',
                    'Cache-Control' => 'no-cache, must-revalidate'
                ]);

            case 'txt':
            case 'md':
            case 'csv':
                $content = Storage::disk('documents')->get($document->file_path);
                return response()->json([
                    'success' => true,
                    'content' => $content,
                    'type' => 'text',
                    'mime_type' => $mimeType,
                    'size' => $fileInfo['size']
                ])->header('Access-Control-Allow-Origin', '*');

            case 'doc':
            case 'docx':
                return response()->json([
                    'success' => false,
                    'error' => 'Word documents cannot be previewed. Please download to view.',
                    'file_type' => $extension
                ])->header('Access-Control-Allow-Origin', '*');

            default:
                return response()->json([
                    'success' => false,
                    'error' => 'File type not supported for preview',
                    'file_type' => $extension,
                    'mime_type' => $mimeType
                ])->header('Access-Control-Allow-Origin', '*');
        }
    }

    /**
     * Stream document content as base64 to bypass ad blockers
     */
    public function streamContent(Document $document): array
    {
        $filePath = $document->file_path;

        if (!Storage::disk('documents')->exists($filePath)) {
            throw new \Exception('Document file not found');
        }

        $mimeType = Storage::disk('documents')->mimeType($filePath);
        $extension = strtolower(pathinfo($filePath, PATHINFO_EXTENSION));

        // For text files, return content directly
        if (in_array($extension, ['txt', 'md', 'csv', 'json', 'xml', 'html'])) {
            $content = Storage::disk('documents')->get($filePath);
            return [
                'success' => true,
                'content' => $content,
                'type' => 'text',
                'mime_type' => $mimeType,
                'extension' => $extension
            ];
        }

        // For binary files (PDF, images), encode as base64
        $fileContent = Storage::disk('documents')->get($filePath);
        $base64Content = base64_encode($fileContent);

        return [
            'success' => true,
            'content' => $base64Content,
            'type' => 'binary',
            'mime_type' => $mimeType,
            'extension' => $extension,
            'encoding' => 'base64',
            'filename' => $document->title,
            'size' => strlen($fileContent)
        ];
    }

    /**
     * Delete physical file and related data
     */
    public function deleteDocument(Document $document): void
    {
        // Delete physical file
        try {
            if (Storage::disk('documents')->exists($document->file_path)) {
                Storage::disk('documents')->delete($document->file_path);
                Log::info('Physical file deleted', [
                    'doc_id' => $document->doc_id,
                    'file_path' => $document->file_path
                ]);
            }
        } catch (\Exception $e) {
            Log::warning('Failed to delete physical file', [
                'doc_id' => $document->doc_id,
                'file_path' => $document->file_path,
                'error' => $e->getMessage()
            ]);
        }

        // Delete document embeddings if they exist
        DocumentEmbedding::where('doc_id', $document->doc_id)->delete();
    }

    /**
     * Get document text from embeddings or extract from file
     */
    public function getDocumentText(Document $document): string
    {
        // Get text from embeddings (chunk_text field)
        $embeddings = DocumentEmbedding::where('doc_id', $document->doc_id)
            ->orderBy('chunk_index')
            ->get();

        $fullText = '';
        foreach ($embeddings as $embedding) {
            $fullText .= $embedding->chunk_text . ' ';
        }

        // If no text in embeddings, try to extract from file
        if (empty(trim($fullText))) {
            $fullPath = Storage::disk('documents')->path($document->file_path);
            if (file_exists($fullPath)) {
                $mimeType = mime_content_type($fullPath);
                // Use DocumentProcessingService for extraction
                $processingService = app(DocumentProcessingService::class);
                $fullText = $processingService->extractTextFromFile($fullPath, $mimeType);
            }
        }

        return trim($fullText);
    }

    /**
     * Store file from upload
     */
    public function storeUploadedFile($file, ?int $folderId): string
    {
        $folderPath = '';
        if ($folderId) {
            $folder = \App\Models\Folder::find($folderId);
            if ($folder) {
                $folderPath = $folder->folder_name;
            }
        }

        // Sanitize filename to be safe
        $originalName = pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME);
        $extension = $file->getClientOriginalExtension();
        $safeName = $this->sanitizeFileName($originalName);
        $fileName = $safeName . '.' . $extension;

        // Check for collisions
        if (Storage::disk('documents')->exists($folderPath ? $folderPath . '/' . $fileName : $fileName)) {
             $fileName = $safeName . '_' . time() . '.' . $extension;
        }

        // Store the file in the appropriate folder with explicit name
        // This avoids the random hash filenames like "WiYbRb..."
        return $file->storeAs($folderPath, $fileName, 'documents');
    }

    /**
     * Rename document file to match the title
     * Returns the new file path or the original if rename fails
     */
    public function renameFileToTitle(Document $document, string $newTitle): string
    {
        try {
            $currentPath = $document->file_path;

            // Check if file exists
            if (!Storage::disk('documents')->exists($currentPath)) {
                Log::warning('Cannot rename file - file not found', [
                    'doc_id' => $document->doc_id,
                    'current_path' => $currentPath
                ]);
                return $currentPath;
            }

            // Get file extension from current path
            $extension = strtolower(pathinfo($currentPath, PATHINFO_EXTENSION));
            $currentDir = dirname($currentPath);

            // Sanitize the title for use as filename
            $sanitizedTitle = $this->sanitizeFileName($newTitle);

            // Build new filename with extension
            $newFileName = $sanitizedTitle . '.' . $extension;

            // Build new path (keep in same directory)
            $newPath = $currentDir === '.' ? $newFileName : $currentDir . '/' . $newFileName;

            // Check if we're actually changing the filename
            if ($currentPath === $newPath) {
                return $currentPath;
            }

            // Check if a file with the new name already exists
            if (Storage::disk('documents')->exists($newPath)) {
                // Add timestamp to make unique
                $timestamp = time();
                $newFileName = $sanitizedTitle . '_' . $timestamp . '.' . $extension;
                $newPath = $currentDir === '.' ? $newFileName : $currentDir . '/' . $newFileName;
            }

            // Perform the rename (move)
            Storage::disk('documents')->move($currentPath, $newPath);

            Log::info('File renamed successfully', [
                'doc_id' => $document->doc_id,
                'from' => $currentPath,
                'to' => $newPath,
                'new_title' => $newTitle
            ]);

            return $newPath;

        } catch (\Exception $e) {
            Log::error('Failed to rename file', [
                'doc_id' => $document->doc_id,
                'error' => $e->getMessage(),
                'current_path' => $document->file_path
            ]);

            // Return original path if rename fails
            return $document->file_path;
        }
    }

    /**
     * Sanitize a string for use as a filename
     */
    public function sanitizeFileName(string $name): string
    {
        // Remove or replace invalid filename characters
        $sanitized = preg_replace('/[<>:"\/\\|?*]/', '', $name);

        // Replace multiple spaces with single space
        $sanitized = preg_replace('/\s+/', ' ', $sanitized);

        // Trim whitespace
        $sanitized = trim($sanitized);

        // Limit length (leave room for extension and timestamp)
        $sanitized = mb_substr($sanitized, 0, 200);

        // If empty after sanitization, use a default name
        if (empty($sanitized)) {
            $sanitized = 'document_' . time();
        }

        return $sanitized;
    }
}
