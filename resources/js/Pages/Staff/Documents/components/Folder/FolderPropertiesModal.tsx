import React from 'react';
import { createPortal } from 'react-dom';
import { X, Folder as FolderIcon, FolderOpen, Calendar, User, HardDrive, FileText } from 'lucide-react';
import { Folder } from '../../types/types';

interface FolderPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: Folder | null;
  documentCount?: number;
}

const FolderPropertiesModal: React.FC<FolderPropertiesModalProps> = ({
  isOpen,
  onClose,
  folder,
  documentCount = 0
}) => {
  if (!isOpen || !folder) return null;

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const PropertyRow: React.FC<{ icon: React.ReactNode; label: string; value: string | number | null | undefined }> = ({
    icon,
    label,
    value
  }) => (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-all">
      <div className="text-green-600 mt-0.5">{icon}</div>
      <div className="flex-1">
        <div className="text-xs text-gray-600 mb-1">{label}</div>
        <div className="text-sm text-gray-900 break-words">{value || 'N/A'}</div>
      </div>
    </div>
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <FolderIcon className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Folder Properties</h3>
              <p className="text-sm text-gray-600 mt-0.5">View folder details and metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-2 rounded-lg transition-all"
            aria-label="Close properties"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div data-lenis-prevent className="p-6 overflow-y-auto flex-1">
          <div className="space-y-2">
            {/* Folder Name */}
            <PropertyRow
              icon={<FolderIcon className="w-4 h-4" />}
              label="Folder Name"
              value={folder.folder_name}
            />

            {/* Folder Path */}
            <PropertyRow
              icon={<HardDrive className="w-4 h-4" />}
              label="Folder Path"
              value={folder.folder_path}
            />

            {/* Folder Type */}
            <PropertyRow
              icon={<FileText className="w-4 h-4" />}
              label="Type"
              value={folder.folder_type?.charAt(0).toUpperCase() + folder.folder_type?.slice(1)}
            />

            {/* Document Count */}
            <PropertyRow
              icon={<FileText className="w-4 h-4" />}
              label="Documents"
              value={documentCount}
            />

            {/* Parent Folder */}
            <PropertyRow
              icon={<FolderOpen className="w-4 h-4" />}
              label="Parent Folder"
              value={folder.parent_folder_id ? `Folder ID: ${folder.parent_folder_id}` : 'Root Folder'}
            />

            {/* Created By */}
            <PropertyRow
              icon={<User className="w-4 h-4" />}
              label="Created By"
              value={
                folder.creator
                  ? `${folder.creator.firstname} ${folder.creator.lastname}`.trim()
                  : `User ID: ${folder.created_by}`
              }
            />

            {/* Created Date */}
            <PropertyRow
              icon={<Calendar className="w-4 h-4" />}
              label="Created Date"
              value={formatDate(folder.created_at)}
            />

            {/* Last Modified */}
            <PropertyRow
              icon={<Calendar className="w-4 h-4" />}
              label="Last Modified"
              value={formatDate(folder.updated_at)}
            />

          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  // Render modal using portal to escape parent container constraints
  if (typeof window !== 'undefined' && document.body) {
    return createPortal(modalContent, document.body);
  }

  return null;
};

export default FolderPropertiesModal;