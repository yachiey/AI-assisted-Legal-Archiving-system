<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        // Get user from sanctum token first (for API authentication)
        $user = null;

        // Debug logging
        \Log::info('=== HandleInertiaRequests DEBUG ===', [
            'url' => $request->url(),
            'has_auth_header' => $request->hasHeader('Authorization'),
            'auth_header' => $request->header('Authorization'),
            'user_agent' => $request->userAgent(),
        ]);

        // Check if we have an Authorization header
        if ($request->hasHeader('Authorization')) {
            $user = $request->user('sanctum');
            \Log::info('Sanctum auth result:', ['user_found' => !!$user, 'user_id' => $user?->user_id ?? 'null']);
        }

        // Fallback to session auth if no token
        if (!$user) {
            $user = $request->user();
            \Log::info('Session auth result:', ['user_found' => !!$user, 'user_id' => $user?->user_id ?? 'null']);
        }

        $authData = [
            'user' => $user ? [
                'user_id' => $user->user_id,
                'firstname' => $user->firstname,
                'lastname' => $user->lastname,
                'middle_name' => $user->middle_name,
                'email' => $user->email,
            ] : null,
        ];

        \Log::info('Final auth data:', $authData);

        return [
            ...parent::share($request),
            'auth' => $authData,
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
