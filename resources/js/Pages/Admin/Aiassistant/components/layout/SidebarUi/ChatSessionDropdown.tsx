import React from "react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface ChatSessionDropdownProps {
  isStarred: boolean;
  onStar?: () => void;
  onUnstar?: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export const ChatSessionDropdown: React.FC<ChatSessionDropdownProps> = ({
  isStarred,
  onStar,
  onUnstar,
  onDelete,
  onClose,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className={`relative backdrop-blur-xl rounded-xl shadow-2xl min-w-[120px] overflow-hidden ${
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
        className={`relative w-full text-left px-4 py-3 text-sm font-bold transition-all ${
          isDashboardThemeEnabled
            ? "text-base-content hover:bg-base-200 border-b border-base-300"
            : "text-white hover:bg-white/20 border-b border-white/10"
        }`}
      >
        {isStarred ? "UNSTAR" : "STAR"}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
          onClose();
        }}
        className={`relative w-full text-left px-4 py-3 text-sm font-bold transition-all ${
          isDashboardThemeEnabled
            ? "text-error hover:bg-error/10 hover:text-error"
            : "text-white hover:bg-red-500/30 hover:text-white"
        }`}
      >
        DELETE
      </button>
    </div>
  );
};
