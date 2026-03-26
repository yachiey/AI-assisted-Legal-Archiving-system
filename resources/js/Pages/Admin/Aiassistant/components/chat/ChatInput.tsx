import React, { useState } from "react";
import { DocumentSelectionModal } from "../document/DocumentSelectionModal";
import { Document } from "../../types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

interface ChatInputProps {
  onSendMessage: (message: string, attachedDocuments?: Document[]) => void;
  disabled?: boolean;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  disabled = false,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [message, setMessage] = useState("");
  const [attachedDocuments, setAttachedDocuments] = useState<Document[]>([]);
  const [isDocumentModalOpen, setIsDocumentModalOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSendMessage(
        message,
        attachedDocuments.length > 0 ? attachedDocuments : undefined
      );
      setMessage("");
      setAttachedDocuments([]);
    }
  };

  const handleDocumentSelect = (documents: Document[]) => {
    setAttachedDocuments(documents);
  };

  const removeAttachedDocument = (documentId: number) => {
    setAttachedDocuments((prev) =>
      prev.filter((doc) => (doc.doc_id || doc.id) !== documentId)
    );
  };

  return (
    <div
      className={`p-6 ${
        isDashboardThemeEnabled
          ? "bg-base-100/90 border-t border-base-300"
          : "bg-white border-t border-gray-200"
      }`}
    >
      <div className="max-w-4xl mx-auto">
        {attachedDocuments.length > 0 && (
          <div className="mb-4">
            <div
              className={`p-4 rounded-2xl border ${
                isDashboardThemeEnabled
                  ? "bg-base-100 border-base-300"
                  : "bg-gradient-to-br from-[#FBEC5D]/10 to-[#F4D03F]/10 border-[#FBEC5D]/30"
              }`}
            >
              <div className="relative flex items-center justify-between mb-3">
                <h4
                  className={`text-sm font-bold ${
                    isDashboardThemeEnabled ? "text-primary" : "text-[#228B22]"
                  }`}
                >
                  Attached Documents ({attachedDocuments.length})
                </h4>
              </div>
              <div className="relative flex flex-wrap gap-2">
                {attachedDocuments.map((doc) => (
                  <div
                    key={doc.doc_id || doc.id}
                    className={`flex items-center rounded-xl px-3 py-1.5 text-sm shadow-sm ${
                      isDashboardThemeEnabled
                        ? "bg-base-200/70 border border-base-300 text-base-content"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <svg
                      className={`w-4 h-4 mr-2 ${
                        isDashboardThemeEnabled ? "text-primary" : "text-[#228B22]"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span
                      className={`mr-2 max-w-[150px] truncate font-medium ${
                        isDashboardThemeEnabled
                          ? "text-base-content"
                          : "text-gray-900"
                      }`}
                    >
                      {doc.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeAttachedDocument(doc.doc_id || doc.id)}
                      className={`transition-colors rounded-lg p-1 ${
                        isDashboardThemeEnabled
                          ? "text-base-content/45 hover:text-error hover:bg-base-300/70"
                          : "text-gray-400 hover:text-red-500 hover:bg-gray-100"
                      }`}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2.5"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-center gap-4">
          <div className="flex-1 relative">
            <div
              className={`relative h-14 rounded-2xl transition-all flex items-center shadow-sm ${
                isDashboardThemeEnabled
                  ? "bg-base-100 border border-base-300 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20"
                  : "bg-white border border-gray-300 focus-within:border-[#228B22] focus-within:ring-2 focus-within:ring-[#228B22]/20"
              }`}
            >
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask me anything about your documents..."
                disabled={disabled}
                className={`w-full h-full px-6 bg-transparent border-none rounded-2xl focus:outline-none text-base font-medium ${
                  isDashboardThemeEnabled
                    ? "text-base-content placeholder:text-base-content/40"
                    : "text-gray-900 placeholder-gray-400"
                }`}
              />

              <button
                type="button"
                onClick={() => setIsDocumentModalOpen(true)}
                className={`absolute right-4 top-1/2 transform -translate-y-1/2 p-2 rounded-lg transition-all ${
                  attachedDocuments.length > 0
                    ? isDashboardThemeEnabled
                      ? "bg-primary text-primary-content shadow-sm"
                      : "bg-[#228B22] text-white shadow-sm"
                    : isDashboardThemeEnabled
                      ? "text-base-content/45 hover:bg-base-200 hover:text-primary"
                      : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                }`}
                title="Attach documents"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="h-14 w-14">
            <button
              type="submit"
              disabled={disabled || !message.trim()}
              className={`w-full h-full flex items-center justify-center rounded-2xl transition-all shadow-md hover:shadow-lg disabled:shadow-none ${
                isDashboardThemeEnabled
                  ? "bg-primary hover:bg-secondary disabled:bg-base-300 disabled:text-base-content/45 text-primary-content"
                  : "bg-[#228B22] hover:bg-[#1a6b1a] disabled:bg-gray-300 disabled:text-gray-500 text-white"
              }`}
              title="Send message"
            >
              {disabled ? (
                <svg
                  className="relative w-6 h-6 animate-spin"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              ) : (
                <svg
                  className="relative w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>

        <DocumentSelectionModal
          isOpen={isDocumentModalOpen}
          onClose={() => setIsDocumentModalOpen(false)}
          onSelectDocuments={handleDocumentSelect}
        />
      </div>
    </div>
  );
};
