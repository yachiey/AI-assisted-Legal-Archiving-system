import { FC, ReactNode, useState, useEffect } from "react";
import { usePage } from "@inertiajs/react";
import StaffSidebar from "../js/Components/Templates/StaffSidebar";
import StaffNavbar from "../js/Components/Templates/StaffNavbar";
import { DashboardContext } from "../js/Context/DashboardContext";
import { ChatProvider } from "../js/Context/ChatContext";
import { ChatWidget } from "../js/Components/GlobalChat/ChatWidget";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedStaffComponent,
    useDashboardTheme,
} from "../js/hooks/useDashboardTheme";

interface StaffLayoutProps {
    children: ReactNode;
    fullScreen?: boolean;
    hideSidebar?: boolean;
    noPadding?: boolean;
    hideChatWidget?: boolean;
}

const StaffLayout: FC<StaffLayoutProps> = ({ children, fullScreen = false, hideSidebar = false, noPadding = false, hideChatWidget = false }) => {
    const { component } = usePage();
    const { theme } = useDashboardTheme("staff");
    const savedCollapseState = localStorage.getItem("sidebarCollapse");
    const initialCollapse = savedCollapseState
        ? JSON.parse(savedCollapseState)
        : false;

    const [collapse, setCollapse] = useState<boolean>(initialCollapse);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const isDashboardThemeEnabled =
        isThemedStaffComponent(component) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    const handleCollapse = (toggle?: boolean) => {
        const newCollapseState = toggle !== undefined ? toggle : !collapse;
        setCollapse(newCollapseState);
        localStorage.setItem(
            "sidebarCollapse",
            JSON.stringify(newCollapseState)
        );
    };

    const toggleMobileSidebar = (value?: boolean) => {
        setShowMobileSidebar((prev) => (value !== undefined ? value : !prev));
    };

    // Full screen mode for AI Assistant
    if (fullScreen) {
        return (
            <DashboardContext.Provider
                value={{
                    collapse,
                    handleCollapse,
                    showMobileSidebar,
                    toggleMobileSidebar,
                }}
            >
                {children}
            </DashboardContext.Provider>
        );
    }

    return (
        <DashboardContext.Provider
            value={{
                collapse,
                handleCollapse,
                showMobileSidebar,
                toggleMobileSidebar,
            }}
        >
            <ChatProvider>
                <div
                    data-theme={isDashboardThemeEnabled ? theme : undefined}
                    className={`relative flex h-screen overflow-hidden ${
                        isDashboardThemeEnabled
                            ? "bg-base-200 text-base-content"
                            : "bg-gray-50"
                    }`}
                >
                    {isDashboardThemeEnabled && (
                        <div
                            className="pointer-events-none absolute inset-0"
                            style={{
                                background:
                                    "radial-gradient(circle at top right, oklch(var(--s) / 0.16), transparent 26%), radial-gradient(circle at bottom left, oklch(var(--p) / 0.12), transparent 28%)",
                            }}
                        />
                    )}
                    {/* Sidebar */}
                    {!hideSidebar && (isMobile ? (
                        showMobileSidebar && (
                            <>
                                <div
                                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                                    onClick={() => toggleMobileSidebar(false)}
                                />
                                <div className="fixed top-0 left-0 w-64 h-full z-50">
                                    <StaffSidebar />
                                </div>
                            </>
                        )
                    ) : (
                        <div className="h-full z-10">
                            <StaffSidebar />
                        </div>
                    ))}

                    {/* Main Content */}
                    <div className="relative z-0 flex h-full w-full flex-1 flex-col overflow-hidden">
                        <StaffNavbar hideSidebar={hideSidebar} />
                        <main className={`relative z-0 flex-1 ${noPadding ? 'overflow-hidden p-0' : 'overflow-auto p-6'}`}>
                            {children}
                        </main>
                    </div>
                </div>
                {!hideChatWidget && <ChatWidget />}
            </ChatProvider>
        </DashboardContext.Provider>
    );
};

export default StaffLayout;
