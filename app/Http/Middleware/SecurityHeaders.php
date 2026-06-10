<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecurityHeaders
{
    /**
     * Add common security headers that scanners (OWASP ZAP / Burp) flag.
     *
     * These are kept conservative so they won't break the React/Inertia
     * frontend. The Content-Security-Policy is intentionally permissive for
     * inline scripts/styles because Vite + Inertia rely on them; tighten it
     * later once you understand which sources the app actually needs.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // Stop the page being framed by other sites (clickjacking protection).
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');

        // Stop browsers from MIME-sniffing a response away from the declared type.
        $response->headers->set('X-Content-Type-Options', 'nosniff');

        // Don't leak the full URL (with query strings) to other sites.
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');

        // Disable powerful browser features the app doesn't use.
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

        // A baseline Content-Security-Policy. 'unsafe-inline'/'unsafe-eval' are
        // included so Vite/Inertia/React keep working. Removing them is the
        // "high score" goal but requires nonces and is easy to get wrong.
        $response->headers->set(
            'Content-Security-Policy',
            "default-src 'self'; "
            . "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            . "style-src 'self' 'unsafe-inline'; "
            . "img-src 'self' data: blob:; "
            . "font-src 'self' data:; "
            . "connect-src 'self'; "
            // PDF previews render a blob: URL inside an <iframe>; without this
            // they fall back to default-src 'self' and the browser blocks them.
            . "frame-src 'self' blob:; "
            . "object-src 'self' blob:; "
            . "frame-ancestors 'self'; "
            . "base-uri 'self'; "
            . "form-action 'self'"
        );

        // Only advertise HSTS over real HTTPS, otherwise it does nothing useful
        // and can lock you out of http://localhost during development.
        if ($request->secure()) {
            $response->headers->set(
                'Strict-Transport-Security',
                'max-age=31536000; includeSubDomains'
            );
        }

        // Hide which server/framework version is running. X-Powered-By is added
        // by PHP itself (expose_php), so headers->remove() isn't enough on the
        // built-in server — header_remove() strips it at the PHP level too.
        $response->headers->remove('X-Powered-By');
        $response->headers->remove('Server');
        if (function_exists('header_remove')) {
            header_remove('X-Powered-By');
        }

        return $response;
    }
}
