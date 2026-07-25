<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Budget;
use App\Models\Business;
use Illuminate\Http\Request;

class FinanceBudgetController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $budgets = Budget::where('business_id', $businessId)
            ->with('account:id,code,name,type')
            ->when($request->period, fn($q, $v) => $q->where('period', $v))
            ->get();
        return response()->json($budgets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'account_id' => 'required|exists:accounts,id',
            'period' => 'required|string|max:20',
            'amount' => 'required|numeric|min:0',
        ]);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['spent'] = 0;
        $budget = Budget::create($validated);
        return response()->json($budget, 201);
    }

    public function update(Request $request, Budget $budget)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($budget->business_id !== $businessId) abort(403);
        $validated = $request->validate(['amount' => 'sometimes|numeric|min:0']);
        $budget->update($validated);
        return response()->json($budget);
    }

    public function destroy(Request $request, Budget $budget)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($budget->business_id !== $businessId) abort(403);
        $budget->delete();
        return response()->json(['message' => 'Budget deleted']);
    }
}
