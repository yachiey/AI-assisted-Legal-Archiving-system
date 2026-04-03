import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

interface UserPermissions {
    can_edit: boolean;
    can_delete: boolean;
    can_upload: boolean;
    can_view: boolean;
}

interface UserStatus {
    permissions: UserPermissions;
    unread_notifications: number;
}

/**
 * Hook to poll user permission status and detect real-time changes
 * Polls every 5 seconds to check for permission updates from admin
 */
export const usePermissionPolling = (enabled: boolean = true) => {
    const [permissions, setPermissions] = useState<UserPermissions | null>(null);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [hasPermissionChanged, setHasPermissionChanged] = useState(false);
    const permissionsRef = useRef<UserPermissions | null>(null);
    const isCheckingRef = useRef(false);

    const havePermissionsChanged = (
        previousPermissions: UserPermissions | null,
        nextPermissions: UserPermissions
    ) => {
        if (!previousPermissions) {
            return true;
        }

        return Object.keys(nextPermissions).some(
            (key) =>
                nextPermissions[key as keyof UserPermissions] !==
                previousPermissions[key as keyof UserPermissions]
        );
    };

    const showPermissionChangeToast = useCallback(() => {
        const toast = document.createElement('div');
        toast.className =
            'fixed top-4 right-4 z-[10000] bg-blue-600 text-white px-6 py-4 rounded-lg shadow-xl animate-slide-in';
        toast.innerHTML = `
            <div class="flex items-center gap-3">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <div>
                    <div class="font-bold">Permissions Updated</div>
                    <div class="text-sm opacity-90">Your permissions have been changed. Refreshing...</div>
                </div>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }, []);

    const checkPermissions = useCallback(async () => {
        if (isCheckingRef.current) {
            return;
        }

        try {
            const token = localStorage.getItem('auth_token');
            if (!token) return;
            isCheckingRef.current = true;

            const response = await axios.get<UserStatus>('/api/user/status', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            const newPermissions = response.data.permissions;
            const newUnreadCount = response.data.unread_notifications;
            const previousPermissions = permissionsRef.current;
            const permissionsChanged = havePermissionsChanged(
                previousPermissions,
                newPermissions
            );

            if (previousPermissions && permissionsChanged) {
                setHasPermissionChanged(true);
                showPermissionChangeToast();
            }

            permissionsRef.current = newPermissions;
            if (!previousPermissions || permissionsChanged) {
                setPermissions(newPermissions);
            }
            setUnreadCount(newUnreadCount);
        } catch (error) {
            console.error('Failed to check permission status:', error);
        } finally {
            isCheckingRef.current = false;
        }
    }, [showPermissionChangeToast]);

    const resetChangeFlag = useCallback(() => {
        setHasPermissionChanged(false);
    }, []);

    useEffect(() => {
        if (!enabled) return;

        // Initial check
        checkPermissions();

        // Poll every 5 seconds
        const interval = setInterval(checkPermissions, 5000);

        return () => clearInterval(interval);
    }, [enabled, checkPermissions]);

    return {
        permissions,
        unreadCount,
        hasPermissionChanged,
        resetChangeFlag,
        refresh: checkPermissions
    };
};
