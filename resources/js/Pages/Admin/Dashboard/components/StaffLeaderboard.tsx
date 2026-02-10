import React from 'react';
import { Users, Trophy, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface StaffMember {
    name: string;
    count: number;
    first_letter: string;
    profile_picture?: string;
    role: string;
}

interface PaginationData {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

interface StaffLeaderboardProps {
    data: StaffMember[];
    pagination?: PaginationData;
    onPageChange?: (page: number) => void;
}

const StaffLeaderboard: React.FC<StaffLeaderboardProps> = ({ data, pagination, onPageChange }) => {
    return (
        <div className="rounded-3xl shadow-lg border border-green-100/50 overflow-hidden group transform hover:shadow-2xl transition-all duration-500"
            style={{ background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)' }}>

            {/* Header */}
            <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                        <Users className="w-5 h-5 text-[#FBEC5D]" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-white tracking-tight uppercase">Staff Productivity</h3>
                        <p className="text-[0.65rem] text-white/70 font-medium uppercase tracking-wider">Top Uploaders</p>
                    </div>
                </div>
                <Trophy className="w-5 h-5 text-[#FBEC5D] opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500" />
            </div>

            {/* Content */}
            <div className="px-6 pb-6 space-y-4">
                {data.length === 0 ? (
                    <div className="py-8 text-center text-white/60 text-sm font-medium">
                        No activity recorded yet
                    </div>
                ) : (
                    data.map((staff, index) => (
                        <div key={index} className="flex items-center justify-between group/item">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-xs font-black text-white group-hover/item:bg-[#FBEC5D] group-hover/item:text-gray-900 transition-colors duration-300 overflow-hidden">
                                    {staff.profile_picture ? (
                                        <img
                                            src={staff.profile_picture.startsWith('http') ? staff.profile_picture : `/storage/${staff.profile_picture}`}
                                            alt={staff.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        staff.first_letter
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white leading-none mb-1">{staff.name}</p>
                                    <p className="text-[0.65rem] text-white/50 font-medium">{staff.role}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="flex items-center gap-1.5 justify-end">
                                    <span className="text-sm font-black text-[#FBEC5D]">{staff.count}</span>
                                    <TrendingUp className="w-3 h-3 text-[#FBEC5D]" />
                                </div>
                                <p className="text-[0.6rem] text-white/40 font-bold uppercase tracking-tighter">Documents</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Pagination Controls */}
            {pagination && pagination.last_page > 1 && onPageChange && (
                <div className="px-6 pb-6 pt-2 border-t border-white/10 mx-6 mt-2">
                    <div className="flex items-center justify-between">
                        <p className="text-[0.65rem] text-white/60 font-medium">
                            {pagination.from}-{pagination.to} of {pagination.total} staff
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onPageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-white"
                            >
                                <ChevronLeft className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-[0.65rem] text-white font-bold">
                                {pagination.current_page}/{pagination.last_page}
                            </span>
                            <button
                                onClick={() => onPageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200 text-white"
                            >
                                <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Decorative Shine */}
            <div className="h-1 w-full bg-gradient-to-r from-transparent via-[#FBEC5D]/30 to-transparent"></div>
        </div>
    );
};

export default StaffLeaderboard;
