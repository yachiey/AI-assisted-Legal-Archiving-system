import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface DocumentQueueNavigationProps {
    currentPosition: number;
    totalDocuments: number;
    isFirstDocument: boolean;
    isLastDocument: boolean;
    onPrevious: () => void;
    onNext: () => void;
    onSkipAll?: () => void;
    showSkipAll?: boolean;
    isDashboardThemeEnabled?: boolean;
}

/**
 * Navigation component for multi-document upload flow.
 * Shows current position and provides previous/next navigation buttons.
 */
const DocumentQueueNavigation: React.FC<DocumentQueueNavigationProps> = ({
    currentPosition,
    totalDocuments,
    isFirstDocument,
    isLastDocument,
    onPrevious,
    onNext,
    onSkipAll,
    showSkipAll = false,
    isDashboardThemeEnabled = false,
}) => {
    if (totalDocuments <= 1) return null;

    return (
        <div
            className={`mb-6 rounded-xl p-4 ${
                isDashboardThemeEnabled
                    ? "border border-base-300 bg-base-100 shadow-lg shadow-base-content/5"
                    : "border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50"
            }`}
        >
            <div className="flex items-center justify-between">
                {/* Progress indicator */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        {Array.from({ length: totalDocuments }, (_, i) => (
                            <div
                                key={i}
                                className={`h-2.5 w-2.5 rounded-full transition-all duration-300 ${
                                    i < currentPosition
                                        ? isDashboardThemeEnabled
                                            ? "bg-primary"
                                            : "bg-[#228B22]"
                                        : i === currentPosition - 1
                                          ? isDashboardThemeEnabled
                                              ? "bg-primary ring-2 ring-primary/30"
                                              : "bg-[#228B22] ring-2 ring-green-300"
                                          : isDashboardThemeEnabled
                                            ? "bg-base-300"
                                            : "bg-gray-300"
                                }`}
                            />
                        ))}
                    </div>
                    <span
                        className={`text-sm font-semibold ${
                            isDashboardThemeEnabled
                                ? "text-base-content"
                                : "text-gray-700"
                        }`}
                    >
                        Document {currentPosition} of {totalDocuments}
                    </span>
                </div>

                {/* Navigation buttons */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={onPrevious}
                        disabled={isFirstDocument}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isFirstDocument
                                ? isDashboardThemeEnabled
                                    ? "cursor-not-allowed bg-base-200 text-base-content/35"
                                    : "cursor-not-allowed bg-gray-100 text-gray-400"
                                : isDashboardThemeEnabled
                                  ? "border border-base-300 bg-base-100 text-base-content shadow-sm hover:bg-base-200"
                                  : "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                        }`}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Previous
                    </button>

                    <button
                        onClick={onNext}
                        disabled={isLastDocument}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            isLastDocument
                                ? isDashboardThemeEnabled
                                    ? "cursor-not-allowed bg-base-200 text-base-content/35"
                                    : "cursor-not-allowed bg-gray-100 text-gray-400"
                                : isDashboardThemeEnabled
                                  ? "border border-base-300 bg-base-100 text-base-content shadow-sm hover:bg-base-200"
                                  : "border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50"
                        }`}
                    >
                        Next
                        <ChevronRight className="w-4 h-4" />
                    </button>

                    {showSkipAll && onSkipAll && !isLastDocument && (
                        <button
                            onClick={onSkipAll}
                            className={`ml-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 ${
                                isDashboardThemeEnabled
                                    ? "border-error/30 text-error hover:bg-error/10"
                                    : "border-red-200 text-red-600 hover:bg-red-50"
                            }`}
                        >
                            Cancel All Remaining
                        </button>
                    )}
                </div>
            </div>

            {/* Remaining documents info */}
            {!isLastDocument && (
                <div
                    className={`mt-3 text-xs ${
                        isDashboardThemeEnabled
                            ? "text-base-content/55"
                            : "text-gray-500"
                    }`}
                >
                    {totalDocuments - currentPosition} document{totalDocuments - currentPosition !== 1 ? 's' : ''} remaining after this one
                </div>
            )}
        </div>
    );
};

export default DocumentQueueNavigation;
