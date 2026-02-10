import { useContext, useEffect, useState, ReactNode } from "react";
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

interface AdminLayoutProps {
    children: ReactNode;
    fullScreen?: boolean;
    hideSidebar?: boolean;
    noPadding?: boolean;
}

export default function AdminLayout({ children, fullScreen = false, hideSidebar = false, noPadding = false }: AdminLayoutProps) {
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
                    <ChatWidget />
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

    if (!context) return null;

    const { showMobileSidebar, toggleMobileSidebar } = context;

    return (
        <div className="flex h-screen overflow-hidden relative bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/50">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none z-0">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

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
            <div className={`flex flex-col flex-1 w-full h-full z-0 overflow-hidden`}>
                {!fullScreen && <Navbar hideSidebar={hideSidebar} />}
                <main className={`flex-1 ${fullScreen ? 'overflow-hidden p-0' : noPadding ? 'overflow-hidden p-0' : 'overflow-auto p-6'}`}>
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
