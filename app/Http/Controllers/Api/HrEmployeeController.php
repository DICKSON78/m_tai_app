<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\HrEmployee;
use App\Models\Business;
use Illuminate\Http\Request;

class HrEmployeeController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $employees = HrEmployee::where('business_id', $businessId)
            ->with('department:id,name')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->department_id, fn($q, $v) => $q->where('department_id', $v))
            ->when($request->search, fn($q, $v) => $q->where(function($q2) use ($v) {
                $q2->where('first_name', 'like', "%{$v}%")->orWhere('last_name', 'like', "%{$v}%")->orWhere('email', 'like', "%{$v}%")->orWhere('employee_number', 'like', "%{$v}%");
            }))
            ->orderBy('first_name')
            ->paginate($request->per_page ?? 20);
        return response()->json($employees);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'department_id' => 'nullable|exists:hr_departments,id',
            'employee_number' => 'required|string|max:20',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'position' => 'required|string|max:255',
            'employment_type' => 'sometimes|in:full_time,part_time,contract,intern',
            'hire_date' => 'required|date',
            'base_salary' => 'required|numeric|min:0',
            'salary_type' => 'sometimes|in:monthly,weekly,daily,hourly',
            'bank_name' => 'nullable|string',
            'bank_account_number' => 'nullable|string',
            'address' => 'nullable|string',
        ]);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['status'] = 'active';
        $validated['user_id'] = $validated['user_id'] ?? null;
        $employee = HrEmployee::create($validated);
        return response()->json($employee, 201);
    }

    public function show(Request $request, HrEmployee $employee)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($employee->business_id !== $businessId) abort(403);
        return response()->json($employee->load('department', 'attendance', 'leaveRequests.leaveType', 'performanceReviews', 'employeeBenefits.benefit'));
    }

    public function update(Request $request, HrEmployee $employee)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($employee->business_id !== $businessId) abort(403);
        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'nullable|string|max:50',
            'position' => 'sometimes|string|max:255',
            'department_id' => 'nullable|exists:hr_departments,id',
            'employment_type' => 'sometimes|in:full_time,part_time,contract,intern',
            'base_salary' => 'sometimes|numeric|min:0',
            'salary_type' => 'sometimes|in:monthly,weekly,daily,hourly',
            'status' => 'sometimes|in:active,inactive,on_leave,terminated',
            'bank_name' => 'nullable|string',
            'bank_account_number' => 'nullable|string',
            'address' => 'nullable|string',
        ]);
        $employee->update($validated);
        return response()->json($employee);
    }

    public function destroy(Request $request, HrEmployee $employee)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($employee->business_id !== $businessId) abort(403);
        $employee->delete();
        return response()->json(['message' => 'Employee deleted']);
    }

    public function summary(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $employees = HrEmployee::where('business_id', $businessId);
        return response()->json([
            'total' => (clone $employees)->count(),
            'active' => (clone $employees)->where('status', 'active')->count(),
            'on_leave' => (clone $employees)->where('status', 'on_leave')->count(),
            'inactive' => (clone $employees)->where('status', 'inactive')->count(),
            'terminated' => (clone $employees)->where('status', 'terminated')->count(),
            'total_salary' => (clone $employees)->where('status', 'active')->sum('base_salary'),
        ]);
    }
}
