import React, { useEffect, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";
import { HiOutlineBell } from "react-icons/hi2";
import { Check, Loader2, Shield, X } from "lucide-react";
import axios from "axios";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedAdminComponent,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

interface Notification {
    id: number;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
    type: string;
}

interface PendingRequest {
    id: number;
    user_name: string;
    user_email: string;
    permission_labels: string[];
    reason: string | null;
    created_at: string;
}

const AdminNotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"notifications" | "requests">("notifications");
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const { component } = usePage();
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled =
        isThemedAdminComponent(component) && theme !== DEFAULT_DASHBOARD_THEME;
    const fetchNotificationsRef = useRef<(() => void) | undefined>(undefined);
    const fetchPendingRequestsRef = useRef<(() => void) | undefined>(undefined);
    const maxNotifications = 3;

    useEffect(() => {
        fetchNotificationsRef.current = fetchNotifications;
        fetchPendingRequestsRef.current = fetchPendingRequests;
    });

    useEffect(() => {
        fetchNotifications();
        fetchPendingRequests();
        const interval = setInterval(() => {
            fetchNotificationsRef.current?.();
            fetchPendingRequestsRef.current?.();
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            fetchPendingRequests();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get("/admin/notifications");
            if (response.data.success) setNotifications(response.data.notifications);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get("/admin/permission-requests/pending");
            if (response.data.success) setPendingRequests(response.data.requests);
        } catch (error) {
            console.error("Failed to fetch pending requests", error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await axios.put(`/admin/notifications/${id}/read`);
            setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put("/admin/notifications/read-all");
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleRequestAction = async (
        requestId: number,
        action: "accept" | "decline",
        e: React.MouseEvent
    ) => {
        e.stopPropagation();
        setProcessingId(requestId);
        try {
            await axios.post(`/admin/permission-requests/${requestId}/${action}`);
            setPendingRequests((prev) => prev.filter((r) => r.id !== requestId));
            fetchNotifications();
        } catch (error) {
            console.error(`Failed to ${action} request`, error);
        } finally {
            setProcessingId(null);
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;
    const totalBadge = unreadCount + pendingRequests.length;
    const panelClass = isDashboardThemeEnabled
        ? "border border-base-300 bg-base-100 text-base-content shadow-2xl shadow-base-content/10"
        : "text-black";
    const mutedText = isDashboardThemeEnabled ? "text-base-content/60" : "text-gray-500";
    const strongText = isDashboardThemeEnabled ? "text-base-content" : "text-gray-900";

    return (
        <div data-theme={isDashboardThemeEnabled ? theme : undefined} className="relative">
            <button
                className={`relative ml-2 rounded-xl p-2 transition-all ${
                    isDashboardThemeEnabled
                        ? "border border-base-300/80 bg-base-100 text-base-content shadow-lg shadow-base-content/5 hover:text-primary"
                        : isOpen
                          ? "text-green-800"
                          : "text-green-700 hover:text-green-600"
                }`}
                style={
                    isDashboardThemeEnabled
                        ? undefined
                        : {
                              background: "rgba(255, 255, 255, 0.4)",
                              backdropFilter: "blur(15px)",
                              WebkitBackdropFilter: "blur(15px)",
                              border: "1px solid rgba(255, 255, 255, 0.5)",
                              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.05)",
                          }
                }
                title="Notifications"
                onClick={() => setIsOpen(!isOpen)}
            >
                <HiOutlineBell size={25} />
                {totalBadge > 0 && (
                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">
                        {totalBadge > 9 ? "9+" : totalBadge}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className={`absolute right-0 z-[30] max-h-[36rem] w-[85vw] max-w-lg overflow-hidden rounded-xl sm:w-[420px] ${panelClass}`}
                    style={
                        isDashboardThemeEnabled
                            ? undefined
                            : {
                                  background: "rgba(255, 255, 255, 0.98)",
                                  backdropFilter: "blur(25px)",
                                  WebkitBackdropFilter: "blur(25px)",
                                  border: "1px solid rgba(255, 255, 255, 0.6)",
                                  boxShadow: "0 8px 30px rgba(0, 0, 0, 0.15)",
                              }
                    }
                >
                    <div className={`flex border-b ${isDashboardThemeEnabled ? "border-base-300" : "border-gray-200"}`}>
                        <button
                            onClick={() => setActiveTab("notifications")}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === "notifications"
                                    ? isDashboardThemeEnabled
                                        ? "border-b-2 border-primary text-primary"
                                        : "border-b-2 border-green-600 text-green-700"
                                    : isDashboardThemeEnabled
                                      ? "text-base-content/60 hover:text-base-content"
                                      : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            Notifications {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                        <button
                            onClick={() => setActiveTab("requests")}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                                activeTab === "requests"
                                    ? isDashboardThemeEnabled
                                        ? "border-b-2 border-warning text-warning"
                                        : "border-b-2 border-amber-600 text-amber-700"
                                    : isDashboardThemeEnabled
                                      ? "text-base-content/60 hover:text-base-content"
                                      : "text-gray-500 hover:text-gray-700"
                            }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Shield className="h-4 w-4" />
                                Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                            </span>
                        </button>
                    </div>

                    <div className="max-h-[28rem] overflow-y-auto p-4">
                        {activeTab === "notifications" ? (
                            <>
                                <div className="mb-3 flex items-center justify-between">
                                    <span className={`text-sm font-medium ${mutedText}`}>Recent Notifications</span>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className={`text-xs font-medium hover:underline ${
                                                isDashboardThemeEnabled
                                                    ? "text-primary hover:text-primary/80"
                                                    : "text-green-600 hover:text-green-700"
                                            }`}
                                        >
                                            Mark all as Read
                                        </button>
                                    )}
                                </div>

                                {loading && notifications.length === 0 ? (
                                    <div className={`flex items-center justify-center gap-2 p-8 text-sm ${mutedText}`}>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Loading notifications...
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <div className={`p-8 text-center text-sm ${mutedText}`}>No notifications</div>
                                ) : (
                                    (showAll ? notifications : notifications.slice(0, maxNotifications)).map((notif, index) => (
                                        <div
                                            key={notif.id}
                                            className={`relative mb-2 flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-all ${
                                                !notif.is_read
                                                    ? isDashboardThemeEnabled
                                                        ? "bg-primary/10"
                                                        : "bg-green-50"
                                                    : isDashboardThemeEnabled
                                                      ? "hover:bg-base-200/70"
                                                      : "hover:bg-gray-50"
                                            } ${notif.type === "permission_request" ? (isDashboardThemeEnabled ? "border-l-4 border-warning" : "border-l-4 border-amber-400") : ""}`}
                                            onClick={() => {
                                                setExpandedIndex(expandedIndex === index ? null : index);
                                                if (!notif.is_read) markAsRead(notif.id);
                                            }}
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center justify-between">
                                                    <p className={`text-sm font-medium ${!notif.is_read ? strongText : mutedText}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className={`ml-2 text-xs ${isDashboardThemeEnabled ? "text-base-content/40" : "text-gray-400"}`}>
                                                        {new Date(notif.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className={`mt-1 text-sm ${expandedIndex === index ? "" : "overflow-hidden text-ellipsis whitespace-nowrap"} ${isDashboardThemeEnabled ? "text-base-content/65" : "text-gray-600"}`}>
                                                    {notif.message}
                                                </p>
                                            </div>
                                            {!notif.is_read && (
                                                <div className={`mt-2 h-2 w-2 rounded-full ${isDashboardThemeEnabled ? "bg-primary" : "bg-green-500"}`}></div>
                                            )}
                                        </div>
                                    ))
                                )}

                                {notifications.length > maxNotifications && (
                                    <button
                                        className={`block w-full py-2 text-center text-sm font-medium hover:underline ${
                                            isDashboardThemeEnabled
                                                ? "text-primary hover:text-primary/80"
                                                : "text-green-600 hover:text-green-700"
                                        }`}
                                        onClick={() => setShowAll(!showAll)}
                                    >
                                        {showAll ? "Show Less" : "Show More"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="mb-3">
                                    <span className={`text-sm font-medium ${mutedText}`}>Pending Permission Requests</span>
                                </div>
                                {pendingRequests.length === 0 ? (
                                    <div className={`p-8 text-center text-sm ${mutedText}`}>No pending requests</div>
                                ) : (
                                    pendingRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className={`mb-3 rounded-lg border p-4 ${
                                                isDashboardThemeEnabled
                                                    ? "border-base-300 bg-base-200/60"
                                                    : "border-amber-200 bg-amber-50"
                                            }`}
                                        >
                                            <div className="mb-2 flex items-start justify-between">
                                                <div>
                                                    <p className={`font-medium ${strongText}`}>{request.user_name}</p>
                                                    <p className={`text-xs ${mutedText}`}>{request.user_email}</p>
                                                </div>
                                                <span className={`text-xs ${isDashboardThemeEnabled ? "text-base-content/40" : "text-gray-400"}`}>
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="mb-3">
                                                <p className={`mb-1 text-xs font-medium ${mutedText}`}>Requested Permissions:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {request.permission_labels.map((label, idx) => (
                                                        <span
                                                            key={idx}
                                                            className={`rounded-full px-2 py-0.5 text-xs ${
                                                                isDashboardThemeEnabled
                                                                    ? "bg-warning/15 text-warning"
                                                                    : "bg-amber-100 text-amber-800"
                                                            }`}
                                                        >
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {request.reason && (
                                                <div className="mb-3">
                                                    <p className={`mb-1 text-xs font-medium ${mutedText}`}>Reason:</p>
                                                    <p
                                                        className={`rounded border p-2 text-sm ${
                                                            isDashboardThemeEnabled
                                                                ? "border-base-300 bg-base-100 text-base-content/75"
                                                                : "border-gray-200 bg-white text-gray-700"
                                                        }`}
                                                    >
                                                        {request.reason}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => handleRequestAction(request.id, "accept", e)}
                                                    disabled={processingId === request.id}
                                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-success px-3 py-2 text-sm font-medium text-success-content transition-colors hover:bg-success/90 disabled:opacity-50"
                                                >
                                                    {processingId === request.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Check className="h-4 w-4" />
                                                            Accept
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => handleRequestAction(request.id, "decline", e)}
                                                    disabled={processingId === request.id}
                                                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-error px-3 py-2 text-sm font-medium text-error-content transition-colors hover:bg-error/90 disabled:opacity-50"
                                                >
                                                    {processingId === request.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <X className="h-4 w-4" />
                                                            Decline
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminNotificationDropdown;
