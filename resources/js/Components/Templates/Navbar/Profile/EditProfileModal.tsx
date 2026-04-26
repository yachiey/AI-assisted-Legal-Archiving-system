import React, { useState } from "react";
import { createPortal } from "react-dom";
import { usePage } from "@inertiajs/react";
import { X, Save } from "lucide-react";
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
}

interface EditProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    userData: UserData | null;
    onSave: (data: Partial<UserData> & { password?: string; password_confirmation?: string }) => void;
}

const EditProfileModal: React.FC<EditProfileModalProps> = ({
    isOpen,
    onClose,
    userData,
    onSave,
}) => {
    const { component } = usePage();
    const scope = getDashboardThemeScopeForComponent(component);
    const { theme } = useDashboardTheme(scope);
    const isDashboardThemeEnabled =
        isThemedComponentForScope(component, scope) &&
        theme !== DEFAULT_DASHBOARD_THEME;

    const [formData, setFormData] = useState({
        firstname: userData?.firstname || "",
        lastname: userData?.lastname || "",
        middle_name: userData?.middle_name || "",
        email: userData?.email || "",
        password: "",
        password_confirmation: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    React.useEffect(() => {
        if (userData) {
            setFormData({
                firstname: userData.firstname,
                lastname: userData.lastname,
                middle_name: userData.middle_name || "",
                email: userData.email,
                password: "",
                password_confirmation: "",
            });
        }
    }, [userData]);

    if (!isOpen || !userData) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field
        if (errors[name]) {
            setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.firstname.trim()) {
            newErrors.firstname = "First name is required";
        }
        if (!formData.lastname.trim()) {
            newErrors.lastname = "Last name is required";
        }
        if (!formData.email.trim()) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = "Email is invalid";
        }

        if (formData.password) {
            if (formData.password.length < 8) {
                newErrors.password = "Password must be at least 8 characters";
            }
            if (formData.password !== formData.password_confirmation) {
                newErrors.password_confirmation = "Passwords do not match";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validate()) {
            const dataToSend: any = {
                firstname: formData.firstname,
                lastname: formData.lastname,
                middle_name: formData.middle_name || null,
                email: formData.email,
            };

            if (formData.password) {
                dataToSend.password = formData.password;
                dataToSend.password_confirmation = formData.password_confirmation;
            }

            onSave(dataToSend);
        }
    };

    const labelClass = `block text-sm font-semibold mb-2 ${
        isDashboardThemeEnabled ? "text-base-content" : "text-gray-700"
    }`;

    const getInputClass = (error?: string) => `w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
        isDashboardThemeEnabled
            ? `bg-base-200 text-base-content placeholder:text-base-content/40 ${error ? 'border-error focus:border-error' : 'border-base-300 focus:border-primary'}`
            : `${error ? 'border-red-500' : 'border-gray-200'} focus:border-blue-500`
    }`;

    const getErrorClass = () => `text-sm mt-1 ${isDashboardThemeEnabled ? "text-error" : "text-red-500"}`;

    const modalContent = (
        <div data-lenis-prevent
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={onClose}
        >
            <div
                className={`w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl ${
                    isDashboardThemeEnabled ? "border border-base-300 bg-base-100 text-base-content" : "bg-white"
                }`}
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: "min(90vh, 960px)" }}
            >
                {/* Header */}
                <div className={`relative px-8 py-8 ${
                    isDashboardThemeEnabled ? "border-b border-base-300 bg-primary text-primary-content" : "bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600"
                }`}>
                    <button
                        onClick={onClose}
                        className={`absolute top-4 right-4 rounded-full p-2 transition-all duration-200 ${
                            isDashboardThemeEnabled ? "text-primary-content/80 hover:bg-white/10 hover:text-primary-content" : "text-white/80 hover:bg-white/20 hover:text-white"
                        }`}
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className={`text-3xl font-bold text-center ${
                        isDashboardThemeEnabled ? "text-primary-content" : "text-white"
                    }`}>
                        Edit Profile
                    </h2>
                    <p className={`text-center mt-2 ${
                        isDashboardThemeEnabled ? "text-primary-content/80" : "text-white/80"
                    }`}>
                        Update your personal information
                    </p>
                </div>

                {/* Form */}
                <form data-lenis-prevent onSubmit={handleSubmit} className="px-8 py-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {/* First Name */}
                        <div>
                            <label className={labelClass}>
                                First Name *
                            </label>
                            <input
                                type="text"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleChange}
                                className={getInputClass(errors.firstname)}
                                placeholder="Enter first name"
                            />
                            {errors.firstname && (
                                <p className={getErrorClass()}>{errors.firstname}</p>
                            )}
                        </div>

                        {/* Middle Name */}
                        <div>
                            <label className={labelClass}>
                                Middle Name
                            </label>
                            <input
                                type="text"
                                name="middle_name"
                                value={formData.middle_name}
                                onChange={handleChange}
                                className={getInputClass()}
                                placeholder="Enter middle name (optional)"
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className={labelClass}>
                                Last Name *
                            </label>
                            <input
                                type="text"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleChange}
                                className={getInputClass(errors.lastname)}
                                placeholder="Enter last name"
                            />
                            {errors.lastname && (
                                <p className={getErrorClass()}>{errors.lastname}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className={labelClass}>
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={getInputClass(errors.email)}
                                placeholder="Enter email address"
                            />
                            {errors.email && (
                                <p className={getErrorClass()}>{errors.email}</p>
                            )}
                        </div>

                        {/* Divider */}
                        <div className={`border-t my-6 ${isDashboardThemeEnabled ? "border-base-300" : "border-gray-200"}`}></div>
                        <p className={`text-sm italic ${isDashboardThemeEnabled ? "text-base-content/60" : "text-gray-600"}`}>
                            Leave password fields empty if you don't want to change your password
                        </p>

                        {/* New Password */}
                        <div>
                            <label className={labelClass}>
                                New Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={getInputClass(errors.password)}
                                placeholder="Enter new password (min 8 characters)"
                            />
                            {errors.password && (
                                <p className={getErrorClass()}>{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className={labelClass}>
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                name="password_confirmation"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                className={getInputClass(errors.password_confirmation)}
                                placeholder="Confirm new password"
                            />
                            {errors.password_confirmation && (
                                <p className={getErrorClass()}>{errors.password_confirmation}</p>
                            )}
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className={`px-8 py-5 border-t flex gap-3 ${
                    isDashboardThemeEnabled ? "border-base-300 bg-base-100" : "bg-gray-50 border-gray-200"
                }`}>
                    <button
                        type="button"
                        onClick={onClose}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                            isDashboardThemeEnabled 
                                ? "border border-base-300 text-base-content hover:bg-base-200"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                        }`}
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        className={`flex-1 px-6 py-3 rounded-xl font-semibold transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
                            isDashboardThemeEnabled
                                ? "bg-primary text-primary-content hover:bg-primary/90"
                                : "bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700"
                        }`}
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default EditProfileModal;
