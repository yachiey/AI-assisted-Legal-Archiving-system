import React, { useState } from 'react';
import { RotateCcw, Trash2, X } from 'lucide-react';

interface BulkActionsBarProps {
  selectedCount: number;
  onDelete: () => void;
  onClear: () => void;
}

const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  selectedCount,
  onDelete,
  onClear,
}) => {
  const [loading, setLoading] = useState(false);

  if (selectedCount === 0) return null;


  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-gradient-to-r from-[#228B22] to-[#1a6b1a] rounded-2xl shadow-2xl border border-white/20 p-4">
        <div className="flex items-center gap-4">
          {/* Selected count */}
          <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
            <span className="text-white font-bold text-sm">
              {selectedCount} {selectedCount === 1 ? 'document' : 'documents'} selected
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">

            <button
              onClick={onDelete}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white rounded-lg font-semibold transition-all shadow-md hover:shadow-lg"
              type="button"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>

            <button
              onClick={onClear}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-semibold transition-all"
              type="button"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {loading && (
            <div className="flex items-center gap-2 px-4">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span className="text-white text-sm font-medium">Processing...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkActionsBar;
