import React from "react";

interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string;
    subtitle: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, subtitle }) => {
    return (
        <div className="relative rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1 group p-4" style={{
            background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)'
        }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-black/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

            <div className="relative">
                <div className="flex items-start justify-between mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                        <div className="text-white">
                            {icon}
                        </div>
                    </div>
                </div>
                <h3 className="text-white/70 text-xs font-semibold mb-2 uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-bold text-white mb-1">{value}</p>
                <p className="text-sm font-medium" style={{ color: '#FBEC5D' }}>{subtitle}</p>
            </div>
        </div>
    );
};

export default StatCard;
