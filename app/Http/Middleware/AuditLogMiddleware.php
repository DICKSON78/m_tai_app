<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;

class AuditLogMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('DELETE')) {
            $description = $this->getDescription($request);

            AuditLog::log(
                strtolower($request->method()) . '_' . $request->route()->getActionMethod() ?? $request->method(),
                null,
                null,
                $request->except(['password', 'password_confirmation', '_token']),
                $description
            );
        }

        return $response;
    }

    protected function getDescription(Request $request)
    {
        $method = $request->method();
        $path = $request->path();

        return "{$method} {$path}";
    }
}
