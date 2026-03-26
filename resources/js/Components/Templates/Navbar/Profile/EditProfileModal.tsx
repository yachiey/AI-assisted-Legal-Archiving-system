import React, { useState } from "react";
import { X, Save } from "lucide-react";

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

    return (
        <div
            className="fixed inset-0 z-[99999] flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
                style={{ maxHeight: "min(90vh, 960px)" }}
            >
                {/* Header */}
                <div className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 px-8 py-8">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 rounded-full p-2 transition-all duration-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <h2 className="text-3xl font-bold text-white text-center">
                        Edit Profile
                    </h2>
                    <p className="text-white/80 text-center mt-2">
                        Update your personal information
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 py-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-4">
                        {/* First Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                First Name *
                            </label>
                            <input
                                type="text"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border-2 ${
                                    errors.firstname ? "border-red-500" : "border-gray-200"
                                } focus:border-blue-500 focus:outline-none transition-colors`}
                                placeholder="Enter first name"
                            />
                            {errors.firstname && (
                                <p className="text-red-500 text-sm mt-1">{errors.firstname}</p>
                            )}
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
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
                                placeholder="Enter middle name (optional)"
                            />
                        </div>

                        {/* Last Name */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Last Name *
                            </label>
                            <input
                                type="text"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border-2 ${
                                    errors.lastname ? "border-red-500" : "border-gray-200"
                                } focus:border-blue-500 focus:outline-none transition-colors`}
                                placeholder="Enter last name"
                            />
                            {errors.lastname && (
                                <p className="text-red-500 text-sm mt-1">{errors.lastname}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Email Address *
                            </label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border-2 ${
                                    errors.email ? "border-red-500" : "border-gray-200"
                                } focus:border-blue-500 focus:outline-none transition-colors`}
                                placeholder="Enter email address"
                            />
                            {errors.email && (
                                <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="border-t border-gray-200 my-6"></div>
                        <p className="text-sm text-gray-600 italic">
                            Leave password fields empty if you don't want to change your password
                        </p>

                        {/* New Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                New Password
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border-2 ${
                                    errors.password ? "border-red-500" : "border-gray-200"
                                } focus:border-blue-500 focus:outline-none transition-colors`}
                                placeholder="Enter new password (min 8 characters)"
                            />
                            {errors.password && (
                                <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <input
                                type="password"
                                name="password_confirmation"
                                value={formData.password_confirmation}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border-2 ${
                                    errors.password_confirmation ? "border-red-500" : "border-gray-200"
                                } focus:border-blue-500 focus:outline-none transition-colors`}
                                placeholder="Confirm new password"
                            />
                            {errors.password_confirmation && (
                                <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>
                            )}
                        </div>
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
                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-semibold hover:from-blue-700 hover:to-cyan-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                        <Save className="w-4 h-4" />
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditProfileModal;
