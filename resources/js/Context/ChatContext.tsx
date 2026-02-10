import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ChatMessage, ChatSession } from '../Pages/Admin/Aiassistant/types';
import { apiService } from '../Pages/Admin/Aiassistant/services/api';

interface ChatContextType {
    isOpen: boolean;
    isMinimized: boolean;
    messages: ChatMessage[];
    isLoading: boolean;
    sessionId: string | null;
    toggleChat: () => void;
    minimizeChat: () => void;
    sendMessage: (message: string) => Promise<void>;
    resetChat: () => void;
    loadSession: (sessionId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};

interface ChatProviderProps {
    children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
    // Get current user for Namespacing
    const getCurrentUserId = () => {
        if (typeof window === 'undefined') return 'guest';
        try {
            const storedUser = sessionStorage.getItem("currentUser");
            if (storedUser) {
                const user = JSON.parse(storedUser);
                return user.id || user.user_id || 'guest';
            }
        } catch (e) {
            console.error("Error parsing user for chat context", e);
        }
        return 'guest';
    };

    const userId = getCurrentUserId();
    const STORAGE_PREFIX = `global_chat_${userId}_`;

    // State initialization with sessionStorage persistence
    const [isOpen, setIsOpen] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(`${STORAGE_PREFIX}isOpen`) === 'true';
        }
        return false;
    });

    const [isMinimized, setIsMinimized] = useState(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(`${STORAGE_PREFIX}isMinimized`) === 'true';
        }
        return true;
    });

    const [messages, setMessages] = useState<ChatMessage[]>(() => {
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem(`${STORAGE_PREFIX}messages`);
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });

    const [sessionId, setSessionId] = useState<string | null>(() => {
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem(`${STORAGE_PREFIX}sessionId`) || null;
        }
        return null;
    });

    const [isLoading, setIsLoading] = useState(false);

    // Persistence effects
    useEffect(() => {
        sessionStorage.setItem(`${STORAGE_PREFIX}isOpen`, String(isOpen));
    }, [isOpen, userId]);

    useEffect(() => {
        sessionStorage.setItem(`${STORAGE_PREFIX}isMinimized`, String(isMinimized));
    }, [isMinimized, userId]);

    useEffect(() => {
        if (messages.length > 0) {
            sessionStorage.setItem(`${STORAGE_PREFIX}messages`, JSON.stringify(messages));
        } else {
            sessionStorage.removeItem(`${STORAGE_PREFIX}messages`);
        }
    }, [messages, userId]);

    useEffect(() => {
        if (sessionId) {
            sessionStorage.setItem(`${STORAGE_PREFIX}sessionId`, sessionId);
        } else {
            sessionStorage.removeItem(`${STORAGE_PREFIX}sessionId`);
        }
    }, [sessionId, userId]);

    const toggleChat = () => {
        if (isMinimized || !isOpen) {
            setIsOpen(true);
            setIsMinimized(false);
        } else {
            setIsMinimized(!isMinimized);
        }
    };

    const minimizeChat = () => {
        setIsMinimized(true);
    };

    const resetChat = () => {
        setMessages([]);
        setSessionId(null);
        sessionStorage.removeItem(`${STORAGE_PREFIX}messages`);
        sessionStorage.removeItem(`${STORAGE_PREFIX}sessionId`);
    };

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim()) return;

        const userMessage: ChatMessage = {
            id: Date.now(),
            type: 'user',
            content: messageText,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // Use existing API service
            const aiResponse = await apiService.sendMessage(messageText, sessionId || undefined);

            if (!sessionId && aiResponse.session_id) {
                setSessionId(aiResponse.session_id);
            }

            setMessages(prev => [...prev, aiResponse]);
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString(),
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const loadSession = async (id: string) => {
        setIsLoading(true);
        try {
            const history = await apiService.getChatHistory(id);
            setMessages(history);
            setSessionId(id);
            setIsOpen(true);
            setIsMinimized(false);
        } catch (error) {
            console.error("Failed to load session", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <ChatContext.Provider
            value={{
                isOpen,
                isMinimized,
                messages,
                isLoading,
                sessionId,
                toggleChat,
                minimizeChat,
                sendMessage,
                resetChat,
                loadSession
            }}
        >
            {children}
        </ChatContext.Provider>
    );
};
