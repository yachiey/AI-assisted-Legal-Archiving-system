import React, { DragEvent, ChangeEvent } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle, Loader, Copy, FolderOpen } from 'lucide-react';
import { useMultiFileUpload } from '../../hooks/useMultiFileUpload';

interface MultiFileUploadUIProps {
    maxFileSize?: number;
    acceptedFileTypes?: string;
    minFiles?: number;
    maxFiles?: number;
    onUploadSuccess?: () => void;
    onUploadError?: (error: string) => void;
}

/**
 * Multi-file upload component that allows users to select and upload multiple documents at once.
 * Shows file list, progress during upload, and handles drag-and-drop.
 */
const MultiFileUploadUI: React.FC<MultiFileUploadUIProps> = ({
    maxFileSize = 50 * 1024 * 1024,
    acceptedFileTypes = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png',
    minFiles = 1,
    maxFiles = 5,
    onUploadSuccess,
    onUploadError
}) => {
    const {
        uploadedFiles,
        isDragging,
        isUploading,
        progress,
        duplicateDocument,
        fileInputRef,
        fileCount,
        totalSize,
        setIsDragging,
        handleFilesSelect,
        removeFile,
        clearFiles,
        handleConfirmUpload,
        handleCancelUpload,
        dismissDuplicate
    } = useMultiFileUpload({
        maxFileSize,
        acceptedFileTypes,
        minFiles,
        maxFiles,
        onUploadSuccess: () => onUploadSuccess?.(),
        onUploadError: (error) => onUploadError?.(error)
    });

    const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFilesSelect(files);
        }
    };

    const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleFilesSelect(files);
        }
        // Reset input to allow selecting same files again
        e.target.value = '';
    };

    const handleBrowseFiles = () => {
        fileInputRef.current?.click();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="w-full">
            {/* File count info */}
            {fileCount > 0 && (
                <p className="text-sm text-gray-600 mb-4">
                    {fileCount} of {maxFiles} file{fileCount !== 1 ? 's' : ''} selected • {formatFileSize(totalSize)}
                </p>
            )}

            {/* Drag and Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${isDragging
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-300 hover:border-green-400 bg-gray-50'
                    }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileInputChange}
                    className="hidden"
                    accept={acceptedFileTypes}
                    multiple
                />

                <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-gradient-to-br from-green-100 to-emerald-100">
                        <Upload className="w-8 h-8 text-green-600" />
                    </div>
                    <div>
                        <p className="text-gray-800 font-medium mb-1">
                            Drag and drop your files here
                        </p>
                        <p className="text-gray-500 text-sm">
                            or{' '}
                            <button
                                onClick={handleBrowseFiles}
                                className="text-green-600 hover:text-green-700 underline font-medium"
                            >
                                browse files
                            </button>
                        </p>
                    </div>
                    <p className="text-gray-400 text-xs">
                        Supported: PDF, DOC, DOCX, TXT, JPG, PNG • Max {formatFileSize(maxFileSize)} each
                    </p>
                </div>
            </div>

            {/* File List */}
            {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3"
                        >
                            <div className="flex items-center gap-3 min-w-0">
                                <FileText className="w-5 h-5 text-green-600 flex-shrink-0" />
                                <div className="min-w-0">
                                    <p className="text-gray-800 text-sm font-medium truncate">
                                        {file.name}
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                disabled={isUploading}
                                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-50"
                            >
                                <X className="w-4 h-4 text-red-500" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Progress */}
            {isUploading && progress.status !== 'idle' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-800 text-sm font-medium">
                            {progress.status === 'processing' ? 'Processing' : 'Uploading'}...
                        </span>
                        <span className="text-gray-600 text-sm">
                            {progress.current} of {progress.total}
                        </span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-full rounded-full transition-all duration-300"
                            style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                    </div>

                    {progress.currentFileName && (
                        <p className="text-gray-600 text-xs mt-2 truncate">
                            <Loader className="w-3 h-3 inline animate-spin mr-1" />
                            {progress.currentFileName}
                        </p>
                    )}
                </div>
            )}

            {/* Error Message */}
            {progress.status === 'error' && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-red-700 text-sm">{progress.errorMessage}</span>
                    </div>
                </div>
            )}

            {/* Success Message */}
            {progress.status === 'completed' && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 text-sm">
                            All files uploaded successfully! Redirecting to AI processing...
                        </span>
                    </div>
                </div>
            )}

            {/* Duplicate Document Notification */}
            {duplicateDocument && (
                <div className="mt-4 bg-amber-50 border border-amber-300 rounded-xl p-5">
                    <div className="flex items-start gap-3">
                        <Copy className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                            <h4 className="text-amber-800 font-semibold text-sm mb-1">
                                Duplicate Document Detected
                            </h4>
                            <p className="text-amber-700 text-sm mb-3">
                                <span className="font-medium">"{duplicateDocument.fileName}"</span> already exists in the system.
                            </p>
                            <div className="bg-white/70 rounded-lg p-3 border border-amber-200 space-y-1.5">
                                <p className="text-gray-800 text-sm">
                                    <span className="text-gray-500">Title:</span>{' '}
                                    <span className="font-medium">{duplicateDocument.title}</span>
                                </p>
                                <p className="text-gray-800 text-sm flex items-center gap-1.5">
                                    <FolderOpen className="w-3.5 h-3.5 text-gray-400" />
                                    <span className="text-gray-500">Location:</span>{' '}
                                    <span className="font-medium">{duplicateDocument.folder_name}</span>
                                </p>
                            </div>
                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={dismissDuplicate}
                                    className="px-4 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 text-sm font-medium transition-colors"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            {uploadedFiles.length > 0 && (
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={handleConfirmUpload}
                        disabled={isUploading || uploadedFiles.length < minFiles}
                        className="flex-1 py-3 rounded-lg font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                            background: isUploading
                                ? 'linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%)'
                                : 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)'
                        }}
                    >
                        {isUploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader className="w-4 h-4 animate-spin" />
                                Processing {progress.current}/{progress.total}...
                            </span>
                        ) : (
                            `Upload ${fileCount} Document${fileCount !== 1 ? 's' : ''}`
                        )}
                    </button>

                    <button
                        onClick={handleCancelUpload}
                        disabled={isUploading}
                        className="px-6 py-3 rounded-lg font-semibold text-gray-600 hover:text-gray-800 transition-all duration-200 border border-gray-300 hover:border-gray-400 disabled:opacity-50"
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default MultiFileUploadUI;
