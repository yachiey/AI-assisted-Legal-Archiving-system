import { FC, useState } from 'react';
import { FileText, Clock, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import UploadDocumentViewer from '../../Documents/components/FileUpload/UploadDocumentViewer';
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from '../../../../hooks/useDashboardTheme';

interface RecentFile {
    id: number;
    title: string;
    timestamp: string;
    date: string;
    folder_name?: string;
    created_by: string;
}

interface RecentFilesProps {
    files: RecentFile[];
}

const RecentFiles: FC<RecentFilesProps> = ({ files }) => {
    const { theme } = useDashboardTheme('staff');
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
    const [viewerOpen, setViewerOpen] = useState(false);
    const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
    const [selectedFileName, setSelectedFileName] = useState<string>('');

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Calculate pagination
    const totalPages = Math.ceil(files.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentFiles = files.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const handleViewDocument = (file: RecentFile) => {
        setSelectedDocId(file.id);
        setSelectedFileName(file.title);
        setViewerOpen(true);
    };

    return (
        <div
            className={`group/card relative overflow-hidden rounded-3xl p-6 shadow-lg transition-all duration-500 hover:shadow-2xl ${
                isDashboardThemeEnabled
                    ? 'border border-base-300/70 bg-base-100/90 shadow-base-content/5'
                    : 'border border-gray-100/50 bg-white'
            }`}
        >
            {/* Decorative gradient */}
            <div
                className={`absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/card:opacity-100 ${
                    isDashboardThemeEnabled
                        ? 'bg-gradient-to-br from-primary/8 via-transparent to-secondary/10'
                        : 'bg-gradient-to-br from-blue-50/30 via-transparent to-transparent'
                }`}
            ></div>

            <div className="relative z-10">
                {/* Header */}
                <div
                    className={`mb-6 flex items-center gap-4 border-b pb-4 ${
                        isDashboardThemeEnabled ? 'border-base-300/70' : 'border-gray-100'
                    }`}
                >
                    <div className="relative">
                        <div
                            className={`absolute inset-0 blur-lg opacity-30 ${
                                isDashboardThemeEnabled
                                    ? 'bg-gradient-to-br from-primary to-secondary'
                                    : 'bg-gradient-to-br from-blue-500 to-blue-600'
                            }`}
                        ></div>
                        <div
                            className={`relative rounded-2xl p-3 ${
                                isDashboardThemeEnabled
                                    ? 'bg-gradient-to-br from-primary/15 to-secondary/15'
                                    : 'bg-gradient-to-br from-blue-50 to-blue-100'
                            }`}
                        >
                            <FileText
                                className={`h-6 w-6 ${
                                    isDashboardThemeEnabled ? 'text-primary' : 'text-blue-600'
                                }`}
                                strokeWidth={2.5}
                            />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3
                            className={`text-xl font-black tracking-tight ${
                                isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'
                            }`}
                            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}
                        >
                            Recent Uploads
                        </h3>
                        <p
                            className={`mt-0.5 text-xs font-medium tracking-wide ${
                                isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-500'
                            }`}
                        >
                            Your recently uploaded documents
                        </p>
                    </div>
                </div>

                {/* Files List */}
                <div className="space-y-2.5">
                    {currentFiles.length > 0 ? (
                        currentFiles.map((file, index) => (
                            <div
                                key={file.id}
                                onClick={() => handleViewDocument(file)}
                                className={`group relative flex cursor-pointer items-center justify-between overflow-hidden rounded-2xl border p-4 transition-all duration-300 hover:shadow-md ${
                                    isDashboardThemeEnabled
                                        ? 'border-base-300/70 bg-base-100 hover:border-primary/30 hover:bg-base-200/70'
                                        : 'border-gray-100/80 bg-gradient-to-br from-gray-50/80 to-white hover:border-blue-200/60 hover:from-blue-50/50 hover:to-blue-50/30'
                                }`}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Hover gradient effect */}
                                <div
                                    className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                                        isDashboardThemeEnabled
                                            ? 'bg-gradient-to-r from-primary/8 to-transparent'
                                            : 'bg-gradient-to-r from-blue-500/5 to-transparent'
                                    }`}
                                ></div>

                                <div className="flex-1 min-w-0 flex items-center gap-3.5 relative z-10">
                                    <div
                                        className={`rounded-xl border p-2.5 shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md ${
                                            isDashboardThemeEnabled
                                                ? 'border-base-300/70 bg-base-100'
                                                : 'border-gray-100 bg-white'
                                        }`}
                                    >
                                        <FileText
                                            className={`h-4 w-4 transition-colors ${
                                                isDashboardThemeEnabled
                                                    ? 'text-primary group-hover:text-secondary'
                                                    : 'text-blue-600 group-hover:text-blue-700'
                                            }`}
                                            strokeWidth={2.5}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={`mb-1 truncate text-sm font-bold transition-colors ${
                                                isDashboardThemeEnabled
                                                    ? 'text-base-content group-hover:text-primary'
                                                    : 'text-gray-900 group-hover:text-blue-700'
                                            }`}
                                            style={{ fontFamily: "'Inter', sans-serif" }}
                                        >
                                            {file.title}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className={`h-2 w-2 rounded-full ${
                                                        isDashboardThemeEnabled ? 'bg-secondary' : 'bg-green-500'
                                                    }`}
                                                ></div>
                                                <p
                                                    className={`text-xs font-medium ${
                                                        isDashboardThemeEnabled ? 'text-base-content/65' : 'text-gray-600'
                                                    }`}
                                                >
                                                    {file.folder_name || 'Uncategorized'}
                                                </p>
                                            </div>
                                            <span
                                                className={
                                                    isDashboardThemeEnabled ? 'text-base-content/25' : 'text-gray-300'
                                                }
                                            >
                                                &middot;
                                            </span>
                                            <p
                                                className={`text-xs ${
                                                    isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-500'
                                                }`}
                                            >
                                                {file.date}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-3 flex-shrink-0 relative z-10">
                                    <div
                                        className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors duration-300 ${
                                            isDashboardThemeEnabled
                                                ? 'bg-base-200/80 group-hover:bg-primary/10'
                                                : 'bg-gray-100/80 group-hover:bg-blue-100/80'
                                        }`}
                                    >
                                        <Clock
                                            className={`h-3.5 w-3.5 ${
                                                isDashboardThemeEnabled
                                                    ? 'text-base-content/55 group-hover:text-primary'
                                                    : 'text-gray-500 group-hover:text-blue-600'
                                            }`}
                                            strokeWidth={2.5}
                                        />
                                        <span
                                            className={`text-xs font-semibold transition-colors ${
                                                isDashboardThemeEnabled
                                                    ? 'text-base-content/65 group-hover:text-primary'
                                                    : 'text-gray-600 group-hover:text-blue-700'
                                            }`}
                                        >
                                            {file.timestamp}
                                        </span>
                                    </div>
                                    <ArrowUpRight
                                        className={`h-4 w-4 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                                            isDashboardThemeEnabled
                                                ? 'text-base-content/35 group-hover:text-primary'
                                                : 'text-gray-400 group-hover:text-blue-600'
                                        }`}
                                        strokeWidth={2.5}
                                    />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <div className="relative inline-flex items-center justify-center mb-4">
                                <div
                                    className={`absolute inset-0 rounded-full blur-xl opacity-40 ${
                                        isDashboardThemeEnabled ? 'bg-primary/20' : 'bg-blue-100'
                                    }`}
                                ></div>
                                <div
                                    className={`relative flex h-20 w-20 items-center justify-center rounded-full ${
                                        isDashboardThemeEnabled
                                            ? 'bg-gradient-to-br from-base-200 to-base-300/80'
                                            : 'bg-gradient-to-br from-gray-100 to-gray-200'
                                    }`}
                                >
                                    <FileText
                                        className={`h-10 w-10 ${
                                            isDashboardThemeEnabled ? 'text-base-content/35' : 'text-gray-400'
                                        }`}
                                        strokeWidth={2}
                                    />
                                </div>
                            </div>
                            <p
                                className={`mb-1 text-base font-bold ${
                                    isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-700'
                                }`}
                            >
                                No recent files
                            </p>
                            <p
                                className={`text-sm font-medium ${
                                    isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-500'
                                }`}
                            >
                                Files you upload will appear here
                            </p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div
                        className={`mt-6 flex items-center justify-between border-t pt-4 ${
                            isDashboardThemeEnabled ? 'border-base-300/70' : 'border-gray-100'
                        }`}
                    >
                        <div
                            className={`text-sm font-medium ${
                                isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-500'
                            }`}
                        >
                            Showing {startIndex + 1} to {Math.min(endIndex, files.length)} of {files.length}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className={`rounded-lg border p-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isDashboardThemeEnabled
                                        ? 'border-base-300 bg-base-200 text-base-content hover:bg-base-300'
                                        : 'border-gray-200 bg-gray-100 hover:bg-gray-200'
                                }`}
                                aria-label="Previous page"
                            >
                                <ChevronLeft
                                    className={`h-4 w-4 ${
                                        isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'
                                    }`}
                                />
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page)}
                                        className={`rounded-lg px-3 py-1 text-sm font-medium transition-all duration-200 ${
                                            currentPage === page
                                                ? isDashboardThemeEnabled
                                                    ? 'bg-primary text-primary-content shadow-md shadow-primary/20'
                                                    : 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                                                : isDashboardThemeEnabled
                                                    ? 'border border-base-300 bg-base-200 text-base-content/70 hover:bg-base-300'
                                                    : 'border border-gray-200 bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className={`rounded-lg border p-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isDashboardThemeEnabled
                                        ? 'border-base-300 bg-base-200 text-base-content hover:bg-base-300'
                                        : 'border-gray-200 bg-gray-100 hover:bg-gray-200'
                                }`}
                                aria-label="Next page"
                            >
                                <ChevronRight
                                    className={`h-4 w-4 ${
                                        isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'
                                    }`}
                                />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Document Viewer Modal */}
            <UploadDocumentViewer
                isOpen={viewerOpen}
                onClose={() => {
                    setViewerOpen(false);
                    setSelectedDocId(null);
                    setSelectedFileName('');
                }}
                docId={selectedDocId}
                fileName={selectedFileName}
            />
        </div>
    );
};

export default RecentFiles;
