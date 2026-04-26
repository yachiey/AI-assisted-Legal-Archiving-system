import { useState, useRef, useCallback } from 'react';
import { router } from '@inertiajs/react';
import { UploadedFile } from '../types/types';
import { validateFileType, validateFileSize } from '../utils/fileUtils';

interface UseMultiFileUploadProps {
    maxFileSize?: number;
    acceptedFileTypes?: string;
    minFiles?: number;
    onUploadSuccess?: (files: UploadedFile[]) => void;
    onUploadError?: (error: string) => void;
    onUploadProgress?: (current: number, total: number, fileName: string) => void;
}

interface UploadProgress {
    current: number;
    total: number;
    currentFileName: string;
    status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
    errorMessage?: string;
}

interface DuplicateDocument {
    doc_id: number;
    title: string;
    folder_name: string;
    folder_id: number | null;
    fileName: string;
}

// Session storage key for document queue
const DOCUMENT_QUEUE_KEY = 'document_upload_queue';

/**
 * Custom hook for handling multiple file uploads with sequential processing.
 * Each file is uploaded and processed one at a time for reliability.
 */
export const useMultiFileUpload = ({
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    acceptedFileTypes = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
    minFiles = 1,
    onUploadSuccess,
    onUploadError,
    onUploadProgress
}: UseMultiFileUploadProps = {}) => {
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [duplicateDocument, setDuplicateDocument] = useState<DuplicateDocument | null>(null);
    const [progress, setProgress] = useState<UploadProgress>({
        current: 0,
        total: 0,
        currentFileName: '',
        status: 'idle'
    });
    const fileInputRef = useRef<HTMLInputElement>(null);
    const pendingDuplicateResolveRef = useRef<((action: 'scan' | 'skip' | 'cancel') => void) | null>(null);

    const pauseForDuplicateAction = (): Promise<'scan' | 'skip' | 'cancel'> => {
        return new Promise(resolve => {
            pendingDuplicateResolveRef.current = resolve;
        });
    };

    const handleDuplicateAction = useCallback((action: 'scan' | 'skip' | 'cancel') => {
        if (pendingDuplicateResolveRef.current) {
            pendingDuplicateResolveRef.current(action);
            pendingDuplicateResolveRef.current = null;
        }
    }, []);

    /**
     * Validate and add files to the upload queue
     */
    const handleFilesSelect = (files: FileList | File[]) => {
        const fileArray = Array.from(files);
        const validFiles: UploadedFile[] = [];
        const errors: string[] = [];

        fileArray.forEach(file => {
            // Validate file type
            if (!validateFileType(file, acceptedFileTypes)) {
                errors.push(`${file.name}: Invalid file type`);
                return;
            }

            // Validate file size
            if (!validateFileSize(file, maxFileSize)) {
                errors.push(`${file.name}: Exceeds ${maxFileSize / (1024 * 1024)}MB limit`);
                return;
            }

            // Check for duplicates
            const isDuplicate = uploadedFiles.some(f => f.name === file.name && f.size === file.size);
            if (isDuplicate) {
                errors.push(`${file.name}: Already added`);
                return;
            }

            validFiles.push({
                name: file.name,
                size: file.size,
                type: file.type,
                file: file
            });
        });

        if (errors.length > 0) {
            onUploadError?.(errors.join('\n'));
        }

        if (validFiles.length > 0) {
            setUploadedFiles(prev => [...prev, ...validFiles]);
        }
    };

    /**
     * Remove a file from the upload queue
     */
    const removeFile = (index: number) => {
        setUploadedFiles(prev => prev.filter((_, i) => i !== index));
    };

    /**
     * Clear all files from the upload queue
     */
    const clearFiles = () => {
        setUploadedFiles([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    /**
     * Upload a single file to the server
     */
    const uploadSingleFile = async (file: UploadedFile): Promise<number | { duplicate: DuplicateDocument }> => {
        const formData = new FormData();
        formData.append('file', file.file);

        const token = localStorage.getItem('auth_token');

        const response = await fetch('/api/upload', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        let responseData;
        try {
            responseData = await response.json();
        } catch (e) {
            responseData = {};
        }

        // Handle duplicate document (409 Conflict)
        if (response.status === 409 && responseData.duplicate) {
            return {
                duplicate: {
                    ...responseData.existing_document,
                    fileName: file.name,
                }
            };
        }

        // Map Permissions Error natively
        if (response.status === 403) {
            throw new Error("You don't have permission to upload documents.");
        }

        if (!response.ok) {
            throw new Error(responseData.message || `Upload failed for ${file.name}`);
        }

        if (responseData.success && responseData.document?.id) {
            return responseData.document.id;
        }

        throw new Error(`No document ID returned for ${file.name}`);
    };

    /**
     * Upload all files sequentially and navigate to AI processing
     */
    const handleConfirmUpload = async () => {
        if (uploadedFiles.length === 0) {
            onUploadError?.('Please select at least one file');
            return;
        }

        if (uploadedFiles.length < minFiles) {
            onUploadError?.(`Please select at least ${minFiles} files`);
            return;
        }

        setIsUploading(true);
        const documentIds: number[] = [];
        const totalFiles = uploadedFiles.length;

        setProgress({
            current: 0,
            total: totalFiles,
            currentFileName: uploadedFiles[0]?.name || '',
            status: 'uploading'
        });

        try {
            // Upload files sequentially
            for (let i = 0; i < totalFiles; i++) {
                const file = uploadedFiles[i];

                setProgress({
                    current: i + 1,
                    total: totalFiles,
                    currentFileName: file.name,
                    status: 'processing'
                });

                onUploadProgress?.(i + 1, totalFiles, file.name);

                try {
                    const result = await uploadSingleFile(file);
                    
                    if (typeof result === 'object' && result !== null && 'duplicate' in result) {
                        // Duplicate detected
                        setDuplicateDocument(result.duplicate);
                        
                        // Wait for user action
                        const action = await pauseForDuplicateAction();
                        
                        setDuplicateDocument(null);
                        
                        if (action === 'cancel') {
                            setIsUploading(false);
                            return;
                        } else if (action === 'skip') {
                            // Continue to next file
                            continue;
                        } else if (action === 'scan') {
                            // Navigate to AI processing with this explicit duplicate document
                            setUploadedFiles([]);
                            setIsUploading(false);
                            router.visit(`/ai-processing?docId=${result.duplicate.doc_id}`);
                            return;
                        }
                    } else if (typeof result === 'number') {
                        documentIds.push(result);
                    }
                } catch (fileError) {
                    console.error(`Failed to upload ${file.name}:`, fileError);
                    
                    // Completely abort the upload logic if it is a permissions issue
                    if (fileError instanceof Error && fileError.message.includes("permission to upload")) {
                        throw fileError;
                    }
                    
                    // Continue with other files even if one fails
                }
            }

            if (documentIds.length === 0) {
                throw new Error('All uploads failed');
            }

            // Store document queue in session storage
            const queue = {
                documentIds,
                currentIndex: 0,
                totalCount: documentIds.length
            };
            sessionStorage.setItem(DOCUMENT_QUEUE_KEY, JSON.stringify(queue));

            setProgress({
                current: totalFiles,
                total: totalFiles,
                currentFileName: '',
                status: 'completed'
            });

            onUploadSuccess?.(uploadedFiles);

            // Clear files and navigate to AI processing with first document
            setUploadedFiles([]);
            router.visit(`/ai-processing?docId=${documentIds[0]}`);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setProgress({
                current: 0,
                total: totalFiles,
                currentFileName: '',
                status: 'error',
                errorMessage
            });
            onUploadError?.(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

    /**
     * Dismiss the duplicate document notification and cancel the queue
     */
    const dismissDuplicate = () => {
        handleDuplicateAction('cancel');
    };

    /**
     * Skip the duplicate and continue handling the rest of the queue
     */
    const handleSkipAndContinue = () => {
        handleDuplicateAction('skip');
    };

    /**
     * Scan this duplicate (stopping everything else)
     */
    const handleProceedToScan = () => {
        handleDuplicateAction('scan');
    };

    /**
     * Cancel the upload process
     */
    const handleCancelUpload = () => {
        setUploadedFiles([]);
        setProgress({
            current: 0,
            total: 0,
            currentFileName: '',
            status: 'idle'
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return {
        uploadedFiles,
        isDragging,
        isUploading,
        progress,
        duplicateDocument,
        fileInputRef,
        fileCount: uploadedFiles.length,
        totalSize: uploadedFiles.reduce((acc, f) => acc + f.size, 0),
        setIsDragging,
        handleFilesSelect,
        removeFile,
        clearFiles,
        handleConfirmUpload,
        handleCancelUpload,
        dismissDuplicate,
        handleSkipAndContinue,
        handleProceedToScan
    };
};

export default useMultiFileUpload;
