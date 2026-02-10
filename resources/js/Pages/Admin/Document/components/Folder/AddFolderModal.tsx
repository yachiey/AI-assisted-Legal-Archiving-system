import React, { useState } from "react";
import { createPortal } from "react-dom";
import { folderService } from "../../services/folderService";

interface AddFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate?: (folderName: string) => void;
  parentFolderId?: number | null; // Add parent folder ID prop
}

const AddFolderModal: React.FC<AddFolderModalProps> = ({ isOpen, onClose, onCreate, parentFolderId = null }) => {
  const [folderName, setFolderName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    setLoading(true);
    setError("");

    try {
      const response = await folderService.createFolder({
        folder_name: folderName,
        folder_path: `/uploads/${folderName}`, // backend will set actual path
        folder_type: "regular",
        parent_folder_id: parentFolderId, // Use parent folder ID
      });

      // Clear form and close modal
      setFolderName("");
      onClose();

      // Call onCreate callback to refresh parent component
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
      className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-sm"
      style={{ margin: 0, padding: 0 }}
    >
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 w-full max-w-md p-6 mx-4">
        <div className="flex justify-between items-center border-b border-gray-200 pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {parentFolderId ? 'Create Subfolder' : 'Create New Folder'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 p-1 rounded-lg transition-all"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm font-medium border border-red-200">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Folder Name</label>
            <input
              type="text"
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="Enter folder name"
              className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 focus:outline-none bg-white text-gray-900 placeholder-gray-400 font-normal shadow-sm"
              required
              disabled={loading}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 border border-gray-300"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 font-medium transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Render modal using portal to bypass parent overflow constraints
  // Only render portal if DOM document.body is available
  if (typeof window !== 'undefined' && window.document?.body) {
    return createPortal(modalContent, window.document.body);
  }

  return null;
};

export default AddFolderModal;
