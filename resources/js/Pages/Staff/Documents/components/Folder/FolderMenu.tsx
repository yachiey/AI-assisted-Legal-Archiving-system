// FolderMenu.tsx
import React from "react";
import { Edit2, Trash2, Info } from "lucide-react";

interface FolderMenuProps {
  onRename: () => void;
  onDelete: () => void;
  onProperties: () => void;
}

const FolderMenu: React.FC<FolderMenuProps> = ({ onRename, onDelete, onProperties }) => {
  const handleMenuClick = (e: React.MouseEvent, action: () => void) => {
    e.preventDefault();
    e.stopPropagation();
    action();
  };

  return (
    <div
      className="absolute right-0 mt-2 w-40 rounded-xl shadow-lg z-50 overflow-hidden"
      style={{
        background: 'white',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 10px 40px 0 rgba(100, 116, 139, 0.2)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <ul className="py-1 text-sm">
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onProperties)}
            className="w-full text-left px-4 py-2 hover:bg-white/30 flex items-center gap-2 text-gray-900 hover:text-[#228B22] transition-all font-medium"
          >
            <Info className="w-4 h-4" />
            Properties
          </button>
        </li>
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onRename)}
            className="w-full text-left px-4 py-2 hover:bg-white/30 flex items-center gap-2 text-gray-900 hover:text-[#228B22] transition-all font-medium"
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </button>
        </li>
        <li>
          <button
            onClick={(e) => handleMenuClick(e, onDelete)}
            className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 hover:text-red-700 flex items-center gap-2 transition-all font-medium"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </li>
      </ul>
    </div>
  );
};

export default FolderMenu;
