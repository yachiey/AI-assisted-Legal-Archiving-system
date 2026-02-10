<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\User;

class AccountController extends Controller
{
    /**
     * Display the account management page
     */
    public function index(Request $request)
    {
        // Get all users with their permissions
        $users = User::select('user_id', 'firstname', 'lastname', 'middle_name', 'email', 'role', 'status', 'can_edit', 'can_delete', 'can_upload', 'can_view')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'user_id' => $user->user_id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'middle_name' => $user->middle_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status, // Get actual status
                    'permissions' => [
                        'can_edit' => $user->can_edit,
                        'can_delete' => $user->can_delete,
                        'can_upload' => $user->can_upload,
                        'can_view' => $user->can_view,
                    ],
                ];
            });

        return Inertia::render('Admin/Account/index', [
            'users' => $users,
        ]);
    }

    /**
     * Get all users (API)
     */
    public function getUsers(Request $request)
    {
        $users = User::select('user_id', 'firstname', 'lastname', 'middle_name', 'email', 'role', 'status', 'created_at', 'can_edit', 'can_delete', 'can_upload', 'can_view')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                return [
                    'user_id' => $user->user_id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'middle_name' => $user->middle_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'created_at' => $user->created_at,
                    'permissions' => [
                        'can_edit' => $user->can_edit,
                        'can_delete' => $user->can_delete,
                        'can_upload' => $user->can_upload,
                        'can_view' => $user->can_view,
                    ],
                ];
            });

        return response()->json(['users' => $users]);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'firstname' => 'required|string|max:255',
            'lastname' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:6',
            'role' => 'required|in:admin,staff',
            'permissions' => 'array',
            'status' => 'in:active,inactive',
        ]);

        try {
            $userData = [
                'firstname' => $validated['firstname'],
                'lastname' => $validated['lastname'],
                'middle_name' => $validated['middle_name'] ?? null,
                'email' => $validated['email'],
                'password' => bcrypt($validated['password']),
                'role' => $validated['role'],
                'status' => strtolower($validated['status'] ?? 'active'),
            ];

            if (isset($validated['permissions'])) {
                $permissions = $validated['permissions'];
                $userData['can_edit'] = $permissions['can_edit'] ?? false;
                $userData['can_delete'] = $permissions['can_delete'] ?? false;
                $userData['can_upload'] = $permissions['can_upload'] ?? false;
                $userData['can_view'] = $permissions['can_view'] ?? false;
            } else {
                if ($validated['role'] === 'admin') {
                     $userData['can_edit'] = true;
                     $userData['can_delete'] = true;
                     $userData['can_upload'] = true;
                     $userData['can_view'] = true;
                } else {
                     $userData['can_view'] = true;
                }
            }

            $user = User::create($userData);

            return response()->json([
                'message' => 'User created successfully',
                'user' => [
                    'user_id' => $user->user_id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'middle_name' => $user->middle_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'permissions' => [
                        'can_edit' => $user->can_edit,
                        'can_delete' => $user->can_delete,
                        'can_upload' => $user->can_upload,
                        'can_view' => $user->can_view,
                    ],
                ],
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to create user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, $user_id)
    {
        $user = User::where('user_id', $user_id)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        $validated = $request->validate([
            'firstname' => 'sometimes|required|string|max:255',
            'lastname' => 'sometimes|required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'email' => 'sometimes|required|string|email|max:255|unique:users,email,' . $user_id . ',user_id',
            'password' => 'nullable|string|min:6',
            'role' => 'sometimes|required|in:admin,staff',
            'permissions' => 'array',
            'status' => 'in:active,inactive',
        ]);

        try {
            $updateData = [
                'firstname' => $validated['firstname'] ?? $user->firstname,
                'lastname' => $validated['lastname'] ?? $user->lastname,
                'middle_name' => $validated['middle_name'] ?? $user->middle_name,
                'email' => $validated['email'] ?? $user->email,
                'role' => $validated['role'] ?? $user->role,
                'status' => isset($validated['status']) ? strtolower($validated['status']) : $user->status,
                'password' => isset($validated['password']) ? bcrypt($validated['password']) : $user->password,
            ];

            // Handle permissions if provided
            if (isset($validated['permissions'])) {
                $permissions = $validated['permissions'];
                $updateData['can_edit'] = $permissions['can_edit'] ?? $user->can_edit;
                $updateData['can_delete'] = $permissions['can_delete'] ?? $user->can_delete;
                $updateData['can_upload'] = $permissions['can_upload'] ?? $user->can_upload;
                $updateData['can_view'] = $permissions['can_view'] ?? $user->can_view;
            }

            $user->update($updateData);

            // Send notification if permissions changed and user is staff
            if ($user->role === 'staff' && isset($validated['permissions'])) {
                // Build detailed permission message
                $grantedPermissions = [];
                $revokedPermissions = [];
                
                $permissionLabels = [
                    'can_edit' => 'Edit Documents',
                    'can_delete' => 'Delete Documents',
                    'can_upload' => 'Upload Documents',
                    'can_view' => 'View Documents',
                ];
                
                foreach ($permissionLabels as $key => $label) {
                    if (isset($permissions[$key])) {
                        if ($permissions[$key]) {
                            $grantedPermissions[] = $label;
                        } else {
                            $revokedPermissions[] = $label;
                        }
                    }
                }
                
                // Build notification message
                $messageParts = [];
                if (!empty($grantedPermissions)) {
                    $messageParts[] = 'Granted: ' . implode(', ', $grantedPermissions);
                }
                if (!empty($revokedPermissions)) {
                    $messageParts[] = 'Revoked: ' . implode(', ', $revokedPermissions);
                }
                
                $detailedMessage = !empty($messageParts) 
                    ? 'Your permissions have been updated. ' . implode('. ', $messageParts) . '.'
                    : 'Your account permissions have been updated by the administrator.';
                
                 \App\Models\Notification::create([
                    'user_id' => $user->user_id,
                    'title' => 'Permissions Updated',
                    'message' => $detailedMessage,
                    'type' => 'info',
                    'is_read' => false,
                ]);
            }

            return response()->json([
                'message' => 'User updated successfully',
                'user' => [
                    'user_id' => $user->user_id,
                    'firstname' => $user->firstname,
                    'lastname' => $user->lastname,
                    'middle_name' => $user->middle_name,
                    'email' => $user->email,
                    'role' => $user->role,
                    'status' => $user->status,
                    'permissions' => [
                        'can_edit' => $user->can_edit,
                        'can_delete' => $user->can_delete,
                        'can_upload' => $user->can_upload,
                        'can_view' => $user->can_view,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to update user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Delete the specified user
     */
    public function destroy($user_id)
    {
        $user = User::where('user_id', $user_id)->first();

        if (!$user) {
            return response()->json([
                'message' => 'User not found',
            ], 404);
        }

        try {
            // Optional: Delete user's activity logs first
            $user->activityLogs()->delete();

            $user->delete();

            return response()->json([
                'message' => 'User deleted successfully',
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to delete user: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get documents uploaded by a specific user
     */
    public function getUserDocuments($user_id)
    {
        try {
            $documents = \App\Models\Document::leftJoin('folders', 'documents.folder_id', '=', 'folders.folder_id')
                ->where('documents.created_by', $user_id)
                ->select(
                    'documents.doc_id',
                    'documents.title',
                    'documents.created_at',
                    'documents.status',
                    'folders.folder_name',
                    'folders.folder_path'
                )
                ->orderBy('documents.created_at', 'desc')
                ->get();

            return response()->json([
                'documents' => $documents
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch user documents: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Handle permission request from Staff
     * Saves to permission_requests table and notifies Admins
     */
    public function requestPermission(Request $request)
    {
        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'boolean',
            'reason' => 'nullable|string|max:500',
        ]);

        try {
            $user = $request->user();
            
            // Filter only true permissions that user doesn't already have
            $requestedPermissions = [];
            foreach ($validated['permissions'] as $key => $value) {
                if ($value && !$user->$key) {
                    $requestedPermissions[$key] = true;
                }
            }
            
            if (empty($requestedPermissions)) {
                return response()->json([
                    'success' => false,
                    'message' => 'No new permissions to request',
                ], 400);
            }
            
            // Check for existing pending request with same permissions
            $existingRequest = \App\Models\PermissionRequest::where('user_id', $user->user_id)
                ->where('status', 'pending')
                ->first();
            
            if ($existingRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'You already have a pending permission request',
                ], 400);
            }
            
            // Create permission request
            $permissionRequest = \App\Models\PermissionRequest::create([
                'user_id' => $user->user_id,
                'permissions' => $requestedPermissions,
                'reason' => $validated['reason'] ?? null,
                'status' => 'pending',
            ]);
            
            // Build notification message
            $permissionLabels = [
                'can_view' => 'View Documents',
                'can_upload' => 'Upload Documents',
                'can_edit' => 'Edit Documents',
                'can_delete' => 'Delete Documents',
            ];
            
            $requestedLabels = [];
            foreach ($requestedPermissions as $key => $value) {
                if (isset($permissionLabels[$key])) {
                    $requestedLabels[] = $permissionLabels[$key];
                }
            }
            
            $requesterName = $user->firstname . ' ' . $user->lastname;
            $permissionsList = implode(', ', $requestedLabels);
            $reason = $validated['reason'] ?? 'No reason provided';
            
            $message = "{$requesterName} has requested: {$permissionsList}. Reason: {$reason}";
            
            // Notify all admins
            $admins = \App\Models\User::where('role', 'admin')->get();
            foreach ($admins as $admin) {
                \App\Models\Notification::create([
                    'user_id' => $admin->user_id,
                    'title' => 'Permission Request',
                    'message' => $message,
                    'type' => 'permission_request',
                    'is_read' => false,
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Permission request submitted successfully',
                'request' => $permissionRequest,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to submit permission request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get pending permission requests (for Admin)
     */
    public function getPendingRequests()
    {
        $requests = \App\Models\PermissionRequest::with('user')
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($request) {
                $permissionLabels = [
                    'can_view' => 'View Documents',
                    'can_upload' => 'Upload Documents',
                    'can_edit' => 'Edit Documents',
                    'can_delete' => 'Delete Documents',
                ];
                
                $requestedLabels = [];
                foreach ($request->permissions as $key => $value) {
                    if ($value && isset($permissionLabels[$key])) {
                        $requestedLabels[] = $permissionLabels[$key];
                    }
                }
                
                return [
                    'id' => $request->id,
                    'user_id' => $request->user_id,
                    'user_name' => $request->user ? $request->user->firstname . ' ' . $request->user->lastname : 'Unknown',
                    'user_email' => $request->user ? $request->user->email : '',
                    'permissions' => $request->permissions,
                    'permission_labels' => $requestedLabels,
                    'reason' => $request->reason,
                    'created_at' => $request->created_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'requests' => $requests,
        ]);
    }

    /**
     * Accept a permission request (for Admin)
     */
    public function acceptRequest(Request $request, $id)
    {
        try {
            $permissionRequest = \App\Models\PermissionRequest::findOrFail($id);
            
            if ($permissionRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been processed',
                ], 400);
            }
            
            $user = \App\Models\User::where('user_id', $permissionRequest->user_id)->first();
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not found',
                ], 404);
            }
            
            // Update user permissions
            $updateData = [];
            foreach ($permissionRequest->permissions as $key => $value) {
                if ($value) {
                    $updateData[$key] = true;
                }
            }
            $user->update($updateData);
            
            // Update request status
            $permissionRequest->update([
                'status' => 'approved',
                'admin_id' => auth()->id(),
                'admin_response' => $request->input('response'),
            ]);
            
            // Build notification message
            $permissionLabels = [
                'can_view' => 'View Documents',
                'can_upload' => 'Upload Documents',
                'can_edit' => 'Edit Documents',
                'can_delete' => 'Delete Documents',
            ];
            
            $grantedLabels = [];
            foreach ($permissionRequest->permissions as $key => $value) {
                if ($value && isset($permissionLabels[$key])) {
                    $grantedLabels[] = $permissionLabels[$key];
                }
            }
            
            // Notify the staff member
            \App\Models\Notification::create([
                'user_id' => $user->user_id,
                'title' => 'Permission Request Approved',
                'message' => 'Your request for the following permissions has been approved: ' . implode(', ', $grantedLabels),
                'type' => 'permission_approved',
                'is_read' => false,
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Permission request approved successfully',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to approve request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Decline a permission request (for Admin)
     */
    public function declineRequest(Request $request, $id)
    {
        try {
            $permissionRequest = \App\Models\PermissionRequest::findOrFail($id);
            
            if ($permissionRequest->status !== 'pending') {
                return response()->json([
                    'success' => false,
                    'message' => 'This request has already been processed',
                ], 400);
            }
            
            $user = \App\Models\User::where('user_id', $permissionRequest->user_id)->first();
            
            // Update request status
            $permissionRequest->update([
                'status' => 'denied',
                'admin_id' => auth()->id(),
                'admin_response' => $request->input('response'),
            ]);
            
            // Build notification message
            $permissionLabels = [
                'can_view' => 'View Documents',
                'can_upload' => 'Upload Documents',
                'can_edit' => 'Edit Documents',
                'can_delete' => 'Delete Documents',
            ];
            
            $deniedLabels = [];
            foreach ($permissionRequest->permissions as $key => $value) {
                if ($value && isset($permissionLabels[$key])) {
                    $deniedLabels[] = $permissionLabels[$key];
                }
            }
            
            $responseMessage = $request->input('response') 
                ? " Reason: " . $request->input('response')
                : '';
            
            // Notify the staff member
            if ($user) {
                \App\Models\Notification::create([
                    'user_id' => $user->user_id,
                    'title' => 'Permission Request Denied',
                    'message' => 'Your request for the following permissions has been denied: ' . implode(', ', $deniedLabels) . $responseMessage,
                    'type' => 'permission_denied',
                    'is_read' => false,
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Permission request declined',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to decline request: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get current user's permission requests (for Staff)
     */
    public function getMyRequests(Request $request)
    {
        $user = $request->user();
        
        $requests = \App\Models\PermissionRequest::where('user_id', $user->user_id)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($request) {
                $permissionLabels = [
                    'can_view' => 'View Documents',
                    'can_upload' => 'Upload Documents',
                    'can_edit' => 'Edit Documents',
                    'can_delete' => 'Delete Documents',
                ];
                
                $requestedLabels = [];
                foreach ($request->permissions as $key => $value) {
                    if ($value && isset($permissionLabels[$key])) {
                        $requestedLabels[] = $permissionLabels[$key];
                    }
                }
                
                return [
                    'id' => $request->id,
                    'permissions' => $request->permissions,
                    'permission_labels' => $requestedLabels,
                    'reason' => $request->reason,
                    'status' => $request->status,
                    'admin_response' => $request->admin_response,
                    'created_at' => $request->created_at->toISOString(),
                    'updated_at' => $request->updated_at->toISOString(),
                ];
            });

        return response()->json([
            'success' => true,
            'requests' => $requests,
            'current_permissions' => [
                'can_view' => $user->can_view,
                'can_upload' => $user->can_upload,
                'can_edit' => $user->can_edit,
                'can_delete' => $user->can_delete,
            ],
        ]);
    }
}
