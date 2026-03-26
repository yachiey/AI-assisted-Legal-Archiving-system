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
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

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
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

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
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="relative group h-full"
    >
      {/* Animated glow effect on hover */}
      <div
        className={`absolute -inset-0.5 rounded-2xl opacity-0 blur-xl transition-all duration-500 ${
          isDashboardThemeEnabled ? "group-hover:opacity-45" : "group-hover:opacity-30"
        }`}
        style={{
          background: isDashboardThemeEnabled
            ? "linear-gradient(90deg, oklch(var(--p) / 0.55), oklch(var(--s) / 0.4), oklch(var(--p) / 0.55))"
            : "linear-gradient(90deg, #228B22, #FBEC5D, #228B22)",
        }}
      ></div>

      <div
        className={`relative h-full rounded-2xl p-6 transition-all duration-300 transform hover:-translate-y-1 ${
          isDashboardThemeEnabled
            ? "border border-base-300/80 bg-base-100/95 shadow-xl shadow-base-content/5 hover:border-primary/35 hover:shadow-2xl hover:shadow-primary/10"
            : "border border-white/10 bg-gradient-to-br from-[#228B22] to-[#1a6b1a] shadow-lg hover:border-white/20 hover:shadow-2xl"
        } ${isExpanded ? 'shadow-2xl scale-[1.02]' : ''}`}
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
                <div
                  className={`absolute inset-0 rounded-2xl blur-md transition-all group-hover:blur-lg ${
                    isDashboardThemeEnabled ? "bg-primary/20" : "bg-[#FBEC5D]/30"
                  }`}
                ></div>
                <div
                  className={`relative rounded-2xl border p-3 backdrop-blur-sm transition-all transform group-hover:scale-110 group-hover:rotate-3 ${
                    isDashboardThemeEnabled
                      ? "border-base-300/80 bg-base-200/85 group-hover:border-primary/35"
                      : "border-white/10 bg-gradient-to-br from-white/20 to-white/5 group-hover:border-[#FBEC5D]/50"
                  }`}
                >
                  {/* Inner shine effect */}
                  <div
                    className={`absolute inset-0 rounded-2xl opacity-50 ${
                      isDashboardThemeEnabled
                        ? "bg-gradient-to-br from-white/10 to-transparent"
                        : "bg-gradient-to-br from-white/30 to-transparent"
                    }`}
                  ></div>
                  <Folder
                    className={`relative z-10 h-7 w-7 drop-shadow-lg ${
                      isDashboardThemeEnabled ? "text-primary" : "text-[#FBEC5D]"
                    }`}
                    strokeWidth={2.5}
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1 overflow-hidden">
                <h3 className={`text-base font-bold transition-all break-words leading-snug ${
                  isDashboardThemeEnabled
                    ? "text-base-content group-hover:text-primary"
                    : "text-white group-hover:text-[#FBEC5D]"
                }`} style={{
                  wordBreak: 'break-word',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textShadow: isDashboardThemeEnabled
                    ? 'none'
                    : '0 2px 8px rgba(0,0,0,0.3), 0 1px 2px rgba(0,0,0,0.4)'
                }} title={folder.folder_name}>
                  {folder.folder_name}
                </h3>
                <p className={`mt-1 truncate text-xs font-medium ${
                  isDashboardThemeEnabled ? "text-base-content/60" : "text-white/80"
                }`} style={{
                  textShadow: isDashboardThemeEnabled ? 'none' : '0 1px 3px rgba(0,0,0,0.3)'
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
                  className={`rounded-xl border p-2 backdrop-blur-sm shadow-lg transition-all transform hover:scale-110 hover:shadow-xl ${
                    isDashboardThemeEnabled
                      ? "border-base-300/80 bg-base-200/80 hover:border-primary/35 hover:bg-base-200"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/15"
                  }`}
                  onClick={handleMenuClick}
                  type="button"
                  aria-label={`More options for ${folder.folder_name}`}
                >
                  <MoreVertical
                    className={`h-4 w-4 ${isDashboardThemeEnabled ? "text-base-content" : "text-white"}`}
                    strokeWidth={2.5}
                  />
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
          <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 backdrop-blur-sm ${
            isDashboardThemeEnabled
              ? "border-base-300/80 bg-base-200/85"
              : "border-white/10 bg-white/10"
          }`}>
            <div className={`h-1.5 w-1.5 rounded-full animate-pulse ${
              isDashboardThemeEnabled ? "bg-primary" : "bg-[#FBEC5D]"
            }`}></div>
            <span className={`text-xs font-bold ${
              isDashboardThemeEnabled ? "text-base-content" : "text-white/90"
            }`}>
              {documentCount} {documentCount === 1 ? "Document" : "Documents"}
            </span>
          </div>
          <div className={`flex items-center gap-2 text-xs font-medium ${
            isDashboardThemeEnabled ? "text-base-content/60" : "text-white/60"
          }`} title={`Last updated: ${folder.updated_at}`}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {formatDate(folder.updated_at)}
          </div>
        </div>

        {/* Expandable Documents Section */}
        {isExpanded && (
          <div className={`mt-4 border-t pt-4 animate-in slide-in-from-top duration-300 ${
            isDashboardThemeEnabled ? "border-base-300/80" : "border-white/20"
          }`}>
            <div className={`relative rounded-2xl p-5 backdrop-blur-md shadow-inner ${
              isDashboardThemeEnabled
                ? "border border-base-300/80 bg-base-200/80"
                : "border border-white/20 bg-gradient-to-br from-white/15 to-white/5"
            }`}>
              {/* Decorative gradient overlay */}
              <div className={`absolute inset-0 rounded-2xl pointer-events-none ${
                isDashboardThemeEnabled
                  ? "bg-gradient-to-br from-primary/5 to-transparent"
                  : "bg-gradient-to-br from-white/10 to-transparent"
              }`}></div>

              <div className="relative">
                <h4 className={`mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider ${
                  isDashboardThemeEnabled ? "text-base-content" : "text-white"
                }`}>
                  <div className={`rounded-lg p-1.5 ${
                    isDashboardThemeEnabled ? "bg-primary/10" : "bg-[#FBEC5D]/20"
                  }`}>
                    <FileText className={`h-4 w-4 ${
                      isDashboardThemeEnabled ? "text-primary" : "text-[#FBEC5D]"
                    }`} strokeWidth={2.5} />
                  </div>
                  Documents
                </h4>

                {loadingDocs ? (
                  <div className="flex items-center justify-center py-3">
                    <div className={`h-3 w-3 animate-spin rounded-full border border-t-transparent ${
                      isDashboardThemeEnabled ? "border-primary" : "border-white"
                    }`}></div>
                    <span className={`ml-2 text-xs font-normal ${
                      isDashboardThemeEnabled ? "text-base-content/70" : "text-white/80"
                    }`}>Loading documents...</span>
                  </div>
                ) : documents.length === 0 ? (
                  <div className={`py-4 text-center text-xs font-light ${
                    isDashboardThemeEnabled ? "text-base-content/60" : "text-white/60"
                  }`}>
                    <FileText className={`mx-auto mb-2 h-8 w-8 ${
                      isDashboardThemeEnabled ? "text-base-content/35" : "text-white/40"
                    }`} />
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
                        <div
                          className="absolute -inset-0.5 rounded-xl opacity-0 blur-sm transition-all group-hover/doc:opacity-100"
                          style={{
                            background: isDashboardThemeEnabled
                              ? "linear-gradient(90deg, oklch(var(--p) / 0.16), transparent)"
                              : "linear-gradient(90deg, rgba(251, 236, 93, 0.2), transparent)",
                          }}
                        ></div>

                        <div
                          className={`relative flex cursor-pointer items-center gap-3 rounded-xl border p-3 shadow-sm transition-all transform hover:scale-[1.02] hover:shadow-md ${
                            isDashboardThemeEnabled
                              ? "border-base-300/75 bg-base-100/85 hover:border-primary/35 hover:bg-base-100"
                              : "border-white/10 bg-white/5 hover:border-[#FBEC5D]/30 hover:bg-white/15"
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            console.log('Document clicked:', document.title);
                          }}
                        >
                          {/* Document icon with background */}
                          <div className={`shrink-0 rounded-lg p-2 ${
                            isDashboardThemeEnabled ? "bg-primary/10" : "bg-[#FBEC5D]/10"
                          }`}>
                            <FileText className={`h-4 w-4 ${
                              isDashboardThemeEnabled ? "text-primary" : "text-[#FBEC5D]"
                            }`} strokeWidth={2.5} />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className={`truncate text-sm font-bold transition-colors ${
                              isDashboardThemeEnabled
                                ? "text-base-content group-hover/doc:text-primary"
                                : "text-white group-hover/doc:text-[#FBEC5D]"
                            }`}>
                              {document.title}
                            </p>
                            <div className={`mt-1 flex items-center gap-2 text-xs ${
                              isDashboardThemeEnabled ? "text-base-content/65" : "text-white/70"
                            }`}>
                              <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                                document.status === 'active'
                                  ? isDashboardThemeEnabled
                                    ? 'bg-success/15 text-success'
                                    : 'bg-[#FBEC5D]/20 text-[#FBEC5D]'
                                  : document.status === 'draft'
                                    ? isDashboardThemeEnabled
                                      ? 'bg-warning/15 text-warning'
                                      : 'bg-yellow-500/20 text-yellow-200'
                                    : isDashboardThemeEnabled
                                      ? 'bg-info/15 text-info'
                                      : 'bg-blue-500/20 text-blue-200'
                              }`}>
                                {document.status}
                              </span>
                              <span className="font-medium">{formatDate(document.created_at)}</span>
                            </div>
                          </div>

                          <div className={`flex-shrink-0 transition-opacity ${openDocMenuId === document.doc_id ? 'opacity-100' : 'opacity-0 group-hover/doc:opacity-100'}`}>
                            <div className="relative z-50">
                              <button
                                className={`rounded-lg border p-1.5 transition-all ${
                                  isDashboardThemeEnabled
                                    ? "border-base-300/80 bg-base-200/80 text-base-content hover:border-primary/35 hover:bg-base-200"
                                    : "border-white/10 bg-white/5 hover:bg-white/15"
                                }`}
                                onClick={(e) => handleDocumentMenuClick(e, document.doc_id)}
                                title="More options"
                                type="button"
                              >
                                <MoreVertical
                                  className={`h-3.5 w-3.5 ${
                                    isDashboardThemeEnabled ? "text-current" : "text-white"
                                  }`}
                                  strokeWidth={2.5}
                                />
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
