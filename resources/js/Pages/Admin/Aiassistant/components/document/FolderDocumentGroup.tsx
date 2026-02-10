import React from 'react';
import { FileText, FolderOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Document } from '../../types';

interface FolderDocumentGroupProps {
  folderKey: string;
  folderName: string;
  documents: Document[];
  isExpanded: boolean;
  selectedDocuments: Document[];
  onToggleFolder: (folderKey: string) => void;
  onToggleDocument: (document: Document) => void;
}

const getDocumentId = (doc: Document) => doc.doc_id || doc.id;

const isDocumentSelected = (doc: Document, selectedDocs: Document[]) =>
  selectedDocs.some(selected => getDocumentId(selected) === getDocumentId(doc));

export const FolderDocumentGroup: React.FC<FolderDocumentGroupProps> = ({
  folderKey,
  folderName,
  documents,
  isExpanded,
  selectedDocuments,
  onToggleFolder,
  onToggleDocument,
}) => {
  const selectedCount = documents.filter(doc => isDocumentSelected(doc, selectedDocuments)).length;

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      {/* Folder Header */}
      <button
        onClick={() => onToggleFolder(folderKey)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <FolderOpen className="w-5 h-5 text-amber-500" />
          <span className="font-medium text-gray-700">{folderName}</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
              {selectedCount} selected
            </span>
          )}
          <span className="text-sm text-gray-500">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </span>
        </div>
      </button>

      {/* Documents List */}
      {isExpanded && (
        <div className="divide-y divide-gray-100">
          {documents.map((document) => (
            <div
              key={getDocumentId(document)}
              className={`flex items-center p-3 pl-10 cursor-pointer transition-all ${isDocumentSelected(document, selectedDocuments) ? 'bg-green-50' : 'hover:bg-gray-50'
                }`}
              onClick={() => onToggleDocument(document)}
            >
              <div className={`mr-3 h-4 w-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                isDocumentSelected(document, selectedDocuments)
                  ? 'bg-green-600 border-green-600'
                  : 'border-gray-300 bg-white'
              }`}>
                {isDocumentSelected(document, selectedDocuments) && (
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <FileText className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm text-gray-900 truncate">{document.title}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {document.type && `${document.type} • `} {new Date(document.uploadDate || document.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
