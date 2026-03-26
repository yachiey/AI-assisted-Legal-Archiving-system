import React from "react";
import { createPortal } from "react-dom";
import { X, FileText, Calendar, Folder } from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface Document {
    doc_id: number;
    title: string;
    created_at: string;
    folder_name: string;
    folder_path: string;
    status: string;
}

interface User {
    firstname: string;
    lastname: string;
}

interface UserDocumentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    documents: Document[];
    user: User | null;
    loading: boolean;
}

const UserDocumentsModal: React.FC<UserDocumentsModalProps> = ({
    isOpen,
    onClose,
    documents,
    user,
    loading,
}) => {
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const modalContent = (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="fixed inset-0 z-[9999]"
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none sm:p-6">
                <div
                    className={`pointer-events-auto relative flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl shadow-2xl ${
                        isDashboardThemeEnabled
                            ? "border border-base-300 bg-base-100 text-base-content"
                            : "bg-white"
                    }`}
                >
                    <div
                        className={`z-10 flex items-center justify-between border-b px-6 py-4 ${
                            isDashboardThemeEnabled
                                ? "border-base-300 bg-base-100"
                                : "border-gray-100 bg-white"
                        }`}
                    >
                        <div>
                            <h2
                                className={`text-xl font-bold ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content"
                                        : "text-gray-900"
                                }`}
                            >
                                User Uploads
                            </h2>
                            <p
                                className={`mt-1 text-sm ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content/60"
                                        : "text-gray-500"
                                }`}
                            >
                                Documents uploaded by{" "}
                                <span
                                    className={`font-semibold ${
                                        isDashboardThemeEnabled
                                            ? "text-base-content"
                                            : "text-gray-700"
                                    }`}
                                >
                                    {user?.firstname} {user?.lastname}
                                </span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className={`rounded-lg p-2 transition-all ${
                                isDashboardThemeEnabled
                                    ? "text-base-content/45 hover:bg-base-200 hover:text-base-content"
                                    : "text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                            }`}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div
                        className={`flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-track-transparent ${
                            isDashboardThemeEnabled
                                ? "bg-base-200/40 scrollbar-thumb-base-300 hover:scrollbar-thumb-base-content/20"
                                : "bg-gray-50/50 scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
                        }`}
                    >
                        {loading ? (
                            <div
                                className={`flex flex-col items-center justify-center py-12 ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content/65"
                                        : "text-gray-500"
                                }`}
                            >
                                <div
                                    className={`mb-3 h-8 w-8 animate-spin rounded-full border-b-2 ${
                                        isDashboardThemeEnabled
                                            ? "border-primary"
                                            : "border-green-600"
                                    }`}
                                ></div>
                                <p>Loading documents...</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div
                                className={`flex flex-col items-center justify-center py-16 ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content/45"
                                        : "text-gray-400"
                                }`}
                            >
                                <div
                                    className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                                        isDashboardThemeEnabled
                                            ? "bg-base-200"
                                            : "bg-gray-100"
                                    }`}
                                >
                                    <FileText
                                        className={`h-8 w-8 ${
                                            isDashboardThemeEnabled
                                                ? "text-base-content/30"
                                                : "text-gray-300"
                                        }`}
                                    />
                                </div>
                                <h3
                                    className={`mb-1 text-lg font-semibold ${
                                        isDashboardThemeEnabled
                                            ? "text-base-content"
                                            : "text-gray-900"
                                    }`}
                                >
                                    No Documents Found
                                </h3>
                                <p className="text-sm">
                                    This user has not uploaded any documents
                                    yet.
                                </p>
                            </div>
                        ) : (
                            <div
                                className={`overflow-hidden rounded-xl border shadow-sm ${
                                    isDashboardThemeEnabled
                                        ? "border-base-300 bg-base-100"
                                        : "border-gray-200 bg-white"
                                }`}
                            >
                                <table className="w-full text-left text-sm">
                                    <thead
                                        className={`border-b ${
                                            isDashboardThemeEnabled
                                                ? "border-base-300 bg-base-200/80"
                                                : "border-gray-200 bg-gray-50"
                                        }`}
                                    >
                                        <tr>
                                            {[
                                                "Document Name",
                                                "Location",
                                                "Date Uploaded",
                                                "Status",
                                            ].map((heading) => (
                                                <th
                                                    key={heading}
                                                    className={`px-6 py-3 font-semibold ${
                                                        isDashboardThemeEnabled
                                                            ? "text-base-content/65"
                                                            : "text-gray-700"
                                                    }`}
                                                >
                                                    {heading}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody
                                        className={`divide-y ${
                                            isDashboardThemeEnabled
                                                ? "divide-base-300/70"
                                                : "divide-gray-100"
                                        }`}
                                    >
                                        {documents.map((doc) => (
                                            <tr
                                                key={doc.doc_id}
                                                className={`transition-colors ${
                                                    isDashboardThemeEnabled
                                                        ? "hover:bg-base-200/60"
                                                        : "hover:bg-gray-50"
                                                }`}
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div
                                                            className={`rounded-lg p-2 ${
                                                                isDashboardThemeEnabled
                                                                    ? "bg-primary/10 text-primary"
                                                                    : "bg-blue-50 text-blue-600"
                                                            }`}
                                                        >
                                                            <FileText className="h-4 w-4" />
                                                        </div>
                                                        <span
                                                            className={`line-clamp-1 font-medium ${
                                                                isDashboardThemeEnabled
                                                                    ? "text-base-content"
                                                                    : "text-gray-900"
                                                            }`}
                                                            title={doc.title}
                                                        >
                                                            {doc.title}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div
                                                        className={`flex items-center gap-2 ${
                                                            isDashboardThemeEnabled
                                                                ? "text-base-content/65"
                                                                : "text-gray-600"
                                                        }`}
                                                    >
                                                        <Folder
                                                            className={`h-4 w-4 ${
                                                                isDashboardThemeEnabled
                                                                    ? "text-base-content/45"
                                                                    : "text-gray-400"
                                                            }`}
                                                        />
                                                        <span
                                                            className="max-w-[200px] truncate"
                                                            title={doc.folder_path}
                                                        >
                                                            {doc.folder_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td
                                                    className={`px-6 py-4 ${
                                                        isDashboardThemeEnabled
                                                            ? "text-base-content/65"
                                                            : "text-gray-600"
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <Calendar
                                                            className={`h-4 w-4 ${
                                                                isDashboardThemeEnabled
                                                                    ? "text-base-content/45"
                                                                    : "text-gray-400"
                                                            }`}
                                                        />
                                                        {formatDate(
                                                            doc.created_at
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                            doc.status ===
                                                            "active"
                                                                ? isDashboardThemeEnabled
                                                                    ? "bg-success/15 text-success"
                                                                    : "bg-green-100 text-green-800"
                                                                : isDashboardThemeEnabled
                                                                  ? "bg-info/15 text-info"
                                                                  : "bg-blue-100 text-blue-800"
                                                        }`}
                                                    >
                                                        {doc.status
                                                            .charAt(0)
                                                            .toUpperCase() +
                                                            doc.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div
                        className={`border-t px-6 py-4 text-right ${
                            isDashboardThemeEnabled
                                ? "border-base-300 bg-base-100"
                                : "border-gray-100 bg-white"
                        }`}
                    >
                        <button
                            onClick={onClose}
                            className={`rounded-lg px-4 py-2 font-medium transition-colors ${
                                isDashboardThemeEnabled
                                    ? "border border-base-300 text-base-content/70 hover:bg-base-200"
                                    : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default UserDocumentsModal;
