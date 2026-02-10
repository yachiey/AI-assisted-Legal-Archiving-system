import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { ChatMessage as ChatMessageType, Document } from '../../types';

interface ChatInterfaceProps {
  messages: ChatMessageType[];
  onSendMessage: (message: string, attachedDocuments?: Document[]) => void;
  onViewDocument?: (docId: number) => void;
  onNavigate?: (doc: any) => void;
  loading?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  onViewDocument,
  onNavigate,
  loading = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-6 space-y-4" style={{ minHeight: 0 }}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            {/* Empty state icon - Staff theme */}
            <div className="mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-[#228B22] to-[#1a6b1a] rounded-3xl flex items-center justify-center shadow-lg">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Help!</h3>
            <p className="text-gray-600 max-w-md leading-relaxed">
              Start a conversation by typing a message below. I can help you analyze documents, answer questions, and provide insights.
            </p>
          </div>
        ) : (
          messages.map((message, index) => (
            <ChatMessage
              key={`message-${message.id}-${index}`}
              message={message}
              onViewDocument={onViewDocument}
              onNavigate={onNavigate}
            />
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            {/* Loading indicator - Staff theme */}
            <div className="max-w-xs lg:max-w-md">
              <div className="bg-white border border-gray-200 px-5 py-3 rounded-2xl shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1.5">
                    <div key="dot-1" className="w-2.5 h-2.5 bg-[#228B22] rounded-full animate-bounce"></div>
                    <div key="dot-2" className="w-2.5 h-2.5 bg-[#228B22] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div key="dot-3" className="w-2.5 h-2.5 bg-[#228B22] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm font-medium text-gray-600">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <ChatInput onSendMessage={onSendMessage} disabled={loading} />
    </div>
  );
};