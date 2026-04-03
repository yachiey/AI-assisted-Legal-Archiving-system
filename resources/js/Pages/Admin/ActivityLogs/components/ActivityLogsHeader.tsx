import React, { RefObject, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Download, Loader2, Activity as ActivityIcon, Calendar, X, User } from "lucide-react";
import axios from "axios";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

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
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

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
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        >
            <div
                className={`w-full max-w-md overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 ${
                    isDashboardThemeEnabled
                        ? 'border border-base-300 bg-base-100 text-base-content'
                        : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className={`flex items-center justify-between border-b p-5 ${
                        isDashboardThemeEnabled
                            ? 'border-base-300 bg-primary text-primary-content'
                            : 'border-transparent'
                    }`}
                    style={
                        isDashboardThemeEnabled
                            ? undefined
                            : { background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)' }
                    }
                >
                    <div className="flex items-center gap-3">
                        <Calendar className={`w-5 h-5 ${
                            isDashboardThemeEnabled ? 'text-primary-content' : 'text-[#FBEC5D]'
                        }`} />
                        <h3 className="text-lg font-bold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className={`rounded-lg p-1 transition-colors ${
                            isDashboardThemeEnabled
                                ? 'text-primary-content/80 hover:bg-white/10 hover:text-primary-content'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    <p className={`text-sm ${
                        isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'
                    }`}>Select the date range for your export:</p>

                    {/* Quick Options */}
                    <div className="grid grid-cols-3 gap-2">
                        {(['today', 'week', 'month'] as const).map((type) => (
                            <button
                                key={type}
                                onClick={() => setRangeType(type)}
                                className={`px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider ${
                                    rangeType === type
                                        ? isDashboardThemeEnabled
                                            ? 'bg-primary text-primary-content shadow-lg scale-105'
                                            : 'text-gray-900 shadow-lg scale-105'
                                        : isDashboardThemeEnabled
                                            ? 'bg-base-200 text-base-content/70 hover:bg-base-300'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                style={
                                    rangeType === type && !isDashboardThemeEnabled
                                        ? { background: 'linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)' }
                                        : {}
                                }
                            >
                                {type === 'today' ? 'Today' : type === 'week' ? 'This Week' : 'This Month'}
                            </button>
                        ))}
                    </div>

                    {/* Custom Date Option */}
                    <div className={`border-t pt-4 ${
                        isDashboardThemeEnabled ? 'border-base-300' : ''
                    }`}>
                        <button
                            onClick={() => setRangeType('custom')}
                            className={`w-full px-4 py-3 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider ${
                                rangeType === 'custom'
                                    ? isDashboardThemeEnabled
                                        ? 'bg-primary text-primary-content shadow-lg'
                                        : 'text-gray-900 shadow-lg'
                                    : isDashboardThemeEnabled
                                        ? 'bg-base-200 text-base-content/70 hover:bg-base-300'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                            style={
                                rangeType === 'custom' && !isDashboardThemeEnabled
                                    ? { background: 'linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)' }
                                    : {}
                            }
                        >
                            Custom Date Range
                        </button>

                        {rangeType === 'custom' && (
                            <div className="mt-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className={`mb-1 block text-xs font-semibold ${
                                            isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-700'
                                        }`}>Start Date</label>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all ${
                                                isDashboardThemeEnabled
                                                    ? 'border-base-300 bg-base-100 text-base-content focus:border-primary focus:ring-2 focus:ring-primary/20'
                                                    : 'border-gray-300 focus:border-transparent focus:ring-2 focus:ring-green-500'
                                            }`}
                                        />
                                    </div>
                                    <div>
                                        <label className={`mb-1 block text-xs font-semibold ${
                                            isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-700'
                                        }`}>End Date</label>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all ${
                                                isDashboardThemeEnabled
                                                    ? 'border-base-300 bg-base-100 text-base-content focus:border-primary focus:ring-2 focus:ring-primary/20'
                                                    : 'border-gray-300 focus:border-transparent focus:ring-2 focus:ring-green-500'
                                            }`}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Filter (only for logs) */}
                    {showUserFilter && (
                        <div className={`border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-300 delay-75 ${
                            isDashboardThemeEnabled ? 'border-base-300' : ''
                        }`}>
                            <div className="flex items-center gap-2 mb-2">
                                <User className={`w-4 h-4 ${
                                    isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-500'
                                }`} />
                                <label className={`block text-xs font-semibold ${
                                    isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-700'
                                }`}>Filter by User</label>
                            </div>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                disabled={loadingUsers}
                                className={`w-full cursor-pointer rounded-xl border px-3 py-2.5 text-sm outline-none transition-all ${
                                    isDashboardThemeEnabled
                                        ? 'border-base-300 bg-base-100 text-base-content focus:border-primary focus:ring-2 focus:ring-primary/20'
                                        : 'border-gray-300 bg-white focus:border-transparent focus:ring-2 focus:ring-green-500'
                                }`}
                            >
                                <option value="all">All Users</option>
                                {users.map((user) => (
                                    <option key={user.user_id} value={user.user_id.toString()}>
                                        {user.firstname} {user.lastname} ({user.role === 'admin' ? 'Admin' : 'Staff'})
                                    </option>
                                ))}
                            </select>
                            {loadingUsers && (
                                <p className={`mt-1 animate-pulse text-xs ${
                                    isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-400'
                                }`}>Loading users...</p>
                            )}
                        </div>
                    )}

                    {/* Format Selection */}
                    <div className={`border-t pt-4 animate-in fade-in slide-in-from-top-2 duration-300 delay-100 ${
                        isDashboardThemeEnabled ? 'border-base-300' : ''
                    }`}>
                        <label className={`mb-2 block text-xs font-semibold ${
                            isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-700'
                        }`}>Export Format Options</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setExportFormat('pdf')}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all duration-300 ${
                                    exportFormat === 'pdf'
                                        ? isDashboardThemeEnabled
                                            ? 'border-error bg-error/10 text-error shadow-sm'
                                            : 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                                        : isDashboardThemeEnabled
                                            ? 'border-base-300 text-base-content/60 hover:border-base-content/30 hover:bg-base-200'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className={`w-3 h-3 rounded-full border ${
                                    exportFormat === 'pdf'
                                        ? isDashboardThemeEnabled
                                            ? 'border-error bg-error'
                                            : 'bg-red-500 border-red-500'
                                        : isDashboardThemeEnabled
                                            ? 'border-base-300'
                                            : 'border-gray-300'
                                }`}></span>
                                PDF Document
                            </button>
                            <button
                                onClick={() => setExportFormat('excel')}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2 text-xs font-bold transition-all duration-300 ${
                                    exportFormat === 'excel'
                                        ? isDashboardThemeEnabled
                                            ? 'border-success bg-success/10 text-success shadow-sm'
                                            : 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                                        : isDashboardThemeEnabled
                                            ? 'border-base-300 text-base-content/60 hover:border-base-content/30 hover:bg-base-200'
                                            : 'border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                }`}
                            >
                                <span className={`w-3 h-3 rounded-full border ${
                                    exportFormat === 'excel'
                                        ? isDashboardThemeEnabled
                                            ? 'border-success bg-success'
                                            : 'bg-green-500 border-green-500'
                                        : isDashboardThemeEnabled
                                            ? 'border-base-300'
                                            : 'border-gray-300'
                                }`}></span>
                                Excel / CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className={`flex justify-end gap-3 border-t p-5 ${
                    isDashboardThemeEnabled
                        ? 'border-base-300 bg-base-200/80'
                        : 'bg-gray-50'
                }`}>
                    <button
                        onClick={onClose}
                        className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition-colors ${
                            isDashboardThemeEnabled
                                ? 'text-base-content/70 hover:bg-base-100'
                                : 'text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={isLoading || (rangeType === 'custom' && (!customStartDate || !customEndDate))}
                        className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 hover:scale-105 transition-all shadow-lg ${
                            isDashboardThemeEnabled
                                ? 'bg-primary text-primary-content shadow-primary/20'
                                : 'text-gray-900'
                        }`}
                        style={
                            isDashboardThemeEnabled
                                ? undefined
                                : { background: 'linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)' }
                        }
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
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

    return (
        <>
            <div
                data-theme={isDashboardThemeEnabled ? theme : undefined}
                className={`mb-8 rounded-2xl border p-6 shadow-lg ${
                    isDashboardThemeEnabled
                        ? 'border-primary/20 bg-gradient-to-br from-primary via-primary to-secondary text-primary-content'
                        : 'border-green-700/20'
                }`}
                style={
                    isDashboardThemeEnabled
                        ? undefined
                        : { background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }
                }
            >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className={`mb-2 flex items-center gap-3 text-4xl font-black tracking-tight md:text-5xl ${
                            isDashboardThemeEnabled ? 'text-primary-content' : 'text-white'
                        }`}>
                            <ActivityIcon className={`w-8 h-8 ${
                                isDashboardThemeEnabled ? 'text-accent' : 'text-yellow-400'
                            }`} />
                            ACTIVITY LOGS
                        </h1>
                        <div
                            className="mb-3 h-1 w-48 rounded-full"
                            style={{
                                background: isDashboardThemeEnabled
                                    ? 'linear-gradient(90deg, oklch(var(--a)), transparent)'
                                    : 'linear-gradient(90deg, #facc15, transparent)',
                            }}
                        ></div>
                        <p className={`text-lg font-medium tracking-wide ${
                            isDashboardThemeEnabled ? 'text-primary-content/85' : 'text-green-50'
                        }`}>
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
                            className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 ${
                                isDashboardThemeEnabled
                                    ? 'border-2 border-primary-content/30 bg-primary-content/15 text-primary-content shadow-sm backdrop-blur-sm hover:bg-primary-content/25 hover:shadow-lg'
                                    : 'border-2 border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-sm hover:bg-white/20 hover:shadow-lg'
                            }`}
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
