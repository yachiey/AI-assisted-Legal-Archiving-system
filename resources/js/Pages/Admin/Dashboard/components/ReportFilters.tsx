import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import axios from "axios";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface Folder {
  folder_id: number;
  folder_name: string;
}

interface ReportFiltersProps {
  selectedPeriod: "week" | "month" | "year";
  selectedCategory: string;
  onPeriodChange: (period: "week" | "month" | "year") => void;
  onCategoryChange: (category: string) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
  selectedPeriod,
  selectedCategory,
  onPeriodChange,
  onCategoryChange,
}) => {
  const [folders, setFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await axios.get("/api/manual-process/folders", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            Accept: "application/json",
          },
        });
        setFolders(response.data);
      } catch (error) {
        console.error("Error fetching folders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFolders();
  }, []);

  return (
    <div
      className={`rounded-3xl p-6 shadow-lg ${
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
      <div className="flex flex-wrap items-center gap-6">
        <div
          className={`flex items-center gap-3 ${
            isDashboardThemeEnabled ? "text-base-content" : "text-white"
          }`}
        >
          <div
            className={`rounded-lg p-2 ${
              isDashboardThemeEnabled ? "bg-primary/10 text-primary" : "bg-white/20"
            }`}
          >
            <Filter className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-semibold uppercase tracking-tight">
            FILTERS:
          </h2>
        </div>

        <div className="flex gap-2">
          {(["week", "month", "year"] as const).map((period) => (
            <button
              key={period}
              onClick={() => onPeriodChange(period)}
              className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                selectedPeriod === period
                  ? isDashboardThemeEnabled
                    ? "scale-105 bg-primary text-primary-content shadow-xl"
                    : "scale-105 text-gray-900 shadow-xl"
                  : isDashboardThemeEnabled
                    ? "bg-base-200 text-base-content/70 hover:bg-base-300"
                    : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
              style={
                selectedPeriod === period && !isDashboardThemeEnabled
                  ? {
                      background:
                        "linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)",
                    }
                  : undefined
              }
            >
              {period}
            </button>
          ))}
        </div>

        <div className="min-w-[200px] flex-1">
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`w-full cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold transition-all duration-300 focus:outline-none ${
              isDashboardThemeEnabled
                ? "border border-base-300 bg-base-100 text-base-content hover:bg-base-200 focus:ring-2 focus:ring-primary"
                : "border-none bg-white/10 text-white hover:bg-white/20 focus:ring-2 focus:ring-[#FBEC5D]"
            }`}
            disabled={loading}
            style={isDashboardThemeEnabled ? undefined : { color: "white" }}
          >
            <option value="all" style={{ color: "#1f2937", background: "white" }}>
              ALL FOLDERS
            </option>
            {folders.map((folder) => (
              <option
                key={folder.folder_id}
                value={folder.folder_id.toString()}
                style={{ color: "#1f2937", background: "white" }}
              >
                {folder.folder_name.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default ReportFilters;
