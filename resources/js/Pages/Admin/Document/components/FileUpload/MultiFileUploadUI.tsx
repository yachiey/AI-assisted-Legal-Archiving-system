import React, { ChangeEvent, DragEvent } from 'react';
import {
    AlertCircle,
    CheckCircle,
    Copy,
    FileText,
    FolderOpen,
    Loader,
    Upload,
    X,
} from 'lucide-react';
import { useMultiFileUpload } from '../../hooks/useMultiFileUpload';
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

interface MultiFileUploadUIProps {
    maxFileSize?: number;
    acceptedFileTypes?: string;
    minFiles?: number;
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
    onUploadSuccess,
    onUploadError,
}) => {
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

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
        handleConfirmUpload,
        handleCancelUpload,
        dismissDuplicate,
        handleSkipAndContinue,
        handleProceedToScan
    } = useMultiFileUpload({
        maxFileSize,
        acceptedFileTypes,
        minFiles,
        onUploadSuccess: () => onUploadSuccess?.(),
        onUploadError: (error) => onUploadError?.(error),
    });

    const hasRemainingFiles = progress.total > progress.current;

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
            {fileCount > 0 && (
                <p
                    className={`mb-4 text-sm ${
                        isDashboardThemeEnabled
                            ? 'text-base-content/65'
                            : 'text-gray-600'
                    }`}
                >
                    {fileCount} file{fileCount !== 1 ? 's' : ''} selected •{' '}
                    {formatFileSize(totalSize)}
                </p>
            )}

            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative rounded-xl border-2 border-dashed p-8 text-center transition-all duration-300 ${
                    isDragging
                        ? isDashboardThemeEnabled
                            ? 'border-primary bg-primary/10'
                            : 'border-green-500 bg-green-50'
                        : isDashboardThemeEnabled
                          ? 'border-base-300 bg-base-200/60 hover:border-primary/45'
                          : 'border-gray-300 bg-gray-50 hover:border-green-400'
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
                    <div
                        className={`rounded-full p-4 ${
                            isDashboardThemeEnabled
                                ? 'bg-primary/10'
                                : 'bg-gradient-to-br from-green-100 to-emerald-100'
                        }`}
                    >
                        <Upload
                            className={`h-8 w-8 ${
                                isDashboardThemeEnabled
                                    ? 'text-primary'
                                    : 'text-green-600'
                            }`}
                        />
                    </div>
                    <div>
                        <p
                            className={`mb-1 font-medium ${
                                isDashboardThemeEnabled
                                    ? 'text-base-content'
                                    : 'text-gray-800'
                            }`}
                        >
                            Drag and drop your files here
                        </p>
                        <p
                            className={`text-sm ${
                                isDashboardThemeEnabled
                                    ? 'text-base-content/60'
                                    : 'text-gray-500'
                            }`}
                        >
                            or{' '}
                            <button
                                onClick={handleBrowseFiles}
                                className={`font-medium underline ${
                                    isDashboardThemeEnabled
                                        ? 'text-primary hover:text-primary/80'
                                        : 'text-green-600 hover:text-green-700'
                                }`}
                            >
                                browse files
                            </button>
                        </p>
                    </div>
                    <p
                        className={`text-xs ${
                            isDashboardThemeEnabled
                                ? 'text-base-content/45'
                                : 'text-gray-400'
                        }`}
                    >
                        Supported: PDF, DOC, DOCX, TXT, JPG, PNG • Max{' '}
                        {formatFileSize(maxFileSize)} each
                    </p>
                </div>
            </div>

            {uploadedFiles.length > 0 && (
                <div className="mt-4 max-h-48 space-y-2 overflow-y-auto">
                    {uploadedFiles.map((file, index) => (
                        <div
                            key={`${file.name}-${index}`}
                            className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                                isDashboardThemeEnabled
                                    ? 'bg-base-200'
                                    : 'bg-gray-100'
                            }`}
                        >
                            <div className="min-w-0 flex items-center gap-3">
                                <FileText
                                    className={`h-5 w-5 flex-shrink-0 ${
                                        isDashboardThemeEnabled
                                            ? 'text-primary'
                                            : 'text-green-600'
                                    }`}
                                />
                                <div className="min-w-0">
                                    <p
                                        className={`truncate text-sm font-medium ${
                                            isDashboardThemeEnabled
                                                ? 'text-base-content'
                                                : 'text-gray-800'
                                        }`}
                                    >
                                        {file.name}
                                    </p>
                                    <p
                                        className={`text-xs ${
                                            isDashboardThemeEnabled
                                                ? 'text-base-content/55'
                                                : 'text-gray-500'
                                        }`}
                                    >
                                        {formatFileSize(file.size)}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => removeFile(index)}
                                disabled={isUploading}
                                className={`rounded-lg p-1.5 transition-colors disabled:opacity-50 ${
                                    isDashboardThemeEnabled
                                        ? 'hover:bg-error/10'
                                        : 'hover:bg-red-100'
                                }`}
                            >
                                <X
                                    className={`h-4 w-4 ${
                                        isDashboardThemeEnabled
                                            ? 'text-error'
                                            : 'text-red-500'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {isUploading && progress.status !== 'idle' && (
                <div
                    className={`mt-4 rounded-xl border p-4 ${
                        isDashboardThemeEnabled
                            ? 'border-primary/20 bg-primary/10'
                            : 'border-green-200 bg-green-50'
                    }`}
                >
                    <div className="mb-2 flex items-center justify-between">
                        <span
                            className={`text-sm font-medium ${
                                isDashboardThemeEnabled
                                    ? 'text-base-content'
                                    : 'text-gray-800'
                            }`}
                        >
                            {progress.status === 'processing'
                                ? 'Processing'
                                : 'Uploading'}
                            ...
                        </span>
                        <span
                            className={`text-sm ${
                                isDashboardThemeEnabled
                                    ? 'text-base-content/60'
                                    : 'text-gray-600'
                            }`}
                        >
                            {progress.current} of {progress.total}
                        </span>
                    </div>

                    <div
                        className={`h-2 w-full overflow-hidden rounded-full ${
                            isDashboardThemeEnabled
                                ? 'bg-base-300'
                                : 'bg-gray-200'
                        }`}
                    >
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${
                                isDashboardThemeEnabled
                                    ? 'bg-primary'
                                    : 'bg-gradient-to-r from-green-500 to-emerald-500'
                            }`}
                            style={{
                                width: `${(progress.current / progress.total) * 100}%`,
                            }}
                        />
                    </div>

                    {progress.currentFileName && (
                        <p
                            className={`mt-2 truncate text-xs ${
                                isDashboardThemeEnabled
                                    ? 'text-base-content/60'
                                    : 'text-gray-600'
                            }`}
                        >
                            <Loader className="mr-1 inline h-3 w-3 animate-spin" />
                            {progress.currentFileName}
                        </p>
                    )}
                </div>
            )}

            {progress.status === 'error' && (
                <div
                    className={`mt-4 rounded-lg border p-4 ${
                        isDashboardThemeEnabled
                            ? 'border-error/25 bg-error/10'
                            : 'border-red-200 bg-red-50'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <AlertCircle
                            className={`h-5 w-5 ${
                                isDashboardThemeEnabled
                                    ? 'text-error'
                                    : 'text-red-500'
                            }`}
                        />
                        <span
                            className={`text-sm ${
                                isDashboardThemeEnabled
                                    ? 'text-error'
                                    : 'text-red-700'
                            }`}
                        >
                            {progress.errorMessage}
                        </span>
                    </div>
                </div>
            )}

            {progress.status === 'completed' && (
                <div
                    className={`mt-4 rounded-lg border p-4 ${
                        isDashboardThemeEnabled
                            ? 'border-success/25 bg-success/10'
                            : 'border-green-200 bg-green-50'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <CheckCircle
                            className={`h-5 w-5 ${
                                isDashboardThemeEnabled
                                    ? 'text-success'
                                    : 'text-green-600'
                            }`}
                        />
                        <span
                            className={`text-sm ${
                                isDashboardThemeEnabled
                                    ? 'text-success'
                                    : 'text-green-700'
                            }`}
                        >
                            All files uploaded successfully! Redirecting to AI
                            processing...
                        </span>
                    </div>
                </div>
            )}

            {duplicateDocument && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity">
                    <div
                        className={`relative w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl ${
                            isDashboardThemeEnabled
                                ? 'bg-base-100 border border-base-300'
                                : 'bg-white border border-gray-200'
                        }`}
                    >
                        <div
                            className={`px-6 py-4 flex items-center gap-3 border-b ${
                                isDashboardThemeEnabled
                                    ? 'border-base-300 bg-base-200/50'
                                    : 'border-gray-100 bg-gray-50/80'
                            }`}
                        >
                            <div className={`p-2 rounded-full ${isDashboardThemeEnabled ? 'bg-warning/20' : 'bg-amber-100'}`}>
                                <AlertCircle
                                    className={`h-6 w-6 ${
                                        isDashboardThemeEnabled
                                            ? 'text-warning'
                                            : 'text-amber-600'
                                    }`}
                                />
                            </div>
                            <h3
                                className={`text-lg font-bold ${
                                    isDashboardThemeEnabled
                                        ? 'text-base-content'
                                        : 'text-gray-900'
                                }`}
                            >
                                Duplicate Document Detected
                            </h3>
                        </div>

                        <div className="px-6 py-6 border-b border-opacity-10 border-base-content/10">
                            <p
                                className={`mb-4 text-sm ${
                                    isDashboardThemeEnabled
                                        ? 'text-base-content/80'
                                        : 'text-gray-600'
                                }`}
                            >
                                The file <span className="font-semibold px-1.5 py-0.5 rounded bg-base-300/50 text-base-content">{duplicateDocument.fileName}</span> already exists in the system.
                            </p>
                            
                            <div
                                className={`space-y-3 rounded-xl border p-4 ${
                                    isDashboardThemeEnabled
                                        ? 'border-base-300 bg-base-200/50'
                                        : 'border-gray-200 bg-gray-50'
                                }`}
                            >
                                <div>
                                    <p className={`text-xs uppercase tracking-wider font-semibold mb-1 ${isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-500'}`}>
                                        System Title
                                    </p>
                                    <p className={`text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-800'}`}>
                                        {duplicateDocument.title}
                                    </p>
                                </div>
                                <div className="h-px w-full bg-base-300/50"></div>
                                <div>
                                    <p className={`text-xs uppercase tracking-wider font-semibold mb-1 flex items-center gap-1 ${isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-500'}`}>
                                        <FolderOpen className="w-3.5 h-3.5" /> Location
                                    </p>
                                    <p className={`text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-800'}`}>
                                        {duplicateDocument.folder_name}
                                    </p>
                                </div>
                            </div>
                            
                            {hasRemainingFiles && (
                                <p className={`mt-5 text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}`}>
                                    You have {progress.total - progress.current} more file{progress.total - progress.current !== 1 ? 's' : ''} in the upload queue. How would you like to proceed?
                                </p>
                            )}
                        </div>

                        <div
                            className={`px-6 py-5 flex flex-wrap-reverse items-center justify-end gap-3 ${
                                isDashboardThemeEnabled
                                    ? 'bg-base-200/30'
                                    : 'bg-gray-50/50'
                            }`}
                        >
                            <button
                                onClick={dismissDuplicate}
                                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                                    isDashboardThemeEnabled
                                        ? 'text-base-content/70 hover:bg-base-300 hover:text-base-content'
                                        : 'text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                                }`}
                            >
                                Cancel Upload
                            </button>
                            
                            <button
                                onClick={handleProceedToScan}
                                className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm ${
                                    isDashboardThemeEnabled
                                        ? 'bg-base-300 text-base-content hover:bg-base-content/20'
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Proceed to Scan
                            </button>
                            
                            {hasRemainingFiles && (
                                <button
                                    onClick={handleSkipAndContinue}
                                    className={`px-5 py-2.5 rounded-xl font-medium text-sm text-white shadow-sm transition-transform active:scale-95 ${
                                        isDashboardThemeEnabled
                                            ? 'bg-primary hover:bg-primary/90'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    Skip & Continue
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {uploadedFiles.length > 0 && (
                <div className="mt-6 flex gap-3">
                    <button
                        onClick={handleConfirmUpload}
                        disabled={isUploading || uploadedFiles.length < minFiles}
                        className={`flex-1 rounded-lg py-3 font-semibold text-white transition-all duration-200 shadow-md hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 ${
                            isDashboardThemeEnabled && !isUploading
                                ? 'bg-primary hover:bg-primary/90'
                                : ''
                        }`}
                        style={{
                            background:
                                isDashboardThemeEnabled || isUploading
                                    ? undefined
                                    : 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)',
                        }}
                    >
                        {isUploading ? (
                            <span className="flex items-center justify-center gap-2">
                                <Loader className="h-4 w-4 animate-spin" />
                                Processing {progress.current}/{progress.total}
                                ...
                            </span>
                        ) : (
                            `Upload ${fileCount} Document${
                                fileCount !== 1 ? 's' : ''
                            }`
                        )}
                    </button>

                    <button
                        onClick={handleCancelUpload}
                        disabled={isUploading}
                        className={`rounded-lg border px-6 py-3 font-semibold transition-all duration-200 disabled:opacity-50 ${
                            isDashboardThemeEnabled
                                ? 'border-base-300 text-base-content/70 hover:border-base-content/20 hover:bg-base-200 hover:text-base-content'
                                : 'border-gray-300 text-gray-600 hover:border-gray-400 hover:text-gray-800'
                        }`}
                    >
                        Cancel
                    </button>
                </div>
            )}
        </div>
    );
};

export default MultiFileUploadUI;
