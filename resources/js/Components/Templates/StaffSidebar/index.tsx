import { FC, useContext } from "react";
import { usePage } from "@inertiajs/react";
import { DashboardContext } from "../../../Context/DashboardContext";
import { navLinksData } from "./NavLink";
import Brand from "../AdminSidebar/brand";
import SidebarLink from "./SidebarLink";
import LogoutButton from "./LogoutButton";
import AddFilesButton from "./AddFilesButton";

const StaffSidebar: FC = () => {
    const dashboardContext = useContext(DashboardContext);
    const collapsed = dashboardContext?.collapse;
    const { url } = usePage();

    const isActive = (path: string) => {
        const currentPath = url.split('?')[0];
        return currentPath === path || currentPath.startsWith(path + "/");
    };

    return (
        <div
            className={`h-full relative transition-all duration-300 shadow-2xl ${collapsed ? "w-20" : "w-64"
                }`}
            style={{
                background: 'linear-gradient(180deg, #228B22 0%, #1a6b1a 100%)'
            }}
        >
            {/* Decorative top gradient overlay */}
            <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>

            {/* Brand Logo */}
            <div className={`relative flex justify-center items-center transition-all duration-300 ${collapsed ? "py-6" : "py-6 px-4"
                }`}>
                <div className="relative">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full"></div>
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
                    <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10">
                        <h1 className="text-[#FBEC5D] text-xs font-bold text-center uppercase tracking-[0.15em] leading-[1.8]"
                            style={{
                                fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                                fontWeight: 700,
                                textShadow: '0 2px 8px rgba(0,0,0,0.2)',
                                letterSpacing: '0.15em'
                            }}>
                            Legal Document<br />
                            <span className="text-white/90 text-[0.65rem] font-semibold tracking-[0.12em]">
                                Management & Retrieval
                            </span><br />
                            <span className="text-[#FBEC5D] font-extrabold">System</span>
                        </h1>
                    </div>
                </div>
            )}

            {/* Navigation Label */}
            {!collapsed && (
                <div className="px-5 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                        <span className="text-white/40 text-[0.65rem] font-semibold uppercase tracking-widest">
                            Navigation
                        </span>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
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
            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
        </div>
    );
};

export default StaffSidebar;
