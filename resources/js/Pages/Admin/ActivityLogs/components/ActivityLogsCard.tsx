import React from "react";
import { Activity as ActivityIcon, Filter, Clock } from "lucide-react";
import ActivityLogItem from "./ActivityLogItem";
import ActivityLogsPagination from "./ActivityLogsPagination";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

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

interface ActivityLogsCardProps {
    activities: Activity[];
    currentPage: number;
    itemsPerPage: number;
    selectedFilter: string;
    selectedUser: string;
    activityTypes: string[];
    users: User[];
    onFilterChange: (filter: string) => void;
    onUserFilterChange: (userId: string) => void;
    onPrevPage: () => void;
    onNextPage: () => void;
    onGoToPage: (page: number) => void;
}

const ActivityLogsCard: React.FC<ActivityLogsCardProps> = ({
    activities,
    currentPage,
    itemsPerPage,
    selectedFilter,
    selectedUser,
    activityTypes,
    users = [],
    onFilterChange,
    onUserFilterChange,
    onPrevPage,
    onNextPage,
    onGoToPage,
}) => {
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
    const totalPages = Math.ceil(activities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentActivities = activities.slice(startIndex, endIndex);

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className={`overflow-hidden rounded-3xl transition-all duration-500 ${
                isDashboardThemeEnabled
                    ? 'border border-base-300 bg-base-100 shadow-2xl shadow-base-content/5 hover:shadow-2xl hover:shadow-primary/10'
                    : 'shadow-md hover:shadow-2xl'
            }`}
            style={
                isDashboardThemeEnabled
                    ? undefined
                    : { background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)' }
            }
        >
            {/* Card Header */}
            <div className={`p-6 border-b ${
                isDashboardThemeEnabled ? 'border-base-300' : 'border-white/20'
            }`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`rounded-lg p-2 ${
                            isDashboardThemeEnabled ? 'bg-primary/10' : 'bg-white/20'
                        }`}>
                            <ActivityIcon className={`w-6 h-6 ${
                                isDashboardThemeEnabled ? 'text-primary' : 'text-white'
                            }`} />
                        </div>
                        <div>
                            <h2 className={`text-xl font-bold ${
                                isDashboardThemeEnabled ? 'text-base-content' : 'text-white'
                            }`}>Recent Activities</h2>
                            <p
                                className={`text-sm font-medium ${
                                    isDashboardThemeEnabled ? 'text-primary' : ''
                                }`}
                                style={isDashboardThemeEnabled ? undefined : { color: '#FBEC5D' }}
                            >
                                {activities.length} {activities.length === 1 ? 'log' : 'logs'}
                            </p>
                        </div>
                    </div>

                    {/* Filters Container */}
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        {/* User Filter Dropdown */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={selectedUser}
                                onChange={(e) => onUserFilterChange(e.target.value)}
                                className={`w-full cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 sm:w-auto ${
                                    isDashboardThemeEnabled
                                        ? 'border border-base-300 bg-base-100 text-base-content hover:bg-base-200 focus:ring-primary/20'
                                        : 'border-none bg-white/20 text-white hover:bg-white/30'
                                }`}
                                style={
                                    isDashboardThemeEnabled
                                        ? undefined
                                        : { background: 'rgba(255, 255, 255, 0.2)', color: 'white' }
                                }
                            >
                                <option value="all" style={{ color: '#1f2937' }}>All Users</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id} style={{ color: '#1f2937' }}>
                                        {user.name} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Activity Type Filter Dropdown */}
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <div className={`hidden rounded-lg p-2 sm:block ${
                                isDashboardThemeEnabled ? 'bg-base-200' : 'bg-white/20'
                            }`}>
                                <Filter className={`w-4 h-4 ${
                                    isDashboardThemeEnabled ? 'text-base-content/70' : 'text-white'
                                }`} />
                            </div>
                            <select
                                value={selectedFilter}
                                onChange={(e) => onFilterChange(e.target.value)}
                                className={`w-full cursor-pointer rounded-xl px-4 py-2 text-sm font-medium transition-all duration-300 focus:outline-none focus:ring-2 sm:w-auto ${
                                    isDashboardThemeEnabled
                                        ? 'border border-base-300 bg-base-100 text-base-content hover:bg-base-200 focus:ring-primary/20'
                                        : 'border-none bg-white/20 text-white hover:bg-white/30'
                                }`}
                                style={
                                    isDashboardThemeEnabled
                                        ? undefined
                                        : { background: 'rgba(255, 255, 255, 0.2)', color: 'white' }
                                }
                            >
                                {activityTypes.map((type) => (
                                    <option key={type} value={type} style={{ color: '#1f2937', background: 'white' }}>
                                        {type === 'all' ? 'All Activities' : type}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Activity List */}
            <div className={`divide-y ${
                isDashboardThemeEnabled ? 'divide-base-300/70' : 'divide-white/10'
            }`}>
                {currentActivities.length === 0 ? (
                    <div className="p-12 text-center">
                        <Clock className={`mx-auto mb-4 w-12 h-12 ${
                            isDashboardThemeEnabled ? 'text-base-content/35' : 'text-white/50'
                        }`} />
                        <h3 className={`mb-2 text-lg font-semibold ${
                            isDashboardThemeEnabled ? 'text-base-content' : 'text-white'
                        }`}>No Activities Found</h3>
                        <p className={`font-normal ${
                            isDashboardThemeEnabled ? 'text-base-content/65' : 'text-white/70'
                        }`}>
                            {selectedFilter !== 'all' || selectedUser !== 'all'
                                ? 'No activities match the current filters.'
                                : 'No activity logs available at this time.'}
                        </p>
                    </div>
                ) : (
                    currentActivities.map((activity, index) => (
                        <ActivityLogItem
                            key={startIndex + index}
                            activity={activity}
                        />
                    ))
                )}
            </div>

            {/* Pagination */}
            <ActivityLogsPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={activities.length}
                startIndex={startIndex}
                endIndex={endIndex}
                onPrevPage={onPrevPage}
                onNextPage={onNextPage}
                onGoToPage={onGoToPage}
            />
        </div>
    );
};

export default ActivityLogsCard;
