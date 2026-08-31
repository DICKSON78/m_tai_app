<?php

namespace App\Http\Middleware;

use App\Models\Employee;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EmployeePermissionMiddleware
{
    public function handle(Request $request, Closure $next, string ...$requiredPermissions): Response
    {
        $user = $request->user();

        $employee = Employee::where('user_id', $user->id)
            ->where('is_active', true)
            ->first();

        if (!$employee) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Hakuna kazi iliyopangiwa mfanyakazi huyu.'], 403)
                : abort(403);
        }

        $defaults = config('mtai.employee_permissions.' . $employee->position, []);
        $override = is_array($employee->permissions) && count($employee->permissions) ? $employee->permissions : [];
        $allows = array_unique(array_merge($defaults, $override));

        $hasPermission = !empty($requiredPermissions)
            && count(array_intersect($allows, $requiredPermissions)) > 0;

        if (!$hasPermission) {
            return $request->expectsJson()
                ? response()->json(['message' => 'Huna ruhusa ya kufanya operesheni hii.'], 403)
                : abort(403);
        }

        return $next($request);
    }
}
