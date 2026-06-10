import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, ChevronRight, Folder, FolderOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { ChatSessionItem } from "./ChatSessionItem";
import { AIFolder, ChatSession } from "../../../types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface FolderGroupProps {
  folder: AIFolder;
  sessions: ChatSession[];
  selectedSession: string | null;
  allFolders: AIFolder[];
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onStarSession?: (sessionId: string) => void;
  onUnstarSession: (sessionId: string) => void;
  onMoveSession: (sessionId: string, folderId: number | null) => void;
  onRenameFolder: (folderId: number, name: string) => void;
  onDeleteFolder: (folderId: number) => void;
  onDropSession: (sessionId: string, folderId: number) => void;
}

export const FolderGroup: React.FC<FolderGroupProps> = ({
  folder,
  sessions,
  selectedSession,
  allFolders,
  onSelectSession,
  onDeleteSession,
  onStarSession,
  onUnstarSession,
  onMoveSession,
  onRenameFolder,
  onDeleteFolder,
  onDropSession,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [expanded, setExpanded] = useState(true);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(folder.name);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setRenameValue(folder.name);
  }, [folder.name]);

  const handleDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes("application/x-chat-session")) {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const sessionId = e.dataTransfer.getData("application/x-chat-session");
    if (sessionId) {
      onDropSession(sessionId, folder.folder_id);
      setExpanded(true);
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDropdown) {
      setShowDropdown(false);
      setDropdownPos(null);
      return;
    }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setDropdownPos({ top: rect.bottom + 4, left: rect.right - 150 });
      setShowDropdown(true);
    }
  };

  useEffect(() => {
    if (!showDropdown) return;
    const close = () => {
      setShowDropdown(false);
      setDropdownPos(null);
    };
    document.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    return () => {
      document.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [showDropdown]);

  const commitRename = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== folder.name) {
      onRenameFolder(folder.folder_id, trimmed);
    } else {
      setRenameValue(folder.name);
    }
    setIsRenaming(false);
  };

  return (
    <div className="mb-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative rounded-xl transition-all ${
          isDragOver
            ? isDashboardThemeEnabled
              ? "bg-accent/20 ring-2 ring-accent"
              : "bg-yellow-400/30 ring-2 ring-[#ffc600]"
            : isDashboardThemeEnabled
              ? "bg-primary-content/8 hover:bg-primary-content/14 border border-primary-content/15"
              : "bg-white/5 hover:bg-white/10 border border-white/15"
        }`}
      >
        <div
          className="flex items-center gap-2 px-3 py-2.5 cursor-pointer"
          onClick={() => !isRenaming && setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-primary-content/80" : "text-white/80"}`} />
          ) : (
            <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-primary-content/80" : "text-white/80"}`} />
          )}
          {expanded ? (
            <FolderOpen className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-accent" : "text-yellow-300"}`} />
          ) : (
            <Folder className={`w-4 h-4 flex-shrink-0 ${isDashboardThemeEnabled ? "text-accent" : "text-yellow-300"}`} />
          )}
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") {
                  setRenameValue(folder.name);
                  setIsRenaming(false);
                }
              }}
              className={`flex-1 min-w-0 text-sm font-bold bg-transparent border-b outline-none ${
                isDashboardThemeEnabled
                  ? "border-primary-content/40 text-primary-content"
                  : "border-white/40 text-white"
              }`}
            />
          ) : (
            <span
              className={`flex-1 min-w-0 truncate text-sm font-bold ${
                isDashboardThemeEnabled ? "text-primary-content" : "text-white"
              }`}
            >
              {folder.name}
            </span>
          )}
          <span
            className={`text-xs flex-shrink-0 px-1.5 py-0.5 rounded ${
              isDashboardThemeEnabled
                ? "bg-primary-content/15 text-primary-content/80"
                : "bg-white/15 text-white/80"
            }`}
          >
            {sessions.length}
          </span>
          <button
            ref={btnRef}
            onClick={toggleDropdown}
            className={`p-1 rounded-md transition-all flex-shrink-0 ${
              isDashboardThemeEnabled
                ? "hover:bg-primary-content/20 text-primary-content"
                : "hover:bg-white/20 text-white"
            }`}
            aria-label="Folder options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {expanded && sessions.length > 0 && (
          <div className="px-2 pb-2 pt-1 space-y-2">
            {sessions.map((session) => (
              <ChatSessionItem
                key={session.id}
                session={session}
                isSelected={selectedSession === session.id}
                isStarred={!!session.starred}
                folders={allFolders}
                onSelect={() => onSelectSession(session.id)}
                onStar={onStarSession ? () => onStarSession(session.id) : undefined}
                onUnstar={() => onUnstarSession(session.id)}
                onDelete={() => onDeleteSession(session.id)}
                onMoveToFolder={(fid) => onMoveSession(session.id, fid)}
              />
            ))}
          </div>
        )}

        {expanded && sessions.length === 0 && (
          <div
            className={`px-3 pb-3 pt-1 text-xs italic ${
              isDashboardThemeEnabled ? "text-primary-content/55" : "text-white/50"
            }`}
          >
            Drag chats here, or use "Move to folder" from the chat menu.
          </div>
        )}
      </div>

      {typeof window !== "undefined" &&
        showDropdown &&
        dropdownPos &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${dropdownPos.top}px`,
              left: `${dropdownPos.left}px`,
              zIndex: 10000,
            }}
            onClick={(e) => e.stopPropagation()}
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className={`rounded-xl shadow-2xl min-w-[160px] overflow-hidden ${
              isDashboardThemeEnabled
                ? "bg-base-100/95 border border-base-300 text-base-content"
                : "bg-gray-900/95 border-2 border-white/20 text-white"
            }`}
          >
            <button
              onClick={() => {
                setIsRenaming(true);
                setShowDropdown(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all ${
                isDashboardThemeEnabled
                  ? "hover:bg-base-200 border-b border-base-300"
                  : "hover:bg-white/20 border-b border-white/10"
              }`}
            >
              <Pencil className="w-4 h-4" /> Rename
            </button>
            <button
              onClick={() => {
                onDeleteFolder(folder.folder_id);
                setShowDropdown(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm font-semibold flex items-center gap-2 transition-all ${
                isDashboardThemeEnabled
                  ? "text-error hover:bg-error/10"
                  : "text-red-300 hover:bg-red-500/30"
              }`}
            >
              <Trash2 className="w-4 h-4" /> Delete folder
            </button>
          </div>,
          document.body
        )}
    </div>
  );
};
