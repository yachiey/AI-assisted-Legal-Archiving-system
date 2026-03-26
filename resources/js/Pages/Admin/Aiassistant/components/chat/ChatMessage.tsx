import React from "react";
import { Bot } from "lucide-react";
import { ChatMessage as ChatMessageType } from "../../types";
import { FileLink } from "./FileLink";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

interface ChatMessageProps {
  message: ChatMessageType;
  onViewDocument?: (docId: number) => void;
  onNavigate?: (doc: any) => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onViewDocument,
  onNavigate,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const isUser = message.type === "user";

  const bubbleClass = isUser
    ? isDashboardThemeEnabled
      ? "bg-gradient-to-br from-primary to-secondary text-primary-content shadow-lg shadow-primary/20"
      : "bg-gradient-to-br from-[#228B22] to-[#1a6b1a] text-white shadow-lg shadow-green-900/10"
    : isDashboardThemeEnabled
      ? "border border-base-300 bg-base-100 text-base-content shadow-xl shadow-base-content/5"
      : "border border-gray-200 bg-white text-gray-900 shadow-md shadow-gray-200/70";

  return (
    <div className={`mb-5 flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`flex items-start gap-3 ${
          isUser
            ? "max-w-xs lg:max-w-md"
            : "max-w-sm lg:max-w-2xl xl:max-w-3xl"
        }`}
      >
        {!isUser && (
          <div
            className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border ${
              isDashboardThemeEnabled
                ? "border-primary/20 bg-primary/10 text-primary"
                : "border-green-100 bg-green-50 text-[#228B22]"
            }`}
          >
            <Bot className="h-5 w-5" />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className={`relative overflow-hidden rounded-[26px] px-5 py-4 ${bubbleClass}`}>
            {!isUser && (
              <div
                className={`pointer-events-none absolute inset-x-0 top-0 h-16 ${
                  isDashboardThemeEnabled
                    ? "bg-gradient-to-r from-primary/12 via-secondary/8 to-transparent"
                    : "bg-gradient-to-r from-[#228B22]/10 via-[#FBEC5D]/10 to-transparent"
                }`}
              />
            )}

            <div className="relative z-10">
              {!isUser && (
                <div
                  className={`mb-2 inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] ${
                    isDashboardThemeEnabled
                      ? "bg-primary/10 text-primary"
                      : "bg-green-50 text-[#228B22]"
                  }`}
                >
                  AI Assistant
                </div>
              )}

              <p className="whitespace-pre-wrap text-[15px] leading-7">
                {message.content}
              </p>

              {message.documents && message.documents.length > 0 && (
                <div
                  className={`mt-4 space-y-2 border-t pt-4 ${
                    isUser
                      ? "border-white/20"
                      : isDashboardThemeEnabled
                        ? "border-base-300"
                        : "border-gray-200"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                      isUser
                        ? "text-white/85"
                        : isDashboardThemeEnabled
                          ? "text-base-content/55"
                          : "text-gray-500"
                    }`}
                  >
                    Referenced Documents
                  </p>
                  {message.documents.map((doc) => (
                    <FileLink
                      key={doc.doc_id}
                      document={doc}
                      onViewDocument={onViewDocument}
                      onNavigate={onNavigate}
                    />
                  ))}
                  {message.more_documents_count &&
                    message.more_documents_count > 0 && (
                      <p
                        className={`mt-1 text-xs italic ${
                          isUser
                            ? "text-white/70"
                            : isDashboardThemeEnabled
                              ? "text-base-content/55"
                              : "text-gray-500"
                        }`}
                      >
                        ...and {message.more_documents_count} more documents.
                      </p>
                    )}
                </div>
              )}

              <p
                className={`mt-3 text-right text-[11px] ${
                  isUser
                    ? "text-white/75"
                    : isDashboardThemeEnabled
                      ? "text-base-content/45"
                      : "text-gray-400"
                }`}
              >
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
