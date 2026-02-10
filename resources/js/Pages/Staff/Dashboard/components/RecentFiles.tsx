import { FC, useState } from 'react';
import { FileText, Clock, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';
import UploadDocumentViewer from '../../Documents/components/FileUpload/UploadDocumentViewer';

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
        <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100/50 p-6 overflow-hidden group/card hover:shadow-2xl transition-all duration-500">
            {/* Decorative gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-transparent opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6 pb-4 border-b border-gray-100">
                    <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 blur-lg opacity-30"></div>
                        <div className="relative p-3 bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl">
                            <FileText className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
                        </div>
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-black text-gray-900 tracking-tight"
                            style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.01em' }}>
                            Recent Uploads
                        </h3>
                        <p className="text-xs text-gray-500 font-medium tracking-wide mt-0.5">
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
                                className="group relative flex items-center justify-between p-4 bg-gradient-to-br from-gray-50/80 to-white rounded-2xl hover:from-blue-50/50 hover:to-blue-50/30 transition-all duration-400 border border-gray-100/80 hover:border-blue-200/60 hover:shadow-md cursor-pointer overflow-hidden"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Hover gradient effect */}
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>

                                <div className="flex-1 min-w-0 flex items-center gap-3.5 relative z-10">
                                    <div className="p-2.5 bg-white rounded-xl shadow-sm group-hover:shadow-md group-hover:scale-105 transition-all duration-300 border border-gray-100">
                                        <FileText className="w-4 h-4 text-blue-600 group-hover:text-blue-700 transition-colors" strokeWidth={2.5} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-700 transition-colors mb-1"
                                            style={{ fontFamily: "'Inter', sans-serif" }}>
                                            {file.title}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <p className="text-xs text-gray-600 font-medium">{file.folder_name || 'Uncategorized'}</p>
                                            </div>
                                            <span className="text-gray-300">•</span>
                                            <p className="text-xs text-gray-500">{file.date}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 ml-3 flex-shrink-0 relative z-10">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100/80 group-hover:bg-blue-100/80 rounded-lg transition-colors duration-300">
                                        <Clock className="w-3.5 h-3.5 text-gray-500 group-hover:text-blue-600" strokeWidth={2.5} />
                                        <span className="text-xs font-semibold text-gray-600 group-hover:text-blue-700 transition-colors">
                                            {file.timestamp}
                                        </span>
                                    </div>
                                    <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" strokeWidth={2.5} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-16">
                            <div className="relative inline-flex items-center justify-center mb-4">
                                <div className="absolute inset-0 bg-blue-100 rounded-full blur-xl opacity-40"></div>
                                <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                    <FileText className="w-10 h-10 text-gray-400" strokeWidth={2} />
                                </div>
                            </div>
                            <p className="text-gray-700 font-bold text-base mb-1">No recent files</p>
                            <p className="text-sm text-gray-500 font-medium">Files you upload will appear here</p>
                        </div>
                    )}
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-100 pt-4">
                        <div className="text-sm text-gray-500 font-medium">
                            Showing {startIndex + 1} to {Math.min(endIndex, files.length)} of {files.length}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={handlePrevPage}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                aria-label="Previous page"
                            >
                                <ChevronLeft className="w-4 h-4 text-gray-600" />
                            </button>

                            <div className="flex gap-1">
                                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page)}
                                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === page
                                            ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md'
                                            : 'bg-gray-100 border border-gray-200 text-gray-600 hover:bg-gray-200'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleNextPage}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg bg-gray-100 border border-gray-200 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                                aria-label="Next page"
                            >
                                <ChevronRight className="w-4 h-4 text-gray-600" />
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
