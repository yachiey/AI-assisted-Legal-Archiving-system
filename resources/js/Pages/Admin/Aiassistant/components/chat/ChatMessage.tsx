import React from 'react';
import { ChatMessage as ChatMessageType } from '../../types';
import { FileLink } from './FileLink';

interface ChatMessageProps {
  message: ChatMessageType;
  onViewDocument?: (docId: number) => void;
  onNavigate?: (doc: any) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message, onViewDocument, onNavigate }) => {
  const isUser = message.type === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className="max-w-xs lg:max-w-md">
        {/* Message bubble - Staff theme colors */}
        <div
          className={`rounded-2xl px-5 py-3 shadow-sm ${isUser
            ? 'bg-gradient-to-br from-[#228B22] to-[#1a6b1a] text-white'
            : 'bg-white border border-gray-200 text-gray-900'
            }`}
        >

          <p className="text-base whitespace-pre-wrap leading-relaxed">{message.content}</p>

          {/* Display document references if available */}
          {message.documents && message.documents.length > 0 && (
            <div className={`mt-3 pt-3 space-y-2 ${isUser ? 'border-t border-white/20' : 'border-t border-gray-200'
              }`}>
              <p className={`text-xs font-semibold ${isUser ? 'text-white/90' : 'text-gray-700'} mb-2`}>
                📎 Referenced Documents:
              </p>
              {message.documents.map((doc) => (
                <FileLink key={doc.doc_id} document={doc} onViewDocument={onViewDocument} onNavigate={onNavigate} />
              ))}
              {message.more_documents_count && message.more_documents_count > 0 && (
                <p className={`text-xs italic mt-1 ${isUser ? 'text-white/70' : 'text-gray-500'}`}>
                  ...and {message.more_documents_count} more documents.
                </p>
              )}
            </div>
          )}

          {/* Timestamp */}
          <p className={`text-xs mt-2 ${isUser ? 'text-white/80' : 'text-gray-500'
            }`}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>
    </div>
  );
};
