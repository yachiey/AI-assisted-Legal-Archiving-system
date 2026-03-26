import React from "react";
import { ArrowLeft } from "lucide-react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface SidebarHeaderProps {
  onBack?: () => void;
  onCollapse: () => void;
}

export const SidebarHeader: React.FC<SidebarHeaderProps> = ({
  onBack,
  onCollapse,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  return (
    <div className="relative px-5 py-5">
      <div
        className={`absolute inset-0 ${
          isDashboardThemeEnabled
            ? "bg-primary/90 border-b border-primary-content/10"
            : "bg-[#144a18] border-b border-green-700"
        }`}
      />

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack || (() => window.history.back())}
            className={`p-2 rounded-xl transition-all flex-shrink-0 group ${
              isDashboardThemeEnabled
                ? "hover:bg-primary-content/10"
                : "hover:bg-green-700/30"
            }`}
          >
            <ArrowLeft
              className={`w-5 h-5 group-hover:scale-110 transition-transform ${
                isDashboardThemeEnabled ? "text-primary-content" : "text-white"
              }`}
            />
          </button>

          <h2
            className={`text-lg font-bold truncate tracking-wide ${
              isDashboardThemeEnabled ? "text-primary-content" : "text-white"
            }`}
          >
            HISTORY
          </h2>
        </div>

        <button
          onClick={onCollapse}
          className={`p-2 rounded-xl transition-all group ${
            isDashboardThemeEnabled
              ? "hover:bg-primary-content/10"
              : "hover:bg-green-700/30"
          }`}
        >
          <span
            className={`font-bold text-lg group-hover:scale-110 inline-block transition-transform ${
              isDashboardThemeEnabled ? "text-primary-content" : "text-white"
            }`}
          >
            &lt;
          </span>
        </button>
      </div>
    </div>
  );
};
