import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import UploadDocumentViewerUI from './UploadDocumentViewerUI';

interface UploadDocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  docId: number | null;
  fileName: string;
  theme?: string;
  isDashboardThemeEnabled?: boolean;
}

const UploadDocumentViewer: React.FC<UploadDocumentViewerProps> = ({
  isOpen,
  onClose,
  docId,
  fileName,
  theme,
  isDashboardThemeEnabled = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('');

  useEffect(() => {
    if (isOpen && docId) {
      loadDocumentContent();
    }
    return () => {
      setFileContent(null);
      setError(null);
      setZoom(100);
      setRotation(0);
    };
  }, [isOpen, docId]);

  const loadDocumentContent = async () => {
    if (!docId) {
      setError('Document ID not found');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/files/stream/${docId}`, {
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

      setMimeType(data.mime_type || '');

      if (data.type === 'text') {
        setFileContent(data.content);
      } else if (data.type === 'binary' && data.encoding === 'base64') {
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
    } catch (err: any) {
      console.error('Error loading document:', err);
      setError(err.message || 'Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!docId) return;

    // Use already loaded blob URL if available (best for binary files like PDF)
    if (fileContent && (mimeType === 'application/pdf' || mimeType?.startsWith('image/'))) {
      const link = document.createElement('a');
      link.href = fileContent;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Fallback for text files or if content not yet loaded
      const link = document.createElement('a');
      link.href = `/api/documents/${docId}/download`;
      link.download = fileName;
      link.click();
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 10, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 10, 50));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  if (!isOpen) return null;

  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType?.startsWith('image/');
  const isText = mimeType?.startsWith('text/');

  return createPortal(
    <UploadDocumentViewerUI
      fileName={fileName}
      theme={theme}
      isDashboardThemeEnabled={isDashboardThemeEnabled}
      loading={loading}
      error={error}
      fileContent={fileContent}
      zoom={zoom}
      rotation={rotation}
      isPDF={isPDF}
      isImage={isImage}
      isText={isText}
      onClose={onClose}
      onZoomIn={handleZoomIn}
      onZoomOut={handleZoomOut}
      onRotate={handleRotate}
      onDownload={handleDownload}
      onRetry={loadDocumentContent}
    />,
    document.body
  );
};

export default UploadDocumentViewer;
