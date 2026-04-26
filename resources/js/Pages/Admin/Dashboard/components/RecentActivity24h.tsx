import React from "react";
import { Activity as ActivityIcon } from "lucide-react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface Activity {
  action: string;
  document: string;
  user: string;
  time: string;
}

interface RecentActivity24hProps {
  activities: Activity[];
}

const RecentActivity24h: React.FC<RecentActivity24hProps> = ({ activities }) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  const getLast24HourActivities = () => {
    return activities.filter((activity) => {
      const timeStr = activity.time.toLowerCase();

      if (timeStr.includes("minute") || timeStr.includes("hour")) {
        return true;
      }

      if (timeStr.includes("day")) {
        const dayMatch = timeStr.match(/(\d+)\s*day/);
        if (dayMatch) {
          const daysAgo = parseInt(dayMatch[1]);
          return daysAgo === 1;
        }
      }

      return true;
    });
  };

  const last24HourActivities = getLast24HourActivities();

  return (
    <div
      className={`rounded-3xl p-6 shadow-lg ${
        isDashboardThemeEnabled
          ? "border border-base-300/70 bg-base-100/90"
          : "border border-green-700/30"
      }`}
      style={
        isDashboardThemeEnabled
          ? undefined
          : { background: "linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)" }
      }
    >
      <div className="mb-6 flex items-center gap-2">
        <div
          className={`rounded-lg p-2 ${
            isDashboardThemeEnabled ? "bg-primary/10" : "bg-green-900/50"
          }`}
        >
          <ActivityIcon
            className={`h-5 w-5 ${
              isDashboardThemeEnabled ? "text-primary" : "text-green-300"
            }`}
          />
        </div>
        <div className="flex-1">
          <h3
            className={`text-lg font-bold ${
              isDashboardThemeEnabled ? "text-base-content" : "text-white"
            }`}
          >
            Recent Activity
          </h3>
          <p
            className={`text-xs ${
              isDashboardThemeEnabled ? "text-base-content/55" : "text-gray-300"
            }`}
          >
            Last 24 hours
          </p>
        </div>
      </div>

      {last24HourActivities.length > 0 ? (
        <div data-lenis-prevent className="max-h-[380px] space-y-3 overflow-y-auto pr-2 custom-scrollbar">
          {last24HourActivities.map((activity, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 rounded-lg p-3 transition-all duration-200 ${
                isDashboardThemeEnabled
                  ? "border border-base-300/70 bg-base-200/60 hover:bg-base-200"
                  : "border border-green-700/30 bg-green-900/20 hover:bg-green-900/40"
              }`}
            >
              <div
                className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                  isDashboardThemeEnabled ? "bg-primary" : "bg-green-400"
                }`}
              ></div>
              <div className="min-w-0 flex-1">
                <p
                  className={`text-sm font-semibold ${
                    isDashboardThemeEnabled ? "text-base-content" : "text-white"
                  }`}
                >
                  {activity.action}
                </p>
                {activity.document && (
                  <p
                    className={`mt-0.5 truncate text-xs ${
                      isDashboardThemeEnabled
                        ? "text-base-content/65"
                        : "text-gray-300"
                    }`}
                  >
                    {activity.document}
                  </p>
                )}
                <div className="mt-1 flex items-center justify-between gap-2">
                  <p
                    className={`text-xs ${
                      isDashboardThemeEnabled
                        ? "text-base-content/55"
                        : "text-gray-400"
                    }`}
                  >
                    by {activity.user}
                  </p>
                  <span
                    className={`text-xs ${
                      isDashboardThemeEnabled
                        ? "text-base-content/45"
                        : "text-gray-500"
                    }`}
                  >
                    {activity.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <p
            className={`text-sm ${
              isDashboardThemeEnabled ? "text-base-content/55" : "text-gray-300"
            }`}
          >
            No activities in the last 24 hours
          </p>
        </div>
      )}
    </div>
  );
};

export default RecentActivity24h;
