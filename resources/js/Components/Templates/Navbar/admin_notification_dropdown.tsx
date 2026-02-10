import React, { useState, useEffect } from "react";
import { HiOutlineBell } from "react-icons/hi2";
import { Check, X, Loader2, Shield } from "lucide-react";
import axios from "axios";

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
    user_id: number;
    user_name: string;
    user_email: string;
    permissions: Record<string, boolean>;
    permission_labels: string[];
    reason: string | null;
    created_at: string;
}

const AdminNotificationDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'notifications' | 'requests'>('notifications');
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
    const [showAll, setShowAll] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [processingId, setProcessingId] = useState<number | null>(null);
    const maxNotifications = 3;

    useEffect(() => {
        if (isOpen) {
            fetchNotifications();
            fetchPendingRequests();
        }
    }, [isOpen]);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/admin/notifications');
            if (response.data.success) {
                setNotifications(response.data.notifications);
            }
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingRequests = async () => {
        try {
            const response = await axios.get('/admin/permission-requests/pending');
            if (response.data.success) {
                setPendingRequests(response.data.requests);
            }
        } catch (error) {
            console.error("Failed to fetch pending requests", error);
        }
    };

    const markAsRead = async (id: number) => {
        try {
            await axios.put(`/admin/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.put('/admin/notifications/read-all');
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    const handleAccept = async (requestId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setProcessingId(requestId);
        try {
            await axios.post(`/admin/permission-requests/${requestId}/accept`);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            fetchNotifications(); // Refresh notifications
        } catch (error) {
            console.error("Failed to accept request", error);
        } finally {
            setProcessingId(null);
        }
    };

    const handleDecline = async (requestId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setProcessingId(requestId);
        try {
            await axios.post(`/admin/permission-requests/${requestId}/decline`);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
            fetchNotifications();
        } catch (error) {
            console.error("Failed to decline request", error);
        } finally {
            setProcessingId(null);
        }
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;
    const totalBadge = unreadCount + pendingRequests.length;

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
                {totalBadge > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                        {totalBadge > 9 ? '9+' : totalBadge}
                    </span>
                )}
            </button>

            {isOpen && (
                <div
                    className="absolute right-0 sm:w-[420px] w-[85vw] max-w-lg text-black rounded-xl shadow-xl max-h-[36rem] overflow-hidden z-[30]"
                    style={{
                        background: 'rgba(255, 255, 255, 0.98)',
                        backdropFilter: 'blur(25px)',
                        WebkitBackdropFilter: 'blur(25px)',
                        border: '1px solid rgba(255, 255, 255, 0.6)',
                        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.15)'
                    }}
                >
                    {/* Tabs */}
                    <div className="flex border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('notifications')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'notifications'
                                ? 'text-green-700 border-b-2 border-green-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Notifications {unreadCount > 0 && `(${unreadCount})`}
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${activeTab === 'requests'
                                ? 'text-amber-700 border-b-2 border-amber-600'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            <span className="flex items-center justify-center gap-2">
                                <Shield className="w-4 h-4" />
                                Requests {pendingRequests.length > 0 && `(${pendingRequests.length})`}
                            </span>
                        </button>
                    </div>

                    <div className="overflow-y-auto max-h-[28rem] p-4">
                        {activeTab === 'notifications' ? (
                            <>
                                {/* Notifications Header */}
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-sm font-medium text-gray-600">Recent Notifications</span>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-xs text-green-600 hover:text-green-700 font-medium hover:underline"
                                        >
                                            Mark all as Read
                                        </button>
                                    )}
                                </div>

                                {notifications.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No notifications
                                    </div>
                                ) : (
                                    (showAll ? notifications : notifications.slice(0, maxNotifications)).map((notif, index) => (
                                        <div
                                            key={notif.id}
                                            className={`relative flex items-start gap-3 p-3 rounded-lg transition-all duration-300 cursor-pointer mb-2 ${!notif.is_read ? 'bg-green-50' : 'hover:bg-gray-50'
                                                } ${notif.type === 'permission_request' ? 'border-l-4 border-amber-400' : ''}`}
                                            onClick={() => {
                                                setExpandedIndex(expandedIndex === index ? null : index);
                                                if (!notif.is_read) markAsRead(notif.id);
                                            }}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center">
                                                    <p className={`font-medium text-sm ${!notif.is_read ? 'text-black' : 'text-gray-600'}`}>
                                                        {notif.title}
                                                    </p>
                                                    <span className="text-xs text-gray-400 ml-2">
                                                        {new Date(notif.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                {expandedIndex === index ? (
                                                    <p className="text-sm text-gray-600 break-words mt-1">
                                                        {notif.message}
                                                    </p>
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

                                {notifications.length > maxNotifications && (
                                    <button
                                        className="block w-full text-center text-green-600 hover:text-green-700 font-medium text-sm py-2 hover:underline"
                                        onClick={() => setShowAll(!showAll)}
                                    >
                                        {showAll ? "Show Less" : "Show More"}
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                {/* Permission Requests */}
                                <div className="mb-3">
                                    <span className="text-sm font-medium text-gray-600">Pending Permission Requests</span>
                                </div>

                                {pendingRequests.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500 text-sm">
                                        No pending requests
                                    </div>
                                ) : (
                                    pendingRequests.map((request) => (
                                        <div
                                            key={request.id}
                                            className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-3"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="font-medium text-gray-900">{request.user_name}</p>
                                                    <p className="text-xs text-gray-500">{request.user_email}</p>
                                                </div>
                                                <span className="text-xs text-gray-400">
                                                    {new Date(request.created_at).toLocaleDateString()}
                                                </span>
                                            </div>

                                            <div className="mb-3">
                                                <p className="text-xs font-medium text-gray-600 mb-1">Requested Permissions:</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {request.permission_labels.map((label, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full"
                                                        >
                                                            {label}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {request.reason && (
                                                <div className="mb-3">
                                                    <p className="text-xs font-medium text-gray-600 mb-1">Reason:</p>
                                                    <p className="text-sm text-gray-700 bg-white p-2 rounded border border-gray-200">
                                                        {request.reason}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={(e) => handleAccept(request.id, e)}
                                                    disabled={processingId === request.id}
                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === request.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <Check className="w-4 h-4" />
                                                            Accept
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => handleDecline(request.id, e)}
                                                    disabled={processingId === request.id}
                                                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
                                                >
                                                    {processingId === request.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <>
                                                            <X className="w-4 h-4" />
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
