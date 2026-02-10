import React, { useState, useEffect } from "react";
import AdminLayout from "../../../../Layouts/AdminLayout";
import { usePage } from '@inertiajs/react';
import axios from "axios";
import AccountHeader from "./components/AccountHeader";
import AccountTable from "./components/AccountTable";
import AddUserModal from "./components/AddUserModal";
import EditUserModal from "./components/EditUserModal";
import DeleteConfirmModal from "./components/DeleteConfirmModal";
import UserDocumentsModal from "./components/UserDocumentsModal";

interface User {
    user_id: number;
    firstname: string;
    lastname: string;
    middle_name?: string;
    email: string;
    role: string;
    status?: 'active' | 'inactive';
    created_at?: string;
    updated_at?: string;
    permissions?: {
        can_delete?: boolean;
        can_upload?: boolean;
        can_view?: boolean;
    };
}

interface AccountProps {
    users?: User[];
    [key: string]: any;
}

const AccountManagement = () => {
    const { props } = usePage<AccountProps>();
    const [users, setUsers] = useState<User[]>(props.users || []);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedRole, setSelectedRole] = useState("all");

    // Modals
    const [isAddUserOpen, setIsAddUserOpen] = useState(false);
    const [isEditUserOpen, setIsEditUserOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

    // Document Modal State
    const [isDocumentsModalOpen, setIsDocumentsModalOpen] = useState(false);
    const [userDocuments, setUserDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);

    // Fetch users on mount
    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await axios.get('/admin/account/users');
            setUsers(response.data.users);
        } catch (error) {
            console.error('Error fetching users:', error);
            showToast('Failed to fetch users', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Filter users based on search and role
    const filteredUsers = users.filter(user => {
        const matchesSearch =
            user.firstname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole = selectedRole === 'all' || user.role === selectedRole;

        return matchesSearch && matchesRole;
    });

    const handleAddUser = async (formData: any) => {
        try {
            const response = await axios.post('/admin/account/users', formData);
            setUsers([...users, response.data.user]);
            setIsAddUserOpen(false);
            showToast('User added successfully', 'success');
        } catch (error: any) {
            console.error('Error adding user:', error);
            showToast(error.response?.data?.message || 'Failed to add user', 'error');
        }
    };

    const handleEditUser = async (formData: any) => {
        if (!selectedUser) return;

        try {
            const response = await axios.put(`/admin/account/users/${selectedUser.user_id}`, formData);
            setUsers(users.map(u => u.user_id === selectedUser.user_id ? response.data.user : u));
            setIsEditUserOpen(false);
            setSelectedUser(null);
            showToast('User updated successfully', 'success');
        } catch (error: any) {
            console.error('Error updating user:', error);
            showToast(error.response?.data?.message || 'Failed to update user', 'error');
        }
    };

    const handleDeleteUser = async () => {
        if (!selectedUser) return;

        try {
            await axios.delete(`/admin/account/users/${selectedUser.user_id}`);
            setUsers(users.filter(u => u.user_id !== selectedUser.user_id));
            setIsDeleteOpen(false);
            setSelectedUser(null);
            showToast('User deleted successfully', 'success');
        } catch (error: any) {
            console.error('Error deleting user:', error);
            showToast(error.response?.data?.message || 'Failed to delete user', 'error');
        }
    };

    const handleDeactivateUser = async (user: User) => {
        try {
            const response = await axios.put(`/admin/account/users/${user.user_id}`, {
                status: (user.status?.toLowerCase() === 'active') ? 'inactive' : 'active'
            });
            setUsers(users.map(u => u.user_id === user.user_id ? response.data.user : u));
            showToast(`User ${response.data.user.status === 'active' ? 'activated' : 'deactivated'} successfully`, 'success');
        } catch (error: any) {
            console.error('Error updating user status:', error);
            showToast(error.response?.data?.message || 'Failed to update user', 'error');
            showToast(error.response?.data?.message || 'Failed to update user', 'error');
        }
    };

    const handleViewUploads = async (user: User) => {
        setSelectedUser(user);
        setIsDocumentsModalOpen(true);
        setDocumentsLoading(true);
        try {
            const response = await axios.get(`/admin/account/users/${user.user_id}/documents`);
            setUserDocuments(response.data.documents);
        } catch (error: any) {
            console.error('Error fetching user documents:', error);
            showToast('Failed to load user documents', 'error');
        } finally {
            setDocumentsLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-6" style={{ background: 'linear-gradient(135deg, #f5f5f5 0%, #ffffff 100%)' }}>
            <AccountHeader
                totalUsers={users.length}
                activeUsers={users.filter(u => u.status?.toLowerCase() === 'active').length}
                onAddUserClick={() => setIsAddUserOpen(true)}
            />

            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg text-white z-50 animate-fade-in ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
                    }`}>
                    {toast.message}
                </div>
            )}

            {/* Search and Filter */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="px-4 py-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white"
                >
                    <option value="all">All Roles</option>
                    <option value="admin">Admin</option>
                    <option value="staff">Staff</option>
                </select>
            </div>

            {/* Users Table */}
            <AccountTable
                users={filteredUsers}
                loading={loading}
                onEdit={(user) => {
                    setSelectedUser(user);
                    setIsEditUserOpen(true);
                }}
                onDelete={(user) => {
                    setSelectedUser(user);
                    setIsDeleteOpen(true);
                }}
                onDeactivate={handleDeactivateUser}
                onViewUploads={handleViewUploads}
            />

            {/* Modals */}
            {isAddUserOpen && (
                <AddUserModal
                    isOpen={isAddUserOpen}
                    onClose={() => setIsAddUserOpen(false)}
                    onSubmit={handleAddUser}
                />
            )}

            {isEditUserOpen && selectedUser && (
                <EditUserModal
                    isOpen={isEditUserOpen}
                    user={selectedUser}
                    onClose={() => {
                        setIsEditUserOpen(false);
                        setSelectedUser(null);
                    }}
                    onSubmit={handleEditUser}
                />
            )}

            {isDeleteOpen && selectedUser && (
                <DeleteConfirmModal
                    isOpen={isDeleteOpen}
                    user={selectedUser}
                    onClose={() => {
                        setIsDeleteOpen(false);
                        setSelectedUser(null);
                    }}
                    onConfirm={handleDeleteUser}
                />
            )}

            {isDocumentsModalOpen && selectedUser && (
                <UserDocumentsModal
                    isOpen={isDocumentsModalOpen}
                    onClose={() => {
                        setIsDocumentsModalOpen(false);
                        setSelectedUser(null);
                    }}
                    documents={userDocuments}
                    user={selectedUser}
                    loading={documentsLoading}
                />
            )}
        </div>
    );
};

AccountManagement.layout = (page: React.ReactNode) => (
    <AdminLayout>{page}</AdminLayout>
);

export default AccountManagement;
