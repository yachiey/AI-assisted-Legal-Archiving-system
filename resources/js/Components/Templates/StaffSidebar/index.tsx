import { FC, useContext } from "react";
import { usePage } from "@inertiajs/react";
import { DashboardContext } from "../../../Context/DashboardContext";
import { navLinksData } from "./NavLink";
import Brand from "../AdminSidebar/brand";
import SidebarLink from "./SidebarLink";
import LogoutButton from "./LogoutButton";
import AddFilesButton from "./AddFilesButton";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedStaffComponent,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

const StaffSidebar: FC = () => {
    const dashboardContext = useContext(DashboardContext);
    const collapsed = dashboardContext?.collapse;
    const { url, component } = usePage();
    const { theme } = useDashboardTheme("staff");
    const isDashboardThemeEnabled =
        isThemedStaffComponent(component) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    const isActive = (path: string) => {
        const currentPath = url.split('?')[0];
        return currentPath === path || currentPath.startsWith(path + "/");
    };

    return (
        <div
            className={`relative h-full transition-all duration-300 shadow-2xl ${
                collapsed ? "w-20" : "w-64"
            } ${
                isDashboardThemeEnabled
                    ? "bg-gradient-to-b from-primary via-primary to-secondary text-primary-content"
                    : ""
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
            {/* Decorative top gradient overlay */}
            <div
                className={`pointer-events-none absolute left-0 right-0 top-0 h-40 ${
                    isDashboardThemeEnabled
                        ? "bg-gradient-to-b from-primary-content/15 to-transparent"
                        : "bg-gradient-to-b from-white/20 to-transparent"
                }`}
            ></div>

            {/* Brand Logo */}
            <div className={`relative flex justify-center items-center transition-all duration-300 ${collapsed ? "py-6" : "py-6 px-4"
                }`}>
                <div className="relative">
                    <div
                        className={`absolute inset-0 rounded-full blur-xl ${
                            isDashboardThemeEnabled ? "bg-secondary/20" : "bg-green-700/15"
                        }`}
                    ></div>
                    <Brand
                        height={collapsed ? 45 : 65}
                        width={collapsed ? 45 : 160}
                        type={1}
                    />
                </div>
            </div>

            {/* System Title */}
            {!collapsed && (
                <div className="px-5 pb-8 relative">
                    <div
                        className={`relative rounded-2xl p-4 ${
                            isDashboardThemeEnabled
                                ? "border border-primary-content/10 bg-primary-content/10 backdrop-blur-sm"
                                : "border border-white/10 bg-white/10 backdrop-blur-sm"
                        }`}
                    >
                        <h1
                            className={`text-center text-xs font-bold uppercase tracking-[0.15em] leading-[1.8] ${
                                isDashboardThemeEnabled
                                    ? "text-base-content"
                                    : "text-white"
                            }`}
                            style={{
                                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                fontWeight: 700,
                                textShadow: 'none',
                                letterSpacing: '0.15em'
                            }}>
                            Legal Document<br />
                            <span
                                className={`text-[0.65rem] font-semibold tracking-[0.12em] ${
                                    isDashboardThemeEnabled
                                        ? "text-primary-content/80"
                                        : "text-white/80"
                                }`}
                            >
                                Management & Retrieval
                            </span><br />
                            <span
                                className={`font-extrabold ${
                                    isDashboardThemeEnabled
                                        ? "text-primary-content"
                                        : "text-white"
                                }`}
                            >
                                System
                            </span>
                        </h1>
                    </div>
                </div>
            )}

            {/* Navigation Label */}
            {!collapsed && (
                <div className="px-5 pb-3">
                    <div className="flex items-center gap-2">
                        <div
                            className={`h-px flex-1 bg-gradient-to-r from-transparent ${
                                isDashboardThemeEnabled
                                    ? "via-primary-content/20"
                                    : "via-white/20"
                            } to-transparent`}
                        ></div>
                        <span
                            className={`text-[0.65rem] font-semibold uppercase tracking-widest ${
                                isDashboardThemeEnabled
                                    ? "text-primary-content/60"
                                    : "text-white/60"
                            }`}
                        >
                            Navigation
                        </span>
                        <div
                            className={`h-px flex-1 bg-gradient-to-r from-transparent ${
                                isDashboardThemeEnabled
                                    ? "via-primary-content/20"
                                    : "via-white/20"
                            } to-transparent`}
                        ></div>
                    </div>
                </div>
            )}

            {/* Sidebar Links */}
            <ul className={`space-y-2 ${collapsed ? "px-2" : "px-4"
                }`}>
                {navLinksData.map((item, index) => (
                    <SidebarLink
                        key={item.title}
                        item={item}
                        isActive={isActive(item.path)}
                        collapsed={collapsed}
                        isFirst={index === 0}
                    />
                ))}
            </ul>

            {/* Bottom Decorative Element */}
            <div
                className={`pointer-events-none absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t to-transparent ${
                    isDashboardThemeEnabled
                        ? "from-secondary/35"
                        : "from-green-300/30"
                }`}
            ></div>
        </div>
    );
};

export default StaffSidebar;
