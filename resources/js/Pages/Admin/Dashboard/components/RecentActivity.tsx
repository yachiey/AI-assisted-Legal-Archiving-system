import React, { useState, useRef } from "react";
import { Activity as ActivityIcon, ChevronLeft, ChevronRight, Filter, Download, Loader2 } from "lucide-react";
import axios from "axios";

interface Activity {
    action: string;
    document: string;
    user: string;
    time: string;
}

interface RecentActivityProps {
    activities: Activity[];
}

const RecentActivity: React.FC<RecentActivityProps> = ({ activities }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const dateInputRef = useRef<HTMLInputElement>(null);

    const [isExporting, setIsExporting] = useState(false);
    const itemsPerPage = 5;

    // Get unique activity types for filter
    const activityTypes = ['all', ...Array.from(new Set(activities.map(a => a.action)))];

    // Filter activities based on selected filter
    const filteredActivities = selectedFilter === 'all'
        ? activities
        : activities.filter(a => a.action === selectedFilter);

    // Calculate pagination based on filtered activities
    const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentActivities = filteredActivities.slice(startIndex, endIndex);

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const goToPage = (page: number) => {
        setCurrentPage(page);
    };

    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handleExportActivityLogs = async (date?: string) => {
        setIsExporting(true);
        try {
            // Use the passed date or fallback to selectedDate (though in new flow passed date is preferred)
            const exportDate = date || selectedDate;

            const response = await axios.post('/admin/reports/export-activity-logs', {
                date: exportDate
            }, {
                responseType: 'blob'
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            const dateSuffix = exportDate ? `-${exportDate}` : '';
            link.href = url;
            link.setAttribute('download', `activity-logs${dateSuffix}-${new Date().toISOString().split('T')[0]}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Error exporting activity logs:", error);
            alert("Failed to export activity logs. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="rounded-2xl shadow-lg p-6" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0.1) 100%)',
            backdropFilter: 'blur(40px) saturate(180%)',
            WebkitBackdropFilter: 'blur(40px) saturate(180%)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: '0 10px 40px 0 rgba(100, 116, 139, 0.15), inset 0 0 0 1px rgba(255, 255, 255, 0.2)'
        }}>
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <ActivityIcon className="w-6 h-6 text-green-500" />
                    <h2 className="text-xl font-semibold text-white/85">ACTIVITY LOGS</h2>

                    <div className="flex items-center gap-2 ml-4">
                        <input
                            ref={dateInputRef}
                            type="date"
                            onChange={(e) => {
                                const date = e.target.value;
                                setSelectedDate(date);
                                if (date) {
                                    handleExportActivityLogs(date);
                                }
                            }}
                            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none z-50"
                        />
                        <button
                            onClick={() => dateInputRef.current?.showPicker()}
                            disabled={isExporting}
                            className="bg-white/10 hover:bg-white/20 border border-white/20 px-3 py-1.5 rounded-lg transition-all duration-300 text-xs font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-white/80 hover:text-white"
                        >
                            {isExporting ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="w-3 h-3" />
                                    Export
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <span className="text-sm text-white/60 font-normal">
                    {filteredActivities.length} {filteredActivities.length === 1 ? 'log' : 'logs'}
                </span>
            </div>

            {/* Filter Dropdown */}
            <div className="mb-4 flex items-center gap-3">
                <Filter className="w-4 h-4 text-white/60" />
                <select
                    value={selectedFilter}
                    onChange={(e) => handleFilterChange(e.target.value)}
                    className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white/85 text-sm font-normal focus:outline-none focus:ring-2 focus:ring-green-500/50 hover:bg-white/20 transition-all duration-200"
                    style={{ backdropFilter: 'blur(10px)' }}
                >
                    {activityTypes.map((type) => (
                        <option key={type} value={type} className="bg-gray-800 text-white">
                            {type === 'all' ? 'All Activities' : type}
                        </option>
                    ))}
                </select>
            </div>

            <div className="space-y-3">
                {currentActivities.map((activity, index) => (
                    <div
                        key={startIndex + index}
                        className="flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 hover:shadow-lg transition-all duration-300"
                    >
                        <div className="w-2 h-2 mt-2 rounded-full bg-green-500 shadow-lg flex-shrink-0"></div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold text-white/85 mb-1">{activity.action}</p>
                                    {activity.document && (
                                        <p className="text-sm text-white/70 truncate mb-1 font-normal">{activity.document}</p>
                                    )}
                                    <p className="text-xs text-white/60 font-normal">by {activity.user}</p>
                                </div>
                                <span className="text-xs text-white/50 whitespace-nowrap font-normal">{activity.time}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                    <div className="text-sm text-white/70 font-normal">
                        Showing {startIndex + 1} to {Math.min(endIndex, filteredActivities.length)} of {filteredActivities.length}
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            aria-label="Previous page"
                        >
                            <ChevronLeft className="w-4 h-4 text-white/70" />
                        </button>

                        <div className="flex gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${currentPage === page
                                        ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                                        : 'bg-white/10 border border-white/20 text-white/70 hover:bg-white/20'
                                        }`}
                                >
                                    {page}
                                </button>
                            ))}
                        </div>

                        <button
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg bg-white/10 border border-white/20 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            aria-label="Next page"
                        >
                            <ChevronRight className="w-4 h-4 text-white/70" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecentActivity;
