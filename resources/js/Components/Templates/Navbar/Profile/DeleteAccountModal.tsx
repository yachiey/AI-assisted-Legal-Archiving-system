import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";

interface DeleteAccountModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (password: string) => void;
}

const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
}) => {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!password.trim()) {
            setError("Password is required");
            return;
        }
        onConfirm(password);
    };

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-red-600 via-red-500 to-rose-600 px-8 py-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mb-4">
                            <AlertTriangle className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-2xl font-bold text-white text-center">
                            Delete Account
                        </h2>
                        <p className="text-white/80 text-center mt-2 text-sm">
                            This action cannot be undone
                        </p>
                    </div>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit} className="px-8 py-6">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
                        <p className="text-sm text-red-800 font-medium">
                            <strong>Warning:</strong> Deleting your account will permanently remove all your data, including:
                        </p>
                        <ul className="list-disc list-inside mt-2 text-sm text-red-700 space-y-1">
                            <li>Your profile information</li>
                            <li>All saved documents</li>
                            <li>Activity history</li>
                            <li>Account preferences</li>
                        </ul>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Confirm your password to continue
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError("");
                            }}
                            className={`w-full px-4 py-3 rounded-xl border-2 ${
                                error ? "border-red-500" : "border-gray-200"
                            } focus:border-red-500 focus:outline-none transition-colors`}
                            placeholder="Enter your password"
                        />
                        {error && (
                            <p className="text-red-500 text-sm mt-1">{error}</p>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300 transition-all duration-200"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold hover:from-red-700 hover:to-rose-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                        Delete Account
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteAccountModal;
