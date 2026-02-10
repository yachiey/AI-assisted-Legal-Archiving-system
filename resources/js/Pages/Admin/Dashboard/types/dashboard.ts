// types/dashboard.ts
export interface RecentFile {
  id: string | number;
  title: string;
  timestamp: string;
  date: string;
  size?: string;
  created_by?: string;
  downloaded_by?: string;
}

export interface DocumentCategory {
  folder_id: number;
  folder_name: string;
  count: number;
  color: string;
}

export interface MonthlyData {
  month: string;
  year: string;
  count: number;
  label: string;
}

export interface DashboardProps {
  stats: {
    totalDocuments: number;
    totalFolders: number;
    totalUsers: number;
    uploadedToday: number;
  };
  recentFiles: RecentFile[];
  monthlyUploads: MonthlyData[];
  documentAnalytics: DocumentCategory[];
  activities?: any[];
  documentsByCategory?: any[];
  pagination?: any;
  selectedCategory?: string;
  staffLeaderboard?: any[];
  staffPagination?: any;
  [key: string]: any;
}