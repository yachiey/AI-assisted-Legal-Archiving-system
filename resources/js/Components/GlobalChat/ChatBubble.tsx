import React from 'react';
import { usePage } from '@inertiajs/react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '../../Context/ChatContext';
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from '../../hooks/useDashboardTheme';

interface ChatBubbleProps {
    onPointerDown?: (e: React.PointerEvent) => void;
}

export const ChatBubble = ({ onPointerDown }: ChatBubbleProps) => {
    const { toggleChat, isOpen, isMinimized } = useChat();
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    const closedBubbleClass = isDashboardThemeEnabled
        ? 'bg-primary text-primary-content shadow-xl shadow-primary/25 hover:bg-secondary hover:scale-110 animate-bounce-subtle'
        : 'bg-green-600 text-white hover:bg-green-700 hover:scale-110 animate-bounce-subtle';

    const openBubbleClass = isDashboardThemeEnabled
        ? 'bg-base-300 text-base-content shadow-lg shadow-base-content/10 rotate-90 scale-90'
        : 'bg-gray-200 text-gray-800 rotate-90 scale-90';

    return (
        <button
            onPointerDown={onPointerDown}
            onClick={toggleChat}
            className={`z-[9999] rounded-full p-4 shadow-lg transition-all duration-300 ${
                isOpen && !isMinimized ? openBubbleClass : closedBubbleClass
            }`}
            aria-label="Toggle AI Assistant"
            style={{ touchAction: 'none' }}
        >
            {isOpen && !isMinimized ? (
                <X className="h-6 w-6" />
            ) : (
                <MessageCircle className="h-6 w-6" />
            )}
        </button>
    );
};
