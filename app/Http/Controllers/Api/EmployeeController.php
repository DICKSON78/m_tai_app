<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $request->validate([
            'search' => 'nullable|string|max:255',
            'position' => 'nullable|string|in:cashier,storekeeper,manager,delivery_officer',
            'is_active' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $employees = $business->employees()
            ->when($request->search, function ($q, $v) {
                $q->where(function ($q) use ($v) {
                    $q->where('name', 'like', "%{$v}%")
                        ->orWhere('phone', 'like', "%{$v}%")
                        ->orWhere('position', 'like', "%{$v}%");
                });
            })
            ->when($request->position, fn ($q, $v) => $q->where('position', $v))
            ->when($request->has('is_active'), fn ($q) => $q->where('is_active', $request->boolean('is_active')))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($employees);
    }

    public function store(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'position' => 'required|in:cashier,storekeeper,manager,delivery_officer',
            'salary' => 'required|numeric|min:0',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        $user = null;

        if ($validated['phone']) {
            $user = User::where('phone', $validated['phone'])->first();

            if (!$user) {
                $user = User::create([
                    'name' => $validated['name'],
                    'phone' => $validated['phone'],
                    'role' => 'employee',
                    'user_code' => User::generateUserCode(),
                    'is_active' => true,
                ]);
            }
        }

        $existingEmployee = $business->employees()
            ->where('phone', $validated['phone'])
            ->first();

        if ($existingEmployee) {
            return response()->json([
                'message' => 'Mfanyakazi kwa nambari hii ya simu tayariupo kwenye biashara hii.',
            ], 422);
        }

        $employee = Employee::create([
            'business_id' => $business->id,
            'user_id' => $user?->id,
            'name' => $validated['name'],
            'phone' => $validated['phone'],
            'position' => $validated['position'],
            'salary' => $validated['salary'],
            'permissions' => $validated['permissions'] ?? null,
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Mfanyakazi ameongezwa kwa mafanikio.',
            'employee' => $employee,
        ], 201);
    }

    public function show(Request $request, Business $business, Employee $employee)
    {
        $this->authorizeBusiness($request, $business);

        if ($employee->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kuona mfanyakazi huyu.');
        }

        $employee->load('user:id,name,phone,email');

        $monthsEmployed = $employee->created_at->diffInMonths(now()) + 1;
        $totalEarnings = $employee->salary * $monthsEmployed;

        return response()->json([
            'employee' => $employee,
            'stats' => [
                'months_employed' => $monthsEmployed,
                'total_earnings' => (float) $totalEarnings,
                'is_active' => $employee->is_active,
            ],
        ]);
    }

    public function update(Request $request, Business $business, Employee $employee)
    {
        $this->authorizeBusiness($request, $business);

        if ($employee->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kubadilisha mfanyakazi huyu.');
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'position' => 'sometimes|in:cashier,storekeeper,manager,delivery_officer',
            'salary' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
            'permissions' => 'nullable|array',
            'permissions.*' => 'string',
        ]);

        $employee->update($validated);

        if ($employee->user_id && isset($validated['name'])) {
            $employee->user->update(['name' => $validated['name']]);
        }

        return response()->json([
            'message' => 'Mfanyakazi amesasishwa.',
            'employee' => $employee->fresh()->load('user:id,name,phone,email'),
        ]);
    }

    public function destroy(Request $request, Business $business, Employee $employee)
    {
        $this->authorizeBusiness($request, $business);

        if ($employee->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kufuta mfanyakazi huyu.');
        }

        $employee->delete();

        return response()->json([
            'message' => 'Mfanyakazi amefutwa.',
        ]);
    }

    public function roles()
    {
        return response()->json([
            'roles' => [
                ['value' => 'cashier', 'label' => 'Mwelekezaji Mwahasibu'],
                ['value' => 'storekeeper', 'label' => 'Msimamizi wa Stoo'],
                ['value' => 'manager', 'label' => 'Meneja'],
                ['value' => 'delivery_officer', 'label' => 'Afisa Usambazaji'],
            ],
        ]);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
