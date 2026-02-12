<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Services\ActivityLogger;

class LogoutController extends Controller
{
    /**
     * Handle logout request
     */
    public function logout(Request $request)
    {
        try {
            $user = $request->user();

            // Log logout activity before deleting token
            ActivityLogger::log(
                ActivityLogger::AUTH_LOGOUT,
                null,
                $user->user_id,
                'User logged out'
            );

            // Delete the current access token
            $user->currentAccessToken()->delete();

            return response()->json([
                'success' => true,
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Logout failed: ' . $e->getMessage()
            ], 500);
        }
    }
}