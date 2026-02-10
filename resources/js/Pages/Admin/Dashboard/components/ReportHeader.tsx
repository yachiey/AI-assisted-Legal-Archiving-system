import React from "react";
import { BarChart3 } from "lucide-react";

interface ReportHeaderProps {
    // No props needed for now
}

const ReportHeader: React.FC<ReportHeaderProps> = () => {
    return (
        <div className="w-full shadow-lg rounded-b-3xl mb-6" style={{
            background: 'linear-gradient(135deg, #228B22 0%, #1a6e1eff 100%)'
        }}>
            <div className="px-8 py-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3" style={{ color: '#FBEC5D' }}>
                            <BarChart3 className="w-8 h-8" />
                            DOCUMENT REPORTS & ANALYTICS
                        </h1>
                        <p className="text-white/90 text-sm font-normal">
                            Comprehensive insights into your legal document management system
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReportHeader;
