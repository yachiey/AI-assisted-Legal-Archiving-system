<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Document;
use App\Models\Folder;
use Carbon\Carbon;

class StaffController extends Controller
{
    /**
     * Display the staff dashboard
     */
    public function dashboard(Request $request)
    {
        // Get authenticated user - middleware ensures user is authenticated
        $user = $request->user('sanctum') ?? $request->user();

        // Get document statistics - count active documents
        $totalDocuments = Document::where('status', 'active')->count();

        // Get count of documents uploaded by this staff member
        $myDocumentsCount = Document::where('status', 'active')
            ->where('created_by', $user->user_id)
            ->count();

        // Get count of recent uploads by this staff member (Today)
        $myUploadsCount = Document::where('status', 'active')
            ->where('created_by', $user->user_id)
            ->whereDate('created_at', Carbon::today())
            ->count();

        // Get monthly upload statistics (last 12 months)
        $monthlyUploads = $this->getMonthlyUploadData();

        // Get document analytics by folder
        $documentAnalytics = $this->getDocumentAnalytics();

        // Get documents uploaded by this staff member in the last 24 hours
        $recentFiles = Document::with(['user', 'folder'])
            ->where('status', 'active')
            ->where('created_by', $user->user_id)
            ->where('created_at', '>=', now()->subDay())
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get()
            ->map(function ($doc) {
                return [
                    'id' => $doc->doc_id,
                    'title' => $doc->title,
                    'timestamp' => $doc->updated_at->format('g:i A'),
                    'date' => $doc->updated_at->format('M d, Y'),
                    'folder_name' => $doc->folder ? $doc->folder->folder_name : 'Uncategorized',
                    'created_by' => $doc->user ? $doc->user->firstname . ' ' . $doc->user->lastname : 'Unknown',
                ];
            });


        return Inertia::render('Staff/Dashboard/index', [
            'user' => $user ? [
                'user_id' => $user->user_id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'middle_name' => $user->middle_name,
                'email' => $user->email,
            ] : null,
            'stats' => [
                'totalDocuments' => $totalDocuments,
            ],
            'userPermissions' => $user ? [
                'can_view' => $user->can_view,
                'can_upload' => $user->can_upload,
                'can_delete' => $user->can_delete,
                'can_edit' => $user->can_edit,
            ] : [
                'can_view' => false,
                'can_upload' => false,
                'can_delete' => false,
                'can_edit' => false,
            ],
            'notifications' => $user ? \App\Models\Notification::where('user_id', $user->user_id)->where('is_read', false)->orderBy('created_at', 'desc')->get() : [],
            'monthlyUploads' => $monthlyUploads,
            'documentAnalytics' => $documentAnalytics,
            'recentFiles' => $recentFiles,
            'myDocumentsCount' => $myDocumentsCount,
            'myUploadsCount' => $myUploadsCount,
        ]);
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
            '#006400', // dark green
            '#047857', // emerald-700
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
     * Display the staff documents page
     */
    public function documents(Request $request)
    {
        return Inertia::render('Staff/Documents/index');
    }

    /**
     * Get documents list for staff
     */
    public function getDocuments(Request $request)
    {
        $documents = Document::with(['folder', 'created_by_user'])
            ->where('status', 'active')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($doc) {
                return [
                    'doc_id' => $doc->doc_id,
                    'title' => $doc->title,
                    'file_path' => $doc->file_path,
                    'folder' => $doc->folder ? [
                        'folder_name' => $doc->folder->folder_name,
                    ] : null,
                    'created_at' => $doc->created_at->toISOString(),
                    'created_by_user' => $doc->created_by_user ? [
                        'firstname' => $doc->created_by_user->firstname,
                        'lastname' => $doc->created_by_user->lastname,
                    ] : null,
                ];
            });

        return response()->json([
            'documents' => $documents,
        ]);
    }

    /**
     * Get notifications for the current user
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
