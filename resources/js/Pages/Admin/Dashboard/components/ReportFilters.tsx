import React, { useState, useEffect } from "react";
import { Filter } from "lucide-react";
import axios from 'axios';

interface Folder {
    folder_id: number;
    folder_name: string;
}

interface ReportFiltersProps {
    selectedPeriod: 'week' | 'month' | 'year';
    selectedCategory: string;
    onPeriodChange: (period: 'week' | 'month' | 'year') => void;
    onCategoryChange: (category: string) => void;
}

const ReportFilters: React.FC<ReportFiltersProps> = ({
    selectedPeriod,
    selectedCategory,
    onPeriodChange,
    onCategoryChange
}) => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFolders = async () => {
            try {
                const response = await axios.get('/api/manual-process/folders', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                        'Accept': 'application/json'
                    }
                });
                setFolders(response.data);
            } catch (error) {
                console.error('Error fetching folders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFolders();
    }, []);

    return (
        <div className="rounded-3xl shadow-lg border border-green-100/50 overflow-hidden p-6" style={{
            background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)'
        }}>
            <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-3 text-white">
                    <div className="p-2 bg-white/20 rounded-lg">
                        <Filter className="w-5 h-5" />
                    </div>
                    <h2 className="text-xl font-semibold uppercase tracking-tight">FILTERS:</h2>
                </div>

                <div className="flex gap-2">
                    {(['week', 'month', 'year'] as const).map((period) => (
                        <button
                            key={period}
                            onClick={() => onPeriodChange(period)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-300 uppercase tracking-wider ${selectedPeriod === period
                                    ? 'text-gray-900 shadow-xl scale-105'
                                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                                }`}
                            style={selectedPeriod === period ? {
                                background: 'linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)',
                            } : {}}
                        >
                            {period}
                        </button>
                    ))}
                </div>

                <div className="flex-1 min-w-[200px]">
                    <select
                        value={selectedCategory}
                        onChange={(e) => onCategoryChange(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-white/10 text-white text-sm font-semibold focus:ring-2 focus:ring-[#FBEC5D] focus:outline-none hover:bg-white/20 transition-all duration-300 border-none cursor-pointer"
                        disabled={loading}
                        style={{
                            color: 'white'
                        }}
                    >
                        <option value="all" style={{ color: '#1f2937', background: 'white' }}>ALL FOLDERS</option>
                        {folders.map((folder) => (
                            <option key={folder.folder_id} value={folder.folder_id.toString()} style={{ color: '#1f2937', background: 'white' }}>
                                {folder.folder_name.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ReportFilters;
