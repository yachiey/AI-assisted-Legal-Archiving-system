import { FC, useContext } from "react";
import { usePage } from "@inertiajs/react";
import { DashboardContext } from "../../../Context/DashboardContext";
import { navLinksData } from "./NavLink";
import Brand from "./brand";
import SidebarLink from "./SidebarLink";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedAdminComponent,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

const Sidebar: FC = () => {
    const dashboardContext = useContext(DashboardContext);
    const collapsed = dashboardContext?.collapse;
    const { url, component } = usePage();
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled =
        isThemedAdminComponent(component) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    const isActive = (path: string) => {
        const currentPath = url.split('?')[0];
        return currentPath === path || currentPath.startsWith(path + "/");
    };

    return (
        <div
            className={`h-screen relative transition-all duration-300 shadow-2xl ${collapsed ? "w-20" : "w-72"
                } ${isDashboardThemeEnabled
                    ? "bg-gradient-to-b from-primary via-primary to-secondary text-primary-content"
                    : ""
                }`}
            style={isDashboardThemeEnabled ? undefined : {
                background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)'
            }}
        >
            {/* Decorative top gradient overlay */}
            <div className={`absolute top-0 left-0 right-0 h-40 pointer-events-none ${isDashboardThemeEnabled
                ? "bg-gradient-to-b from-primary-content/15 to-transparent"
                : "bg-gradient-to-b from-white/20 to-transparent"
                }`}></div>

            {/* Brand Logo */}
            <div className={`relative flex justify-center items-center transition-all duration-300 ${collapsed ? "py-6" : "py-6 px-4"
                }`}>
                <div className="relative">
                    <div className={`absolute inset-0 blur-xl rounded-full ${isDashboardThemeEnabled ? "bg-secondary/20" : "bg-green-700/15"}`}></div>
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
                    <div className={`relative backdrop-blur-sm rounded-2xl p-4 ${isDashboardThemeEnabled
                        ? "bg-primary-content/10 border border-primary-content/10"
                        : "bg-white/10 border border-white/10"
                        }`}>
                        <h1 className={`text-xs font-bold text-center uppercase tracking-[0.15em] leading-[1.8] ${isDashboardThemeEnabled ? "text-primary-content" : "text-white"}`}
                            style={{
                                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                fontWeight: 700,
                                textShadow: 'none',
                                letterSpacing: '0.15em'
                            }}>
                            Legal Document<br />
                            <span className={`${isDashboardThemeEnabled ? "text-primary-content/80" : "text-white/80"} text-[0.65rem] font-semibold tracking-[0.12em]`}>
                                Management & Retrieval
                            </span><br />
                            <span className={`font-extrabold ${isDashboardThemeEnabled ? "text-primary-content" : "text-white"}`}>System</span>
                        </h1>
                    </div>
                </div>
            )}

            {/* Navigation Label */}
            {!collapsed && (
                <div className="px-5 pb-3">
                    <div className="flex items-center gap-2">
                        <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${isDashboardThemeEnabled ? "via-primary-content/20" : "via-white/20"} to-transparent`}></div>
                        <span className={`${isDashboardThemeEnabled ? "text-primary-content/60" : "text-white/60"} text-[0.65rem] font-semibold uppercase tracking-widest`}>
                            Navigation
                        </span>
                        <div className={`h-px flex-1 bg-gradient-to-r from-transparent ${isDashboardThemeEnabled ? "via-primary-content/20" : "via-white/20"} to-transparent`}></div>
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
            <div className={`absolute bottom-0 left-0 right-0 h-32 pointer-events-none ${isDashboardThemeEnabled
                ? "bg-gradient-to-t from-secondary/35 to-transparent"
                : "bg-gradient-to-t from-green-300/30 to-transparent"
                }`}></div>
        </div>
    );
};

export default Sidebar;
