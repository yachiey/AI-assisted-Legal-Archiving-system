import React, { useEffect, useRef, useState } from "react";
import { usePage } from "@inertiajs/react";
import { createPortal } from "react-dom";
import {
    User,
    Mail,
    Calendar,
    X,
    Edit,
    Trash2,
    Camera,
} from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    getDashboardThemeScopeForComponent,
    isThemedComponentForScope,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface UserData {
    user_id: number;
    firstname: string;
    lastname: string;
    middle_name?: string;
    email: string;
    created_at: string;
    updated_at: string;
    profile_picture?: string;
}

interface ViewProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: UserData | null;
    onEdit: () => void;
    onDelete: () => void;
    onUploadPicture: (file: File) => void;
}

const ViewProfileModal: React.FC<ViewProfileModalProps> = ({
    isOpen,
    onClose,
    userData,
    onEdit,
    onDelete,
    onUploadPicture,
}) => {
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);
    const modalRef = useRef<HTMLDivElement>(null);
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            modalRef.current?.scrollTo({ top: 0, behavior: "auto" });
        }
    }, [isOpen, userData?.user_id]);

    if (!isOpen || !userData) return null;

    const handleFileChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (file) {
            setIsUploading(true);
            try {
                await onUploadPicture(file);
            } finally {
                setIsUploading(false);
            }
        }
    };

    const formatDate = (dateString: string): string =>
        new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });

    const getFullName = (): string =>
        [userData.firstname, userData.middle_name, userData.lastname]
            .filter(Boolean)
            .join(" ");

    const getInitials = (): string =>
        (
            (userData.firstname?.charAt(0) || "") +
            (userData.lastname?.charAt(0) || "")
        ).toUpperCase();

    const infoCardClass = isDashboardThemeEnabled
        ? "rounded-xl border border-base-300 bg-base-200/55 p-5"
        : "rounded-xl bg-gray-50 p-5";

    const labelClass = `text-xs font-semibold uppercase tracking-wider ${
        isDashboardThemeEnabled ? "text-base-content/45" : "text-gray-500"
    }`;

    const valueClass = `mt-1 text-base font-medium ${
        isDashboardThemeEnabled ? "text-base-content" : "text-gray-900"
    }`;

    const modalContent = (
        <div data-lenis-prevent
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={onClose}
            style={{ pointerEvents: "auto" }}
        >
            <div data-lenis-prevent
                ref={modalRef}
                className={`w-full max-w-2xl overflow-y-auto rounded-3xl shadow-2xl ${
                    isDashboardThemeEnabled
                        ? "border border-base-300 bg-base-100 text-base-content"
                        : "bg-white"
                }`}
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: "min(90vh, 960px)" }}
            >
                <div
                    className={`relative px-8 py-12 ${
                        isDashboardThemeEnabled
                            ? "border-b border-base-300 bg-primary text-primary-content"
                            : "bg-gradient-to-r from-green-600 via-green-500 to-emerald-600"
                    }`}
                >
                    <button
                        onClick={onClose}
                        className={`absolute right-4 top-4 rounded-full p-2 transition-all duration-200 ${
                            isDashboardThemeEnabled
                                ? "text-primary-content/80 hover:bg-white/10 hover:text-primary-content"
                                : "text-white/80 hover:bg-white/20 hover:text-white"
                        }`}
                    >
                        <X className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col items-center">
                        <div className="group relative">
                            {userData.profile_picture ? (
                                <img
                                    src={`/storage/${userData.profile_picture}`}
                                    alt="Profile"
                                    className={`h-28 w-28 rounded-full object-cover shadow-xl border-4 ${
                                        isDashboardThemeEnabled
                                            ? "border-primary-content/30"
                                            : "border-white/30"
                                    }`}
                                />
                            ) : (
                                <div
                                    className={`flex h-28 w-28 items-center justify-center rounded-full text-4xl font-bold shadow-xl border-4 ${
                                        isDashboardThemeEnabled
                                            ? "border-primary-content/30 bg-white/10 text-primary-content"
                                            : "border-white/30 bg-white/20 text-white"
                                    }`}
                                >
                                    {getInitials()}
                                </div>
                            )}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className={`absolute bottom-0 right-0 rounded-full p-2 shadow-lg transition-all duration-200 group-hover:scale-110 ${
                                    isDashboardThemeEnabled
                                        ? "bg-base-100 text-primary hover:bg-base-200"
                                        : "bg-white/90 text-green-600 hover:bg-white"
                                }`}
                                title="Upload profile picture"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                                className="hidden"
                            />
                        </div>
                        <div className="mb-4 h-2"></div>
                        <h2
                            className={`mb-2 text-center text-3xl font-bold ${
                                isDashboardThemeEnabled
                                    ? "text-primary-content"
                                    : "text-white"
                            }`}
                        >
                            {getFullName()}
                        </h2>
                        <p
                            className={`text-sm font-medium ${
                                isDashboardThemeEnabled
                                    ? "text-primary-content/80"
                                    : "text-white/90"
                            }`}
                        >
                            {userData.email}
                        </p>
                    </div>
                </div>

                <div className="px-8 py-6">
                    <div className="mb-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div
                                className={`rounded-lg p-2 ${
                                    isDashboardThemeEnabled
                                        ? "bg-primary/10"
                                        : "bg-green-100"
                                }`}
                            >
                                <User
                                    className={`h-4 w-4 ${
                                        isDashboardThemeEnabled
                                            ? "text-primary"
                                            : "text-green-600"
                                    }`}
                                />
                            </div>
                            <h3
                                className={`text-lg font-semibold ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content"
                                        : "text-gray-800"
                                }`}
                            >
                                Personal Information
                            </h3>
                        </div>

                        <div className={infoCardClass}>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>
                                        First Name
                                    </label>
                                    <p className={valueClass}>
                                        {userData.firstname}
                                    </p>
                                </div>

                                <div>
                                    <label className={labelClass}>
                                        Last Name
                                    </label>
                                    <p className={valueClass}>
                                        {userData.lastname}
                                    </p>
                                </div>
                            </div>

                            {userData.middle_name && (
                                <div className="mt-4">
                                    <label className={labelClass}>
                                        Middle Name
                                    </label>
                                    <p className={valueClass}>
                                        {userData.middle_name}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div
                                className={`rounded-lg p-2 ${
                                    isDashboardThemeEnabled
                                        ? "bg-info/10"
                                        : "bg-blue-100"
                                }`}
                            >
                                <Mail
                                    className={`h-4 w-4 ${
                                        isDashboardThemeEnabled
                                            ? "text-info"
                                            : "text-blue-600"
                                    }`}
                                />
                            </div>
                            <h3
                                className={`text-lg font-semibold ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content"
                                        : "text-gray-800"
                                }`}
                            >
                                Contact Information
                            </h3>
                        </div>

                        <div className={infoCardClass}>
                            <label className={labelClass}>Email Address</label>
                            <p className={`${valueClass} break-all`}>
                                {userData.email}
                            </p>
                        </div>
                    </div>

                    <div className="mb-6">
                        <div className="mb-4 flex items-center gap-2">
                            <div
                                className={`rounded-lg p-2 ${
                                    isDashboardThemeEnabled
                                        ? "bg-secondary/10"
                                        : "bg-purple-100"
                                }`}
                            >
                                <Calendar
                                    className={`h-4 w-4 ${
                                        isDashboardThemeEnabled
                                            ? "text-secondary"
                                            : "text-purple-600"
                                    }`}
                                />
                            </div>
                            <h3
                                className={`text-lg font-semibold ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content"
                                        : "text-gray-800"
                                }`}
                            >
                                Account Timeline
                            </h3>
                        </div>

                        <div className={`${infoCardClass} space-y-4`}>
                            <div className="flex items-start gap-3">
                                <div
                                    className={`mt-2 h-2 w-2 rounded-full ${
                                        isDashboardThemeEnabled
                                            ? "bg-success"
                                            : "bg-green-500"
                                    }`}
                                ></div>
                                <div className="flex-1">
                                    <label className={labelClass}>
                                        Account Created
                                    </label>
                                    <p className={valueClass}>
                                        {formatDate(userData.created_at)}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3">
                                <div
                                    className={`mt-2 h-2 w-2 rounded-full ${
                                        isDashboardThemeEnabled
                                            ? "bg-info"
                                            : "bg-blue-500"
                                    }`}
                                ></div>
                                <div className="flex-1">
                                    <label className={labelClass}>
                                        Last Updated
                                    </label>
                                    <p className={valueClass}>
                                        {formatDate(userData.updated_at)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-center py-4">
                        <div
                            className={`inline-flex items-center gap-2 rounded-full px-6 py-3 border-2 ${
                                isDashboardThemeEnabled
                                    ? "border-success/20 bg-success/10 text-success"
                                    : "border-green-200 bg-green-50"
                            }`}
                        >
                            <div
                                className={`h-3 w-3 rounded-full animate-pulse ${
                                    isDashboardThemeEnabled
                                        ? "bg-success"
                                        : "bg-green-500"
                                }`}
                            ></div>
                            <span
                                className={`text-sm font-semibold ${
                                    isDashboardThemeEnabled
                                        ? "text-success"
                                        : "text-green-700"
                                }`}
                            >
                                Account Active
                            </span>
                        </div>
                    </div>
                </div>

                <div
                    className={`space-y-3 border-t px-8 py-5 ${
                        isDashboardThemeEnabled
                            ? "border-base-300 bg-base-100"
                            : "border-gray-200 bg-gray-50"
                    }`}
                >
                    <div className="flex gap-3">
                        <button
                            onClick={onEdit}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-200 ${
                                isDashboardThemeEnabled
                                    ? "bg-primary text-primary-content hover:bg-primary/90"
                                    : "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg hover:from-blue-700 hover:to-blue-800 hover:shadow-xl"
                            }`}
                        >
                            <Edit className="h-4 w-4" />
                            Edit Profile
                        </button>
                        <button
                            onClick={onDelete}
                            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition-all duration-200 ${
                                isDashboardThemeEnabled
                                    ? "bg-error text-error-content hover:bg-error/90"
                                    : "bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg hover:from-red-700 hover:to-red-800 hover:shadow-xl"
                            }`}
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete Account
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className={`w-full rounded-xl px-6 py-3 font-semibold transition-all duration-200 ${
                            isDashboardThemeEnabled
                                ? "border border-base-300 text-base-content hover:bg-base-200"
                                : "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:from-green-700 hover:to-emerald-700 hover:shadow-xl"
                        }`}
                    >
                        Close Profile
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default ViewProfileModal;
