import React from "react";
import { createPortal } from "react-dom";
import { Folder, FolderOpen, Calendar, User, Hash } from "lucide-react";
import { Folder as FolderType } from "../../types/types";

interface FolderPropertiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  folder: FolderType | null;
  documentCount?: number;
}

const FolderPropertiesModal: React.FC<FolderPropertiesModalProps> = ({
  isOpen,
  onClose,
  folder,
  documentCount = 0,
}) => {
  if (!isOpen || !folder) return null;

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-sm"
      onClick={(e) => e.stopPropagation()}
      style={{ margin: 0, padding: 0 }}
    >
      <div
        className="rounded-2xl shadow-2xl w-full max-w-4xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)',
          border: '1px solid rgba(34, 139, 34, 0.3)',
          boxShadow: '0 10px 40px 0 rgba(0, 0, 0, 0.3)'
        }}
      >
        <div className="flex justify-between items-center border-b border-white/30 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg backdrop-blur-sm">
              <Folder className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-lg font-semibold text-white/90">Folder Properties</h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/70 hover:text-white/90 hover:bg-white/20 p-1 rounded-lg transition-all text-xl"
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-white/90 flex items-center gap-2 text-lg">

                Basic Information
              </h3>

              <div className="bg-white/10 rounded-lg p-5 space-y-4 hover:bg-white/15 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] backdrop-blur-md border border-white/20">
                <div>
                  <label className="block text-sm font-medium text-white/65">Name</label>
                  <p className="text-base text-white/95 font-semibold">{folder.folder_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/65 mb-2">Path</label>
                  <p className="text-sm text-white/85 font-mono bg-black/20 px-3 py-2 rounded border border-white/20 break-all backdrop-blur-sm">
                    {folder.folder_path}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/65">Type</label>
                  <p className="text-base text-white/90 capitalize">{folder.folder_type}</p>
                </div>
              </div>
            </div>

            {/* Content Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-white/90 flex items-center gap-2 text-lg">
                <FolderOpen className="w-5 h-5 text-white/80" />
                Content & Structure
              </h3>

              <div className="bg-white/10 rounded-lg p-5 hover:bg-white/15 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] backdrop-blur-md border border-white/20">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-1">{documentCount}</div>
                    <label className="block text-sm font-medium text-white/65">Documents</label>
                  </div>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-white/90 mb-1">
                      {folder.parent_folder_id ? `#${folder.parent_folder_id}` : "Root"}
                    </div>
                    <label className="block text-sm font-medium text-white/65">Parent Folder</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Timestamps */}
            <div className="space-y-4">
              <h3 className="font-medium text-white/90 flex items-center gap-2 text-lg">
                <Calendar className="w-5 h-5 text-white/80" />
                Timeline
              </h3>

              <div className="bg-white/10 rounded-lg p-5 space-y-4 hover:bg-white/15 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] backdrop-blur-md border border-white/20">
                <div className="border-l-4 border-green-400 pl-4">
                  <label className="block text-sm font-medium text-white/65">Created</label>
                  <p className="text-base text-white/90 font-medium">{formatDate(folder.created_at)}</p>
                </div>

                <div className="border-l-4 border-green-500 pl-4">
                  <label className="block text-sm font-medium text-white/65">Last Modified</label>
                  <p className="text-base text-white/90 font-medium">{formatDate(folder.updated_at)}</p>
                </div>
              </div>
            </div>

            {/* Creator Information */}
            <div className="space-y-4">
              <h3 className="font-medium text-white/90 flex items-center gap-2 text-lg">
                <User className="w-5 h-5 text-white/80" />
                Creator
              </h3>

              <div className="bg-white/10 rounded-lg p-5 hover:bg-white/15 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] backdrop-blur-md border border-white/20">
                <div className="text-center">
                  {folder.creator ? (
                    <>
                      <div className="text-xl font-bold text-green-400 mb-1">
                        {folder.creator.firstname} {folder.creator.middle_name ? folder.creator.middle_name + ' ' : ''}{folder.creator.lastname}
                      </div>
                      <label className="block text-sm font-medium text-white/65">
                        {folder.creator.email}
                      </label>
                    </>
                  ) : (
                    <>
                      <div className="text-2xl font-bold text-green-400 mb-1">#{folder.created_by}</div>
                      <label className="block text-sm font-medium text-white/65">User ID</label>
                      <label className="block text-xs text-white/50 mt-1">Creator details not loaded</label>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="space-y-4">
              <h3 className="font-medium text-white/90 flex items-center gap-2 text-lg">
                <Hash className="w-5 h-5 text-white/80" />
                Quick Stats
              </h3>

              <div className="bg-white/10 rounded-lg p-5 hover:bg-white/15 transition-all duration-300 hover:shadow-lg transform hover:scale-[1.02] backdrop-blur-md border border-white/20">
                <div className="grid grid-cols-1 gap-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/65">Total Path Length:</span>
                    <span className="font-medium text-white/90">{folder.folder_path.length} characters</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/65">Depth Level:</span>
                    <span className="font-medium text-white/90">{folder.folder_path.split('/').length - 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/65">Has Parent:</span>
                    <span className="font-medium text-white/90">{folder.parent_folder_id ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-white/30 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
          >
            Close
          </button>
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

export default FolderPropertiesModal;