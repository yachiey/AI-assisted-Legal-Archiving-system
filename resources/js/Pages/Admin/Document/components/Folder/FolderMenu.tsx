// FolderMenu.tsx
import React from "react";
import { Edit2, Trash2, Info } from "lucide-react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

interface FolderMenuProps {
  onRename: () => void;
  onDelete: () => void;
  onProperties: () => void;
}

const FolderMenu: React.FC<FolderMenuProps> = ({ onRename, onDelete, onProperties }) => {
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
      className={`absolute right-0 mt-2 w-40 rounded-xl z-50 overflow-hidden ${
        isDashboardThemeEnabled
          ? "border border-base-300/80 bg-base-100/95 text-base-content shadow-2xl backdrop-blur-xl"
          : "shadow-lg"
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
            className={`flex w-full items-center gap-2 px-4 py-2 text-left font-medium transition-all ${
              isDashboardThemeEnabled
                ? "text-base-content hover:bg-base-200/90 hover:text-primary"
                : "text-gray-900 hover:bg-white/30 hover:text-[#228B22]"
            }`}
          >
            <Info className="w-4 h-4" />
            Properties
          </button>
        </li>
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onRename)}
            className={`flex w-full items-center gap-2 px-4 py-2 text-left font-medium transition-all ${
              isDashboardThemeEnabled
                ? "text-base-content hover:bg-base-200/90 hover:text-primary"
                : "text-gray-900 hover:bg-white/30 hover:text-[#228B22]"
            }`}
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </button>
        </li>
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onDelete)}
            className={`flex w-full items-center gap-2 px-4 py-2 text-left font-medium transition-all ${
              isDashboardThemeEnabled
                ? "text-error hover:bg-error/10 hover:text-error"
                : "text-red-600 hover:bg-red-50 hover:text-red-700"
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

export default FolderMenu;
