// Components/ProfileDropdown/index.tsx
import React, { useState, useEffect } from "react";
import { router } from "@inertiajs/react";
import ProfileTrigger from "./ProfileTrigger";
import ProfileMenu from "./ProfileMenu";
import ViewProfileModal from "./ViewProfileModal";
import EditProfileModal from "./EditProfileModal";
import DeleteAccountModal from "./DeleteAccountModal";
import TwoFactorModal from "./TwoFactorModal";
import Toast, { ToastType } from "../../../Common/Toast";
import { UserData } from "../../../../Types/profile_types";

const ProfileDropdown: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isTwoFactorModalOpen, setIsTwoFactorModalOpen] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);

    // Toast notification state
    const [toast, setToast] = useState<{
        isVisible: boolean;
        type: ToastType;
        message: string;
        title?: string;
    }>({
        isVisible: false,
        type: "success",
        message: "",
    });

    const showToast = (type: ToastType, message: string, title?: string) => {
        setToast({
            isVisible: true,
            type,
            message,
            title,
        });
    };

    const hideToast = () => {
        setToast(prev => ({ ...prev, isVisible: false }));
    };

    // Load real user data from sessionStorage or API on component mount
    useEffect(() => {
        const loadUserData = async () => {
            try {
                // First try to get user data from sessionStorage
                const storedUser = sessionStorage.getItem("currentUser");

                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);

                    // Transform the user data to match UserData interface
                    const transformedUser: UserData = {
                        id: parsedUser.user_id || parsedUser.id,
                        name: `${parsedUser.firstname} ${parsedUser.lastname}`,
                        email: parsedUser.email,
                        role: parsedUser.role || "Admin",
                        avatar: parsedUser.avatar || null,
                        profile_picture: parsedUser.profile_picture || null,
                    };

                    setUserData(transformedUser);
                } else {
                    // If not in sessionStorage, fetch from API
                    const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');

                    const response = await fetch('/api/user', {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            ...(token && { 'Authorization': `Bearer ${token}` }),
                        },
                    });

                    if (response.ok) {
                        const apiUser = await response.json();

                        // Transform API response to UserData
                        const transformedUser: UserData = {
                            id: apiUser.user_id || apiUser.id,
                            name: `${apiUser.firstname} ${apiUser.lastname}`,
                            email: apiUser.email,
                            role: apiUser.role || "Admin",
                            avatar: apiUser.avatar || null,
                            profile_picture: apiUser.profile_picture || null,
                        };

                        setUserData(transformedUser);

                        // Store in sessionStorage for future use
                        sessionStorage.setItem("currentUser", JSON.stringify(apiUser));
                    }
                }
            } catch (error) {
                console.error("Error loading user data:", error);
            }
        };

        loadUserData();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest(".profile-dropdown")) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleViewProfile = async () => {
        try {
            setIsOpen(false);

            // Fetch user profile data from the backend
            const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');

            const response = await fetch('/api/user/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
            });

            const data = await response.json();

            if (data.success && data.user) {
                setProfileData(data.user);
                setIsProfileModalOpen(true);
            } else {
                console.error('Failed to fetch user profile:', data.message);
            }
        } catch (error) {
            console.error("Error fetching profile:", error);
        }
    };

    const handleSettings = () => {
        try {
            setIsOpen(false);

            // Navigate to appropriate settings page based on user role
            if (userData?.role === "Admin") {
                console.log("Navigating to admin settings...");
                // router.visit("/admin/settings");
            } else {
                console.log("Navigating to tenant settings...");
                // router.visit("/tenant/settings");
            }
        } catch (error) {
            console.error("Error navigating to settings:", error);
        }
    };

    const handleSecurity = () => {
        setIsOpen(false);
        setIsTwoFactorModalOpen(true);
    };

    const handleLogout = () => {
        try {
            console.log("User logged out successfully");
            setIsOpen(false);

            // For now, just log the logout action
            console.log("Logout clicked - would redirect to home");
            // router.visit("/");
        } catch (error) {
            console.error("Error during logout:", error);
        }
    };

    const handleEdit = () => {
        // Keep profile modal state, just open edit modal on top
        setIsEditModalOpen(true);
    };

    const handleDelete = () => {
        // Keep profile modal state, just open delete modal on top
        setIsDeleteModalOpen(true);
    };

    const handleUploadPicture = async (file: File) => {
        try {
            const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const formData = new FormData();
            formData.append('profile_picture', file);

            const response = await fetch('/profile/upload-picture', {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                // Update session storage with new profile picture
                const storedUser = sessionStorage.getItem("currentUser");
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    // Extract just the path from the full URL if needed
                    const profilePicturePath = data.user?.profile_picture ||
                        (data.profile_picture_url ? data.profile_picture_url.replace('/storage/', '') : null);

                    parsedUser.profile_picture = profilePicturePath;
                    sessionStorage.setItem("currentUser", JSON.stringify(parsedUser));

                    // Update userData state to refresh navbar immediately
                    const transformedUser: UserData = {
                        id: parsedUser.user_id || parsedUser.id,
                        name: `${parsedUser.firstname} ${parsedUser.lastname}`,
                        email: parsedUser.email,
                        role: parsedUser.role || "Admin",
                        avatar: parsedUser.avatar || null,
                        profile_picture: profilePicturePath,
                    };
                    setUserData(transformedUser);
                }

                // Reload profile modal data
                await handleViewProfile();
                showToast('success', 'Your profile picture has been updated successfully!', 'Picture Uploaded');
            } else {
                showToast('error', data.message || 'Failed to upload profile picture', 'Upload Failed');
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            showToast('error', 'An error occurred while uploading the profile picture', 'Upload Error');
        }
    };

    const handleSaveProfile = async (updatedData: any) => {
        try {
            const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch('/profile/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify(updatedData)
            });

            const data = await response.json();

            if (data.success) {
                // Update session storage with new user data
                const storedUser = sessionStorage.getItem("currentUser");
                if (storedUser) {
                    const parsedUser = JSON.parse(storedUser);
                    const updatedUser = { ...parsedUser, ...data.user };
                    sessionStorage.setItem("currentUser", JSON.stringify(updatedUser));

                    // Update userData state to refresh navbar immediately
                    const transformedUser: UserData = {
                        id: updatedUser.user_id || updatedUser.id,
                        name: `${updatedUser.firstname} ${updatedUser.lastname}`,
                        email: updatedUser.email,
                        role: updatedUser.role || "Admin",
                        avatar: updatedUser.avatar || null,
                        profile_picture: updatedUser.profile_picture || null,
                    };
                    setUserData(transformedUser);

                    // Update profile modal data
                    setProfileData(data.user);
                }

                // Close edit modal and reopen view profile modal
                setIsEditModalOpen(false);
                setIsProfileModalOpen(true);
                showToast('success', 'Your profile information has been updated successfully!', 'Profile Updated');
            } else {
                showToast('error', data.message || 'Failed to update profile', 'Update Failed');
            }
        } catch (error) {
            console.error('Error updating profile:', error);
            showToast('error', 'An error occurred while updating the profile', 'Update Error');
        }
    };

    const handleConfirmDelete = async (password: string) => {
        try {
            const token = sessionStorage.getItem('auth_token') || localStorage.getItem('auth_token');
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

            const response = await fetch('/profile/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    ...(token && { 'Authorization': `Bearer ${token}` }),
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (data.success) {
                // Clear all stored data
                sessionStorage.clear();
                localStorage.clear();

                showToast('success', 'Your account has been permanently deleted', 'Account Deleted');
                setTimeout(() => {
                    router.visit('/');
                }, 2000);
            } else {
                showToast('error', data.message || 'Failed to delete account', 'Deletion Failed');
            }
        } catch (error) {
            console.error('Error deleting account:', error);
            showToast('error', 'An error occurred while deleting the account', 'Deletion Error');
        }
    };

    // Don't render if no user data
    if (!userData) {
        return null;
    }

    return (
        <>
            <div className="relative profile-dropdown z-[9999]">
                <ProfileTrigger
                    userData={userData}
                    isOpen={isOpen}
                    onClick={() => setIsOpen(!isOpen)}
                />

                {isOpen && (
                    <ProfileMenu
                        userData={userData}
                        onViewProfile={handleViewProfile}
                        onSettings={handleSettings}
                        onSecurity={handleSecurity}
                        onLogout={handleLogout}
                    />
                )}
            </div>

            {/* View Profile Modal */}
            <ViewProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                userData={profileData}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onUploadPicture={handleUploadPicture}
            />

            {/* Edit Profile Modal */}
            <EditProfileModal
                isOpen={isEditModalOpen}
                onClose={() => {
                    setIsEditModalOpen(false);
                    setIsProfileModalOpen(true);
                }}
                userData={profileData}
                onSave={handleSaveProfile}
            />

            {/* Delete Account Modal */}
            <DeleteAccountModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setIsProfileModalOpen(true);
                }}
                onConfirm={handleConfirmDelete}
            />

            {/* Two-Factor Authentication Modal */}
            <TwoFactorModal
                isOpen={isTwoFactorModalOpen}
                onClose={() => setIsTwoFactorModalOpen(false)}
                onResult={(type, message, title) => showToast(type, message, title)}
            />

            {/* Toast Notification */}
            <Toast
                type={toast.type}
                message={toast.message}
                title={toast.title}
                isVisible={toast.isVisible}
                onClose={hideToast}
                duration={4000}
            />
        </>
    );
};

export default ProfileDropdown;
