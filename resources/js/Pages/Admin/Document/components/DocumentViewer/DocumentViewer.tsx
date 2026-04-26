import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Image, AlertCircle } from 'lucide-react';
import { Document } from '../../types/types';
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from '../../../../../hooks/useDashboardTheme';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  document: Document | null;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({ isOpen, onClose, document }) => {
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [fileContent, setFileContent] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && document) {
      loadDocumentContent();
    }
    return () => {
      setFileContent(null);
      setError(null);
      setZoom(100);
      setRotation(0);
    };
  }, [isOpen, document]);

  if (!isOpen || !document) return null;

  const loadDocumentContent = async () => {
    if (!document?.doc_id) {
      setError('Document ID not found');
      return;
    }

    setLoading(true);
    setError(null);

    // Try multiple approaches to bypass ad blocker issues
    const loadMethods = [
      // Method 1: POST request with base64 encoding (most reliable)
      async () => {
        const response = await fetch(`/api/files/stream/${document.doc_id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'Failed to load document');
        }

        if (data.type === 'text') {
          setFileContent(data.content);
        } else if (data.type === 'binary' && data.encoding === 'base64') {
          // Decode base64 and create blob URL
          const binaryString = atob(data.content);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const blob = new Blob([bytes], { type: data.mime_type });
          const url = URL.createObjectURL(blob);
          setFileContent(url);
        } else {
          throw new Error('Unsupported content format');
        }
      },

      // Method 2: Alternative GET endpoint
      async () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/doc/${document.doc_id}/view`);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('auth_token')}`);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.responseType = 'arraybuffer';

        return new Promise<void>((resolve, reject) => {
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
              const contentType = xhr.getResponseHeader('content-type') || '';
              if (contentType.includes('application/json')) {
                const decoder = new TextDecoder();
                const text = decoder.decode(new Uint8Array(xhr.response));
                const data = JSON.parse(text);
                if (data.success === false) {
                  reject(new Error(data.error || 'Failed to load'));
                  return;
                }
                setFileContent(data.content);
                resolve();
              } else {
                const blob = new Blob([xhr.response], { type: contentType });
                const url = URL.createObjectURL(blob);
                setFileContent(url);
                resolve();
              }
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send();
        });
      },

      // Method 3: Original endpoint
      async () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', `/api/documents/${document.doc_id}/content`);
        xhr.setRequestHeader('Authorization', `Bearer ${localStorage.getItem('auth_token')}`);
        xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        xhr.responseType = 'arraybuffer';

        return new Promise<void>((resolve, reject) => {
          xhr.onload = function () {
            if (xhr.status >= 200 && xhr.status < 300) {
              const contentType = xhr.getResponseHeader('content-type') || '';
              if (contentType.includes('application/json')) {
                const decoder = new TextDecoder();
                const text = decoder.decode(new Uint8Array(xhr.response));
                const data = JSON.parse(text);
                if (data.success === false) {
                  reject(new Error(data.error || 'Failed to load'));
                  return;
                }
                setFileContent(data.content);
                resolve();
              } else {
                const blob = new Blob([xhr.response], { type: contentType });
                const url = URL.createObjectURL(blob);
                setFileContent(url);
                resolve();
              }
            } else {
              reject(new Error(`HTTP ${xhr.status}`));
            }
          };
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.send();
        });
      }
    ];

    // Try each method until one succeeds
    const tryMethods = async (methodIndex: number): Promise<void> => {
      if (methodIndex >= loadMethods.length) {
        setError('Could not load document. This may be due to browser security settings, ad blockers, or extensions. Please try disabling browser extensions or contact support.');
        setLoading(false);
        return;
      }

      try {
        await loadMethods[methodIndex]();
        setLoading(false);
      } catch (error) {
        console.log(`Method ${methodIndex + 1} failed:`, error);
        // Try next method
        tryMethods(methodIndex + 1);
      }
    };

    // Start with the first method
    tryMethods(0);
  };

  const getFileExtension = (filename: string | undefined | null): string => {
    if (!filename) return '';
    return filename.split('.').pop()?.toLowerCase() || '';
  };

  const getFileType = (document: Document): 'pdf' | 'image' | 'text' | 'unknown' => {
    // Use file_path instead of title for accurate type detection
    const filepath = document.file_path || document.title;
    const extension = getFileExtension(filepath);

    if (extension === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) return 'image';
    if (['txt', 'md', 'csv', 'json', 'xml', 'html'].includes(extension)) return 'text';

    return 'unknown';
  };

  const handleDownload = async () => {
    if (!document) return;

    try {
      // Log the download activity
      await fetch(`/api/documents/${document.doc_id}/log-download`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      });
    } catch (error) {
      console.error('Failed to log download:', error);
    }

    // Determine the best filename (ensure it has an extension)
    const filepath = document.file_path || document.title;
    const extension = filepath.split('.').pop()?.toLowerCase() || '';
    let downloadName = document.title;
    if (extension && !downloadName.toLowerCase().endsWith('.' + extension)) {
      downloadName = `${downloadName}.${extension}`;
    }

    // Proceed with download using blob if available, otherwise fallback to API
    if (fileContent) {
      const link = window.document.createElement('a');
      link.href = fileContent;
      link.download = downloadName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else {
      // Fallback: Use the new secure download API directly
      const link = window.document.createElement('a');
      link.href = `/api/documents/${document.doc_id}/download`;
      link.download = downloadName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const renderDocumentContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading document...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <AlertCircle className="w-16 h-16 mb-4 text-red-400" />
          <h3 className="text-lg font-medium mb-2">Failed to load document</h3>
          <p className="text-sm text-center max-w-md">{error}</p>
          <button
            onClick={loadDocumentContent}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!fileContent) {
      return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500">
          <FileText className="w-16 h-16 mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No content available</h3>
          <p className="text-sm">This document cannot be previewed</p>
        </div>
      );
    }

    const fileType = getFileType(document);

    switch (fileType) {
      case 'pdf':
        return (
          <div className="h-full">
            <iframe
              src={fileContent}
              className="w-full h-full border-none"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
              title={document.title}
            />
          </div>
        );

      case 'image':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <img
              src={fileContent}
              alt={document.title}
              className="max-w-full max-h-full object-contain"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center'
              }}
            />
          </div>
        );

      case 'text':
        return (
          <div data-lenis-prevent className="h-full overflow-auto p-6">
            <pre
              className="whitespace-pre-wrap font-mono text-sm"
              style={{ fontSize: `${zoom}%` }}
            >
              {fileContent}
            </pre>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-96 text-gray-500">
            <FileText className="w-16 h-16 mb-4 text-gray-300" />
            <h3 className="text-lg font-medium mb-2">Preview not available</h3>
            <p className="text-sm mb-4">This file type cannot be previewed in the browser</p>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download to view
            </button>
          </div>
        );
    }
  };

  const modalContent = (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[9999] p-4 sm:p-6 flex items-center justify-center"
      style={{ background: 'transparent', margin: 0, padding: 0 }}
    >
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      <div
        className={`relative flex h-5/6 w-full max-w-6xl flex-col overflow-hidden rounded-xl shadow-2xl ${isDashboardThemeEnabled ? 'border border-base-300 bg-base-100 text-base-content' : 'border border-[rgba(0,0,0,0.1)] bg-white shadow-[0_20px_60px_0_rgba(100,116,139,0.3)]'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between border-b p-4 ${isDashboardThemeEnabled ? 'border-base-300' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`rounded-lg p-2 ${isDashboardThemeEnabled ? 'bg-primary/10' : 'bg-blue-100'}`}>
              {getFileType(document) === 'pdf' && <FileText className={`h-6 w-6 ${isDashboardThemeEnabled ? 'text-primary' : 'text-blue-600'}`} />}
              {getFileType(document) === 'image' && <Image className={`h-6 w-6 ${isDashboardThemeEnabled ? 'text-success' : 'text-green-600'}`} />}
              {getFileType(document) === 'text' && <FileText className={`h-6 w-6 ${isDashboardThemeEnabled ? 'text-secondary' : 'text-purple-600'}`} />}
              {getFileType(document) === 'unknown' && <FileText className={`h-6 w-6 ${isDashboardThemeEnabled ? 'text-base-content/50' : 'text-gray-600'}`} />}
            </div>
            <div>
              <h2 className={`max-w-md truncate text-lg font-bold ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}`}>
                {document.title}
              </h2>
              <p className={`text-sm ${isDashboardThemeEnabled ? 'text-base-content/60' : 'text-gray-500'}`}>
                {getFileExtension(document.file_path || document.title).toUpperCase()} • Created by {document.created_by}
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-2">
            {(getFileType(document) === 'pdf' || getFileType(document) === 'image') && (
              <>
                <button
                  onClick={handleZoomOut}
                  className={`rounded-lg p-2 transition-colors ${isDashboardThemeEnabled ? 'hover:bg-base-200 text-base-content/70 hover:text-base-content' : 'hover:bg-gray-100'}`}
                  title="Zoom Out"
                >
                  <ZoomOut className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-base-content/70 group-hover:text-base-content' : 'text-gray-600'}`} />
                </button>
                <span className={`min-w-12 text-center text-sm ${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}`}>
                  {zoom}%
                </span>
                <button
                  onClick={handleZoomIn}
                  className={`rounded-lg p-2 transition-colors ${isDashboardThemeEnabled ? 'hover:bg-base-200 text-base-content/70 hover:text-base-content' : 'hover:bg-gray-100'}`}
                  title="Zoom In"
                >
                  <ZoomIn className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-base-content/70 group-hover:text-base-content' : 'text-gray-600'}`} />
                </button>
                <button
                  onClick={handleRotate}
                  className={`rounded-lg p-2 transition-colors ${isDashboardThemeEnabled ? 'hover:bg-base-200 text-base-content/70 hover:text-base-content' : 'hover:bg-gray-100'}`}
                  title="Rotate"
                >
                  <RotateCw className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-base-content/70 group-hover:text-base-content' : 'text-gray-600'}`} />
                </button>
                <div className={`mx-2 h-6 w-px ${isDashboardThemeEnabled ? 'bg-base-300' : 'bg-gray-300'}`}></div>
              </>
            )}

            <button
              onClick={handleDownload}
              className={`rounded-lg p-2 transition-colors ${isDashboardThemeEnabled ? 'hover:bg-base-200 text-base-content/70 hover:text-base-content' : 'hover:bg-gray-100'}`}
              title="Download"
            >
              <Download className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-base-content/70 group-hover:text-base-content' : 'text-gray-600'}`} />
            </button>

            <button
              onClick={onClose}
              className={`rounded-lg p-2 transition-colors ${isDashboardThemeEnabled ? 'hover:bg-base-200 text-base-content/70 hover:text-base-content' : 'hover:bg-gray-100'}`}
              title="Close"
            >
              <X className={`h-4 w-4 ${isDashboardThemeEnabled ? 'text-base-content/70 group-hover:text-base-content' : 'text-gray-600'}`} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {renderDocumentContent()}
        </div>

        {/* Footer */}
        <div className={`border-t p-4 ${isDashboardThemeEnabled ? 'border-base-300 bg-base-200/50' : 'border-gray-200 bg-gray-50'}`}>
          <div className={`flex items-center justify-between text-sm ${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}`}>
            <div className="flex items-center gap-4">
              <span>Status:
                <span className={`ml-2 rounded-full px-2.5 py-0.5 text-xs font-semibold ${document.status === 'active' ? isDashboardThemeEnabled ? 'bg-success/15 text-success' : 'bg-green-100 text-green-800' :
                  document.status === 'draft' ? isDashboardThemeEnabled ? 'bg-warning/15 text-warning' : 'bg-yellow-100 text-yellow-800' :
                    isDashboardThemeEnabled ? 'bg-info/15 text-info' : 'bg-blue-100 text-blue-800'
                  }`}>
                  {(document.status || 'unknown').charAt(0).toUpperCase() + (document.status || 'unknown').slice(1)}
                </span>
              </span>
              {document.remarks && (
                <span>Notes: {document.remarks}</span>
              )}
            </div>
            <div>
              Created: {new Date(document.created_at).toLocaleDateString()} • Updated: {new Date(document.updated_at).toLocaleDateString()}
            </div>
          </div>
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

export default DocumentViewer;