import React from 'react';
import { createPortal } from 'react-dom';
import { Brain, Loader2, FileText, Database } from 'lucide-react';

interface ProcessingModalProps {
    isOpen: boolean;
    step: 'extracting' | 'analyzing' | 'processing';
    details?: string;
    theme?: string;
    isDashboardThemeEnabled?: boolean;
}

const ProcessingModal: React.FC<ProcessingModalProps> = ({
    isOpen,
    step,
    details,
    theme,
    isDashboardThemeEnabled = false,
}) => {
    if (!isOpen) return null;

    const getStepInfo = () => {
        switch (step) {
            case 'extracting':
                return {
                    title: 'Extracting & Embedding',
                    description: 'Extracting text from document and generating vector embeddings...',
                    icon: <Database className="w-10 h-10 text-blue-500 animate-pulse" />,
                    colorAttributes: {
                        bg: 'bg-blue-50',
                        border: 'border-blue-100',
                        text: 'text-blue-600',
                        loader: 'text-blue-500'
                    }
                };
            case 'analyzing':
            case 'processing':
                return {
                    title: 'AI Analysis in Progress',
                    description: 'Analyzing content, categorizing, and generating smart suggestions...',
                    icon: <Brain className="w-10 h-10 text-green-500 animate-pulse" />,
                    colorAttributes: {
                        bg: 'bg-green-50',
                        border: 'border-green-100',
                        text: 'text-green-600',
                        loader: 'text-green-500'
                    }
                };
            default:
                return {
                    title: 'Processing...',
                    description: 'Please wait while we process your document.',
                    icon: <Loader2 className="w-10 h-10 text-gray-500 animate-spin" />,
                    colorAttributes: {
                        bg: 'bg-gray-50',
                        border: 'border-gray-100',
                        text: 'text-gray-600',
                        loader: 'text-gray-500'
                    }
                };
        }
    };

    const info = getStepInfo();

    const modalContent = (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/40 backdrop-blur-[4px]"
            style={{ margin: 0, padding: 0 }}
        >
            <div
                className={`mx-4 w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl backdrop-blur-xl ${
                    isDashboardThemeEnabled
                        ? 'border border-base-300 bg-base-100/95 text-base-content'
                        : 'border border-white/20 bg-white/95'
                }`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Animated Header Background */}
                <div
                    className={`h-2 w-full animate-pulse ${
                        step === 'extracting'
                            ? isDashboardThemeEnabled
                                ? 'bg-info'
                                : 'bg-blue-500'
                            : isDashboardThemeEnabled
                              ? 'bg-primary'
                              : 'bg-green-500'
                    }`}
                ></div>

                <div className="p-10 text-center">
                    {/* Main Icon Container */}
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        {/* Outer Ring */}
                        <div className={`absolute inset-0 border-4 ${info.colorAttributes.border} rounded-full`}></div>
                        {/* Spinning Ring */}
                        <div className={`absolute inset-0 border-4 ${info.colorAttributes.loader.replace('text-', 'border-')} border-t-transparent rounded-full animate-spin`}></div>
                        {/* Icon */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            {info.icon}
                        </div>
                    </div>

                    <h3
                        className={`mb-3 text-2xl font-bold tracking-tight ${
                            isDashboardThemeEnabled
                                ? 'text-base-content'
                                : 'text-gray-900'
                        }`}
                    >
                        {info.title}
                    </h3>

                    <p
                        className={`mx-auto mb-8 max-w-xs leading-relaxed ${
                            isDashboardThemeEnabled
                                ? 'text-base-content/65'
                                : 'text-gray-600'
                        }`}
                    >
                        {info.description}
                    </p>

                    {/* Detailed Status (Optional) */}
                    {details && (
                        <div
                            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 ${
                                isDashboardThemeEnabled
                                    ? step === 'extracting'
                                        ? 'border-info/20 bg-info/10'
                                        : 'border-primary/20 bg-primary/10'
                                    : `${info.colorAttributes.bg} ${info.colorAttributes.border}`
                            }`}
                        >
                            <Loader2 className={`w-3 h-3 ${info.colorAttributes.text} animate-spin`} />
                            <span className={`text-xs font-semibold ${info.colorAttributes.text} uppercase tracking-wide`}>
                                {details}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof window !== 'undefined' && window.document?.body) {
        return createPortal(modalContent, window.document.body);
    }

    return null;
};

export default ProcessingModal;
