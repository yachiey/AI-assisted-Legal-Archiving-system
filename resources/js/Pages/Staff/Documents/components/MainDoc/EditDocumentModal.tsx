import React, { useState, useEffect } from 'react';
import { X, FileText, FolderOpen, AlertCircle } from 'lucide-react';
import { Document } from '../../types/types';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';
import { router } from '@inertiajs/react';
import { folderService } from '../../services/folderService';

interface EditDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
  onDocumentUpdated: () => void;
  folders?: Array<{ folder_id: number; folder_name: string }>;
}

const EditDocumentModal: React.FC<EditDocumentModalProps> = ({
  isOpen,
  onClose,
  document,
  onDocumentUpdated,
  folders: initialFolders = []
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    folder_id: null as number | null,
    remarks: '',
    physical_location: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [folderList, setFolderList] = useState<Array<{ folder_id: number; folder_name: string }>>(initialFolders);
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  useEffect(() => {
    if (isOpen) {
      loadFolders();
    }
  }, [isOpen]);

  const loadFolders = async () => {
    try {
      const allFolders = await folderService.getAllFolders();
      // Only show folders, not subfolders if flattened, but usually getAllFolders returns everything or roots.
      // Based on folderService, getAllFolders returns array of folders.
      setFolderList(allFolders);
    } catch (err) {
      console.error("Failed to load folders", err);
    }
  };

  useEffect(() => {
    if (isOpen && document) {
      setFormData({
        title: document.title || '',
        description: document.description || '',
        folder_id: document.folder_id || null,
        remarks: document.remarks || '',
        physical_location: document.physical_location || ''
      });
      setError(null);
    }
  }, [isOpen, document]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'folder_id' ? (value ? parseInt(value) : null) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('auth_token');

      const response = await fetch(`/api/documents/${document.doc_id}/metadata`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update document');
      }

      onDocumentUpdated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update document');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'transparent' }}
      onKeyDown={(e) => {
        if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') {
          e.stopPropagation();
        }
      }}
    >
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div
        className={`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl ${isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-gray-200 bg-white'}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b p-6 ${isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${isDashboardThemeEnabled ? 'bg-primary/10' : 'bg-blue-50'}`}>
              <FileText className={`h-5 w-5 ${isDashboardThemeEnabled ? 'text-primary' : 'text-blue-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}`}>Edit Document</h3>
              <p className={`mt-0.5 text-sm ${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}`}>Update document metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-all ${isDashboardThemeEnabled ? 'text-base-content/50 hover:bg-base-200 hover:text-base-content' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form data-lenis-prevent onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-300">
          {error && (
            <div className={`mb-4 flex items-center gap-2 rounded-lg border p-3 ${isDashboardThemeEnabled ? 'border-error/20 bg-error/10 text-error' : 'border-red-200 bg-red-50 text-red-700'}`}>
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className={`mb-2 block text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}`}>
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className={`w-full rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-primary focus:ring-primary' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'}`}
                placeholder="Enter document title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className={`mb-2 block text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}`}>
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className={`w-full resize-none rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-primary focus:ring-primary' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'}`}
                placeholder="Enter document description"
              />
            </div>

            {/* Folder */}
            <div>
              <label htmlFor="folder_id" className={`mb-2 block text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}`}>
                <FolderOpen className="w-4 h-4 inline mr-1" />
                Folder
              </label>
              <select
                id="folder_id"
                name="folder_id"
                value={formData.folder_id || ''}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              >
                <option value="">No folder</option>
                {folderList.map(folder => (
                  <option key={folder.folder_id} value={folder.folder_id}>
                    {folder.folder_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Physical Location */}
            <div>
              <label htmlFor="physical_location" className={`mb-2 block text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}`}>
                Physical Location
              </label>
              <input
                type="text"
                id="physical_location"
                name="physical_location"
                value={formData.physical_location}
                onChange={handleInputChange}
                className={`w-full rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-primary focus:ring-primary' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'}`}
                placeholder="e.g., Cabinet A, Shelf 3, Box 12"
              />
            </div>

            {/* Remarks */}
            <div>
              <label htmlFor="remarks" className={`mb-2 block text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content/80' : 'text-gray-700'}`}>
                Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className={`w-full resize-none rounded-lg border px-4 py-2 transition-all focus:outline-none focus:ring-2 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-100 text-base-content placeholder-base-content/40 focus:border-primary focus:ring-primary' : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-green-500 focus:ring-green-500'}`}
                placeholder="Additional notes or remarks"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={`flex justify-end gap-3 border-t p-6 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/30' : 'border-gray-200 bg-gray-50'}`}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className={`rounded-lg px-4 py-2 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDashboardThemeEnabled ? 'border border-base-300 text-base-content hover:bg-base-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={`flex items-center gap-2 rounded-lg px-6 py-2 font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-50 ${isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'}`}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditDocumentModal;
