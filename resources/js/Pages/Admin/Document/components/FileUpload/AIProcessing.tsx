import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ProcessingModal from '../../../../../Components/Modal/Processing/ProcessingModal';

import { FileText, Folder, Calendar, User, Brain, CheckCircle, AlertCircle, ChevronDown, Eye, Plus } from 'lucide-react';
import { router } from '@inertiajs/react';
import UploadDocumentViewer from './UploadDocumentViewer';
import DocumentQueueNavigation from './DocumentQueueNavigation';
import { useDocumentQueue } from '../../hooks/useDocumentQueue';

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
    if (!documentRefId.trim()) {
      setErrors({ documentRefId: 'Please enter a Document ID' });
      if (docRefIdInputRef.current) {
        docRefIdInputRef.current.focus();
      }
      return;
    }
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
        return <Brain className="w-5 h-5 text-gray-600" />;
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

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <ProcessingModal
        isOpen={processingStatus === 'analyzing' || processingStatus === 'processing'}
        step={processingStatus === 'analyzing' ? 'extracting' : 'analyzing'}
        details={
          processingStatus === 'analyzing'
            ? 'Extracting text & generating embeddings...'
            : 'Finalizing document processing...'
        }
      />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-3 tracking-tight">AI Document Processing</h1>
          <div className="h-1 w-32 rounded-full shadow-lg" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}></div>

          {/* Status Indicator */}
          <div className="mt-5 flex items-center space-x-3">
            {getStatusIcon()}
            <span className="text-sm font-medium text-gray-700 tracking-wide">{getStatusText()}</span>
            <span className="text-xs bg-green-100 text-[#228B22] px-3 py-1.5 rounded-full border border-green-200 font-medium">
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
          />
        )}

        {/* Error Message */}
        {processingStatus === 'error' && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-700 font-medium">Processing Error</p>
            </div>
            <p className="text-red-600 text-sm mt-1">{errorMessage}</p>
          </div>
        )}

        {/* Main Content Card */}
        <div className="rounded-2xl shadow-xl overflow-hidden bg-white border border-gray-100">
          {/* Document Uploaded Section */}
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Document Uploaded</h2>
              {documentData?.doc_id && (
                <button
                  onClick={() => setViewerOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-gray-700 rounded-lg transition-all duration-200 text-sm font-medium border border-gray-200 shadow-sm"
                >
                  <Eye className="w-4 h-4" />
                  View File
                </button>
              )}
            </div>
            <div className="flex items-start space-x-4">
              <div className="p-2.5 rounded-lg shadow-md" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                <FileText className="w-5 h-5 text-white flex-shrink-0" />
              </div>
              <p className="text-gray-900 text-base leading-relaxed font-medium mt-0.5">
                "{getSelectedFolderName() || aiSuggestedFolder ? `${getSelectedFolderName() || aiSuggestedFolder}/` : ''}{document.fileName}"
              </p>
            </div>
          </div>

          {/* AI-Generated Fields Section */}
          <div className="px-8 py-6 border-b border-gray-100 bg-green-50/10">
            <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center uppercase tracking-wider">
              <div className="p-2.5 rounded-lg mr-3 shadow-md" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                <Brain className="w-5 h-5 text-white" />
              </div>
              AI-Generated Details
            </h3>

            <div className="space-y-5">
              {/* Document ID - Moved to Top & Required */}
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Document ID</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <input
                    ref={docRefIdInputRef}
                    type="text"
                    value={documentRefId}
                    onChange={(e) => {
                      setDocumentRefId(e.target.value);
                      if (errors.documentRefId) setErrors({ documentRefId: '' });
                    }}
                    placeholder="Enter document reference ID (e.g., DOC-2024-001)..."
                    className={`w-full font-medium bg-transparent border-none focus:outline-none focus:ring-0 placeholder-gray-400 leading-relaxed ${errors.documentRefId ? 'text-red-900' : 'text-gray-900'}`}
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
                  <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Suggested Title</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-gray-900 font-medium leading-relaxed">{document.title || document.fileName || "Untitled Document"}</p>
                  </div>
                </div>

                {/* AI-Generated Description */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">AI Description</label>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                    <p className="text-gray-700 text-sm leading-relaxed">{document.description || "No description available"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Section */}
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="mb-4">
              <span className="inline-block text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider shadow-md" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                AI Analysis Summary
              </span>
            </div>
            <p className="text-gray-700 text-base leading-relaxed bg-green-50 p-5 rounded-lg border-l-4 border-[#228B22] font-normal">
              {document.description || "Document has been processed and is ready for review."}
            </p>

            {/* AI Remarks */}
            {document.remarks && (
              <div className="mt-6">
                <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Processing Remarks</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <p className="text-gray-700 text-sm leading-relaxed">{document.remarks}</p>
                </div>
              </div>
            )}
          </div>

          {/* Document Details */}
          <div className={`px-8 py-6 space-y-6 transition-all duration-200 ${dropdownOpen ? 'pb-60' : ''}`}>

            {/* AI-Suggested Folder */}
            <div className="relative z-50">
              <h4 className="text-xs font-bold text-gray-500 mb-3 flex items-center uppercase tracking-wider">
                <div className="p-2.5 rounded-lg mr-2.5 shadow-md" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
                  <Folder className="w-4 h-4 text-white" />
                </div>
                AI-Suggested Folder
              </h4>

              {/* Show AI recommendation if it exists */}
              {aiSuggestedFolder && (
                <div className="mb-3 bg-blue-50 px-4 py-2.5 rounded-lg border border-blue-200">
                  <p className="text-blue-700 text-xs">
                    <span className="font-semibold">AI Recommendation:</span> {aiSuggestedFolder}
                  </p>
                </div>
              )}

              {/* Folder Dropdown */}
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="w-full text-left flex items-center justify-between p-4 text-gray-900 font-medium focus:outline-none"
                  >
                    <span className={selectedFolderId ? 'text-gray-900 font-medium' : 'text-gray-500'}>
                      {getSelectedFolderName() || 'Select a folder...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute z-[999] w-full mt-1 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar bg-white border border-gray-100">
                      {availableFolders.length === 0 ? (
                        <div className="px-4 py-3 text-gray-500 font-medium">No folders available</div>
                      ) : (
                        availableFolders.map((folder) => {
                          const isSubfolder = folder.parent_folder_id != null;

                          return (
                            <button
                              key={folder.folder_id}
                              onClick={() => selectFolder(folder)}
                              className="w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-50 last:border-b-0 transition-all duration-200"
                              style={{ paddingLeft: isSubfolder ? '2rem' : '1rem' }}
                            >
                              <div className="font-semibold flex items-center gap-2 tracking-wide text-gray-900">
                                {isSubfolder && <span className="text-[#228B22]">└─</span>}
                                {folder.folder_name}
                              </div>
                              <div className="text-xs text-gray-500 mt-1 tracking-wide">{folder.folder_path}</div>
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
                        className="w-full px-4 py-3 text-left hover:bg-green-50 border-t border-gray-100 transition-all duration-200 text-[#228B22] font-bold flex items-center gap-2"
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
                <div className="mt-2 text-xs text-[#228B22] flex items-center font-medium">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Folder selected
                </div>
              )}
            </div>

            {/* Additional Details */}
            <div className="space-y-3.5 pt-5 border-t border-gray-200">
              <div className="flex items-center space-x-3">
                <User className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Created by</span>
                <span className="text-sm font-semibold text-gray-900">{document.createdBy}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Date</span>
                <span className="text-sm font-semibold text-gray-900">{document.createdAt}</span>
              </div>

              {/* Physical Location Input */}
              <div className="pt-3">
                <label className="block text-xs font-bold text-gray-500 mb-2.5 uppercase tracking-wider">Physical Location (Optional)</label>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                  <input
                    type="text"
                    value={physicalLocation}
                    onChange={(e) => setPhysicalLocation(e.target.value)}
                    placeholder="Enter physical location of document (e.g., Cabinet A, Shelf 3)..."
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
              className="w-full text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}
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
              className="w-full bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
            >
              Manual Review
            </button>

            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="w-full bg-white hover:bg-red-50 border border-red-200 text-red-600 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md transform hover:-translate-y-0.5 disabled:transform-none"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-400">
            {processingStatus === 'completed'
              ? 'AI processing completed • Review AI suggestions before accepting'
              : 'AI analysis ready • Review suggestions before accepting'
            }
          </p>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-end justify-center z-[9999] p-4 pb-10">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden mb-60">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center">
                <div className="bg-red-100 p-2.5 rounded-lg mr-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Cancel Processing?</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                Are you sure you want to cancel? This will <span className="font-bold text-red-600">delete the uploaded document</span> and all AI-generated data.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmCancel}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Yes, Cancel & Delete
                </button>
                <button
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-end justify-center z-[9999] p-4 pb-10">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden mb-60">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center">
                <div className="bg-red-100 p-2.5 rounded-lg mr-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Cancel All Remaining?</h3>
              </div>
            </div>
            <div className="px-6 py-5 space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                You have <span className="font-bold text-red-600">{remainingCount + 1} document{remainingCount !== 0 ? 's' : ''}</span> remaining (including this one).
                This will cancel the current document and skip all remaining documents in the queue.
              </p>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={confirmCancelAll}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
                >
                  Cancel All
                </button>
                <button
                  onClick={() => setShowCancelAllDialog(false)}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] flex items-start pt-20 justify-center z-[100000] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2.5 rounded-lg mr-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Folder Not Found</h3>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <p className="text-gray-600 text-sm leading-relaxed">
                The AI suggested folder <span className="font-bold text-[#228B22]">"{aiSuggestedFolder}"</span> does not exist yet. Would you like to create it now?
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                  Folder Name
                </label>
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  className="w-full bg-gray-50 text-gray-900 px-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500/50 placeholder-gray-400"
                  placeholder="Enter folder name..."
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleCreateFolder}
                  disabled={isCreatingFolder}
                  className="flex-1 text-white py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}
                >
                  {isCreatingFolder ? 'Creating...' : 'Create Folder'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateFolderDialog(false);
                    setNewFolderName('');
                  }}
                  disabled={isCreatingFolder}
                  className="flex-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm"
                >
                  Skip
                </button>
              </div>

              <p className="text-xs text-gray-400 text-center">
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
      />
    </div>
  );
};

export default AIProcessing;
