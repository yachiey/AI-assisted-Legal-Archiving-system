import { useContext, useState, useEffect } from 'react';
import { usePage, router } from '@inertiajs/react';
import { DashboardContext } from '../../../../Context/DashboardContext';
import { FileText, Download, Upload, Loader2, Calendar, X, User } from 'lucide-react';
import axios from 'axios';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../hooks/useDashboardTheme';

interface User {
  firstname?: string;
  name?: string;
}

interface PageProps {
  user?: User;
  auth?: {
    user?: User;
  };
  [key: string]: any;
}

interface DashboardHeaderProps {
  onUploadClick?: () => void;
}

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
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
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
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${
        isDashboardThemeEnabled ? 'bg-base-content/30' : 'bg-black/50'
      }`}
    >
      <div
        className={`mx-4 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ${
          isDashboardThemeEnabled
            ? 'border border-base-300 bg-base-100 text-base-content'
            : 'bg-white'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b p-5 ${
            isDashboardThemeEnabled
              ? 'border-base-300 bg-primary text-primary-content'
              : ''
          }`}
          style={
            isDashboardThemeEnabled
              ? undefined
              : { background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }
          }
        >
          <div className="flex items-center gap-3">
            <Calendar className={`w-5 h-5 ${
              isDashboardThemeEnabled ? 'text-primary-content' : 'text-[#FBEC5D]'
            }`} />
            <h3 className={`text-lg font-bold ${
              isDashboardThemeEnabled ? 'text-primary-content' : 'text-white'
            }`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 transition-colors ${
              isDashboardThemeEnabled
                ? 'text-primary-content/80 hover:bg-white/10 hover:text-primary-content'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
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
              <div className="mt-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`mb-1 block text-xs font-semibold ${
                      isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-700'
                    }`}>Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className={`w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none ${
                        isDashboardThemeEnabled
                          ? 'border-base-300 bg-base-100 text-base-content focus:border-primary focus:ring-2 focus:ring-primary/20'
                          : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent'
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
                      className={`w-full rounded-lg border px-3 py-2 text-sm transition-all outline-none ${
                        isDashboardThemeEnabled
                          ? 'border-base-300 bg-base-100 text-base-content focus:border-primary focus:ring-2 focus:ring-primary/20'
                          : 'border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent'
                      }`}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Filter (only for logs) */}
          {showUserFilter && (
            <div className={`border-t pt-4 ${
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
                className={`w-full cursor-pointer rounded-xl border px-3 py-2.5 text-sm transition-all outline-none ${
                  isDashboardThemeEnabled
                    ? 'border-base-300 bg-base-100 text-base-content focus:border-primary focus:ring-2 focus:ring-primary/20'
                    : 'border-gray-300 bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent'
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
                <p className={`mt-1 text-xs ${
                  isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-400'
                }`}>Loading users...</p>
              )}
            </div>
          )}

          {/* Format Selection */}
          <div className={`border-t pt-4 ${
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
                      : 'border-red-500 bg-red-50 text-red-700'
                    : isDashboardThemeEnabled
                      ? 'border-base-300 text-base-content/60 hover:border-base-content/30 hover:bg-base-200'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
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
                      : 'border-green-500 bg-green-50 text-green-700'
                    : isDashboardThemeEnabled
                      ? 'border-base-300 text-base-content/60 hover:border-base-content/30 hover:bg-base-200'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
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
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-all shadow-lg ${
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
};

export default function DashboardHeader({ onUploadClick }: DashboardHeaderProps) {
  const dashboardContext = useContext(DashboardContext);
  const collapsed = dashboardContext?.collapse;
  const pageData = usePage<PageProps>();
  const { theme } = useDashboardTheme();
  const user = pageData.props.user || pageData.props.auth?.user;
  const userName = user?.firstname || user?.name || 'User';
  const isDashboardThemeEnabled =
    pageData.component === 'Admin/Dashboard/index' &&
    theme !== DEFAULT_DASHBOARD_THEME;

  const [isGenerating, setIsGenerating] = useState(false);
  const [isExportingActivityLogs, setIsExportingActivityLogs] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);

  const handleNavigateToDocuments = () => {
    router.visit('/admin/documents');
  };

  const handleGenerateUsageReport = async (startDate: string, endDate: string, format: 'pdf' | 'csv' | 'excel') => {
    setIsGenerating(true);
    try {
      if (format === 'pdf') {
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
        const response = await axios.post('/admin/reports/export-excel', {
          reportType: 'usage',
          startDate,
          endDate,
          format: 'excel'
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
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/admin/reports/export-activity-logs';
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
          format: 'excel'
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
      <div
        className={`w-full shadow-lg rounded-b-3xl ${isDashboardThemeEnabled
          ? 'bg-gradient-to-br from-primary via-primary to-secondary text-primary-content'
          : ''
          }`}
        style={isDashboardThemeEnabled ? undefined : {
          background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)'
        }}
      >
        <div className={`transition-all duration-300 ${collapsed ? 'px-4 py-5' : 'px-8 py-6'
          }`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex-shrink-0">
              <div className="relative">
                <h1 className={`font-bold mb-2 transition-all duration-300 tracking-wide ${collapsed ? 'text-2xl' : 'text-3xl'
                  } ${isDashboardThemeEnabled ? 'text-primary-content' : 'text-white'
                  }`}
                  style={{
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}>
                  HELLO, {userName.toUpperCase()}!
                </h1>
                <div className={`h-1 rounded-full transition-all duration-300 ${collapsed ? 'w-40' : 'w-64'
                  } ${isDashboardThemeEnabled ? 'bg-gradient-to-r from-accent to-transparent' : 'bg-gradient-to-r from-yellow-400 to-transparent'
                  }`}></div>
              </div>
              <p className={`font-medium mt-3 transition-all duration-300 ${collapsed ? 'text-sm' : 'text-base'
                } ${isDashboardThemeEnabled ? 'text-primary-content/85' : 'text-white/90'
                }`}
                style={{
                  letterSpacing: '0.05em'
                }}>
                WELCOME BACK TO YOUR <span className={`font-bold ${isDashboardThemeEnabled ? 'text-accent' : 'text-yellow-300'}`}>DASHBOARD</span>
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            {/* Upload Document Button */}
            <button
              onClick={handleNavigateToDocuments}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg ${isDashboardThemeEnabled
                ? 'bg-primary-content/15 text-primary-content hover:bg-primary-content/22'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              <Upload className="w-4 h-4" />
              <span>UPLOAD DOCUMENT</span>
            </button>

            {/* Generate Report Button */}
            <button
              onClick={() => setShowReportModal(true)}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isDashboardThemeEnabled
                ? 'bg-primary-content/15 text-primary-content hover:bg-primary-content/22'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>GENERATING...</span>
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  <span>GENERATE REPORT</span>
                </>
              )}
            </button>

            {/* Export Logs Button */}
            <button
              onClick={() => setShowLogsModal(true)}
              disabled={isExportingActivityLogs}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${isDashboardThemeEnabled
                ? 'bg-primary-content/15 text-primary-content hover:bg-primary-content/22'
                : 'bg-white/20 text-white hover:bg-white/30'
                }`}
            >
              {isExportingActivityLogs ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>EXPORTING...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>EXPORT LOGS</span>
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
}
