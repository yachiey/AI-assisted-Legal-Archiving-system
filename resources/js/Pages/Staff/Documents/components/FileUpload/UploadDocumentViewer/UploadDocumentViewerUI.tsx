import React from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, AlertCircle } from 'lucide-react';

interface UploadDocumentViewerUIProps {
  fileName: string;
  loading: boolean;
  error: string | null;
  fileContent: string | null;
  zoom: number;
  rotation: number;
  isPDF: boolean;
  isImage: boolean;
  isText: boolean;
  onClose: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onDownload: () => void;
  onRetry: () => void;
}

const UploadDocumentViewerUI: React.FC<UploadDocumentViewerUIProps> = ({
  fileName,
  loading,
  error,
  fileContent,
  zoom,
  rotation,
  isPDF,
  isImage,
  isText,
  onClose,
  onZoomIn,
  onZoomOut,
  onRotate,
  onDownload,
  onRetry
}) => {
  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl overflow-hidden" style={{
        background: 'white',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-green-500 to-green-600">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{fileName}</h2>
              <p className="text-sm text-white/80">Document Preview</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Zoom Controls */}
            {(isPDF || isImage) && (
              <>
                <button
                  onClick={onZoomOut}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <span className="text-sm text-white font-medium min-w-[60px] text-center">{zoom}%</span>
                <button
                  onClick={onZoomIn}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
              </>
            )}

            {/* Rotate */}
            {isImage && (
              <button
                onClick={onRotate}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Rotate"
              >
                <RotateCw className="w-5 h-5 text-white" />
              </button>
            )}

            {/* Download */}
            <button
              onClick={onDownload}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-white" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)] overflow-auto bg-gray-100">
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-2">Failed to Load Document</h3>
                <p className="text-gray-600">{error}</p>
                <button
                  onClick={onRetry}
                  className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {!loading && !error && fileContent && (
            <div className="flex items-center justify-center min-h-full p-8">
              {isPDF && (
                <iframe
                  src={fileContent}
                  className="w-full h-full min-h-[600px] rounded-lg shadow-lg border border-gray-300"
                  style={{
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: 'top center',
                  }}
                  title={fileName}
                />
              )}

              {isImage && (
                <img
                  src={fileContent}
                  alt={fileName}
                  className="max-w-full rounded-lg shadow-lg"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center',
                  }}
                />
              )}

              {isText && (
                <pre className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-lg border border-gray-300 text-sm font-mono overflow-auto"
                  style={{
                    fontSize: `${zoom}%`,
                  }}>
                  {fileContent}
                </pre>
              )}

              {!isPDF && !isImage && !isText && (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Preview not available for this file type</p>
                  <button
                    onClick={onDownload}
                    className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download to View
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadDocumentViewerUI;
