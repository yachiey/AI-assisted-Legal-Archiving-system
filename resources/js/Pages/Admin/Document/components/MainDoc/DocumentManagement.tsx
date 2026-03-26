import React, { useState, useEffect, JSX } from 'react';
import { flushSync } from 'react-dom';
import { createPortal } from 'react-dom';
import { router } from '@inertiajs/react';
import { Plus, FileText, FolderPlus, Folder as FolderIcon, ScanLine, ArrowUpDown, LayoutGrid, List } from 'lucide-react';


import SearchBar from '../SearhBar/SearchBar';
import FolderCard from '../Folder/FolderCard';
import DocumentListItem from './DocumentListItem';
import DocumentGridItem from './DocumentGridItem';
import BreadcrumbNav from './BreadcrumbNav';
import DocumentViewer from '../DocumentViewer/DocumentViewer';
import AddFolderModal from '../Folder/AddFolderModal';
import MultiFileUploadUI from '../FileUpload/MultiFileUploadUI';
import FilterModal from '../Filter/FilterModal';
import ScanDocumentModal from '../ScanDocument/ScanDocumentModal';
import DocumentSidebar from '../DocumentSidebar/DocumentSidebar';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

import realDocumentService from '../../services/realDocumentService';
import folderService from '../../services/folderService';
import { Folder, Document, DocumentFilters } from '../../types/types';

type ViewMode = 'folders' | 'documents';

interface DocumentManagementState {
  searchTerm: string;
  currentFolder: Folder | null;
  viewMode: ViewMode;
  folders: Folder[]; // Root folders for grid view
  subfolders: Folder[]; // Subfolders for document view
  documents: Document[];
  loading: boolean;
  filters: DocumentFilters;
  sortField: 'name' | 'date';
  sortOrder: 'asc' | 'desc';
  documentViewMode: 'list' | 'grid';
  viewingDocument: Document | null;
}


