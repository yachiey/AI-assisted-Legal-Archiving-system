import React from 'react';
import { X, FileText, FolderOpen, Calendar, User, HardDrive } from 'lucide-react';
import { Document } from '../../types/types';

interface DocumentPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document;
}

const DocumentPropertiesModal: React.FC<DocumentPropertiesModalProps> = ({
  isOpen,
  onClose,
  document
}) => {
  if (!isOpen) return null;

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

  const getFileExtension = (): string => {
    const extension = document.file_path?.split('.').pop()?.toUpperCase();
    return extension || 'UNKNOWN';
  };

  const getFileSize = (): string => {
    // This would need to be fetched from backend
    // For now, showing placeholder
    return 'N/A';
  };

  const PropertyRow: React.FC<{ icon: React.ReactNode; label: string; value: string | null | undefined }> = ({
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

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl mx-4 max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Document Properties</h3>
              <p className="text-sm text-gray-600 mt-0.5">View document details and metadata</p>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-2">
            {/* Document Title */}
            <PropertyRow
              icon={<FileText className="w-4 h-4" />}
              label="Title"
              value={document.title}
            />

            {/* Description */}
            {document.description && (
              <PropertyRow
                icon={<FileText className="w-4 h-4" />}
                label="Description"
                value={document.description}
              />
            )}

            {/* File Type */}
            <PropertyRow
              icon={<FileText className="w-4 h-4" />}
              label="File Type"
              value={getFileExtension()}
            />

            {/* File Path */}
            <PropertyRow
              icon={<HardDrive className="w-4 h-4" />}
              label="File Path"
              value={document.file_path}
            />

            {/* Physical Location */}
            {document.physical_location && (
              <PropertyRow
                icon={<HardDrive className="w-4 h-4" />}
                label="Physical Location"
                value={document.physical_location}
              />
            )}

            {/* Folder */}
            <PropertyRow
              icon={<FolderOpen className="w-4 h-4" />}
              label="Folder"
              value={document.folder?.folder_name || 'No folder assigned'}
            />

            {/* AI Suggested Folder */}
            {document.ai_suggested_folder && (
              <PropertyRow
                icon={<FolderOpen className="w-4 h-4" />}
                label="AI Suggested Folder"
                value={document.ai_suggested_folder}
              />
            )}

            {/* Status */}
            <PropertyRow
              icon={<FileText className="w-4 h-4" />}
              label="Status"
              value={document.status?.charAt(0).toUpperCase() + document.status?.slice(1)}
            />

            {/* Remarks */}
            {document.remarks && (
              <PropertyRow
                icon={<FileText className="w-4 h-4" />}
                label="Remarks"
                value={document.remarks}
              />
            )}

            {/* Created By */}
            <PropertyRow
              icon={<User className="w-4 h-4" />}
              label="Created By"
              value={
                document.user
                  ? `${document.user.firstname} ${document.user.lastname}`.trim()
                  : `User ID: ${document.created_by}`
              }
            />

            {/* Created Date */}
            <PropertyRow
              icon={<Calendar className="w-4 h-4" />}
              label="Created Date"
              value={formatDate(document.created_at)}
            />

            {/* Last Modified */}
            <PropertyRow
              icon={<Calendar className="w-4 h-4" />}
              label="Last Modified"
              value={formatDate(document.updated_at)}
            />

            {/* Document ID */}
            <PropertyRow
              icon={<FileText className="w-4 h-4" />}
              label="Document ID"
              value={document.document_ref_id || 'Not assigned'}
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
};

export default DocumentPropertiesModal;
