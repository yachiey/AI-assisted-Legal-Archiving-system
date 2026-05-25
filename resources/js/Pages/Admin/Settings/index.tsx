import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "../../../../Layouts/AdminLayout";
import { usePage, useForm } from "@inertiajs/react";
import axios from "axios";
import { Eye, EyeOff, KeyRound, ScanText, Bot, CheckCircle2, AlertCircle, Info, Settings as SettingsIcon, Printer, RefreshCw, WifiOff } from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

interface KeyInfo {
    configured: boolean;
    preview: string | null;
}

interface SettingsProps {
    groqApiKey?: KeyInfo;
    groqOcrApiKey?: KeyInfo;
    flash?: {
        success?: string | null;
        error?: string | null;
    };
    [key: string]: any;
}

const Settings = () => {
    const { props } = usePage<SettingsProps>();
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

    const groqApiKey = props.groqApiKey ?? { configured: false, preview: null };
    const groqOcrApiKey = props.groqOcrApiKey ?? { configured: false, preview: null };

    const [showApiKey, setShowApiKey] = useState(false);
    const [showOcrKey, setShowOcrKey] = useState(false);
    const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

    const { data, setData, post, processing, errors, reset } = useForm({
        groq_api_key: "",
        groq_ocr_api_key: "",
    });

    // Scanner state (talks directly to the local scanner_service bridge on port 3000)
    const SCANNER_BRIDGE_URL = "http://localhost:3000";
    const [scannerDevices, setScannerDevices] = useState<string[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<string>("");
    const [currentDevice, setCurrentDevice] = useState<string>("");
    const [scannerLoading, setScannerLoading] = useState(false);
    const [scannerSaving, setScannerSaving] = useState(false);
    const [scannerError, setScannerError] = useState<string | null>(null);
    const [scannerReachable, setScannerReachable] = useState<boolean>(true);

    const loadScannerConfig = useCallback(async () => {
        try {
            const { data } = await axios.get(`${SCANNER_BRIDGE_URL}/config`, { timeout: 4000 });
            const device = data?.config?.device ?? "";
            setCurrentDevice(device);
            setSelectedDevice((prev) => prev || device);
            setScannerReachable(true);
        } catch (err: any) {
            setScannerReachable(false);
        }
    }, []);

    const detectDevices = useCallback(async () => {
        setScannerLoading(true);
        setScannerError(null);
        try {
            const { data } = await axios.get(`${SCANNER_BRIDGE_URL}/devices`, { timeout: 30000 });
            if (data?.success) {
                const devices: string[] = Array.isArray(data.devices) ? data.devices : [];
                setScannerDevices(devices);
                setScannerReachable(true);
                const current = data?.current?.device ?? currentDevice;
                if (current) {
                    setCurrentDevice(current);
                    if (!selectedDevice) setSelectedDevice(current);
                }
                if (devices.length === 0) {
                    setScannerError("No scanners detected. Plug in / power on a scanner and try again.");
                }
            } else {
                setScannerError(data?.message || "Failed to enumerate scanners.");
            }
        } catch (err: any) {
            if (err.code === "ERR_NETWORK") {
                setScannerReachable(false);
                setScannerError("Scanner Service is not running on port 3000.");
            } else {
                setScannerError(err.response?.data?.message || err.message || "Failed to enumerate scanners.");
            }
        } finally {
            setScannerLoading(false);
        }
    }, [currentDevice, selectedDevice]);

    const saveScannerDevice = useCallback(async () => {
        if (!selectedDevice.trim()) {
            showToast("Pick a scanner before saving.", "error");
            return;
        }
        setScannerSaving(true);
        try {
            const { data } = await axios.post(
                `${SCANNER_BRIDGE_URL}/config`,
                { device: selectedDevice.trim() },
                { timeout: 4000 }
            );
            if (data?.success) {
                setCurrentDevice(data.config.device);
                showToast(`Scanner saved: ${data.config.device}`, "success");
            } else {
                showToast(data?.message || "Failed to save scanner.", "error");
            }
        } catch (err: any) {
            if (err.code === "ERR_NETWORK") {
                showToast("Scanner Service is not running on port 3000.", "error");
            } else {
                showToast(err.response?.data?.message || err.message || "Failed to save scanner.", "error");
            }
        } finally {
            setScannerSaving(false);
        }
    }, [selectedDevice]);

    // On mount: load current scanner config (auto-show what's being used).
    useEffect(() => {
        loadScannerConfig();
    }, [loadScannerConfig]);

    // Surface server-side flash messages as a toast.
    useEffect(() => {
        const flash = props.flash;
        if (flash?.success) {
            showToast(flash.success, "success");
        } else if (flash?.error) {
            showToast(flash.error, "error");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.flash]);

    const showToast = (message: string, type: "success" | "error" = "success") => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.groq_api_key.trim() && !data.groq_ocr_api_key.trim()) {
            showToast("Enter at least one API key to save.", "error");
            return;
        }
        post("/admin/settings/groq", {
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    };

    const StatusBadge = ({ configured }: { configured: boolean }) => (
        <span className={`badge gap-1 ${configured ? "badge-success" : "badge-warning"} badge-outline`}>
            {configured ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {configured ? "Configured" : "Not configured"}
        </span>
    );

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="-m-6 min-h-[calc(100%+3rem)] bg-base-200 p-6 pb-12"
        >
            {/* Toast */}
            {toast && (
                <div className="toast toast-top toast-end z-[99999]">
                    <div className={`alert ${toast.type === "success" ? "alert-success" : "alert-error"} shadow-lg`}>
                        {toast.type === "success" ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span>{toast.message}</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <div
                className={`mb-8 rounded-2xl border p-6 shadow-lg ${
                    isDashboardThemeEnabled
                        ? "border-primary/20 bg-gradient-to-br from-primary via-primary to-secondary text-primary-content"
                        : "border-green-700/20"
                }`}
                style={
                    isDashboardThemeEnabled
                        ? undefined
                        : { background: "linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)" }
                }
            >
                <h1
                    className={`mb-2 flex items-center gap-3 text-4xl font-black tracking-tight md:text-5xl ${
                        isDashboardThemeEnabled ? "text-primary-content" : "text-white"
                    }`}
                >
                    <SettingsIcon className={`h-8 w-8 ${isDashboardThemeEnabled ? "text-accent" : "text-yellow-400"}`} />
                    SETTINGS
                </h1>
                <div
                    className="mb-3 h-1 w-48 rounded-full"
                    style={{
                        background: isDashboardThemeEnabled
                            ? "linear-gradient(90deg, oklch(var(--a)), transparent)"
                            : "linear-gradient(90deg, #facc15, transparent)",
                    }}
                />
                <p
                    className={`text-lg font-medium tracking-wide ${
                        isDashboardThemeEnabled ? "text-primary-content/85" : "text-green-50"
                    }`}
                >
                    Manage the Groq API keys used by the AI features
                </p>
            </div>

            <form onSubmit={handleSubmit} className="w-full">
                <div className="card w-full bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body gap-0">
                        {/* Card header */}
                        <div className="flex items-center gap-3 pb-2">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                                <KeyRound size={20} />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-base-content">Groq API Keys</h2>
                                <p className="text-xs text-base-content/60">
                                    Used by the AI features. Leave a field blank to keep its current key.
                                </p>
                            </div>
                        </div>

                        <div className="divider my-2" />

                        {/* Keys grid */}
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {/* Chatbot + Auto-fill key */}
                            <div className="form-control rounded-xl border border-base-300 bg-base-200/40 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <Bot size={16} className="text-base-content/70" />
                                        <span className="font-medium text-base-content">Chatbot &amp; Document Auto-fill</span>
                                    </div>
                                    <StatusBadge configured={groqApiKey.configured} />
                                </div>
                                <div className="join w-full">
                                    <input
                                        type={showApiKey ? "text" : "password"}
                                        value={data.groq_api_key}
                                        onChange={(e) => setData("groq_api_key", e.target.value)}
                                        placeholder={groqApiKey.preview ?? "gsk_..."}
                                        autoComplete="off"
                                        className={`input input-bordered join-item w-full bg-base-100 ${errors.groq_api_key ? "input-error" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowApiKey((v) => !v)}
                                        className="btn btn-ghost join-item border border-base-300 bg-base-100"
                                        aria-label={showApiKey ? "Hide key" : "Show key"}
                                    >
                                        {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className={`mt-2 text-xs ${errors.groq_api_key ? "text-error" : "text-base-content/60"}`}>
                                    {errors.groq_api_key ??
                                        "Powers the AI Assistant chat and document title/description/remarks generation."}
                                </p>
                            </div>

                            {/* OCR key */}
                            <div className="form-control rounded-xl border border-base-300 bg-base-200/40 p-4">
                                <div className="mb-3 flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2">
                                        <ScanText size={16} className="text-base-content/70" />
                                        <span className="font-medium text-base-content">OCR / Text Extraction</span>
                                    </div>
                                    <StatusBadge configured={groqOcrApiKey.configured} />
                                </div>
                                <div className="join w-full">
                                    <input
                                        type={showOcrKey ? "text" : "password"}
                                        value={data.groq_ocr_api_key}
                                        onChange={(e) => setData("groq_ocr_api_key", e.target.value)}
                                        placeholder={groqOcrApiKey.preview ?? "gsk_..."}
                                        autoComplete="off"
                                        className={`input input-bordered join-item w-full bg-base-100 ${errors.groq_ocr_api_key ? "input-error" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowOcrKey((v) => !v)}
                                        className="btn btn-ghost join-item border border-base-300 bg-base-100"
                                        aria-label={showOcrKey ? "Hide key" : "Show key"}
                                    >
                                        {showOcrKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                                <p className={`mt-2 text-xs ${errors.groq_ocr_api_key ? "text-error" : "text-base-content/60"}`}>
                                    {errors.groq_ocr_api_key ??
                                        "Used for image / scanned-document text extraction. If left blank, OCR falls back to the chatbot key."}
                                </p>
                            </div>
                        </div>

                        {/* Footer: note + action */}
                        <div className="mt-6 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-2 rounded-lg bg-base-200 px-3 py-2.5 text-xs text-base-content/70">
                                <Info size={15} className="mt-0.5 shrink-0 text-info" />
                                <span>
                                    The chatbot uses a new key on the next action. The AI service must be restarted for
                                    document auto-fill and OCR to use a newly saved key.
                                </span>
                            </div>
                            <button type="submit" className="btn btn-primary shrink-0 lg:px-8" disabled={processing}>
                                {processing && <span className="loading loading-spinner loading-sm" />}
                                {processing ? "Saving..." : "Save Keys"}
                            </button>
                        </div>
                    </div>
                </div>
            </form>

            {/* Scanner card */}
            <div className="mt-6 w-full">
                <div className="card w-full bg-base-100 shadow-xl border border-base-300">
                    <div className="card-body gap-0">
                        {/* Card header */}
                        <div className="flex items-center gap-3 pb-2">
                            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                                <Printer size={20} />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-lg font-semibold text-base-content">Scanner</h2>
                                <p className="text-xs text-base-content/60">
                                    The scanner used by the local NAPS2 bridge when "Scan Document" is triggered.
                                </p>
                            </div>
                            {scannerReachable ? (
                                <span className="badge badge-success badge-outline gap-1">
                                    <CheckCircle2 size={14} /> Bridge online
                                </span>
                            ) : (
                                <span className="badge badge-error badge-outline gap-1">
                                    <WifiOff size={14} /> Bridge offline
                                </span>
                            )}
                        </div>

                        <div className="divider my-2" />

                        {/* Current device + actions */}
                        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                            {/* Currently used (auto-detected) */}
                            <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
                                <div className="mb-3 flex items-center gap-2">
                                    <ScanText size={16} className="text-base-content/70" />
                                    <span className="font-medium text-base-content">Currently used</span>
                                </div>
                                <div className="rounded-lg bg-base-100 border border-base-300 px-3 py-2.5 text-sm">
                                    {currentDevice ? (
                                        <span className="font-mono text-base-content">{currentDevice}</span>
                                    ) : (
                                        <span className="text-base-content/50 italic">
                                            {scannerReachable ? "No scanner configured yet." : "Scanner bridge not reachable."}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2 text-xs text-base-content/60">
                                    This is what the bridge sends to NAPS2 with <code className="font-mono">--device</code>.
                                </p>
                            </div>

                            {/* Pick a scanner */}
                            <div className="rounded-xl border border-base-300 bg-base-200/40 p-4">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <Printer size={16} className="text-base-content/70" />
                                        <span className="font-medium text-base-content">Select a scanner</span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={detectDevices}
                                        disabled={scannerLoading}
                                        className="btn btn-sm btn-ghost gap-1"
                                    >
                                        <RefreshCw size={14} className={scannerLoading ? "animate-spin" : ""} />
                                        {scannerLoading ? "Detecting..." : "Detect"}
                                    </button>
                                </div>
                                <select
                                    className="select select-bordered w-full bg-base-100"
                                    value={selectedDevice}
                                    onChange={(e) => setSelectedDevice(e.target.value)}
                                    disabled={scannerLoading}
                                >
                                    {selectedDevice === "" && (
                                        <option value="" disabled>
                                            {scannerDevices.length === 0
                                                ? "Click 'Detect' to find connected scanners"
                                                : "Choose a scanner..."}
                                        </option>
                                    )}
                                    {/* If currentDevice isn't in the detected list, still show it as an option */}
                                    {currentDevice && !scannerDevices.includes(currentDevice) && (
                                        <option value={currentDevice}>{currentDevice} (current)</option>
                                    )}
                                    {scannerDevices.map((d) => (
                                        <option key={d} value={d}>
                                            {d}
                                            {d === currentDevice ? " (current)" : ""}
                                        </option>
                                    ))}
                                </select>
                                {scannerError && (
                                    <p className="mt-2 flex items-start gap-1 text-xs text-error">
                                        <AlertCircle size={14} className="mt-0.5 shrink-0" />
                                        <span>{scannerError}</span>
                                    </p>
                                )}
                                {!scannerError && (
                                    <p className="mt-2 text-xs text-base-content/60">
                                        Click <strong>Detect</strong> to list scanners connected to this PC via WIA.
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer: note + action */}
                        <div className="mt-6 flex flex-col items-stretch gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div className="flex items-start gap-2 rounded-lg bg-base-200 px-3 py-2.5 text-xs text-base-content/70">
                                <Info size={15} className="mt-0.5 shrink-0 text-info" />
                                <span>
                                    The Scanner Service (<code className="font-mono">scanner_service</code> on port 3000)
                                    must be running on this PC for detection and saving to work.
                                </span>
                            </div>
                            <button
                                type="button"
                                onClick={saveScannerDevice}
                                disabled={scannerSaving || !selectedDevice || selectedDevice === currentDevice}
                                className="btn btn-primary shrink-0 lg:px-8"
                            >
                                {scannerSaving && <span className="loading loading-spinner loading-sm" />}
                                {scannerSaving ? "Saving..." : "Save Scanner"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

Settings.layout = (page: React.ReactNode) => <AdminLayout>{page}</AdminLayout>;

export default Settings;
