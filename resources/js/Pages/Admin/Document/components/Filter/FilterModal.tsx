import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Filter } from "lucide-react";
import { DocumentFilters, Folder } from "../../types/types";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

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
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

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

  const hasActiveFilters = Object.keys(filters).some(
    (key) =>
      filters[key as keyof DocumentFilters] !== undefined &&
      filters[key as keyof DocumentFilters] !== ""
  );

  const fieldClass = `w-full rounded-lg border px-4 py-3 text-sm font-normal shadow-sm focus:outline-none focus:ring-2 ${
    isDashboardThemeEnabled
      ? "border-base-300 bg-base-100 text-base-content focus:border-primary focus:ring-primary/20"
      : "border-gray-300 bg-white text-gray-900 focus:border-green-500 focus:ring-green-500"
  }`;

  const labelClass = `mb-3 block text-sm font-medium ${
    isDashboardThemeEnabled ? "text-base-content/75" : "text-gray-700"
  }`;

  const modalContent = (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      onClick={onClose}
      style={{ margin: 0, padding: 0 }}
    >
      <div
        className={`mx-4 w-full max-w-2xl rounded-xl border p-6 shadow-xl ${
          isDashboardThemeEnabled
            ? "border-base-300 bg-base-100 text-base-content shadow-base-content/15"
            : "border-gray-200 bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`mb-6 flex items-center justify-between border-b pb-4 ${
            isDashboardThemeEnabled ? "border-base-300" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`rounded-lg p-2 ${
                isDashboardThemeEnabled ? "bg-primary/10" : "bg-blue-50"
              }`}
            >
              <Filter
                className={`h-6 w-6 ${
                  isDashboardThemeEnabled ? "text-primary" : "text-blue-600"
                }`}
              />
            </div>
            <h2
              className={`text-xl font-bold ${
                isDashboardThemeEnabled ? "text-base-content" : "text-gray-900"
              }`}
            >
              Filter Documents
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 transition-all ${
              isDashboardThemeEnabled
                ? "text-base-content/55 hover:bg-base-200 hover:text-base-content"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={filters.status || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  status: e.target.value || undefined,
                })
              }
              className={fieldClass}
            >
              <option value="">Active Documents</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Folder</label>
            <select
              value={filters.folder_id || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  folder_id: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className={fieldClass}
            >
              <option value="">All Folders</option>
              {folders.map((folder) => (
                <option key={folder.folder_id} value={folder.folder_id}>
                  {folder.folder_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelClass}>Year Created</label>
            <select
              value={filters.year || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  year: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              className={fieldClass}
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

        <div
          className={`mt-8 flex justify-between border-t pt-6 ${
            isDashboardThemeEnabled ? "border-base-300" : "border-gray-200"
          }`}
        >
          <button
            onClick={handleClearFilters}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
              isDashboardThemeEnabled
                ? "text-base-content/65 hover:bg-base-200 hover:text-base-content"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            }`}
            disabled={!hasActiveFilters}
          >
            Clear All Filters
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className={`rounded-lg border px-5 py-2.5 font-medium transition-all duration-200 ${
                isDashboardThemeEnabled
                  ? "border-base-300 text-base-content/70 hover:bg-base-200 hover:text-base-content"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              Cancel
            </button>
            <button
              onClick={handleApplyFilters}
              className={`rounded-lg px-5 py-2.5 font-medium transition-all duration-200 shadow-sm hover:shadow-md ${
                isDashboardThemeEnabled
                  ? "bg-primary text-primary-content hover:bg-primary/90"
                  : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
              }`}
            >
              Apply Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  if (typeof window !== "undefined" && window.document?.body) {
    return createPortal(modalContent, window.document.body);
  }

  return null;
};

export default FilterModal;
