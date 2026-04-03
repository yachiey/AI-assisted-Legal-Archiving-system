import React, { useState } from "react";
import { createPortal } from "react-dom";
import { folderService } from "../../services/folderService";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

interface AddFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (folderName: string) => void;
  parentFolderId?: number | null;
}

const AddFolderModal: React.FC<AddFolderModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  parentFolderId = null,
}) => {
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { theme } = useDashboardTheme("staff");
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await folderService.createFolder({
        folder_name: folderName,
        folder_path: `/uploads/${folderName}`,
        folder_type: "regular",
        parent_folder_id: parentFolderId,
      });

      setFolderName("");
      onClose();

      if (onCreate) {
        onCreate(response.folder_name);
      }
    } catch (err: any) {
      console.error(err);

      if (err.response?.status === 422) {
        const errors = err.response.data.errors;
        setError(Object.values(errors).flat().join(" "));
      } else if (err.response?.status === 401) {
        setError("Unauthorized. Please login again.");
      } else {
        setError("Failed to create folder. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const modalContent = (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-sm"
      style={{ margin: 0, padding: 0 }}
    >
      <div
        className={`mx-4 w-full max-w-md rounded-xl border p-6 shadow-xl ${
          isDashboardThemeEnabled
            ? "border-base-300 bg-base-100 text-base-content shadow-base-content/15"
            : "border-gray-200 bg-white"
        }`}
      >
        <div
          className={`flex items-center justify-between border-b pb-4 ${
            isDashboardThemeEnabled ? "border-base-300" : "border-gray-200"
          }`}
        >
          <h2
            className={`text-lg font-bold ${
              isDashboardThemeEnabled ? "text-base-content" : "text-gray-900"
            }`}
          >
            {parentFolderId ? "Create Subfolder" : "Create New Folder"}
          </h2>
          <button
            onClick={onClose}
            className={`rounded-lg p-1 text-xl leading-none transition-all ${
              isDashboardThemeEnabled
                ? "text-base-content/55 hover:bg-base-200 hover:text-base-content"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            }`}
            disabled={loading}
            aria-label="Close add folder modal"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div
              className={`rounded-lg border p-3 text-sm font-medium ${
                isDashboardThemeEnabled
                  ? "border-error/25 bg-error/10 text-error"
                  : "border-red-200 bg-red-50 text-red-700"
              }`}
            >
              {error}
            </div>
          )}

          <div>
            <label
              className={`mb-2 block text-sm font-medium ${
                isDashboardThemeEnabled
                  ? "text-base-content/75"
                  : "text-gray-700"
              }`}
            >
              Folder Name
            </label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className={`block w-full rounded-lg border px-4 py-3 text-sm font-normal shadow-sm focus:outline-none focus:ring-2 ${
                isDashboardThemeEnabled
                  ? "border-base-300 bg-base-100 text-base-content placeholder:text-base-content/40 focus:border-primary focus:ring-primary/25"
                  : "border-gray-300 bg-white text-gray-900 placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500"
              }`}
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`rounded-lg border px-5 py-2.5 font-medium transition-all duration-200 ${
                isDashboardThemeEnabled
                  ? "border-base-300 text-base-content/70 hover:bg-base-200 hover:text-base-content"
                  : "border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`rounded-lg px-5 py-2.5 font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 ${
                isDashboardThemeEnabled
                  ? "bg-primary text-primary-content hover:bg-primary/90"
                  : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
              }`}
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  if (typeof window !== "undefined" && window.document?.body) {
    return createPortal(modalContent, window.document.body);
  }

  return null;
};

export default AddFolderModal;

