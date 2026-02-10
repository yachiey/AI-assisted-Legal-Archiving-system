import React, { useState, useEffect } from "react";
import { FileText, Download, Loader2, Activity, Calendar, X, User } from "lucide-react";
import axios from "axios";

type DateRangeType = 'today' | 'week' | 'month' | 'custom';

interface UserOption {
    user_id: number;
    firstname: string;
    lastname: string;
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

    useEffect(() => {
        if (isOpen && showUserFilter) {
            fetchUsers();
        }
    }, [isOpen, showUserFilter]);

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

    if (!isOpen) return null;

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
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
                        className="text-white/70 hover:text-white transition-colors p-1"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
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
                            <div className="mt-4 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Start Date</label>
                                        <input
                                            type="date"
                                            value={customStartDate}
                                            onChange={(e) => setCustomStartDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">End Date</label>
                                        <input
                                            type="date"
                                            value={customEndDate}
                                            onChange={(e) => setCustomEndDate(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* User Filter (only for logs) */}
                    {showUserFilter && (
                        <div className="border-t pt-4">
                            <div className="flex items-center gap-2 mb-2">
                                <User className="w-4 h-4 text-gray-500" />
                                <label className="block text-xs font-semibold text-gray-700">Filter by User</label>
                            </div>
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                disabled={loadingUsers}
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer bg-white"
                            >
                                <option value="all">All Users</option>
                                {users.map((user) => (
                                    <option key={user.user_id} value={user.user_id.toString()}>
                                        {user.firstname} {user.lastname}
                                    </option>
                                ))}
                            </select>
                            {loadingUsers && (
                                <p className="text-xs text-gray-400 mt-1">Loading users...</p>
                            )}
                        </div>
                    )}

                    {/* Format Selection */}
                    <div className="border-t pt-4">
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Export Format Options</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setExportFormat('pdf')}
                                className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${exportFormat === 'pdf'
                                    ? 'border-red-500 bg-red-50 text-red-700'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <span className={`w-3 h-3 rounded-full border ${exportFormat === 'pdf' ? 'bg-red-500 border-red-500' : 'border-gray-300'}`}></span>
                                PDF Document
                            </button>
                            <button
                                onClick={() => setExportFormat('excel')}
                                className={`flex-1 py-2 px-3 rounded-xl border-2 text-xs font-bold transition-all duration-300 flex items-center justify-center gap-2 ${exportFormat === 'excel'
                                    ? 'border-green-500 bg-green-50 text-green-700'
                                    : 'border-gray-200 text-gray-500 hover:border-gray-300'
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
};

const ReportActionCards: React.FC = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExportingActivityLogs, setIsExportingActivityLogs] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);

    const handleGenerateUsageReport = async (startDate: string, endDate: string, format: 'pdf' | 'csv' | 'excel') => {
        setIsGenerating(true);
        try {
            if (format === 'pdf') {
                // Open report in new window with date filters
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/admin/reports/export-pdf';
                form.target = '_blank';

                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (csrfToken) {
                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = '_token';
                    csrfInput.value = csrfToken;
                    form.appendChild(csrfInput);
                }

                const reportTypeInput = document.createElement('input');
                reportTypeInput.type = 'hidden';
                reportTypeInput.name = 'reportType';
                reportTypeInput.value = 'usage';
                form.appendChild(reportTypeInput);

                const startDateInput = document.createElement('input');
                startDateInput.type = 'hidden';
                startDateInput.name = 'startDate';
                startDateInput.value = startDate;
                form.appendChild(startDateInput);

                const endDateInput = document.createElement('input');
                endDateInput.type = 'hidden';
                endDateInput.name = 'endDate';
                endDateInput.value = endDate;
                form.appendChild(endDateInput);

                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);
            } else {
                // Export as Excel/CSV
                const response = await axios.post('/admin/reports/export-excel', {
                    reportType: 'usage',
                    startDate,
                    endDate,
                    format: 'excel' // Using 'excel' to match backend default or pass 'csv' if needed. UI says "Excel / CSV" so .xlsx is fine.
                }, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `usage-report-${startDate}-to-${endDate}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            }
            setShowReportModal(false);
        } catch (error) {
            console.error("Error generating usage report:", error);
            alert("Failed to generate usage report. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExportActivityLogs = async (startDate: string, endDate: string, format: 'pdf' | 'csv' | 'excel', userId?: string) => {
        setIsExportingActivityLogs(true);
        try {
            if (format === 'pdf') {
                // Open report in new window
                const form = document.createElement('form');
                form.method = 'POST';
                form.action = '/admin/reports/export-activity-logs'; // Using same route, backend handles PDF
                form.target = '_blank';

                const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                if (csrfToken) {
                    const csrfInput = document.createElement('input');
                    csrfInput.type = 'hidden';
                    csrfInput.name = '_token';
                    csrfInput.value = csrfToken;
                    form.appendChild(csrfInput);
                }

                const startDateInput = document.createElement('input');
                startDateInput.type = 'hidden';
                startDateInput.name = 'startDate';
                startDateInput.value = startDate;
                form.appendChild(startDateInput);

                const endDateInput = document.createElement('input');
                endDateInput.type = 'hidden';
                endDateInput.name = 'endDate';
                endDateInput.value = endDate;
                form.appendChild(endDateInput);

                const formatInput = document.createElement('input');
                formatInput.type = 'hidden';
                formatInput.name = 'format';
                formatInput.value = 'pdf';
                form.appendChild(formatInput);

                if (userId) {
                    const userIdInput = document.createElement('input');
                    userIdInput.type = 'hidden';
                    userIdInput.name = 'userId';
                    userIdInput.value = userId;
                    form.appendChild(userIdInput);
                }

                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);
            } else {
                const response = await axios.post('/admin/reports/export-activity-logs', {
                    startDate,
                    endDate,
                    userId: userId || undefined,
                    format: 'excel' // or 'csv' if we want to differentiate
                }, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                const userSuffix = userId ? `-user-${userId}` : '';
                link.setAttribute('download', `activity-logs-${startDate}-to-${endDate}${userSuffix}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            }
            setShowLogsModal(false);
        } catch (error) {
            console.error("Error exporting activity logs:", error);
            alert("Failed to export activity logs. Please try again.");
        } finally {
            setIsExportingActivityLogs(false);
        }
    };

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Generate Report Card */}
                <div className="relative rounded-3xl shadow-lg border border-green-100/50 overflow-hidden group transform hover:-translate-y-1 transition-all duration-500 p-6 flex flex-col" style={{
                    background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)'
                }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-xl shadow-inner group-hover:rotate-6 transition-transform">
                                <FileText className="w-5 h-5 text-[#FBEC5D]" />
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight uppercase leading-tight">
                                Generate Report
                            </h3>
                        </div>

                        <p className="text-white/80 text-xs font-normal leading-relaxed">
                            Generate detailed analytics report with document statistics for a specific date range.
                        </p>

                        <button
                            onClick={() => setShowReportModal(true)}
                            disabled={isGenerating}
                            className="w-full bg-[#FBEC5D] hover:bg-[#f5e042] px-5 py-3 rounded-2xl transition-all duration-300 text-xs font-black flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] shadow-xl text-gray-900 uppercase tracking-wider"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    GENERATING...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 font-bold" />
                                    GENERATE REPORT
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Export Logs Card */}
                <div className="relative rounded-3xl shadow-lg border border-green-100/50 overflow-hidden group transform hover:-translate-y-1 transition-all duration-500 p-6 flex flex-col" style={{
                    background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)'
                }}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-white/20 rounded-xl shadow-inner group-hover:rotate-6 transition-transform">
                                <Activity className="w-5 h-5 text-[#FBEC5D]" />
                            </div>
                            <h3 className="text-lg font-bold text-white tracking-tight uppercase leading-tight">
                                Export Logs
                            </h3>
                        </div>

                        <p className="text-white/80 text-xs font-normal leading-relaxed">
                            Export activity logs filtered by date and user. Includes logins, document actions, and events.
                        </p>

                        <button
                            onClick={() => setShowLogsModal(true)}
                            disabled={isExportingActivityLogs}
                            className="w-full bg-[#FBEC5D] hover:bg-[#f5e042] px-5 py-3 rounded-2xl transition-all duration-300 text-xs font-black flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] shadow-xl text-gray-900 uppercase tracking-wider"
                        >
                            {isExportingActivityLogs ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    EXPORTING...
                                </>
                            ) : (
                                <>
                                    <Download className="w-4 h-4 font-bold" />
                                    EXPORT LOGS
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Date Range Modals */}
            <DateRangeModal
                isOpen={showReportModal}
                onClose={() => setShowReportModal(false)}
                onConfirm={handleGenerateUsageReport}
                title="Generate Report"
                isLoading={isGenerating}
                showUserFilter={false}
            />

            <DateRangeModal
                isOpen={showLogsModal}
                onClose={() => setShowLogsModal(false)}
                onConfirm={handleExportActivityLogs}
                title="Export Activity Logs"
                isLoading={isExportingActivityLogs}
                showUserFilter={true}
            />
        </>
    );
};

export default ReportActionCards;
