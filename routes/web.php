<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AIAssistantController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\AIProcessController;
use App\Http\Controllers\ManualProcessController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\Auth\LogoutController;
use App\Http\Controllers\UserProfileController;
use App\Http\Controllers\StaffController;
use App\Http\Controllers\AccountController;
use App\Http\Controllers\ContactController;
use Inertia\Inertia;
use App\Http\Controllers\Controller;

Route::get('/', [HomeController::class, 'index']);

// Login route - return the main page with login modal capability
Route::get('/login', [HomeController::class, 'index'])->name('login');
Route::post('/login', [LoginController::class, 'login']); // Handle login submission
Route::post('/contact', [ContactController::class, 'store']);

Route::get('/ai-processing', [AIProcessController::class, 'show'])->name('ai.processing');
Route::get('/manualy-processing', [ManualProcessController::class, 'show'])->name('manual.processing');

// Admin Routes (Protected) - Session authentication
Route::prefix('admin')->middleware(['auth', 'role:admin'])->group(function () {
    Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('admin.dashboard');
    Route::get('/document-stats', [AdminController::class, 'getDocumentStats'])->name('admin.document-stats');
    Route::get('/ai-assistant', [AIAssistantController::class, 'index'])->name('admin.Aiassistant.index');
    route::get('/documents', [DocumentController::class, 'index'])->name('admin.Document.index');

// Route::get('/reports', [ReportController::class, 'index'])->name('admin.reports');
    Route::post('/reports/export-pdf', [ReportController::class, 'exportPDF'])->name('admin.reports.export-pdf');
    Route::post('/reports/export-excel', [ReportController::class, 'exportExcel'])->name('admin.reports.export-excel');
    Route::post('/reports/export-activity-logs', [ReportController::class, 'exportActivityLogs'])->name('admin.reports.export-activity-logs');

    Route::get('/activity-logs', [ReportController::class, 'activityLogs'])->name('admin.activity-logs');

    // Account Management Routes
    Route::get('/account', [AccountController::class, 'index'])->name('admin.account');
    Route::get('/account/users', [AccountController::class, 'getUsers'])->name('admin.account.users');
    Route::post('/account/users', [AccountController::class, 'store'])->name('admin.account.store');
    Route::put('/account/users/{user_id}', [AccountController::class, 'update'])->name('admin.account.update');
    Route::delete('/account/users/{user_id}', [AccountController::class, 'destroy'])->name('admin.account.destroy');
    Route::get('/account/users/{user_id}/documents', [AccountController::class, 'getUserDocuments'])->name('admin.account.documents');

    // User Profile Management Routes - MOVED TO SHARED AUTH GROUP
    // See below outside admin middleware

    // Add these routes to your routes/web.php

Route::get('/admin/documents', [DocumentController::class, 'index'])->name('documents.index');
Route::post('/admin/documents', [DocumentController::class, 'store'])->name('documents.store');
Route::get('/admin/documents/list', [DocumentController::class, 'getDocuments'])->name('documents.list');
Route::get('/admin/documents/counts', [DocumentController::class, 'getDocumentCounts'])->name('documents.counts');

    // Admin Notification Routes
    Route::get('/notifications', [AdminController::class, 'getNotifications'])->name('admin.notifications.list');
    Route::put('/notifications/{id}/read', [AdminController::class, 'markNotificationRead'])->name('admin.notifications.read');
    Route::put('/notifications/read-all', [AdminController::class, 'markAllNotificationsRead'])->name('admin.notifications.read-all');

    // Permission Request Management Routes
    Route::get('/permission-requests/pending', [AccountController::class, 'getPendingRequests'])->name('admin.permission-requests.pending');
    Route::post('/permission-requests/{id}/accept', [AccountController::class, 'acceptRequest'])->name('admin.permission-requests.accept');
    Route::post('/permission-requests/{id}/decline', [AccountController::class, 'declineRequest'])->name('admin.permission-requests.decline');
});

// Shared Authenticated Routes (Admin + Staff)
Route::middleware(['auth'])->group(function () {
    // User Profile Management Routes
    Route::post('/profile/update', [UserProfileController::class, 'update'])->name('profile.update');
    Route::post('/profile/upload-picture', [UserProfileController::class, 'uploadProfilePicture'])->name('profile.upload-picture');
    Route::post('/profile/delete', [UserProfileController::class, 'delete'])->name('profile.delete');
});

// Staff Routes (Protected) - Session authentication
Route::prefix('staff')->middleware(['auth', 'role:staff'])->group(function () {
    Route::get('/dashboard', [StaffController::class, 'dashboard'])->name('staff.dashboard');

    Route::get('/ai-assistant', function () {
        return Inertia::render('Staff/AIAssistant/index');
    })->name('staff.ai-assistant');

    Route::get('/documents', [StaffController::class, 'documents'])->name('staff.documents');
    Route::get('/documents/list', [StaffController::class, 'getDocuments'])->name('staff.documents.list');
    
    // API Document Routes for Staff
    Route::get('/api/documents', [DocumentController::class, 'getDocuments'])->name('staff.api.documents.list');
    Route::get('/api/documents/counts', [DocumentController::class, 'getDocumentCounts'])->name('staff.api.documents.counts');
    Route::get('/api/documents/{id}', [DocumentController::class, 'show'])->name('staff.api.documents.show');
    Route::get('/api/documents/{id}/metadata', [DocumentController::class, 'show'])->name('staff.api.documents.metadata');
    Route::put('/api/documents/{id}/metadata', [DocumentController::class, 'updateMetadata'])->name('staff.api.documents.update.metadata');
    Route::get('/api/documents/{id}/content', [DocumentController::class, 'getContent'])->name('staff.api.documents.content');
    Route::get('/api/documents/{id}/download', [DocumentController::class, 'streamContent'])->name('staff.api.documents.download');
    Route::post('/api/documents/{id}/log-download', [DocumentController::class, 'logDownload'])->name('staff.api.documents.log.download');
    Route::post('/api/documents', [DocumentController::class, 'store'])->name('staff.api.documents.store');
    Route::put('/api/documents/{id}', [DocumentController::class, 'update'])->name('staff.api.documents.update');
    Route::delete('/api/documents/{id}', [DocumentController::class, 'destroy'])->name('staff.api.documents.destroy');
    Route::put('/api/documents/{id}/archive', [DocumentController::class, 'archive'])->name('staff.api.documents.archive');
    Route::put('/api/documents/{id}/restore', [DocumentController::class, 'restore'])->name('staff.api.documents.restore');
    Route::get('/api/documents/folder/{folderId}/count', [DocumentController::class, 'getFolderDocumentCount'])->name('staff.api.documents.folder.count');

    // Notification Routes
    Route::get('/notifications', [StaffController::class, 'getNotifications'])->name('staff.notifications.list');
    Route::put('/notifications/{id}/read', [StaffController::class, 'markNotificationRead'])->name('staff.notifications.read');
    Route::put('/notifications/read-all', [StaffController::class, 'markAllNotificationsRead'])->name('staff.notifications.read-all');
    
    // Permission Request Routes
    Route::post('/request-permission', [AccountController::class, 'requestPermission'])->name('staff.request-permission');
    Route::get('/my-permission-requests', [AccountController::class, 'getMyRequests'])->name('staff.my-permission-requests');
});