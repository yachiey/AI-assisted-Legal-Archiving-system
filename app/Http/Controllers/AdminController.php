<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use App\Models\Folder;
use App\Services\ActivityLogger;
use Carbon\Carbon;

class AdminController extends Controller
{
    /**
     * Display the admin dashboard
     */
    public function dashboard(Request $request)
    {
        // Get authenticated user - middleware ensures user is authenticated
        $user = $request->user('sanctum') ?? $request->user();

        // Get folder and period filters
        $folderFilter = $request->get('folder', 'all');
        $periodFilter = $request->get('period', 'month');
        $staffPage = $request->get('staff_page', 1);

        // Get total folders
        $totalFolders = Folder::count();

        // Get total users (staff only, excluding admins)
        $totalUsers = \App\Models\User::where('role', '!=', 'admin')->count();

        // Get documents uploaded today
        $uploadedToday = Document::where('status', 'active')
            ->whereDate('created_at', Carbon::today())
            ->count();

        // Get monthly upload statistics (last 12 months)
        $monthlyUploads = $this->getMonthlyUploadData();

        // Get document analytics by folder
        $documentAnalytics = $this->getDocumentAnalytics();

        // Get recent files (recently made active within last 24 hours)
        $recentFiles = Document::with(['user', 'folder'])
            ->where('status', 'active')
            ->where('updated_at', '>=', now()->subDay())
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($doc) {
                return [
                    'id' => $doc->doc_id,
                    'title' => $doc->title,
                    'timestamp' => $doc->updated_at->format('g:i A'),
                    'date' => $doc->updated_at->format('M d, Y'),
                    'created_by' => $doc->user ? $doc->user->firstname . ' ' . $doc->user->lastname : 'Unknown',
                ];
            });


        // Get recent activities (from last 24 hours)
        $activities = \App\Models\ActivityLog::with(['document', 'user'])
            ->where('activity_time', '>=', now()->subDay())
            ->orderBy('activity_time', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($log) {
                $activityTime = \Carbon\Carbon::parse($log->activity_time);
                
                // For auth activities, document is empty
                $isAuth = in_array($log->activity_type, [
                    ActivityLogger::AUTH_LOGIN,
                    ActivityLogger::AUTH_LOGOUT,
                    'login', 'logout', // legacy support
                ]);
                
                return [
                    'action' => ActivityLogger::formatLabel($log->activity_type),
                    'document' => $isAuth ? '' : $log->display_title,
                    'user' => $log->user ? $log->user->firstname . ' ' . $log->user->lastname : 'Unknown User',
                    'time' => $activityTime->diffForHumans(),
                ];
            });

        // --- Integrated Report Data ---
        $totalDocsCountQuery = Document::where('status', 'active');
        
        // Apply period filter - REMOVED to show all-time counts
        // if ($periodFilter === 'week') {
        //     $totalDocsCountQuery->where('created_at', '>=', now()->subDays(7));
        // } elseif ($periodFilter === 'month') {
        //     $totalDocsCountQuery->where('created_at', '>=', now()->startOfMonth());
        // } elseif ($periodFilter === 'year') {
        //     $totalDocsCountQuery->where('created_at', '>=', now()->startOfYear());
        // }
        
        $totalDocsCount = (clone $totalDocsCountQuery)->count();
        $perPage = 5;
        
        $foldersQuery = Folder::query();
        if ($folderFilter !== 'all') {
            $foldersQuery->where('folder_id', $folderFilter);
        }

        $allFoldersData = $foldersQuery->get()
            ->map(function ($folder) use ($totalDocsCountQuery, $totalDocsCount) {
                $count = (clone $totalDocsCountQuery)
                    ->where('folder_id', $folder->folder_id)
                    ->count();

                $percentage = $totalDocsCount > 0 ? ($count / $totalDocsCount) * 100 : 0;

                return [
                    'category' => $folder->folder_name,
                    'count' => $count,
                    'percentage' => round($percentage, 1)
                ];
            })
            ->sortByDesc('count')
            ->values();

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

        // Get staff leaderboard with pagination
        $staffLeaderboardData = $this->getStaffLeaderboard($staffPage);
        $staffPagination = [
            'current_page' => $staffLeaderboardData->currentPage(),
            'per_page' => $staffLeaderboardData->perPage(),
            'total' => $staffLeaderboardData->total(),
            'last_page' => $staffLeaderboardData->lastPage(),
            'from' => $staffLeaderboardData->firstItem(),
            'to' => $staffLeaderboardData->lastItem(),
        ];

