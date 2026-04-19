import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Eye, EyeOff, UserCog } from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface User {
    user_id: number;
    firstname: string;
    lastname: string;
    middle_name?: string;
    email: string;
    role: string;
    status?: "active" | "inactive";
    permissions?: {
        can_delete?: boolean;
        can_upload?: boolean;
        can_view?: boolean;
        can_edit?: boolean;
    };
}

interface EditUserModalProps {
    isOpen: boolean;
    user: User;
    onClose: () => void;
    onSubmit: (formData: any) => void;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
    isOpen,
    user,
    onClose,
    onSubmit,
}) => {
    const [formData, setFormData] = useState({
        firstname: user.firstname,
        lastname: user.lastname,
        middle_name: user.middle_name || "",
        email: user.email,
        password: "",
        confirmPassword: "",
        role: user.role,
        can_upload: user.permissions?.can_upload || false,
        can_view: user.permissions?.can_view || true,
        can_delete: user.permissions?.can_delete || false,
        can_edit: user.permissions?.can_edit || false,
        status: user.status || "active",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

    useEffect(() => {
        setFormData({
            firstname: user.firstname,
            lastname: user.lastname,
            middle_name: user.middle_name || "",
            email: user.email,
            password: "",
            confirmPassword: "",
            role: user.role,
            can_upload: user.permissions?.can_upload || false,
            can_view: user.permissions?.can_view || true,
            can_delete: user.permissions?.can_delete || false,
            can_edit: user.permissions?.can_edit || false,
            status: user.status || "active",
        });
        setErrors({});
    }, [user]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstname.trim()) {
            newErrors.firstname = "First name is required";
        }
        if (!formData.lastname.trim()) {
            newErrors.lastname = "Last name is required";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (formData.password) {
            if (formData.password.length < 6) {
                newErrors.password = "Password must be at least 6 characters";
            }
            if (formData.password !== formData.confirmPassword) {
                newErrors.confirmPassword = "Passwords do not match";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value, type } = e.target;
        setFormData({
            ...formData,
            [name]:
                type === "checkbox"
                    ? (e.target as HTMLInputElement).checked
                    : value,
        });

        if (errors[name]) {
            setErrors((prev) => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            const submitData: any = {
                firstname: formData.firstname,
                lastname: formData.lastname,
                middle_name: formData.middle_name,
                email: formData.email,
                role: formData.role,
                permissions: {
                    can_upload: formData.can_upload,
                    can_view: formData.can_view,
                    can_delete: formData.can_delete,
                    can_edit: formData.can_edit,
                },
                status: formData.status,
            };

            if (formData.password) {
                submitData.password = formData.password;
            }

            await onSubmit(submitData);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClassName = (hasError = false) =>
        `w-full rounded-xl border-2 px-4 py-3 outline-none transition-colors focus:outline-none ${
            isDashboardThemeEnabled
                ? `${
                      hasError ? "border-error" : "border-base-300"
                  } bg-base-100 text-base-content focus:border-primary`
                : `${
                      hasError ? "border-red-500" : "border-gray-200"
                  } focus:border-green-500`
        }`;

    const labelClassName = `mb-2 block text-sm font-semibold ${
        isDashboardThemeEnabled ? "text-base-content/70" : "text-gray-700"
    }`;

    const checkboxClassName = isDashboardThemeEnabled
        ? "checkbox checkbox-sm checkbox-primary rounded-md"
        : "h-4 w-4 rounded text-green-600 focus:ring-2 focus:ring-green-500";

    const modalContent = (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center sm:p-6"
            style={{ background: 'transparent' }}
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            <div
                className={`pointer-events-auto relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl ${
                    isDashboardThemeEnabled
                        ? "border border-base-300 bg-base-100 text-base-content"
                        : "bg-white"
                }`}
                style={{ maxHeight: "min(90vh, 960px)" }}
            >
                {/* Header */}
                <div
                    className={`relative px-8 py-8 ${
                        isDashboardThemeEnabled
                            ? "border-b border-base-300 bg-primary text-primary-content"
                            : "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600"
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
                        <div
                            className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full ${
                                isDashboardThemeEnabled
                                    ? "bg-base-100/20"
                                    : "bg-white/20"
                            }`}
                        >
                            <UserCog
                                className={`h-8 w-8 ${
                                    isDashboardThemeEnabled
                                        ? "text-primary-content"
                                        : "text-white"
                                }`}
                            />
                        </div>
                        <h2
                            className={`text-center text-3xl font-bold ${
                                isDashboardThemeEnabled
                                    ? "text-primary-content"
                                    : "text-white"
                            }`}
                        >
                            Edit User
                        </h2>
                        <p
                            className={`mt-2 text-center ${
                                isDashboardThemeEnabled
                                    ? "text-primary-content/80"
                                    : "text-white/80"
                            }`}
                        >
                            Update the account details
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="overflow-y-auto px-8 py-6" style={{ maxHeight: "60vh" }}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClassName}>
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleInputChange}
                                    className={inputClassName(
                                        Boolean(errors.firstname)
                                    )}
                                    placeholder="John"
                                />
                                {errors.firstname && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.firstname}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className={labelClassName}>
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleInputChange}
                                    className={inputClassName(
                                        Boolean(errors.lastname)
                                    )}
                                    placeholder="Doe"
                                />
                                {errors.lastname && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.lastname}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className={labelClassName}>Middle Name</label>
                            <input
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleInputChange}
                                className={inputClassName()}
                                placeholder="Michael"
                            />
                        </div>

                        <div>
                            <label className={labelClassName}>Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={inputClassName(Boolean(errors.email))}
                                placeholder="john@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        <div className={`mt-6 border-t pt-6 ${isDashboardThemeEnabled ? "border-base-300" : "border-gray-200"}`}></div>

                        <div
                            className={`rounded-xl border-2 p-4 ${
                                isDashboardThemeEnabled
                                    ? "border-info/20 bg-info/10"
                                    : "border-blue-200 bg-blue-50"
                            }`}
                        >
                            <p
                                className={`text-sm font-medium ${
                                    isDashboardThemeEnabled
                                        ? "text-info"
                                        : "text-blue-700"
                                }`}
                            >
                                Leave password fields empty to keep the current
                                password
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <label className={labelClassName}>
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        className={inputClassName(
                                            Boolean(errors.password)
                                        )}
                                        placeholder="Enter new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        className={`absolute right-3 top-[14px] ${
                                            isDashboardThemeEnabled
                                                ? "text-base-content/50 hover:text-base-content"
                                                : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className={labelClassName}>
                                    Confirm New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={inputClassName(
                                            Boolean(errors.confirmPassword)
                                        )}
                                        placeholder="Confirm new password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        className={`absolute right-3 top-[14px] ${
                                            isDashboardThemeEnabled
                                                ? "text-base-content/50 hover:text-base-content"
                                                : "text-gray-500 hover:text-gray-700"
                                        }`}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.confirmPassword}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className={`mt-6 border-t pt-6 ${isDashboardThemeEnabled ? "border-base-300" : "border-gray-200"}`}></div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClassName}>Role *</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className={inputClassName()}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="staff">Staff</option>
                                </select>
                            </div>

                            <div>
                                <label className={labelClassName}>Status</label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className={inputClassName()}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className={labelClassName}>
                                Document Permissions
                            </label>
                            <div
                                className={`rounded-xl border-2 p-4 ${
                                    isDashboardThemeEnabled
                                        ? "border-base-300 bg-base-200/40"
                                        : "border-gray-200 bg-gray-50/60"
                                }`}
                            >
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        ["can_view", "View Documents"],
                                        ["can_upload", "Upload Documents"],
                                        ["can_delete", "Delete Documents"],
                                        ["can_edit", "Edit Documents"],
                                    ].map(([key, label]) => (
                                        <div key={key} className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id={key}
                                                name={key}
                                                checked={
                                                    formData[
                                                        key as keyof typeof formData
                                                    ] as boolean
                                                }
                                                onChange={handleInputChange}
                                                className={checkboxClassName}
                                            />
                                            <label
                                                htmlFor={key}
                                                className={`ml-3 cursor-pointer text-sm font-medium ${
                                                    isDashboardThemeEnabled
                                                        ? "text-base-content/75"
                                                        : "text-gray-700"
                                                }`}
                                            >
                                                {label}
                                            </label>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
                
                {/* Footer */}
                <div
                    className={`flex gap-3 border-t px-8 py-5 ${
                        isDashboardThemeEnabled
                            ? "border-base-300 bg-base-200/50"
                            : "border-gray-200 bg-gray-50"
                    }`}
                >
                    <button
                        type="button"
                        onClick={onClose}
                        className={`flex-1 rounded-xl px-6 py-3 font-semibold transition-all duration-200 ${
                            isDashboardThemeEnabled
                                ? "border border-base-300 text-base-content hover:bg-base-300"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={loading}
                        className={`flex flex-1 transform items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50 ${
                            isDashboardThemeEnabled
                                ? "bg-primary text-primary-content hover:bg-primary/90"
                                : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                        }`}
                    >
                        <UserCog className="h-4 w-4" />
                        {loading ? "Updating..." : "Update User"}
                    </button>
                </div>

            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default EditUserModal;
