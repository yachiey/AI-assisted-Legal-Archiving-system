import { useContext, useEffect, useState, ReactNode } from "react";
import { usePage } from "@inertiajs/react";
import Navbar from "../js/Components/Templates/Navbar/index";
import Sidebar from "../js/Components/Templates/AdminSidebar";
import {
    DashboardContext,
    DashboardContextProvider,
} from "../../resources/js/Context/DashboardContext";
import { ModalProvider, useModal } from "../js/Components/Modal/ModalContext";
import Modal from "./ModalLayout";
import { ChatProvider } from "../js/Context/ChatContext";
import { ChatWidget } from "../js/Components/GlobalChat/ChatWidget";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedAdminComponent,
    useDashboardTheme,
} from "../js/hooks/useDashboardTheme";

interface AdminLayoutProps {
    children: ReactNode;
    fullScreen?: boolean;
    hideSidebar?: boolean;
    noPadding?: boolean;
    hideChatWidget?: boolean;
}

export default function AdminLayout({ children, fullScreen = false, hideSidebar = false, noPadding = false, hideChatWidget = false }: AdminLayoutProps) {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize();
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    return (
        <DashboardContextProvider>
            <ChatProvider>
                <ModalProvider>
                    <InnerLayout isMobile={isMobile} fullScreen={fullScreen} hideSidebar={hideSidebar} noPadding={noPadding}>{children}</InnerLayout>
                    {!hideChatWidget && <ChatWidget />}
                </ModalProvider>
            </ChatProvider>
        </DashboardContextProvider>
    );
}

function InnerLayout({
    isMobile,
    children,
    fullScreen = false,
    hideSidebar = false,
    noPadding = false,
}: {
    isMobile: boolean;
    children: ReactNode;
    fullScreen?: boolean;
    hideSidebar?: boolean;
    noPadding?: boolean;
}) {
    const context = useContext(DashboardContext);
    const { isFilterOpen, closeFilter } = useModal();
    const { component } = usePage();
    const { theme } = useDashboardTheme();

    if (!context) return null;

    const { showMobileSidebar, toggleMobileSidebar } = context;
    const isDashboardThemeEnabled =
        isThemedAdminComponent(component) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className={`flex h-screen overflow-hidden relative ${
                isDashboardThemeEnabled
                    ? "bg-base-200 text-base-content"
                    : "bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/50"
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
                        <div className="fixed top-0 left-0 w-64 h-full bg-primary text-white z-50">
                            <Sidebar />
                        </div>
                    </>
                )
            ) : (
                <div className="h-full z-10">
                    <Sidebar />
                </div>
            ))}

            {/* Main content */}
            <div className={`relative z-0 flex h-full w-full flex-1 flex-col overflow-hidden`}>
                {!fullScreen && <Navbar hideSidebar={hideSidebar} />}
                <main className={`relative z-0 flex-1 ${fullScreen ? 'overflow-hidden p-0' : noPadding ? 'overflow-hidden p-0' : 'overflow-auto p-6'}`}>
                    {children}
                </main>
            </div>

            {/* Global Modal */}
            {isFilterOpen && (
                <Modal>
                    <button
                        onClick={closeFilter}
                        className="absolute top-3 right-3 text-sm font-bold text-gray-500 hover:text-black"
                    >
                        ✕
                    </button>
                </Modal>
            )}
        </div>
    );
}
