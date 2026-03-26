import React from "react";
import { Edit, Trash2, Info, Download } from "lucide-react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

interface DocumentMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  onProperties: () => void;
  onDownload: () => void;
}

const DocumentMenu: React.FC<DocumentMenuProps> = ({
  onEdit,
  onDelete,
  onProperties,
  onDownload,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className={`w-40 rounded-xl shadow-lg overflow-hidden ${
        isDashboardThemeEnabled
          ? "bg-base-100 border border-base-300 text-base-content"
          : ""
      }`}
      style={
        isDashboardThemeEnabled
          ? undefined
          : {
              background: "white",
              border: "1px solid rgba(0, 0, 0, 0.1)",
              boxShadow: "0 10px 40px 0 rgba(100, 116, 139, 0.2)",
            }
      }
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="py-1 text-sm">
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onProperties)}
            className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-all font-medium ${
              isDashboardThemeEnabled
                ? "text-base-content hover:bg-base-200 hover:text-primary"
                : "hover:bg-white/30 text-gray-900 hover:text-[#228B22]"
            }`}
          >
            <Info className="w-4 h-4" />
            Properties
          </button>
        </li>

        <li>
          <button
            onClick={(e) => handleMenuClick(e, onEdit)}
            className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-all font-medium ${
              isDashboardThemeEnabled
                ? "text-base-content hover:bg-base-200 hover:text-primary"
                : "hover:bg-white/30 text-gray-900 hover:text-[#228B22]"
            }`}
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
        </li>
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onDownload)}
            className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-all font-medium ${
              isDashboardThemeEnabled
                ? "text-base-content hover:bg-base-200 hover:text-primary"
                : "hover:bg-white/30 text-gray-900 hover:text-[#228B22]"
            }`}
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </li>

        <li>
          <button
            onClick={(e) => handleMenuClick(e, onDelete)}
            className={`w-full text-left px-4 py-2 flex items-center gap-2 transition-all font-medium ${
              isDashboardThemeEnabled
                ? "text-error hover:bg-error/10 hover:text-error"
                : "hover:bg-red-50 text-red-600 hover:text-red-700"
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </li>
      </ul>
    </div>
  );
};

export default DocumentMenu;
