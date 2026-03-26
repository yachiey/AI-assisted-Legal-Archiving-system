import React, { useState, useRef, useEffect } from 'react';
import { router, usePage } from '@inertiajs/react';
import {
    Send,
    X,
    Bot,
    User,
    Maximize2,
    RefreshCw,
    FileText,
    Eye,
} from 'lucide-react';
import { useChat } from '../../Context/ChatContext';
import DocumentViewer from '../../Pages/Admin/Document/components/DocumentViewer/DocumentViewer';
import { Document as FullDocument } from '../../Pages/Admin/Document/types/types';
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from '../../hooks/useDashboardTheme';

export const ChatPanel = () => {
    const { messages, sendMessage, isLoading, toggleChat, resetChat } = useChat();
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    const [input, setInput] = useState('');
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<FullDocument | null>(
        null
    );

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
                    Authorization: `Bearer ${localStorage.getItem('auth_token')}`,
                    Accept: 'application/json',
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

        const storedUser = sessionStorage.getItem('currentUser');
        let role = 'admin';
        if (storedUser) {
            try {
                role = (JSON.parse(storedUser).role || 'admin').toLowerCase();
            } catch (e) {
                console.error('Error parsing user data for navigation', e);
            }
        }

        const basePath = role === 'staff' ? '/staff/documents' : '/admin/documents';
        router.visit(basePath, { data: params });
        toggleChat();
    };

    const handleFullscreen = () => {
        const storedUser = sessionStorage.getItem('currentUser');
        let role = 'admin';
        let parsed: any = {};

        if (storedUser) {
            try {
                const userObj = JSON.parse(storedUser);
                parsed = userObj;
                role = (userObj.role || 'admin').toLowerCase();
            } catch (e) {
                console.error('Error parsing user data for navigation', e);
            }
        }

        const userId = parsed.id || parsed.user_id || 'guest';
        const storagePrefix = `global_chat_${userId}_`;

        const globalMessages = sessionStorage.getItem(`${storagePrefix}messages`);
        const globalSessionId = sessionStorage.getItem(`${storagePrefix}sessionId`);

        if (role === 'staff') {
            if (globalMessages) sessionStorage.setItem('ai_chatMessages', globalMessages);
            if (globalSessionId) {
                sessionStorage.setItem('ai_selectedSessionId', globalSessionId);
            }
            router.visit('/staff/ai-assistant');
        } else {
            if (globalMessages) {
                sessionStorage.setItem('admin_ai_chatMessages', globalMessages);
            }
            if (globalSessionId) {
                sessionStorage.setItem('admin_ai_selectedSessionId', globalSessionId);
            }
            router.visit('/admin/ai-assistant');
        }

        toggleChat();
    };

    const panelClass = isDashboardThemeEnabled
        ? 'border border-base-300 bg-base-100 text-base-content shadow-2xl shadow-primary/10'
        : 'border border-gray-200 bg-white';

    const headerClass = isDashboardThemeEnabled
        ? 'bg-gradient-to-r from-primary to-secondary text-primary-content'
        : 'bg-gradient-to-r from-green-700 to-green-600 text-white';

    const headerIconClass = isDashboardThemeEnabled
        ? 'bg-primary-content/15 text-primary-content'
        : 'bg-white/20 text-white';

    const headerMetaTextClass = isDashboardThemeEnabled
        ? 'text-primary-content/80'
        : 'text-green-100';

    const headerMetaDotClass = isDashboardThemeEnabled
        ? 'bg-primary-content/60'
        : 'bg-green-300';

    const headerActionClass = isDashboardThemeEnabled
        ? 'hover:bg-primary-content/10'
        : 'hover:bg-white/20';

    const messagesAreaClass = isDashboardThemeEnabled
        ? 'bg-base-200/50'
        : 'bg-gray-50/50';

    const emptyIconClass = isDashboardThemeEnabled
        ? 'bg-primary/12 text-primary'
        : 'bg-green-50 text-green-600';

    const emptyTitleClass = isDashboardThemeEnabled
        ? 'text-base-content'
        : 'text-gray-900';

    const emptyTextClass = isDashboardThemeEnabled
        ? 'text-base-content/60'
        : 'text-gray-500';

    const userAvatarClass = isDashboardThemeEnabled
        ? 'border border-base-300 bg-base-200 text-base-content'
        : 'bg-gray-100';

    const assistantAvatarClass = isDashboardThemeEnabled
        ? 'border border-primary/15 bg-primary/12 text-primary'
        : 'bg-green-100';

    const userIconClass = isDashboardThemeEnabled
        ? 'text-base-content/70'
        : 'text-gray-600';

    const assistantIconClass = isDashboardThemeEnabled
        ? 'text-primary'
        : 'text-green-600';

    const userBubbleClass = isDashboardThemeEnabled
        ? 'rounded-tr-none bg-primary text-primary-content shadow-md shadow-primary/20'
        : 'rounded-tr-none bg-gray-900 text-white';

    const assistantBubbleClass = isDashboardThemeEnabled
        ? 'rounded-tl-none border border-primary/15 bg-gradient-to-br from-base-100 to-primary/5 text-base-content shadow-md shadow-primary/10'
        : 'rounded-tl-none border border-gray-100 bg-white text-gray-800';

    const referenceDividerClass = isDashboardThemeEnabled
        ? 'border-primary/10'
        : 'border-gray-100';

    const referenceLabelClass = isDashboardThemeEnabled
        ? 'text-base-content/55'
        : 'text-gray-500';

    const referenceCardClass = isDashboardThemeEnabled
        ? 'border border-primary/12 bg-base-200/80 text-base-content'
        : 'border border-green-200 bg-green-50 text-[11px]';

    const referenceNavigateButtonClass = isDashboardThemeEnabled
        ? 'text-primary hover:bg-primary/10'
        : 'text-green-700 hover:bg-green-200';

    const referenceTitleClass = isDashboardThemeEnabled
        ? 'text-base-content'
        : 'text-green-800';

    const referenceViewButtonClass = isDashboardThemeEnabled
        ? 'bg-primary text-primary-content hover:bg-secondary'
        : 'bg-green-600 text-white hover:bg-green-700';

    const moreDocsTextClass = isDashboardThemeEnabled
        ? 'text-base-content/45'
        : 'text-gray-400';

    const timestampClass = isDashboardThemeEnabled
        ? 'text-base-content/45'
        : 'text-gray-400';

    const loadingBubbleClass = isDashboardThemeEnabled
        ? 'border border-primary/15 bg-gradient-to-br from-base-100 to-primary/5'
        : 'border border-gray-100 bg-white';

    const loadingDotClass = isDashboardThemeEnabled
        ? 'bg-primary'
        : 'bg-green-400';

    const inputWrapperClass = isDashboardThemeEnabled
        ? 'border-base-300 bg-base-100'
        : 'border-gray-100 bg-white';

    const inputClass = isDashboardThemeEnabled
        ? 'border-base-300 bg-base-200 text-base-content placeholder:text-base-content/45 focus:border-primary focus:ring-primary/20'
        : 'border-gray-200 bg-gray-50 focus:border-green-500 focus:ring-green-500/20';

    const submitButtonClass = isDashboardThemeEnabled
        ? 'bg-primary text-primary-content shadow-sm shadow-primary/15 hover:bg-secondary'
        : 'bg-green-600 text-white shadow-sm hover:bg-green-700 hover:shadow-md';

    return (
        <div className={`flex h-[600px] max-h-[80vh] w-96 flex-col overflow-hidden rounded-2xl ${panelClass}`}>
            <div
                className={`flex shrink-0 cursor-default items-center justify-between p-4 ${headerClass}`}
                onPointerDown={(e) => e.stopPropagation()}
            >
                <div className="flex items-center gap-2">
                    <div className={`rounded-lg p-1.5 ${headerIconClass}`}>
                        <Bot className="h-5 w-5" />
                    </div>
                    <div>
                        <h3 className="text-sm font-semibold">AI Assistant</h3>
                        <p className={`flex items-center gap-1 text-xs ${headerMetaTextClass}`}>
                            <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${headerMetaDotClass}`}></span>
                            Online
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={handleNewChat}
                        className={`rounded-lg p-1.5 transition-colors ${headerActionClass}`}
                        title="New Chat"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                        onClick={handleFullscreen}
                        className={`rounded-lg p-1.5 transition-colors ${headerActionClass}`}
                        title="Full Screen"
                    >
                        <Maximize2 className="h-4 w-4" />
                    </button>
                    <button
                        onClick={toggleChat}
                        className={`rounded-lg p-1.5 transition-colors ${headerActionClass}`}
                        title="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className={`flex-1 space-y-4 overflow-y-auto p-4 ${messagesAreaClass}`}>
                {messages.length === 0 && (
                    <div className={`flex h-full flex-col items-center justify-center space-y-3 p-6 text-center ${emptyTextClass}`}>
                        <div className={`flex h-16 w-16 items-center justify-center rounded-full ${emptyIconClass}`}>
                            <Bot className="h-8 w-8" />
                        </div>
                        <div>
                            <p className={`font-medium ${emptyTitleClass}`}>
                                How can I help you today?
                            </p>
                            <p className="mt-1 text-sm">
                                Ask me anything about your documents or the application.
                            </p>
                        </div>
                    </div>
                )}

                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`flex max-w-[85%] gap-2 ${
                                msg.type === 'user' ? 'flex-row-reverse' : 'flex-row'
                            }`}
                        >
                            <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full shadow-sm ${
                                    msg.type === 'user' ? userAvatarClass : assistantAvatarClass
                                }`}
                            >
                                {msg.type === 'user' ? (
                                    <User className={`h-3.5 w-3.5 ${userIconClass}`} />
                                ) : (
                                    <Bot className={`h-3.5 w-3.5 ${assistantIconClass}`} />
                                )}
                            </div>

                            <div
                                className={`flex min-w-0 flex-1 flex-col ${
                                    msg.type === 'user' ? 'items-end' : 'items-start'
                                }`}
                            >
                                <div
                                    className={`w-full overflow-hidden rounded-2xl p-2.5 text-[13px] shadow-sm ${
                                        msg.type === 'user'
                                            ? userBubbleClass
                                            : assistantBubbleClass
                                    }`}
                                >
                                    <p
                                        className="whitespace-pre-wrap break-words"
                                        style={{ overflowWrap: 'anywhere' }}
                                    >
                                        {msg.content}
                                    </p>

                                    {msg.type !== 'user' &&
                                        msg.documents &&
                                        msg.documents.length > 0 && (
                                            <div
                                                className={`mt-2 space-y-1 overflow-hidden border-t pt-2 ${referenceDividerClass}`}
                                            >
                                                <p
                                                    className={`text-[10px] font-semibold uppercase tracking-wide ${referenceLabelClass}`}
                                                >
                                                    References
                                                </p>
                                                {msg.documents.map((doc) => (
                                                    <div
                                                        key={doc.doc_id}
                                                        className={`flex items-center gap-1 overflow-hidden rounded border px-1.5 py-1 text-[11px] ${referenceCardClass}`}
                                                    >
                                                        <button
                                                            onClick={() => handleNavigateToDocument(doc)}
                                                            className={`flex-shrink-0 rounded p-0.5 transition-colors ${referenceNavigateButtonClass}`}
                                                            title="Go to document location"
                                                        >
                                                            <FileText size={11} />
                                                        </button>
                                                        <span
                                                            className={`min-w-0 flex-1 truncate text-left font-medium ${referenceTitleClass}`}
                                                        >
                                                            {doc.title}
                                                        </span>
                                                        <button
                                                            onClick={() => handleViewDocument(doc.doc_id)}
                                                            className={`flex-shrink-0 rounded p-0.5 transition-colors ${referenceViewButtonClass}`}
                                                            title={`View "${doc.title}"`}
                                                        >
                                                            <Eye size={10} />
                                                        </button>
                                                    </div>
                                                ))}
                                                {msg.more_documents_count &&
                                                    msg.more_documents_count > 0 && (
                                                        <p className={`text-[10px] italic ${moreDocsTextClass}`}>
                                                            ...and {msg.more_documents_count} more
                                                        </p>
                                                    )}
                                            </div>
                                        )}
                                </div>
                                <span className={`mt-0.5 px-1 text-[10px] ${timestampClass}`}>
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="flex max-w-[85%] gap-3">
                            <div
                                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${assistantAvatarClass}`}
                            >
                                <Bot className={`h-4 w-4 ${assistantIconClass}`} />
                            </div>
                            <div className={`rounded-2xl rounded-tl-none p-4 shadow-sm ${loadingBubbleClass}`}>
                                <div className="flex gap-1.5">
                                    <div
                                        className={`h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.3s] ${loadingDotClass}`}
                                    ></div>
                                    <div
                                        className={`h-1.5 w-1.5 rounded-full animate-bounce [animation-delay:-0.15s] ${loadingDotClass}`}
                                    ></div>
                                    <div
                                        className={`h-1.5 w-1.5 rounded-full animate-bounce ${loadingDotClass}`}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form
                onSubmit={handleSubmit}
                className={`shrink-0 border-t p-4 ${inputWrapperClass}`}
            >
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Type your message..."
                        className={`flex-1 rounded-xl border px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 ${inputClass}`}
                        disabled={isLoading}
                    />

                    <button
                        type="submit"
                        disabled={!input.trim() || isLoading}
                        className={`rounded-xl p-2.5 transition-all disabled:cursor-not-allowed disabled:opacity-50 ${submitButtonClass}`}
                    >
                        <Send className="h-4 w-4" />
                    </button>
                </div>
            </form>

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
