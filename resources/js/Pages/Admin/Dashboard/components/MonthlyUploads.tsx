import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { MonthlyData } from "../types/dashboard";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface MonthlyUploadsProps {
  data: MonthlyData[];
}

export default function MonthlyUploads({ data }: MonthlyUploadsProps) {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  if (!data || data.length === 0) {
    return (
      <div
        className={`rounded-3xl overflow-hidden shadow-lg ${
          isDashboardThemeEnabled
            ? "border border-base-300/70 bg-base-100/90"
            : "border border-green-100/50"
        }`}
        style={
          isDashboardThemeEnabled
            ? undefined
            : { background: "linear-gradient(135deg, #228B22 0%, #355105ff 100%)" }
        }
      >
        <div className="space-y-1.5 p-6">
          <h3
            className={`text-2xl font-semibold leading-none tracking-tight ${
              isDashboardThemeEnabled ? "text-base-content" : "text-gray-900"
            }`}
          >
            Monthly Uploads
          </h3>
          <p
            className={`text-sm font-normal ${
              isDashboardThemeEnabled ? "text-base-content/60" : "text-gray-600"
            }`}
          >
            Track document submissions throughout the year
          </p>
        </div>
        <div className="p-6 pt-0">
          <div
            className={`py-12 text-center font-normal ${
              isDashboardThemeEnabled ? "text-base-content/50" : "text-gray-500"
            }`}
          >
            No upload data available
          </div>
        </div>
      </div>
    );
  }

  const currentMonth = data[data.length - 1]?.count || 0;
  const previousMonth = data[data.length - 2]?.count || 0;
  const trendPercentage =
    previousMonth > 0
      ? (((currentMonth - previousMonth) / previousMonth) * 100).toFixed(1)
      : 0;
  const currentYear = new Date().getFullYear();

  return (
    <div
      className={`rounded-3xl overflow-hidden shadow-lg ${
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
      <div className="space-y-1.5 p-6">
        <h3
          className={`text-2xl font-semibold leading-none tracking-tight ${
            isDashboardThemeEnabled ? "text-base-content" : "text-white"
          }`}
        >
          Monthly Uploads
        </h3>
        <p
          className={`text-sm font-normal ${
            isDashboardThemeEnabled ? "text-base-content/60" : "text-gray-200"
          }`}
        >
          Showing total uploads for the last {data.length} months
        </p>
      </div>

      <div className="p-6 pt-0">
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 12, right: 12 }}>
              <CartesianGrid
                vertical={false}
                strokeDasharray="3 3"
                stroke={
                  isDashboardThemeEnabled
                    ? "oklch(var(--bc) / 0.12)"
                    : "rgba(255,255,255,0.1)"
                }
              />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{
                  fontSize: 12,
                  fill: isDashboardThemeEnabled
                    ? "oklch(var(--bc) / 0.7)"
                    : "#e5e7eb",
                }}
                tickFormatter={(value) => value.slice(0, 3)}
              />
              <Tooltip
                cursor={false}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div
                        className={`rounded-lg px-3 py-2 shadow-lg ${
                          isDashboardThemeEnabled
                            ? "border border-base-300 bg-base-100 text-base-content"
                            : "border border-gray-200 bg-white"
                        }`}
                      >
                        <p
                          className={`text-sm font-medium ${
                            isDashboardThemeEnabled
                              ? "text-base-content"
                              : "text-gray-900"
                          }`}
                        >
                          {payload[0].payload.month}
                        </p>
                        <p
                          className={`text-sm ${
                            isDashboardThemeEnabled
                              ? "text-base-content/65"
                              : "text-gray-600"
                          }`}
                        >
                          Uploads:{" "}
                          <span
                            className={`font-semibold ${
                              isDashboardThemeEnabled
                                ? "text-primary"
                                : "text-green-600"
                            }`}
                          >
                            {payload[0].value}
                          </span>
                        </p>
                      </div>
                    );
                  }

                  return null;
                }}
              />
              <Area
                dataKey="count"
                type="natural"
                fill={
                  isDashboardThemeEnabled
                    ? "oklch(var(--p) / 0.24)"
                    : "#4ade80"
                }
                fillOpacity={isDashboardThemeEnabled ? 1 : 0.4}
                stroke={
                  isDashboardThemeEnabled
                    ? "oklch(var(--p) / 0.9)"
                    : "#4ade80"
                }
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="p-6 pt-0">
        <div className="flex w-full items-start gap-2 text-sm">
          <div className="grid gap-2">
            <div
              className={`flex items-center gap-2 font-medium leading-none ${
                isDashboardThemeEnabled ? "text-base-content" : "text-white"
              }`}
            >
              Trending {Number(trendPercentage) >= 0 ? "up" : "down"} by{" "}
              {Math.abs(Number(trendPercentage))}% this month
              <TrendingUp
                className={`h-4 w-4 ${
                  isDashboardThemeEnabled ? "text-primary" : ""
                }`}
              />
            </div>
            <div
              className={`flex items-center gap-2 leading-none font-normal ${
                isDashboardThemeEnabled
                  ? "text-base-content/60"
                  : "text-gray-200"
              }`}
            >
              January - December {currentYear}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
