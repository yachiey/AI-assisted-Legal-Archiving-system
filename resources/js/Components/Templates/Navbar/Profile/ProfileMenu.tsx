import React, { useState } from "react";
import { router, usePage } from "@inertiajs/react";
import { UserIcon } from "lucide-react";
import UserInfoHeader from "./UserInfoHeader";
import MenuItem from "./MenuItem";
import { LogoutIcon } from "./Icons";
import { ProfileMenuProps } from "../../../../Types/profile_types";
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

const ProfileMenu: React.FC<ProfileMenuProps> = ({
    userData,
    onViewProfile,
    onSettings,
    onLogout,
}) => {
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    const handleLogout = async () => {
        if (isLoggingOut) return;

        setIsLoggingOut(true);

        try {
            const token =
                sessionStorage.getItem("auth_token") ||
                localStorage.getItem("auth_token");

            const response = await fetch("/api/logout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    ...(token && { Authorization: `Bearer ${token}` }),
                },
            });

            const data = await response.json();

            if (data.success) {
                sessionStorage.removeItem("currentUser");
                sessionStorage.removeItem("adminLoaded");
                sessionStorage.removeItem("tenantLoaded");
                sessionStorage.removeItem("auth_token");
                localStorage.removeItem("auth_token");

                if (onLogout) {
                    onLogout();
                }

                router.visit("/");
            } else {
                sessionStorage.removeItem("auth_token");
                localStorage.removeItem("auth_token");
                router.visit("/");
            }
        } catch (error) {
            console.error("Logout error:", error);
            sessionStorage.removeItem("auth_token");
            localStorage.removeItem("auth_token");
            router.visit("/");
        } finally {
            setIsLoggingOut(false);
        }
    };

    const handleViewProfile = () => {
        if (!isLoggingOut) {
            onViewProfile();
        }
    };

    const handleSettings = () => {
        if (!isLoggingOut) {
            onSettings();
        }
    };

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className={`absolute right-0 top-full z-[10000] mt-2 w-64 rounded-xl p-2 ${
                isLoggingOut ? "pointer-events-none opacity-75" : ""
            } ${
                isDashboardThemeEnabled
                    ? "border border-base-300 bg-base-100 shadow-2xl shadow-base-content/10"
                    : "border border-gray-100 bg-white shadow-xl"
            }`}
        >
            <UserInfoHeader userData={userData} />

            <ul className="space-y-1">
                <li>
                    <MenuItem
                        icon={<UserIcon />}
                        label="View Profile"
                        onClick={handleViewProfile}
                    />
                </li>

                <li
                    className={`my-2 border-t ${
                        isDashboardThemeEnabled
                            ? "border-base-300"
                            : "border-white/30"
                    }`}
                ></li>

                <li>
                    <MenuItem
                        icon={<LogoutIcon />}
                        label={isLoggingOut ? "Logging out..." : "Logout"}
                        onClick={handleLogout}
                        variant="danger"
                    />
                </li>
            </ul>
        </div>
    );
};

export default ProfileMenu;
