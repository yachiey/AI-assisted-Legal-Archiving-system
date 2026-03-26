import { FC, useContext } from "react";
import { usePage } from "@inertiajs/react";
import { Menu } from "lucide-react";
import { DashboardContext } from "../../../Context/DashboardContext";
import ProfileDropdown from "../Navbar/Profile";
import NotificationDropdown from "../Navbar/notification_dropdown";
import DateTimeDisplay from "../Navbar/Profile/DateTimeDisplay";
import ThemeDropdown from "../Navbar/ThemeDropdown";
import PermissionRequestButton from "./PermissionRequestButton";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedStaffComponent,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

const StaffNavbar: FC<{ hideSidebar?: boolean }> = ({ hideSidebar = false }) => {
    const dashboardContext = useContext(DashboardContext);
    const { component } = usePage();
    const { theme } = useDashboardTheme("staff");
    const isThemeCapableStaffPage = isThemedStaffComponent(component);
    const isDashboardThemeEnabled =
        isThemeCapableStaffPage && theme !== DEFAULT_DASHBOARD_THEME;

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
                    ? "border-b border-base-300/70 bg-base-100/85 text-base-content shadow-lg shadow-base-content/5 backdrop-blur-xl"
                    : "border-b border-gray-200 bg-white shadow-sm"
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
                <div className="flex items-center space-x-2">
                    <ThemeDropdown
                        mode={isThemeCapableStaffPage ? "apply" : "preview"}
                        scope="staff"
                    />
                    <PermissionRequestButton />
                    <NotificationDropdown />
                    <ProfileDropdown />
                </div>
            </div>
        </div>
    );
};

export default StaffNavbar;
