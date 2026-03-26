import React, { useState, useEffect, useRef } from "react";
import { usePage } from "@inertiajs/react";
import { HiOutlineBell } from "react-icons/hi2";
import axios from "axios";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedStaffComponent,
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

const NotificationDropdown: React.FC = () => {
    const { component } = usePage();
    const { theme } = useDashboardTheme("staff");
    const isDashboardThemeEnabled =
        isThemedStaffComponent(component) &&
        theme !== DEFAULT_DASHBOARD_THEME;
    const [isOpen, setIsOpen] = useState(false);
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const maxNotifications = 3;

    // Background polling: keep ref to latest fetchNotifications
    const fetchNotificationsRef = useRef<(() => void) | undefined>(undefined);

    useEffect(() => {
        fetchNotificationsRef.current = fetchNotifications;
    });

    // Initial fetch on mount + polling every 15 seconds for real-time updates
    useEffect(() => {
        fetchNotifications();

        const interval = setInterval(() => {
            fetchNotificationsRef.current?.();
        }, 15000);

        return () => clearInterval(interval);
    }, []);

    // Also refresh when dropdown opens
    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/staff/notifications');
            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await axios.put(`/staff/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('/staff/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="relative"
        >
            <button
                className={`relative ml-2 rounded-xl p-2 transition-all ${
                    isDashboardThemeEnabled
                        ? isOpen
                            ? "border border-base-300 bg-base-100 text-primary shadow-lg shadow-base-content/5"
                            : "border border-base-300 bg-base-100 text-base-content hover:text-primary shadow-lg shadow-base-content/5"
                        : isOpen
                            ? "text-green-800"
                            : "text-green-700 hover:text-green-600"
                }`}
                style={
                    isDashboardThemeEnabled
                        ? undefined
                        : {
                              background: 'rgba(255, 255, 255, 0.4)',
                              backdropFilter: 'blur(15px)',
                              WebkitBackdropFilter: 'blur(15px)',
                              borderColor: 'rgba(255, 255, 255, 0.5)',
                              boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                              border: '1px solid rgba(255, 255, 255, 0.5)'
                          }
                }
                title="Notifications"
                onClick={() => setIsOpen(!isOpen)}
            >
                <HiOutlineBell size={25} />
                {unreadCount > 0 && (
                    <span
                        className={`absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] ${
                            isDashboardThemeEnabled
                                ? "bg-error text-error-content"
                                : "bg-red-500 text-white"
                        }`}
                    >
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className={`absolute right-0 z-[30] max-h-96 w-[65vw] max-w-xs overflow-y-auto rounded-xl p-4 shadow-xl sm:w-80 ${
                        isDashboardThemeEnabled
                            ? "border border-base-300 bg-base-100 text-base-content shadow-2xl shadow-base-content/10"
                            : "text-black"
                    }`}
                    style={
                        isDashboardThemeEnabled
                            ? undefined
                            : {
                                  background: 'rgba(255, 255, 255, 0.95)',
                                  backdropFilter: 'blur(25px)',
                                  WebkitBackdropFilter: 'blur(25px)',
                                  border: '1px solid rgba(255, 255, 255, 0.6)',
                                  boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)'
                              }
                    }
                >
                    <div
                        className={`flex items-center justify-between border-b px-4 py-3 ${
                            isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'
                        }`}
                    >
                        <span
                            className={`font-medium ${
                                isDashboardThemeEnabled ? 'text-base-content' : 'text-green-800'
                            }`}
                        >
                            Notifications
                        </span>
                        <button
                            onClick={markAllAsRead}
                            className={`text-sm font-medium hover:underline ${
                                isDashboardThemeEnabled
                                    ? 'text-primary hover:text-secondary'
                                    : 'text-green-600 hover:text-green-700'
                            }`}
                        >
                            Mark all as Read
                        </button>
                    </div>

                    <div className="mt-2">
                        {notifications.length === 0 ? (
                            <div
                                className={`p-4 text-center text-sm ${
                                    isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-500'
                                }`}
                            >
                                No notifications
                            </div>
                        ) : (
                            (showAll
                                ? notifications
                                : notifications.slice(0, maxNotifications)
                            ).map((notif, index) => (
                                <div
                                    key={notif.id}
                                    className={`relative mb-1 flex cursor-pointer items-start gap-3 rounded-lg p-3 transition-all duration-300 ${
                                        !notif.is_read
                                            ? isDashboardThemeEnabled
                                                ? 'bg-primary/8'
                                                : 'bg-green-50'
                                            : isDashboardThemeEnabled
                                                ? 'hover:bg-base-200/80'
                                                : 'hover:bg-gray-50'
                                    }`}
                                    onClick={() => {
                                        setExpandedIndex(expandedIndex === index ? null : index);
                                        if (!notif.is_read) markAsRead(notif.id);
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <p
                                                className={`font-medium ${
                                                    !notif.is_read
                                                        ? isDashboardThemeEnabled
                                                            ? 'text-base-content'
                                                            : 'text-black'
                                                        : isDashboardThemeEnabled
                                                            ? 'text-base-content/65'
                                                            : 'text-gray-600'
                                                }`}
                                            >
                                                {notif.title}
                                            </p>
                                            <span
                                                className={`text-xs ${
                                                    isDashboardThemeEnabled ? 'text-base-content/40' : 'text-gray-400'
                                                }`}
                                            >
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {expandedIndex === index ? (
                                            <div className="mt-1">
                                                <p
                                                    className={`break-words text-sm ${
                                                        isDashboardThemeEnabled
                                                            ? 'text-base-content/65'
                                                            : 'text-gray-600'
                                                    }`}
                                                >
                                                    {notif.message}
                                                </p>
                                            </div>
                                        ) : (
                                            <p
                                                className={`mt-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm ${
                                                    isDashboardThemeEnabled
                                                        ? 'text-base-content/50'
                                                        : 'text-gray-500'
                                                }`}
                                            >
                                                {notif.message}
                                            </p>
                                        )}
                                    </div>
                                    {!notif.is_read && (
                                        <div
                                            className={`mt-2 h-2 w-2 rounded-full ${
                                                isDashboardThemeEnabled ? 'bg-primary' : 'bg-green-500'
                                            }`}
                                        ></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > maxNotifications && (
                        <button
                            className={`block w-full py-3 text-center text-sm font-medium hover:underline ${
                                isDashboardThemeEnabled
                                    ? 'text-primary hover:text-secondary'
                                    : 'text-green-600 hover:text-green-700'
                            }`}
                            onClick={() => setShowAll(!showAll)}
                        >
                            {showAll ? "Show Less" : "Show More"}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
