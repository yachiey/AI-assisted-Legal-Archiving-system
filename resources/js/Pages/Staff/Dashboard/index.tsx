import React from "react";
import { usePage, router } from '@inertiajs/react';
import StaffLayout from "../../../../Layouts/StaffLayout";
import StaffHeader from "../../../Components/Templates/StaffHeader";
import RecentFiles from "./components/RecentFiles";
import { FileText, Upload, Shield, Search, MessageSquare, TrendingUp } from 'lucide-react';
import { usePermissionPolling } from '../../../hooks/usePermissionPolling';
import {
    DEFAULT_DASHBOARD_THEME,
    useDashboardTheme,
} from '../../../hooks/useDashboardTheme';

interface DashboardProps {
    recentFiles: any[];
    myDocumentsCount?: number;
    myUploadsCount?: number;
    userPermissions?: {
        can_upload?: boolean;
        can_view?: boolean;
        can_delete?: boolean;
        can_edit?: boolean;
    };
    [key: string]: any;
}

export default function StaffDashboard() {
    const { props } = usePage<DashboardProps>();
    const { theme } = useDashboardTheme('staff');
    const isDashboardThemeEnabled = theme !== DEFAULT_DASHBOARD_THEME;
    const recentFiles = props.recentFiles || [];
    const myDocumentsCount = props.myDocumentsCount || 0;
    const myUploadsCount = props.myUploadsCount || recentFiles.length;

    // Use real-time permission polling
    const { permissions: livePermissions } = usePermissionPolling(true);

    // Use live permissions if available, otherwise fall back to props
    const userPermissions = livePermissions || props.userPermissions || {
        can_upload: false,
        can_view: true,
        can_delete: false,
        can_edit: false,
    };

    const handleNavigate = (route: string) => {
        router.visit(route);
    };

    const permissionItems = [
        { label: 'Add Documents', enabled: userPermissions.can_upload },
        { label: 'View Documents', enabled: userPermissions.can_view },
        { label: 'Edit Documents', enabled: userPermissions.can_edit },
        { label: 'Delete Documents', enabled: userPermissions.can_delete },
    ];

    return (
        <div
            className={`relative min-h-full overflow-hidden ${
                isDashboardThemeEnabled
                    ? 'text-base-content'
                    : 'bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/50'
            }`}
        >

            <StaffHeader />

            <div className="relative z-10 space-y-8 px-6 py-6">
                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {/* My Documents Card */}
                    <div
                        className={`group relative overflow-hidden rounded-3xl shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                            isDashboardThemeEnabled
                                ? 'border border-base-300/70 bg-gradient-to-br from-base-100 via-base-100 to-primary/10'
                                : ''
                        }`}
                        style={
                            isDashboardThemeEnabled
                                ? undefined
                                : { background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }
                        }
                    >
                        {/* Animated gradient overlay */}
                        <div
                            className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                                isDashboardThemeEnabled
                                    ? 'bg-gradient-to-br from-primary/10 via-transparent to-transparent'
                                    : 'bg-gradient-to-br from-white/20 via-transparent to-transparent'
                            }`}
                        ></div>
                        {/* Decorative circles */}
                        <div
                            className={`absolute -top-8 -right-8 h-32 w-32 rounded-full transition-transform duration-700 group-hover:scale-150 ${
                                isDashboardThemeEnabled ? 'bg-primary/10' : 'bg-white/10'
                            }`}
                        ></div>
                        <div
                            className={`absolute -bottom-4 -left-4 h-24 w-24 rounded-full transition-transform duration-700 group-hover:scale-125 ${
                                isDashboardThemeEnabled ? 'bg-base-content/5' : 'bg-black/5'
                            }`}
                        ></div>

                        <div className="relative p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div
                                    className={`rounded-2xl p-3.5 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                                        isDashboardThemeEnabled
                                            ? 'bg-gradient-to-br from-primary/20 to-secondary/10'
                                            : 'bg-gradient-to-br from-white/30 to-white/10'
                                    }`}
                                >
                                    <FileText
                                        className={`h-6 w-6 ${
                                            isDashboardThemeEnabled ? 'text-primary' : 'text-gray-900'
                                        }`}
                                        strokeWidth={2.5}
                                    />
                                </div>
                                <div className="flex flex-col items-end">
                                    <TrendingUp
                                        className={`h-4 w-4 ${
                                            isDashboardThemeEnabled ? 'text-primary/70' : 'text-gray-700 opacity-50'
                                        }`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p
                                    className={`text-[0.7rem] font-bold uppercase tracking-[0.1em] leading-tight ${
                                        isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-700'
                                    }`}
                                    style={{ letterSpacing: '0.1em' }}
                                >
                                    My Documents
                                </p>
                                <p
                                    className={`text-5xl font-black tracking-tight leading-none ${
                                        isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'
                                    }`}
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                    {myDocumentsCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Uploads Card */}
                    <div
                        className={`group relative overflow-hidden rounded-3xl shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                            isDashboardThemeEnabled
                                ? 'border border-base-300/70 bg-gradient-to-br from-base-100 via-base-100 to-secondary/10'
                                : ''
                        }`}
                        style={
                            isDashboardThemeEnabled
                                ? undefined
                                : { background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }
                        }
                    >
                        <div
                            className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                                isDashboardThemeEnabled
                                    ? 'bg-gradient-to-br from-secondary/12 via-transparent to-transparent'
                                    : 'bg-gradient-to-br from-white/20 via-transparent to-transparent'
                            }`}
                        ></div>
                        <div
                            className={`absolute -top-8 -right-8 h-32 w-32 rounded-full transition-transform duration-700 group-hover:scale-150 ${
                                isDashboardThemeEnabled ? 'bg-secondary/10' : 'bg-white/10'
                            }`}
                        ></div>
                        <div
                            className={`absolute -bottom-4 -left-4 h-24 w-24 rounded-full transition-transform duration-700 group-hover:scale-125 ${
                                isDashboardThemeEnabled ? 'bg-base-content/5' : 'bg-black/5'
                            }`}
                        ></div>

                        <div className="relative p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div
                                    className={`rounded-2xl p-3.5 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                                        isDashboardThemeEnabled
                                            ? 'bg-gradient-to-br from-secondary/20 to-accent/10'
                                            : 'bg-gradient-to-br from-white/30 to-white/10'
                                    }`}
                                >
                                    <Upload
                                        className={`h-6 w-6 ${
                                            isDashboardThemeEnabled ? 'text-secondary' : 'text-gray-900'
                                        }`}
                                        strokeWidth={2.5}
                                    />
                                </div>
                                <div className="flex flex-col items-end">
                                    <TrendingUp
                                        className={`h-4 w-4 ${
                                            isDashboardThemeEnabled ? 'text-secondary/70' : 'text-gray-700 opacity-50'
                                        }`}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p
                                    className={`text-[0.7rem] font-bold uppercase tracking-[0.1em] leading-tight ${
                                        isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-700'
                                    }`}
                                    style={{ letterSpacing: '0.1em' }}
                                >
                                    Recent Uploads
                                </p>
                                <p
                                    className={`text-5xl font-black tracking-tight leading-none ${
                                        isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'
                                    }`}
                                    style={{ fontFamily: "'Inter', sans-serif" }}
                                >
                                    {myUploadsCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* My Permissions Card */}
                    <div
                        className={`group relative overflow-hidden rounded-3xl shadow-md transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${
                            isDashboardThemeEnabled
                                ? 'border border-base-300/70 bg-gradient-to-br from-base-100 via-base-100 to-accent/10'
                                : ''
                        }`}
                        style={
                            isDashboardThemeEnabled
                                ? undefined
                                : { background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }
                        }
                    >
                        <div
                            className={`absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100 ${
                                isDashboardThemeEnabled
                                    ? 'bg-gradient-to-br from-accent/12 via-transparent to-transparent'
                                    : 'bg-gradient-to-br from-white/20 via-transparent to-transparent'
                            }`}
                        ></div>
                        <div
                            className={`absolute -top-8 -right-8 h-32 w-32 rounded-full transition-transform duration-700 group-hover:scale-150 ${
                                isDashboardThemeEnabled ? 'bg-accent/10' : 'bg-white/10'
                            }`}
                        ></div>
                        <div
                            className={`absolute -bottom-4 -left-4 h-24 w-24 rounded-full transition-transform duration-700 group-hover:scale-125 ${
                                isDashboardThemeEnabled ? 'bg-base-content/5' : 'bg-black/5'
                            }`}
                        ></div>

                        <div className="relative p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className={`rounded-2xl p-3.5 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-110 group-hover:rotate-3 ${
                                        isDashboardThemeEnabled
                                            ? 'bg-gradient-to-br from-accent/20 to-primary/10'
                                            : 'bg-gradient-to-br from-white/30 to-white/10'
                                    }`}
                                >
                                    <Shield
                                        className={`h-6 w-6 ${
                                            isDashboardThemeEnabled ? 'text-accent' : 'text-gray-900'
                                        }`}
                                        strokeWidth={2.5}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p
                                    className={`mb-3 text-[0.7rem] font-bold uppercase tracking-[0.1em] leading-tight ${
                                        isDashboardThemeEnabled ? 'text-base-content/70' : 'text-gray-700'
                                    }`}
                                    style={{ letterSpacing: '0.1em' }}
                                >
                                    My Permissions
                                </p>
                                <div className="space-y-2">
                                    {permissionItems.map((permission) => (
                                        <div
                                            key={permission.label}
                                            className={`group/item flex items-center gap-2.5 rounded-lg p-1.5 transition-colors ${
                                                isDashboardThemeEnabled
                                                    ? 'hover:bg-base-200/70'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div
                                                className={`h-1.5 w-1.5 rounded-full transition-transform group-hover/item:scale-150 ${
                                                    permission.enabled
                                                        ? isDashboardThemeEnabled
                                                            ? 'bg-success'
                                                            : 'bg-green-600'
                                                        : isDashboardThemeEnabled
                                                            ? 'bg-base-300'
                                                            : 'bg-gray-300'
                                                }`}
                                            ></div>
                                            <p
                                                className={`text-[0.7rem] font-semibold tracking-wide ${
                                                    permission.enabled
                                                        ? isDashboardThemeEnabled
                                                            ? 'text-base-content'
                                                            : 'text-gray-800'
                                                        : isDashboardThemeEnabled
                                                            ? 'text-base-content/40'
                                                            : 'text-gray-400'
                                                }`}
                                            >
                                                {permission.label}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            {/* Quick Actions */}
            <div
                className={`group/card relative mb-8 overflow-hidden rounded-3xl p-7 shadow-lg transition-all duration-500 hover:shadow-2xl sm:p-9 ${
                    isDashboardThemeEnabled
                        ? 'border border-base-300/70 bg-base-100/90 shadow-base-content/5'
                        : 'border border-gray-100/50 bg-white'
                }`}
            >
                {/* Decorative background gradient */}
                <div
                    className={`absolute inset-0 opacity-0 transition-opacity duration-700 group-hover/card:opacity-100 ${
                        isDashboardThemeEnabled
                            ? 'bg-gradient-to-br from-primary/10 via-transparent to-secondary/10'
                            : 'bg-gradient-to-br from-green-50/30 via-transparent to-yellow-50/20'
                    }`}
                ></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="relative">
                            <div
                                className={`absolute inset-0 blur-md opacity-50 ${
                                    isDashboardThemeEnabled
                                        ? 'bg-gradient-to-r from-primary to-secondary'
                                        : 'bg-gradient-to-r from-green-500 to-green-600'
                                }`}
                            ></div>
                            <div
                                className={`relative h-10 w-1.5 rounded-full ${
                                    isDashboardThemeEnabled
                                        ? 'bg-gradient-to-b from-primary to-secondary'
                                        : 'bg-gradient-to-b from-green-500 to-green-600'
                                }`}
                            ></div>
                        </div>
                        <div>
                            <h2
                                className={`text-2xl font-black tracking-tight ${
                                    isDashboardThemeEnabled ? 'text-base-content' : 'text-gray-900'
                                }`}
                                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}
                            >
                                Quick Actions
                            </h2>
                            <p
                                className={`mt-0.5 text-xs font-medium tracking-wide ${
                                    isDashboardThemeEnabled ? 'text-base-content/55' : 'text-gray-500'
                                }`}
                            >
                                Manage your documents efficiently
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => handleNavigate('/staff/documents')}
                            className={`group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-6 font-bold tracking-wide transition-all duration-500 hover:-translate-y-1 ${
                                isDashboardThemeEnabled
                                    ? 'bg-primary text-primary-content shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-2xl hover:shadow-primary/25'
                                    : 'bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white shadow-lg shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/30'
                            }`}
                        >
                            {/* Animated shine effect */}
                            <div
                                className={`absolute inset-0 -translate-x-full transition-transform duration-1000 group-hover:translate-x-full ${
                                    isDashboardThemeEnabled
                                        ? 'bg-gradient-to-r from-transparent via-base-100/30 to-transparent'
                                        : 'bg-gradient-to-r from-transparent via-white/25 to-transparent'
                                }`}
                            ></div>
                            {/* Hover glow */}
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <Upload className="w-5 h-5 relative z-10 group-hover:scale-110 transition-all duration-300" strokeWidth={2.5} />
                            <span className="relative z-10 text-sm" style={{ letterSpacing: '0.05em' }}>
                                UPLOAD DOCUMENT
                            </span>
                        </button>

                        <button
                            onClick={() => handleNavigate('/staff/documents')}
                            className={`group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-6 font-bold tracking-wide transition-all duration-500 hover:-translate-y-1 ${
                                isDashboardThemeEnabled
                                    ? 'border border-base-300/70 bg-base-200/85 text-base-content hover:bg-base-300/90 hover:shadow-xl'
                                    : 'border-2 border-gray-200/80 bg-gradient-to-br from-white to-gray-50 text-gray-800 hover:border-gray-300 hover:to-gray-100 hover:shadow-xl'
                            }`}
                        >
                            <div
                                className={`absolute inset-0 -translate-x-full transition-transform duration-1000 group-hover:translate-x-full ${
                                    isDashboardThemeEnabled
                                        ? 'bg-gradient-to-r from-transparent via-base-100/30 to-transparent'
                                        : 'bg-gradient-to-r from-transparent via-gray-100/50 to-transparent'
                                }`}
                            ></div>
                            <div
                                className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                                    isDashboardThemeEnabled ? 'bg-base-100/20' : 'bg-white/20'
                                }`}
                            ></div>

                            <Search className="w-5 h-5 relative z-10 group-hover:scale-110 transition-all duration-300" strokeWidth={2.5} />
                            <span className="relative z-10 text-sm" style={{ letterSpacing: '0.05em' }}>
                                SEARCH DOCUMENTS
                            </span>
                        </button>

                        <button
                            onClick={() => handleNavigate('/staff/ai-assistant')}
                            className={`group relative flex items-center justify-center gap-3 overflow-hidden rounded-2xl px-6 py-6 font-bold tracking-wide transition-all duration-500 hover:-translate-y-1 ${
                                isDashboardThemeEnabled
                                    ? 'border border-base-300/70 bg-base-200/85 text-base-content hover:bg-base-300/90 hover:shadow-xl'
                                    : 'border-2 border-gray-200/80 bg-gradient-to-br from-white to-gray-50 text-gray-800 hover:border-gray-300 hover:to-gray-100 hover:shadow-xl'
                            }`}
                        >
                            <div
                                className={`absolute inset-0 -translate-x-full transition-transform duration-1000 group-hover:translate-x-full ${
                                    isDashboardThemeEnabled
                                        ? 'bg-gradient-to-r from-transparent via-base-100/30 to-transparent'
                                        : 'bg-gradient-to-r from-transparent via-gray-100/50 to-transparent'
                                }`}
                            ></div>
                            <div
                                className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                                    isDashboardThemeEnabled ? 'bg-base-100/20' : 'bg-white/20'
                                }`}
                            ></div>

                            <MessageSquare className="w-5 h-5 relative z-10 group-hover:scale-110 transition-all duration-300" strokeWidth={2.5} />
                            <span className="relative z-10 text-sm" style={{ letterSpacing: '0.05em' }}>
                                AI ASSISTANT
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Recent Activity Section */}
            <div className="grid grid-cols-1 gap-6">
                <RecentFiles files={recentFiles} />
            </div>

            </div>
        </div>
    );
}

StaffDashboard.layout = (page: React.ReactNode) => <StaffLayout>{page}</StaffLayout>;
