import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import AdminLayout from "../../../../Layouts/AdminLayout";

import { Header } from './components/layout/Header';
import { ChatInterface } from './components/chat/ChatInterface';
// import { DocumentUpload } from './components/document/DocumentUpload';
// import { DocumentList } from './components/document/DocumentList';
import { Modal } from './components/ui/Modal';
import { apiService } from './services/api';
import { useApi } from './hooks/useApi';
import { ChatSession, ChatMessage, Document, DocumentReference } from './types';
import { Sidebar } from './components/layout/SidebarUi/Sidebar';
import DocumentViewer from '../Document/components/DocumentViewer/DocumentViewer';
import { Document as FullDocument } from '../Document/types/types';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../hooks/useDashboardTheme';

function Aiassistant() {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(() => {
    // Restore from sessionStorage on mount
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('admin_ai_selectedSessionId') || null;
    }
    return null;
  });
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    // Restore from sessionStorage on mount
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('admin_ai_chatMessages');
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  // const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  // const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
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
        sessionStorage.setItem('admin_ai_selectedSessionId', selectedSessionId);
      } else {
        sessionStorage.removeItem('admin_ai_selectedSessionId');
      }
    }
  }, [selectedSessionId]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('admin_ai_chatMessages', JSON.stringify(chatMessages));
    }
  }, [chatMessages]);

  // API hooks
  const { data: chatSessions, loading: sessionsLoading, refetch: refetchSessions } = useApi<ChatSession[]>(
    () => apiService.getChatSessions(),
    []
  );

  // COMMENTED OUT DOCUMENT API CALLS
  /*
  const { data: documents, refetch: refetchDocuments } = useApi<Document[]>(
    async () => {
      try {
        const docs = await apiService.getDocuments();
        return docs.map((doc: any) => ({
          id: doc.id,
          title: doc.title || 'Untitled',
          type: doc.type || 'unknown',
          size: doc.size || 0,
          uploadDate: doc.uploadDate || new Date().toISOString(),
          status: doc.status || 'active',
        })) as Document[];
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        return [];
      }
    },
    []
  );
  */

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
      sessionStorage.removeItem('admin_ai_selectedSessionId');
      sessionStorage.removeItem('admin_ai_chatMessages');
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

  // COMMENTED OUT DOCUMENT HANDLERS
  /*
  const handleUploadFiles = async (files: File[]) => {
    setIsUploading(true);
    try {
      for (const file of files) {
        await apiService.uploadDocument(file);
      }
      refetchDocuments();
      setIsUploadModalOpen(false);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: number) => {
    try {
      await apiService.deleteDocument(documentId);
      refetchDocuments();
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleSelectDocument = (document: Document) => {
    // Auto-generate a message about the selected document
    const message = `I'd like to work with the document: ${document.title}`;
    handleSendMessage(message);
  };
  */

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
    router.visit('/admin/documents', { data: params });
  };

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className={`h-screen overflow-hidden relative ${
        isDashboardThemeEnabled ? 'bg-base-200 text-base-content' : 'bg-gray-50'
      }`}
    >
      {isDashboardThemeEnabled && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at top right, oklch(var(--s) / 0.14), transparent 25%), radial-gradient(circle at bottom left, oklch(var(--p) / 0.1), transparent 30%)',
          }}
        />
      )}
      <div className="relative z-10 h-full flex">
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
            onCollapse={setIsSidebarCollapsed}
            onExpand={() => setIsSidebarCollapsed(false)}
            isLoading={sessionsLoading}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header - Always show header */}
          <Header
            currentSessionTitle={currentSession?.title}
            onUpload={() => console.log('Upload disabled for testing')} // Temporary placeholder
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

        {/* COMMENTED OUT UPLOAD MODAL */}
        {/*
        <Modal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          title="Upload Documents"
        >
          <div className="space-y-4">
            <DocumentUpload
              onUpload={handleUploadFiles}
              isUploading={isUploading}
            />
            
            {documents && documents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Documents</h4>
                <div className="max-h-60 overflow-y-auto">
                  <DocumentList
                    documents={documents}
                    onDelete={handleDeleteDocument}
                    onSelect={handleSelectDocument}
                  />
                </div>
              </div>
            )}
          </div>
        </Modal>
        */}

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

// Apply Admin Layout wrapper with fullScreen and hideSidebar props
Aiassistant.layout = (page: React.ReactNode) => (
  <AdminLayout fullScreen hideSidebar hideChatWidget>{page}</AdminLayout>
);

export default Aiassistant;
