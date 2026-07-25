<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\HrDepartment;
use App\Models\Business;
use Illuminate\Http\Request;

class HrDepartmentController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $departments = HrDepartment::where('business_id', $businessId)->withCount('employees')->get();
        return response()->json($departments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate(['name' => 'required|string|max:255', 'description' => 'nullable|string', 'manager_id' => 'nullable|exists:hr_employees,id']);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['is_active'] = true;
        return response()->json(HrDepartment::create($validated), 201);
    }

    public function update(Request $request, HrDepartment $hrDepartment)
    {
        $validated = $request->validate(['name' => 'sometimes|string|max:255', 'description' => 'nullable|string', 'manager_id' => 'nullable|exists:hr_employees,id']);
        $hrDepartment->update($validated);
        return response()->json($hrDepartment);
    }

    public function destroy(Request $request, HrDepartment $hrDepartment)
    {
        $hrDepartment->delete();
        return response()->json(['message' => 'Department deleted']);
    }
}
