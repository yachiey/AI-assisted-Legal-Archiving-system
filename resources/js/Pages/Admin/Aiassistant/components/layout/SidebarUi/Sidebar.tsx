import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2 } from "lucide-react";

import { SidebarCollapsedIcon } from "./SidebarCollapsedIcon";
import { SidebarHeader } from "./SidebarHeader";
import { NewChatButton } from "./NewChatButton";
import { ChatSessionItem } from "./ChatSessionItem";
import { SidebarFooter } from "./SidebarFooter";
import { ChatSession } from "../../../types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface SidebarProps {
  chatSessions: ChatSession[];
  selectedSession: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onUnstarSession: (sessionId: string) => void;
  onStarSession?: (sessionId: string) => void;
  onBack?: () => void;
  onCollapse?: (isCollapsed: boolean) => void;
  onExpand?: () => void;
  isLoading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chatSessions,
  selectedSession,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onUnstarSession,
  onStarSession,
  onBack,
  onCollapse,
  onExpand,
  isLoading = false,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [collapsed, setCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback((mouseDownEvent: React.MouseEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth >= 250 && newWidth <= 600) {
          setSidebarWidth(newWidth);
        }
      }
    },
    [isResizing]
  );

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

  const starredSessions = chatSessions.filter((session) => session.starred);
  const recentSessions = chatSessions.filter((session) => !session.starred);

  const handleCollapse = () => {
    setCollapsed(true);
    onCollapse?.(true);
  };

  const handleExpand = () => {
    setCollapsed(false);
    onCollapse?.(false);
    onExpand?.();
  };

  if (collapsed) {
    return (
      <div className="w-16 h-full flex-shrink-0">
        <SidebarCollapsedIcon onExpand={handleExpand} />
      </div>
    );
  }

  return (
    <div
      ref={sidebarRef}
      className="relative h-full overflow-hidden flex-shrink-0"
      style={{ width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` }}
    >
      <div
        className={`absolute inset-0 ${
          isDashboardThemeEnabled
            ? "bg-gradient-to-b from-primary via-primary to-secondary"
            : "bg-[#1b5e20]"
        }`}
      />
      {isDashboardThemeEnabled && (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.14),transparent_55%)]" />
      )}

      <div
        className={`relative h-full flex flex-col shadow-2xl ${
          isDashboardThemeEnabled ? "text-primary-content" : "text-white"
        }`}
      >
        <SidebarHeader onBack={onBack} onCollapse={handleCollapse} />

        <NewChatButton onClick={onNewChat} />

        <div className="flex-1 overflow-y-auto px-4 py-2 green-scrollbar">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <Loader2
                className={`w-10 h-10 animate-spin mb-4 ${
                  isDashboardThemeEnabled ? "text-primary-content/80" : "text-green-300"
                }`}
              />
              <p
                className={`text-sm font-medium mb-1 ${
                  isDashboardThemeEnabled ? "text-primary-content" : "text-green-100"
                }`}
              >
                Loading conversations...
              </p>
              <p
                className={`text-xs ${
                  isDashboardThemeEnabled
                    ? "text-primary-content/65"
                    : "text-green-200/60"
                }`}
              >
                Please wait a moment
              </p>
              <div className="w-full mt-6 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div
                      className={`rounded-lg p-3 border-b ${
                        isDashboardThemeEnabled
                          ? "bg-primary-content/10 border-primary-content/10"
                          : "bg-green-800/30 border-green-600/30"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            isDashboardThemeEnabled
                              ? "bg-primary-content/40"
                              : "bg-green-500/50"
                          }`}
                        />
                        <div className="flex-1 space-y-2">
                          <div
                            className={`h-3 rounded w-3/4 ${
                              isDashboardThemeEnabled
                                ? "bg-primary-content/20"
                                : "bg-green-700/50"
                            }`}
                          />
                          <div
                            className={`h-2 rounded w-1/2 ${
                              isDashboardThemeEnabled
                                ? "bg-primary-content/12"
                                : "bg-green-700/30"
                            }`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              {starredSessions.length > 0 && (
                <div className="mb-6">
                  <div
                    className={`relative mb-4 overflow-hidden rounded-2xl ${
                      isDashboardThemeEnabled
                        ? "bg-base-100/95 border border-base-300/70 shadow-lg"
                        : "bg-[#F4D03F] border border-[#FBEC5D]"
                    }`}
                  >
                    <div className="relative px-4 py-3 flex items-center gap-3">
                      <div className="flex-1">
                        <h3
                          className={`text-sm font-bold uppercase tracking-wider ${
                            isDashboardThemeEnabled
                              ? "text-base-content"
                              : "text-gray-900"
                          }`}
                        >
                          Starred Chats
                        </h3>
                        <p
                          className={`text-xs mt-0.5 ${
                            isDashboardThemeEnabled
                              ? "text-base-content/60"
                              : "text-gray-700"
                          }`}
                        >
                          {starredSessions.length} favorite
                          {starredSessions.length !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div
                        className={`px-3 py-1 rounded-full border ${
                          isDashboardThemeEnabled
                            ? "bg-secondary text-secondary-content border-secondary/20"
                            : "bg-gray-900 border border-gray-800"
                        }`}
                      >
                        <span
                          className={`text-xs font-bold ${
                            isDashboardThemeEnabled
                              ? "text-secondary-content"
                              : "text-yellow-400"
                          }`}
                        >
                          {starredSessions.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {starredSessions.map((session) => (
                      <ChatSessionItem
                        key={session.id}
                        session={session}
                        isSelected={selectedSession === session.id}
                        isStarred={true}
                        onSelect={() => onSelectSession(session.id)}
                        onUnstar={() => onUnstarSession(session.id)}
                        onDelete={() => onDeleteSession(session.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              <div>
                <div
                  className={`flex items-center gap-2 mb-3 pb-2 border-b ${
                    isDashboardThemeEnabled
                      ? "border-primary-content/20"
                      : "border-green-500/30"
                  }`}
                >
                  <div
                    className={`w-1 h-4 rounded-full ${
                      isDashboardThemeEnabled ? "bg-accent" : "bg-green-400"
                    }`}
                  />
                  <h3
                    className={`text-xs uppercase tracking-wider font-bold truncate ${
                      isDashboardThemeEnabled
                        ? "text-primary-content/85"
                        : "text-green-100"
                    }`}
                  >
                    Recent Chats
                  </h3>
                </div>
                <div className="space-y-3">
                  {recentSessions.length > 0 ? (
                    recentSessions.map((session) => (
                      <ChatSessionItem
                        key={session.id}
                        session={session}
                        isSelected={selectedSession === session.id}
                        isStarred={false}
                        onSelect={() => onSelectSession(session.id)}
                        onStar={
                          onStarSession
                            ? () => onStarSession(session.id)
                            : undefined
                        }
                        onDelete={() => onDeleteSession(session.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 px-4">
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${
                          isDashboardThemeEnabled
                            ? "bg-primary-content/12"
                            : "bg-green-700/50"
                        }`}
                      >
                        <span className="text-3xl">AI</span>
                      </div>
                      <p
                        className={`text-sm font-medium mb-1 ${
                          isDashboardThemeEnabled
                            ? "text-primary-content"
                            : "text-green-100"
                        }`}
                      >
                        No conversations yet
                      </p>
                      <p
                        className={`text-xs ${
                          isDashboardThemeEnabled
                            ? "text-primary-content/65"
                            : "text-green-200/60"
                        }`}
                      >
                        Start a new chat to begin!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <SidebarFooter onAllChatsClick={onNewChat} />

        <div
          className={`absolute top-0 right-0 bottom-0 w-1 cursor-col-resize hover:w-2 transition-all duration-200 ${
            isDashboardThemeEnabled
              ? "bg-primary-content/20 hover:bg-primary-content/30"
              : "bg-white/20 hover:bg-white/30"
          } ${
            isResizing
              ? isDashboardThemeEnabled
                ? "bg-primary-content/40 w-2"
                : "bg-white/40 w-2"
              : ""
          }`}
          onMouseDown={startResizing}
          title="Drag to resize sidebar"
        >
          <div className="absolute inset-0 w-4 -translate-x-1.5" />
        </div>
      </div>
    </div>
  );
};
