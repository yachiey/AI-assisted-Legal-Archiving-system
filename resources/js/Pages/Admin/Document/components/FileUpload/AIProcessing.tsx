import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProcessingModal from '../../../../../Components/Modal/Processing/ProcessingModal';

import { FileText, Folder, Calendar, User, Brain, CheckCircle, AlertCircle, ChevronDown, Eye, Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import UploadDocumentViewer from './UploadDocumentViewer';
import DocumentQueueNavigation from './DocumentQueueNavigation';
import { useDocumentQueue } from '../../hooks/useDocumentQueue';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

interface DocumentData {
  doc_id?: number;
  fileName?: string;
  title?: string;
  description?: string;
  analysis?: string;
  suggestedLocation?: string;
  suggestedCategory?: string;
  createdBy?: string;
  createdAt?: string;
  status?: string;
  filePath?: string;
  physicalLocation?: string;
  folder_id?: number;
  remarks?: string;
  document_ref_id?: string;
}

interface AIProcessingProps {
  documentData?: DocumentData | null;
}

interface FolderItem {
  folder_id: number;
  folder_name: string;
  folder_path: string;
  parent_folder_id?: number;
}

const AIProcessing: React.FC<AIProcessingProps> = ({ documentData = null }) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<'idle' | 'analyzing' | 'processing' | 'completed' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [physicalLocation, setPhysicalLocation] = useState<string>(documentData?.physicalLocation || '');
  const [documentRefId, setDocumentRefId] = useState<string>(documentData?.document_ref_id || '');
  const [errors, setErrors] = useState({ documentRefId: '' });
  const docRefIdInputRef = React.useRef<HTMLInputElement>(null);

  // Folder management state
  const [availableFolders, setAvailableFolders] = useState<FolderItem[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(documentData?.folder_id || null);
  const [aiSuggestedFolder, setAiSuggestedFolder] = useState<string>(documentData?.suggestedLocation || '');
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState<boolean>(false);

  // Sync state with prop updates (polling updates documentData)
  // COMPREHENSIVE RESET: Sync state when new document is loaded via props
  useEffect(() => {
    if (documentData?.doc_id) {
      // 1. Reset document state
      setDocument(documentData);

      // 2. Reset AI suggestion state
      setAiSuggestedFolder(documentData.suggestedLocation || '');

      // 3. Reset UI states from previous interaction
      setShowCreateFolderDialog(false);
      setNewFolderName('');
      setIsCreatingFolder(false);

      // 4. Reset completion ref
      isCompletingRef.current = false;
      hasShownDialogRef.current = false;

      // 5. Reset folder fetch status to trigger re-checks
      setIsFolderFetchComplete(false);
    }
  }, [documentData?.doc_id]);

  const [newFolderName, setNewFolderName] = useState<string>('');
  const [isCreatingFolder, setIsCreatingFolder] = useState<boolean>(false);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [viewerOpen, setViewerOpen] = useState<boolean>(false);
  const [showCancelAllDialog, setShowCancelAllDialog] = useState<boolean>(false);
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);

  // Document queue management
  const {
    hasQueue,
    isFirstDocument,
    isLastDocument,
    remainingCount,
    currentPosition,
    totalDocuments,
    goToNextDocument,
    goToPreviousDocument,
    removeCurrentAndContinue,
    clearQueue
  } = useDocumentQueue(documentData?.doc_id);

  // Use local state for document data to support updates from polling
  const [document, setDocument] = useState<DocumentData>(documentData || {
    fileName: "No file selected",
    title: "No document",
    description: "",
    remarks: "",
    suggestedLocation: "",
    createdBy: "System",
    createdAt: new Date().toISOString().split('T')[0],
    status: "Pending"
  });

  const isCompletingRef = React.useRef(false);
  const hasShownDialogRef = React.useRef(false);
  const [isFolderFetchComplete, setIsFolderFetchComplete] = useState<boolean>(false);

  // Poll for document status


  // Fetch available folders when component loads or document changes
  useEffect(() => {
    let mounted = true;

    const fetchFolders = async () => {
      try {
        const axios = (await import('axios')).default;
        const response = await axios.get('/api/folders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });

        if (mounted) {
          // API returns direct array [Folder, Folder...], NOT { data: [...] }
          setAvailableFolders(response.data || []);
          setIsFolderFetchComplete(true);
        }
      } catch (error) {
        console.error('Failed to fetch folders:', error);
        if (mounted) {
          setIsFolderFetchComplete(true); // Always mark complete to unblock UI
        }
      }
    };

    setIsFolderFetchComplete(false);
    fetchFolders();

    return () => { mounted = false; };
  }, [documentData?.doc_id]);

  // Check for folder match whenever folders are loaded or suggestion changes
  useEffect(() => {
    // Use state first, fallback to prop
    const aiSuggested = aiSuggestedFolder || documentData?.suggestedLocation;

    // Only proceed if we have a suggestion and folders have been fetched
    if (aiSuggested && isFolderFetchComplete) {
      const folders = availableFolders || [];
      const matched = folders.find((f: any) =>
        f.folder_name.toLowerCase().trim() === aiSuggested.toLowerCase().trim()
      );

      if (matched) {
        setSelectedFolderId(matched.folder_id);
      } else {
        // Folder doesn't exist, show creation dialog

        // Use timeout and ref to ensure we only show it once and allow UI to settle
        if (!hasShownDialogRef.current && !showCreateFolderDialog && !isCreatingFolder) {
          hasShownDialogRef.current = true;
          setTimeout(() => {
            setNewFolderName(aiSuggested);
            setShowCreateFolderDialog(true);
          }, 500); // 500ms delay to force UI update/settle
        }
      }
    }
  }, [aiSuggestedFolder, documentData?.suggestedLocation, isFolderFetchComplete, availableFolders]);

  // Auto-analyze document when component loads
  useEffect(() => {
    // Initial check
    if (documentData?.doc_id && processingStatus === 'idle') {
      // If status is active/completed, just show it. If pending, start analyzing.
      if (documentData.status === 'processing') {
        setProcessingStatus('analyzing');
      }
    }
  }, [documentData]);

  // Poll for document status
  useEffect(() => {
    if (!documentData?.doc_id) return;

    // ... existing polling logic ...


    // Initial check logic moved to separate useEffect


    // Auto-analyze document when component loads


    const pollInterval = setInterval(async () => {
      if (document.status === 'active' || document.status === 'failed') {
        setIsProcessing(false);
        setProcessingStatus(document.status === 'active' ? 'completed' : 'error');
        clearInterval(pollInterval);
        return;
      }

      try {
        const axios = (await import('axios')).default;
        const response = await axios.get(`/api/documents/${documentData.doc_id}`);

        if (response.data.success && response.data.data) {
          const updatedDoc = response.data.data;
          // Fix: Ensure we are setting nested data correctly if the API returns it
          setDocument(prev => ({
            ...prev,
            ...updatedDoc,
            suggestedLocation: updatedDoc.suggestedLocation,
            description: updatedDoc.description,
            remarks: updatedDoc.remarks,
            title: updatedDoc.title
          }));

          // Fix: Update UI state for AI recommendation box
          if (updatedDoc.suggestedLocation) {
            setAiSuggestedFolder(updatedDoc.suggestedLocation);
          }

          if (updatedDoc.status === 'active') {
            setIsProcessing(false);
            setProcessingStatus('completed');
            // Update other state based on new data
            if (updatedDoc.suggestedLocation) {
              // Logic to update selected folder based on suggestion is handled in separate effect
            }
          } else if (updatedDoc.status === 'failed') {
            setIsProcessing(false);
            setProcessingStatus('error');
            setErrorMessage(updatedDoc.remarks || 'Processing failed');
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, [documentData?.doc_id, document.status]);

  // Cleanup on unmount (User Abandonment)
  useEffect(() => {
    const DOCUMENT_QUEUE_KEY = 'document_upload_queue';

    const performCleanup = () => {
      if (!isCompletingRef.current && document?.doc_id) {
        // Delete the document if user abandons without clicking Accept
        // This ensures documents are not saved unless explicitly accepted
        fetch(`/api/documents/${document.doc_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          keepalive: true
        });
        // Clear the document queue from session storage
        sessionStorage.removeItem(DOCUMENT_QUEUE_KEY);
      }
    };

    const handleUnload = (e: BeforeUnloadEvent) => {
      if (!isCompletingRef.current && document?.doc_id) {
        performCleanup();
        // Show browser's default confirmation dialog
        e.preventDefault();
        e.returnValue = '';
      }
    };

    const handlePopState = () => {
      // Browser back/forward button pressed
      if (!isCompletingRef.current && document?.doc_id) {
        performCleanup();
      }
    };

    // Handle Inertia.js navigation (back button, link clicks, etc.)
    const removeInertiaListener = router.on('before', () => {
      if (!isCompletingRef.current && document?.doc_id) {
        performCleanup();
      }
    });

    // Handle browser close/reload
    window.addEventListener('beforeunload', handleUnload);
    // Handle browser back/forward button
    window.addEventListener('popstate', handlePopState);

    // Handle component unmount
    return () => {
      window.removeEventListener('beforeunload', handleUnload);
      window.removeEventListener('popstate', handlePopState);
      removeInertiaListener();
    };
  }, [document?.doc_id]);

  // Update folder selection when document data changes (from polling)
  useEffect(() => {
    if (document.suggestedLocation && availableFolders.length > 0) {
      const matchedFolder = availableFolders.find((f: FolderItem) =>
        f.folder_name.toLowerCase().trim() === document.suggestedLocation!.toLowerCase().trim()
      );
      if (matchedFolder) {
        setSelectedFolderId(matchedFolder.folder_id);
      } else if (document.suggestedLocation) {
        setNewFolderName(document.suggestedLocation);
        // Don't auto-show dialog during polling, might be annoying? 
        // Maybe only if status just changed to completed?
        // For now, let's keep it simple.
      }
    }
  }, [document.suggestedLocation, availableFolders]);


  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      alert('Please enter a folder name');
      return;
    }

    setIsCreatingFolder(true);
    try {
      const axios = (await import('axios')).default;
      const response = await axios.post('/api/folders', {
        folder_name: newFolderName.trim(),
        folder_path: `d:/legal_office/${newFolderName.trim()}`,
        folder_type: 'General',
        parent_folder_id: null
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      const newFolder = response.data.folder;
      setAvailableFolders([...availableFolders, newFolder]);
      setSelectedFolderId(newFolder.folder_id);
      setShowCreateFolderDialog(false);

      const toast = window.document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
      toast.textContent = `Folder "${newFolderName}" created successfully!`;
      window.document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 3000);

    } catch (error) {
      console.error('Failed to create folder:', error);
      alert('Failed to create folder. Please try again.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleAcceptAI = async () => {
    isCompletingRef.current = true;
    setErrors({ documentRefId: '' });

    setIsProcessing(true);

    try {
      // ALWAYS call update API if we have a document ID - this renames file and moves to folder
      if (documentData?.doc_id) {
        const axios = (await import('axios')).default;
        await axios.post('/api/manual-process/update', {
          doc_id: documentData.doc_id,
          title: document.title, // Use updated state (AI-generated title), not original prop
          folder_id: selectedFolderId || document.folder_id,
          description: document.description,
          remarks: document.remarks,
          physical_location: physicalLocation,
          document_ref_id: documentRefId
        }, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
      }

      const successToast = window.document.createElement('div');
      successToast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl z-50 flex items-center gap-3 animate-slide-in';

      const hasMoreDocs = hasQueue && !isLastDocument;
      successToast.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <div>
          <div class="font-bold">Document ${currentPosition}/${totalDocuments} Saved!</div>
          <div class="text-sm opacity-90">${hasMoreDocs ? 'Moving to next document...' : 'All documents processed!'}</div>
        </div>
      `;
      window.document.body.appendChild(successToast);

      setTimeout(() => successToast.remove(), 2000);

      setTimeout(() => {
        if (hasMoreDocs) {
          goToNextDocument();
        } else {
          clearQueue();
          router.visit('/admin/documents');
        }
      }, 1000);
    } catch (error) {
      console.error('Error saving physical location:', error);
      setIsProcessing(false);
      alert('Failed to save document, but continuing...');

      setTimeout(() => {
        if (hasQueue && !isLastDocument) {
          goToNextDocument();
        } else {
          clearQueue();
          router.visit('/admin/documents');
        }
      }, 1000);
    }
  };

  const handleManualReview = () => {
    isCompletingRef.current = true;
    const docId = documentData?.doc_id;
    const url = docId ? `/manualy-processing?docId=${docId}` : '/manualy-processing';
    router.visit(url);
  };

  const selectFolder = (folder: FolderItem) => {
    setSelectedFolderId(folder.folder_id);
    setDropdownOpen(false);
  };

  const getSelectedFolderName = () => {
    const selectedFolder = availableFolders.find(folder => folder.folder_id === selectedFolderId);
    return selectedFolder ? selectedFolder.folder_name : '';
  };

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    if (documentData?.doc_id) {
      setIsProcessing(true);
      setShowCancelDialog(false);

      try {
        const axios = (await import('axios')).default;
        await axios.delete(`/api/documents/${documentData.doc_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });

        const toast = window.document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
        toast.textContent = hasQueue && !isLastDocument
          ? `Document deleted. Moving to next (${remainingCount} remaining)...`
          : 'Document deleted successfully';
        window.document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);

        setTimeout(() => {
          if (hasQueue && !isLastDocument) {
            removeCurrentAndContinue();
          } else {
            clearQueue();
            router.visit('/admin/documents');
          }
        }, 1000);

      } catch (error) {
        console.error('Failed to delete document:', error);
        setErrorMessage('Failed to delete document. Please try again.');
        setProcessingStatus('error');
        setIsProcessing(false);
      }
    } else {
      clearQueue();
      router.visit('/admin/documents');
    }
  };

  const confirmCancelAll = async () => {
    setShowCancelAllDialog(false);
    setIsProcessing(true);

    try {
      const axios = (await import('axios')).default;

      if (documentData?.doc_id) {
        await axios.delete(`/api/documents/${documentData.doc_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });
      }

      const toast = window.document.createElement('div');
      toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
      toast.textContent = 'Remaining documents canceled';
      window.document.body.appendChild(toast);
      setTimeout(() => toast.remove(), 2000);

      setTimeout(() => {
        clearQueue();
        router.visit('/admin/documents');
      }, 1000);

    } catch (error) {
      console.error('Failed to cancel documents:', error);
      setIsProcessing(false);
    }
  };

  const getStatusIcon = () => {
    switch (processingStatus) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Brain className={`w-5 h-5 ${isDashboardThemeEnabled ? 'text-primary' : 'text-gray-600'}`} />;
    }
  };

  const getStatusText = () => {
    switch (processingStatus) {
      case 'completed':
        return 'AI Analysis Complete';
      case 'error':
        return 'Analysis Error';
      default:
        return 'Ready for Review';
    }
  };

  const titleTextClass = isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900';
  const bodyTextClass = isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-700';
  const mutedTextClass = isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-500';
  const sectionBorderClass = isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-100';
  const fieldSurfaceClass = isDashboardThemeEnabled
    ? 'rounded-lg border border-base-300 bg-base-200 p-4 shadow-sm'
    : 'rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm';
  const dropdownSurfaceClass = isDashboardThemeEnabled
    ? 'rounded-lg border border-base-300 bg-base-100 shadow-sm'
    : 'rounded-lg border border-gray-200 bg-white shadow-sm';
  const accentIconClass = isDashboardThemeEnabled
    ? 'rounded-lg bg-primary/12 shadow-lg shadow-primary/10'
    : 'rounded-lg shadow-md';
  const accentIconStyle = isDashboardThemeEnabled
    ? undefined
    : { background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' };
  const accentIconTextClass = isDashboardThemeEnabled ? 'text-primary' : 'text-white';

  return (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className={`min-h-screen p-4 ${
        isDashboardThemeEnabled ? 'bg-base-200 text-base-content' : 'bg-gray-50'
      }`}
    >
      <ProcessingModal
        isOpen={processingStatus === 'analyzing' || processingStatus === 'processing'}
        step={processingStatus === 'analyzing' ? 'extracting' : 'analyzing'}
        theme={theme}
        isDashboardThemeEnabled={isDashboardThemeEnabled}
        details={
          processingStatus === 'analyzing'
            ? 'Extracting text & generating embeddings...'
            : 'Finalizing document processing...'
        }
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`mb-3 text-3xl font-bold tracking-tight ${titleTextClass}`}>AI Document Processing</h1>
          <div
            className={`h-1 w-32 rounded-full shadow-lg ${
              isDashboardThemeEnabled ? 'bg-primary shadow-primary/25' : ''
            }`}
            style={
              isDashboardThemeEnabled
                ? undefined
                : { background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }
            }
          ></div>

          {/* Status Indicator */}
          <div className="mt-5 flex items-center space-x-3">
            {getStatusIcon()}
            <span className={`text-sm font-medium tracking-wide ${bodyTextClass}`}>{getStatusText()}</span>
            <span
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                isDashboardThemeEnabled
                  ? 'border-primary/20 bg-primary/10 text-primary'
                  : 'border-green-200 bg-green-100 text-[#228B22]'
              }`}
            >
              Groq AI Analysis
            </span>
          </div>
        </div>

        {/* Document Queue Navigation */}
        {hasQueue && (
          <DocumentQueueNavigation
            currentPosition={currentPosition}
            totalDocuments={totalDocuments}
            isFirstDocument={isFirstDocument}
            isLastDocument={isLastDocument}
            onPrevious={goToPreviousDocument}
            onNext={goToNextDocument}
            onSkipAll={() => setShowCancelAllDialog(true)}
            showSkipAll={remainingCount > 0}
            isDashboardThemeEnabled={isDashboardThemeEnabled}
          />
        )}

        {/* Error Message */}
        {processingStatus === 'error' && (
          <div
            className={`mb-6 rounded-lg border p-4 ${
              isDashboardThemeEnabled
                ? 'border-error/25 bg-error/10'
                : 'border-red-200 bg-red-50'
            }`}
          >
            <div className="flex items-center">
              <AlertCircle className={`mr-2 h-5 w-5 ${isDashboardThemeEnabled ? 'text-error' : 'text-red-500'}`} />
              <p className={`font-medium ${isDashboardThemeEnabled ? 'text-error' : 'text-red-700'}`}>Processing Error</p>
            </div>
            <p className={`mt-1 text-sm ${isDashboardThemeEnabled ? 'text-error/90' : 'text-red-600'}`}>{errorMessage}</p>
          </div>
        )}

        {/* Main Content Card */}
        <div
          className={`overflow-hidden rounded-2xl border shadow-xl ${
            isDashboardThemeEnabled
              ? 'border-base-300 bg-base-100 shadow-base-content/10'
              : 'border-gray-100 bg-white'
          }`}
        >
          {/* Document Uploaded Section */}
          <div className={`border-b px-8 py-6 ${sectionBorderClass} ${isDashboardThemeEnabled ? 'bg-base-200/65' : 'bg-gray-50/50'}`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-sm font-bold uppercase tracking-wider ${mutedTextClass}`}>Document Uploaded</h2>
              {documentData?.doc_id && (
                <button
                  onClick={() => setViewerOpen(true)}
                  className={`group flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-all duration-200 ${
                    isDashboardThemeEnabled
                      ? 'border-transparent bg-info/10 text-info hover:bg-info/20 hover:shadow-sm'
                      : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 hover:shadow-sm'
                  }`}
                >
                  <Eye className={`w-4 h-4 transition-colors ${isDashboardThemeEnabled ? 'group-hover:text-info' : 'group-hover:text-blue-800'}`} />
                  View File
                </button>
              )}
            </div>
            <div className="flex items-start space-x-4">
              <div className={`p-2.5 ${accentIconClass}`} style={accentIconStyle}>
                <FileText className={`w-5 h-5 flex-shrink-0 ${accentIconTextClass}`} />
              </div>
              <p className={`mt-0.5 text-base font-medium leading-relaxed ${titleTextClass}`}>
                "{getSelectedFolderName() || aiSuggestedFolder ? `${getSelectedFolderName() || aiSuggestedFolder}/` : ''}{document.fileName}"
              </p>
            </div>
          </div>

          {/* AI-Generated Fields Section */}
          <div className={`border-b px-8 py-6 ${sectionBorderClass} ${isDashboardThemeEnabled ? 'bg-base-100' : 'bg-green-50/10'}`}>
            <h3 className={`mb-5 flex items-center text-base font-bold uppercase tracking-wider ${titleTextClass}`}>
              <div className={`mr-3 p-2.5 ${accentIconClass}`} style={accentIconStyle}>
                <Brain className={`w-5 h-5 ${accentIconTextClass}`} />
              </div>
              AI-Generated Details
            </h3>

            <div className="space-y-5">
              {/* Document ID */}
              <div>
                <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Document ID (Optional)</label>
                <div className={fieldSurfaceClass}>
                  <input
                    ref={docRefIdInputRef}
                    type="text"
                    value={documentRefId}
                    onChange={(e) => {
                      setDocumentRefId(e.target.value);
                      if (errors.documentRefId) setErrors({ documentRefId: '' });
                    }}
                    placeholder="Enter document reference ID (e.g., DOC-2024-001)..."
                    className={`w-full border-none bg-transparent font-medium leading-relaxed focus:outline-none focus:ring-0 ${
                      errors.documentRefId
                        ? isDashboardThemeEnabled
                          ? 'text-error placeholder:text-error/50'
                          : 'text-red-900 placeholder-gray-400'
                        : isDashboardThemeEnabled
                          ? 'text-base-content placeholder:text-base-content/40'
                          : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                {errors.documentRefId && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center animate-pulse">
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    {errors.documentRefId}
                  </p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* AI-Suggested Title */}
                <div>
                  <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Suggested Title</label>
                  <div className={fieldSurfaceClass}>
                    <p className={`font-medium leading-relaxed ${titleTextClass}`}>{document.title || document.fileName || "Untitled Document"}</p>
                  </div>
                </div>

                {/* AI-Generated Description */}
                <div>
                  <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>AI Description</label>
                  <div className={fieldSurfaceClass}>
                    <p className={`text-sm leading-relaxed ${bodyTextClass}`}>{document.description || "No description available"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className={`border-b px-8 py-6 ${sectionBorderClass}`}>
            <div className="mb-4">
              <span
                className={`inline-block rounded-full px-4 py-2 text-xs font-bold uppercase tracking-wider shadow-md ${
                  isDashboardThemeEnabled
                    ? 'bg-primary text-primary-content shadow-primary/20'
                    : 'text-white'
                }`}
                style={isDashboardThemeEnabled ? undefined : accentIconStyle}
              >
                AI Analysis Summary
              </span>
            </div>
            <p className={`rounded-lg border-l-4 p-5 text-base font-normal leading-relaxed ${
              isDashboardThemeEnabled
                ? 'border-primary bg-primary/10 text-base-content/80'
                : 'border-[#228B22] bg-green-50 text-gray-700'
            }`}>
              {document.description || "Document has been processed and is ready for review."}
            </p>

            {/* AI Remarks */}
            {document.remarks && (
              <div className="mt-6">
                <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Processing Remarks</label>
                <div className={fieldSurfaceClass}>
                  <p className={`text-sm leading-relaxed ${bodyTextClass}`}>{document.remarks}</p>
                </div>
              </div>
            )}
          </div>

          {/* Document Details */}
          <div className={`px-8 py-6 space-y-6 transition-all duration-200 ${dropdownOpen ? 'pb-60' : ''}`}>

            {/* AI-Suggested Folder */}
            <div className="relative z-50">
              <h4 className={`mb-3 flex items-center text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>
                <div className={`mr-2.5 p-2.5 ${accentIconClass}`} style={accentIconStyle}>
                  <Folder className={`w-4 h-4 ${accentIconTextClass}`} />
                </div>
                AI-Suggested Folder
              </h4>

              {/* Show AI recommendation if it exists */}
              {aiSuggestedFolder && (
                <div className={`mb-3 rounded-lg border px-4 py-2.5 ${
                  isDashboardThemeEnabled
                    ? 'border-info/25 bg-info/10'
                    : 'border-blue-200 bg-blue-50'
                }`}>
                  <p className={`text-xs ${isDashboardThemeEnabled ? 'text-info' : 'text-blue-700'}`}>
                    <span className="font-semibold">AI Recommendation:</span> {aiSuggestedFolder}
                  </p>
                </div>
              )}

              {/* Folder Dropdown */}
              <div className={dropdownSurfaceClass}>
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`flex w-full items-center justify-between p-4 text-left font-medium focus:outline-none ${titleTextClass}`}
                  >
                    <span className={selectedFolderId ? titleTextClass : mutedTextClass}>
                      {getSelectedFolderName() || 'Select a folder...'}
                    </span>
                    <ChevronDown className={`h-5 w-5 transition-transform ${dropdownOpen ? 'rotate-180' : ''} ${
                      isDashboardThemeEnabled ? 'text-base-content/45' : 'text-gray-400'
                    }`} />
                  </button>

                  {dropdownOpen && (
                    <div data-lenis-prevent className={`custom-scrollbar absolute z-[999] mt-1 max-h-48 w-full overflow-y-auto rounded-xl shadow-2xl ${
                      isDashboardThemeEnabled
                        ? 'border border-base-300 bg-base-100'
                        : 'border border-gray-100 bg-white'
                    }`}>
                      {availableFolders.length === 0 ? (
                        <div className={`px-4 py-3 font-medium ${mutedTextClass}`}>No folders available</div>
                      ) : (
                        availableFolders.map((folder) => {
                          const isSubfolder = folder.parent_folder_id != null;

                          return (
                            <button
                              key={folder.folder_id}
                              onClick={() => selectFolder(folder)}
                              className={`w-full border-b px-4 py-3 text-left transition-all duration-200 last:border-b-0 ${
                                isDashboardThemeEnabled
                                  ? 'border-base-300/70 hover:bg-base-200'
                                  : 'border-gray-50 hover:bg-green-50'
                              }`}
                              style={{ paddingLeft: isSubfolder ? '2rem' : '1rem' }}
                            >
                              <div className={`font-semibold flex items-center gap-2 tracking-wide ${titleTextClass}`}>
                                {isSubfolder && <span className={isDashboardThemeEnabled ? 'text-primary' : 'text-[#228B22]'}>└─</span>}
                                {folder.folder_name}
                              </div>
                              <div className={`mt-1 text-xs tracking-wide ${mutedTextClass}`}>{folder.folder_path}</div>
                            </button>
                          );
                        })
                      )}

                      {/* Create New Folder Option */}
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          setNewFolderName('');
                          setShowCreateFolderDialog(true);
                        }}
                        className={`flex w-full items-center gap-2 border-t px-4 py-3 text-left font-bold transition-all duration-200 ${
                          isDashboardThemeEnabled
                            ? 'border-base-300 text-primary hover:bg-base-200'
                            : 'border-gray-100 text-[#228B22] hover:bg-green-50'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                        Create New Folder...
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Selected folder display */}
              {selectedFolderId && (
                <div className={`mt-2 flex items-center text-xs font-medium ${
                  isDashboardThemeEnabled ? 'text-success' : 'text-[#228B22]'
                }`}>
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Folder selected
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className={`space-y-3.5 border-t pt-5 ${
              isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'
            }`}>
              <div className="flex items-center space-x-3">
                <User className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-base-content/45' : 'text-gray-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Created by</span>
                <span className={`text-sm font-semibold ${titleTextClass}`}>{document.createdBy}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-base-content/45' : 'text-gray-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Date</span>
                <span className={`text-sm font-semibold ${titleTextClass}`}>{document.createdAt}</span>
              </div>

              {/* Physical Location Input */}
              <div className="pt-3">
                <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Physical Location (Optional)</label>
                <div className={fieldSurfaceClass}>
                  <input
                    type="text"
                    value={physicalLocation}
                    onChange={(e) => setPhysicalLocation(e.target.value)}
                    placeholder="Enter physical location of document (e.g., Cabinet A, Shelf 3)..."
                    className={`w-full border-none bg-transparent leading-relaxed focus:outline-none focus:ring-0 ${
                      isDashboardThemeEnabled
                        ? 'text-base-content placeholder:text-base-content/40'
                        : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 pb-8 space-y-3.5">
            <button
              onClick={handleAcceptAI}
              disabled={isProcessing || processingStatus === 'error'}
              className={`w-full rounded-xl py-4 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 shadow-lg hover:shadow-xl disabled:transform-none ${
                isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : ''
              }`}
              style={
                isDashboardThemeEnabled
                  ? undefined
                  : { background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }
              }
            >
              {isProcessing ? (
                <div className="flex items-center justify-center space-x-2">
                  <Brain className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </div>
              ) : (
                'Accept AI Suggestions'
              )}
            </button>

            <button
              onClick={handleManualReview}
              disabled={isProcessing}
              className={`w-full rounded-xl border py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md disabled:transform-none ${
                isDashboardThemeEnabled
                  ? 'border-base-300 bg-base-100 text-base-content hover:bg-base-200'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Manual Review
            </button>

            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className={`w-full rounded-xl border py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md disabled:transform-none ${
                isDashboardThemeEnabled
                  ? 'border-error/30 bg-base-100 text-error hover:bg-error/10'
                  : 'border-red-200 bg-white text-red-600 hover:bg-red-50'
              }`}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className={`text-sm ${isDashboardThemeEnabled ? 'text-base-content/45' : 'text-gray-400'}`}>
            {processingStatus === 'completed'
              ? 'AI processing completed • Review AI suggestions before accepting'
              : 'AI analysis ready • Review suggestions before accepting'
            }
          </p>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/30 p-4 pb-10 backdrop-blur-[2px]">
          <div className={`mb-60 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ${
            isDashboardThemeEnabled ? 'border border-base-300 bg-base-100' : 'bg-white'
          }`}>
            <div className={`border-b px-6 py-5 ${sectionBorderClass} ${isDashboardThemeEnabled ? 'bg-base-200/80' : 'bg-gray-50/50'}`}>
              <div className="flex items-center">
                <div className={`mr-3 rounded-lg p-2.5 ${isDashboardThemeEnabled ? 'bg-error/10' : 'bg-red-100'}`}>
                  <AlertCircle className={`w-5 h-5 ${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-lg font-bold ${titleTextClass}`}>Cancel Processing?</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className={`text-sm leading-relaxed ${bodyTextClass}`}>
                Are you sure you want to cancel? This will <span className={`font-bold ${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}`}>delete the uploaded document</span> and all AI-generated data.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmCancel}
                  className={`flex-1 rounded-lg py-3 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 shadow-md hover:shadow-lg ${
                    isDashboardThemeEnabled ? 'bg-error hover:bg-error/90' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Yes, Cancel & Delete
                </button>
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className={`flex-1 rounded-lg border py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                    isDashboardThemeEnabled
                      ? 'border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200 hover:text-base-content'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel All Remaining Dialog */}
      {showCancelAllDialog && (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center bg-black/30 p-4 pb-10 backdrop-blur-[2px]">
          <div className={`mb-60 w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ${
            isDashboardThemeEnabled ? 'border border-base-300 bg-base-100' : 'bg-white'
          }`}>
            <div className={`border-b px-6 py-5 ${sectionBorderClass} ${isDashboardThemeEnabled ? 'bg-base-200/80' : 'bg-gray-50/50'}`}>
              <div className="flex items-center">
                <div className={`mr-3 rounded-lg p-2.5 ${isDashboardThemeEnabled ? 'bg-error/10' : 'bg-red-100'}`}>
                  <AlertCircle className={`w-5 h-5 ${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}`} />
                </div>
                <h3 className={`text-lg font-bold ${titleTextClass}`}>Cancel All Remaining?</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className={`text-sm leading-relaxed ${bodyTextClass}`}>
                You have <span className={`font-bold ${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}`}>{remainingCount + 1} document{remainingCount !== 0 ? 's' : ''}</span> remaining (including this one).
                This will cancel the current document and skip all remaining documents in the queue.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmCancelAll}
                  className={`flex-1 rounded-lg py-3 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 shadow-md hover:shadow-lg ${
                    isDashboardThemeEnabled ? 'bg-error hover:bg-error/90' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Cancel All
                </button>
                <button
                  onClick={() => setShowCancelAllDialog(false)}
                  className={`flex-1 rounded-lg border py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                    isDashboardThemeEnabled
                      ? 'border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200 hover:text-base-content'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Dialog - Rendered in Portal to avoid overflow/z-index issues */}
      {showCreateFolderDialog && createPortal(
        <div
          data-theme={isDashboardThemeEnabled ? theme : undefined}
          className="fixed inset-0 z-[100000] flex items-start justify-center bg-black/30 p-4 pt-20 backdrop-blur-[2px]"
        >
          <div className={`w-full max-w-md overflow-hidden rounded-2xl shadow-2xl ${
            isDashboardThemeEnabled ? 'border border-base-300 bg-base-100' : 'bg-white'
          }`}>
            <div className={`border-b px-6 py-5 ${sectionBorderClass} ${isDashboardThemeEnabled ? 'bg-base-200/80' : 'bg-gray-50/50'}`}>
              <div className="flex items-center">
                <div className={`mr-3 rounded-lg p-2.5 ${isDashboardThemeEnabled ? 'bg-warning/10' : 'bg-yellow-100'}`}>
                  <AlertCircle className={`w-5 h-5 ${isDashboardThemeEnabled ? 'text-warning' : 'text-yellow-600'}`} />
                </div>
                <h3 className={`text-lg font-bold ${titleTextClass}`}>Folder Not Found</h3>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className={`text-sm leading-relaxed ${bodyTextClass}`}>
                The AI suggested folder <span className={`font-bold ${isDashboardThemeEnabled ? 'text-primary' : 'text-[#228B22]'}`}>"{aiSuggestedFolder}"</span> does not exist yet. Would you like to create it now?
              </p>

              <div>
                <label className={`mb-2 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className={`w-full rounded-lg border px-4 py-3 focus:outline-none focus:ring-2 ${
                    isDashboardThemeEnabled
                      ? 'border-base-300 bg-base-200 text-base-content placeholder:text-base-content/40 focus:ring-primary/25'
                      : 'border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:ring-green-500/50'
                  }`}
                  placeholder="Enter folder name..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder}
                  className={`flex-1 rounded-lg py-3 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 shadow-md hover:shadow-lg ${
                    isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : ''
                  }`}
                  style={
                    isDashboardThemeEnabled
                      ? undefined
                      : { background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }
                  }
                >
                  {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateFolderDialog(false);
                    setNewFolderName('');
                  }}
                  disabled={isCreatingFolder}
                  className={`flex-1 rounded-lg border py-3 text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm ${
                    isDashboardThemeEnabled
                      ? 'border-base-300 bg-base-100 text-base-content/70 hover:bg-base-200 hover:text-base-content'
                      : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  Skip
                </button>
              </div>

              <p className={`text-center text-xs ${isDashboardThemeEnabled ? 'text-base-content/45' : 'text-gray-400'}`}>
                You can manually select a different folder from the dropdown above
              </p>
            </div>
          </div>
        </div>,
        window.document.body
      )}

      {/* Document Viewer */}
      <UploadDocumentViewer
        isOpen={viewerOpen}
        onClose={() => setViewerOpen(false)}
        docId={documentData?.doc_id || null}
        fileName={document.fileName || 'Document'}
        theme={theme}
        isDashboardThemeEnabled={isDashboardThemeEnabled}
      />
    </div>
  );
};

export default AIProcessing;
