// DocumentListItem.tsx - Individual document row in list view with TypeScript
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { DocumentListItemProps } from '../../types/types';
import DocumentViewer from '../DocumentViewer/DocumentViewer';
import DocumentMenu from './DocumentMenu';
import DocumentPropertiesModal from './DocumentPropertiesModal';
import EditDocumentModal from './EditDocumentModal';
import DeleteDocumentDialog from './DeleteDocumentDialog';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

const DocumentListItem: React.FC<DocumentListItemProps> = ({
  document,
  folders = [],
  isHighlighted = false,
  onDocumentUpdated,
  onViewDocument
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [isPropertiesOpen, setIsPropertiesOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

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
    if (onDocumentUpdated) {
      onDocumentUpdated();
    }
  };

  const handleDocumentDeleted = () => {
    if (onDocumentUpdated) {
      onDocumentUpdated();
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFileIcon = (): React.ReactNode => {
    return (
      <div className="relative flex items-center justify-center">
        <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
          <path d="M7 3C5.34315 3 4 4.34315 4 6V18C4 19.6569 5.34315 21 7 21H17C18.6569 21 20 19.6569 20 18V9.82843C20 9.29799 19.7893 8.78929 19.4142 8.41421L14.5858 3.58579C14.2107 3.21071 13.702 3 13.1716 3H7Z" fillOpacity="0.1" />
          <path d="M14 3V8C14 8.55228 14.4477 9 15 9H20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14.5858 3.58579L19.4142 8.41421C19.7893 8.78929 20 9.29799 20 9.82843V18C20 19.6569 18.6569 21 17 21H7C5.34315 21 4 19.6569 4 18V6C4 4.34315 5.34315 3 7 3H13.1716C13.702 3 14.2107 3.21071 14.5858 3.58579Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="7" y="13" width="10" height="1.5" rx="0.5" fill="currentColor" opacity="0.5" />
          <rect x="7" y="16" width="7" height="1.5" rx="0.5" fill="currentColor" opacity="0.5" />
        </svg>
      </div>
    );
  };

  const getFileExtension = (filename: string): string => {
    const extension = filename.split('.').pop()?.toUpperCase();
    return extension || 'FILE';
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
        className={`group flex cursor-pointer items-center justify-between p-4 transition-all duration-200 ${
          isDashboardThemeEnabled
            ? `border-transparent hover:bg-base-200/75 ${
                isHighlighted
                  ? 'bg-primary/12 ring-1 ring-inset ring-primary/40 animate-pulse'
                  : ''
              }`
            : `hover:bg-gray-50 ${
                isHighlighted
                  ? 'bg-green-100 ring-2 ring-green-500 ring-inset animate-pulse'
                  : ''
              }`
        }`}
        onClick={handleDocumentClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          // Prevent triggering when interacting with inputs within the card (e.g. menu buttons or modals if portaled incorrectly)
          // Also check if the target is an input or textarea
          const target = e.target as HTMLElement;
          const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

          if (!isInput && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            handleDocumentClick();
          }
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className={`shrink-0 rounded-lg p-2 transition-all ${
              isDashboardThemeEnabled
                ? 'border border-error/20 bg-error/10 group-hover:bg-error/15'
                : 'bg-red-50 group-hover:bg-red-100'
            }`}
          >
            {getFileIcon()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4
                className={`truncate font-semibold transition-colors ${
                  isDashboardThemeEnabled
                    ? 'text-base-content group-hover:text-primary'
                    : 'text-gray-900 group-hover:text-green-600'
                }`}
              >
                {document.title}
              </h4>

            </div>

          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div
            className={`text-right text-sm ${
              isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'
            }`}
          >
            <div title={`Updated: ${document.updated_at}`} className="font-normal">
              {formatDate(document.updated_at)}
            </div>
            <div
              className={`text-xs font-light ${
                isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-500'
              }`}
            >
              {formatTime(document.updated_at)}
            </div>
          </div>
          <div className="relative">
            <button
              className={`shrink-0 rounded-lg p-1 transition-all ${
                isDashboardThemeEnabled
                  ? 'text-base-content/70 hover:bg-base-200 hover:text-primary'
                  : 'hover:bg-gray-100'
              }`}
              onClick={handleMenuClick}
              type="button"
              aria-label={`More options for ${document.title}`}
            >
              <MoreVertical
                className={`h-4 w-4 ${
                  isDashboardThemeEnabled ? 'text-current' : 'text-gray-700'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Document Menu - Using Portal */}
      {typeof window !== 'undefined' && menuOpen && menuPosition && createPortal(
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
      )}

      {/* Document Viewer Modal */}
      <DocumentViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        document={document}
      />

      {/* Properties Modal - Using Portal */}
      {typeof window !== 'undefined' && isPropertiesOpen && createPortal(
        <DocumentPropertiesModal
          isOpen={isPropertiesOpen}
          onClose={() => setIsPropertiesOpen(false)}
          document={document}
        />,
        window.document.body
      )}

      {/* Edit Modal - Using Portal */}
      {typeof window !== 'undefined' && isEditOpen && createPortal(
        <EditDocumentModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          document={document}
          folders={folders}
          onDocumentUpdated={handleDocumentUpdated}
        />,
        window.document.body
      )}

      {/* Delete Dialog - Using Portal */}
      {typeof window !== 'undefined' && isDeleteOpen && createPortal(
        <DeleteDocumentDialog
          isOpen={isDeleteOpen}
          onClose={() => setIsDeleteOpen(false)}
          document={document}
          onDocumentDeleted={handleDocumentDeleted}
        />,
        window.document.body
      )}

      {/* Modern Forest Green Toast Notification - Using Portal */}
      {typeof window !== 'undefined' && showToast && createPortal(
        <div
          data-theme={isDashboardThemeEnabled ? theme : undefined}
          className="fixed top-6 right-6 z-[10000] transform transition-all duration-500 ease-out"
          style={{
            animation: 'slideInRight 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        >
          <div
            className="relative overflow-hidden rounded-2xl backdrop-blur-xl"
            style={
              isDashboardThemeEnabled
                ? {
                    background:
                      'linear-gradient(135deg, oklch(var(--p) / 0.92) 0%, oklch(var(--s) / 0.92) 100%)',
                    boxShadow:
                      '0 20px 60px oklch(var(--p) / 0.28), 0 0 0 1px oklch(var(--bc) / 0.08) inset',
                  }
                : {
                    background:
                      'linear-gradient(135deg, rgba(16, 185, 129, 0.95) 0%, rgba(5, 150, 105, 0.95) 100%)',
                    boxShadow:
                      '0 20px 60px rgba(16, 185, 129, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                  }
            }
          >
            {/* Animated gradient overlay */}
            <div
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%)',
                backgroundSize: '200% 200%',
                animation: 'shimmer 4s ease-in-out infinite',
              }}
            />

            <div className="relative flex items-center gap-4 px-6 py-4 min-w-[320px] max-w-md">
              {/* Success Icon with pulse animation */}
              <div className="flex-shrink-0 relative">
                <div className="absolute inset-0 bg-white/20 rounded-full animate-ping" style={{ animationDuration: '2s' }} />
                <div className="relative w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>

              {/* Message */}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm leading-relaxed drop-shadow-sm">
                  {toastMessage}
                </p>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowToast(false)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/90 hover:text-white transition-all duration-200 backdrop-blur-sm"
                aria-label="Close notification"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/20">
              <div
                className="h-full bg-white/40"
                style={{
                  animation: 'shrink 3s linear forwards',
                }}
              />
            </div>
          </div>

          <style>{`
            @keyframes slideInRight {
              0% {
                transform: translateX(450px) scale(0.9);
                opacity: 0;
              }
              60% {
                transform: translateX(-10px) scale(1.02);
                opacity: 1;
              }
              80% {
                transform: translateX(5px) scale(0.98);
              }
              100% {
                transform: translateX(0) scale(1);
                opacity: 1;
              }
            }

            @keyframes shimmer {
              0%, 100% {
                background-position: 200% 50%;
              }
              50% {
                background-position: -200% 50%;
              }
            }

            @keyframes shrink {
              from {
                width: 100%;
              }
              to {
                width: 0%;
              }
            }
          `}</style>
        </div>,
        window.document.body
      )}
    </>
  );
};

export default DocumentListItem;
