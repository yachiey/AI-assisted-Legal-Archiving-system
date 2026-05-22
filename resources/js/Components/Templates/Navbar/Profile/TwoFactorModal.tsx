import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
    X,
    ShieldCheck,
    ShieldAlert,
    Copy,
    Check,
    Smartphone,
    Mail,
} from "lucide-react";

interface TwoFactorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onResult?: (type: "success" | "error", message: string, title?: string) => void;
}

type Method = "totp" | "email";

type Step =
    | "loading"
    | "disabled"
    | "chooseMethod"
    | "setup"
    | "emailSetup"
    | "recovery"
    | "enabled"
    | "confirmDisable";

const authHeaders = (json = true): Record<string, string> => {
    const token =
        sessionStorage.getItem("auth_token") || localStorage.getItem("auth_token");
    const csrfToken = document
        .querySelector('meta[name="csrf-token"]')
        ?.getAttribute("content");

    return {
        ...(json && { "Content-Type": "application/json" }),
        Accept: "application/json",
        "X-CSRF-TOKEN": csrfToken || "",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
};

const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
    isOpen,
    onClose,
    onResult,
}) => {
    const [step, setStep] = useState<Step>("loading");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    // Setup data
    const [method, setMethod] = useState<Method>("totp");
    const [activeMethod, setActiveMethod] = useState<Method | null>(null);
    const [qrSvg, setQrSvg] = useState("");
    const [secret, setSecret] = useState("");
    const [maskedEmail, setMaskedEmail] = useState("");
    const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
    const [code, setCode] = useState("");
    const [notice, setNotice] = useState("");

    // Disable flow
    const [password, setPassword] = useState("");
    const [copied, setCopied] = useState(false);

    const resetState = () => {
        setBusy(false);
        setError("");
        setMethod("totp");
        setActiveMethod(null);
        setQrSvg("");
        setSecret("");
        setMaskedEmail("");
        setRecoveryCodes([]);
        setCode("");
        setNotice("");
        setPassword("");
        setCopied(false);
    };

    const loadStatus = async () => {
        setStep("loading");
        try {
            const res = await fetch("/profile/two-factor/status", {
                headers: authHeaders(false),
            });
            const data = await res.json();
            setActiveMethod(data.method ?? null);
            setStep(data.enabled ? "enabled" : "disabled");
        } catch {
            setError("Could not load two-factor status.");
            setStep("disabled");
        }
    };

    useEffect(() => {
        if (isOpen) {
            resetState();
            loadStatus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleStartSetup = async (chosen: Method) => {
        setBusy(true);
        setError("");
        setNotice("");
        setMethod(chosen);
        try {
            const res = await fetch("/profile/two-factor/enable", {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ method: chosen }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to start setup");

            setRecoveryCodes(data.recovery_codes || []);

            if (chosen === "email") {
                setMaskedEmail(data.email || "");
                if (data.mail_sent === false) {
                    setError("We couldn't send the email. Try resending below.");
                }
                setStep("emailSetup");
            } else {
                setQrSvg(data.qr_svg);
                setSecret(data.secret);
                setStep("setup");
            }
        } catch (e: any) {
            setError(e.message || "Failed to start setup");
        } finally {
            setBusy(false);
        }
    };

    const handleResendSetup = async () => {
        setError("");
        setNotice("");
        try {
            const res = await fetch("/profile/two-factor/resend", {
                method: "POST",
                headers: authHeaders(),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Could not resend");
            setNotice("A new code has been sent to your email.");
        } catch (e: any) {
            setError(e.message || "Could not resend the code.");
        }
    };

    const handleConfirm = async () => {
        if (!code.trim()) return;
        setBusy(true);
        setError("");
        try {
            const res = await fetch("/profile/two-factor/confirm", {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ code: code.trim() }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Invalid code");

            // Show recovery codes one last time before finishing.
            setStep("recovery");
        } catch (e: any) {
            setError(e.message || "Invalid code");
        } finally {
            setBusy(false);
        }
    };

    const handleDisable = async () => {
        if (!password.trim()) return;
        setBusy(true);
        setError("");
        try {
            const res = await fetch("/profile/two-factor", {
                method: "DELETE",
                headers: authHeaders(),
                body: JSON.stringify({ password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to disable");

            onResult?.("success", "Two-factor authentication disabled.", "2FA Disabled");
            onClose();
        } catch (e: any) {
            setError(e.message || "Failed to disable");
        } finally {
            setBusy(false);
        }
    };

    const handleFinish = () => {
        onResult?.(
            "success",
            "Two-factor authentication is now active on your account.",
            "2FA Enabled"
        );
        onClose();
    };

    const copyRecoveryCodes = () => {
        navigator.clipboard.writeText(recoveryCodes.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const isEnabled = step === "enabled";

    return createPortal(
        <div
            data-lenis-prevent
            className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:p-6"
            onClick={onClose}
        >
            <div
                className="my-auto w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div
                    className={`relative px-8 py-8 bg-gradient-to-r ${
                        isEnabled
                            ? "from-green-700 via-green-600 to-emerald-600"
                            : "from-green-800 via-green-700 to-emerald-700"
                    }`}
                >
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 rounded-full p-2 text-white/80 transition-all duration-200 hover:bg-white/20 hover:text-white"
                    >
                        <X className="h-5 w-5" />
                    </button>
                    <div className="flex flex-col items-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                            {isEnabled ? (
                                <ShieldCheck className="h-8 w-8 text-white" />
                            ) : (
                                <ShieldAlert className="h-8 w-8 text-white" />
                            )}
                        </div>
                        <h2 className="text-center text-2xl font-bold text-white">
                            Two-Factor Authentication
                        </h2>
                        <p className="mt-2 text-center text-sm text-white/80">
                            Extra security for your account
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-8 py-6">
                    {error && (
                        <div className="mb-5 rounded-xl border-2 border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}

                    {notice && (
                        <div className="mb-5 rounded-xl border-2 border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
                            {notice}
                        </div>
                    )}

                    {step === "loading" && (
                        <p className="py-8 text-center text-gray-500">Loading…</p>
                    )}

                    {step === "disabled" && (
                        <div className="space-y-5">
                            <p className="text-sm text-gray-600">
                                Add an extra layer of security to your account. You'll be
                                asked for a one-time code each time you log in.
                            </p>
                            <button
                                onClick={() => {
                                    setError("");
                                    setNotice("");
                                    setStep("chooseMethod");
                                }}
                                className="w-full rounded-xl bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-800 hover:to-emerald-700"
                            >
                                Enable Two-Factor
                            </button>
                        </div>
                    )}

                    {step === "chooseMethod" && (
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600">
                                Choose how you'd like to receive your verification codes.
                            </p>
                            <button
                                onClick={() => handleStartSetup("totp")}
                                disabled={busy}
                                className="flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4 text-left transition-colors hover:border-green-600 hover:bg-green-50 disabled:opacity-60"
                            >
                                <Smartphone className="h-6 w-6 shrink-0 text-green-700" />
                                <span>
                                    <span className="block font-semibold text-gray-800">
                                        Authenticator app
                                    </span>
                                    <span className="block text-xs text-gray-500">
                                        Use Google Authenticator or any TOTP app
                                    </span>
                                </span>
                            </button>
                            <button
                                onClick={() => handleStartSetup("email")}
                                disabled={busy}
                                className="flex w-full items-center gap-4 rounded-xl border-2 border-gray-200 p-4 text-left transition-colors hover:border-green-600 hover:bg-green-50 disabled:opacity-60"
                            >
                                <Mail className="h-6 w-6 shrink-0 text-green-700" />
                                <span>
                                    <span className="block font-semibold text-gray-800">
                                        Email code
                                    </span>
                                    <span className="block text-xs text-gray-500">
                                        Get a code sent to your email at login
                                    </span>
                                </span>
                            </button>
                            {busy && (
                                <p className="text-center text-sm text-gray-400">Preparing…</p>
                            )}
                        </div>
                    )}

                    {step === "emailSetup" && (
                        <div className="space-y-5">
                            <p className="text-sm text-gray-600">
                                We sent a 6-digit code to{" "}
                                <span className="font-semibold text-gray-800">
                                    {maskedEmail || "your email"}
                                </span>
                                . Enter it below to activate email verification.
                            </p>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    Verification code
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="123456"
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-lg tracking-widest transition-colors focus:border-green-700 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={handleConfirm}
                                disabled={busy || !code.trim()}
                                className="w-full rounded-xl bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-800 hover:to-emerald-700 disabled:opacity-60"
                            >
                                {busy ? "Verifying…" : "Confirm & Activate"}
                            </button>
                            <button
                                onClick={handleResendSetup}
                                className="w-full text-sm font-semibold text-gray-500 transition-colors hover:text-gray-700"
                            >
                                Didn't get it? Resend code
                            </button>
                        </div>
                    )}

                    {step === "setup" && (
                        <div className="space-y-5">
                            <p className="text-sm text-gray-600">
                                1. Scan this QR code with Google Authenticator (or any TOTP
                                app).
                            </p>
                            <div className="flex justify-center">
                                {qrSvg && (
                                    <img
                                        src={qrSvg}
                                        alt="2FA QR code"
                                        className="h-48 w-48 rounded-xl border-2 border-gray-100"
                                    />
                                )}
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Or enter this key manually
                                </p>
                                <p className="mt-1 break-all font-mono text-sm text-gray-700">
                                    {secret}
                                </p>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-semibold text-gray-700">
                                    2. Enter the 6-digit code to confirm
                                </label>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value)}
                                    placeholder="123456"
                                    className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-center text-lg tracking-widest transition-colors focus:border-green-700 focus:outline-none"
                                />
                            </div>
                            <button
                                onClick={handleConfirm}
                                disabled={busy || !code.trim()}
                                className="w-full rounded-xl bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-800 hover:to-emerald-700 disabled:opacity-60"
                            >
                                {busy ? "Verifying…" : "Confirm & Activate"}
                            </button>
                        </div>
                    )}

                    {step === "recovery" && (
                        <div className="space-y-5">
                            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                <strong>Save these recovery codes.</strong> Each can be used
                                once if you lose access to your authenticator app or email.
                                They won't be shown again.
                            </div>
                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-4">
                                {recoveryCodes.map((c) => (
                                    <span
                                        key={c}
                                        className="text-center font-mono text-sm text-gray-700"
                                    >
                                        {c}
                                    </span>
                                ))}
                            </div>
                            <button
                                onClick={copyRecoveryCodes}
                                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-200 px-6 py-2.5 font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                            >
                                {copied ? (
                                    <>
                                        <Check className="h-4 w-4" /> Copied
                                    </>
                                ) : (
                                    <>
                                        <Copy className="h-4 w-4" /> Copy codes
                                    </>
                                )}
                            </button>
                            <button
                                onClick={handleFinish}
                                className="w-full rounded-xl bg-gradient-to-r from-green-700 to-emerald-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-green-800 hover:to-emerald-700"
                            >
                                Done
                            </button>
                        </div>
                    )}

                    {step === "enabled" && (
                        <div className="space-y-5">
                            <div className="flex items-center gap-3 rounded-xl border-2 border-green-200 bg-green-50 p-4">
                                <ShieldCheck className="h-6 w-6 shrink-0 text-green-600" />
                                <p className="text-sm font-medium text-green-800">
                                    Two-factor authentication is active via{" "}
                                    {activeMethod === "email"
                                        ? "email codes"
                                        : "your authenticator app"}
                                    .
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setError("");
                                    setStep("confirmDisable");
                                }}
                                className="w-full rounded-xl border-2 border-red-200 px-6 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50"
                            >
                                Disable Two-Factor
                            </button>
                        </div>
                    )}

                    {step === "confirmDisable" && (
                        <div className="space-y-5">
                            <p className="text-sm text-gray-600">
                                Enter your password to turn off two-factor authentication.
                            </p>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                className="w-full rounded-xl border-2 border-gray-200 px-4 py-3 transition-colors focus:border-red-500 focus:outline-none"
                            />
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setStep("enabled")}
                                    className="flex-1 rounded-xl bg-gray-200 px-6 py-3 font-semibold text-gray-700 transition-all hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDisable}
                                    disabled={busy || !password.trim()}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-red-700 hover:to-rose-700 disabled:opacity-60"
                                >
                                    {busy ? "Disabling…" : "Disable"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default TwoFactorModal;
