import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import StaffLayout from "../../../../Layouts/StaffLayout";

import { Header } from './components/layout/Header';
import { ChatInterface } from './components/chat/ChatInterface';
import { apiService } from './services/api';
import { useApi } from './hooks/useApi';
import { ChatSession, ChatMessage, Document, DocumentReference } from './types';
import { Sidebar } from './components/layout/SidebarUi/Sidebar';
import DocumentViewer from '../Documents/components/DocumentViewer/DocumentViewer';
import { Document as FullDocument } from '../Documents/types/types';

function StaffAIAssistant() {
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(() => {
        // Restore from sessionStorage on mount
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('ai_selectedSessionId') || null;
        }
        return null;
    });
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
        // Restore from sessionStorage on mount
        if (typeof window !== 'undefined') {
            const saved = sessionStorage.getItem('ai_chatMessages');
            return saved ? JSON.parse(saved) : [];
        }
        return [];
    });
    const [isLoading, setIsLoading] = useState(false);
    const [documentsShownInSession, setDocumentsShownInSession] = useState(false);
    const [sessionDocumentIds, setSessionDocumentIds] = useState<number[]>([]);
    const [isNewConversation, setIsNewConversation] = useState(false);

    // Document viewer state
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<FullDocument | null>(null);
    const [isLoadingDocument, setIsLoadingDocument] = useState(false);

    // Save conversation state to sessionStorage whenever it changes
    useEffect(() => {
        if (typeof window !== 'undefined') {
            if (selectedSessionId) {
                sessionStorage.setItem('ai_selectedSessionId', selectedSessionId);
            } else {
                sessionStorage.removeItem('ai_selectedSessionId');
            }
        }
    }, [selectedSessionId]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('ai_chatMessages', JSON.stringify(chatMessages));
        }
    }, [chatMessages]);

    // API hooks
    const { data: chatSessions, loading: sessionsLoading, refetch: refetchSessions } = useApi<ChatSession[]>(
        () => apiService.getChatSessions(),
        []
    );

    // Load chat history when session changes
    useEffect(() => {
        // Only load chat history when manually selecting an existing session
        // Skip loading for new conversations or when no session is selected
        if (selectedSessionId && !isNewConversation) {
            const loadChatHistory = async () => {
                try {
                    setIsLoading(true);
                    const history = await apiService.getChatHistory(selectedSessionId);
                    // Only set messages if we actually got some history
                    if (history && history.length > 0) {
                        setChatMessages(history);
                    }
                } catch (error) {
                    console.error('Failed to load chat history:', error);
                    // Don't clear messages on error for new conversations
                } finally {
                    setIsLoading(false);
                }
            };
            loadChatHistory();
        }

        // Reset the new conversation flag after handling
        if (isNewConversation) {
            setIsNewConversation(false);
        }
    }, [selectedSessionId, isNewConversation]);

    const handleSendMessage = async (messageText: string, attachedDocuments?: Document[]) => {
        if (!messageText.trim()) return;

        // Add user message immediately with document context (only show documents on first attachment)
        let messageContent = messageText;
        if (attachedDocuments && attachedDocuments.length > 0 && !documentsShownInSession) {
            const docNames = attachedDocuments.map(doc => doc.title).join(', ');
            messageContent = `${messageText}\n\n📎 Attached documents: ${docNames}`;
            setDocumentsShownInSession(true);
        }

        const userMessage: ChatMessage = {
            id: Date.now(),
            type: 'user',
            content: messageContent,
            timestamp: new Date().toISOString(),
        };

        setChatMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            // DOCUMENT SCOPING: Only send document IDs when the user has explicitly selected/attached documents.
            // When no new documents are attached, send NO document IDs to let the backend handle freely.
            let documentIdsToSend: number[] = [];
            if (attachedDocuments && attachedDocuments.length > 0) {
                const newDocIds = attachedDocuments.map(doc => doc.doc_id || doc.id);
                setSessionDocumentIds(newDocIds);
                documentIdsToSend = newDocIds;
            }

            const aiResponse = await apiService.sendMessage(messageText, selectedSessionId || undefined, documentIdsToSend.length > 0 ? documentIdsToSend : undefined);

            // Update session ID if this was a new chat
            if (!selectedSessionId && aiResponse.session_id) {
                setIsNewConversation(true); // Flag this as a new conversation
                setSelectedSessionId(aiResponse.session_id);
            }

            setChatMessages(prev => [...prev, aiResponse]);

            // Always refresh sessions list to update sidebar with latest message
            refetchSessions();
        } catch (error) {
            console.error('Failed to send message:', error);
            // Add error message
            const errorMessage: ChatMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date().toISOString(),
            };
            setChatMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelectSession = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        setDocumentsShownInSession(false); // Reset document display flag for new session
        setSessionDocumentIds([]); // Clear session document IDs for new session
        setIsNewConversation(false); // Reset new conversation flag
    };

    const handleNewChat = () => {
        setSelectedSessionId(null);
        setChatMessages([]);
        setDocumentsShownInSession(false); // Reset document display flag for new chat
        setSessionDocumentIds([]); // Clear session document IDs for new chat
        setIsNewConversation(false); // Reset new conversation flag
        // Clear sessionStorage for new chat
        if (typeof window !== 'undefined') {
            sessionStorage.removeItem('ai_selectedSessionId');
            sessionStorage.removeItem('ai_chatMessages');
        }
    };

    const handleDeleteSession = async (sessionId: string) => {
        try {
            await apiService.deleteSession(sessionId);

            if (selectedSessionId === sessionId) {
                handleNewChat();
            }
            refetchSessions();
        } catch (error) {
            console.error('Failed to delete session:', error);
        }
    };

    const handleStarSession = async (sessionId: string) => {
        try {
            await apiService.starSession(sessionId);
            refetchSessions();
        } catch (error) {
            console.error('Failed to star session:', error);
        }
    };

    const handleUnstarSession = async (sessionId: string) => {
        try {
            await apiService.unstarSession(sessionId);
            refetchSessions();
        } catch (error) {
            console.error('Failed to unstar session:', error);
        }
    };

    const currentSession = chatSessions?.find(s => s.id === selectedSessionId);

    // Handle viewing a document from AI chat
    const handleViewDocument = async (docId: number) => {
        setIsLoadingDocument(true);
        try {
            // Fetch full document details
            const response = await fetch(`/api/documents/${docId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
                    'Accept': 'application/json',
                },
            });

            if (response.ok) {
                const responseData = await response.json();
                // Unwrap nested data if present
                setSelectedDocument(responseData.success ? responseData.data : responseData);
                setIsViewerOpen(true);
            } else {
                console.error('Failed to fetch document details');
            }
        } catch (error) {
            console.error('Error fetching document:', error);
        } finally {
            setIsLoadingDocument(false);
        }
    };

    // Handle navigating to document location in Documents page
    const handleNavigateToDocument = (doc: DocumentReference) => {
        // Navigate to Documents page with folder and highlight params
        const params: Record<string, string> = { from: 'ai' };
        if (doc.folder_id) {
            params.folder = String(doc.folder_id);
        }
        if (doc.doc_id) {
            params.highlight = String(doc.doc_id);
        }
        router.visit('/staff/documents', { data: params });
    };

    return (
        <div className="h-screen overflow-hidden bg-gray-50">
            <div className="h-full flex">
                {/* Sidebar */}
                <div className="flex-shrink-0">
                    <Sidebar
                        chatSessions={chatSessions || []}
                        selectedSession={selectedSessionId}
                        onSelectSession={handleSelectSession}
                        onNewChat={handleNewChat}
                        onDeleteSession={handleDeleteSession}
                        onUnstarSession={handleUnstarSession}
                        onStarSession={handleStarSession}
                        onBack={() => window.history.back()}
                        isLoading={sessionsLoading}
                    />
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {/* Header */}
                    <Header
                        currentSessionTitle={currentSession?.title}
                        onUpload={() => { }}
                    />

                    {/* Chat Interface */}
                    <div className="flex-1 min-h-0 overflow-hidden">
                        <ChatInterface
                            messages={chatMessages}
                            onSendMessage={handleSendMessage}
                            onViewDocument={handleViewDocument}
                            onNavigate={handleNavigateToDocument}
                            loading={isLoading || isLoadingDocument}
                        />
                    </div>
                </div>

                {/* Document Viewer Modal */}
                <DocumentViewer
                    isOpen={isViewerOpen}
                    onClose={() => {
                        setIsViewerOpen(false);
                        setSelectedDocument(null);
                    }}
                    document={selectedDocument}
                />
            </div>
        </div>
    );
}

// Apply Staff Layout wrapper with fullScreen and hideSidebar props
StaffAIAssistant.layout = (page: React.ReactNode) => (
    <StaffLayout fullScreen hideSidebar hideChatWidget>{page}</StaffLayout>
);

export default StaffAIAssistant;
