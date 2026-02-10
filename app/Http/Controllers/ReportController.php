<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use App\Models\ActivityLog;
use App\Models\Folder;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use App\Exports\ReportExport;
use App\Exports\ActivityLogExport;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    /**
     * Display the reports page with real-time analytics
     */
    public function index(Request $request)
    {
        $folderFilter = $request->get('folder', 'all');

        // Calculate date ranges
        $now = Carbon::now();
        $last7Days = $now->copy()->subDays(7);
        $startOfMonth = $now->copy()->startOfMonth();

        // Base query for documents
        $baseQuery = Document::where('status', 'active');

        // Apply folder filter if not 'all'
        if ($folderFilter !== 'all') {
            $baseQuery->where('folder_id', $folderFilter);
        }

        // Get total documents count (with folder filter applied)
        $totalDocuments = (clone $baseQuery)->count();

        // Get documents this month
        $documentsThisMonth = (clone $baseQuery)
            ->where('created_at', '>=', $startOfMonth)
            ->count();

        // Get documents in last 7 days
        $documentsThisWeek = (clone $baseQuery)
            ->where('created_at', '>=', $last7Days)
            ->count();

        // Get active users (users who have activity in the last 30 days)
        $last30Days = $now->copy()->subDays(30);
        $activeUsers = User::whereHas('activityLogs', function ($query) use ($last30Days) {
            $query->where('activity_time', '>=', $last30Days);
        })->count();

        // Calculate storage used (sum of file sizes)
        $storageUsed = $this->formatBytes(
            (clone $baseQuery)->sum(DB::raw('LENGTH(file_path)')) * 1024
        );

        // Calculate average processing time (placeholder)
        $avgProcessingTime = "2.3s";

        // Get documents by folder with pagination
        $perPage = $request->get('per_page', 5);
        $allFoldersData = Folder::all()
        ->map(function ($folder) use ($totalDocuments) {
            $count = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->count();

            $percentage = $totalDocuments > 0 ? ($count / $totalDocuments) * 100 : 0;

            return [
                'category' => $folder->folder_name,
                'count' => $count,
                'percentage' => round($percentage, 1)
            ];
        })
        ->sortByDesc('count')
        ->values();

        // Manual pagination
        $page = $request->get('page', 1);
        $total = $allFoldersData->count();
        $documentsByFolder = $allFoldersData->forPage($page, $perPage)->values()->toArray();

        $pagination = [
            'current_page' => (int)$page,
            'per_page' => (int)$perPage,
            'total' => $total,
            'last_page' => (int)ceil($total / $perPage),
            'from' => (($page - 1) * $perPage) + 1,
            'to' => min($page * $perPage, $total),
        ];

        return Inertia::render('Admin/Reports/index', [
            'stats' => [
                'totalDocuments' => $totalDocuments,
                'documentsThisMonth' => $documentsThisMonth,
                'documentsThisWeek' => $documentsThisWeek,
                'activeUsers' => $activeUsers,
                'storageUsed' => $storageUsed,
                'avgProcessingTime' => $avgProcessingTime,
            ],
            'documentsByCategory' => $documentsByFolder,
            'pagination' => $pagination,
        ]);
    }

    /**
     * Format activity type for display
     */
    private function formatActivityType($type)
    {
        $types = [
            'upload' => 'Document Uploaded',
            'download' => 'Document Downloaded',
            'view' => 'Document Viewed',
            'update' => 'Document Updated',
            'delete' => 'Document Deleted',
            'process' => 'Document Processed',
            'share' => 'Document Shared',
            'login' => 'User Login',
            'logout' => 'User Logout',
        ];

        return $types[$type] ?? ucfirst($type);
    }

    /**
     * Format bytes to human-readable size
     */
    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];

        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }

        return round($bytes, $precision) . ' ' . $units[$i];
    }

    /**
     * Export report as PDF (excludes activity logs)
     */
    public function exportPDF(Request $request)
    {
        $reportType = $request->input('reportType', 'general');
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');
        
        $title = $reportType === 'usage' ? 'Document Usage Report' : 'General Report';
        
        // Add date range to title if specified
        if ($startDate && $endDate) {
            $title .= ' (' . Carbon::parse($startDate)->format('M d, Y') . ' - ' . Carbon::parse($endDate)->format('M d, Y') . ')';
        }

        // Get report data (without activity logs) - with date filtering
        $stats = $this->getReportStats($startDate, $endDate);
        $documentsByCategory = $this->getDocumentsByCategory($startDate, $endDate);

        // Render using Blade template
        return response()->view('reports.template', [
            'title' => $title,
            'reportType' => $reportType,
            'stats' => $stats,
            'documentsByCategory' => $documentsByCategory,
            'recentActivity' => [], // Empty array - no activity logs in PDF
            'date' => date('F d, Y'),
            'time' => date('h:i A'),
            'dateRange' => $startDate && $endDate ? [
                'start' => Carbon::parse($startDate)->format('M d, Y'),
                'end' => Carbon::parse($endDate)->format('M d, Y')
            ] : null
        ], 200)
        ->header('Content-Type', 'text/html; charset=UTF-8')
        ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
        ->header('Pragma', 'no-cache')
        ->header('Expires', '0');
    }

    /**
     * Export report as Excel
     */
    public function exportExcel(Request $request)
    {
        $reportType = $request->input('reportType', 'general');
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');
        $format = $request->input('format', 'excel');

        // Get report data with date filtering
        $stats = $this->getReportStats($startDate, $endDate);
        $documentsByCategory = $this->getDocumentsByCategory($startDate, $endDate);
        
        // For Excel, we might want to include recent activity or not, depending on requirements.
        // The original code included it, so we keep it, but maybe filter it too if needed.
        // For now, let's keep it simple and just filter stats/docs which are the main part.
        $recentActivity = $this->getRecentActivity();

        // Generate filename
        $ext = $format === 'csv' ? 'csv' : 'xlsx';
        $filename = $reportType . '-report-' . date('Y-m-d') . '.' . $ext;

        // Determine writer type
        $writerType = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;

        return Excel::download(
            new ReportExport($stats, $documentsByCategory, $recentActivity, $reportType),
            $filename,
            $writerType
        );
    }

    /**
     * Get report statistics
     */
    private function getReportStats($startDate = null, $endDate = null)
    {
        $now = Carbon::now();
        $last7Days = $now->copy()->subDays(7);
        $startOfMonth = $now->copy()->startOfMonth();

        // Base query with optional date filter
        $baseQuery = Document::where('status', 'active');
        
        if ($startDate && $endDate) {
            $baseQuery->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        }

        $totalDocuments = (clone $baseQuery)->count();
        $documentsThisMonth = (clone $baseQuery)
            ->where('created_at', '>=', $startOfMonth)
            ->count();
        $documentsThisWeek = (clone $baseQuery)
            ->where('created_at', '>=', $last7Days)
            ->count();

        // Count users active in the date range or last 30 days
        $activityQuery = User::whereHas('activityLogs', function ($query) use ($startDate, $endDate, $now) {
            if ($startDate && $endDate) {
                $query->whereBetween('activity_time', [
                    Carbon::parse($startDate)->startOfDay(),
                    Carbon::parse($endDate)->endOfDay()
                ]);
            } else {
                $query->where('activity_time', '>=', $now->copy()->subDays(30));
            }
        });
        $activeUsers = $activityQuery->count();

        return [
            'totalDocuments' => $totalDocuments,
            'documentsThisMonth' => $documentsThisMonth,
            'documentsThisWeek' => $documentsThisWeek,
            'activeUsers' => $activeUsers,
        ];
    }

    /**
     * Get documents by folder
     */
    private function getDocumentsByCategory($startDate = null, $endDate = null)
    {
        // Base query with optional date filter
        $baseQuery = Document::where('status', 'active');
        
        if ($startDate && $endDate) {
            $baseQuery->whereBetween('created_at', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        }
        
        $totalDocuments = (clone $baseQuery)->count();

        return Folder::all()->map(function ($folder) use ($totalDocuments, $startDate, $endDate) {
            // Count documents in this folder with date filter
            $folderQuery = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id);
            
            if ($startDate && $endDate) {
                $folderQuery->whereBetween('created_at', [
                    Carbon::parse($startDate)->startOfDay(),
                    Carbon::parse($endDate)->endOfDay()
                ]);
            }
            
            $count = $folderQuery->count();

            $percentage = $totalDocuments > 0 ? ($count / $totalDocuments) * 100 : 0;

            $thisMonthCount = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->where('created_at', '>=', Carbon::now()->startOfMonth())
                ->count();

            $lastMonthCount = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->whereBetween('created_at', [
                    Carbon::now()->subMonth()->startOfMonth(),
                    Carbon::now()->subMonth()->endOfMonth()
                ])
                ->count();

            $trend = $lastMonthCount > 0
                ? round((($thisMonthCount - $lastMonthCount) / $lastMonthCount) * 100)
                : 0;

            return [
                'category' => $folder->folder_name, // Keep 'category' key for frontend compatibility
                'count' => $count,
                'percentage' => round($percentage, 1),
                'trend' => ($trend >= 0 ? '+' : '') . $trend . '%'
            ];
        })->sortByDesc('count')->take(10);
    }

    /**
     * Get recent activity (includes all activities including login/logout)
     */
    private function getRecentActivity($limit = 20)
    {
        return ActivityLog::with(['document', 'user'])
            ->orderBy('activity_time', 'desc')
            ->limit($limit)
            ->get()
            ->map(function ($log) {
                // For login/logout activities, document is empty
                $documentTitle = in_array($log->activity_type, ['login', 'logout'])
                    ? ''
                    : ($log->document ? $log->document->title : 'Unknown Document');

                return [
                    'action' => $this->formatActivityType($log->activity_type),
                    'document' => $documentTitle,
                    'user' => $log->user ? $log->user->firstname . ' ' . $log->user->lastname : 'Unknown User',
                    'time' => Carbon::parse($log->activity_time)->format('Y-m-d H:i:s')
                ];
            });
    }

    /**
     * Export activity logs as Excel (includes all activities including login/logout)
     */
    public function exportActivityLogs(Request $request)
    {
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');
        $userId = $request->input('userId');
        $date = $request->input('date'); // Keep backwards compatibility
        $format = $request->input('format', 'excel'); // excel, csv, pdf

        if ($format === 'pdf') {
            return $this->exportActivityLogsPDF($request);
        }

        // Get all activity logs including login/logout (no limit)
        $query = ActivityLog::with(['document', 'user'])
            ->orderBy('activity_time', 'desc');

        // Apply user filter
        if ($userId) {
            $query->where('user_id', $userId);
        }

        // Apply date range filter
        if ($startDate && $endDate) {
            $query->whereBetween('activity_time', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        } elseif ($date) {
            $query->whereDate('activity_time', $date);
        }

        $activityLogs = $query->get()
            ->map(function ($log) {
                // For login/logout activities, document is empty
                $documentTitle = in_array($log->activity_type, ['login', 'logout'])
                    ? ''
                    : ($log->document ? $log->document->title : 'Unknown Document');

                return [
                    'activity_type' => $this->formatActivityType($log->activity_type),
                    'document' => $documentTitle,
                    'user' => $log->user ? $log->user->firstname . ' ' . $log->user->lastname : 'Unknown User',
                    'time' => Carbon::parse($log->activity_time)->format('Y-m-d H:i:s'),
                ];
            });

        // Generate filename
        $dateSuffix = '';
        if ($startDate && $endDate) {
            $dateSuffix = '-' . $startDate . '-to-' . $endDate;
        } elseif ($date) {
            $dateSuffix = '-' . $date;
        }
        
        $userSuffix = '';
        if ($userId) {
            $user = User::find($userId);
            if ($user) {
                $userSuffix = '-' . str_replace(' ', '_', $user->firstname . '_' . $user->lastname);
            }
        }
        
        $ext = $format === 'csv' ? 'csv' : 'xlsx';
        $filename = 'activity-logs' . $dateSuffix . $userSuffix . '.' . $ext;
        $writerType = $format === 'csv' ? \Maatwebsite\Excel\Excel::CSV : \Maatwebsite\Excel\Excel::XLSX;

        return Excel::download(
            new ActivityLogExport($activityLogs),
            $filename,
            $writerType
        );
    }

    /**
     * Export activity logs as PDF
     */
    public function exportActivityLogsPDF(Request $request)
    {
        $startDate = $request->input('startDate');
        $endDate = $request->input('endDate');
        $userId = $request->input('userId');
        $date = $request->input('date');

        // Get logs logic (duplicated from exportActivityLogs query building)
        $query = ActivityLog::with(['document', 'user'])
            ->orderBy('activity_time', 'desc');

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($startDate && $endDate) {
            $query->whereBetween('activity_time', [
                Carbon::parse($startDate)->startOfDay(),
                Carbon::parse($endDate)->endOfDay()
            ]);
        } elseif ($date) {
            $query->whereDate('activity_time', $date);
        }

        $logs = $query->get();
        $user = $userId ? User::find($userId) : null;

        $title = 'Activity Logs Report';
        if ($startDate && $endDate) {
            $title .= ' (' . Carbon::parse($startDate)->format('M d, Y') . ' - ' . Carbon::parse($endDate)->format('M d, Y') . ')';
        }

        return response()->view('reports.activity_logs_pdf', [
            'title' => $title,
            'logs' => $logs,
            'user' => $user,
            'date' => date('F d, Y'),
            'time' => date('h:i A'),
            'dateRange' => $startDate && $endDate ? [
                'start' => Carbon::parse($startDate)->format('M d, Y'),
                'end' => Carbon::parse($endDate)->format('M d, Y')
            ] : null
        ], 200)
        ->header('Content-Type', 'text/html; charset=UTF-8')
        ->header('Cache-Control', 'no-cache, no-store, must-revalidate')
        ->header('Pragma', 'no-cache')
        ->header('Expires', '0');
    }

    /**
     * Display the activity logs page
     */
    /**
     * Display the activity logs page
     */
    public function activityLogs(Request $request)
    {
        $userId = $request->get('user_id', 'all');

        // Get all activity logs including login/logout
        $query = ActivityLog::with(['document', 'user'])
            ->orderBy('activity_time', 'desc');

        // Apply user filter if selected
        if ($userId !== 'all') {
            $query->where('user_id', $userId);
        }

        $activities = $query->limit(200) // Increased limit for better visibility
            ->get()
            ->map(function ($log) {
                $activityTime = Carbon::parse($log->activity_time);

                // For login/logout activities, show empty string (no document)
                if (in_array($log->activity_type, ['login', 'logout'])) {
                    $documentTitle = '';
                } else {
                    $documentTitle = $log->document ? $log->document->title : 'Unknown Document';
                }

                return [
                    'action' => $this->formatActivityType($log->activity_type),
                    'document' => $documentTitle,
                    'user' => $log->user
                        ? $log->user->firstname . ' ' . $log->user->lastname
                        : 'Unknown User',
                    'user_id' => $log->user_id, // Added for potential client-side use
                    'time' => $activityTime->diffForHumans()
                ];
            });

        // Get users list for filter dropdown
        $users = User::select('user_id', 'firstname', 'lastname', 'role')
            ->orderBy('firstname')
            ->get()
            ->map(function($user) {
                return [
                    'id' => $user->user_id,
                    'name' => $user->firstname . ' ' . $user->lastname,
                    'role' => ucfirst($user->role)
                ];
            });

        return Inertia::render('Admin/ActivityLogs/index', [
            'activities' => $activities,
            'users' => $users,
            'filters' => [
                'user_id' => $userId
            ]
        ]);
    }

}
