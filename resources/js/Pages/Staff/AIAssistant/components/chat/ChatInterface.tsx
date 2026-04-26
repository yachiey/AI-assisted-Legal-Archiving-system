import React, { useRef, useEffect } from "react";
import { Bot } from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { ChatMessage as ChatMessageType, Document } from "../../types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

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
  const { theme } = useDashboardTheme("staff");
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div
      className={`flex flex-col h-full ${
        isDashboardThemeEnabled ? "bg-base-200/40" : "bg-gray-50"
      }`}
    >
      <div
        className="flex-1 overflow-y-auto p-6 space-y-4"
        style={{ minHeight: 0 }}
        data-lenis-prevent
        data-lenis-prevent-wheel
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <div className="mb-8">
              <div
                className={`w-24 h-24 rounded-3xl flex items-center justify-center shadow-lg ${
                  isDashboardThemeEnabled
                    ? "bg-gradient-to-br from-primary to-secondary text-primary-content"
                    : "bg-gradient-to-br from-[#228B22] to-[#1a6b1a] text-white"
                }`}
              >
                <svg
                  className="w-12 h-12 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
            </div>

            <h3
              className={`text-2xl font-bold mb-3 ${
                isDashboardThemeEnabled ? "text-base-content" : "text-gray-900"
              }`}
            >
              Ready to Help!
            </h3>
            <p
              className={`max-w-md leading-relaxed ${
                isDashboardThemeEnabled
                  ? "text-base-content/65"
                  : "text-gray-600"
              }`}
            >
              Start a conversation by typing a message below. I can help you
              analyze documents, answer questions, and provide insights.
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
            <div className="flex max-w-sm items-start gap-3 lg:max-w-xl">
              <div
                className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
                  isDashboardThemeEnabled
                    ? "border-primary/20 bg-primary/10 text-primary"
                    : "border-green-100 bg-green-50 text-[#228B22]"
                }`}
              >
                <Bot className="h-5 w-5" />
              </div>
              <div
                className={`relative overflow-hidden rounded-[26px] px-5 py-4 shadow-sm ${
                  isDashboardThemeEnabled
                    ? "bg-base-100 border border-base-300 text-base-content"
                    : "bg-white border border-gray-200"
                }`}
              >
                <div
                  className={`pointer-events-none absolute inset-x-0 top-0 h-14 ${
                    isDashboardThemeEnabled
                      ? "bg-gradient-to-r from-primary/12 via-secondary/8 to-transparent"
                      : "bg-gradient-to-r from-[#228B22]/10 via-[#FBEC5D]/10 to-transparent"
                  }`}
                />
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1.5">
                    <div
                      className={`w-2.5 h-2.5 rounded-full animate-bounce ${
                        isDashboardThemeEnabled ? "bg-primary" : "bg-[#228B22]"
                      }`}
                    />
                    <div
                      className={`w-2.5 h-2.5 rounded-full animate-bounce ${
                        isDashboardThemeEnabled ? "bg-primary" : "bg-[#228B22]"
                      }`}
                      style={{ animationDelay: "0.1s" }}
                    />
                    <div
                      className={`w-2.5 h-2.5 rounded-full animate-bounce ${
                        isDashboardThemeEnabled ? "bg-primary" : "bg-[#228B22]"
                      }`}
                      style={{ animationDelay: "0.2s" }}
                    />
                  </div>
                  <span
                    className={`relative z-10 text-sm font-medium ${
                      isDashboardThemeEnabled
                        ? "text-base-content/70"
                        : "text-gray-600"
                    }`}
                  >
                    AI is thinking...
                  </span>
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
