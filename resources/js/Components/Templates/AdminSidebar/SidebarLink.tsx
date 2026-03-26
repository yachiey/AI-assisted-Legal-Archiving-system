import { FC } from "react";
import { Link, usePage } from "@inertiajs/react";
import { ChevronRight } from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedAdminComponent,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

interface SidebarLinkProps {
    item: {
        title: string;
        path: string;
        icon: React.ReactNode;
        badge?: string;
    };
    isActive: boolean;
    collapsed?: boolean;
    isFirst?: boolean;
}

const SidebarLink: FC<SidebarLinkProps> = ({ item, isActive, collapsed, isFirst }) => {
    const { component } = usePage();
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled =
        isThemedAdminComponent(component) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    return (
        <li>
            <Link
                href={item.path}
                className={`
                    flex items-center transition-all duration-300 relative group overflow-hidden
                    ${collapsed
                        ? "justify-center p-3 rounded-xl mx-auto"
                        : "gap-3 px-4 py-3.5 rounded-xl"
                    }
                    ${isActive
                        ? isDashboardThemeEnabled
                            ? "bg-base-100/95 text-base-content shadow-lg scale-105"
                            : "text-green-900 shadow-lg scale-105"
                        : isDashboardThemeEnabled
                            ? "text-primary-content/70 hover:bg-primary-content/10 hover:text-primary-content"
                            : "text-white/70 hover:text-white hover:bg-white/10"
                    }
                `}
                style={isActive && !isDashboardThemeEnabled ? {
                    background: 'linear-gradient(135deg, #FBEC5D 0%, #E6D700 100%)',
                    boxShadow: '0 4px 12px rgba(251, 236, 93, 0.3)'
                } : undefined}
                title={collapsed ? item.title : undefined}
            >
                {/* Active indicator bar */}
                {isActive && !collapsed && (
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full ${isDashboardThemeEnabled ? "bg-secondary" : "bg-green-800"}`}></div>
                )}

                {/* Background hover effect */}
                {!isActive && (
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${isDashboardThemeEnabled ? "bg-primary-content/5" : "bg-white/5"}`}></div>
                )}

                {/* Icon */}
                <span className={`relative z-10 transition-all duration-300 flex items-center justify-center ${collapsed ? "text-lg" : "text-base"
                    } ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                    {item.icon}
                </span>

                {/* Title - hidden when collapsed */}
                {!collapsed && (
                    <span className={`relative z-10 font-semibold transition-all duration-300 tracking-wide ${isActive ? "text-sm" : "text-sm group-hover:translate-x-0.5"
                        }`}
                        style={{
                            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
                            letterSpacing: '0.02em'
                        }}>
                        {item.title}
                    </span>
                )}

                {/* Chevron indicator for active state */}
                {isActive && !collapsed && (
                    <ChevronRight
                        size={16}
                        className={`ml-auto relative z-10 animate-pulse ${isDashboardThemeEnabled ? "text-primary" : "text-green-900"}`}
                    />
                )}

                {/* Badge */}
                {item.badge && !collapsed && (
                    <span className={`ml-auto relative z-10 text-xs font-bold px-2.5 py-1 rounded-full shadow-sm ${isDashboardThemeEnabled ? "bg-secondary text-secondary-content" : "bg-[#FBEC5D] text-green-900"}`}>
                        {item.badge}
                    </span>
                )}

                {/* Tooltip for collapsed state */}
                {collapsed && (
                    <div className={`absolute left-full ml-3 px-3 py-2 text-xs font-semibold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50 shadow-xl ${isDashboardThemeEnabled ? "bg-base-100 text-base-content border border-base-300" : "bg-gray-900 text-white"}`}
                        style={{
                            fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif"
                        }}>
                        {item.title}
                        <div className={`absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent ${isDashboardThemeEnabled ? "border-r-base-100" : "border-r-gray-900"}`}></div>
                    </div>
                )}
            </Link>
        </li>
    );
};

export default SidebarLink;
