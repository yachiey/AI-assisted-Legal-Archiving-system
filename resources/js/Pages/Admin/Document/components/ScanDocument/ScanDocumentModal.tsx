import React, { useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  CheckCircle2,
  ScanLine,
  WifiOff,
} from "lucide-react";
import axios from "axios";
import {
  DEFAULT_DASHBOARD_THEME,
  useDashboardTheme,
} from "../../../../../hooks/useDashboardTheme";

interface ScanDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ScanDocumentModal: React.FC<ScanDocumentModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [status, setStatus] = useState<
    "idle" | "scanning" | "uploading" | "complete" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const { theme } = useDashboardTheme();
  const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

  if (!isOpen) return null;

  const handleStartScanning = async () => {
    try {
      setStatus("scanning");
      setErrorMessage("");

      const response = await axios.post(
        `http://localhost:3000/scan`,
        {},
        {
          timeout: 120000,
        }
      );

      if (response.data && response.data.success) {
        setStatus("complete");

        const backendFile = response.data.backendResponse?.file;

        if (backendFile) {
          const fileName = backendFile.original_name || "Scanned_Document.pdf";

          setTimeout(() => {
            window.location.href = `/ai-processing?fileName=${encodeURIComponent(
              fileName
            )}&title=${encodeURIComponent(fileName)}`;
            onClose();
          }, 1500);
        } else {
          setStatus("error");
          setErrorMessage("Scan finished, but file info was missing.");
        }
      } else {
        throw new Error(
          response.data.message || "Scanning service returned failure."
        );
      }
    } catch (error: any) {
      console.error("Scanning error:", error);
      setStatus("error");

      let msg = "";

      if (error.code === "ERR_NETWORK") {
        msg =
          'Could not connect to Scanner Service. Please ensure "node server.js" is running on port 3000.';
      } else if (error.response?.data) {
        const data = error.response.data;
        msg = data.message || "Scanner service returned an error.";
        if (data.details) {
          msg += ` (${data.details})`;
        }
      } else {
        msg = error.message || "Failed to communicate with scanner.";
      }

      setErrorMessage(msg);
    }
  };

  const titleClass = isDashboardThemeEnabled
    ? "text-base-content"
    : "text-gray-900";
  const bodyClass = isDashboardThemeEnabled
    ? "text-base-content/70"
    : "text-gray-500";
  const primaryTileClass = isDashboardThemeEnabled
    ? "bg-primary/12 text-primary"
    : "text-white";
  const primaryTileStyle = isDashboardThemeEnabled
    ? undefined
    : { background: "linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)" };

  const modalContent = (
    <div
      data-theme={isDashboardThemeEnabled ? theme : undefined}
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 backdrop-blur-[2px]"
      style={{ margin: 0, padding: 0 }}
      onClick={status !== "scanning" ? onClose : undefined}
    >
      <div
        className={`mx-4 w-full max-w-lg overflow-hidden rounded-2xl shadow-2xl ${
          isDashboardThemeEnabled
            ? "border border-base-300 bg-base-100 text-base-content"
            : "bg-white"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`flex items-center justify-between border-b p-6 ${
            isDashboardThemeEnabled
              ? "border-base-300 bg-base-200/55"
              : "border-gray-100 bg-gray-50/50"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-2.5 shadow-md ${primaryTileClass}`}
              style={primaryTileStyle}
            >
              <ScanLine className="h-6 w-6" />
            </div>
            <div>
              <h3 className={`text-lg font-bold tracking-tight ${titleClass}`}>
                Scan Document
              </h3>
              <p
                className={`text-xs font-medium ${
                  isDashboardThemeEnabled
                    ? "text-base-content/55"
                    : "text-gray-500"
                }`}
              >
                via Local Bridge (NAPS2)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={status === "scanning"}
            className={`rounded-full p-2 transition-all disabled:opacity-30 ${
              isDashboardThemeEnabled
                ? "text-base-content/55 hover:bg-base-300 hover:text-base-content"
                : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            }`}
          >
            <XIcon />
          </button>
        </div>

        <div className="p-8">
          {status === "idle" && (
            <div className="py-2 text-center">
              <div
                className={`relative mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border group ${
                  isDashboardThemeEnabled
                    ? "border-primary/20 bg-primary/10"
                    : "border-green-100 bg-green-50"
                }`}
              >
                <div
                  className={`absolute inset-0 scale-110 rounded-full opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                    isDashboardThemeEnabled ? "bg-primary/10" : "bg-green-100"
                  }`}
                ></div>
                <ScanLine
                  className={`relative z-10 h-10 w-10 ${
                    isDashboardThemeEnabled ? "text-primary" : "text-[#228B22]"
                  }`}
                />
              </div>
              <h4 className={`mb-2 text-xl font-bold tracking-tight ${titleClass}`}>
                Ready to Scan
              </h4>
              <p className={`mb-8 px-4 text-sm leading-relaxed ${bodyClass}`}>
                Connect your physical document to the scanner. <br />
                Ensure{" "}
                <code
                  className={`rounded border px-1.5 py-0.5 text-xs font-mono ${
                    isDashboardThemeEnabled
                      ? "border-base-300 bg-base-200 text-base-content"
                      : "border-gray-200 bg-gray-100 text-gray-700"
                  }`}
                >
                  scanner_service
                </code>{" "}
                is running.
              </p>

              <button
                onClick={handleStartScanning}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-4 font-bold uppercase tracking-wider text-white shadow-lg transition-all hover:-translate-y-0.5 active:scale-[0.98] ${
                  isDashboardThemeEnabled ? "bg-primary hover:bg-primary/90" : ""
                }`}
                style={
                  isDashboardThemeEnabled
                    ? undefined
                    : {
                        background:
                          "linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)",
                      }
                }
              >
                <ScanLine className="h-5 w-5" />
                Start Scanning
              </button>
            </div>
          )}

          {status === "scanning" && (
            <div className="py-8 text-center">
              <div className="relative mx-auto mb-6 h-24 w-24">
                <div
                  className={`absolute inset-0 rounded-full border-4 ${
                    isDashboardThemeEnabled
                      ? "border-base-300"
                      : "border-gray-100"
                  }`}
                ></div>
                <div
                  className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin ${
                    isDashboardThemeEnabled
                      ? "border-primary"
                      : "border-[#228B22]"
                  }`}
                ></div>
                <ScanLine
                  className={`absolute inset-0 m-auto h-10 w-10 animate-pulse ${
                    isDashboardThemeEnabled ? "text-primary" : "text-[#228B22]"
                  }`}
                />
              </div>
              <h4 className={`mb-2 text-xl font-bold tracking-tight ${titleClass}`}>
                Scanning...
              </h4>
              <p className={`mx-auto max-w-xs animate-pulse text-sm ${bodyClass}`}>
                Acquiring image from scanner device via NAPS2...
              </p>
            </div>
          )}

          {status === "complete" && (
            <div className="py-8 text-center">
              <div
                className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border animate-in zoom-in duration-300 ${
                  isDashboardThemeEnabled
                    ? "border-success/20 bg-success/10"
                    : "border-green-100 bg-green-50"
                }`}
              >
                <CheckCircle2
                  className={`h-10 w-10 ${
                    isDashboardThemeEnabled ? "text-success" : "text-[#228B22]"
                  }`}
                />
              </div>
              <h4 className={`mb-2 text-xl font-bold tracking-tight ${titleClass}`}>
                Scan Successful
              </h4>
              <p className={`text-sm ${bodyClass}`}>
                Redirecting to AI processing...
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="animate-in fade-in py-4 text-center duration-300">
              <div
                className={`mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border ${
                  isDashboardThemeEnabled
                    ? "border-error/20 bg-error/10"
                    : "border-red-100 bg-red-50"
                }`}
              >
                {errorMessage.includes("Connect") ? (
                  <WifiOff
                    className={`h-10 w-10 ${
                      isDashboardThemeEnabled ? "text-error" : "text-red-500"
                    }`}
                  />
                ) : (
                  <AlertCircle
                    className={`h-10 w-10 ${
                      isDashboardThemeEnabled ? "text-error" : "text-red-500"
                    }`}
                  />
                )}
              </div>
              <h4 className={`mb-2 text-lg font-bold ${titleClass}`}>
                Scanner Error
              </h4>
              <p
                className={`mx-4 mb-6 rounded-lg border px-4 py-3 text-sm ${
                  isDashboardThemeEnabled
                    ? "border-error/25 bg-error/10 text-error"
                    : "border-red-100 bg-red-50 text-gray-600"
                }`}
              >
                {errorMessage}
              </p>

              <div
                className={`mx-4 mb-6 rounded-lg border p-4 text-left text-xs ${
                  isDashboardThemeEnabled
                    ? "border-base-300 bg-base-200/70 text-base-content/70"
                    : "border-gray-200 bg-gray-50 text-gray-500"
                }`}
              >
                <strong
                  className={`mb-2 block ${
                    isDashboardThemeEnabled
                      ? "text-base-content"
                      : "text-gray-700"
                  }`}
                >
                  Troubleshooting:
                </strong>
                <ul className="list-disc space-y-1 pl-4">
                  <li>Verify Scanner is ON and connected via USB/LAN.</li>
                  <li>
                    Ensure <b>NAPS2</b> is installed at default path.
                  </li>
                  <li>
                    Verify <code>npm run start</code> is running in{" "}
                    <code>/scanner_service</code> on the host machine.
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setStatus("idle")}
                className={`rounded-xl border px-8 py-3 font-semibold shadow-sm transition-all ${
                  isDashboardThemeEnabled
                    ? "border-base-300 bg-base-100 text-base-content hover:bg-base-200"
                    : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                }`}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (typeof window !== "undefined" && window.document?.body) {
    return createPortal(modalContent, window.document.body);
  }

  return null;
};

const XIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export default ScanDocumentModal;
