import React from "react";
import { PieChart, ChevronLeft, ChevronRight } from "lucide-react";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface CategoryData {
  category: string;
  count: number;
  percentage: number;
}

interface PaginationData {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
  from: number;
  to: number;
}

interface CategoryChartProps {
  data: CategoryData[];
  pagination?: PaginationData;
  onPageChange?: (page: number) => void;
}

const CategoryChart: React.FC<CategoryChartProps> = ({
  data,
  pagination,
  onPageChange,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const folderData = Array.isArray(data) ? data : [];

  return (
    <div
      className={`rounded-3xl p-6 shadow-md transition-all duration-500 hover:shadow-2xl ${
        isDashboardThemeEnabled
          ? "border border-base-300/70 bg-base-100/90"
          : ""
      }`}
      style={
        isDashboardThemeEnabled
          ? undefined
          : { background: "linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)" }
      }
    >
      <div className="mb-6 flex items-center gap-3">
        <div
          className={`rounded-lg p-2 ${
            isDashboardThemeEnabled ? "bg-primary/10" : "bg-white/20"
          }`}
        >
          <PieChart
            className={`h-6 w-6 ${
              isDashboardThemeEnabled ? "text-primary" : "text-white"
            }`}
          />
        </div>
        <h2
          className={`text-xl font-bold ${
            isDashboardThemeEnabled ? "text-base-content" : "text-white"
          }`}
        >
          DOCUMENTS BY FOLDER
        </h2>
      </div>

      {folderData.length === 0 ? (
        <div
          className={`py-8 text-center ${
            isDashboardThemeEnabled ? "text-base-content/60" : "text-white/70"
          }`}
        >
          <p className="font-normal">No folders with documents</p>
        </div>
      ) : (
        <div className="space-y-4">
          {folderData.map((item, index) => (
            <div key={index} className="group">
              <div className="mb-2 flex items-center justify-between">
                <span
                  className={`font-semibold ${
                    isDashboardThemeEnabled ? "text-base-content" : "text-white"
                  }`}
                >
                  {item.category}
                </span>
                <span
                  className={`font-medium ${
                    isDashboardThemeEnabled ? "text-primary" : ""
                  }`}
                  style={
                    isDashboardThemeEnabled
                      ? undefined
                      : { color: "#FBEC5D" }
                  }
                >
                  {item.count} docs
                </span>
              </div>
              <div
                className={`relative h-3 overflow-hidden rounded-full ${
                  isDashboardThemeEnabled ? "bg-base-300/80" : "bg-white/20"
                }`}
              >
                <div
                  className="absolute left-0 top-0 h-full rounded-full shadow-lg transition-all duration-500"
                  style={{
                    width: `${item.percentage}%`,
                    background: isDashboardThemeEnabled
                      ? "linear-gradient(90deg, oklch(var(--p) / 0.95) 0%, oklch(var(--s) / 0.85) 100%)"
                      : "linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)",
                  }}
                ></div>
              </div>
              <div
                className={`mt-1 text-xs font-medium ${
                  isDashboardThemeEnabled
                    ? "text-base-content/60"
                    : "text-white/80"
                }`}
              >
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.last_page > 1 && onPageChange && (
        <div
          className={`mt-6 border-t pt-4 ${
            isDashboardThemeEnabled
              ? "border-base-300/70"
              : "border-white/20"
          }`}
        >
          <div className="flex items-center justify-between">
            <p
              className={`text-sm font-normal ${
                isDashboardThemeEnabled
                  ? "text-base-content/60"
                  : "text-white/80"
              }`}
            >
              Showing {pagination.from} to {pagination.to} of {pagination.total}{" "}
              folders
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onPageChange(pagination.current_page - 1)}
                disabled={pagination.current_page === 1}
                className={`rounded-lg p-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDashboardThemeEnabled
                    ? "bg-base-200 text-base-content hover:bg-base-300"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span
                className={`text-sm font-medium ${
                  isDashboardThemeEnabled ? "text-base-content" : "text-white"
                }`}
              >
                Page {pagination.current_page} of {pagination.last_page}
              </span>
              <button
                onClick={() => onPageChange(pagination.current_page + 1)}
                disabled={pagination.current_page === pagination.last_page}
                className={`rounded-lg p-2 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isDashboardThemeEnabled
                    ? "bg-base-200 text-base-content hover:bg-base-300"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryChart;
