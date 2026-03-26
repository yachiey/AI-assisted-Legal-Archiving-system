import React from "react";
import { Eye, FileText } from "lucide-react";
import { DocumentReference } from "../../types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

interface FileLinkProps {
  document: DocumentReference;
  onViewDocument?: (docId: number) => void;
  onNavigate?: (doc: DocumentReference) => void;
}

export const FileLink: React.FC<FileLinkProps> = ({
  document,
  onViewDocument,
  onNavigate,
}) => {
  const { theme } = useDashboardTheme("staff");
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewDocument?.(document.doc_id);
  };

  const handleNavigate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onNavigate?.(document);
  };

  return (
    <div
      className={`flex w-full max-w-full items-center gap-2 rounded-2xl border px-3 py-2.5 text-sm ${
        isDashboardThemeEnabled
          ? "border-base-300 bg-base-200/70 text-base-content"
          : "border-green-100 bg-green-50/90 text-gray-900"
      }`}
    >
      <button
        onClick={handleNavigate}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
          isDashboardThemeEnabled
            ? "bg-base-100 text-primary hover:bg-base-300"
            : "bg-white text-[#228B22] hover:bg-green-100"
        }`}
        title="Go to document location"
      >
        <FileText size={15} />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-left font-semibold">{document.title}</p>
        {document.folder_name && (
          <p
            className={`truncate text-xs ${
              isDashboardThemeEnabled
                ? "text-base-content/55"
                : "text-gray-500"
            }`}
          >
            {document.folder_name}
          </p>
        )}
      </div>

      <button
        onClick={handleView}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${
          isDashboardThemeEnabled
            ? "bg-primary text-primary-content hover:bg-secondary"
            : "bg-[#228B22] text-white hover:bg-[#1a6b1a]"
        }`}
        title={`View "${document.title}"`}
      >
        <Eye size={15} />
      </button>
    </div>
  );
};
