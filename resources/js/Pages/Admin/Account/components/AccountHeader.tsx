import React from "react";
import { Users, UserPlus } from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface AccountHeaderProps {
    totalUsers: number;
    activeUsers: number;
    onAddUserClick: () => void;
}

const AccountHeader: React.FC<AccountHeaderProps> = ({
    totalUsers,
    activeUsers,
    onAddUserClick,
}) => {
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="mb-8"
        >
            <div
                className={`mb-8 rounded-2xl border p-6 ${
                    isDashboardThemeEnabled
                        ? "border-base-300/70 bg-base-100/90 shadow-2xl shadow-base-content/5 backdrop-blur-xl"
                        : "border-green-700/20 shadow-lg"
                }`}
                style={
                    isDashboardThemeEnabled
                        ? {
                              boxShadow:
                                  "0 24px 60px oklch(var(--bc) / 0.06), inset 0 1px 0 oklch(var(--b1) / 0.4)",
                          }
                        : {
                              background:
                                  "linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)",
                          }
                }
            >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1
                            className={`mb-2 flex items-center gap-3 text-4xl font-black tracking-tight md:text-5xl ${
                                isDashboardThemeEnabled
                                    ? "text-base-content"
                                    : "text-white"
                            }`}
                        >
                            <Users
                                className={`h-8 w-8 ${
                                    isDashboardThemeEnabled
                                        ? "text-primary"
                                        : "text-yellow-400"
                                }`}
                            />
                            ACCOUNT MANAGEMENT
                        </h1>
                        <div
                            className="mb-3 h-1 w-48 rounded-full"
                            style={{
                                background: isDashboardThemeEnabled
                                    ? "linear-gradient(90deg, oklch(var(--p)), transparent)"
                                    : "linear-gradient(90deg, #facc15, transparent)",
                            }}
                        ></div>
                        <p
                            className={`text-lg font-medium tracking-wide ${
                                isDashboardThemeEnabled
                                    ? "text-base-content/70"
                                    : "text-green-50"
                            }`}
                        >
                            Manage users, roles, and permissions
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onAddUserClick}
                            className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                                isDashboardThemeEnabled
                                    ? "border border-primary/30 bg-primary text-primary-content shadow-lg shadow-primary/15 hover:bg-primary/90 hover:shadow-xl"
                                    : "border-2 border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-sm hover:bg-white/20 hover:shadow-lg"
                            }`}
                        >
                            <UserPlus className="h-4 w-4 transition-transform duration-300 group-hover:scale-110" />
                            Add Account
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div
                    className={`rounded-2xl border p-6 transition-all ${
                        isDashboardThemeEnabled
                            ? "border-base-300 bg-base-100 shadow-xl shadow-base-content/5"
                            : "border-green-700/30 shadow-md"
                    }`}
                    style={
                        isDashboardThemeEnabled
                            ? undefined
                            : {
                                  background:
                                      "linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)",
                              }
                    }
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className={`mb-1 text-sm font-medium ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content/65"
                                        : "text-white/80"
                                }`}
                            >
                                Total Users
                            </p>
                            <p
                                className={`text-4xl font-bold ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content"
                                        : "text-white"
                                }`}
                            >
                                {totalUsers}
                            </p>
                        </div>
                        <div
                            className={`rounded-xl p-4 ${
                                isDashboardThemeEnabled
                                    ? "bg-primary/10"
                                    : "bg-white/20"
                            }`}
                        >
                            <Users
                                className={`h-8 w-8 ${
                                    isDashboardThemeEnabled
                                        ? "text-primary"
                                        : "text-white"
                                }`}
                            />
                        </div>
                    </div>
                </div>

                <div
                    className={`rounded-2xl border p-6 transition-all ${
                        isDashboardThemeEnabled
                            ? "border-base-300 bg-base-100 shadow-xl shadow-base-content/5"
                            : "border-yellow-700/30 shadow-md"
                    }`}
                    style={
                        isDashboardThemeEnabled
                            ? undefined
                            : {
                                  background:
                                      "linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)",
                              }
                    }
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p
                                className={`mb-1 text-sm font-medium ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content/65"
                                        : "text-gray-800"
                                }`}
                            >
                                Active Users
                            </p>
                            <p
                                className={`text-4xl font-bold ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content"
                                        : "text-gray-900"
                                }`}
                            >
                                {activeUsers}
                            </p>
                        </div>
                        <div
                            className={`rounded-xl p-4 ${
                                isDashboardThemeEnabled
                                    ? "bg-success/10"
                                    : "bg-white/30"
                            }`}
                        >
                            <Users
                                className={`h-8 w-8 ${
                                    isDashboardThemeEnabled
                                        ? "text-success"
                                        : "text-gray-900"
                                }`}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountHeader;
