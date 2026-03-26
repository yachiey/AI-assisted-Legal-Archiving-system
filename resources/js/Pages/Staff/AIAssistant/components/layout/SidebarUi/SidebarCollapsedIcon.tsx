import React, { useState } from "react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface SidebarCollapsedIconProps {
  onExpand: () => void;
}

export const SidebarCollapsedIcon: React.FC<SidebarCollapsedIconProps> = ({
  onExpand,
}) => {
  const { theme } = useDashboardTheme("staff");
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="w-16 h-full relative flex flex-col items-center justify-start pt-4 shadow-2xl">
      <div
        className={`absolute inset-0 ${
          isDashboardThemeEnabled
            ? "bg-gradient-to-b from-primary/95 via-primary/90 to-secondary/90"
            : "bg-gradient-to-b from-green-900/95 via-emerald-900/95 to-teal-900/95"
        }`}
      />
      <div
        className={`absolute inset-0 ${
          isDashboardThemeEnabled
            ? "bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.18),transparent_70%)]"
            : "bg-[radial-gradient(circle_at_50%_20%,rgba(74,222,128,0.15),transparent_70%)]"
        }`}
      />
      <div className="absolute inset-0 backdrop-blur-3xl bg-gradient-to-b from-white/10 via-white/5 to-transparent" />
      <div
        className={`absolute inset-y-0 right-0 w-1 ${
          isDashboardThemeEnabled
            ? "bg-gradient-to-b from-primary-content/30 via-primary-content/20 to-transparent"
            : "bg-gradient-to-b from-green-400/30 via-green-500/30 to-green-600/30"
        }`}
      />

      <div className="relative z-10 flex flex-col items-center w-full">
        <button
          onClick={onExpand}
          className="p-3 rounded-xl transition-all duration-300 hover:scale-110 mb-6 group relative shadow-lg"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          title="Expand Sidebar"
          style={
            isDashboardThemeEnabled
              ? undefined
              : {
                  background:
                    "linear-gradient(135deg, rgba(34, 197, 94, 0.3) 0%, rgba(22, 163, 74, 0.2) 100%)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  border: "1px solid rgba(74, 222, 128, 0.4)",
                  boxShadow:
                    "0 8px 32px 0 rgba(34, 197, 94, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
                }
          }
        >
          {isDashboardThemeEnabled && (
            <div className="absolute inset-0 rounded-xl border border-primary-content/20 bg-primary-content/14 shadow-[0_8px_32px_rgba(0,0,0,0.18)]" />
          )}
          <svg
            className="relative w-6 h-6 text-white drop-shadow-lg"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <div
            className={`absolute inset-0 rounded-xl transition-all duration-300 ${
              isDashboardThemeEnabled
                ? "bg-primary-content/0 group-hover:bg-primary-content/15"
                : "bg-green-400/0 group-hover:bg-green-400/20"
            }`}
          />
        </button>

        <div
          className={`text-[10px] font-bold transform -rotate-90 whitespace-nowrap tracking-widest drop-shadow-lg mt-4 ${
            isDashboardThemeEnabled
              ? "text-primary-content/80"
              : "text-green-200/90"
          }`}
        >
          HISTORY
        </div>
      </div>

      {isHovered && (
        <div
          className={`absolute left-full ml-2 top-16 text-sm px-3 py-2 rounded-xl shadow-2xl whitespace-nowrap z-50 ${
            isDashboardThemeEnabled
              ? "bg-base-100 text-base-content border border-base-300"
              : "text-white"
          }`}
          style={
            isDashboardThemeEnabled
              ? undefined
              : {
                  background:
                    "linear-gradient(135deg, rgba(31, 41, 55, 0.95) 0%, rgba(17, 24, 39, 0.95) 100%)",
                  backdropFilter: "blur(20px) saturate(180%)",
                  WebkitBackdropFilter: "blur(20px) saturate(180%)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  boxShadow:
                    "0 8px 32px 0 rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.1)",
                }
          }
        >
          Click to expand history
        </div>
      )}
    </div>
  );
};
