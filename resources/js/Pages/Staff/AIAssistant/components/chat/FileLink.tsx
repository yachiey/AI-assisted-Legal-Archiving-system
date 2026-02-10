import React from 'react';
import { FileText, Eye } from 'lucide-react';
import { DocumentReference } from '../../types';

interface FileLinkProps {
  document: DocumentReference;
  onViewDocument?: (docId: number) => void;
  onNavigate?: (doc: DocumentReference) => void;
}

export const FileLink: React.FC<FileLinkProps> = ({ document, onViewDocument, onNavigate }) => {
  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onViewDocument) {
      onViewDocument(document.doc_id);
    }
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onNavigate) {
      onNavigate(document);
    }
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-800 rounded-lg border border-green-200 text-sm font-medium max-w-full w-full">
      {/* Document icon - click to navigate to location */}
      <button
        onClick={handleNavigate}
        className="flex-shrink-0 p-1 hover:bg-green-200 rounded transition-colors"
        title="Go to document location"
      >
        <FileText size={14} />
      </button>
      <span className="truncate flex-1 min-w-0 font-semibold text-left">{document.title}</span>
      {document.folder_name && (
        <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded truncate max-w-[100px] flex-shrink-0">
          📁 {document.folder_name}
        </span>
      )}
      {/* Eye icon - click to open document viewer */}
      <button
        onClick={handleView}
        className="p-1.5 rounded-md bg-green-600 hover:bg-green-700 text-white transition-colors flex-shrink-0"
        title={`View "${document.title}"`}
      >
        <Eye size={14} />
      </button>
    </div>
  );
};
