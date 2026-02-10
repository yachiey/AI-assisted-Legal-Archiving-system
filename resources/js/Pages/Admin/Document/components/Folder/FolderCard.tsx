// FolderCard.tsx
import React, { useState, useEffect } from "react";
import { Folder, MoreVertical, ChevronDown, ChevronUp, FileText } from "lucide-react";
import { FolderCardProps, Document } from "../../types/types";
import FolderMenu from "./FolderMenu";
import DocumentMenu from "../MainDoc/DocumentMenu";
import RenameFolderModal from "./RenameFolderModal";
import DeleteFolderDialog from "./DeleteFolderDialog";
import FolderPropertiesModal from "./FolderPropertiesModal";
import folderService from "../../services/folderService";
import realDocumentService from "../../services/realDocumentService";

const FolderCard: React.FC<FolderCardProps> = ({
  folder,
  onFolderClick,
  documentCount,
  onFolderUpdated,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDocMenuId, setOpenDocMenuId] = useState<number | null>(null);
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [propertiesModalOpen, setPropertiesModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  // Load documents for this folder
  const loadFolderDocuments = async (): Promise<void> => {
    if (loadingDocs) return;

    setLoadingDocs(true);
    try {
      const folderDocs = await realDocumentService.getDocumentsByFolder(folder.folder_id);
      setDocuments(folderDocs);
    } catch (error) {
      console.error('Error loading folder documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Handle expand/collapse toggle
  const handleExpandToggle = (event: React.MouseEvent): void => {
    event.stopPropagation();
    if (!isExpanded && documents.length === 0) {
      loadFolderDocuments();
    }
    setIsExpanded(!isExpanded);
  };

  const handleCardClick = (): void => {
    setIsClicked(true);
    onFolderClick(folder);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation(); // Prevent folder click when clicking menu
    setMenuOpen((prev) => !prev); // toggle menu
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle folder operations
  const handleRename = async (newName: string): Promise<void> => {
    try {
      await folderService.updateFolder(folder.folder_id, {
        folder_name: newName,
      });
      if (onFolderUpdated) {
        onFolderUpdated();
      }
    } catch (error) {
      throw new Error("Failed to rename folder. Please try again.");
    }
  };

  const handleDelete = async (): Promise<void> => {
    try {
      await folderService.deleteFolder(folder.folder_id);
      if (onFolderUpdated) {
        onFolderUpdated();
      }
    } catch (error) {
      throw new Error("Failed to delete folder. Please try again.");
    }
  };

  const handleMenuAction = (action: string): void => {
    setMenuOpen(false);

    switch (action) {
      case 'rename':
        setRenameModalOpen(true);
        break;
      case 'delete':
        setDeleteDialogOpen(true);
        break;
      case 'properties':
        setPropertiesModalOpen(true);
        break;
    }
  };

  const handleDocumentMenuClick = (e: React.MouseEvent, docId: number): void => {
    e.stopPropagation();
    setOpenDocMenuId(openDocMenuId === docId ? null : docId);
  };

  const handleDocumentMenuAction = (action: string, document: Document): void => {
    setOpenDocMenuId(null);

    switch (action) {
      case 'properties':
        console.log('Show properties for document:', document.title);
        // TODO: Open document properties modal
        break;
      case 'edit':
        console.log('Edit document:', document.title);
        // TODO: Open document edit modal
        break;
      case 'delete':
        console.log('Delete document:', document.title);
        // TODO: Open document delete confirmation
        break;
    }
  };



  if (isClicked) {
    return null;
  }

  return (
    <div className="relative group h-full">
      {/* Animated glow effect on hover */}
      <div className="absolute -inset-0.5 bg-gradient-to-r from-[#228B22] via-[#FBEC5D] to-[#228B22] rounded-2xl opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500"></div>

      <div
        className={`relative h-full bg-gradient-to-br from-[#228B22] to-[#1a6b1a] rounded-2xl p-6 border border-white/10 hover:border-white/20 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ${isExpanded ? 'shadow-2xl scale-[1.02]' : ''
          }`}
      >
        {/* Folder Header - Click to navigate */}
        <div
          className="cursor-pointer"
          onClick={handleCardClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleCardClick();
            }
          }}
        >
          <div className="flex items-start justify-between mb-4 gap-2">
            <div className="flex items-start gap-4 min-w-0 flex-1">
              {/* Modern folder icon with gradient and shine */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-[#FBEC5D]/30 rounded-2xl blur-md group-hover:blur-lg transition-all"></div>
                <div className="relative p-3 bg-gradient-to-br from-white/20 to-white/5 rounded-2xl backdrop-blur-sm border border-white/10 group-hover:border-[#FBEC5D]/50 transition-all transform group-hover:scale-110 group-hover:rotate-3">
                  {/* Inner shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl opacity-50"></div>
                  <Folder className="w-7 h-7 text-[#FBEC5D] relative z-10 drop-shadow-lg" strokeWidth={2.5} />
                </div>
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className="text-base font-bold text-white group-hover:text-[#FBEC5D] transition-all break-words leading-snug" style={{
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: '0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)'
                }} title={folder.folder_name}>
                  {folder.folder_name}
                </h3>
                <p className="text-xs text-white/80 truncate font-medium mt-1" style={{
                  textShadow: '0 1px 3px rgba(0,0,0,0.3)'
                }} title={folder.folder_path}>
                  {folder.folder_path}
                </p>
              </div>
            </div>
            <div className={`flex items-start gap-2 flex-shrink-0 transition-all duration-300 ${menuOpen ? 'w-auto' : 'w-0 group-hover:w-auto overflow-hidden'}`}>
              {/* Expand/Collapse Button - Modern glass effect */}
              {/* Expand/Collapse Button - Removed as requested */}
              {/*
            <button
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-110"
              onClick={handleExpandToggle}
              type="button"
              aria-label={isExpanded ? "Collapse" : "Expand"}
              title={isExpanded ? "Hide contents" : "Show contents"}
            >
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-[#FBEC5D]" strokeWidth={2.5} />
              ) : (
                <ChevronDown className="w-4 h-4 text-white" strokeWidth={2.5} />
              )}
            </button>
            */}
              {/* Menu Button */}
              <div className="relative z-50">
                <button
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all backdrop-blur-sm shadow-lg hover:shadow-xl transform hover:scale-110"
                  onClick={handleMenuClick}
                  type="button"
                  aria-label={`More options for ${folder.folder_name}`}
                >
                  <MoreVertical className="w-4 h-4 text-white" strokeWidth={2.5} />
                </button>
                {menuOpen && (
                  <FolderMenu
                    onRename={() => handleMenuAction('rename')}
                    onDelete={() => handleMenuAction('delete')}
                    onProperties={() => handleMenuAction('properties')}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modern stats section with badges */}
        <div className="flex justify-between items-center gap-3 mb-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-full backdrop-blur-sm border border-white/10">
            <div className="w-1.5 h-1.5 bg-[#FBEC5D] rounded-full animate-pulse"></div>
            <span className="text-xs font-bold text-white/90">
              {documentCount} {documentCount === 1 ? "Document" : "Documents"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-white/60 font-medium" title={`Last updated: ${folder.updated_at}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(folder.updated_at)}
          </div>
        </div>

        {/* Expandable Documents Section */}
        {isExpanded && (
          <div className="border-t border-white/20 mt-4 pt-4 animate-in slide-in-from-top duration-300">
            <div className="relative bg-gradient-to-br from-white/15 to-white/5 backdrop-blur-md rounded-2xl p-5 border border-white/20 shadow-inner">
              {/* Decorative gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent rounded-2xl pointer-events-none"></div>

              <div className="relative">
                <h4 className="text-sm font-black text-white mb-4 flex items-center gap-2 uppercase tracking-wider">
                  <div className="p-1.5 bg-[#FBEC5D]/20 rounded-lg">
                    <FileText className="w-4 h-4 text-[#FBEC5D]" strokeWidth={2.5} />
                  </div>
                  Documents
                </h4>

                {loadingDocs ? (
                  <div className="flex items-center justify-center py-3">
                    <div className="animate-spin rounded-full h-3 w-3 border border-white border-t-transparent"></div>
                    <span className="ml-2 text-xs text-white/80 font-normal">Loading documents...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className="text-center py-4 text-xs text-white/60 font-light">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-white/40" />
                    No documents found in this folder
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto overflow-x-visible pr-1">
                    {documents.map((document) => (
                      <div
                        key={document.doc_id}
                        className="group/doc relative"
                      >
                        {/* Hover glow effect */}
                        <div className="absolute -inset-0.5 bg-gradient-to-r from-[#FBEC5D]/20 to-transparent rounded-xl opacity-0 group-hover/doc:opacity-100 blur-sm transition-all"></div>

                        <div
                          className="relative flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-[#FBEC5D]/30 transition-all cursor-pointer transform hover:scale-[1.02] shadow-sm hover:shadow-md"
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Document clicked:', document.title);
                          }}
                        >
                          {/* Document icon with background */}
                          <div className="flex-shrink-0 p-2 bg-[#FBEC5D]/10 rounded-lg">
                            <FileText className="w-4 h-4 text-[#FBEC5D]" strokeWidth={2.5} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover/doc:text-[#FBEC5D] transition-colors">
                              {document.title}
                            </p>
                            <div className="flex items-center gap-2 text-xs text-white/70 mt-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${document.status === 'active' ? 'bg-[#FBEC5D]/20 text-[#FBEC5D]' :
                                document.status === 'draft' ? 'bg-yellow-500/20 text-yellow-200' :
                                  'bg-blue-500/20 text-blue-200'
                                }`}>
                                {document.status}
                              </span>
                              <span className="font-medium">{formatDate(document.created_at)}</span>
                            </div>
                          </div>

                          <div className={`flex-shrink-0 transition-opacity ${openDocMenuId === document.doc_id ? 'opacity-100' : 'opacity-0 group-hover/doc:opacity-100'}`}>
                            <div className="relative z-50">
                              <button
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 border border-white/10 transition-all"
                                onClick={(e) => handleDocumentMenuClick(e, document.doc_id)}
                                title="More options"
                                type="button"
                              >
                                <MoreVertical className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                              </button>
                              {openDocMenuId === document.doc_id && (
                                <DocumentMenu
                                  onProperties={() => handleDocumentMenuAction('properties', document)}
                                  onEdit={() => handleDocumentMenuAction('edit', document)}
                                  onDelete={() => handleDocumentMenuAction('delete', document)} onDownload={function (): void {
                                    throw new Error("Function not implemented.");
                                  }} />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Modals */}
        <RenameFolderModal
          isOpen={renameModalOpen}
          onClose={() => setRenameModalOpen(false)}
          onRename={handleRename}
          folder={folder}
        />

        <DeleteFolderDialog
          isOpen={deleteDialogOpen}
          onClose={() => setDeleteDialogOpen(false)}
          onDelete={handleDelete}
          folder={folder}
        />

        <FolderPropertiesModal
          isOpen={propertiesModalOpen}
          onClose={() => setPropertiesModalOpen(false)}
          folder={folder}
          documentCount={documentCount}
        />

      </div>
    </div>
  );
};

export default FolderCard;
