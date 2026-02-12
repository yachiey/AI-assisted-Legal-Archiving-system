import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FileText, MoreVertical } from 'lucide-react';
import { DocumentListItemProps, Document } from '../../types/types';
import DocumentViewer from '../DocumentViewer/DocumentViewer';
import DocumentMenu from './DocumentMenu';
import DocumentPropertiesModal from './DocumentPropertiesModal';
import EditDocumentModal from './EditDocumentModal';
import DeleteDocumentDialog from './DeleteDocumentDialog';
import realDocumentService from '../../services/realDocumentService';

// Reusing types from DocumentListItemProps as they are identical
const DocumentGridItem: React.FC<DocumentListItemProps> = ({
    document,
    folders = [],
    isHighlighted = false,
    onDocumentUpdated
}) => {
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const handleDocumentClick = (): void => {
        setIsViewerOpen(true);
    };

    const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
        event.stopPropagation();

        if (!menuOpen) {
            const rect = event.currentTarget.getBoundingClientRect();
            const menuHeight = 180;
            const viewportHeight = window.innerHeight;
            const spaceBelow = viewportHeight - rect.bottom;

            setMenuPosition({
                top: spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom,
                left: rect.right - 160
            });
        }

        setMenuOpen(!menuOpen);
    };

    const handleMenuAction = async (action: string): Promise<void> => {
        setMenuOpen(false);

        switch (action) {
            case 'properties':
                setIsPropertiesOpen(true);
                break;
            case 'edit':
                setIsEditOpen(true);
                break;
            case 'delete':
                setIsDeleteOpen(true);
                break;
            case 'download':
                handleDownload();
                break;
        }
    };

    const handleDownload = (): void => {
        // Determine the best filename (ensure it has an extension)
        const filepath = document.file_path || document.title;
        const extension = filepath.split('.').pop()?.toLowerCase() || '';
        let downloadName = document.title;
        if (extension && !downloadName.toLowerCase().endsWith('.' + extension)) {
            downloadName = `${downloadName}.${extension}`;
        }

        const link = window.document.createElement('a');
        link.href = `/api/documents/${document.doc_id}/download`;
        link.download = downloadName;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
    };


    const handleDocumentUpdated = () => {
        onDocumentUpdated?.();
    };

    const handleDocumentDeleted = () => {
        onDocumentUpdated?.();
    };

    const getFileExtension = (filename: string): string => {
        const lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex === -1) return 'FILE';
        return filename.substring(lastDotIndex + 1).toUpperCase();
    };

    // Close menu when clicking outside or scrolling
    useEffect(() => {
        if (!menuOpen || typeof window === 'undefined') return;

        const closeMenu = () => {
            setMenuOpen(false);
            setMenuPosition(null);
        };

        window.document.addEventListener('click', closeMenu);
        window.addEventListener('scroll', closeMenu, true);
        return () => {
            window.document.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', closeMenu, true);
        };
    }, [menuOpen]);

    return (
        <>
            <div
                className={`group relative bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-green-100/50 transition-all duration-300 cursor-pointer flex flex-col items-center text-center h-[240px] w-full backdrop-blur-sm justify-between ${isHighlighted ? 'bg-green-100 ring-2 ring-green-500 animate-pulse' : ''
                    }`}
                onClick={handleDocumentClick}
                title={document.title}
            >
                {/* Modern Hover Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/0 via-green-50/0 to-green-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />

                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 z-20 transform translate-y-[-4px] group-hover:translate-y-0">
                    <button
                        className="p-1.5 rounded-xl hover:bg-white/80 text-gray-400 hover:text-gray-700 bg-white/50 backdrop-blur-md shadow-sm border border-gray-100/50 transition-all"
                        onClick={handleMenuClick}
                        type="button"
                    >
                        <MoreVertical className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-start pt-2 w-full mt-1 relative z-10 gap-2">
                    <div className="relative flex-shrink-0">
                        <div className="absolute inset-0 bg-green-200 blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-500 rounded-full" />
                        <div className="relative w-14 h-14 bg-red-50 rounded-lg flex items-center justify-center group-hover:scale-105 transition-transform duration-300 border border-red-100 shadow-sm">
                            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M7 3C5.34315 3 4 4.34315 4 6V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V9.82843C20 9.29799 19.7893 8.78929 19.4142 8.41421L14.5858 3.58579C14.2107 3.21071 13.702 3 13.1716 3H7Z" fillOpacity="0.1" />
                                <path d="M14 3V8C14 8.55228 14.4477 9 15 9H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M14.5858 3.58579L19.4142 8.41421C19.7893 8.78929 20 9.29799 20 9.82843V18C20 19.6569 18.6569 21 17 21H7C5.34315 21 4 19.6569 4 18V6C4 4.34315 5.34315 3 7 3H13.1716C13.702 3 14.2107 3.21071 14.5858 3.58579Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                <rect x="7" y="13" width="10" height="2" rx="1" fill="currentColor" opacity="0.5" />
                                <rect x="7" y="16" width="7" height="2" rx="1" fill="currentColor" opacity="0.5" />
                            </svg>
                            <div className="absolute top-2 right-2 bg-red-100 text-red-600 text-[9px] font-bold px-1.5 py-0.5 rounded">PDF</div>
                        </div>
                    </div>

                    <h4 className="text-[13px] font-semibold text-gray-700 w-full px-4 max-w-full leading-relaxed tracking-tight group-hover:text-green-800 transition-colors line-clamp-4 overflow-hidden text-ellipsis flex-1 flex items-center justify-center break-words text-wrap">
                        {document.title}
                    </h4>

                    {(() => {
                        const ext = getFileExtension(document.title);
                        return (ext && ext !== 'FILE' && ext.length <= 4) ? (
                            <div className="flex-shrink-0">
                                <span className="text-[10px] tracking-wider text-gray-400 font-semibold bg-gray-50/80 px-2.5 py-1 rounded-lg border border-gray-100 uppercase group-hover:border-green-100/50 group-hover:text-green-600/70 transition-colors">
                                    {ext}
                                </span>
                            </div>
                        ) : null;
                    })()}
                </div>
            </div >

            {/* Portals for Modals/Menus */}
            {
                typeof window !== 'undefined' && menuOpen && menuPosition && createPortal(
                    <div
                        style={{
                            position: 'fixed',
                            top: `${menuPosition.top}px`,
                            left: `${menuPosition.left}px`,
                            zIndex: 10000
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <DocumentMenu
                            onProperties={() => handleMenuAction('properties')}
                            onEdit={() => handleMenuAction('edit')}
                            onDelete={() => handleMenuAction('delete')}
                            onDownload={() => handleMenuAction('download')}
                        />
                    </div>,
                    window.document.body
                )
            }

            {
                typeof window !== 'undefined' && isPropertiesOpen && createPortal(
                    <DocumentPropertiesModal
                        isOpen={isPropertiesOpen}
                        onClose={() => setIsPropertiesOpen(false)}
                        document={document}
                    />,
                    window.document.body
                )
            }

            {
                typeof window !== 'undefined' && isEditOpen && createPortal(
                    <EditDocumentModal
                        isOpen={isEditOpen}
                        onClose={() => setIsEditOpen(false)}
                        document={document}
                        folders={folders}
                        onDocumentUpdated={handleDocumentUpdated}
                    />,
                    window.document.body
                )
            }

            <DocumentViewer
                isOpen={isViewerOpen}
                onClose={() => setIsViewerOpen(false)}
                document={document}
            />

            {
                typeof window !== 'undefined' && isDeleteOpen && createPortal(
                    <DeleteDocumentDialog
                        isOpen={isDeleteOpen}
                        onClose={() => setIsDeleteOpen(false)}
                        document={document}
                        onDocumentDeleted={handleDocumentDeleted}
                    />,
                    window.document.body
                )
            }

            {
                typeof window !== 'undefined' && showToast && createPortal(
                    <div className="fixed top-6 right-6 z-[10000] bg-green-600 text-white px-6 py-4 rounded-xl shadow-lg">
                        {toastMessage}
                    </div>,
                    window.document.body
                )
            }
        </>
    );
};

export default DocumentGridItem;