const DocumentManagement: React.FC = () => {
  // State management with TypeScript
  const [state, setState] = useState<DocumentManagementState>({
    searchTerm: '',
    currentFolder: null,
    viewMode: 'folders',
    folders: [],
    subfolders: [],
    documents: [],
    loading: false,
    filters: {},
    sortField: 'date',
    sortOrder: 'desc',
    documentViewMode: 'list',
    viewingDocument: null
  });


  const [initialLoading, setInitialLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isUploadCancelDialogOpen, setIsUploadCancelDialogOpen] = useState(false);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const [highlightedDocId, setHighlightedDocId] = useState<number | null>(null);
  const [cameFromAI, setCameFromAI] = useState(false);

  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = React.useRef<HTMLDivElement>(null);
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCreate = async (folderName?: string) => {
    try {
      if (currentFolder) {
        // When inside a folder, reload subfolders
        const subfoldersData = await folderService.getFoldersByParent(currentFolder.folder_id);
        const filteredSubfolders = subfoldersData.filter(f =>
          f.folder_id !== currentFolder.folder_id &&
          f.folder_id !== currentFolder.parent_folder_id
        );
        setState(prev => ({ ...prev, subfolders: filteredSubfolders }));
        // Load document counts for new subfolders
        if (filteredSubfolders.length > 0) {
          loadFolderDocumentCounts(filteredSubfolders);
        }
      } else {
        // At root level, reload root folders
        await loadFolders(null);
      }
      await refreshCounts();
      setSidebarRefreshKey(prev => prev + 1);
    } catch (error) {
      console.error('Error refreshing folders:', error);
      window.location.reload();
    }
  };

  // Destructure state for easier access
  const {
    searchTerm,
    currentFolder,
    viewMode,
    folders,
    subfolders,
    documents,
    loading,
    filters,
    sortField,
    sortOrder,
    documentViewMode,
    viewingDocument
  } = state;

  // Load initial data
  useEffect(() => {
    loadInitialData();

    // Initialize view mode from localStorage
    const savedViewMode = localStorage.getItem('documentViewMode') as 'list' | 'grid';
    if (savedViewMode && (savedViewMode === 'list' || savedViewMode === 'grid')) {
      setState(prev => ({ ...prev, documentViewMode: savedViewMode }));
    }
  }, []);

  // Persist view mode changes
  useEffect(() => {
    localStorage.setItem('documentViewMode', documentViewMode);
  }, [documentViewMode]);


  // Check for folder query parameter and navigate to that folder (only once on initial load)
  const hasNavigatedFromUrl = React.useRef(false);
  useEffect(() => {
    if (hasNavigatedFromUrl.current || folders.length === 0) return;

    const urlParams = new URLSearchParams(window.location.search);
    const folderId = urlParams.get('folder');
    const highlightId = urlParams.get('highlight');
    const fromAI = urlParams.get('from');

    // Check if user came from AI Assistant
    if (fromAI === 'ai') {
      setCameFromAI(true);
    }

    // Set highlight first so it's ready when folder loads
    if (highlightId) {
      setHighlightedDocId(parseInt(highlightId));
      // Clear highlight after 5 seconds
      setTimeout(() => setHighlightedDocId(null), 5000);
    }

    if (folderId) {
      const targetFolder = folders.find(f => f.folder_id === parseInt(folderId));
      if (targetFolder) {
        hasNavigatedFromUrl.current = true;
        handleFolderClick(targetFolder);
      }
    }
  }, [folders]);

  // NEW: Handle URL-based document persistence
  const handleViewDocument = (document: Document): void => {
    setState(prev => ({ ...prev, viewingDocument: document }));

    // Update URL without full reload
    const url = new URL(window.location.href);
    url.searchParams.set('view', document.doc_id.toString());
    window.history.pushState({}, '', url.toString());
  };

  const handleCloseViewer = (): void => {
    setState(prev => ({ ...prev, viewingDocument: null }));

    // Remove view param from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('view');
    window.history.pushState({}, '', url.toString());
  };

  // Check for 'view' param on load or when documents update
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewId = urlParams.get('view');

    if (viewId && documents.length > 0) {
      const docToView = documents.find(d => d.doc_id === parseInt(viewId));
      if (docToView && (!viewingDocument || viewingDocument.doc_id !== docToView.doc_id)) {
        setState(prev => ({ ...prev, viewingDocument: docToView }));
      }
    }
  }, [documents]);

  // Track if we just opened a folder to prevent double loading
  const justOpenedFolder = React.useRef(false);

  // Check if any document-level filters are active (year)
  const hasDocumentFilters = filters.year !== undefined;

  // Load data when search term or filters change (debounced)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (viewMode === 'folders') {
        setState(prev => ({ ...prev, loading: true }));
        if (filters.year !== undefined) {
          loadDocuments(); // Load documents when year filter is active
        } else {
          loadFolders(); // Load folders by default
        }
      } else if (currentFolder && !justOpenedFolder.current) {
        // Reload documents when search/filters change
        setState(prev => ({ ...prev, loading: true }));
        loadDocuments();
      }
      // Reset the flag after the effect runs
      justOpenedFolder.current = false;
    }, 200); // Debounce for search/filters

    return () => clearTimeout(timeoutId);
  }, [searchTerm, filters]);

  const loadInitialData = async (): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await loadFolders(); // Load folders by default on initial load
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      console.error('Error loading initial data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const loadFolders = async (parentId: number | null = null, searchOverride?: string): Promise<void> => {
    try {
      let foldersData: Folder[];

      // Use override if provided, otherwise use current state
      const effectiveSearch = searchOverride !== undefined ? searchOverride : searchTerm;

      if (effectiveSearch) {
        foldersData = await folderService.searchFolders(effectiveSearch);
      } else {
        foldersData = await folderService.getFoldersByParent(parentId);
      }

      foldersData = folderService.sortFolders(foldersData, 'updated_at', 'desc');
      setState(prev => ({ ...prev, folders: foldersData, loading: false }));
      setInitialLoading(false);

      if (foldersData.length > 0) {
        loadFolderDocumentCounts(foldersData);
      }
    } catch (error) {
      console.error('Error loading folders:', error);
      setState(prev => ({ ...prev, loading: false }));
      setInitialLoading(false);
    }
  };

  const loadDocuments = async (): Promise<void> => {
    try {
      let documentsData: Document[];

      if (filters.status === 'deleted') {
        documentsData = await realDocumentService.getAllDocuments(currentFolder?.folder_id, { status: 'deleted' });
      } else {
        documentsData = await realDocumentService.getAllDocuments(currentFolder?.folder_id, filters, searchTerm);
      }

      setState(prev => ({ ...prev, documents: documentsData, loading: false }));
    } catch (error) {
      console.error('Error loading documents:', error);
      setState(prev => ({ ...prev, documents: [], loading: false }));
    }
  };

  const handleSearchChange = (term: string): void => {
    setState(prev => ({ ...prev, searchTerm: term }));
  };

  const handleFolderClick = async (folder: Folder): Promise<void> => {
    justOpenedFolder.current = true;

    // Update state synchronously - React 18 batches automatically
    setIsTransitioning(true);
    setState(prev => ({
      ...prev,
      currentFolder: folder,
      viewMode: 'documents',
      searchTerm: '',
      filters: {},
      loading: true,
      documents: [],
      subfolders: []
    }));

    try {
      // Start both requests in parallel but don't wait for both
      const documentsPromise = realDocumentService.getAllDocuments(folder.folder_id);
      const subfoldersPromise = folderService.getFoldersByParent(folder.folder_id);

      // Wait for subfolders first (usually faster) and show them immediately
      const subfoldersData = await subfoldersPromise;

      // CRITICAL: Filter subfolders - exclude parent and grandparent
      const filteredSubfolders = subfoldersData.filter(f =>
        f.folder_id !== folder.folder_id &&
        f.folder_id !== folder.parent_folder_id
      );

      // Show subfolders ASAP while documents are still loading
      flushSync(() => {
        setState(prev => {
          if (prev.currentFolder?.folder_id === folder.folder_id) {
            return {
              ...prev,
              subfolders: filteredSubfolders,
              loading: true // Keep loading true for documents
            };
          }
          return prev;
        });
        setIsTransitioning(false); // Allow render of subfolders
      });

      // Now wait for documents
      const documentsData = await documentsPromise;

      // Update with documents
      flushSync(() => {
        setState(prev => {
          if (prev.currentFolder?.folder_id === folder.folder_id) {
            return {
              ...prev,
              documents: documentsData,
              loading: false
            };
          }
          return prev;
        });
      });

      // Load counts in background without blocking
      if (filteredSubfolders.length > 0) {
        loadFolderDocumentCounts(filteredSubfolders);
      }
    } catch (error) {
      console.error('Error loading folder contents:', error);
      flushSync(() => {
        setState(prev => ({ ...prev, documents: [], subfolders: [], loading: false }));
        setIsTransitioning(false);
      });
    }
  };

  const handleBackToFolders = async (): Promise<void> => {
    justOpenedFolder.current = false;

    if (currentFolder?.parent_folder_id) {
      const parentFolder = await folderService.getFolderById(currentFolder.parent_folder_id);
      handleFolderClick(parentFolder);
    } else {
      setState({
        searchTerm: '',
        currentFolder: null,
        viewMode: 'folders',
        folders: [],
        subfolders: [],
        documents: [],
        loading: true,
        filters: {},
        sortField: 'date',
        sortOrder: 'desc',
        documentViewMode: 'list',
        viewingDocument: null
      });

      setSidebarRefreshKey(prev => prev + 1); // Refresh sidebar to show root folders
      await loadFolders(null, '');
    }
  };

  const handleFilterClick = (): void => {
    setIsFilterModalOpen(true);
  };

  const handleApplyFilters = (newFilters: DocumentFilters): void => {
    setState(prev => ({ ...prev, filters: newFilters }));
    setIsFilterModalOpen(false);
  };

  const handleAddFolder = (): void => {
    setIsModalOpen(true);
  };

  const handleAddDocument = (): void => {
    setIsUploadModalOpen(true);
  };

  const handleScanDocument = (): void => {
    setIsScanModalOpen(true);
  };

  const [folderDocumentCounts, setFolderDocumentCounts] = useState<Record<number, number>>({});

  const getFolderDocumentCount = (folderId: number): number => {
    return folderDocumentCounts[folderId] || 0;
  };

  const loadFolderDocumentCounts = async (foldersList: Folder[]): Promise<void> => {
    if (foldersList.length === 0) return;

    try {
      const folderIds = foldersList.map(f => f.folder_id);

      try {
        const bulkCounts = await realDocumentService.getBulkFolderCounts?.(folderIds);
        if (bulkCounts) {
          setFolderDocumentCounts(bulkCounts);
          return;
        }
      } catch (error) {
        console.log('Bulk loading not available, using individual calls');
      }

      const counts: Record<number, number> = {};
      const countPromises = folderIds.map(async (folderId) => {
        try {
          const count = await realDocumentService.getFolderDocumentCount(folderId);
          counts[folderId] = count;
        } catch (error) {
          counts[folderId] = 0;
        }
      });

      await Promise.all(countPromises);
      setFolderDocumentCounts(counts);
    } catch (error) {
      console.error('Error loading folder document counts:', error);
    }
  };


  const getTotalFoldersCount = async (): Promise<number> => {
    try {
      return await folderService.getTotalFoldersCount();
    } catch (error) {
      console.error('Error getting folder count:', error);
      return 0;
    }
  };

  const renderEmptyFolderState = (): JSX.Element => (
    <div className={`col-span-full flex w-full flex-col items-center justify-center py-12 ${
      isDashboardThemeEnabled ? 'text-base-content/65' : 'text-gray-500'
    }`}>
      <div className={`mb-6 rounded-full p-6 ${
        isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
      }`}>
        <FolderIcon className={`h-12 w-12 ${
          isDashboardThemeEnabled ? 'text-base-content/40' : 'text-gray-400'
        }`} />
      </div>
      <h3 className={`mb-3 text-xl font-bold tracking-tight ${
        isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'
      }`}>No folders found</h3>
      <p className={`mb-8 mx-auto max-w-md text-center text-base font-medium leading-relaxed ${
        isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'
      }`}>
        {searchTerm
          ? `No folders match "${searchTerm}". Try adjusting your search terms.`
          : 'Create your first folder to get started organizing your documents.'}
      </p>
      {!searchTerm && (
        <button
          onClick={handleAddFolder}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition-all duration-300 hover:scale-105 ${
            isDashboardThemeEnabled
              ? 'bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl'
              : 'bg-gradient-to-r from-green-600 to-green-700 shadow-md hover:from-green-700 hover:to-green-800 hover:shadow-lg'
          }`}
        >
          <FolderPlus className="w-5 h-5" />
          <span>Create First Folder</span>
        </button>
      )}
    </div>
  );

  const renderEmptyDocumentState = (): JSX.Element => (
    <div className={`col-span-full flex w-full flex-col items-center justify-center p-12 text-center ${
      isDashboardThemeEnabled ? 'text-base-content/65' : 'text-gray-500'
    }`}>
      <div className={`mb-6 rounded-full p-6 ${
        isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
      }`}>
        <FileText className={`h-12 w-12 ${
          isDashboardThemeEnabled ? 'text-base-content/40' : 'text-gray-400'
        }`} />
      </div>
      <h3 className={`mb-3 text-xl font-bold tracking-tight ${
        isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'
      }`}>No documents found</h3>
      <p className={`mx-auto mb-8 max-w-md text-base font-medium leading-relaxed ${
        isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'
      }`}>
        {searchTerm
          ? `No documents match "${searchTerm}" in this folder. Try adjusting your search terms.`
          : currentFolder
            ? 'This folder is empty. Upload your first document to get started.'
            : 'No documents available'}
      </p>
      {currentFolder && !searchTerm && (
        <button
          onClick={handleAddDocument}
          className={`flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-white transition-all duration-300 hover:scale-105 ${
            isDashboardThemeEnabled
              ? 'bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-xl'
              : 'bg-gradient-to-r from-green-600 to-green-700 shadow-md hover:from-green-700 hover:to-green-800 hover:shadow-lg'
          }`}
        >
          <Plus className="w-5 h-5" />
          <span>Upload Document</span>
        </button>
      )}
    </div>
  );

  const getDocumentCountText = (): string => {
    const count = documents.length;
    const documentText = count !== 1 ? 'documents' : 'document';
    const searchText = searchTerm ? ` matching "${searchTerm}"` : '';
    return `${count} ${documentText}${searchText}`;
  };

  const [folderCount, setFolderCount] = useState<number>(0);
  const [documentCount, setDocumentCount] = useState<number>(0);

  const handleSortSelection = (field: 'name' | 'date', order: 'asc' | 'desc') => {
    setState(prev => ({ ...prev, sortField: field, sortOrder: order }));
    setIsSortMenuOpen(false);
  };

  const getSortedItems = (items: any[]): any[] => {
    return [...items].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      if (sortField === 'name') {
        aValue = a.folder_name || a.title || '';
        bValue = b.folder_name || b.title || '';
      } else {
        aValue = new Date(a.updated_at).getTime();
        bValue = new Date(b.updated_at).getTime();
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  };

  const sortedSubfolders = getSortedItems(subfolders) as Folder[];
  const sortedDocuments = getSortedItems(documents) as Document[];
  const sortedFolders = getSortedItems(folders) as Folder[];



  const refreshCounts = async () => {
    try {
      const [folderTotal, documentTotal] = await Promise.all([
        getTotalFoldersCount(),
        realDocumentService.getTotalDocumentsCount()
      ]);
      setFolderCount(folderTotal);
      setDocumentCount(documentTotal);
    } catch (error) {
      console.error('Error loading counts:', error);
    }
  };

  useEffect(() => {
    refreshCounts();
  }, [folders]); // Update when folders change

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className={`relative flex h-full ${isDashboardThemeEnabled ? 'bg-transparent text-base-content' : ''}`}
      style={
        isDashboardThemeEnabled
          ? undefined
          : { background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)' }
      }
    >
      {/* Mobile Overlay Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="absolute inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile by default, shown as overlay when open */}
      <div className={`
        absolute md:relative inset-y-0 left-0 z-50
        transform transition-transform duration-300 ease-in-out
        ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <DocumentSidebar
          currentFolder={state.currentFolder}
          onFolderSelect={(folder) => {
            if (folder) {
              handleFolderClick(folder);
              setIsMobileSidebarOpen(false); // Close sidebar on mobile after selection
            } else {
              setState(prev => ({
                ...prev,
                currentFolder: null,
                viewMode: 'folders',
                searchTerm: '',
                filters: {},
                documents: [],
                subfolders: [],
                loading: true
              }));
              loadFolders(null);
              setIsMobileSidebarOpen(false);
            }
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={setSidebarCollapsed}
          refreshTrigger={sidebarRefreshKey}
        />
      </div>

      {/* Main Content - Full width on mobile, with margin on desktop */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <div className="flex-1 overflow-y-auto p-6 pb-32" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Back to AI Assistant Button - Shows when navigated from AI */}
          {cameFromAI && (
            <button
              onClick={() => {
                setCameFromAI(false);
                window.history.back();
              }}
              className={`mb-4 inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:scale-105 ${
                isDashboardThemeEnabled
                  ? 'bg-secondary shadow-lg shadow-secondary/20 hover:bg-secondary/90 hover:shadow-xl'
                  : 'bg-gradient-to-r from-purple-600 to-purple-700 shadow-md hover:from-purple-700 hover:to-purple-800 hover:shadow-lg'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to AI Assistant
            </button>
          )}

          {/* Header - Forest Green Design */}
          <div
            className={`relative z-20 mb-8 rounded-2xl border p-6 ${
              isDashboardThemeEnabled
                ? 'border-base-300/70 bg-base-100/90 shadow-2xl shadow-base-content/5 backdrop-blur-xl'
                : 'border-green-700/20 shadow-lg'
            }`}
            style={
              isDashboardThemeEnabled
                ? {
                    boxShadow:
                      '0 24px 60px oklch(var(--bc) / 0.06), inset 0 1px 0 oklch(var(--b1) / 0.4)',
                  }
                : { background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }
            }
          >
            <div className="relative z-10 flex flex-col items-stretch justify-between gap-4 sm:gap-6 xl:flex-row xl:items-center">
              <div className="flex-1">
                {/* Mobile: Hamburger + Title in one row */}
                <div className="flex items-center gap-3 mb-2">
                  {/* Hamburger Menu - Only visible on mobile */}
                  <button
                    onClick={() => setIsMobileSidebarOpen(true)}
                    className={`rounded-lg p-2 transition-colors md:hidden ${
                      isDashboardThemeEnabled
                        ? 'text-base-content hover:bg-base-200'
                        : 'text-white hover:bg-white/10'
                    }`}
                    aria-label="Open menu"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>

                  <h1 className={`flex items-center gap-3 text-4xl font-black tracking-tight md:text-5xl ${
                    isDashboardThemeEnabled ? 'text-base-content' : 'text-white'
                  }`}>
                    <FileText className={`h-8 w-8 ${
                      isDashboardThemeEnabled ? 'text-primary' : 'text-yellow-400'
                    }`} />
                    DOCUMENTS
                  </h1>
                </div>
                <div
                  className="mb-3 h-1 w-48 rounded-full"
                  style={{
                    background: isDashboardThemeEnabled
                      ? 'linear-gradient(90deg, oklch(var(--p)), transparent)'
                      : 'linear-gradient(90deg, #facc15, transparent)',
                  }}
                ></div>

                <p className={`text-lg font-medium tracking-wide ${
                  isDashboardThemeEnabled ? 'text-base-content/70' : 'text-green-50'
                }`}>
                  Manage your legal documents and folders
                </p>

                {/* Stats - Stack on mobile */}
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 mt-4 sm:mt-6 text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-base font-bold sm:text-lg ${
                      isDashboardThemeEnabled ? 'text-base-content' : 'text-white'
                    }`}>{folderCount}</span>
                    <span className={`text-xs sm:text-sm ${
                      isDashboardThemeEnabled ? 'text-base-content/60' : 'text-green-100/80'
                    }`}>Folders</span>
                  </div>

                  <div className={`h-4 w-px ${
                    isDashboardThemeEnabled ? 'bg-base-300' : 'bg-white/20'
                  }`}></div>

                  <div className="flex items-center gap-2">
                    <span className={`text-base font-bold sm:text-lg ${
                      isDashboardThemeEnabled ? 'text-base-content' : 'text-white'
                    }`}>{documentCount}</span>
                    <span className={`text-xs sm:text-sm ${
                      isDashboardThemeEnabled ? 'text-base-content/60' : 'text-green-100/80'
                    }`}>Total Documents</span>
                  </div>

                  {currentFolder && (
                    <>
                      <div className={`h-4 w-px ${
                        isDashboardThemeEnabled ? 'bg-base-300' : 'bg-white/20'
                      }`}></div>
                      <div className="flex items-center gap-2">
                        <span className={`text-base font-bold sm:text-lg ${
                          isDashboardThemeEnabled ? 'text-base-content' : 'text-white'
                        }`}>{getFolderDocumentCount(currentFolder.folder_id)}</span>
                        <span className={`text-xs sm:text-sm ${
                          isDashboardThemeEnabled ? 'text-base-content/60' : 'text-green-100/80'
                        }`}>in this folder</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Action Buttons - Wrap on mobile, show icons only on smallest screens */}
              <div className="relative z-20 flex flex-wrap items-center gap-2 sm:gap-3">
                <button
                  onClick={handleAddFolder}
                  className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    isDashboardThemeEnabled
                      ? 'border border-base-300 bg-base-100 text-base-content shadow-sm hover:border-primary/40 hover:bg-base-200 hover:text-primary'
                      : 'border-2 border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-sm hover:bg-white/20 hover:shadow-lg'
                  }`}
                  type="button"
                >
                  <FolderPlus className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="hidden xs:inline sm:inline">{currentFolder ? 'Add Subfolder' : 'Add Folder'}</span>
                </button>

                <button
                  onClick={handleAddDocument}
                  className={`group flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 ${
                    isDashboardThemeEnabled
                      ? 'border border-primary/30 bg-primary text-primary-content shadow-lg shadow-primary/15 hover:bg-primary/90 hover:shadow-xl'
                      : 'border-2 border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-sm hover:bg-white/20 hover:shadow-lg'
                  }`}
                  type="button"
                >
                  <Plus className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  <span className="hidden xs:inline sm:inline">Add Document</span>
                </button>

                <button
                  onClick={handleScanDocument}
                  className={`group hidden items-center gap-2 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 sm:flex ${
                    isDashboardThemeEnabled
                      ? 'border border-secondary/30 bg-secondary text-secondary-content shadow-lg shadow-secondary/15 hover:bg-secondary/90 hover:shadow-xl'
                      : 'border-2 border-white/30 bg-white/10 text-white shadow-sm backdrop-blur-sm hover:bg-white/20 hover:shadow-lg'
                  }`}
                  type="button"
                >
                  <ScanLine className="w-4 h-4 transition-transform duration-300 group-hover:scale-110" />
                  <span>Scan Document</span>
                </button>

                <div className="relative z-30" ref={sortMenuRef}>
                  <button
                    onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-lg px-3 py-2.5 font-medium transition-all sm:px-4 ${
                      isDashboardThemeEnabled
                        ? 'border border-base-300 bg-base-100 text-base-content shadow-sm hover:border-primary/40 hover:bg-base-200 hover:text-primary'
                        : 'border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-sm hover:bg-white/20'
                    }`}
                    type="button"
                  >
                    <ArrowUpDown className="w-5 h-5" />
                    <span className="hidden sm:inline">{sortField === 'name' ? 'Name' : 'Date'}</span>
                  </button>

                  {isSortMenuOpen && (
                    <div className={`absolute right-0 top-full z-[90] mt-2 w-56 rounded-xl border py-2 shadow-xl animate-in fade-in zoom-in-95 duration-100 ${
                      isDashboardThemeEnabled
                        ? 'border-base-300 bg-base-100 text-base-content'
                        : 'border-gray-100 bg-white'
                    }`}>
                      <div className={`mb-1 border-b px-4 py-2 ${
                        isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-50'
                      }`}>
                        <span className={`text-xs font-semibold uppercase tracking-wider ${
                          isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-400'
                        }`}>Sort By</span>
                      </div>

                      <button
                        onClick={() => handleSortSelection('name', 'asc')}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                          sortField === 'name' && sortOrder === 'asc'
                            ? isDashboardThemeEnabled
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'bg-green-50 text-green-700 font-medium'
                            : isDashboardThemeEnabled
                              ? 'text-base-content hover:bg-base-200 hover:text-primary'
                              : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <span>Name (A-Z)</span>
                        {sortField === 'name' && sortOrder === 'asc' && (
                          <span className={isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}>&#10003;</span>
                        )}
                      </button>

                      <button
                        onClick={() => handleSortSelection('name', 'desc')}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                          sortField === 'name' && sortOrder === 'desc'
                            ? isDashboardThemeEnabled
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'bg-green-50 text-green-700 font-medium'
                            : isDashboardThemeEnabled
                              ? 'text-base-content hover:bg-base-200 hover:text-primary'
                              : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <span>Name (Z-A)</span>
                        {sortField === 'name' && sortOrder === 'desc' && (
                          <span className={isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}>&#10003;</span>
                        )}
                      </button>

                      <div className={`my-1 border-t ${
                        isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-50'
                      }`}></div>

                      <button
                        onClick={() => handleSortSelection('date', 'desc')}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                          sortField === 'date' && sortOrder === 'desc'
                            ? isDashboardThemeEnabled
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'bg-green-50 text-green-700 font-medium'
                            : isDashboardThemeEnabled
                              ? 'text-base-content hover:bg-base-200 hover:text-primary'
                              : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <span>Date (Newest First)</span>
                        {sortField === 'date' && sortOrder === 'desc' && (
                          <span className={isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}>&#10003;</span>
                        )}
                      </button>

                      <button
                        onClick={() => handleSortSelection('date', 'asc')}
                        className={`flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors ${
                          sortField === 'date' && sortOrder === 'asc'
                            ? isDashboardThemeEnabled
                              ? 'bg-primary/10 font-medium text-primary'
                              : 'bg-green-50 text-green-700 font-medium'
                            : isDashboardThemeEnabled
                              ? 'text-base-content hover:bg-base-200 hover:text-primary'
                              : 'text-gray-700 hover:bg-green-50 hover:text-green-700'
                        }`}
                      >
                        <span>Date (Oldest First)</span>
                        {sortField === 'date' && sortOrder === 'asc' && (
                          <span className={isDashboardThemeEnabled ? 'text-primary' : 'text-green-600'}>&#10003;</span>
                        )}
                      </button>
                    </div>
                  )}
                </div>

                <div className={`flex rounded-lg border p-1 ${
                  isDashboardThemeEnabled
                    ? 'border-base-300 bg-base-200/70'
                    : 'border-white/20 bg-white/10'
                }`}>
                  <button
                    onClick={() => setState(prev => ({ ...prev, documentViewMode: 'list' }))}
                    className={`min-h-[36px] min-w-[36px] rounded-md p-1.5 transition-all ${
                      documentViewMode === 'list'
                        ? isDashboardThemeEnabled
                          ? 'bg-base-100 text-primary shadow-sm'
                          : 'bg-white text-green-700 shadow-sm'
                        : isDashboardThemeEnabled
                          ? 'text-base-content/70 hover:bg-base-100 hover:text-primary'
                          : 'text-white hover:bg-white/10'
                    }`}
                    title="List View"
                  >
                    <List className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setState(prev => ({ ...prev, documentViewMode: 'grid' }))}
                    className={`rounded-md p-1.5 transition-all ${
                      documentViewMode === 'grid'
                        ? isDashboardThemeEnabled
                          ? 'bg-base-100 text-primary shadow-sm'
                          : 'bg-white text-green-700 shadow-sm'
                        : isDashboardThemeEnabled
                          ? 'text-base-content/70 hover:bg-base-100 hover:text-primary'
                          : 'text-white hover:bg-white/10'
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <AddFolderModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={handleCreate}
                parentFolderId={viewMode === 'documents' ? currentFolder?.folder_id : null}
              />
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar
            searchTerm={searchTerm}
            onSearchChange={handleSearchChange}
            onFilterClick={handleFilterClick}
          />

          {/* Navigation */}
          {viewMode === 'documents' && (
            <div className="mt-6 mb-6">
              <BreadcrumbNav
                currentFolder={currentFolder}
                onNavigate={handleBackToFolders}
                breadcrumbPath={[]} // We'll fix this separately since it needs to be async
              />
            </div>
          )}

          {/* Loading State - Skeleton */}
          {initialLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-6 animate-pulse ${
                    isDashboardThemeEnabled
                      ? 'border-base-300 bg-base-100 shadow-lg shadow-base-content/5'
                      : 'border-gray-200 bg-white shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`h-10 w-10 rounded-lg ${
                      isDashboardThemeEnabled ? 'bg-base-300' : 'bg-gray-200'
                    }`}></div>
                    <div className="flex-1">
                      <div className={`mb-2 h-4 rounded ${
                        isDashboardThemeEnabled ? 'bg-base-300' : 'bg-gray-200'
                      }`}></div>
                      <div className={`h-3 w-3/4 rounded ${
                        isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
                      }`}></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className={`h-3 w-20 rounded ${
                      isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
                    }`}></div>
                    <div className={`h-3 w-16 rounded ${
                      isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
                    }`}></div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Quick Loading Indicator for Updates */}
          {loading && !initialLoading && (
            <div className={`fixed top-4 right-4 z-50 rounded-lg border px-4 py-2 ${
              isDashboardThemeEnabled
                ? 'border-base-300 bg-base-100 shadow-lg shadow-base-content/10'
                : 'border-gray-200 bg-white shadow-sm'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${
                  isDashboardThemeEnabled ? 'border-primary' : 'border-green-600'
                }`}></div>
                <span className={`text-sm font-medium ${
                  isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-700'
                }`}>Updating...</span>
              </div>
            </div>
          )}

          {/* Content Area */}
          {!initialLoading && (
            <>
              {viewMode === 'folders' && !currentFolder ? (
                <>
                  {/* Show folders grid when no document-level filters are active */}
                  {!hasDocumentFilters ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 auto-rows-fr" style={{ willChange: 'transform' }}>
                      {loading ? (
                        // Show loading skeleton when loading folders
                        [...Array(6)].map((_, i) => (
                          <div
                            key={i}
                            className={`rounded-xl border p-6 animate-pulse ${
                              isDashboardThemeEnabled
                                ? 'border-base-300 bg-base-100 shadow-lg shadow-base-content/5'
                                : 'border-gray-200 bg-white shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3 mb-4">
                              <div className={`h-10 w-10 rounded-lg ${
                                isDashboardThemeEnabled ? 'bg-base-300' : 'bg-gray-200'
                              }`}></div>
                              <div className="flex-1">
                                <div className={`mb-2 h-4 rounded ${
                                  isDashboardThemeEnabled ? 'bg-base-300' : 'bg-gray-200'
                                }`}></div>
                                <div className={`h-3 w-3/4 rounded ${
                                  isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
                                }`}></div>
                              </div>
                            </div>
                            <div className="flex justify-between items-center">
                              <div className={`h-3 w-20 rounded ${
                                isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
                              }`}></div>
                              <div className={`h-3 w-16 rounded ${
                                isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
                              }`}></div>
                            </div>
                          </div>
                        ))
                      ) : sortedFolders.length > 0 ? (
                        sortedFolders.map((folder) => (
                          <FolderCard
                            key={folder.folder_id}
                            folder={folder}
                            onFolderClick={handleFolderClick}
                            documentCount={getFolderDocumentCount(folder.folder_id)}
                            onFolderUpdated={async () => {
                              await loadFolders(null);
                              await refreshCounts();
                              setSidebarRefreshKey(prev => prev + 1);
                            }}
                          />
                        ))
                      ) : (
                        renderEmptyFolderState()
                      )}
                    </div>
                  ) : (
                    // Show documents grid/list when filters are active
                    <div className={`
                    ${documentViewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : isDashboardThemeEnabled
                          ? 'overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-lg shadow-base-content/5 divide-y divide-base-300/70'
                          : 'bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100'
                      }
                  `}>
                      {loading ? (
                        [...Array(6)].map((_, i) => (
                          <div key={i} className="animate-pulse p-6">
                            <div className="flex items-center gap-4">
                              <div className={`h-12 w-12 rounded-xl ${
                                isDashboardThemeEnabled ? 'bg-base-300' : 'bg-gray-200'
                              }`}></div>
                              <div className="flex-1 space-y-2">
                                <div className={`h-4 w-1/4 rounded ${
                                  isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
                                }`}></div>
                                <div className={`h-3 w-1/2 rounded ${
                                  isDashboardThemeEnabled ? 'bg-base-200/80' : 'bg-gray-50'
                                }`}></div>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : sortedDocuments.length > 0 ? (
                        sortedDocuments.map((doc) => (
                          documentViewMode === 'grid' ? (
                            <DocumentGridItem
                              key={doc.doc_id}
                              document={doc}
                              isHighlighted={highlightedDocId === doc.doc_id}
                              onDocumentUpdated={loadDocuments}
                            />
                          ) : (
                            <DocumentListItem
                              key={doc.doc_id}
                              document={doc}
                              isHighlighted={highlightedDocId === doc.doc_id}
                              onDocumentUpdated={loadDocuments}
                            />
                          )
                        ))
                      ) : (
                        renderEmptyDocumentState()
                      )}
                    </div>
                  )}
                </>
              ) : (
                // Folder detail view
                <div className="space-y-6">
                  {isTransitioning ? (
                    <div className={`p-8 text-center ${
                      isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-500'
                    }`}>
                      <div className={`mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-b-2 ${
                        isDashboardThemeEnabled ? 'border-primary' : 'border-green-600'
                      }`}></div>
                      <p className={`text-sm font-normal ${
                        isDashboardThemeEnabled ? 'text-base-content/65' : 'text-gray-600'
                      }`}>Loading...</p>
                    </div>
                  ) : (
                    <>
                      {/* Subfolders Grid */}
                      {sortedSubfolders.length > 0 && (
                        <div className="space-y-4">
                          <h3 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${
                            isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-400'
                          }`}>
                            <FolderIcon className="w-4 h-4" />
                            Subfolders
                          </h3>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                            {sortedSubfolders.map((folder) => (
                              <FolderCard
                                key={folder.folder_id}
                                folder={folder}
                                onFolderClick={handleFolderClick}
                                documentCount={getFolderDocumentCount(folder.folder_id)}
                                onFolderUpdated={async () => {
                                  if (currentFolder) {
                                    hasNavigatedFromUrl.current = true;
                                    await handleFolderClick(currentFolder);
                                  }
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Documents Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className={`flex items-center gap-2 text-sm font-semibold uppercase tracking-wider ${
                            isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-400'
                          }`}>
                            <FileText className="w-4 h-4" />
                            Documents ({documents.length})
                          </h3>

                          <div className={`flex items-center gap-2 text-xs font-medium ${
                            isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-500'
                          }`}>
                            Showing {getDocumentCountText()}
                          </div>
                        </div>

                        {/* Documents */}
                        {loading && documents.length === 0 ? (
                          <div className={`p-4 text-center text-sm font-normal ${
                            isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-500'
                          }`}>
                            <div className={`mx-auto mb-2 h-6 w-6 animate-spin rounded-full border-b-2 ${
                              isDashboardThemeEnabled ? 'border-primary' : 'border-green-600'
                            }`}></div>
                            <span className={isDashboardThemeEnabled ? 'text-base-content/65' : 'text-gray-600'}>
                              Loading documents...
                            </span>
                          </div>
                        ) : (
                          <div className="relative">
                            {/* Search loading overlay */}
                            {loading && documents.length > 0 && (
                              <div className={`absolute inset-0 z-10 flex items-center justify-center rounded-2xl ${
                                isDashboardThemeEnabled ? 'bg-base-100/75' : 'bg-white/60'
                              }`}>
                                <div className={`flex items-center gap-2 rounded-lg border px-4 py-2 ${
                                  isDashboardThemeEnabled
                                    ? 'border-base-300 bg-base-100 shadow-lg shadow-base-content/10'
                                    : 'border-gray-200 bg-white shadow-sm'
                                }`}>
                                  <div className={`h-4 w-4 animate-spin rounded-full border-2 border-t-transparent ${
                                    isDashboardThemeEnabled ? 'border-primary' : 'border-green-600'
                                  }`}></div>
                                  <span className={`text-sm ${
                                    isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'
                                  }`}>Searching...</span>
                                </div>
                              </div>
                            )}
                            <div className={`
                              ${documentViewMode === 'grid'
                                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                                : isDashboardThemeEnabled
                                  ? 'overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-lg shadow-base-content/5 divide-y divide-base-300/70'
                                  : 'bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100'
                              }
                            `}>
                              {sortedDocuments.map((doc) => (
                                documentViewMode === 'grid' ? (
                                  <DocumentGridItem
                                    key={doc.doc_id}
                                    document={doc}
                                    isHighlighted={highlightedDocId === doc.doc_id}
                                    onDocumentUpdated={loadDocuments}
                                  />
                                ) : (
                                  <DocumentListItem
                                    key={doc.doc_id}
                                    document={doc}
                                    isHighlighted={highlightedDocId === doc.doc_id}
                                    onDocumentUpdated={loadDocuments}
                                  />
                                )
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Empty State - Only show when truly empty */}
                        {!loading && sortedSubfolders.length === 0 && documents.length === 0 && (
                          renderEmptyDocumentState()
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && createPortal(
        <div
          data-theme={isDashboardThemeEnabled ? theme : undefined}
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-sm"
          style={{ margin: 0, padding: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`mx-4 w-full max-w-2xl rounded-xl border ${
              isDashboardThemeEnabled
                ? 'border-base-300 bg-base-100 shadow-2xl shadow-base-content/15'
                : 'border-gray-200 bg-white shadow-sm'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className={`flex items-center justify-between border-b p-6 ${
              isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'
            }`}>
              <h3 className={`text-lg font-semibold ${
                isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'
              }`}>Upload Documents</h3>
              <button
                onClick={() => setIsUploadCancelDialogOpen(true)}
                className={`rounded-lg p-1 text-xl transition-all ${
                  isDashboardThemeEnabled
                    ? 'text-base-content/60 hover:bg-base-200 hover:text-base-content'
                    : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                }`}
              >
                &times;
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <MultiFileUploadUI
                maxFileSize={50 * 1024 * 1024} // 50MB limit
                acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                minFiles={1} // Allow 1+ files
                onUploadSuccess={() => {
                  // Modal closes and navigation to AI processing happens automatically in the hook
                  setIsUploadModalOpen(false);
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                  // Keep modal open to show error and allow retry
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Filter Modal */}
      <FilterModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        folders={folders}
      />

      <ScanDocumentModal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
      />

      {/* Global Document Viewer */}
      {viewingDocument && (
        <DocumentViewer
          isOpen={true}
          onClose={handleCloseViewer}
          document={viewingDocument}
        />
      )}

      {/* Upload Cancel Confirmation Dialog */}
      {isUploadCancelDialogOpen && createPortal(
        <div
          data-theme={isDashboardThemeEnabled ? theme : undefined}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[10000]"
        >
          <div className={`mx-4 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl animate-in fade-in zoom-in duration-200 ${
            isDashboardThemeEnabled ? 'border border-base-300 bg-base-100' : 'bg-white'
          }`}>
            {/* Dialog Header */}
            <div
              className={`border-b px-6 py-4 ${
                isDashboardThemeEnabled ? 'border-base-300 bg-primary text-primary-content' : 'border-gray-100'
              }`}
              style={
                isDashboardThemeEnabled
                  ? undefined
                  : { background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }
              }
            >
              <h3 className="text-lg font-bold text-white">Cancel Upload?</h3>
            </div>

            {/* Dialog Content */}
            <div className="px-6 py-5">
              <p className={`text-sm leading-relaxed ${
                isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'
              }`}>
                Are you sure you want to cancel the upload process? Any selected files will be cleared.
              </p>
            </div>

            {/* Dialog Actions */}
            <div className={`flex gap-3 justify-end px-6 py-4 ${
              isDashboardThemeEnabled ? 'bg-base-200/80' : 'bg-gray-50'
            }`}>
              <button
                onClick={() => setIsUploadCancelDialogOpen(false)}
                className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                  isDashboardThemeEnabled
                    ? 'text-base-content/70 hover:bg-base-100 hover:text-base-content'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                Continue Upload
              </button>
              <button
                onClick={() => {
                  setIsUploadCancelDialogOpen(false);
                  setIsUploadModalOpen(false);
                }}
                className={`rounded-lg px-4 py-2 font-medium text-white transition-colors ${
                  isDashboardThemeEnabled
                    ? 'bg-error shadow-lg shadow-error/20 hover:bg-error/90'
                    : 'bg-red-500 shadow-md hover:bg-red-600'
                }`}
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default DocumentManagement;
