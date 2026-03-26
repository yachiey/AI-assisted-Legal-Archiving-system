import React, { useState, useEffect } from 'react';
import { FileText, Folder, Save, X, ChevronDown, Calendar, User, CheckCircle } from 'lucide-react';
import { router } from '@inertiajs/react';
import axios from 'axios';

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
}

const ManualProcessing = ({
  documentData = null,
  uploadedFile = null,
  onSave = (formData: FormData) => { },
  onCancel = () => { }
}) => {
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
    physicalLocation: documentData?.physical_location || ''
  });

  const [dropdownStates, setDropdownStates] = useState({
    location: false
  });

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
        physicalLocation: documentData.physical_location || ''
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
  };

  const handleCancel = async () => {
    // Delete the document from database if it exists (same behavior as AIProcessing)
    if (documentData?.doc_id) {
      const confirmDelete = window.confirm(
        'Are you sure you want to cancel? This will delete the uploaded document.'
      );

      if (!confirmDelete) {
        return;
      }

      setSaving(true); // Reuse saving state to show loading/disable buttons
      try {
        const response = await axios.delete(`/api/documents/${documentData.doc_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Accept': 'application/json'
          }
        });

        // Show success message
        const toast = window.document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-xl z-50';
        toast.textContent = 'Document deleted successfully';
        window.document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);

        // Navigate back after short delay
        setTimeout(() => {
          router.visit('/admin/documents');
        }, 1000);

      } catch (error) {
        console.error('Failed to delete document:', error);
        alert('Failed to delete document. Redirecting anyway...');
        router.visit('/admin/documents');
      }
    } else {
      // No document to delete, just navigate back
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
    if (!formData.title.trim()) {
      alert('Please enter a document title');
      return false;
    }

    return true;
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
        physical_location: formData.physicalLocation
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
        alert('Document updated successfully!');
        onSave(formData);
        router.visit('/admin/documents');
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

  return (
    <div className="min-h-screen p-4" style={{
      background: 'rgba(0, 0, 0, 0.3)',
    }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-3 tracking-tight">Manual Document Processing</h1>
          <div className="h-1 w-32 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg"></div>

          {/* Status Indicator */}
          <div className="mt-5 flex items-center space-x-3">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-white/95 tracking-wide">Manual Review Mode</span>
            <span className="text-xs bg-green-500/20 text-green-200 px-3 py-1.5 rounded-full border border-green-400/30 font-medium">
              Human-Verified Entry
            </span>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="rounded-2xl shadow-xl overflow-hidden" style={{
          background: 'linear-gradient(135deg, #0c3b0cff 0%, #645a0aff 100%)',
          border: '1px solid rgba(34, 139, 34, 0.3)',
          boxShadow: '0 10px 40px 0 rgba(0, 0, 0, 0.3)'
        }}>
          {/* Document Uploaded Section */}
          <div className="px-8 py-6 border-b border-white/30" style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25) 0%, rgba(255, 255, 255, 0.15) 100%)'
          }}>
            <h2 className="text-sm font-bold text-white/90 mb-4 uppercase tracking-wider">Document Uploaded</h2>
            <div className="flex items-start space-x-4">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-lg shadow-lg">
                <FileText className="w-5 h-5 text-white flex-shrink-0" />
              </div>
              <p className="text-white text-base leading-relaxed font-medium mt-0.5">
                "{documentData?.fileName || 'No file selected'}"
              </p>
            </div>
          </div>

          {/* Manual Entry Fields Section */}
          <div className="px-8 py-6 border-b border-white/30" style={{
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)'
          }}>
            <h3 className="text-base font-bold text-white mb-5 flex items-center uppercase tracking-wider">
              <div className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-lg mr-3 shadow-lg">
                <User className="w-5 h-5 text-white" />
              </div>
              Manual Document Details
            </h3>

            <div className="space-y-5">
              {/* Document Title */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-2.5 uppercase tracking-wider">Document Title</label>
                <div className="bg-white/15 p-4 rounded-lg border border-green-500/40 backdrop-blur-sm shadow-sm">
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter document title..."
                    className="w-full text-white font-medium bg-transparent border-none focus:outline-none focus:ring-0 placeholder-white/60 leading-relaxed"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-2.5 uppercase tracking-wider">Description</label>
                <div className="bg-white/15 p-4 rounded-lg border border-green-500/40 backdrop-blur-sm shadow-sm">
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Enter document description..."
                    rows={3}
                    className="w-full text-white/95 text-sm bg-transparent border-none focus:outline-none focus:ring-0 resize-none placeholder-white/60 leading-relaxed"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-2.5 uppercase tracking-wider">Remarks</label>
                <div className="bg-white/15 p-4 rounded-lg border border-green-500/40 backdrop-blur-sm shadow-sm">
                  <textarea
                    value={formData.remarks}
                    onChange={(e) => handleInputChange('remarks', e.target.value)}
                    placeholder="Enter additional remarks or notes..."
                    rows={3}
                    className="w-full text-white/95 text-sm bg-transparent border-none focus:outline-none focus:ring-0 resize-none placeholder-white/60 leading-relaxed"
                  />
                </div>
              </div>

              {/* Physical Location */}
              <div>
                <label className="block text-xs font-bold text-white/80 mb-2.5 uppercase tracking-wider">Physical Location (Optional)</label>
                <div className="bg-white/15 p-4 rounded-lg border border-green-500/40 backdrop-blur-sm shadow-sm">
                  <input
                    type="text"
                    value={formData.physicalLocation}
                    onChange={(e) => handleInputChange('physicalLocation', e.target.value)}
                    placeholder="Enter physical location of document (e.g., Cabinet A, Shelf 3)..."
                    className="w-full text-white font-medium bg-transparent border-none focus:outline-none focus:ring-0 placeholder-white/60 leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Folder Selection Section */}
          <div className={`px-8 py-6 space-y-6 transition-all duration-200 ${dropdownStates.location ? 'pb-60' : ''}`}>
            {/* Folder Selection */}
            <div className="relative z-50">
              <h4 className="text-xs font-bold text-white/80 mb-3 flex items-center uppercase tracking-wider">
                <div className="bg-gradient-to-br from-green-500 to-green-600 p-2.5 rounded-lg mr-2.5 shadow-lg">
                  <Folder className="w-4 h-4 text-white" />
                </div>
                Folder Location
              </h4>
              <div className="bg-white/15 p-4 rounded-lg border border-green-500/40 backdrop-blur-sm shadow-sm">
                <div className="relative">
                  <button
                    onClick={() => toggleDropdown('location')}
                    className="w-full text-left flex items-center justify-between text-white font-medium focus:outline-none"
                  >
                    <span className={formData.selectedFolderId ? 'text-white font-medium' : 'text-white/70'}>
                      {getSelectedFolderName() || 'Select a folder...'}
                    </span>
                    <ChevronDown className={`w-5 h-5 text-white transition-transform ${dropdownStates.location ? 'rotate-180' : ''}`} />
                  </button>

                  {dropdownStates.location && (
                    <div
                      className="absolute z-[999] w-full mt-1 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar"
                      style={{
                        background: 'white',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)'
                      }}>
                      {loading ? (
                        <div className="px-4 py-3 text-gray-700 font-medium">Loading folders...</div>
                      ) : error ? (
                        <div className="px-4 py-3 text-red-600 font-medium">Error loading folders</div>
                      ) : availableFolders.length === 0 ? (
                        <div className="px-4 py-3 text-gray-700 font-medium">No folders available</div>
                      ) : (
                        availableFolders.map((folder) => {
                          // Determine if this is a subfolder by checking parent_folder_id
                          const isSubfolder = folder.parent_folder_id != null;

                          return (
                            <button
                              key={folder.folder_id}
                              onClick={() => selectFolder(folder)}
                              className="w-full px-4 py-3 text-left hover:bg-green-500/10 border-b border-gray-200/50 last:border-b-0 transition-all duration-200"
                              style={{ paddingLeft: isSubfolder ? '2rem' : '1rem' }}
                            >
                              <div className="font-semibold flex items-center gap-2 tracking-wide text-gray-900">
                                {isSubfolder && <span className="text-green-600">└─</span>}
                                {folder.folder_name}
                              </div>
                              <div className="text-xs text-gray-600 mt-1 tracking-wide">{folder.folder_path}</div>
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
            <div className="grid md:grid-cols-2 gap-6 pt-5 border-t border-white/20">
              <div className="space-y-3.5">
                <div className="flex items-center space-x-3">
                  <User className="w-4 h-4 text-white/80" />
                  <span className="text-xs text-white/80 uppercase tracking-wider font-bold">Created by</span>
                  <span className="text-sm font-semibold text-white">{documentData?.createdBy || 'Current User'}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-4 h-4 text-white/80" />
                  <span className="text-xs text-white/80 uppercase tracking-wider font-bold">Date</span>
                  <span className="text-sm font-semibold text-white">{documentData?.createdAt || new Date().toISOString().split('T')[0]}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-8 pb-8 space-y-3.5">
            <button
              onClick={handleSave}
              disabled={saving || !documentData?.doc_id}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-green-300 disabled:to-green-300 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
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
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:from-blue-300 disabled:to-blue-300 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              Back to AI Processing
            </button>

            <button
              onClick={handleCancel}
              disabled={saving}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-red-300 disabled:to-red-300 text-white py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all duration-200 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 disabled:transform-none"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-white">
            Manual processing mode • Review and update document details before saving
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManualProcessing;