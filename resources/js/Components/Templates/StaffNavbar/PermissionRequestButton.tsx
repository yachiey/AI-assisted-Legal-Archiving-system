import React, { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import RequestPermissionModal from "../../Modal/RequestPermissionModal";
import {
    DEFAULT_DASHBOARD_THEME,
    isThemedStaffComponent,
    useDashboardTheme,
} from "../../../hooks/useDashboardTheme";

interface PermissionButtonProps {
    className?: string;
}

const PermissionRequestButton: React.FC<PermissionButtonProps> = ({ className = "" }) => {
    const { component } = usePage();
    const { theme } = useDashboardTheme("staff");
    const isDashboardThemeEnabled =
        isThemedStaffComponent(component) &&
        theme !== DEFAULT_DASHBOARD_THEME;
    const [showModal, setShowModal] = useState(false);
    const [hasPendingRequest, setHasPendingRequest] = useState(false);
    const [missingPermissions, setMissingPermissions] = useState(0);

    useEffect(() => {
        checkPermissionStatus();
    }, []);

    const checkPermissionStatus = async () => {
        try {
            const response = await axios.get('/staff/my-permission-requests');
            if (response.data.success) {
                const permissions = response.data.current_permissions;
                const requests = response.data.requests;

                // Count missing permissions
                const missing = Object.values(permissions).filter(v => !v).length;
                setMissingPermissions(missing);

                // Check for pending request
                setHasPendingRequest(requests.some((r: any) => r.status === 'pending'));
            }
        } catch (error) {
            console.error("Failed to check permission status", error);
        }
    };

    const handleClose = () => {
        setShowModal(false);
        // Refresh status after modal closes
        setTimeout(checkPermissionStatus, 500);
    };

    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className={`relative p-2 rounded-xl transition-all ${className} ${isDashboardThemeEnabled ? "bg-base-100/40 border border-base-content/10 shadow-sm hover:bg-base-100/60" : ""}`}
                style={isDashboardThemeEnabled ? undefined : {
                    background: 'rgba(255, 255, 255, 0.4)',
                    backdropFilter: 'blur(15px)',
                    WebkitBackdropFilter: 'blur(15px)',
                    borderColor: 'rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.5)'
                }}
                title={hasPendingRequest ? "Pending permission request" : "Request permissions"}
            >
                <Shield
                    size={22}
                    className={hasPendingRequest
                        ? isDashboardThemeEnabled ? "text-warning" : "text-amber-600"
                        : missingPermissions > 0
                            ? isDashboardThemeEnabled ? "text-primary hover:text-primary/80" : "text-green-700 hover:text-green-600"
                            : isDashboardThemeEnabled ? "text-primary" : "text-green-700"
                    }
                />
                {/* Show indicator for pending request or missing permissions */}
                {hasPendingRequest ? (
                    <span className={`absolute top-1 right-1 w-2 h-2 rounded-full animate-pulse ${isDashboardThemeEnabled ? "bg-warning" : "bg-amber-500"}`}></span>
                ) : missingPermissions > 0 ? (
                    <span className={`absolute top-1 right-1 text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold ${isDashboardThemeEnabled ? "bg-warning text-warning-content" : "bg-amber-500 text-white"}`}>
                        {missingPermissions}
                    </span>
                ) : null}
            </button>

            <RequestPermissionModal
                isOpen={showModal}
                onClose={handleClose}
                isDashboardThemeEnabled={isDashboardThemeEnabled}
                theme={theme}
            />
        </>
    );
};

export default PermissionRequestButton;
