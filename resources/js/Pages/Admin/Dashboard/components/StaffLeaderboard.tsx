import React from "react";
import {
  Users,
  Trophy,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface StaffMember {
  name: string;
  count: number;
  first_letter: string;
  profile_picture?: string;
  role: string;
}

interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface StaffLeaderboardProps {
  data: StaffMember[];
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;
}

const StaffLeaderboard: React.FC<StaffLeaderboardProps> = ({
  data,
  pagination,
  onPageChange,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  return (
    <div
      className={`group overflow-hidden rounded-3xl shadow-lg transition-all duration-500 hover:shadow-2xl ${
        isDashboardThemeEnabled
          ? "border border-base-300/70 bg-base-100/90"
          : "border border-green-100/50"
      }`}
      style={
        isDashboardThemeEnabled
          ? undefined
          : { background: "linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)" }
      }
    >
      <div className="flex items-center justify-between p-6 pb-4">
        <div className="flex items-center gap-3">
          <div
            className={`rounded-xl p-2 ${
              isDashboardThemeEnabled ? "bg-primary/10" : "bg-white/20"
            }`}
          >
            <Users
              className={`h-5 w-5 ${
                isDashboardThemeEnabled ? "text-primary" : "text-[#FBEC5D]"
              }`}
            />
          </div>
          <div>
            <h3
              className={`text-lg font-bold uppercase tracking-tight ${
                isDashboardThemeEnabled ? "text-base-content" : "text-white"
              }`}
            >
              Staff Productivity
            </h3>
            <p
              className={`text-[0.65rem] font-medium uppercase tracking-wider ${
                isDashboardThemeEnabled
                  ? "text-base-content/55"
                  : "text-white/70"
              }`}
            >
              Top Uploaders
            </p>
          </div>
        </div>
        <Trophy
          className={`h-5 w-5 opacity-50 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100 ${
            isDashboardThemeEnabled ? "text-secondary" : "text-[#FBEC5D]"
          }`}
        />
      </div>

      <div className="space-y-4 px-6 pb-6">
        {data.length === 0 ? (
          <div
            className={`py-8 text-center text-sm font-medium ${
              isDashboardThemeEnabled ? "text-base-content/55" : "text-white/60"
            }`}
          >
            No activity recorded yet
          </div>
        ) : (
          data.map((staff, index) => (
            <div key={index} className="group/item flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-full text-xs font-black transition-colors duration-300 ${
                    isDashboardThemeEnabled
                      ? "border border-base-300 bg-base-200 text-base-content group-hover/item:bg-primary group-hover/item:text-primary-content"
                      : "border border-white/20 bg-white/10 text-white group-hover/item:bg-[#FBEC5D] group-hover/item:text-gray-900"
                  }`}
                >
                  {staff.profile_picture ? (
                    <img
                      src={
                        staff.profile_picture.startsWith("http")
                          ? staff.profile_picture
                          : `/storage/${staff.profile_picture}`
                      }
                      alt={staff.name}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    staff.first_letter
                  )}
                </div>
                <div>
                  <p
                    className={`mb-1 text-sm font-bold leading-none ${
                      isDashboardThemeEnabled ? "text-base-content" : "text-white"
                    }`}
                  >
                    {staff.name}
                  </p>
                  <p
                    className={`text-[0.65rem] font-medium ${
                      isDashboardThemeEnabled
                        ? "text-base-content/50"
                        : "text-white/50"
                    }`}
                  >
                    {staff.role}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center justify-end gap-1.5">
                  <span
                    className={`text-sm font-black ${
                      isDashboardThemeEnabled ? "text-primary" : "text-[#FBEC5D]"
                    }`}
                  >
                    {staff.count}
                  </span>
                  <TrendingUp
                    className={`h-3 w-3 ${
                      isDashboardThemeEnabled ? "text-primary" : "text-[#FBEC5D]"
                    }`}
                  />
                </div>
                <p
                  className={`text-[0.6rem] font-bold uppercase tracking-tighter ${
                    isDashboardThemeEnabled
                      ? "text-base-content/45"
                      : "text-white/40"
                  }`}
                >
                  Documents
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {pagination && pagination.last_page > 1 && onPageChange && (
        <div
          className={`mx-6 mt-2 border-t px-6 pb-6 pt-2 ${
            isDashboardThemeEnabled
              ? "border-base-300/70"
              : "border-white/10"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-[0.65rem] font-medium ${
                isDashboardThemeEnabled
                  ? "text-base-content/55"
                  : "text-white/60"
              }`}
            >
              {pagination.from}-{pagination.to} of {pagination.total} staff
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className={`rounded-lg p-1.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 ${
                  isDashboardThemeEnabled
                    ? "bg-base-200 text-base-content hover:bg-base-300"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <span
                className={`text-[0.65rem] font-bold ${
                  isDashboardThemeEnabled ? "text-base-content" : "text-white"
                }`}
              >
                {pagination.current_page}/{pagination.last_page}
              </span>
              <button
                onClick={() => onPageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className={`rounded-lg p-1.5 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-30 ${
                  isDashboardThemeEnabled
                    ? "bg-base-200 text-base-content hover:bg-base-300"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className={`h-1 w-full ${
          isDashboardThemeEnabled
            ? "bg-gradient-to-r from-transparent via-primary/30 to-transparent"
            : "bg-gradient-to-r from-transparent via-[#FBEC5D]/30 to-transparent"
        }`}
      ></div>
    </div>
  );
};

export default StaffLeaderboard;
