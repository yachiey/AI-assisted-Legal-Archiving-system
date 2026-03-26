import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface User {
    user_id: number;
    firstname: string;
    lastname: string;
    email: string;
}

interface DeleteConfirmModalProps {
    isOpen: boolean;
    user: User;
    onClose: () => void;
    onConfirm: () => void;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
    isOpen,
    user,
    onClose,
    onConfirm,
}) => {
    const [loading, setLoading] = useState(false);
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm();
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        >
            <div
                className={`w-full max-w-sm rounded-2xl shadow-2xl ${
                    isDashboardThemeEnabled
                        ? "border border-base-300 bg-base-100 text-base-content"
                        : "bg-white"
                }`}
            >
                <div
                    className={`flex items-center justify-between border-b p-6 ${
                        isDashboardThemeEnabled
                            ? "border-base-300 bg-base-200/70"
                            : "border-gray-200"
                    }`}
                >
                    <h2
                        className={`text-2xl font-bold ${
                            isDashboardThemeEnabled
                                ? "text-base-content"
                                : "text-gray-900"
                        }`}
                    >
                        Delete User
                    </h2>
                    <button
                        onClick={onClose}
                        className={`transition-colors ${
                            isDashboardThemeEnabled
                                ? "text-base-content/50 hover:text-base-content"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="space-y-4 p-6">
                    <div className="flex justify-center">
                        <div
                            className={`flex h-16 w-16 items-center justify-center rounded-full ${
                                isDashboardThemeEnabled
                                    ? "bg-error/10"
                                    : "bg-red-100"
                            }`}
                        >
                            <AlertTriangle
                                className={`h-8 w-8 ${
                                    isDashboardThemeEnabled
                                        ? "text-error"
                                        : "text-red-600"
                                }`}
                            />
                        </div>
                    </div>

                    <div className="space-y-2 text-center">
                        <h3
                            className={`text-lg font-semibold ${
                                isDashboardThemeEnabled
                                    ? "text-base-content"
                                    : "text-gray-900"
                            }`}
                        >
                            Are you sure?
                        </h3>
                        <p
                            className={`text-sm ${
                                isDashboardThemeEnabled
                                    ? "text-base-content/65"
                                    : "text-gray-600"
                            }`}
                        >
                            You are about to delete the user account:
                        </p>
                        <div
                            className={`rounded-lg border p-4 ${
                                isDashboardThemeEnabled
                                    ? "border-base-300 bg-base-200/60"
                                    : "border-gray-200 bg-gray-50"
                            }`}
                        >
                            <p
                                className={`font-semibold ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content"
                                        : "text-gray-900"
                                }`}
                            >
                                {user.firstname} {user.lastname}
                            </p>
                            <p
                                className={`text-sm ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content/65"
                                        : "text-gray-600"
                                }`}
                            >
                                {user.email}
                            </p>
                        </div>
                    </div>

                    <div
                        className={`rounded-lg border p-4 ${
                            isDashboardThemeEnabled
                                ? "border-error/20 bg-error/10"
                                : "border-red-200 bg-red-50"
                        }`}
                    >
                        <p
                            className={`text-sm ${
                                isDashboardThemeEnabled
                                    ? "text-error"
                                    : "text-red-800"
                            }`}
                        >
                            <strong>Warning:</strong> This action cannot be
                            undone. All user data and activity logs will be
                            permanently deleted.
                        </p>
                    </div>

                    <div
                        className={`flex gap-3 border-t pt-4 ${
                            isDashboardThemeEnabled
                                ? "border-base-300"
                                : "border-gray-200"
                        }`}
                    >
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className={`flex-1 rounded-lg px-4 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                isDashboardThemeEnabled
                                    ? "border border-base-300 text-base-content/70 hover:bg-base-200"
                                    : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={loading}
                            className={`flex-1 rounded-lg px-4 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                isDashboardThemeEnabled
                                    ? "bg-error text-error-content hover:bg-error/90"
                                    : "bg-red-600 text-white hover:bg-red-700"
                            }`}
                        >
                            {loading ? "Deleting..." : "Delete User"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
