import React from "react";
import { ArrowLeft, Home, ChevronRight } from "lucide-react";
import { BreadcrumbNavProps, Folder } from "../../types/types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

const BreadcrumbNav: React.FC<BreadcrumbNavProps> = ({
  currentFolder,
  onNavigate,
  breadcrumbPath = [],
}) => {
  const { theme } = useDashboardTheme("staff");
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  const handleBackClick = (): void => {
    onNavigate(null);
  };

  const handleBreadcrumbClick = (folder: Folder): void => {
    onNavigate(folder);
  };

  const handleHomeClick = (): void => {
    onNavigate(null);
  };

  return (
    <div
      className={`flex items-center gap-2 mb-4 p-4 rounded-xl shadow-sm ${
        isDashboardThemeEnabled
          ? "bg-base-100 border border-base-300 text-base-content"
          : "bg-white border border-gray-200"
      }`}
    >
      <button
        onClick={handleBackClick}
        className={`flex items-center gap-2 transition-all px-3 py-2 rounded-lg font-semibold ${
          isDashboardThemeEnabled
            ? "text-base-content hover:text-primary hover:bg-base-200"
            : "text-gray-700 hover:text-green-600 hover:bg-gray-100"
        }`}
        type="button"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="hidden sm:inline">Back to folders</span>
        <span className="sm:hidden">Back</span>
      </button>

      <div
        className={`w-px h-6 mx-2 ${
          isDashboardThemeEnabled ? "bg-base-300" : "bg-gray-300"
        }`}
      />

      <div className="flex items-center gap-2 min-w-0 flex-1">
        <button
          onClick={handleHomeClick}
          className={`flex items-center gap-1 transition-all px-2 py-1 rounded-lg font-normal ${
            isDashboardThemeEnabled
              ? "text-base-content/70 hover:text-primary hover:bg-base-200"
              : "text-gray-600 hover:text-green-600 hover:bg-gray-100"
          }`}
          type="button"
          title="Go to root directory"
        >
          <Home className="w-4 h-4" />
          <span className="hidden md:inline text-sm">Root</span>
        </button>

        {breadcrumbPath.length > 0 && (
          <>
            {breadcrumbPath.map((folder) => (
              <React.Fragment key={folder.folder_id}>
                <ChevronRight
                  className={`w-4 h-4 ${
                    isDashboardThemeEnabled
                      ? "text-base-content/35"
                      : "text-gray-400"
                  }`}
                />
                <button
                  onClick={() => handleBreadcrumbClick(folder)}
                  className={`transition-all text-sm px-2 py-1 rounded-lg truncate max-w-32 font-normal ${
                    isDashboardThemeEnabled
                      ? "text-base-content/70 hover:text-primary hover:bg-base-200"
                      : "text-gray-600 hover:text-green-600 hover:bg-gray-100"
                  }`}
                  type="button"
                  title={folder.folder_path}
                >
                  {folder.folder_name}
                </button>
              </React.Fragment>
            ))}
          </>
        )}

        {currentFolder && (
          <>
            <ChevronRight
              className={`w-4 h-4 ${
                isDashboardThemeEnabled
                  ? "text-base-content/35"
                  : "text-gray-400"
              }`}
            />
            <span
              className={`font-semibold text-sm truncate max-w-40 ${
                isDashboardThemeEnabled ? "text-base-content" : "text-gray-900"
              }`}
              title={currentFolder.folder_path}
            >
              {currentFolder.folder_name}
            </span>
          </>
        )}
      </div>

      {currentFolder && (
        <div
          className={`hidden lg:flex items-center gap-2 text-xs px-3 py-2 rounded-lg font-normal ${
            isDashboardThemeEnabled
              ? "text-base-content/65 bg-base-200"
              : "text-gray-600 bg-gray-100"
          }`}
        >
          <span title={currentFolder.updated_at}>
            Updated {new Date(currentFolder.updated_at).toLocaleDateString()}
          </span>
        </div>
      )}
    </div>
  );
};

export default BreadcrumbNav;

