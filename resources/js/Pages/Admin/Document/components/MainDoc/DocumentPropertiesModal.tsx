import React from 'react';
import { X, FileText, FolderOpen, Calendar, User, HardDrive } from 'lucide-react';
import { Document } from '../../types/types';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

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
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
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
    <div className={`flex items-start gap-3 rounded-lg p-3 transition-all ${isDashboardThemeEnabled ? 'hover:bg-base-200/50' : 'hover:bg-gray-50'}`}>
      <div className={`mt-0.5 ${isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}`}>{icon}</div>
      <div className="flex-1">
        <div className={`mb-1 text-xs ${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}`}>{label}</div>
        <div className={`break-words text-sm font-medium ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}`}>{value || 'N/A'}</div>
      </div>
    </div>
  );

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6"
      style={{ background: 'transparent' }}
    >
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div
        className={`relative flex w-full max-w-2xl flex-col overflow-hidden rounded-xl shadow-2xl ${isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-gray-200 bg-white'}`}
        onClick={(e) => e.stopPropagation()}
        style={{ maxHeight: '90vh' }}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b p-6 ${isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${isDashboardThemeEnabled ? 'bg-primary/10' : 'bg-green-50'}`}>
              <FileText className={`h-5 w-5 ${isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}`} />
            </div>
            <div>
              <h3 className={`text-lg font-bold ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}`}>Document Properties</h3>
              <p className={`mt-0.5 text-sm ${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-600'}`}>View document details and metadata</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-2 transition-all ${isDashboardThemeEnabled ? 'text-base-content/50 hover:bg-base-200 hover:text-base-content' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            aria-label="Close properties"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-base-300">
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
        <div className={`flex justify-end gap-3 border-t p-6 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/30' : 'border-gray-200 bg-gray-50'}`}>
          <button
            onClick={onClose}
            className={`rounded-lg px-6 py-2 font-medium transition-all ${isDashboardThemeEnabled ? 'border border-base-300 text-base-content hover:bg-base-300' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DocumentPropertiesModal;
