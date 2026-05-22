// Components/ProfileDropdown/types.ts
export interface UserData {
    id: number;
    name: string;
    email: string;
    role: string;
    phone?: string;
    purok?: string;
    gender?: string;
    address?: string;
    profile_image?: string;
    profile_picture?: string;
    loginTime?: string;
    [key: string]: any;
}

export interface ProfileTriggerProps {
    userData: UserData;
    isOpen: boolean;
    onClick: () => void;
}

export interface ProfileMenuProps {
    userData: UserData;
    onViewProfile: () => void;
    onSettings: () => void;
    onSecurity: () => void;
    onLogout: () => void;
}

export interface UserInfoHeaderProps {
    userData: UserData;
    profileImageUrl: string;
}

export interface MenuItemProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    variant?: "default" | "danger";
}
