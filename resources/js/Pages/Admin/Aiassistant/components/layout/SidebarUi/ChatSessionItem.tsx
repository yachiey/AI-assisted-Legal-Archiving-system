import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { MoreVertical } from "lucide-react";
import { ChatSessionDropdown } from "./ChatSessionDropdown";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../../hooks/useDashboardTheme";

interface ChatSession {
  id: string;
  title: string;
  lastMessage?: string;
}

interface ChatSessionItemProps {
  session: ChatSession;
  isSelected: boolean;
  isStarred: boolean;
  onSelect: () => void;
  onStar?: () => void;
  onUnstar?: () => void;
  onDelete: () => void;
}

export const ChatSessionItem: React.FC<ChatSessionItemProps> = ({
  session,
  isSelected,
  isStarred,
  onSelect,
  onStar,
  onUnstar,
  onDelete,
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (showDropdown) {
      setShowDropdown(false);
      setDropdownPos(null);
      return;
    }

    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = 110;
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;

      setDropdownPos({
        top: spaceBelow < menuHeight ? rect.top - menuHeight : rect.bottom + 4,
        left: rect.right - 130,
      });
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

  return (
    <div className="relative mb-3 group" onClick={onSelect}>
      {isSelected && (
        <div
          className={`absolute -inset-0.5 rounded-2xl blur-md ${
            isDashboardThemeEnabled
              ? "bg-gradient-to-r from-secondary/30 to-accent/30"
              : "bg-gradient-to-r from-[#FBEC5D]/30 to-[#F4D03F]/30"
          }`}
        />
      )}

      <div
        className={`relative cursor-pointer transition-all duration-300 rounded-2xl ${
          isSelected
            ? isDashboardThemeEnabled
              ? "bg-base-100/95 shadow-xl border-2 border-base-100"
              : "backdrop-blur-xl bg-white/20 shadow-xl border-2 border-white/40"
            : isDashboardThemeEnabled
              ? "backdrop-blur-md bg-primary-content/10 hover:bg-primary-content/16 border-2 border-primary-content/10 hover:border-primary-content/20 hover:shadow-lg"
              : "backdrop-blur-md bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20 hover:shadow-lg"
        }`}
      >
        <div
          className={`absolute inset-0 pointer-events-none rounded-2xl transition-opacity ${
            isDashboardThemeEnabled
              ? "bg-gradient-to-br from-primary-content/10 to-transparent"
              : "bg-gradient-to-br from-white/10 to-transparent"
          } ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
        />

        <div className="relative p-4 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="relative">
                {isSelected && (
                  <div
                    className={`absolute inset-0 rounded-full blur-sm ${
                      isDashboardThemeEnabled ? "bg-secondary/50" : "bg-[#FBEC5D]/50"
                    }`}
                  />
                )}
                <div
                  className={`relative w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                    isSelected
                      ? isDashboardThemeEnabled
                        ? "bg-secondary shadow-lg"
                        : "bg-[#FBEC5D] shadow-lg"
                      : isDashboardThemeEnabled
                        ? "bg-primary-content/60"
                        : "bg-white/60"
                  } ${isSelected ? "animate-pulse" : ""}`}
                />
              </div>
              <p
                className={`text-sm font-bold leading-tight truncate drop-shadow-sm ${
                  isSelected
                    ? isDashboardThemeEnabled
                      ? "text-base-content"
                      : "text-white"
                    : isDashboardThemeEnabled
                      ? "text-primary-content/90"
                      : "text-white/90"
                }`}
              >
                {session.title}
              </p>
            </div>

            {session.lastMessage && (
              <p
                className={`text-xs mt-2 truncate pl-5 italic ${
                  isSelected
                    ? isDashboardThemeEnabled
                      ? "text-base-content/65"
                      : "text-white/80"
                    : isDashboardThemeEnabled
                      ? "text-primary-content/65"
                      : "text-white/60"
                }`}
              >
                {session.lastMessage}
              </p>
            )}
          </div>

          <div className="relative flex-shrink-0">
            <button
              ref={btnRef}
              onClick={handleToggleDropdown}
              className={`p-2 rounded-xl transition-all border ${
                isDashboardThemeEnabled
                  ? isSelected
                    ? "bg-base-200 hover:bg-base-300/70 border-base-300 text-base-content"
                    : "backdrop-blur-md bg-primary-content/10 hover:bg-primary-content/20 border-primary-content/15 text-primary-content"
                  : "backdrop-blur-md bg-white/10 hover:bg-white/20 border-white/20"
              }`}
              aria-label="More options"
            >
              <MoreVertical
                className={`w-4 h-4 ${
                  isDashboardThemeEnabled
                    ? isSelected
                      ? "text-base-content"
                      : "text-primary-content"
                    : "text-white"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {typeof window !== "undefined" && showDropdown && dropdownPos && createPortal(
        <div
          style={{
            position: "fixed",
            top: `${dropdownPos.top}px`,
            left: `${dropdownPos.left}px`,
            zIndex: 10000,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <ChatSessionDropdown
            isStarred={isStarred}
            onStar={onStar}
            onUnstar={onUnstar}
            onDelete={onDelete}
            onClose={() => setShowDropdown(false)}
          />
        </div>,
        document.body
      )}
    </div>
  );
};
