// Dashboard/index.tsx
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { router } from '@inertiajs/react';
import AdminLayout from "../../../../Layouts/AdminLayout";
import DashboardHeader from "./components/DashboardHeader";
import RecentFiles from "./components/RecentFiles";
import MonthlyUploads from "./components/MonthlyUploads";
import RecentActivity24h from "./components/RecentActivity24h";
import FileUploadUI from "../Document/components/FileUpload/FileUploadUI";
import ReportFilters from "./components/ReportFilters";
import CategoryChart from "./components/CategoryChart";
import StaffLeaderboard from "./components/StaffLeaderboard";

import { usePage } from '@inertiajs/react';
import { DashboardProps } from './types/dashboard';
import { FileText, Upload, FolderOpen, Users, TrendingUp } from 'lucide-react';

export default function AdminDashboard() {
  const { props } = usePage<DashboardProps>();
  const stats = props.stats || { totalDocuments: 0, totalFolders: 0, totalUsers: 0, uploadedToday: 0 };
  const recentFiles = props.recentFiles || [];

  // ✅ Use real-time data from backend
  const monthlyUploads = props.monthlyUploads || [];
  const documentAnalytics = props.documentAnalytics || [];
  const activities = props.activities || [];

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  // Report Filter Handlers
  const handlePeriodChange = (period: 'week' | 'month' | 'year') => {
    router.visit(window.location.pathname, {
      data: {
        period,
        folder: props.selectedCategory || 'all'
      },
      only: ['documentsByCategory', 'pagination', 'selectedCategory', 'selectedPeriod', 'staffLeaderboard', 'staffPagination'],
      preserveState: true,
      preserveScroll: true
    });
  };

  const handleCategoryChange = (folder: string) => {
    router.visit(window.location.pathname, {
      data: {
        period: props.selectedPeriod || 'month',
        folder
      },
      only: ['documentsByCategory', 'pagination', 'selectedCategory', 'selectedPeriod', 'staffLeaderboard', 'staffPagination'],
      preserveState: true,
      preserveScroll: true
    });
  };

  const handlePageChange = (page: number) => {
    router.visit(window.location.pathname, {
      data: {
        period: props.selectedPeriod || 'month',
        folder: props.selectedCategory || 'all',
        page
      },
      only: ['documentsByCategory', 'pagination', 'selectedCategory', 'selectedPeriod', 'staffLeaderboard', 'staffPagination'],
      preserveState: true,
      preserveScroll: true
    });
  };

  const handleStaffPageChange = (page: number) => {
    router.visit(window.location.pathname, {
      data: {
        period: props.selectedPeriod || 'month',
        folder: props.selectedCategory || 'all',
        page: props.pagination?.current_page || 1,
        staff_page: page
      },
      only: ['staffLeaderboard', 'staffPagination'],
      preserveState: true,
      preserveScroll: true
    });
  };

  return (
    <>
      <DashboardHeader onUploadClick={() => setIsUploadModalOpen(true)} />

      <div className="px-6 py-6">
        {/* Stat Cards - Forest Green & Yellow Design */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Total Documents Card - Forest Green */}
          <div className="group relative rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-black/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

            <div className="relative p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <FileText className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-end">
                  <TrendingUp className="w-3.5 h-3.5 text-white/70 opacity-70" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[0.65rem] font-bold text-white/90 uppercase tracking-[0.1em] leading-tight"
                  style={{ letterSpacing: '0.1em' }}>
                  Total Documents
                </p>
                <p className="text-3xl font-black text-white tracking-tight leading-none"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  {stats.totalDocuments}
                </p>
              </div>
            </div>
          </div>

          {/* Total Folders Card - Yellow */}
          <div className="group relative rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-black/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

            <div className="relative p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <FolderOpen className="w-5 h-5 text-gray-900" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-end">
                  <TrendingUp className="w-3.5 h-3.5 text-gray-700 opacity-50" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[0.65rem] font-bold text-gray-700 uppercase tracking-[0.1em] leading-tight"
                  style={{ letterSpacing: '0.1em' }}>
                  Total Folders
                </p>
                <p className="text-3xl font-black text-gray-900 tracking-tight leading-none"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  {stats.totalFolders || 0}
                </p>
              </div>
            </div>
          </div>

          {/* All Staff Card - Forest Green */}
          <div className="group relative rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, #228B22 0%, #1a6b1a 100%)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-black/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

            <div className="relative p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Users className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-end">
                  <TrendingUp className="w-3.5 h-3.5 text-white/70 opacity-70" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[0.65rem] font-bold text-white/90 uppercase tracking-[0.1em] leading-tight"
                  style={{ letterSpacing: '0.1em' }}>
                  All Staff
                </p>
                <p className="text-3xl font-black text-white tracking-tight leading-none"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  {stats.totalUsers}
                </p>
              </div>
            </div>
          </div>

          {/* Recent Uploaded Today Card - Yellow */}
          <div className="group relative rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 overflow-hidden transform hover:-translate-y-1"
            style={{ background: 'linear-gradient(135deg, #FBEC5D 0%, #F4D03F 100%)' }}>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
            <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-black/5 rounded-full group-hover:scale-125 transition-transform duration-700"></div>

            <div className="relative p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-sm rounded-xl shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <Upload className="w-5 h-5 text-gray-900" strokeWidth={2.5} />
                </div>
                <div className="flex flex-col items-end">
                  <TrendingUp className="w-3.5 h-3.5 text-gray-700 opacity-50" />
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[0.65rem] font-bold text-gray-700 uppercase tracking-[0.1em] leading-tight"
                  style={{ letterSpacing: '0.1em' }}>
                  Uploaded Today
                </p>
                <p className="text-3xl font-black text-gray-900 tracking-tight leading-none"
                  style={{ fontFamily: "'Inter', sans-serif" }}>
                  {stats.uploadedToday || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Global Filters - Moved above the grid */}
        <div className="mb-6">
          <ReportFilters
            selectedPeriod={props.selectedPeriod || 'month'}
            selectedCategory={props.selectedCategory || 'all'}
            onPeriodChange={handlePeriodChange}
            onCategoryChange={handleCategoryChange}
          />
        </div>


        {/* Modern Grid Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

          {/* Main Content Area (8 units) */}
          <div className="xl:col-span-8 space-y-6">
            {/* 1. GROWTH TREND: Monthly Uploads */}
            <MonthlyUploads data={monthlyUploads} />

            {/* 2. ACTIVITY: Recent Activity Feed */}
            <RecentActivity24h activities={activities} />
          </div>

          {/* Sidebar Area (4 units) */}
          <div className="xl:col-span-4 space-y-6">
            {/* 1. FOLDER DISTRIBUTION: Documents by Folder */}
            <CategoryChart
              data={props.documentsByCategory || []}
              pagination={props.pagination}
              onPageChange={handlePageChange}
            />

            {/* 2. PRODUCTIVITY: Staff Activity Leaderboard */}
            <StaffLeaderboard
              data={props.staffLeaderboard || []}
              pagination={props.staffPagination}
              onPageChange={handleStaffPageChange}
            />

            {/* 3. QUICK VIEW: Recent Files */}
            <RecentFiles files={recentFiles} />
          </div>

        </div>
      </div>

      {/* Upload Modal */}
      {isUploadModalOpen && createPortal(
        <div
          className="fixed inset-0 flex items-center justify-center z-[9999] bg-black/30 backdrop-blur-[2px]"
          style={{ margin: 0, padding: 0 }}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <FileUploadUI
                maxFileSize={10 * 1024 * 1024}
                acceptedFileTypes=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                onUploadSuccess={(file) => {
                  setIsUploadModalOpen(false);
                  window.location.href = `/ai-processing?fileName=${encodeURIComponent(file.name)}&title=${encodeURIComponent(file.name)}`;
                }}
                onUploadError={(error) => {
                  console.error('Upload error:', error);
                }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

// Apply Admin Layout wrapper
AdminDashboard.layout = (page: React.ReactNode) => (
  <AdminLayout>{page}</AdminLayout>
);