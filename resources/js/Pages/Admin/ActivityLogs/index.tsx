import React, { useState, useRef } from "react";
import AdminLayout from "../../../../Layouts/AdminLayout";
import { usePage, router } from '@inertiajs/react';
import axios from "axios";
import ActivityLogsHeader from "./components/ActivityLogsHeader";
import ActivityLogsCard from "./components/ActivityLogsCard";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

interface Activity {
    action: string;
    document: string;
    user: string;
    time: string;
}

interface User {
    id: number;
    name: string;
    role: string;
}

interface ActivityLogsProps {
    activities: Activity[];
    users: User[];
    filters: {
        user_id: string;
    };
    [key: string]: any;
}

const ActivityLogs = () => {
    const { props } = usePage<ActivityLogsProps>();
    const activities = props.activities || [];
    const users = props.users || [];
    const initialUserId = props.filters?.user_id || 'all';

    const [currentPage, setCurrentPage] = useState(1);
    const [selectedFilter, setSelectedFilter] = useState<string>('all');
    const [selectedUser, setSelectedUser] = useState<string>(initialUserId);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const dateInputRef = useRef<HTMLInputElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

    const itemsPerPage = 10;

    // Get unique activity types for filter
    const activityTypes = ['all', ...Array.from(new Set(activities.map(a => a.action)))];

    // Filter activities based on selected filter (Type filter is client-side)
    const filteredActivities = selectedFilter === 'all'
        ? activities
        : activities.filter(a => a.action === selectedFilter);

    const handleFilterChange = (filter: string) => {
        setSelectedFilter(filter);
        setCurrentPage(1); // Reset to first page when filter changes
    };

    const handleUserFilterChange = (userId: string) => {
        setSelectedUser(userId);

        // Reload page with new user filter (Server-side filtering)
        router.get('/admin/activity-logs', {
            user_id: userId
        }, {
            preserveState: true,
            preserveScroll: true,
            only: ['activities', 'filters']
        });
    };

    const handlePrevPage = () => {
        setCurrentPage(prev => Math.max(prev - 1, 1));
    };

    const handleNextPage = () => {
        const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
        setCurrentPage(prev => Math.min(prev + 1, totalPages));
    };

    const handleGoToPage = (page: number) => {
        setCurrentPage(page);
    };

    const handleDateChange = (date: string) => {
        setSelectedDate(date);
    };

    const handleExportActivityLogs = async (startDate: string, endDate: string, format: 'pdf' | 'csv' | 'excel', userId?: string) => {
        setIsExporting(true);
        // Use userId from modal if present, otherwise fall back to page filter if it is not 'all', otherwise undefined
        const exportUserId = userId !== 'all' && userId ? userId : (selectedUser !== 'all' ? selectedUser : undefined);

        try {
            if (format === 'pdf') {
                // Open report in new window
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

                if (exportUserId) {
                    const userIdInput = document.createElement('input');
                    userIdInput.type = 'hidden';
                    userIdInput.name = 'userId';
                    userIdInput.value = exportUserId;
                    form.appendChild(userIdInput);
                }

                document.body.appendChild(form);
                form.submit();
                document.body.removeChild(form);
            } else {
                const response = await axios.post('/admin/reports/export-activity-logs', {
                    startDate,
                    endDate,
                    userId: exportUserId,
                    format: 'excel'
                }, {
                    responseType: 'blob'
                });

                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                const userSuffix = exportUserId ? `-user-${exportUserId}` : '';
                link.href = url;
                link.setAttribute('download', `activity-logs-${startDate}-to-${endDate}${userSuffix}.xlsx`);
                document.body.appendChild(link);
                link.click();
                link.remove();
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error("Error exporting activity logs:", error);
            alert("Failed to export activity logs. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className={`min-h-screen p-6 ${isDashboardThemeEnabled ? 'bg-transparent text-base-content' : ''}`}
            style={
                isDashboardThemeEnabled
                    ? undefined
                    : { background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)' }
            }
        >
            <ActivityLogsHeader
                dateInputRef={dateInputRef}
                selectedDate={selectedDate}
                isExporting={isExporting}
                onDateChange={handleDateChange}
                onExport={handleExportActivityLogs}
            />

            <div className="px-6 py-6">
                <ActivityLogsCard
                    activities={filteredActivities}
                    currentPage={currentPage}
                    itemsPerPage={itemsPerPage}
                    selectedFilter={selectedFilter}
                    selectedUser={selectedUser}
                    activityTypes={activityTypes}
                    users={users}
                    onFilterChange={handleFilterChange}
                    onUserFilterChange={handleUserFilterChange}
                    onPrevPage={handlePrevPage}
                    onNextPage={handleNextPage}
                    onGoToPage={handleGoToPage}
                />
            </div>
        </div>
    );
};

ActivityLogs.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);

export default ActivityLogs;
