<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Benefit;
use App\Models\EmployeeBenefit;
use App\Models\Business;
use Illuminate\Http\Request;

class HrBenefitController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $benefits = Benefit::where('business_id', $businessId)->withCount('employeeBenefits')->get();
        return response()->json($benefits);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'provider' => 'nullable|string',
            'cost_per_employee' => 'nullable|numeric|min:0',
            'type' => 'sometimes|in:insurance,allowance,pension,other',
        ]);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['is_active'] = true;
        $benefit = Benefit::create($validated);
        return response()->json($benefit, 201);
    }

    public function update(Request $request, Benefit $benefit)
    {
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'provider' => 'nullable|string',
            'cost_per_employee' => 'sometimes|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);
        $benefit->update($validated);
        return response()->json($benefit);
    }

    public function assign(Request $request, Benefit $benefit)
    {
        $validated = $request->validate([
            'employee_id' => 'required|exists:hr_employees,id',
            'enrollment_date' => 'required|date',
        ]);
        $enrollment = EmployeeBenefit::create([
            'employee_id' => $validated['employee_id'],
            'benefit_id' => $benefit->id,
            'enrollment_date' => $validated['enrollment_date'],
            'status' => 'active',
        ]);
        return response()->json($enrollment, 201);
    }

    public function unassign(Request $request, EmployeeBenefit $employeeBenefit)
    {
        $employeeBenefit->update(['status' => 'inactive', 'end_date' => now()]);
        return response()->json($employeeBenefit);
    }

    public function destroy(Request $request, Benefit $benefit)
    {
        $benefit->employeeBenefits()->delete();
        $benefit->delete();
        return response()->json(['message' => 'Benefit deleted']);
    }
}
