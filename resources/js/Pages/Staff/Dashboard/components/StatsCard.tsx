import { FC } from 'react';
import { MoreVertical } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    change?: string;
    icon: React.ReactNode;
}

const StatsCard: FC<StatsCardProps> = ({ title, value, change, icon }) => {
    const isPositive = change?.includes('+') || change?.includes('▲');

    return (
        <div
            className="rounded-xl shadow-md p-6 hover:shadow-lg transition-all hover:scale-105"
            style={{
                background: 'linear-gradient(135deg, #ffc600 0%, #F4D03F 100%)'
            }}
        >
            <div className="flex items-start justify-between mb-4">
                <div className="p-2 bg-black/10 rounded-lg backdrop-blur-sm">
                    {icon}
                </div>
                <button className="text-gray-700/80 hover:text-gray-900 transition-colors">
                    <MoreVertical className="w-5 h-5" />
                </button>
            </div>
            <div>
                <p className="text-sm font-medium text-gray-800 mb-1 uppercase tracking-wide">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mb-2">{value}</p>
                {change && (
                    <p className={`text-sm mt-2 font-semibold ${
                        isPositive ? 'text-green-700' : 'text-red-700'
                    }`}>
                        {change}
                    </p>
                )}
            </div>
        </div>
    );
};

export default StatsCard;
