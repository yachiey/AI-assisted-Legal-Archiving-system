import React, { useState, useEffect, useRef } from "react";
import { HiOutlineBell } from "react-icons/hi2";
import axios from "axios";

interface Notification {
    id: number;
    title: string;
    message: string;
    created_at: string;
    is_read: boolean;
    type: string;
}

const NotificationDropdown: React.FC = () => {
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
        <div className="relative">
            <button
                className={`relative p-2 rounded-xl transition-all ml-2 ${isOpen
                    ? "text-green-800"
                    : "text-green-700 hover:text-green-600"
                    }`}
                style={{
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
                title="Notifications"
                onClick={() => setIsOpen(!isOpen)}
            >
                <HiOutlineBell size={25} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 sm:w-80 w-[65vw] max-w-xs text-black rounded-xl shadow-xl max-h-96 overflow-y-auto p-4 z-[30]"
                    style={{
                        background: 'rgba(255, 255, 255, 0.95)',
                        backdropFilter: 'blur(25px)',
                        WebkitBackdropFilter: 'blur(25px)',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                        <span className="font-medium text-green-800">Notifications</span>
                        <button
                            onClick={markAllAsRead}
                            className="text-sm text-green-600 hover:text-green-700 font-medium hover:underline"
                        >
                            Mark all as Read
                        </button>
                    </div>

                    <div className="mt-2">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500 text-sm">
                                No notifications
                            </div>
                        ) : (
                            (showAll
                                ? notifications
                                : notifications.slice(0, maxNotifications)
                            ).map((notif, index) => (
                                <div
                                    key={notif.id}
                                    className={`relative flex items-start gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer mb-1 ${!notif.is_read ? 'bg-green-50' : 'hover:bg-gray-50'
                                        }`}
                                    onClick={() => {
                                        setExpandedIndex(expandedIndex === index ? null : index);
                                        if (!notif.is_read) markAsRead(notif.id);
                                    }}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center">
                                            <p className={`font-medium ${!notif.is_read ? 'text-black' : 'text-gray-600'}`}>
                                                {notif.title}
                                            </p>
                                            <span className="text-xs text-gray-400">
                                                {new Date(notif.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        {expandedIndex === index ? (
                                            <div className="mt-1">
                                                <p className="text-sm text-gray-600 break-words">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 overflow-hidden text-ellipsis whitespace-nowrap mt-1">
                                                {notif.message}
                                            </p>
                                        )}
                                    </div>
                                    {!notif.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-green-500 mt-2"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {notifications.length > maxNotifications && (
                        <button
                            className="block w-full text-center text-green-600 hover:text-green-700 font-medium text-sm py-3 hover:underline"
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
