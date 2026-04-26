import React, { useState } from "react";
import { Link } from "@inertiajs/react";
import { Eye } from "lucide-react";
import { RecentFile } from "../types/dashboard";
import UploadDocumentViewer from "../../Document/components/FileUpload/UploadDocumentViewer";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface RecentFilesProps {
  files: RecentFile[];
}

export default function RecentFiles({ files }: RecentFilesProps) {
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  const handleViewDocument = (file: RecentFile) => {
    if (typeof file.id === "number") {
      setSelectedDocId(file.id);
      setSelectedFileName(file.title);
      setViewerOpen(true);
    }
  };

  return (
    <div
      className={`rounded-3xl shadow-lg overflow-hidden ${
        isDashboardThemeEnabled
          ? "border border-base-300/70 bg-base-100/90"
          : "border border-green-100/50"
      }`}
      style={
        isDashboardThemeEnabled
          ? undefined
          : { background: "linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)" }
      }
    >
      <div className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2
            className={`text-xl font-semibold ${
              isDashboardThemeEnabled ? "text-base-content" : "text-white"
            }`}
          >
            RECENT ADDED FILES
          </h2>
          <span
            className={`text-sm font-normal ${
              isDashboardThemeEnabled ? "text-base-content/60" : "text-gray-200"
            }`}
          >
            {files.length} files
          </span>
        </div>

        <div data-lenis-prevent
          className={`space-y-4 ${
            files.length > 2 ? "max-h-[280px] overflow-y-auto custom-scrollbar pr-2" : ""
          }`}
        >
          {files.length === 0 ? (
            <div className="py-8 text-center">
              <div
                className={`mb-3 ${
                  isDashboardThemeEnabled ? "text-base-content/35" : "text-gray-400"
                }`}
              >
                <svg
                  className="mx-auto h-16 w-16"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3
                className={`mb-1 font-semibold ${
                  isDashboardThemeEnabled ? "text-base-content" : "text-gray-200"
                }`}
              >
                No files added today
              </h3>
              <p
                className={`text-sm font-normal ${
                  isDashboardThemeEnabled ? "text-base-content/60" : "text-gray-300"
                }`}
              >
                Files added today will appear here
              </p>
            </div>
          ) : (
            files.map((file) => (
              <div
                key={file.id}
                className={`group cursor-pointer rounded-lg p-4 transition-all duration-200 hover:shadow-sm ${
                  isDashboardThemeEnabled
                    ? "border border-base-300/70 bg-base-100 hover:border-primary/25 hover:bg-base-200/80"
                    : "border border-green-700/30 hover:border-green-500/50 hover:bg-green-900/20"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3
                      className={`mb-2 line-clamp-2 font-semibold leading-tight transition-colors ${
                        isDashboardThemeEnabled
                          ? "text-base-content group-hover:text-primary"
                          : "text-white group-hover:text-green-300"
                      }`}
                    >
                      {file.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          isDashboardThemeEnabled
                            ? "bg-primary/10 text-primary"
                            : "bg-green-900/50 text-green-200"
                        }`}
                      >
                        PDF
                      </span>
                      <span
                        className={`font-normal ${
                          isDashboardThemeEnabled
                            ? "text-base-content/65"
                            : "text-gray-300"
                        }`}
                      >
                        {file.timestamp}
                      </span>
                      <span
                        className={
                          isDashboardThemeEnabled
                            ? "text-base-content/25"
                            : "text-gray-600"
                        }
                      >
                        |
                      </span>
                      <span
                        className={`font-light ${
                          isDashboardThemeEnabled
                            ? "text-base-content/45"
                            : "text-gray-400"
                        }`}
                      >
                        {file.date}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDocument(file);
                      }}
                      className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 mt-1 ${
                        isDashboardThemeEnabled
                          ? 'bg-info/10 text-info hover:bg-info/20 hover:shadow-sm'
                          : 'bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm'
                      }`}
                      title="View document"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div
          className={`mt-4 border-t pt-4 ${
            isDashboardThemeEnabled
              ? "border-base-300/70"
              : "border-green-700/30"
          }`}
        >
          <Link
            href="/admin/documents"
            className={`inline-block text-sm font-medium ${
              isDashboardThemeEnabled
                ? "text-primary hover:text-secondary"
                : "text-green-300 hover:text-green-200"
            }`}
          >
            View all files -&gt;
          </Link>
        </div>
      </div>

      <UploadDocumentViewer
        isOpen={viewerOpen}
        onClose={() => {
          setViewerOpen(false);
          setSelectedDocId(null);
          setSelectedFileName("");
        }}
        docId={selectedDocId}
        fileName={selectedFileName}
      />
    </div>
  );
}
