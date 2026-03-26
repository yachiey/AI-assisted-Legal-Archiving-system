import React, {
  useState,
  useEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { X, FileText, Search } from "lucide-react";
import { apiService } from "../../services/api";
import { Document } from "../../types";
import { FolderDocumentGroup } from "./FolderDocumentGroup";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

interface DocumentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocuments: (documents: Document[]) => void;
}

export const DocumentSelectionModal: React.FC<DocumentSelectionModalProps> = ({
  isOpen,
  onClose,
  onSelectDocuments,
}) => {
  const { theme } = useDashboardTheme("staff");
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isOpen && !hasLoadedOnce) {
      loadDocuments();
    }
  }, [isOpen]);

  const loadDocuments = useCallback(async (search?: string) => {
    try {
      setLoading(true);
      const docs = await apiService.getDocuments(search);
      setDocuments(docs);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error("Failed to load documents:", error);
      setHasLoadedOnce(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasLoadedOnce) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadDocuments(searchTerm || undefined);
    }, 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchTerm, loadDocuments, hasLoadedOnce]);

  const filteredDocuments = documents;

  const groupedDocuments = useMemo(() => {
    const groups: Record<string, { folderName: string; documents: Document[] }> = {};

    filteredDocuments.forEach((doc) => {
      const folderKey = doc.folder_id ? String(doc.folder_id) : "uncategorized";
      const folderName = doc.folder?.folder_name || "Uncategorized";

      if (!groups[folderKey]) {
        groups[folderKey] = { folderName, documents: [] };
      }
      groups[folderKey].documents.push(doc);
    });

    return Object.entries(groups).sort(([keyA, a], [keyB, b]) => {
      if (keyA === "uncategorized") return 1;
      if (keyB === "uncategorized") return -1;
      return a.folderName.localeCompare(b.folderName);
    });
  }, [filteredDocuments]);

  const toggleFolder = (folderKey: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(folderKey)) {
        newSet.delete(folderKey);
      } else {
        newSet.add(folderKey);
      }
      return newSet;
    });
  };

  useEffect(() => {
    if (documents.length > 0 && expandedFolders.size === 0) {
      const allFolderKeys = new Set(
        documents.map((doc) =>
          doc.folder_id ? String(doc.folder_id) : "uncategorized"
        )
      );
      setExpandedFolders(allFolderKeys);
    }
  }, [documents]);

  const toggleDocumentSelection = (document: Document) => {
    setSelectedDocuments((prev) => {
      const documentId = document.doc_id || document.id;
      const isSelected = prev.some(
        (doc) => (doc.doc_id || doc.id) === documentId
      );
      if (isSelected) {
        return prev.filter((doc) => (doc.doc_id || doc.id) !== documentId);
      }
      return [...prev, document];
    });
  };

  const handleConfirm = () => {
    onSelectDocuments(selectedDocuments);
    setSelectedDocuments([]);
    onClose();
  };

  const handleCancel = () => {
    setSelectedDocuments([]);
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]"
    >
      <div
        className={`rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col ${
          isDashboardThemeEnabled
            ? "bg-base-100 text-base-content border border-base-300/70"
            : "bg-white"
        }`}
      >
        <div
          className={`flex items-center justify-between p-6 border-b ${
            isDashboardThemeEnabled ? "border-base-300" : ""
          }`}
        >
          <h2
            className={`text-xl font-semibold ${
              isDashboardThemeEnabled ? "text-base-content" : "text-gray-900"
            }`}
          >
            Select Documents
          </h2>
          <button
            onClick={handleCancel}
            className={`p-2 rounded-lg transition-colors ${
              isDashboardThemeEnabled
                ? "hover:bg-base-200 text-base-content/70"
                : "hover:bg-gray-100"
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div
          className={`p-6 border-b ${
            isDashboardThemeEnabled ? "border-base-300" : ""
          }`}
        >
          <div className="relative">
            <Search
              className={`w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 ${
                isDashboardThemeEnabled
                  ? "text-base-content/40"
                  : "text-gray-400"
              }`}
            />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg ${
                isDashboardThemeEnabled
                  ? "bg-base-100 border border-base-300 text-base-content placeholder:text-base-content/40 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  : "border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent"
              }`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className={`animate-spin rounded-full h-10 w-10 border-b-2 mb-3 ${
                  isDashboardThemeEnabled ? "border-primary" : "border-green-600"
                }`}
              />
              <p
                className={`text-sm ${
                  isDashboardThemeEnabled
                    ? "text-base-content/55"
                    : "text-gray-500"
                }`}
              >
                Loading documents...
              </p>
            </div>
          ) : !hasLoadedOnce ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div
                className={`animate-spin rounded-full h-10 w-10 border-b-2 mb-3 ${
                  isDashboardThemeEnabled ? "border-primary" : "border-green-600"
                }`}
              />
              <p
                className={`text-sm ${
                  isDashboardThemeEnabled
                    ? "text-base-content/55"
                    : "text-gray-500"
                }`}
              >
                Loading documents...
              </p>
            </div>
          ) : documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText
                className={`w-12 h-12 mb-3 ${
                  isDashboardThemeEnabled
                    ? "text-base-content/25"
                    : "text-gray-300"
                }`}
              />
              <p
                className={`font-medium ${
                  isDashboardThemeEnabled
                    ? "text-base-content/75"
                    : "text-gray-600"
                }`}
              >
                No documents found
              </p>
              <p
                className={`text-sm mt-1 ${
                  isDashboardThemeEnabled
                    ? "text-base-content/50"
                    : "text-gray-400"
                }`}
              >
                This folder is empty. Upload your first document to get started.
              </p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText
                className={`w-12 h-12 mb-3 ${
                  isDashboardThemeEnabled
                    ? "text-base-content/25"
                    : "text-gray-300"
                }`}
              />
              <p
                className={`font-medium ${
                  isDashboardThemeEnabled
                    ? "text-base-content/75"
                    : "text-gray-600"
                }`}
              >
                No documents found matching your search.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedDocuments.map(([folderKey, { folderName, documents: folderDocs }]) => (
                <FolderDocumentGroup
                  key={folderKey}
                  folderKey={folderKey}
                  folderName={folderName}
                  documents={folderDocs}
                  isExpanded={expandedFolders.has(folderKey)}
                  selectedDocuments={selectedDocuments}
                  onToggleFolder={toggleFolder}
                  onToggleDocument={toggleDocumentSelection}
                />
              ))}
            </div>
          )}
        </div>

        <div
          className={`flex items-center justify-between p-6 border-t ${
            isDashboardThemeEnabled
              ? "bg-base-200/60 border-base-300"
              : "bg-gray-50"
          }`}
        >
          <div
            className={`text-sm ${
              isDashboardThemeEnabled
                ? "text-base-content/65"
                : "text-gray-600"
            }`}
          >
            {selectedDocuments.length} document
            {selectedDocuments.length !== 1 ? "s" : ""} selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={handleCancel}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDashboardThemeEnabled
                  ? "text-base-content border border-base-300 hover:bg-base-100"
                  : "text-gray-700 border border-gray-300 hover:bg-gray-50"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={selectedDocuments.length === 0}
              className={`px-4 py-2 rounded-lg transition-colors ${
                isDashboardThemeEnabled
                  ? "bg-primary text-primary-content hover:bg-secondary disabled:bg-base-300 disabled:text-base-content/45"
                  : "bg-green-700 text-white hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              }`}
            >
              Attach {selectedDocuments.length > 0 && `(${selectedDocuments.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
