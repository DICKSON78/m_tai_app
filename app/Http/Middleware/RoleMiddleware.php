<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!auth()->check()) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Haijaidhinishwa. Tafadhali ingia.'], 401)
                : redirect()->route('login');
        }

        if (!in_array(auth()->user()->role, $roles)) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Una ufinyu wa kuingia ukurasa huu.'], 403)
                : abort(403, 'Una ufinyu wa kuingia ukurasa huu.');
        }

        return $next($request);
    }
}
