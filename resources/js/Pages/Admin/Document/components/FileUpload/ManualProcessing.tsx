import React, { useState, useEffect } from 'react';
import { FileText, Folder, Save, X, ChevronDown, Calendar, User, CheckCircle, AlertCircle, Eye } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';
import DocumentQueueNavigation from './DocumentQueueNavigation';
import { useDocumentQueue } from '../../hooks/useDocumentQueue';
import UploadDocumentViewer from './UploadDocumentViewer';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

interface Folder {
  folder_id: number;
  folder_name: string;
  folder_path: string;
  parent_folder_id: number | null;
}

interface FormData {
  title: string;
  selectedFolderId: number | null;
  description: string;
  remarks: string;
  physicalLocation: string;
  documentRefId: string;
}

const ManualProcessing = ({
  documentData = null,
  uploadedFile = null,
  onSave = (formData: FormData) => { },
  onCancel = () => { }
}) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  // State for real database data
  const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    title: documentData?.title || '',
    selectedFolderId: documentData?.folder_id || null,
    description: documentData?.description || documentData?.analysis || '',
    remarks: documentData?.remarks || '',
    physicalLocation: documentData?.physical_location || '',
    documentRefId: documentData?.document_ref_id || ''
  });

  const [dropdownStates, setDropdownStates] = useState({
    location: false
  });

  const [errors, setErrors] = useState({
    documentRefId: '',
    title: ''
  });

  const docRefIdInputRef = React.useRef<HTMLInputElement>(null);

  // Update form data when documentData changes
  useEffect(() => {
    if (documentData) {
      console.log('ManualProcessing - documentData:', documentData);

      // Update formData
      setFormData({
        title: documentData.title || '',
        selectedFolderId: documentData.folder_id || null,
        description: documentData.description || documentData.analysis || (documentData as any).suggested_description || '',
        remarks: documentData.remarks || (documentData as any).ai_remarks || '',
        physicalLocation: documentData.physical_location || '',
        documentRefId: documentData.document_ref_id || ''
      });

      // Also update selectedFolderId directly if folder_id exists in documentData
      // This ensures the folder dropdown shows the correct selection
      const folderId = documentData.folder_id || (documentData as any).ai_suggested_folder_id;
      if (folderId) {
        setFormData(prev => ({
          ...prev,
          selectedFolderId: folderId
        }));
      }
    }
  }, [documentData]);

  // Fetch folders from database
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch folders
        const foldersResponse = await axios.get('/api/manual-process/folders', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });

        setAvailableFolders(foldersResponse.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load folders');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user types
    if (errors[field as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };


  // Custom Cancel Modal State
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Document queue management for multi-document upload flow
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

  const handleCancel = () => {
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    // Delete the document from database if it exists
    if (documentData?.doc_id) {
      setSaving(true);
      setShowCancelDialog(false);

      try {
        const axios = (await import('axios')).default;
        await axios.delete(`/api/documents/${documentData.doc_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });

        // Show success message
        const toast = window.document.createElement('div');
        toast.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
        toast.textContent = hasQueue && !isLastDocument
          ? `Document deleted. Moving to next (${remainingCount} remaining)...`
          : 'Document deleted successfully';
        window.document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);

        // Navigate to next document or back to document list
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
        alert('Failed to delete document. Redirecting anyway...');
        clearQueue();
        router.visit('/admin/documents');
      } finally {
        setSaving(false);
      }
    } else {
      clearQueue();
      router.visit('/admin/documents');
    }
  };

  const toggleDropdown = (dropdown) => {
    setDropdownStates(prev => ({
      ...prev,
      [dropdown]: !prev[dropdown]
    }));
  };

  const selectFolder = (folder: Folder) => {
    handleInputChange('selectedFolderId', folder.folder_id);
    setDropdownStates(prev => ({
      ...prev,
      location: false
    }));
  };

  // Helper function to get selected folder name with path
  const getSelectedFolderName = () => {
    const selectedFolder = availableFolders.find(folder => folder.folder_id === formData.selectedFolderId);
    return selectedFolder ? selectedFolder.folder_name : '';
  };

  // Handle form validation
  const validateForm = (): boolean => {
    let isValid = true;
    const newErrors = {
      documentRefId: '',
      title: ''
    };

    if (!formData.title.trim()) {
      newErrors.title = 'Please enter a document title';
      isValid = false;
    }

    if (!formData.documentRefId.trim()) {
      newErrors.documentRefId = 'Please enter a Document ID';
      if (docRefIdInputRef.current) {
        docRefIdInputRef.current.focus();
      }
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle save document - Edit existing uploaded document metadata
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      if (!documentData?.doc_id) {
        alert('Error: No document found. Please upload a file first, then navigate from the AI processing page.');
        setSaving(false);
        return;
      }

      // Update existing uploaded document metadata
      const dataToSend = {
        doc_id: documentData.doc_id,
        title: formData.title,
        folder_id: formData.selectedFolderId,
        description: formData.description,
        remarks: formData.remarks,
        physical_location: formData.physicalLocation,
        document_ref_id: formData.documentRefId
      };

      console.log('Updating document metadata:', dataToSend);

      const response = await axios.post('/api/manual-process/update', dataToSend, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      if (response.data.success) {
        // Show success toast
        const toast = window.document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
        const hasMoreDocs = hasQueue && !isLastDocument;
        toast.textContent = hasMoreDocs
          ? `Document ${currentPosition}/${totalDocuments} saved! Moving to next...`
          : 'Document saved successfully!';
        window.document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);

        onSave(formData);

        // Navigate to next document or back to document list
        setTimeout(() => {
          if (hasMoreDocs) {
            goToNextDocument();
          } else {
            clearQueue();
            router.visit('/admin/documents');
          }
        }, 1000);
      } else {
        alert('Failed to update document: ' + response.data.message);
      }
    } catch (error: any) {
      console.error('Save error:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      alert('Error saving document: ' + errorMessage);
    } finally {
      setSaving(false);
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`mb-3 text-3xl font-bold tracking-tight ${titleTextClass}`}>Manual Document Processing</h1>
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
            <CheckCircle className={`w-5 h-5 ${isDashboardThemeEnabled ? 'text-success' : 'text-[#228B22]'}`} />
            <span className={`text-sm font-medium tracking-wide ${bodyTextClass}`}>Manual Review Mode</span>
            <span className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              isDashboardThemeEnabled
                ? 'border-primary/20 bg-primary/10 text-primary'
                : 'border-green-200 bg-green-100 text-[#228B22]'
            }`}>
              Human-Verified Entry
            </span>
          </div>
        </div>

        {/* Document Queue Navigation - shows when multiple documents uploaded */}
        {hasQueue && (
          <DocumentQueueNavigation
            currentPosition={currentPosition}
            totalDocuments={totalDocuments}
            isFirstDocument={isFirstDocument}
            isLastDocument={isLastDocument}
            onPrevious={goToPreviousDocument}
            onNext={goToNextDocument}
            isDashboardThemeEnabled={isDashboardThemeEnabled}
          />
        )}

        {/* Main Content Card */}
        <div className={`overflow-hidden rounded-2xl border shadow-xl ${
          isDashboardThemeEnabled
            ? 'border-base-300 bg-base-100 shadow-base-content/10'
            : 'border-gray-100 bg-white'
        }`}>
          {/* Document Uploaded Section */}
          <div className={`border-b px-8 py-6 ${sectionBorderClass} ${isDashboardThemeEnabled ? 'bg-base-200/65' : 'bg-gray-50/50'}`}>
            <h2 className={`mb-4 text-sm font-bold uppercase tracking-wider ${mutedTextClass}`}>Document Uploaded</h2>
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className={`p-2.5 ${accentIconClass}`} style={accentIconStyle}>
                  <FileText className={`w-5 h-5 flex-shrink-0 ${accentIconTextClass}`} />
                </div>
                <p className={`mt-0.5 text-base font-medium leading-relaxed ${titleTextClass}`}>
                  "{documentData?.fileName || 'No file selected'}"
                </p>
              </div>

              {documentData?.doc_id && (
                <button
                  onClick={() => setIsViewerOpen(true)}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${
                    isDashboardThemeEnabled
                      ? 'border-info/20 bg-info/10 text-info hover:bg-info/15'
                      : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  View File
                </button>
              )}
            </div>
          </div>

          {/* Manual Entry Fields Section */}
          <div className={`border-b px-8 py-6 ${sectionBorderClass} ${isDashboardThemeEnabled ? 'bg-base-100' : 'bg-green-50/10'}`}>
            <h3 className={`mb-5 flex items-center text-base font-bold uppercase tracking-wider ${titleTextClass}`}>
              <div className={`mr-3 p-2.5 ${accentIconClass}`} style={accentIconStyle}>
                <User className={`w-5 h-5 ${accentIconTextClass}`} />
              </div>
              Manual Document Details
            </h3>

            <div className="space-y-5">
              {/* Document ID - Moved to Top & Required */}
              <div>
                <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Document ID</label>
                <div className={fieldSurfaceClass}>
                  <input
                    ref={docRefIdInputRef}
                    type="text"
                    value={formData.documentRefId}
                    onChange={(e) => handleInputChange('documentRefId', e.target.value)}
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

              {/* Document Title */}
              <div>
                <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Document Title</label>
                <div className={fieldSurfaceClass}>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter document title..."
                    className={`w-full border-none bg-transparent font-medium leading-relaxed focus:outline-none focus:ring-0 ${
                      errors.title
                        ? isDashboardThemeEnabled
                          ? 'text-error placeholder:text-error/50'
                          : 'text-red-900 placeholder-gray-400'
                        : isDashboardThemeEnabled
                          ? 'text-base-content placeholder:text-base-content/40'
                          : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
                {errors.title && (
                  <p className="mt-2 text-sm text-red-600 font-medium flex items-center animate-pulse">
                    <AlertCircle className="w-4 h-4 mr-1.5" />
                    {errors.title}
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Description</label>
                <div className={fieldSurfaceClass}>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter document description..."
                    rows={3}
                    className={`w-full resize-none border-none bg-transparent text-sm leading-relaxed focus:outline-none focus:ring-0 ${
                      isDashboardThemeEnabled
                        ? 'text-base-content/80 placeholder:text-base-content/40'
                        : 'text-gray-700 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Remarks</label>
                <div className={fieldSurfaceClass}>
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    placeholder="Enter additional remarks or notes..."
                    rows={3}
                    className={`w-full resize-none border-none bg-transparent text-sm leading-relaxed focus:outline-none focus:ring-0 ${
                      isDashboardThemeEnabled
                        ? 'text-base-content/80 placeholder:text-base-content/40'
                        : 'text-gray-700 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>

              {/* Physical Location */}
              <div>
                <label className={`mb-2.5 block text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Physical Location (Optional)</label>
                <div className={fieldSurfaceClass}>
                  <input
                    type="text"
                    value={formData.physicalLocation}
                    onChange={(e) => handleInputChange('physicalLocation', e.target.value)}
                    placeholder="Enter physical location of document (e.g., Cabinet A, Shelf 3)..."
                    className={`w-full border-none bg-transparent font-medium leading-relaxed focus:outline-none focus:ring-0 ${
                      isDashboardThemeEnabled
                        ? 'text-base-content placeholder:text-base-content/40'
                        : 'text-gray-900 placeholder-gray-400'
                    }`}
                  />
                </div>
              </div>
            </div>
          </div>

        {/* Folder Selection Section */}
        <div className={`px-8 py-6 space-y-6 transition-all duration-200 ${dropdownStates.location ? 'pb-60' : ''}`}>
          {/* Folder Selection */}
          <div className="relative z-50">
            <h4 className={`mb-3 flex items-center text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>
              <div className={`mr-2.5 p-2.5 ${accentIconClass}`} style={accentIconStyle}>
                <Folder className={`w-4 h-4 ${accentIconTextClass}`} />
              </div>
              Folder Location
            </h4>
            <div className={dropdownSurfaceClass}>
              <div className="relative">
                <button
                  onClick={() => toggleDropdown('location')}
                  className={`flex w-full items-center justify-between p-4 text-left font-medium focus:outline-none ${titleTextClass}`}
                >
                  <span className={formData.selectedFolderId ? titleTextClass : mutedTextClass}>
                    {getSelectedFolderName() || 'Select a folder...'}
                  </span>
                  <ChevronDown className={`h-5 w-5 transition-transform ${dropdownStates.location ? 'rotate-180' : ''} ${
                    isDashboardThemeEnabled ? 'text-base-content/45' : 'text-gray-400'
                  }`} />
                </button>

                {dropdownStates.location && (
                  <div
                    className={`custom-scrollbar absolute z-[999] mt-1 max-h-48 w-full overflow-y-auto rounded-xl shadow-2xl ${
                      isDashboardThemeEnabled
                        ? 'border border-base-300 bg-base-100'
                        : 'border border-gray-100 bg-white'
                    }`}
                  >
                    {loading ? (
                      <div className={`px-4 py-3 font-medium ${mutedTextClass}`}>Loading folders...</div>
                    ) : error ? (
                      <div className={`px-4 py-3 font-medium ${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}`}>Error loading folders</div>
                    ) : availableFolders.length === 0 ? (
                      <div className={`px-4 py-3 font-medium ${mutedTextClass}`}>No folders available</div>
                    ) : (
                      availableFolders.map((folder) => {
                        // Determine if this is a subfolder by checking parent_folder_id
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
                              {isSubfolder && <span className={isDashboardThemeEnabled ? 'text-primary' : 'text-[#228B22]'}>|-</span>}
                              {folder.folder_name}
                            </div>
                            <div className={`mt-1 text-xs tracking-wide ${mutedTextClass}`}>{folder.folder_path}</div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Additional Details */}
          <div className={`grid gap-6 border-t pt-5 md:grid-cols-2 ${
            isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'
          }`}>
            <div className="space-y-3.5">
              <div className="flex items-center space-x-3">
                <User className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-base-content/45' : 'text-gray-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Created by</span>
                <span className={`text-sm font-semibold ${titleTextClass}`}>{documentData?.createdBy || 'Current User'}</span>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-base-content/45' : 'text-gray-400'}`} />
                <span className={`text-xs font-bold uppercase tracking-wider ${mutedTextClass}`}>Date</span>
                <span className={`text-sm font-semibold ${titleTextClass}`}>{documentData?.createdAt || new Date().toISOString().split('T')[0]}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 pb-8 space-y-3.5">
          <button
            onClick={handleSave}
            disabled={saving || !documentData?.doc_id}
            className={`w-full rounded-xl py-4 text-sm font-bold uppercase tracking-wider text-white transition-all duration-200 shadow-lg hover:shadow-xl disabled:transform-none ${
              isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : ''
            }`}
            style={
              isDashboardThemeEnabled
                ? undefined
                : { background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }
            }
          >
            {saving ? (
              <div className="flex items-center justify-center space-x-2">
                <CheckCircle className="w-4 h-4 animate-spin" />
                <span>Saving Manual Entry...</span>
              </div>
            ) : (
              'Save Manual Entry'
            )}
          </button>

          <button
            onClick={() => {
              const docId = documentData?.doc_id;
              const url = docId ? `/ai-processing?docId=${docId}` : '/ai-processing';
              router.visit(url);
            }}
            disabled={saving}
            className={`w-full rounded-xl border py-4 text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-sm hover:shadow-md disabled:transform-none ${
              isDashboardThemeEnabled
                ? 'border-base-300 bg-base-100 text-base-content hover:bg-base-200'
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Back to AI Processing
          </button>

          <button
            onClick={handleCancel}
            disabled={saving}
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
          Manual processing mode • Review and update document details before saving
        </p>
      </div>

      </div>

      {/* Cancel Confirmation Dialog */}
      {
        showCancelDialog && (
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
                  Are you sure you want to cancel? This will <span className={`font-bold ${isDashboardThemeEnabled ? 'text-error' : 'text-red-600'}`}>delete the uploaded document</span> and all manually entered data.
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
        )
      }

      <UploadDocumentViewer
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        docId={documentData?.doc_id || null}
        fileName={documentData?.fileName || documentData?.title || 'Document'}
        theme={theme}
        isDashboardThemeEnabled={isDashboardThemeEnabled}
      />
    </div >
  );
};

export default ManualProcessing;
