import React, { useState, useEffect } from "react";
import axios from "axios";
import { X, Shield, Check, Loader2, Clock, XCircle, CheckCircle } from "lucide-react";

interface RequestPermissionModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface PermissionRequest {
    id: number;
    permissions: Record<string, boolean>;
    permission_labels: string[];
    reason: string | null;
    status: 'pending' | 'approved' | 'denied';
    admin_response: string | null;
    created_at: string;
    updated_at: string;
}

const RequestPermissionModal: React.FC<RequestPermissionModalProps> = ({ isOpen, onClose }) => {
    const [permissions, setPermissions] = useState({
        can_view: false,
        can_upload: false,
        can_edit: false,
        can_delete: false,
    });
    const [currentPermissions, setCurrentPermissions] = useState({
        can_view: false,
        can_upload: false,
        can_edit: false,
        can_delete: false,
    });
    const [myRequests, setMyRequests] = useState<PermissionRequest[]>([]);
    const [reason, setReason] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            fetchMyRequests();
        }
    }, [isOpen]);

    const fetchMyRequests = async () => {
        try {
            setFetchingData(true);
            const response = await axios.get('/staff/my-permission-requests');
            if (response.data.success) {
                setCurrentPermissions(response.data.current_permissions);
                setMyRequests(response.data.requests);
            }
        } catch (err) {
            console.error("Failed to fetch permission data", err);
        } finally {
            setFetchingData(false);
        }
    };

    const handlePermissionChange = (key: keyof typeof permissions) => {
        // Only allow change if user doesn't already have this permission
        if (!currentPermissions[key]) {
            setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const hasSelectedPermissions = Object.entries(permissions).some(
            ([key, value]) => value && !currentPermissions[key as keyof typeof currentPermissions]
        );

        if (!hasSelectedPermissions) {
            setError("Please select at least one permission you don't already have");
            setLoading(false);
            return;
        }

        // Check for pending request
        const hasPendingRequest = myRequests.some(r => r.status === 'pending');
        if (hasPendingRequest) {
            setError("You already have a pending permission request");
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post('/staff/request-permission', {
                permissions,
                reason: reason.trim() || undefined,
            });

            if (response.data.success) {
                setSuccess(true);
                setTimeout(() => {
                    onClose();
                    setSuccess(false);
                    setPermissions({
                        can_view: false,
                        can_upload: false,
                        can_edit: false,
                        can_delete: false,
                    });
                    setReason("");
                }, 2000);
            }
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to submit request");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const permissionOptions = [
        { key: 'can_view', label: 'View Documents', description: 'Access and read documents' },
        { key: 'can_upload', label: 'Upload Documents', description: 'Add new documents to the system' },
        { key: 'can_edit', label: 'Edit Documents', description: 'Modify document metadata and content' },
        { key: 'can_delete', label: 'Delete Documents', description: 'Remove documents from the system' },
    ];

    const hasPendingRequest = myRequests.some(r => r.status === 'pending');
    const pendingRequest = myRequests.find(r => r.status === 'pending');
    const recentRequest = myRequests[0]; // Most recent request

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <Clock className="w-4 h-4 text-amber-600" />;
            case 'approved':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'denied':
                return <XCircle className="w-4 h-4 text-red-600" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending':
                return 'bg-amber-100 text-amber-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'denied':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 sticky top-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Shield className="w-6 h-6 text-white" />
                            <h2 className="text-xl font-semibold text-white">Request Permissions</h2>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6">
                    {fetchingData ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                        </div>
                    ) : success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Check className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Request Submitted!</h3>
                            <p className="text-gray-500">An administrator will review your request.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit}>
                            {/* Pending Request Warning */}
                            {hasPendingRequest && pendingRequest && (
                                <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-5 h-5 text-amber-600" />
                                        <span className="font-medium text-amber-800">Pending Request</span>
                                    </div>
                                    <p className="text-sm text-amber-700 mb-2">
                                        You have a pending request submitted on {new Date(pendingRequest.created_at).toLocaleDateString()}.
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        {pendingRequest.permission_labels.map((label, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded-full">
                                                {label}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Recent Request Status */}
                            {recentRequest && recentRequest.status !== 'pending' && (
                                <div className={`mb-6 p-4 rounded-lg border ${recentRequest.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        {getStatusIcon(recentRequest.status)}
                                        <span className={`font-medium ${recentRequest.status === 'approved' ? 'text-green-800' : 'text-red-800'}`}>
                                            Last Request: {recentRequest.status === 'approved' ? 'Approved' : 'Denied'}
                                        </span>
                                    </div>
                                    {recentRequest.admin_response && (
                                        <p className={`text-sm ${recentRequest.status === 'approved' ? 'text-green-700' : 'text-red-700'}`}>
                                            {recentRequest.admin_response}
                                        </p>
                                    )}
                                </div>
                            )}

                            <p className="text-gray-600 mb-6">
                                Select the permissions you need access to. Already granted permissions are shown but cannot be requested again.
                            </p>

                            {/* Permission Checkboxes */}
                            <div className="space-y-3 mb-6">
                                {permissionOptions.map(option => {
                                    const hasPermission = currentPermissions[option.key as keyof typeof currentPermissions];
                                    const isSelected = permissions[option.key as keyof typeof permissions];
                                    const isPending = pendingRequest?.permissions?.[option.key];

                                    return (
                                        <label
                                            key={option.key}
                                            className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${hasPermission
                                                    ? 'border-green-300 bg-green-50 cursor-not-allowed opacity-70'
                                                    : isPending
                                                        ? 'border-amber-300 bg-amber-50 cursor-not-allowed'
                                                        : isSelected
                                                            ? 'border-green-500 bg-green-50 cursor-pointer'
                                                            : hasPendingRequest
                                                                ? 'border-gray-200 cursor-not-allowed opacity-50'
                                                                : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={hasPermission || isSelected || !!isPending}
                                                onChange={() => handlePermissionChange(option.key as keyof typeof permissions)}
                                                disabled={hasPermission || hasPendingRequest}
                                                className="w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 mt-0.5 disabled:cursor-not-allowed"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <span className={`font-medium ${hasPermission ? 'text-green-700' : 'text-gray-900'}`}>
                                                        {option.label}
                                                    </span>
                                                    {hasPermission && (
                                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                                            Granted
                                                        </span>
                                                    )}
                                                    {isPending && (
                                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                                                            Pending
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500">{option.description}</p>
                                            </div>
                                        </label>
                                    );
                                })}
                            </div>

                            {/* Reason Textarea */}
                            {!hasPendingRequest && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Reason (optional)
                                    </label>
                                    <textarea
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                        placeholder="Explain why you need these permissions..."
                                        rows={3}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                                    />
                                </div>
                            )}

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                    {error}
                                </div>
                            )}

                            {/* Submit Button */}
                            {!hasPendingRequest && (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-5 h-5" />
                                            Submit Request
                                        </>
                                    )}
                                </button>
                            )}
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RequestPermissionModal;
