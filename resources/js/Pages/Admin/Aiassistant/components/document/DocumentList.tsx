import React from 'react';
import { Document } from '../../types';

interface DocumentListProps {
  documents: Document[];
  onDelete: (id: number) => void;
  onSelect?: (document: Document) => void;
}

export const DocumentList: React.FC<DocumentListProps> = ({ documents, onDelete, onSelect }) => {
  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'ready': return 'text-green-600';
      case 'processing': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: Document['status']) => {
    switch (status) {
      case 'ready':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        );
      case 'processing':
        return (
          <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-2">
      {documents.map((document) => (
        <div
          key={document.id}
          className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group"
        >
          <div
            className="flex items-center flex-1 cursor-pointer"
            onClick={() => onSelect?.(document)}
          >
            <div className="flex-shrink-0 mr-3">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{document.title}</p>
              <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
                {document.type && <span>{document.type}</span>}
                {document.size && <span>{document.size}</span>}
                <span>{new Date(document.uploadDate || document.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className={`flex items-center ${getStatusColor(document.status)}`}>
              {getStatusIcon(document.status)}
              <span className="ml-1 text-xs capitalize">{document.status}</span>
            </div>

            <button
              onClick={() => onDelete(document.doc_id || document.id)}
              className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-600 transition-opacity"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};