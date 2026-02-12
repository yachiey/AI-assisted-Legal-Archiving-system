import { FC, ReactNode, useState, useEffect } from "react";
import StaffSidebar from "../js/Components/Templates/StaffSidebar";
import StaffNavbar from "../js/Components/Templates/StaffNavbar";
import { DashboardContext } from "../js/Context/DashboardContext";
import { ChatProvider } from "../js/Context/ChatContext";
import { ChatWidget } from "../js/Components/GlobalChat/ChatWidget";

interface StaffLayoutProps {
    children: ReactNode;
    fullScreen?: boolean;
    hideSidebar?: boolean;
    noPadding?: boolean;
    hideChatWidget?: boolean;
}

const StaffLayout: FC<StaffLayoutProps> = ({ children, fullScreen = false, hideSidebar = false, noPadding = false, hideChatWidget = false }) => {
    const savedCollapseState = localStorage.getItem("sidebarCollapse");
    const initialCollapse = savedCollapseState
        ? JSON.parse(savedCollapseState)
        : false;

    const [collapse, setCollapse] = useState<boolean>(initialCollapse);
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

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
                <div className="flex h-screen overflow-hidden bg-gray-50">
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
                    <div className="flex flex-col flex-1 w-full h-full overflow-hidden">
                        <StaffNavbar hideSidebar={hideSidebar} />
                        <main className={`flex-1 ${noPadding ? 'overflow-hidden p-0' : 'overflow-auto p-6'}`}>
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
