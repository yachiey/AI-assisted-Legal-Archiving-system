import React from "react";
import { Users, UserPlus } from "lucide-react";

interface AccountHeaderProps {
    totalUsers: number;
    activeUsers: number;
    onAddUserClick: () => void;
}

const AccountHeader: React.FC<AccountHeaderProps> = ({
    totalUsers,
    activeUsers,
    onAddUserClick,
}) => {
    return (
        <div className="mb-8">
            <div className="mb-8 rounded-2xl p-6 shadow-lg border border-green-700/20" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                {/* Title and Action */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black text-white mb-2 tracking-tight flex items-center gap-3">
                            <Users className="w-8 h-8 text-yellow-400" />
                            ACCOUNT MANAGEMENT
                        </h1>
                        <div className="h-1 w-48 bg-gradient-to-r from-yellow-400 to-transparent rounded-full mb-3"></div>
                        <p className="text-lg text-green-50 font-medium tracking-wide">Manage users, roles, and permissions</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={onAddUserClick}
                            className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border-2 border-white/30 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-sm hover:shadow-lg backdrop-blur-sm group"
                        >
                            <UserPlus className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                            Add Account
                        </button>
                    </div>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Total Users */}
                <div className="rounded-2xl p-6 border border-green-700/30 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-1">Total Users</p>
                            <p className="text-4xl font-bold text-white">{totalUsers}</p>
                        </div>
                        <div className="p-4 bg-white/20 rounded-xl">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                    </div>
                </div>

                {/* Active Users */}
                <div className="rounded-2xl p-6 border border-yellow-700/30 shadow-md"
                    style={{ background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-gray-800 text-sm font-medium mb-1">Active Users</p>
                            <p className="text-4xl font-bold text-gray-900">{activeUsers}</p>
                        </div>
                        <div className="p-4 bg-white/30 rounded-xl">
                            <Users className="w-8 h-8 text-gray-900" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountHeader;
