// Components/ProfileDropdown/UserInfoHeader.tsx
import React from "react";
import { UserData } from "../../../../Types/profile_types";

interface UserInfoHeaderProps {
    userData: UserData;
}

const UserInfoHeader: React.FC<UserInfoHeaderProps> = ({ userData }) => {
    // Use profile_picture if available, otherwise fall back to avatar or default
    const profileImageUrl = userData.profile_picture
        ? `/storage/${userData.profile_picture}`
        : (userData.avatar || `https://i.pravatar.cc/48?u=${userData.email}`);

    // Get initial for fallback display (just first letter)
    const getInitial = () => {
        return userData.name.charAt(0).toUpperCase();
    };

    return (
        <div className="px-4 py-3 border-b border-gray-100 mb-2">
            <div className="flex items-center">
                {userData.profile_picture ? (
                    <img
                        src={profileImageUrl}
                        alt={`${userData.name}'s Profile`}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                        onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = `https://i.pravatar.cc/48?u=${userData.email}`;
                        }}
                    />
                ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-600 to-emerald-600 flex items-center justify-center text-white text-xl font-bold border-2 border-gray-200">
                        {getInitial()}
                    </div>
                )}
                <div className="ml-3 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                        {userData.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                        {userData.email}
                    </p>
                    <p className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block mt-1">
                        {userData.role}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default UserInfoHeader;
