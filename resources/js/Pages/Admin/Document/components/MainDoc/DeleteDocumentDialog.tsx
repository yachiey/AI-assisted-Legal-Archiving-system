import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { Document } from '../../types/types';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

interface DeleteDocumentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onDocumentDeleted: () => void;
}

const DeleteDocumentDialog: React.FC<DeleteDocumentDialogProps> = ({
  isOpen,
  onClose,
  document,
  onDocumentDeleted
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      setError('Please type "delete" to confirm');
      return;
    }

    setError(null);
    setIsDeleting(true);

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`/api/documents/${document.doc_id}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete document');
      }

      onDocumentDeleted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    if (!isDeleting) {
      setConfirmText('');
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'transparent' }}
    >
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={handleClose} 
      />
      <div
        className={`relative flex w-full max-w-md flex-col overflow-hidden rounded-xl shadow-2xl ${isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-gray-200 bg-white'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b p-6 ${isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${isDashboardThemeEnabled ? 'bg-error/10' : 'bg-red-50'}`}>
              <Trash2 className={`h-5 w-5 ${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}`}>Delete Document</h3>
              <p className={`mt-0.5 text-sm ${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}`}>This action cannot be undone</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isDeleting}
            className={`rounded-lg p-2 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDashboardThemeEnabled ? 'text-base-content/50 hover:bg-base-200 hover:text-base-content' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Warning Message */}
          <div className={`mb-4 flex items-start gap-3 rounded-lg border p-4 ${isDashboardThemeEnabled ? 'border-error/20 bg-error/10 text-error' : 'border-red-200 bg-red-50 text-red-600'}`}>
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="flex-1">
              <h4 className="mb-1 text-sm font-semibold">Warning</h4>
              <p className="text-sm">
                Deleting this document will permanently remove the file from storage and all associated data.
              </p>
            </div>
          </div>

          {/* Document Info */}
          <div className={`mb-4 rounded-lg border p-4 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/50' : 'border-gray-200 bg-gray-50'}`}>
            <div className={`mb-1 text-sm ${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}`}>Document to delete:</div>
            <div className={`break-words font-semibold ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}`}>{document.title}</div>
            {document.folder?.folder_name && (
              <div className={`mt-2 text-xs ${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}`}>
                Folder: {document.folder.folder_name}
              </div>
            )}
          </div>

          {/* Confirmation Input */}
          <div className="mb-4">
            <label htmlFor="confirmText" className={`mb-2 block text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}`}>
              Type <span className={`font-bold ${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}`}>delete</span> to confirm
            </label>
            <input
              type="text"
              id="confirmText"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              disabled={isDeleting}
              className={`w-full rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-error focus:ring-error' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-red-500 focus:ring-red-500'}`}
              placeholder="Type 'delete' to confirm"
              autoComplete="off"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className={`mb-4 flex items-center gap-2 rounded-lg border p-3 ${isDashboardThemeEnabled ? 'border-error/20 bg-error/10 text-error' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex justify-end gap-3 border-t p-6 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/30' : 'border-gray-200 bg-gray-50'}`}>
          <button
            type="button"
            onClick={handleClose}
            disabled={isDeleting}
            className={`rounded-lg px-4 py-2 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDashboardThemeEnabled ? 'border border-base-300 text-base-content hover:bg-base-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting || confirmText.toLowerCase() !== 'delete'}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDashboardThemeEnabled ? 'bg-error hover:bg-error/90' : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'}`}
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Document
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteDocumentDialog;
