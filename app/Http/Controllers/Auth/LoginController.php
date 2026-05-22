<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Services\TwoFactorCodeService;
use PragmaRX\Google2FA\Google2FA;

class LoginController extends Controller
{
    public function __construct(private TwoFactorCodeService $codeService)
    {
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required|string',
        ]);

        $credentials = $request->only('email', 'password');

        Log::info('Login attempt', ['email' => $request->email]);

        // Verify the password WITHOUT starting a session yet, so we can insert
        // the two-factor step before issuing a token.
        if (!Auth::validate($credentials)) {
            Log::warning('Login failed - invalid credentials', ['email' => $request->email]);
            return response()->json([
                'message' => 'Invalid credentials'
            ], 401);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !$user->getKey()) {
            Log::error('User not found or missing ID after credential validation', [
                'user_exists' => !is_null($user),
            ]);
            return response()->json([
                'message' => 'User authentication failed'
            ], 500);
        }

        // If the user has confirmed two-factor authentication, defer login.
        // Hold the pending user in the session and ask the client for a code.
        if ($user->hasTwoFactorEnabled()) {
            $request->session()->put('2fa:pending_user', $user->user_id);
            $request->session()->put('2fa:remember', true);

            $method = $user->twoFactorMethod();

            // For the email method, send a fresh code right away.
            if ($method === 'email') {
                $this->codeService->sendEmailCode($user);
            }

            Log::info('Two-factor challenge required', [
                'user_id' => $user->getKey(),
                'method' => $method,
            ]);

            return response()->json([
                'two_factor_required' => true,
                'method' => $method,
                'message' => 'Two-factor authentication required',
            ]);
        }

        // No 2FA: complete login immediately.
        Auth::login($user, true);

        return $this->issueLoginResponse($user);
    }

    /**
     * Verify the second factor (TOTP code or recovery code) and complete login.
     */
    public function twoFactorChallenge(Request $request)
    {
        $pendingUserId = $request->session()->get('2fa:pending_user');

        if (!$pendingUserId) {
            return response()->json([
                'message' => 'No pending two-factor authentication. Please log in again.'
            ], 401);
        }

        $request->validate([
            'code' => 'nullable|string',
            'recovery_code' => 'nullable|string',
        ]);

        if (!$request->filled('code') && !$request->filled('recovery_code')) {
            return response()->json([
                'message' => 'A verification code is required.'
            ], 422);
        }

        $user = User::where('user_id', $pendingUserId)->first();

        if (!$user || !$user->hasTwoFactorEnabled()) {
            $request->session()->forget(['2fa:pending_user', '2fa:remember']);
            return response()->json([
                'message' => 'Two-factor authentication is not available for this account.'
            ], 401);
        }

        $verified = false;

        if ($request->filled('recovery_code')) {
            $verified = $this->consumeRecoveryCode($user, $request->input('recovery_code'));
        } elseif ($request->filled('code')) {
            if ($user->twoFactorMethod() === 'email') {
                $verified = $this->codeService->verifyEmailCode($user, $request->input('code'));
            } else {
                $verified = (new Google2FA())->verifyKey($user->two_factor_secret, $request->input('code'));
            }
        }

        if (!$verified) {
            Log::warning('Two-factor verification failed', ['user_id' => $user->getKey()]);
            return response()->json([
                'message' => 'The provided code is invalid.'
            ], 422);
        }

        $remember = $request->session()->get('2fa:remember', true);
        $request->session()->forget(['2fa:pending_user', '2fa:remember']);

        Auth::login($user, $remember);

        return $this->issueLoginResponse($user);
    }

    /**
     * Resend the email code during the login challenge (email method only).
     */
    public function resendChallengeCode(Request $request)
    {
        $pendingUserId = $request->session()->get('2fa:pending_user');

        if (!$pendingUserId) {
            return response()->json([
                'message' => 'No pending two-factor authentication. Please log in again.'
            ], 401);
        }

        $user = User::where('user_id', $pendingUserId)->first();

        if (!$user || $user->twoFactorMethod() !== 'email') {
            return response()->json([
                'message' => 'Resending is not available for this account.'
            ], 422);
        }

        $sent = $this->codeService->sendEmailCode($user);

        return response()->json([
            'mail_sent' => $sent,
            'message' => $sent ? 'A new code has been sent to your email.' : 'Could not send the code.',
        ], $sent ? 200 : 500);
    }

    /**
     * Validate and consume a one-time recovery code. Returns true on a match.
     */
    private function consumeRecoveryCode(User $user, string $code): bool
    {
        $codes = json_decode($user->two_factor_recovery_codes ?? '[]', true) ?: [];

        $code = trim($code);
        $remaining = array_values(array_filter($codes, fn ($c) => !hash_equals($c, $code)));

        if (count($remaining) === count($codes)) {
            return false; // no code was removed -> invalid
        }

        $user->two_factor_recovery_codes = json_encode($remaining);
        $user->save();

        return true;
    }

    /**
     * Issue the Sanctum token + role-based redirect for a fully authenticated user.
     */
    private function issueLoginResponse(User $user)
    {
        try {
            $tokenResult = $user->createToken('auth_token');
            $token = $tokenResult->plainTextToken;

            Log::info('Token created successfully', [
                'user_id' => $user->getKey(),
                'token_id' => $tokenResult->accessToken->id,
            ]);

            ActivityLogger::log(
                ActivityLogger::AUTH_LOGIN,
                null,
                $user->user_id,
                'User logged in'
            );

            $redirect = $user->role === 'admin' ? '/admin/dashboard' : '/staff/dashboard';

            return response()->json([
                'message' => 'Login successful',
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $user,
                'redirect' => $redirect
            ]);

        } catch (\Exception $e) {
            Log::error('Token creation failed', [
                'user_id' => $user->getKey(),
                'error' => $e->getMessage(),
            ]);

            return response()->json([
                'message' => 'Token creation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        Log::info('Logout attempt', ['user_id' => $user->getKey()]);

        // Log logout activity
        ActivityLogger::log(
            ActivityLogger::AUTH_LOGOUT,
            null,
            $user->user_id,
            'User logged out'
        );

        $deletedCount = $user->tokens()->count();
        $user->tokens()->delete();

        Log::info('Logout successful', [
            'user_id' => $user->getKey(),
            'tokens_deleted' => $deletedCount
        ]);

        return response()->json([
            'message' => 'Logged out successfully'
        ]);
    }
}