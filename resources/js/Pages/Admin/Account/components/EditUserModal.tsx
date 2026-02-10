import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Eye, EyeOff } from "lucide-react";

interface User {
    user_id: number;
    firstname: string;
    lastname: string;
    middle_name?: string;
    email: string;
    role: string;
    status?: 'active' | 'inactive';
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

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, user, onClose, onSubmit }) => {
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

        // Only validate password if it's being changed
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
            [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
        });
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

            // Only include password if it's being changed
            if (formData.password) {
                submitData.password = formData.password;
            }

            await onSubmit(submitData);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const modalContent = (
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop with blur effect */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />
            {/* Modal container */}
            <div className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none">
                <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto pointer-events-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <h2 className="text-2xl font-bold text-gray-900">Edit User</h2>
                        <button
                            onClick={onClose}
                            className="text-gray-500 hover:text-gray-700 transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* Name Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    First Name *
                                </label>
                                <input
                                    type="text"
                                    name="firstname"
                                    value={formData.firstname}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 rounded-lg border ${errors.firstname ? 'border-red-500' : 'border-gray-300'
                                        } focus:outline-none focus:ring-2 focus:ring-green-500`}
                                    placeholder="John"
                                />
                                {errors.firstname && (
                                    <p className="text-red-500 text-xs mt-1">{errors.firstname}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Last Name *
                                </label>
                                <input
                                    type="text"
                                    name="lastname"
                                    value={formData.lastname}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 rounded-lg border ${errors.lastname ? 'border-red-500' : 'border-gray-300'
                                        } focus:outline-none focus:ring-2 focus:ring-green-500`}
                                    placeholder="Doe"
                                />
                                {errors.lastname && (
                                    <p className="text-red-500 text-xs mt-1">{errors.lastname}</p>
                                )}
                            </div>
                        </div>

                        {/* Middle Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Middle Name
                            </label>
                            <input
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Michael"
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-2 rounded-lg border ${errors.email ? 'border-red-500' : 'border-gray-300'
                                    } focus:outline-none focus:ring-2 focus:ring-green-500`}
                                placeholder="john@example.com"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Password Note */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            <p className="text-xs text-blue-700">
                                Leave password fields empty to keep the current password
                            </p>
                        </div>

                        {/* Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password (Optional)
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 rounded-lg border ${errors.password ? 'border-red-500' : 'border-gray-300'
                                        } focus:outline-none focus:ring-2 focus:ring-green-500`}
                                    placeholder="••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        {formData.password && (
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Confirm New Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 rounded-lg border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                                            } focus:outline-none focus:ring-2 focus:ring-green-500`}
                                        placeholder="••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
                                    >
                                        {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                {errors.confirmPassword && (
                                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                                )}
                            </div>
                        )}

                        {/* Role */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Role *
                            </label>
                            <select
                                name="role"
                                value={formData.role}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            >
                                <option value="admin">Admin</option>
                                <option value="staff">Staff</option>
                            </select>
                        </div>

                        {/* Permissions */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                Document Permissions
                            </label>
                            <div className="space-y-2">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="can_view"
                                        name="can_view"
                                        checked={formData.can_view}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                    />
                                    <label htmlFor="can_view" className="ml-2 text-sm text-gray-700">
                                        View Documents
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="can_upload"
                                        name="can_upload"
                                        checked={formData.can_upload}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                    />
                                    <label htmlFor="can_upload" className="ml-2 text-sm text-gray-700">
                                        Upload Documents
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="can_delete"
                                        name="can_delete"
                                        checked={formData.can_delete}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                    />
                                    <label htmlFor="can_delete" className="ml-2 text-sm text-gray-700">
                                        Delete Documents
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="can_edit"
                                        name="can_edit"
                                        checked={formData.can_edit}
                                        onChange={handleInputChange}
                                        className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                                    />
                                    <label htmlFor="can_edit" className="ml-2 text-sm text-gray-700">
                                        Edit Documents
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Status */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                name="status"
                                value={formData.status}
                                onChange={handleInputChange}
                                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                            >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 text-white font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Updating..." : "Update User"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default EditUserModal;
