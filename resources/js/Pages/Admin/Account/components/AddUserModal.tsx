import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Eye, EyeOff } from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (formData: any) => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
}) => {
    const [formData, setFormData] = useState({
        firstname: "",
        lastname: "",
        middle_name: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "staff",
        can_upload: false,
        can_view: true,
        can_delete: false,
        can_edit: false,
        status: "active",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

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
        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }
        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
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
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setLoading(true);
        try {
            await onSubmit({
                firstname: formData.firstname,
                lastname: formData.lastname,
                middle_name: formData.middle_name,
                email: formData.email,
                password: formData.password,
                role: formData.role,
                permissions: {
                    can_edit: formData.can_edit,
                    can_delete: formData.can_delete,
                    can_upload: formData.can_upload,
                    can_view: formData.can_view,
                },
                status: formData.status,
            });
            setFormData({
                firstname: "",
                lastname: "",
                middle_name: "",
                email: "",
                password: "",
                confirmPassword: "",
                role: "staff",
                can_upload: false,
                can_view: true,
                can_delete: false,
                can_edit: false,
                status: "active",
            });
            setErrors({});
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const inputClassName = (hasError = false) =>
        `w-full rounded-lg border px-4 py-2 outline-none transition-all ${
            isDashboardThemeEnabled
                ? `${hasError ? "border-error" : "border-base-300"} bg-base-100 text-base-content focus:border-primary focus:ring-2 focus:ring-primary/20`
                : `${hasError ? "border-red-500" : "border-gray-300"} focus:ring-2 focus:ring-green-500`
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
            className="fixed inset-0 z-[9999]"
        >
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div
                    className={`pointer-events-auto max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl shadow-2xl scrollbar-thin scrollbar-track-transparent ${
                        isDashboardThemeEnabled
                            ? "border border-base-300 bg-base-100 text-base-content scrollbar-thumb-base-300 hover:scrollbar-thumb-base-content/20"
                            : "bg-white scrollbar-thumb-gray-300 hover:scrollbar-thumb-gray-400"
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
                            Add New User
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

                    <form onSubmit={handleSubmit} className="space-y-4 p-6">
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

                        <div>
                            <label className={labelClassName}>Password *</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={inputClassName(
                                        Boolean(errors.password)
                                    )}
                                    placeholder="Enter password"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }
                                    className={`absolute right-3 top-2.5 ${
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
                                Confirm Password *
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
                                    placeholder="Confirm password"
                                />
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword
                                        )
                                    }
                                    className={`absolute right-3 top-2.5 ${
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
                            <label className={labelClassName}>
                                Document Permissions
                            </label>
                            <div
                                className={`space-y-3 rounded-xl border p-4 ${
                                    isDashboardThemeEnabled
                                        ? "border-base-300 bg-base-200/40"
                                        : "border-gray-200 bg-gray-50/60"
                                }`}
                            >
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
                                            className={`ml-3 text-sm ${
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

                        <div
                            className={`flex gap-3 border-t pt-6 ${
                                isDashboardThemeEnabled
                                    ? "border-base-300"
                                    : "border-gray-200"
                            }`}
                        >
                            <button
                                type="button"
                                onClick={onClose}
                                className={`flex-1 rounded-lg px-4 py-3 font-semibold transition-colors ${
                                    isDashboardThemeEnabled
                                        ? "border border-base-300 text-base-content/70 hover:bg-base-200"
                                        : "border border-gray-300 text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className={`flex-1 rounded-lg px-4 py-3 font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                                    isDashboardThemeEnabled
                                        ? "bg-primary text-primary-content hover:bg-primary/90"
                                        : "bg-green-600 text-white hover:bg-green-700"
                                }`}
                            >
                                {loading ? "Creating..." : "Create User"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default AddUserModal;
