import { FC, useContext } from "react";
import { Menu } from "lucide-react";
import { DashboardContext } from "../../../Context/DashboardContext";
import ProfileDropdown from "../Navbar/Profile";
import NotificationDropdown from "../Navbar/notification_dropdown";
import DateTimeDisplay from "../Navbar/Profile/DateTimeDisplay";
import PermissionRequestButton from "./PermissionRequestButton";

const StaffNavbar: FC<{ hideSidebar?: boolean }> = ({ hideSidebar = false }) => {
    const dashboardContext = useContext(DashboardContext);

    if (!dashboardContext) return null;

    const handleMenuCollapse = () => {
        if (window.innerWidth <= 768) {
            dashboardContext.toggleMobileSidebar();
        } else {
            dashboardContext.handleCollapse();
        }
    };

    return (
        <div className="flex items-center justify-between px-4 py-3 w-full z-20 bg-white border-b border-gray-200 shadow-sm">
            {!hideSidebar ? (
                <button
                    onClick={handleMenuCollapse}
                    className="text-green-800 hover:text-green-600 transition-colors"
                >
                    <Menu />
                </button>
            ) : (
                <div />
            )}

            <div className="flex items-center space-x-6">
                <DateTimeDisplay />
                <div className="flex items-center space-x-2">
                    <PermissionRequestButton />
                    <NotificationDropdown />
                    <ProfileDropdown />
                </div>
            </div>
        </div>
    );
};

export default StaffNavbar;