        return Inertia::render('Admin/Dashboard/index', [
            'user' => $user ? [
                'user_id' => $user->user_id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'middle_name' => $user->middle_name,
                'email' => $user->email,
            ] : null,
            'stats' => [
                'totalDocuments' => $totalDocsCount,
                'totalFolders' => $totalFolders,
                'totalUsers' => $totalUsers,
                'uploadedToday' => $uploadedToday,
            ],
            'monthlyUploads' => $monthlyUploads,
            'documentAnalytics' => $documentAnalytics,
            'recentFiles' => $recentFiles,
            'activities' => $activities,
            'documentsByCategory' => $documentsByFolder,
            'staffLeaderboard' => $staffLeaderboardData->items(),
            'staffPagination' => $staffPagination,
            'pagination' => $pagination,
            'selectedCategory' => $folderFilter,
            'selectedPeriod' => $periodFilter,
        ]);
    }

    /**
     * Get staff members ranked by their upload activity
     */
    /**
     * Get staff members ranked by their upload activity
     */
    private function getStaffLeaderboard($page = 1, $perPage = 5)
    {
        return \App\Models\User::where('role', 'staff')
            ->withCount(['documents' => function($query) {
                $query->where('status', 'active');
            }])
            ->orderBy('documents_count', 'desc')
            ->paginate($perPage, ['*'], 'staff_page', $page)
            ->through(function($user) {
                return [
                    'name' => $user->firstname . ' ' . $user->lastname,
                    'count' => $user->documents_count,
                    'first_letter' => strtoupper(substr($user->firstname, 0, 1)),
                    'profile_picture' => $user->profile_picture,
                    'role' => 'Staff Member'
                ];
            });
    }

    /**
     * Get monthly upload data for the last 12 months
     */
    private function getMonthlyUploadData()
    {
        $monthlyData = [];
        $now = Carbon::now();

        // Get data for last 12 months
        for ($i = 11; $i >= 0; $i--) {
            $date = $now->copy()->subMonths($i);
            $startOfMonth = $date->copy()->startOfMonth();
            $endOfMonth = $date->copy()->endOfMonth();

            $count = Document::where('status', 'active')
                ->whereBetween('created_at', [$startOfMonth, $endOfMonth])
                ->count();

            $monthlyData[] = [
                'month' => $date->format('M'),
                'year' => $date->format('Y'),
                'count' => $count,
                'label' => $date->format('M Y'),
            ];
        }

        return $monthlyData;
    }

    /**
     * Get document analytics grouped by folder
     */
    private function getDocumentAnalytics()
    {
        $folders = Folder::all();
        $analytics = [];

        foreach ($folders as $folder) {
            $count = Document::where('status', 'active')
                ->where('folder_id', $folder->folder_id)
                ->count();

            // Only include folders that have documents
            if ($count > 0) {
                $analytics[] = [
                    'folder_id' => $folder->folder_id,
                    'folder_name' => $folder->folder_name,
                    'count' => $count,
                    'color' => $this->getColorForFolder($folder->folder_id),
                ];
            }
        }

        // Sort by count descending
        usort($analytics, function($a, $b) {
            return $b['count'] - $a['count'];
        });

        return $analytics;
    }

    /**
     * Get a consistent color for each folder
     */
    private function getColorForFolder($folderId)
    {
        $colors = [
            '#16A34A', // green-600
            '#059669', // emerald-600
            '#0D9488', // teal-600
            '#0891B2', // cyan-600
            '#0284C7', // sky-600
            '#2563EB', // blue-600
            '#F59E0B', // amber-500
            '#EF4444', // red-500
        ];

        return $colors[$folderId % count($colors)];
    }

    /**
     * Get document statistics for API calls
     */
    public function getDocumentStats(Request $request)
    {
        $totalDocuments = Document::whereIn('status', ['active', 'processed'])->count();

        return response()->json([
            'totalDocuments' => $totalDocuments,
        ]);
    }

    /**
     * Get the authenticated user's profile information
     */
    public function getUserProfile(Request $request)
    {
        // Get authenticated user
        $user = $request->user('sanctum') ?? $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User not authenticated',
            ], 401);
        }

        return response()->json([
            'success' => true,
            'user' => [
                'user_id' => $user->user_id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'middle_name' => $user->middle_name,
                'email' => $user->email,
                'profile_picture' => $user->profile_picture,
                'created_at' => $user->created_at->toISOString(),
                'updated_at' => $user->updated_at->toISOString(),
            ],
        ]);
    }

    /**
     * Get notifications for the current admin user
     */
    public function getNotifications(Request $request)
    {
        $user = $request->user();
        $notifications = \App\Models\Notification::where('user_id', $user->user_id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'success' => true,
            'notifications' => $notifications
        ]);
    }

    /**
     * Mark notification as read
     */
    public function markNotificationRead($id)
    {
        try {
            $notification = \App\Models\Notification::where('id', $id)
                ->where('user_id', auth()->id())
                ->firstOrFail();

            $notification->update(['is_read' => true]);

            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            return response()->json(['success' => false], 404);
        }
    }

    /**
     * Mark all notifications as read
     */
    public function markAllNotificationsRead()
    {
        \App\Models\Notification::where('user_id', auth()->id())
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json(['success' => true]);
    }
}