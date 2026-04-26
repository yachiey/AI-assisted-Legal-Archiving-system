import React from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, AlertCircle } from 'lucide-react';

interface UploadDocumentViewerUIProps {
  fileName: string;
  theme?: string;
  isDashboardThemeEnabled?: boolean;
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
  theme,
  isDashboardThemeEnabled = false,
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
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
    >
      <div
        className={`relative h-[90vh] w-full max-w-6xl overflow-hidden rounded-2xl shadow-2xl ${
          isDashboardThemeEnabled
            ? 'border border-base-300 bg-base-100 text-base-content'
            : ''
        }`}
        style={
          isDashboardThemeEnabled
            ? undefined
            : {
                background: 'white',
                border: '1px solid rgba(0, 0, 0, 0.1)',
              }
        }
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b px-6 py-4 ${
            isDashboardThemeEnabled
              ? 'border-base-300 bg-primary text-primary-content'
              : 'border-gray-200 bg-gradient-to-r from-green-500 to-green-600'
          }`}
        >
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
        <div data-lenis-prevent
          className={`h-[calc(100%-80px)] overflow-auto ${
            isDashboardThemeEnabled ? 'bg-base-200' : 'bg-gray-100'
          }`}
        >
          {loading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div
                  className={`inline-block h-12 w-12 animate-spin rounded-full border-4 border-t-transparent ${
                    isDashboardThemeEnabled ? 'border-primary' : 'border-green-500'
                  }`}
                ></div>
                <p className={`mt-4 font-medium ${isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-600'}`}>Loading document...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-md p-6">
                <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h3 className={`mb-2 text-lg font-bold ${isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'}`}>Failed to Load Document</h3>
                <p className={isDashboardThemeEnabled ? 'text-base-content/65' : 'text-gray-600'}>{error}</p>
                <button
                  onClick={onRetry}
                  className={`mt-4 rounded-lg px-6 py-2 font-medium text-white transition-colors ${
                    isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : 'bg-green-500 hover:bg-green-600'
                  }`}
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
                  className={`h-full min-h-[600px] w-full rounded-lg shadow-lg ${
                    isDashboardThemeEnabled ? 'border border-base-300' : 'border border-gray-300'
                  }`}
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
                <pre data-lenis-prevent className={`w-full max-w-4xl overflow-auto rounded-lg p-6 text-sm font-mono shadow-lg ${
                  isDashboardThemeEnabled
                    ? 'border border-base-300 bg-base-100 text-base-content'
                    : 'border border-gray-300 bg-white'
                }`}
                  style={{
                    fontSize: `${zoom}%`,
                  }}>
                  {fileContent}
                </pre>
              )}

              {!isPDF && !isImage && !isText && (
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className={isDashboardThemeEnabled ? 'text-base-content/65' : 'text-gray-600'}>Preview not available for this file type</p>
                  <button
                    onClick={onDownload}
                    className={`mt-4 inline-flex items-center gap-2 rounded-lg px-6 py-2 font-medium text-white transition-colors ${
                      isDashboardThemeEnabled ? 'bg-primary hover:bg-primary/90' : 'bg-green-500 hover:bg-green-600'
                    }`}
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
