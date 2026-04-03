import React, { useState, useEffect } from 'react';
import { X, FileText, FolderOpen, AlertCircle } from 'lucide-react';
import { Document } from '../../types/types';
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
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={(e) => {
        // Prevent spacebar from closing modal when typing in inputs
        if (e.key === ' ' && (e.target as HTMLElement).tagName !== 'BUTTON') {
          e.stopPropagation();
        }
      }}
    >
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Edit Document</h3>
              <p className="text-sm text-gray-600 mt-0.5">Update document metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="Enter document title"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                placeholder="Enter document description"
              />
            </div>

            {/* Folder */}
            <div>
              <label htmlFor="folder_id" className="block text-sm font-medium text-gray-700 mb-2">
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
              <label htmlFor="physical_location" className="block text-sm font-medium text-gray-700 mb-2">
                Physical Location
              </label>
              <input
                type="text"
                id="physical_location"
                name="physical_location"
                value={formData.physical_location}
                onChange={handleInputChange}
                className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                placeholder="e.g., Cabinet A, Shelf 3, Box 12"
              />
            </div>

            {/* Remarks */}
            <div>
              <label htmlFor="remarks" className="block text-sm font-medium text-gray-700 mb-2">
                Remarks
              </label>
              <textarea
                id="remarks"
                name="remarks"
                value={formData.remarks}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all resize-none"
                placeholder="Additional notes or remarks"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
