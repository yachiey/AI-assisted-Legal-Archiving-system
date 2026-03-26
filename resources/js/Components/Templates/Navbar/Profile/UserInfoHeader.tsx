import React from "react";
import { usePage } from "@inertiajs/react";
import { UserData } from "../../../../Types/profile_types";
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface UserInfoHeaderProps {
    userData: UserData;
}

const UserInfoHeader: React.FC<UserInfoHeaderProps> = ({ userData }) => {
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    const profileImageUrl = userData.profile_picture
        ? `/storage/${userData.profile_picture}`
        : userData.avatar || `https://i.pravatar.cc/48?u=${userData.email}`;

    const getInitial = () => userData.name.charAt(0).toUpperCase();

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className={`mb-2 border-b px-4 py-3 ${
                isDashboardThemeEnabled
                    ? "border-base-300"
                    : "border-gray-100"
            }`}
        >
            <div className="flex items-center">
                {userData.profile_picture ? (
                    <img
                        src={profileImageUrl}
                        alt={`${userData.name}'s Profile`}
                        className={`h-12 w-12 rounded-full object-cover border-2 ${
                            isDashboardThemeEnabled
                                ? "border-base-300"
                                : "border-gray-200"
                        }`}
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://i.pravatar.cc/48?u=${userData.email}`;
                        }}
                    />
                ) : (
                    <div
                        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-xl font-bold ${
                            isDashboardThemeEnabled
                                ? "border-base-300 bg-primary text-primary-content"
                                : "border-gray-200 bg-gradient-to-r from-green-600 to-emerald-600 text-white"
                        }`}
                    >
                        {getInitial()}
                    </div>
                )}
                <div className="ml-3 flex-1">
                    <p
                        className={`truncate text-sm font-medium ${
                            isDashboardThemeEnabled
                                ? "text-base-content"
                                : "text-gray-900"
                        }`}
                    >
                        {userData.name}
                    </p>
                    <p
                        className={`truncate text-xs ${
                            isDashboardThemeEnabled
                                ? "text-base-content/55"
                                : "text-gray-500"
                        }`}
                    >
                        {userData.email}
                    </p>
                    <p
                        className={`mt-1 inline-block rounded-full px-2 py-1 text-xs ${
                            isDashboardThemeEnabled
                                ? "bg-primary/10 text-primary"
                                : "bg-blue-100 text-blue-800"
                        }`}
                    >
                        {userData.role}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserInfoHeader;
