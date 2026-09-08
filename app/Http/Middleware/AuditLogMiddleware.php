<?php

namespace App\Http\Middleware;

use App\Models\AuditLog;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;

class AuditLogMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        if ($request->isMethod('POST') || $request->isMethod('PUT') || $request->isMethod('DELETE')) {
            try {
                $description = $this->getDescription($request);

                AuditLog::log(
                    strtolower($request->method()) . '_' . $request->route()->getActionMethod() ?? $request->method(),
                    null,
                    null,
                    $this->serializableInput($request),
                    $description
                );
            } catch (\Throwable $e) {
                // Audit logging must never break a request.
            }
        }

        return $response;
    }

    protected function serializableInput(Request $request): array
    {
        return array_filter(
            $request->except(['password', 'password_confirmation', '_token']),
            fn ($value) => !$value instanceof UploadedFile
        );
    }

    protected function getDescription(Request $request)
    {
        $method = $request->method();
        $path = $request->path();

        return "{$method} {$path}";
    }
}
