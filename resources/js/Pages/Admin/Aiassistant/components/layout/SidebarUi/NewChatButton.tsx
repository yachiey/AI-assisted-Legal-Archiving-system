import React from "react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface NewChatButtonProps {
  onClick: () => void;
}

export const NewChatButton: React.FC<NewChatButtonProps> = ({ onClick }) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  return (
    <div className="px-5 pb-6 pt-2">
      <div className="relative group">
        <div
          className={`absolute -inset-1 rounded-3xl blur-xl opacity-40 group-hover:opacity-70 transition-all duration-300 ${
            isDashboardThemeEnabled
              ? "bg-gradient-to-r from-secondary/45 via-accent/40 to-primary/35"
              : "bg-gradient-to-r from-green-300 via-emerald-400 to-teal-400 animate-pulse"
          }`}
        />

        <button
          onClick={onClick}
          className={`relative w-full py-4 px-6 rounded-3xl transition-all font-bold text-lg shadow-2xl transform hover:scale-105 ${
            isDashboardThemeEnabled
              ? "backdrop-blur-xl bg-base-100/95 hover:bg-base-100 text-base-content border border-base-300/80"
              : "backdrop-blur-xl bg-gradient-to-r from-green-500/70 to-emerald-600/70 hover:from-green-500/80 hover:to-emerald-600/80 text-white border-2 border-white/30"
          }`}
        >
          <div
            className={`absolute inset-0 rounded-3xl pointer-events-none ${
              isDashboardThemeEnabled
                ? "bg-gradient-to-br from-base-100/10 via-transparent to-primary/10"
                : "bg-gradient-to-br from-white/20 to-transparent"
            }`}
          />

          <div className="relative flex items-center justify-center space-x-3 min-w-0">
            <svg
              className="w-7 h-7 flex-shrink-0 drop-shadow-lg"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            <span className={`truncate ${isDashboardThemeEnabled ? "" : "drop-shadow-md"}`}>
              New Chat
            </span>
          </div>
        </button>
      </div>
    </div>
  );
};
