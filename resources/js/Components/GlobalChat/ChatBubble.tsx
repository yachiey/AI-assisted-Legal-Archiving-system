import React from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useChat } from '../../Context/ChatContext';

interface ChatBubbleProps {
    onPointerDown?: (e: React.PointerEvent) => void;
}

export const ChatBubble = ({ onPointerDown }: ChatBubbleProps) => {
    const { toggleChat, isOpen, isMinimized } = useChat();

    return (
        <button
            onPointerDown={onPointerDown}
            onClick={toggleChat}
            className={`p-4 rounded-full shadow-lg transition-all duration-300 z-[9999] 
        ${isOpen && !isMinimized
                    ? 'bg-gray-200 text-gray-800 rotate-90 scale-90'
                    : 'bg-green-600 text-white hover:bg-green-700 hover:scale-110 animate-bounce-subtle'
                }`}
            aria-label="Toggle AI Assistant"
            style={{ touchAction: 'none' }} // Prevent browser scrolling while dragging
        >
            {isOpen && !isMinimized ? (
                <X className="w-6 h-6" />
            ) : (
                <MessageCircle className="w-6 h-6" />
            )}
        </button>
    );
};
