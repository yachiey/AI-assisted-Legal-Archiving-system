import React from "react";
import { PieChart, ChevronLeft, ChevronRight } from "lucide-react";

interface CategoryData {
    category: string;
    count: number;
    percentage: number;
}

interface PaginationData {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
}

interface CategoryChartProps {
    data: CategoryData[];
    pagination?: PaginationData;
    onPageChange?: (page: number) => void;
}

const CategoryChart: React.FC<CategoryChartProps> = ({ data, pagination, onPageChange }) => {
    // Ensure data is always an array
    const folderData = Array.isArray(data) ? data : [];

    return (
        <div className="rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 p-6" style={{
            background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)'
        }}>
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-white/20 rounded-lg">
                    <PieChart className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">DOCUMENTS BY FOLDER</h2>
            </div>

            {folderData.length === 0 ? (
                <div className="text-center py-8 text-white/70">
                    <p className="font-normal">No folders with documents</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {folderData.map((item, index) => (
                        <div key={index} className="group">
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-semibold text-white">{item.category}</span>
                                <span className="font-medium" style={{ color: '#FBEC5D' }}>{item.count} docs</span>
                            </div>
                            <div className="relative h-3 bg-white/20 rounded-full overflow-hidden">
                                <div
                                    className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 shadow-lg"
                                    style={{
                                        width: `${item.percentage}%`,
                                        background: 'linear-gradient(90deg, #FBEC5D 0%, #f5e042 100%)'
                                    }}
                                >
                                </div>
                            </div>
                            <div className="text-xs text-white/80 mt-1 font-medium">{item.percentage.toFixed(1)}%</div>
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination Controls */}
            {pagination && pagination.last_page > 1 && onPageChange && (
                <div className="mt-6 pt-4 border-t border-white/20">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-white/80 font-normal">
                            Showing {pagination.from} to {pagination.to} of {pagination.total} folders
                        </p>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onPageChange(pagination.current_page - 1)}
                                disabled={pagination.current_page === 1}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-white"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-sm text-white font-medium">
                                Page {pagination.current_page} of {pagination.last_page}
                            </span>
                            <button
                                onClick={() => onPageChange(pagination.current_page + 1)}
                                disabled={pagination.current_page === pagination.last_page}
                                className="p-2 rounded-lg bg-white/20 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-white"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryChart;
