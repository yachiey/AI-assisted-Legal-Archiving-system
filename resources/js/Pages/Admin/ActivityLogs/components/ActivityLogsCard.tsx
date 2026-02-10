import React from "react";
import { Activity as ActivityIcon, Filter, Clock } from "lucide-react";
import ActivityLogItem from "./ActivityLogItem";
import ActivityLogsPagination from "./ActivityLogsPagination";

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
    const totalPages = Math.ceil(activities.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentActivities = activities.slice(startIndex, endIndex);

    return (
        <div className="rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden" style={{
            background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)'
        }}>
            {/* Card Header */}
            <div className="p-6 border-b border-white/20">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <ActivityIcon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Recent Activities</h2>
                            <p className="text-sm font-medium" style={{ color: '#FBEC5D' }}>
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
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium focus:ring-2 focus:outline-none hover:bg-white/30 transition-all duration-300 border-none cursor-pointer"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white'
                                }}
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
                            <div className="hidden sm:block p-2 bg-white/20 rounded-lg">
                                <Filter className="w-4 h-4 text-white" />
                            </div>
                            <select
                                value={selectedFilter}
                                onChange={(e) => onFilterChange(e.target.value)}
                                className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/20 text-white text-sm font-medium focus:ring-2 focus:outline-none hover:bg-white/30 transition-all duration-300 border-none cursor-pointer"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white'
                                }}
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
            <div className="divide-y divide-white/10">
                {currentActivities.length === 0 ? (
                    <div className="p-12 text-center">
                        <Clock className="w-12 h-12 mx-auto mb-4 text-white/50" />
                        <h3 className="text-lg font-semibold text-white mb-2">No Activities Found</h3>
                        <p className="text-white/70 font-normal">
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
