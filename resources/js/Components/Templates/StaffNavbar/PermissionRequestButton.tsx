import React, { useState, useEffect } from "react";
import { Shield } from "lucide-react";
import axios from "axios";
import RequestPermissionModal from "../../Modal/RequestPermissionModal";

interface PermissionButtonProps {
    className?: string;
}

const PermissionRequestButton: React.FC<PermissionButtonProps> = ({ className = "" }) => {
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
                className={`relative p-2 rounded-xl transition-all ${className}`}
                style={{
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
                    className={hasPendingRequest ? "text-amber-600" : missingPermissions > 0 ? "text-green-700 hover:text-green-600" : "text-green-700"}
                />
                {/* Show indicator for pending request or missing permissions */}
                {hasPendingRequest ? (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse"></span>
                ) : missingPermissions > 0 ? (
                    <span className="absolute top-1 right-1 bg-amber-500 text-white text-[9px] w-3.5 h-3.5 flex items-center justify-center rounded-full font-bold">
                        {missingPermissions}
                    </span>
                ) : null}
            </button>

            <RequestPermissionModal
                isOpen={showModal}
                onClose={handleClose}
            />
        </>
    );
};

export default PermissionRequestButton;
