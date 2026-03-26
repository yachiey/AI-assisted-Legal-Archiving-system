import React from "react";
import { usePage } from "@inertiajs/react";
import { ProfileTriggerProps } from "../../../../Types/profile_types";
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

const ProfileTrigger: React.FC<ProfileTriggerProps> = ({
    userData,
    isOpen,
    onClick,
}) => {
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    const profileImageUrl = userData.profile_picture
        ? `/storage/${userData.profile_picture}`
        : userData.avatar || `https://i.pravatar.cc/40?u=${userData.email}`;

    const getInitial = () => userData.name.charAt(0).toUpperCase();

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className={`flex cursor-pointer items-center rounded-xl p-2 transition-all duration-200 ${
                isDashboardThemeEnabled
                    ? "border border-base-300/80 bg-base-100 text-base-content shadow-lg shadow-base-content/5"
                    : ""
            }`}
            style={
                isDashboardThemeEnabled
                    ? undefined
                    : {
                          background: "rgba(255, 255, 255, 0.4)",
                          backdropFilter: "blur(15px)",
                          WebkitBackdropFilter: "blur(15px)",
                          border: "1px solid rgba(255, 255, 255, 0.5)",
                          boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
                      }
            }
            onClick={onClick}
        >
            {userData.profile_picture ? (
                <img
                    src={profileImageUrl}
                    alt={`${userData.name}'s Profile`}
                    className={`h-9 w-9 rounded-full object-cover border-2 ${
                        isDashboardThemeEnabled
                            ? "border-base-300"
                            : "border-white/50"
                    }`}
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://i.pravatar.cc/40?u=${userData.email}`;
                    }}
                />
            ) : (
                <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-base font-bold ${
                        isDashboardThemeEnabled
                            ? "border-base-300 bg-primary text-primary-content"
                            : "border-white/50 bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                    }`}
                >
                    {getInitial()}
                </div>
            )}

            <div
                className={`ml-2 hidden flex-col md:flex ${
                    isDashboardThemeEnabled
                        ? "text-base-content"
                        : "text-gray-800"
                }`}
            >
                <span className="text-sm font-semibold">{userData.name}</span>
                <span
                    className={`text-xs ${
                        isDashboardThemeEnabled
                            ? "text-base-content/55"
                            : "text-gray-500"
                    }`}
                >
                    {userData.email}
                </span>
            </div>

            <svg
                className={`ml-2 h-4 w-4 transition-transform duration-200 ${
                    isOpen ? "rotate-180" : ""
                } ${
                    isDashboardThemeEnabled
                        ? "text-base-content/45"
                        : "text-gray-400"
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </div>
    );
};

export default ProfileTrigger;
