<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SecurityHeadersMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'DENY');
        $response->headers->set('X-XSS-Protection', '1; mode=block');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

        $env = config('app.env', 'production');
        if ($env === 'local') {
            $response->headers->set('Content-Security-Policy', "default-src 'self' http://localhost:* http://0.0.0.0:* https://fonts.googleapis.com https://fonts.gstatic.com; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* http://0.0.0.0:*; style-src 'self' 'unsafe-inline' http://localhost:* http://0.0.0.0:* https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: http://localhost:* http://0.0.0.0:* https://images.unsplash.com https://images.pexels.com https://plus.unsplash.com;");
        } else {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            $response->headers->set('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https://images.unsplash.com https://images.pexels.com https://plus.unsplash.com; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com; connect-src 'self' https:;");
        }

        return $response;
    }
}
