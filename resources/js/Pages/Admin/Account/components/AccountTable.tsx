import React from "react";
import {
    Edit2,
    Trash2,
    ToggleRight,
    ToggleLeft,
    AlertCircle,
    FileText,
} from "lucide-react";
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from "../../../../hooks/useDashboardTheme";

interface User {
    user_id: number;
    firstname: string;
    lastname: string;
    middle_name?: string;
    email: string;
    role: string;
    status?: "active" | "inactive";
    created_at?: string;
    permissions?: {
        can_delete?: boolean;
        can_upload?: boolean;
        can_view?: boolean;
    };
}

interface AccountTableProps {
    users: User[];
    loading: boolean;
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
    onDeactivate: (user: User) => void;
    onViewUploads: (user: User) => void;
}

const AccountTable: React.FC<AccountTableProps> = ({
    users,
    loading,
    onEdit,
    onDelete,
    onDeactivate,
    onViewUploads,
}) => {
    const { theme } = useDashboardTheme();
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;

    const getStatusBadgeColor = (status?: string) => {
        if (isDashboardThemeEnabled) {
            switch (status) {
                case "active":
                    return "bg-success/15 text-success";
                case "inactive":
                    return "bg-warning/15 text-warning";
                default:
                    return "bg-base-200 text-base-content/70";
            }
        }

        switch (status) {
            case "active":
                return "bg-green-100 text-green-800";
            case "inactive":
                return "bg-yellow-100 text-yellow-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getRoleBadgeColor = (role: string) => {
        if (isDashboardThemeEnabled) {
            switch (role) {
                case "admin":
                    return "bg-secondary/15 text-secondary";
                case "staff":
                    return "bg-info/15 text-info";
                default:
                    return "bg-base-200 text-base-content/70";
            }
        }

        switch (role) {
            case "admin":
                return "bg-purple-100 text-purple-800";
            case "staff":
                return "bg-blue-100 text-blue-800";
            default:
                return "bg-gray-100 text-gray-800";
        }
    };

    const getPermissionsDisplay = (user: User) => {
        const perms = user.permissions || {};
        const permsArray = [];
        if (perms.can_upload) permsArray.push("Upload");
        if (perms.can_view) permsArray.push("View");
        if (perms.can_delete) permsArray.push("Delete");
        return permsArray.length > 0 ? permsArray.join(", ") : "View Only";
    };

    if (loading) {
        return (
            <div
                data-theme={isDashboardThemeEnabled ? theme : undefined}
                className={`rounded-2xl border p-8 ${
                    isDashboardThemeEnabled
                        ? "border-base-300 bg-base-100 text-base-content shadow-xl shadow-base-content/5"
                        : "border-gray-200 bg-white shadow-md"
                }`}
            >
                <div
                    className={`text-center ${
                        isDashboardThemeEnabled
                            ? "text-base-content/65"
                            : "text-gray-500"
                    }`}
                >
                    <div
                        className={`mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 ${
                            isDashboardThemeEnabled
                                ? "border-primary"
                                : "border-green-600"
                        }`}
                    ></div>
                    Loading users...
                </div>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div
                data-theme={isDashboardThemeEnabled ? theme : undefined}
                className={`rounded-2xl border p-12 ${
                    isDashboardThemeEnabled
                        ? "border-base-300 bg-base-100 shadow-xl shadow-base-content/5"
                        : "border-gray-200 bg-white shadow-md"
                }`}
            >
                <div className="text-center">
                    <AlertCircle
                        className={`mx-auto mb-4 h-12 w-12 ${
                            isDashboardThemeEnabled
                                ? "text-base-content/35"
                                : "text-gray-400"
                        }`}
                    />
                    <h3
                        className={`mb-2 text-lg font-semibold ${
                            isDashboardThemeEnabled
                                ? "text-base-content"
                                : "text-gray-900"
                        }`}
                    >
                        No Users Found
                    </h3>
                    <p
                        className={
                            isDashboardThemeEnabled
                                ? "text-base-content/65"
                                : "text-gray-600"
                        }
                    >
                        Try adjusting your search or filters
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div
            data-theme={isDashboardThemeEnabled ? theme : undefined}
            className={`overflow-hidden rounded-2xl border ${
                isDashboardThemeEnabled
                    ? "border-base-300 bg-base-100 shadow-2xl shadow-base-content/5"
                    : "border-gray-200 bg-white shadow-md"
            }`}
        >
            <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead
                        className={`border-b ${
                            isDashboardThemeEnabled
                                ? "border-base-300 bg-base-200/80"
                                : "border-gray-200 bg-gray-50"
                        }`}
                    >
                        <tr>
                            {["Name", "Email", "Role", "Permissions", "Status"].map(
                                (heading) => (
                                    <th
                                        key={heading}
                                        className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider ${
                                            isDashboardThemeEnabled
                                                ? "text-base-content/65"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {heading}
                                    </th>
                                )
                            )}
                            <th
                                className={`px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider ${
                                    isDashboardThemeEnabled
                                        ? "text-base-content/65"
                                        : "text-gray-700"
                                }`}
                            >
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody
                        className={`divide-y ${
                            isDashboardThemeEnabled
                                ? "divide-base-300/70"
                                : "divide-gray-200"
                        }`}
                    >
                        {users.map((user) => (
                            <tr
                                key={user.user_id}
                                className={`transition-colors duration-200 ${
                                    isDashboardThemeEnabled
                                        ? "hover:bg-base-200/60"
                                        : "hover:bg-gray-50"
                                }`}
                            >
                                <td className="px-6 py-4">
                                    <div>
                                        <p
                                            className={`font-semibold ${
                                                isDashboardThemeEnabled
                                                    ? "text-base-content"
                                                    : "text-gray-900"
                                            }`}
                                        >
                                            {user.firstname} {user.lastname}
                                        </p>
                                        {user.middle_name && (
                                            <p
                                                className={`text-xs ${
                                                    isDashboardThemeEnabled
                                                        ? "text-base-content/50"
                                                        : "text-gray-500"
                                                }`}
                                            >
                                                {user.middle_name}
                                            </p>
                                        )}
                                    </div>
                                </td>

                                <td className="px-6 py-4">
                                    <p
                                        className={`break-all ${
                                            isDashboardThemeEnabled
                                                ? "text-base-content/75"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {user.email}
                                    </p>
                                </td>

                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getRoleBadgeColor(
                                            user.role
                                        )}`}
                                    >
                                        {user.role.charAt(0).toUpperCase() +
                                            user.role.slice(1)}
                                    </span>
                                </td>

                                <td className="px-6 py-4">
                                    <p
                                        className={`text-sm ${
                                            isDashboardThemeEnabled
                                                ? "text-base-content/75"
                                                : "text-gray-700"
                                        }`}
                                    >
                                        {getPermissionsDisplay(user)}
                                    </p>
                                </td>

                                <td className="px-6 py-4">
                                    <span
                                        className={`inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeColor(
                                            user.status
                                        )}`}
                                    >
                                        {user.status
                                            ? user.status.charAt(0).toUpperCase() +
                                              user.status.slice(1)
                                            : "Active"}
                                    </span>
                                </td>

                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-center gap-3">
                                        <button
                                            onClick={() => onViewUploads(user)}
                                            className={`rounded-lg p-2 transition-colors duration-200 ${
                                                isDashboardThemeEnabled
                                                    ? "text-info hover:bg-info/10"
                                                    : "text-blue-600 hover:bg-blue-100"
                                            }`}
                                            title="View Uploads"
                                        >
                                            <FileText className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={() => onEdit(user)}
                                            className={`rounded-lg p-2 transition-colors duration-200 ${
                                                isDashboardThemeEnabled
                                                    ? "text-primary hover:bg-primary/10"
                                                    : "text-blue-600 hover:bg-blue-100"
                                            }`}
                                            title="Edit user"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={() => onDeactivate(user)}
                                            className={`rounded-lg p-2 transition-colors duration-200 ${
                                                user.status === "active"
                                                    ? isDashboardThemeEnabled
                                                        ? "text-success hover:bg-success/10"
                                                        : "text-green-600 hover:bg-green-100"
                                                    : isDashboardThemeEnabled
                                                      ? "text-warning hover:bg-warning/10"
                                                      : "text-yellow-600 hover:bg-yellow-100"
                                            }`}
                                            title={
                                                user.status === "active"
                                                    ? "Deactivate user"
                                                    : "Activate user"
                                            }
                                        >
                                            {user.status === "active" ? (
                                                <ToggleRight className="h-4 w-4" />
                                            ) : (
                                                <ToggleLeft className="h-4 w-4" />
                                            )}
                                        </button>

                                        <button
                                            onClick={() => onDelete(user)}
                                            className={`rounded-lg p-2 transition-colors duration-200 ${
                                                isDashboardThemeEnabled
                                                    ? "text-error hover:bg-error/10"
                                                    : "text-red-600 hover:bg-red-100"
                                            }`}
                                            title="Delete user"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div
                className={`border-t px-6 py-4 ${
                    isDashboardThemeEnabled
                        ? "border-base-300 bg-base-200/80"
                        : "border-gray-200 bg-gray-50"
                }`}
            >
                <p
                    className={`text-sm ${
                        isDashboardThemeEnabled
                            ? "text-base-content/65"
                            : "text-gray-600"
                    }`}
                >
                    Showing {users.length} user{users.length !== 1 ? "s" : ""}
                </p>
            </div>
        </div>
    );
};

export default AccountTable;
