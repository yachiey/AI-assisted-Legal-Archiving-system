import React, { useState, useCallback, useRef, useEffect } from "react";
import { Loader2, FolderPlus } from "lucide-react";

import { SidebarCollapsedIcon } from "./SidebarCollapsedIcon";
import { SidebarHeader } from "./SidebarHeader";
import { NewChatButton } from "./NewChatButton";
import { ChatSessionItem } from "./ChatSessionItem";
import { FolderGroup } from "./FolderGroup";
import { SidebarFooter } from "./SidebarFooter";
import { AIFolder, ChatSession } from "../../../types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface SidebarProps {
  chatSessions: ChatSession[];
  folders: AIFolder[];
  selectedSession: string | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onUnstarSession: (sessionId: string) => void;
  onStarSession?: (sessionId: string) => void;
  onMoveSession: (sessionId: string, folderId: number | null) => void;
  onCreateFolder: (name: string) => void;
  onRenameFolder: (folderId: number, name: string) => void;
  onDeleteFolder: (folderId: number) => void;
  onBack?: () => void;
  onCollapse?: (isCollapsed: boolean) => void;
  onExpand?: () => void;
  isLoading?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  chatSessions,
  folders,
  selectedSession,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onUnstarSession,
  onStarSession,
  onMoveSession,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
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
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [isRecentDragOver, setIsRecentDragOver] = useState(false);
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
  const unstarredSessions = chatSessions.filter((session) => !session.starred);
  const recentSessions = unstarredSessions.filter((s) => !s.folder_id);
  const sessionsByFolder = (folderId: number) =>
    unstarredSessions.filter((s) => s.folder_id === folderId);

  const handleCollapse = () => {
    setCollapsed(true);
    onCollapse?.(true);
  };

  const handleExpand = () => {
    setCollapsed(false);
    onCollapse?.(false);
    onExpand?.();
  };

  const submitCreateFolder = () => {
    const trimmed = newFolderName.trim();
    if (trimmed) {
      onCreateFolder(trimmed);
    }
    setNewFolderName("");
    setIsCreatingFolder(false);
  };

  const handleRecentDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-chat-session")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsRecentDragOver(true);
    }
  };

  const handleRecentDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsRecentDragOver(false);
    const sessionId = e.dataTransfer.getData("application/x-chat-session");
    if (sessionId) onMoveSession(sessionId, null);
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
        className={`relative h-full min-h-0 flex flex-col shadow-2xl ${
          isDashboardThemeEnabled ? "text-primary-content" : "text-white"
        }`}
      >
        <SidebarHeader onBack={onBack} onCollapse={handleCollapse} />

        <NewChatButton onClick={onNewChat} />

        <div
          data-lenis-prevent
          data-lenis-prevent-wheel
          className="flex-1 min-h-0 overflow-y-auto px-4 py-2 green-scrollbar"
        >
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
                        folders={folders}
                        onSelect={() => onSelectSession(session.id)}
                        onUnstar={() => onUnstarSession(session.id)}
                        onDelete={() => onDeleteSession(session.id)}
                        onMoveToFolder={(fid) => onMoveSession(session.id, fid)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Folders section */}
              <div className="mb-6">
                <div
                  className={`flex items-center gap-2 mb-3 pb-2 border-b ${
                    isDashboardThemeEnabled
                      ? "border-primary-content/20"
                      : "border-green-500/30"
                  }`}
                >
                  <div
                    className={`w-1 h-4 rounded-full ${
                      isDashboardThemeEnabled ? "bg-accent" : "bg-yellow-300"
                    }`}
                  />
                  <h3
                    className={`text-xs uppercase tracking-wider font-bold truncate flex-1 ${
                      isDashboardThemeEnabled
                        ? "text-primary-content/85"
                        : "text-green-100"
                    }`}
                  >
                    Folders
                  </h3>
                  <button
                    onClick={() => setIsCreatingFolder(true)}
                    className={`p-1.5 rounded-md transition-all ${
                      isDashboardThemeEnabled
                        ? "hover:bg-primary-content/20 text-primary-content"
                        : "hover:bg-white/20 text-white"
                    }`}
                    title="New folder"
                    aria-label="New folder"
                  >
                    <FolderPlus className="w-4 h-4" />
                  </button>
                </div>

                {isCreatingFolder && (
                  <div
                    className={`mb-3 p-2 rounded-xl ${
                      isDashboardThemeEnabled
                        ? "bg-primary-content/10 border border-primary-content/20"
                        : "bg-white/10 border border-white/20"
                    }`}
                  >
                    <input
                      autoFocus
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      onBlur={submitCreateFolder}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") submitCreateFolder();
                        if (e.key === "Escape") {
                          setNewFolderName("");
                          setIsCreatingFolder(false);
                        }
                      }}
                      placeholder="Folder name…"
                      maxLength={100}
                      className={`w-full bg-transparent outline-none text-sm font-semibold px-2 py-1.5 ${
                        isDashboardThemeEnabled
                          ? "text-primary-content placeholder:text-primary-content/40"
                          : "text-white placeholder:text-white/40"
                      }`}
                    />
                  </div>
                )}

                {folders.length === 0 && !isCreatingFolder ? (
                  <div
                    className={`text-xs italic px-2 py-3 ${
                      isDashboardThemeEnabled
                        ? "text-primary-content/55"
                        : "text-green-200/60"
                    }`}
                  >
                    No folders yet. Click the + icon above to create one.
                  </div>
                ) : (
                  folders.map((folder) => (
                    <FolderGroup
                      key={folder.folder_id}
                      folder={folder}
                      sessions={sessionsByFolder(folder.folder_id)}
                      selectedSession={selectedSession}
                      allFolders={folders}
                      onSelectSession={onSelectSession}
                      onDeleteSession={onDeleteSession}
                      onStarSession={onStarSession}
                      onUnstarSession={onUnstarSession}
                      onMoveSession={onMoveSession}
                      onRenameFolder={onRenameFolder}
                      onDeleteFolder={onDeleteFolder}
                      onDropSession={(sid, fid) => onMoveSession(sid, fid)}
                    />
                  ))
                )}
              </div>

              <div
                onDragOver={handleRecentDragOver}
                onDragLeave={() => setIsRecentDragOver(false)}
                onDrop={handleRecentDrop}
                className={`rounded-xl transition-all ${
                  isRecentDragOver
                    ? isDashboardThemeEnabled
                      ? "ring-2 ring-accent bg-accent/10"
                      : "ring-2 ring-[#FBEC5D] bg-yellow-400/10"
                    : ""
                }`}
              >
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
                        folders={folders}
                        onSelect={() => onSelectSession(session.id)}
                        onStar={
                          onStarSession
                            ? () => onStarSession(session.id)
                            : undefined
                        }
                        onDelete={() => onDeleteSession(session.id)}
                        onMoveToFolder={(fid) => onMoveSession(session.id, fid)}
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
                        No uncategorized chats
                      </p>
                      <p
                        className={`text-xs ${
                          isDashboardThemeEnabled
                            ? "text-primary-content/65"
                            : "text-green-200/60"
                        }`}
                      >
                        Drop chats here to remove from a folder.
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
