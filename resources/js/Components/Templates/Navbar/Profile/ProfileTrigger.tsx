// Components/ProfileDropdown/ProfileTrigger.tsx
import React from "react";
import { ProfileTriggerProps } from "../../../../Types/profile_types";

const ProfileTrigger: React.FC<ProfileTriggerProps> = ({
    userData,
    isOpen,
    onClick,
}) => {
    // Use profile_picture if available, otherwise fall back to avatar or default
    const profileImageUrl = userData.profile_picture
        ? `/storage/${userData.profile_picture}`
        : (userData.avatar || `https://i.pravatar.cc/40?u=${userData.email}`);

    // Get initial for fallback display (just first letter)
    const getInitial = () => {
        return userData.name.charAt(0).toUpperCase();
    };

    return (
        <div
            className="flex items-center cursor-pointer rounded-xl p-2 transition-all duration-200"
            style={{
                background: 'rgba(255, 255, 255, 0.4)',
                backdropFilter: 'blur(15px)',
                WebkitBackdropFilter: 'blur(15px)',
                border: '1px solid rgba(255, 255, 255, 0.5)',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)'
            }}
            onClick={onClick}
        >
            {/* Profile Icon */}
            {userData.profile_picture ? (
                <img
                    src={profileImageUrl}
                    alt={`${userData.name}'s Profile`}
                    className="w-9 h-9 rounded-full object-cover border-2 border-white/50"
                    onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://i.pravatar.cc/40?u=${userData.email}`;
                    }}
                />
            ) : (
                <div className="w-9 h-9 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white text-base font-bold border-2 border-white/50">
                    {getInitial()}
                </div>
            )}

            <div className="hidden md:flex flex-col ml-2 text-gray-800">
                <span className="font-semibold text-sm">{userData.name}</span>
                <span className="text-xs text-gray-500">{userData.email}</span>
            </div>

            {/* Dropdown Arrow */}
            <svg
                className={`ml-2 h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""
                    }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                />
            </svg>
        </div>
    );
};

export default ProfileTrigger;
