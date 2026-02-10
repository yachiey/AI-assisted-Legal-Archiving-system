import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ScanLine, Loader2, AlertCircle, WifiOff, CheckCircle2 } from 'lucide-react';
import axios from 'axios';

interface ScanDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScanDocumentModal: React.FC<ScanDocumentModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'scanning' | 'uploading' | 'complete' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleStartScanning = async () => {
    try {
      setStatus('scanning');
      setErrorMessage('');

      // Call the local scanner service
      // Uses the current hostname (host machine IP) where the scanner service is running
      const response = await axios.post(`http://${window.location.hostname}:3000/scan`, {}, {
        timeout: 120000 // 2 minute timeout for scanning
      });

      if (response.data && response.data.success) {
        setStatus('complete');

        // The service already handled the upload to the main backend
        // We just need to grab the file details from the "backendResponse" key the service returned
        const backendFile = response.data.backendResponse?.file;

        if (backendFile) {
          const fileName = backendFile.original_name || 'Scanned_Document.pdf';
          // Redirect to AI processing
          setTimeout(() => {
            window.location.href = `/ai-processing?fileName=${encodeURIComponent(fileName)}&title=${encodeURIComponent(fileName)}`;
            onClose();
          }, 1500);
        } else {
          setStatus('error');
          setErrorMessage('Scan finished, but file info was missing.');
        }

      } else {
        throw new Error(response.data.message || 'Scanning service returned failure.');
      }

    } catch (error: any) {
      console.error('Scanning error:', error);
      setStatus('error');

      let msg = '';

      if (error.code === 'ERR_NETWORK') {
        msg = 'Could not connect to Scanner Service. Please ensure "node server.js" is running on port 3000.';
      } else if (error.response?.data) {
        // Backend returned a structured error
        const data = error.response.data;
        msg = data.message || 'Scanner service returned an error.';
        if (data.details) {
          msg += ` (${data.details})`;
        }
      } else {
        msg = error.message || 'Failed to communicate with scanner.';
      }

      setErrorMessage(msg);
    }
  };

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-[2px]"
      style={{ margin: 0, padding: 0 }}
      onClick={status !== 'scanning' ? onClose : undefined}
    >
      <div
        className="bg-white w-full max-w-lg mx-4 overflow-hidden rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl shadow-md" style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
              <ScanLine className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight">Scan Document</h3>
              <p className="text-xs text-gray-500 font-medium">via Local Bridge (NAPS2)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={status === 'scanning'}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all disabled:opacity-30"
          >
            <XIcon />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {status === 'idle' && (
            <div className="text-center py-2">
              <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 relative group border border-green-100">
                <div className="absolute inset-0 bg-green-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 scale-110"></div>
                <ScanLine className="w-10 h-10 text-[#228B22] relative z-10" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Ready to Scan</h4>
              <p className="text-gray-500 mb-8 text-sm px-4 leading-relaxed">
                Connect your physical document to the scanner. <br />
                Ensure <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-gray-700 border border-gray-200">scanner_service</code> is running.
              </p>

              <button
                onClick={handleStartScanning}
                className="w-full py-4 rounded-xl text-white font-bold uppercase tracking-wider shadow-lg transform hover:-translate-y-0.5 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}
              >
                <ScanLine className="w-5 h-5" />
                Start Scanning
              </button>
            </div>
          )}

          {status === 'scanning' && (
            <div className="text-center py-8">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-[#228B22] rounded-full border-t-transparent animate-spin"></div>
                <ScanLine className="absolute inset-0 m-auto w-10 h-10 text-[#228B22] animate-pulse" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Scanning...</h4>
              <p className="text-sm text-gray-500 max-w-xs mx-auto animate-pulse">
                Acquiring image from scanner device via NAPS2...
              </p>
            </div>
          )}

          {status === 'complete' && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300 border border-green-100">
                <CheckCircle2 className="w-10 h-10 text-[#228B22]" />
              </div>
              <h4 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">Scan Successful</h4>
              <p className="text-sm text-gray-500">Redirecting to AI processing...</p>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4 animate-in fade-in duration-300">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-100">
                {errorMessage.includes('Connect') ? (
                  <WifiOff className="w-10 h-10 text-red-500" />
                ) : (
                  <AlertCircle className="w-10 h-10 text-red-500" />
                )}
              </div>
              <h4 className="text-lg font-bold text-gray-900 mb-2">Scanner Error</h4>
              <p className="text-gray-600 mb-6 text-sm px-4 bg-red-50 py-3 rounded-lg border border-red-100 mx-4">
                {errorMessage}
              </p>

              <div className="bg-gray-50 p-4 rounded-lg text-left text-xs text-gray-500 mb-6 border border-gray-200 mx-4">
                <strong className="text-gray-700 block mb-2">Troubleshooting:</strong>
                <ul className="list-disc pl-4 space-y-1">
                  <li>Verify Scanner is ON and connected via USB/LAN.</li>
                  <li>Ensure <b>NAPS2</b> is installed at default path.</li>
                  <li>Verify <code>npm run start</code> is running in <code>/scanner_service</code> on the host machine.</li>
                </ul>
              </div>

              <button
                onClick={() => setStatus('idle')}
                className="px-8 py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50 transition-all shadow-sm"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof window !== 'undefined' && window.document?.body) {
    return createPortal(modalContent, window.document.body);
  }

  return null;
};

// Start Helper Component
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
)
// End Helper Component

export default ScanDocumentModal;
