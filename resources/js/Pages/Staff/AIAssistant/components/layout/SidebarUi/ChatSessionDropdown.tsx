import React, { useState } from "react";
import { ChevronRight, FolderInput, Star, StarOff, Trash2, X } from "lucide-react";
import { AIFolder } from "../../../types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface ChatSessionDropdownProps {
  isStarred: boolean;
  folders?: AIFolder[];
  currentFolderId?: number | null;
  onStar?: () => void;
  onUnstar?: () => void;
  onDelete: () => void;
  onMoveToFolder?: (folderId: number | null) => void;
  onClose: () => void;
}

export const ChatSessionDropdown: React.FC<ChatSessionDropdownProps> = ({
  isStarred,
  folders = [],
  currentFolderId = null,
  onStar,
  onUnstar,
  onDelete,
  onMoveToFolder,
  onClose,
}) => {
  const { theme } = useDashboardTheme("staff");
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [showMoveMenu, setShowMoveMenu] = useState(false);

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className={`relative backdrop-blur-xl rounded-xl shadow-2xl min-w-[180px] overflow-hidden ${
        isDashboardThemeEnabled
          ? "bg-base-100/95 border border-base-300 text-base-content"
          : "bg-gray-900/95 border-2 border-white/20"
      }`}
    >
      <div
        className={`absolute inset-0 pointer-events-none ${
          isDashboardThemeEnabled
            ? "bg-gradient-to-br from-primary/5 to-transparent"
            : "bg-gradient-to-br from-white/10 to-transparent"
        }`}
      />

      {!showMoveMenu && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (isStarred && onUnstar) {
                onUnstar();
              } else if (!isStarred && onStar) {
                onStar();
              }
              onClose();
            }}
            className={`relative w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all ${
              isDashboardThemeEnabled
                ? "text-base-content hover:bg-base-200 border-b border-base-300"
                : "text-white hover:bg-white/20 border-b border-white/10"
            }`}
          >
            {isStarred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            {isStarred ? "Unstar" : "Star"}
          </button>

          {onMoveToFolder && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(true);
              }}
              className={`relative w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center justify-between transition-all ${
                isDashboardThemeEnabled
                  ? "text-base-content hover:bg-base-200 border-b border-base-300"
                  : "text-white hover:bg-white/20 border-b border-white/10"
              }`}
            >
              <span className="flex items-center gap-2">
                <FolderInput className="w-4 h-4" />
                Move to folder
              </span>
              <ChevronRight className="w-4 h-4 opacity-70" />
            </button>
          )}

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
              onClose();
            }}
            className={`relative w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all ${
              isDashboardThemeEnabled
                ? "text-error hover:bg-error/10"
                : "text-red-300 hover:bg-red-500/30 hover:text-white"
            }`}
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </>
      )}

      {showMoveMenu && onMoveToFolder && (
        <>
          <div
            className={`relative px-3 py-2 text-xs uppercase tracking-wider font-bold flex items-center justify-between border-b ${
              isDashboardThemeEnabled
                ? "text-base-content/70 border-base-300 bg-base-200/60"
                : "text-white/70 border-white/10 bg-white/5"
            }`}
          >
            <span>Move to…</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoveMenu(false);
              }}
              className="opacity-80 hover:opacity-100"
              aria-label="Back"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto">
            {currentFolderId !== null && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMoveToFolder(null);
                  onClose();
                }}
                className={`relative w-full text-left px-4 py-2 text-sm font-medium transition-all ${
                  isDashboardThemeEnabled
                    ? "text-base-content hover:bg-base-200 border-b border-base-300"
                    : "text-white hover:bg-white/20 border-b border-white/10"
                }`}
              >
                Remove from folder
              </button>
            )}

            {folders.length === 0 ? (
              <div
                className={`px-4 py-3 text-xs italic ${
                  isDashboardThemeEnabled ? "text-base-content/60" : "text-white/60"
                }`}
              >
                No folders yet. Create one from the sidebar.
              </div>
            ) : (
              folders.map((f) => (
                <button
                  key={f.folder_id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveToFolder(f.folder_id);
                    onClose();
                  }}
                  disabled={f.folder_id === currentFolderId}
                  className={`relative w-full text-left px-4 py-2 text-sm font-medium transition-all flex items-center justify-between gap-2 ${
                    f.folder_id === currentFolderId
                      ? isDashboardThemeEnabled
                        ? "text-base-content/40 cursor-not-allowed"
                        : "text-white/40 cursor-not-allowed"
                      : isDashboardThemeEnabled
                        ? "text-base-content hover:bg-base-200"
                        : "text-white hover:bg-white/20"
                  }`}
                >
                  <span className="truncate">{f.name}</span>
                  {f.folder_id === currentFolderId && (
                    <span className="text-[10px] uppercase opacity-70">current</span>
                  )}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};
