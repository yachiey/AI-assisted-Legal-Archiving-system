import React from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Calendar, Folder } from 'lucide-react';

interface Document {
    doc_id: number;
    title: string;
    created_at: string;
    folder_name: string;
    folder_path: string;
    status: string;
}

interface User {
    firstname: string;
    lastname: string;
}

interface UserDocumentsModalProps {
    isOpen: boolean;
    onClose: () => void;
    documents: Document[];
    user: User | null;
    loading: boolean;
}

const UserDocumentsModal: React.FC<UserDocumentsModalProps> = ({
    isOpen,
    onClose,
    documents,
    user,
    loading
}) => {
    if (!isOpen) return null;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const modalContent = (
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop with blur effect */}
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div className="fixed inset-0 flex items-center justify-center p-4 sm:p-6 pointer-events-none">
                <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200 pointer-events-auto">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">User Uploads</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Documents uploaded by <span className="font-semibold text-gray-700">{user?.firstname} {user?.lastname}</span>
                            </p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 rounded-lg transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mb-3"></div>
                                <p>Loading documents...</p>
                            </div>
                        ) : documents.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                    <FileText className="w-8 h-8 text-gray-300" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-1">No Documents Found</h3>
                                <p className="text-sm">This user hasn't uploaded any documents yet.</p>
                            </div>
                        ) : (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 font-semibold text-gray-700">Document Name</th>
                                            <th className="px-6 py-3 font-semibold text-gray-700">Location</th>
                                            <th className="px-6 py-3 font-semibold text-gray-700">Date Uploaded</th>
                                            <th className="px-6 py-3 font-semibold text-gray-700">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {documents.map((doc) => (
                                            <tr key={doc.doc_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                            <FileText className="w-4 h-4" />
                                                        </div>
                                                        <span className="font-medium text-gray-900 line-clamp-1" title={doc.title}>
                                                            {doc.title}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-gray-600">
                                                        <Folder className="w-4 h-4 text-gray-400" />
                                                        <span className="truncate max-w-[200px]" title={doc.folder_path}>
                                                            {doc.folder_name}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-gray-400" />
                                                        {formatDate(doc.created_at)}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold
                                                        ${doc.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                                        {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-white border-t border-gray-100 text-right">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};

export default UserDocumentsModal;
