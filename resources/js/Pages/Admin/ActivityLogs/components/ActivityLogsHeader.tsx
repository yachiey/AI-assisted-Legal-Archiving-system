import React, { RefObject, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, Activity as ActivityIcon, Calendar, X, User } from "lucide-react";
import axios from "axios";

// --- Components from ReportActionCards (reused) ---
type DateRangeType = 'today' | 'week' | 'month' | 'custom';

interface UserOption {
    user_id: number;
    firstname: string;
    lastname: string;
    role: string;
}

interface DateRangeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (startDate: string, endDate: string, format: 'pdf' | 'csv' | 'excel', userId?: string) => void;
    title: string;
    isLoading: boolean;
    showUserFilter?: boolean;
}

const DateRangeModal: React.FC<DateRangeModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    isLoading,
    showUserFilter = false
}) => {
    const [rangeType, setRangeType] = useState<DateRangeType>('month');
    const [customStartDate, setCustomStartDate] = useState('');
    const [customEndDate, setCustomEndDate] = useState('');
    const [selectedUserId, setSelectedUserId] = useState<string>('all');
    const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('pdf');
    const [users, setUsers] = useState<UserOption[]>([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    useEffect(() => {
        if (isOpen && showUserFilter) {
            fetchUsers();
        }
    }, [isOpen, showUserFilter]);

    // Prevent scrolling when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const response = await axios.get('/api/users/list', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json'
                }
            });
            setUsers(response.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    if (!isOpen || !mounted) return null;

    const getDateRange = (): { start: string; end: string } => {
        const today = new Date();

        switch (rangeType) {
            case 'today': {
                const dateStr = today.toISOString().split('T')[0];
                return { start: dateStr, end: dateStr };
            }
            case 'week': {
                const dayOfWeek = today.getDay();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - dayOfWeek);
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                return {
                    start: startOfWeek.toISOString().split('T')[0],
                    end: endOfWeek.toISOString().split('T')[0]
                };
            }
            case 'month': {
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
                const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
                return {
                    start: startOfMonth.toISOString().split('T')[0],
                    end: endOfMonth.toISOString().split('T')[0]
                };
            }
            case 'custom': {
                if (customStartDate && customEndDate) {
                    return { start: customStartDate, end: customEndDate };
                }
                return { start: '', end: '' };
            }
            default:
                return { start: '', end: '' };
        }
    };

    const handleConfirm = () => {
        const { start, end } = getDateRange();
        if (start && end) {
            onConfirm(start, end, exportFormat, selectedUserId !== 'all' ? selectedUserId : undefined);
        }
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div
                className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-5 border-b flex items-center justify-between" style={{
                    background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)'
                }}>
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-[#FBEC5D]" />
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <p className="text-sm text-gray-600">Select the date range for your export:</p>

                    {/* Quick Options */}
                    <div className="grid grid-cols-3 gap-2">
                        {(['today', 'week', 'month'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setRangeType(type)}
                                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider ${rangeType === type
                                    ? 'text-gray-900 shadow-lg scale-105'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                                style={rangeType === type ? {
                                    background: 'linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)',
                                } : {}}
                            >
                                {type === 'today' ? 'Today' : type === 'week' ? 'This Week' : 'This Month'}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Option */}
                    <div className="border-t pt-4">
                        <button
                            onClick={() => setRangeType('custom')}
                            className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider ${rangeType === 'custom'
                                ? 'text-gray-900 shadow-lg'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            style={rangeType === 'custom' ? {
                                background: 'linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)',
                            } : {}}
                        >
                            Custom Date Range
                        </button>

                        {rangeType === 'custom' && (
                            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Filter (only for logs) */}
                    {showUserFilter && (
                        <div className="border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-300 delay-75">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <label className="block text-xs font-semibold text-gray-700">Filter by User</label>
                            </div>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                disabled={loadingUsers}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer bg-white outline-none transition-all"
                            >
                                <option value="all">All Users</option>
                                {users.map((user) => (
                                    <option key={user.user_id} value={user.user_id.toString()}>
                                        {user.firstname} {user.lastname} ({user.role === 'admin' ? 'Admin' : 'Staff'})
                                    </option>
                                ))}
                            </select>
                            {loadingUsers && (
                                <p className="text-xs text-gray-400 mt-1 animate-pulse">Loading users...</p>
                            )}
                        </div>
                    )}

                    {/* Format Selection */}
                    <div className="border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-300 delay-100">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Export Format Options</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setExportFormat('pdf')}
                                className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${exportFormat === 'pdf'
                                    ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`w-3 h-3 rounded-full border ${exportFormat === 'pdf' ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}></span>
                                PDF Document
                            </button>
                            <button
                                onClick={() => setExportFormat('excel')}
                                className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${exportFormat === 'excel'
                                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                    }`}
                            >
                                <span className={`w-3 h-3 rounded-full border ${exportFormat === 'excel' ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}></span>
                                Excel / CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-5 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || (rangeType === 'custom' && (!customStartDate || !customEndDate))}
                        className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-900 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all shadow-lg"
                        style={{
                            background: 'linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)',
                        }}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Export
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
// ---------------------------------------------

interface ActivityLogsHeaderProps {
    dateInputRef: RefObject<HTMLInputElement>;
    selectedDate: string;
    isExporting: boolean;
    onDateChange: (date: string) => void;
    onExport: (startDate: string, endDate: string, format: 'pdf' | 'csv' | 'excel', userId?: string) => void;
}

const ActivityLogsHeader: React.FC<ActivityLogsHeaderProps> = ({
    dateInputRef,
    selectedDate,
    isExporting,
    onDateChange,
    onExport,
}) => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <div className="mb-8 p-6 rounded-2xl shadow-lg border border-green-700/20" style={{
                background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)'
            }}>
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
                            <ActivityIcon className="w-8 h-8 text-yellow-400" />
                            ACTIVITY LOGS
                        </h1>
                        <div className="h-1 w-48 bg-gradient-to-r from-yellow-400 to-transparent rounded-full mb-3"></div>
                        <p className="text-lg text-green-50 font-medium tracking-wide">
                            Monitor and track all system activities
                        </p>
                    </div>

                    {/* Export Button */}
                    <div className="flex items-center gap-2">
                        {/* Hidden input kept for potential legacy use or removed if fully replaced */}
                        {/* <input
                            ref={dateInputRef}
                            type="date"
                            ...
                        /> */}
                        <button
                            onClick={() => setShowModal(true)}
                            disabled={isExporting}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-lg backdrop-blur-sm group disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Export Logs
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <DateRangeModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onConfirm={(start, end, format, userId) => {
                    onExport(start, end, format, userId);
                    setShowModal(false);
                }}
                title="Export Activity Logs"
                isLoading={isExporting}
                showUserFilter={true}
            />
        </>
    );
};

export default ActivityLogsHeader;
