import React from "react";
import { Bot } from "lucide-react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface SidebarFooterProps {
  onAllChatsClick: () => void;
}

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  onAllChatsClick,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  return (
    <div className="relative p-5">
      <div
        className={`absolute inset-0 backdrop-blur-xl ${
          isDashboardThemeEnabled
            ? "bg-primary-content/6 border-t border-primary-content/10"
            : "bg-white/5 border-t border-white/10"
        }`}
      />

      <button
        onClick={onAllChatsClick}
        className={`relative w-full backdrop-blur-md px-4 py-3 rounded-2xl transition-all border shadow-lg group ${
          isDashboardThemeEnabled
            ? "bg-primary-content/10 hover:bg-primary-content/15 border-primary-content/15"
            : "bg-white/10 hover:bg-white/15 border-white/20"
        }`}
      >
        <div
          className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
            isDashboardThemeEnabled
              ? "bg-gradient-to-br from-primary-content/10 to-transparent"
              : "bg-gradient-to-br from-white/10 to-transparent"
          }`}
        />

        <div className="relative flex items-center gap-3">
          <Bot
            className={`w-5 h-5 group-hover:scale-110 transition-all ${
              isDashboardThemeEnabled
                ? "text-primary-content/85 group-hover:text-primary-content"
                : "text-white/90 group-hover:text-white"
            }`}
          />
          <span
            className={`text-sm font-bold transition-colors tracking-wide ${
              isDashboardThemeEnabled
                ? "text-primary-content/85 group-hover:text-primary-content"
                : "text-white/90 group-hover:text-white"
            }`}
          >
            ALL CHATS
          </span>
        </div>
      </button>
    </div>
  );
};
