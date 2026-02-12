import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { ChatSessionDropdown } from './ChatSessionDropdown';

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
      const menuHeight = 110; // 2 items
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
    const close = () => { setShowDropdown(false); setDropdownPos(null); };
    document.addEventListener('click', close);
    // Use capture for scroll to catch scroll events in any container
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('click', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [showDropdown]);

  return (
    <div className="relative mb-3 group" onClick={onSelect}>
      {/* Glow effect for selected - Staff theme */}
      {isSelected && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FBEC5D]/30 to-[#F4D03F]/30 rounded-2xl blur-md"></div>
      )}

      {/* Glass session card */}
      <div
        className={`relative cursor-pointer transition-all duration-300 rounded-2xl ${isSelected
            ? "backdrop-blur-xl bg-white/20 shadow-xl border-2 border-white/40"
            : "backdrop-blur-md bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-white/20 hover:shadow-lg"
          }`}
      >
        {/* Inner highlight */}
        <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none rounded-2xl ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          } transition-opacity`}></div>

        <div className="relative p-4 flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 overflow-hidden">
            {/* Title with icon indicator - Staff theme */}
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="relative">
                {isSelected && (
                  <div className="absolute inset-0 bg-[#FBEC5D]/50 rounded-full blur-sm"></div>
                )}
                <div className={`relative w-2.5 h-2.5 rounded-full flex-shrink-0 ${isSelected ? "bg-[#FBEC5D] shadow-lg" : "bg-white/60"
                  } ${isSelected ? "animate-pulse" : ""}`} />
              </div>
              <p className={`text-sm font-bold text-white leading-tight truncate drop-shadow-sm ${isSelected ? "text-white" : "text-white/90"
                }`}>
                {session.title}
              </p>
            </div>

            {/* Last message preview */}
            {session.lastMessage && (
              <p className={`text-xs mt-2 truncate pl-5 italic ${isSelected ? "text-white/80" : "text-white/60"
                }`}>
                {session.lastMessage}
              </p>
            )}
          </div>

          {/* More options button */}
          <div className="relative flex-shrink-0">
            <button
              ref={btnRef}
              onClick={handleToggleDropdown}
              className="p-2 backdrop-blur-md bg-white/10 hover:bg-white/20 rounded-xl transition-all border border-white/20"
              aria-label="More options"
            >
              <MoreVertical className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Dropdown via portal to escape sidebar overflow */}
      {typeof window !== 'undefined' && showDropdown && dropdownPos && createPortal(
        <div
          style={{
            position: 'fixed',
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