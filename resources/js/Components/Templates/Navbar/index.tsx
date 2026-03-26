import { FC, useContext } from "react";
import { usePage } from "@inertiajs/react";
import { Menu } from "lucide-react";

import ProfileDropdown from "./Profile";
import AdminNotificationDropdown from "./admin_notification_dropdown";
import DateTimeDisplay from "./Profile/DateTimeDisplay";
import ThemeDropdown from "./ThemeDropdown";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedAdminComponent,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

import { DashboardContext } from "../../../Context/DashboardContext";

const Navbar: FC<{ hideSidebar?: boolean }> = ({ hideSidebar = false }) => {
    const dashboardContext = useContext(DashboardContext);
    const { component } = usePage();
    const { theme } = useDashboardTheme();
    const isThemeCapableAdminPage = isThemedAdminComponent(component);
    const isDashboardThemeEnabled =
        isThemeCapableAdminPage && theme !== DEFAULT_DASHBOARD_THEME;

    if (!dashboardContext) return null;

    const handleMenuCollapse = () => {
        if (window.innerWidth <= 768) {
            dashboardContext.toggleMobileSidebar();
        } else {
            dashboardContext.handleCollapse();
        }
    };

    return (
        <div
            className={`relative z-30 flex w-full items-center justify-between px-4 py-3 ${
                isDashboardThemeEnabled
                    ? "border-b border-base-300/70 bg-base-100/85 text-base-content backdrop-blur-xl"
                    : "bg-white border-b border-gray-200 shadow-sm"
            }`}
        >
            {!hideSidebar ? (
                <button
                    onClick={handleMenuCollapse}
                    className={`transition-colors ${
                        isDashboardThemeEnabled
                            ? "text-primary hover:text-secondary"
                            : "text-green-800 hover:text-green-600"
                    }`}
                >
                    <Menu />
                </button>
            ) : (
                <div />
            )}

            <div className="relative z-10 flex items-center space-x-6">
                <DateTimeDisplay />
                <div className="flex items-center space-x-4">
                    <ThemeDropdown
                        mode={isThemeCapableAdminPage ? "apply" : "preview"}
                    />
                    <AdminNotificationDropdown />
                    <ProfileDropdown />
                </div>
            </div>
        </div>
    );
};

export default Navbar;
