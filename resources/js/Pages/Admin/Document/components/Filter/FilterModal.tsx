import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Filter } from "lucide-react";
import { DocumentFilters, Folder } from "../../types/types";

interface FilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyFilters: (filters: DocumentFilters) => void;
  currentFilters: DocumentFilters;
  folders: Folder[];
}

const FilterModal: React.FC<FilterModalProps> = ({
  isOpen,
  onClose,
  onApplyFilters,
  currentFilters,
  folders,
}) => {
  const [filters, setFilters] = useState<DocumentFilters>(currentFilters);

  useEffect(() => {
    if (isOpen) {
      setFilters(currentFilters);
    }
  }, [isOpen, currentFilters]);

  if (!isOpen) return null;

  const handleApplyFilters = () => {
    onApplyFilters(filters);
    onClose();
  };

  const handleClearFilters = () => {
    const emptyFilters: DocumentFilters = {};
    setFilters(emptyFilters);
    onApplyFilters(emptyFilters);
    onClose();
  };


  const hasActiveFilters = Object.keys(currentFilters).some(key =>
    currentFilters[key as keyof DocumentFilters] !== undefined &&
    currentFilters[key as keyof DocumentFilters] !== ''
  );

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-sm"
      onClick={onClose}
      style={{ margin: 0, padding: 0 }}
    >
      <div
        className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-2xl mx-4 p-6 transform transition-all duration-300 scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b border-gray-200 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Filter className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Filter Documents</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-lg transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value || undefined
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white text-gray-900 font-normal shadow-sm"
            >
              <option value="">Active Documents</option>
            </select>
          </div>

          {/* Folder Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Folder
            </label>
            <select
              value={filters.folder_id || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  folder_id: e.target.value ? Number(e.target.value) : undefined
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white text-gray-900 font-normal shadow-sm"
            >
              <option value="">All Folders</option>
              {folders.map((folder) => (
                <option key={folder.folder_id} value={folder.folder_id}>
                  {folder.folder_name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Year Created
            </label>
            <select
              value={filters.year || ''}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year: e.target.value ? Number(e.target.value) : undefined
                })
              }
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white text-gray-900 font-normal shadow-sm"
            >
              <option value="">All Years</option>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div className="flex justify-between pt-6 border-t border-gray-200 mt-8">
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!hasActiveFilters}
          >
            Clear All Filters
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 border border-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Only render portal if DOM document.body is available
  if (typeof window !== 'undefined' && window.document?.body) {
    return createPortal(modalContent, window.document.body);
  }

  return null;
};

export default FilterModal;