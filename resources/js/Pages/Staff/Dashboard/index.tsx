import React, { useEffect, useState } from "react";
import { usePage, router } from '@inertiajs/react';
import StaffLayout from "../../../../Layouts/StaffLayout";
import StaffHeader from "../../../Components/Templates/StaffHeader";
import RecentFiles from "./components/RecentFiles";
import { FileText, Upload, FolderOpen, Shield, Search, MessageSquare, TrendingUp } from 'lucide-react';
import { usePermissionPolling } from '../../../hooks/usePermissionPolling';

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
    const recentFiles = props.recentFiles || [];
    const myDocumentsCount = props.myDocumentsCount || 0;
    const myUploadsCount = props.myUploadsCount || recentFiles.length;

    // Use real-time permission polling
    const { permissions: livePermissions, unreadCount } = usePermissionPolling(true);

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-gray-50 to-gray-100/50 relative overflow-hidden">
            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-yellow-400 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            <StaffHeader />

            <div className="px-6 py-6 relative z-10">
                {/* Quick Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                    {/* My Documents Card */}
                    <div className="group relative rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
                        style={{ background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }}>
                        {/* Animated gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        {/* Decorative circles */}
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-black/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

                        <div className="relative p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3.5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <FileText className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <TrendingUp className="w-4 h-4 text-gray-700 opacity-50" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[0.7rem] font-bold text-gray-700 uppercase tracking-[0.1em] leading-tight"
                                    style={{ letterSpacing: '0.1em' }}>
                                    My Documents
                                </p>
                                <p className="text-5xl font-black text-gray-900 tracking-tight leading-none"
                                    style={{ fontFamily: "'Inter', sans-serif" }}>
                                    {myDocumentsCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Recent Uploads Card */}
                    <div className="group relative rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
                        style={{ background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-black/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

                        <div className="relative p-6">
                            <div className="flex items-start justify-between mb-6">
                                <div className="p-3.5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Upload className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
                                </div>
                                <div className="flex flex-col items-end">
                                    <TrendingUp className="w-4 h-4 text-gray-700 opacity-50" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[0.7rem] font-bold text-gray-700 uppercase tracking-[0.1em] leading-tight"
                                    style={{ letterSpacing: '0.1em' }}>
                                    Recent Uploads
                                </p>
                                <p className="text-5xl font-black text-gray-900 tracking-tight leading-none"
                                    style={{ fontFamily: "'Inter', sans-serif" }}>
                                    {myUploadsCount}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* My Permissions Card */}
                    <div className="group relative rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
                        style={{ background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }}>
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                        <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                        <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-black/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

                        <div className="relative p-6">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-3.5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-2xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                    <Shield className="w-6 h-6 text-gray-900" strokeWidth={2.5} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[0.7rem] font-bold text-gray-700 uppercase tracking-[0.1em] leading-tight mb-3"
                                    style={{ letterSpacing: '0.1em' }}>
                                    My Permissions
                                </p>
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2.5 group/item">
                                        <div className={`w-1.5 h-1.5 rounded-full group-hover/item:scale-150 transition-transform ${userPermissions.can_upload ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                                        <p className={`text-[0.7rem] font-semibold tracking-wide ${userPermissions.can_upload ? 'text-gray-800' : 'text-gray-400'}`}>Add Documents</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 group/item">
                                        <div className={`w-1.5 h-1.5 rounded-full group-hover/item:scale-150 transition-transform ${userPermissions.can_view ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                                        <p className={`text-[0.7rem] font-semibold tracking-wide ${userPermissions.can_view ? 'text-gray-800' : 'text-gray-400'}`}>View Documents</p>
                                    </div>
                                    <div className="flex items-center gap-2.5 group/item">
                                        <div className={`w-1.5 h-1.5 rounded-full group-hover/item:scale-150 transition-transform ${userPermissions.can_edit ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                                        <p className={`text-[0.7rem] font-semibold tracking-wide ${userPermissions.can_edit ? 'text-gray-800' : 'text-gray-400'}`}>Edit Documents</p>
                                    </div>
                                    <div className="flex items-center group/item hover:bg-gray-50 p-1.5 rounded-lg transition-colors">
                                        <div className={`w-1.5 h-1.5 rounded-full group-hover/item:scale-150 transition-transform ${userPermissions.can_delete ? 'bg-green-600' : 'bg-gray-300'}`}></div>
                                        <p className={`text-[0.7rem] font-semibold tracking-wide ${userPermissions.can_delete ? 'text-gray-800' : 'text-gray-400'}`}>Delete Documents</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>

            {/* Quick Actions */}
            <div className="relative bg-white rounded-3xl shadow-lg border border-gray-100/50 p-7 sm:p-9 mb-8 overflow-hidden group/card hover:shadow-2xl transition-all duration-500">
                {/* Decorative background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-transparent to-yellow-50/20 opacity-0 group-hover/card:opacity-100 transition-opacity duration-700"></div>

                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-green-600 blur-md opacity-50"></div>
                            <div className="relative w-1.5 h-10 bg-gradient-to-b from-green-500 to-green-600 rounded-full"></div>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight"
                                style={{ fontFamily: "'Inter', sans-serif", letterSpacing: '-0.02em' }}>
                                Quick Actions
                            </h2>
                            <p className="text-xs text-gray-500 font-medium tracking-wide mt-0.5">
                                Manage your documents efficiently
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <button
                            onClick={() => handleNavigate('/staff/documents')}
                            className="group relative flex items-center justify-center gap-3 bg-gradient-to-br from-green-500 via-green-600 to-green-700 text-white py-6 px-6 rounded-2xl font-bold tracking-wide transition-all duration-500 shadow-lg shadow-green-500/20 hover:shadow-2xl hover:shadow-green-500/30 hover:-translate-y-1 overflow-hidden"
                        >
                            {/* Animated shine effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                            {/* Hover glow */}
                            <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                            <Upload className="w-5 h-5 relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300" strokeWidth={2.5} />
                            <span className="relative z-10 text-sm" style={{ letterSpacing: '0.05em' }}>
                                UPLOAD DOCUMENT
                            </span>
                        </button>

                        <button
                            onClick={() => handleNavigate('/staff/documents')}
                            className="group relative flex items-center justify-center gap-3 bg-gradient-to-br from-white to-gray-50 hover:to-gray-100 text-gray-800 py-6 px-6 rounded-2xl font-bold tracking-wide transition-all duration-500 shadow-md hover:shadow-xl hover:-translate-y-1 border-2 border-gray-200/80 hover:border-gray-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                            <Search className="w-5 h-5 relative z-10 group-hover:scale-110 transition-all duration-300" strokeWidth={2.5} />
                            <span className="relative z-10 text-sm" style={{ letterSpacing: '0.05em' }}>
                                SEARCH DOCUMENTS
                            </span>
                        </button>

                        <button
                            onClick={() => handleNavigate('/staff/ai-assistant')}
                            className="group relative flex items-center justify-center gap-3 bg-gradient-to-br from-white to-gray-50 hover:to-gray-100 text-gray-800 py-6 px-6 rounded-2xl font-bold tracking-wide transition-all duration-500 shadow-md hover:shadow-xl hover:-translate-y-1 border-2 border-gray-200/80 hover:border-gray-300 overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-100/50 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

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
    );
}

StaffDashboard.layout = (page: React.ReactNode) => <StaffLayout>{page}</StaffLayout>;
