import React, { useState, useRef, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { Send, Minimize2, X, Bot, User, Maximize2, RefreshCw, FileText, Eye } from 'lucide-react';
import { useChat } from '../../Context/ChatContext';
import DocumentViewer from '../../Pages/Admin/Document/components/DocumentViewer/DocumentViewer';
import { Document as FullDocument } from '../../Pages/Admin/Document/types/types';

export const ChatPanel = () => {
    const {
        messages,
        sendMessage,
        isLoading,
        toggleChat,
        minimizeChat,
        resetChat
    } = useChat();

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Document viewer state
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<FullDocument | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const message = input;
        setInput('');
        await sendMessage(message);
    };

    const handleNewChat = () => {
        resetChat();
    };

    const handleViewDocument = async (docId: number) => {
        try {
            const response = await fetch(`/api/documents/${docId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const responseData = await response.json();
                setSelectedDocument(responseData.success ? responseData.data : responseData);
                setIsViewerOpen(true);
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        }
    };

    const handleNavigateToDocument = (doc: any) => {
        const params: Record<string, string> = { from: 'ai' };
        if (doc.folder_id) {
            params.folder = String(doc.folder_id);
        }
        if (doc.doc_id) {
            params.highlight = String(doc.doc_id);
        }

        // Get user role to navigate to the correct documents page
        const storedUser = sessionStorage.getItem("currentUser");
        let role = 'admin';
        if (storedUser) {
            try {
                role = (JSON.parse(storedUser).role || 'admin').toLowerCase();
            } catch (e) { }
        }

        const basePath = role === 'staff' ? '/staff/documents' : '/admin/documents';
        router.visit(basePath, { data: params });
        toggleChat();
    };

    const handleFullscreen = () => {
        // Get user role
        const storedUser = sessionStorage.getItem("currentUser");
        let role = 'admin';
        let parsed: any = {};

        if (storedUser) {
            try {
                const userObj = JSON.parse(storedUser);
                parsed = userObj;
                role = (userObj.role || 'admin').toLowerCase();
            } catch (e) {
                console.error("Error parsing user data for navigation", e);
            }
        }

        // Sync state to the target page's expected keys
        const userId = parsed.id || parsed.user_id || 'guest';
        const storagePrefix = `global_chat_${userId}_`;

        const globalMessages = sessionStorage.getItem(`${storagePrefix}messages`);
        const globalSessionId = sessionStorage.getItem(`${storagePrefix}sessionId`);

        if (role === 'staff') {
            // Staff/AIAssistant/index.tsx uses 'ai_chatMessages' and 'ai_selectedSessionId'
            if (globalMessages) sessionStorage.setItem('ai_chatMessages', globalMessages);
            if (globalSessionId) sessionStorage.setItem('ai_selectedSessionId', globalSessionId);
            router.visit('/staff/ai-assistant');
        } else {
            // Admin/Aiassistant/index.tsx uses 'admin_ai_chatMessages' and 'admin_ai_selectedSessionId'
            if (globalMessages) sessionStorage.setItem('admin_ai_chatMessages', globalMessages);
            if (globalSessionId) sessionStorage.setItem('admin_ai_selectedSessionId', globalSessionId);
            router.visit('/admin/ai-assistant');
        }

        toggleChat(); // Close the bubble when moving to full page
    };

    return (
        <div className="w-96 h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-700 to-green-600 p-4 flex items-center justify-between text-white shrink-0 cursor-default" onPointerDown={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-white/20 rounded-lg">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">AI Assistant</h3>
                        <p className="text-xs text-green-100 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-300 rounded-full animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleNewChat}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="New Chat"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        onClick={handleFullscreen}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Full Screen"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>

                    <button
                        onClick={toggleChat}
                        className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-6 space-y-3">
                        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                            <Bot className="w-8 h-8 text-green-600" />
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">How can I help you today?</p>
                            <p className="text-sm mt-1">Ask me anything about your documents or the application.</p>
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex gap-2 max-w-[85%] ${msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <div
                                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm
                  ${msg.type === 'user' ? 'bg-gray-100' : 'bg-green-100'}`}
                            >
                                {msg.type === 'user' ? (
                                    <User className="w-3.5 h-3.5 text-gray-600" />
                                ) : (
                                    <Bot className="w-3.5 h-3.5 text-green-600" />
                                )}
                            </div>

                            <div className={`min-w-0 flex-1 flex flex-col ${msg.type === 'user' ? 'items-end' : 'items-start'}`}>
                                <div
                                    className={`p-2.5 rounded-2xl text-[13px] shadow-sm w-full overflow-hidden
                    ${msg.type === 'user'
                                            ? 'bg-gray-900 text-white rounded-tr-none'
                                            : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}`}
                                >
                                    <p className="whitespace-pre-wrap break-words" style={{ overflowWrap: 'anywhere' }}>{msg.content}</p>

                                    {/* Document Reference Cards */}
                                    {msg.type !== 'user' && msg.documents && msg.documents.length > 0 && (
                                        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1 overflow-hidden">
                                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
                                                📎 References
                                            </p>
                                            {msg.documents.map((doc) => (
                                                <div
                                                    key={doc.doc_id}
                                                    className="flex items-center gap-1 px-1.5 py-1 bg-green-50 rounded border border-green-200 text-[11px] overflow-hidden"
                                                >
                                                    <button
                                                        onClick={() => handleNavigateToDocument(doc)}
                                                        className="flex-shrink-0 p-0.5 hover:bg-green-200 rounded transition-colors text-green-700"
                                                        title="Go to document location"
                                                    >
                                                        <FileText size={11} />
                                                    </button>
                                                    <span className="truncate flex-1 min-w-0 font-medium text-green-800 text-left">
                                                        {doc.title}
                                                    </span>
                                                    <button
                                                        onClick={() => handleViewDocument(doc.doc_id)}
                                                        className="p-0.5 rounded bg-green-600 hover:bg-green-700 text-white transition-colors flex-shrink-0"
                                                        title={`View "${doc.title}"`}
                                                    >
                                                        <Eye size={10} />
                                                    </button>
                                                </div>
                                            ))}
                                            {msg.more_documents_count && msg.more_documents_count > 0 && (
                                                <p className="text-[10px] italic text-gray-400">
                                                    ...and {msg.more_documents_count} more
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-400 px-1 mt-0.5">
                                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex gap-3 max-w-[85%]">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                                <Bot className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="bg-white border border-gray-100 p-4 rounded-2xl rounded-tl-none shadow-sm">
                                <div className="flex gap-1.5">
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-bounce"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 shrink-0">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 py-2.5 px-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                        disabled={isLoading}
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>
            </form>
            {/* Document Viewer Modal (portal - renders above everything) */}
            <DocumentViewer
                isOpen={isViewerOpen}
                onClose={() => {
                    setIsViewerOpen(false);
                    setSelectedDocument(null);
                }}
                document={selectedDocument}
            />
        </div>
    );
};
