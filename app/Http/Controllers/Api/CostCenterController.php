<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CostCenter;
use Illuminate\Http\Request;

class CostCenterController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $centers = CostCenter::where('business_id', $businessId)
            ->with('parent:id,name,code')
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%")->orWhere('code', 'like', "%{$v}%"))
            ->orderBy('code')
            ->get();

        $centers->each(function ($c) {
            $c->spent_amount = $c->spent_amount;
            $c->remaining_budget = $c->remaining_budget;
            $c->budget_usage_percent = $c->budget_usage_percent;
        });

        return response()->json($centers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:cost_centers,id',
            'budget_amount' => 'nullable|numeric|min:0',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;

        $center = CostCenter::create($validated);
        return response()->json($center, 201);
    }

    public function show(Request $request, CostCenter $costCenter)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($costCenter->business_id !== $businessId) abort(403);

        $costCenter->load(['parent', 'children', 'journalEntryLines' => function ($q) {
            $q->with('journalEntry:id,date,reference,description')
              ->whereHas('journalEntry', fn($q2) => $q2->where('is_posted', true))
              ->latest()
              ->limit(50);
        }]);

        return response()->json($costCenter);
    }

    public function update(Request $request, CostCenter $costCenter)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($costCenter->business_id !== $businessId) abort(403);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'parent_id' => 'nullable|exists:cost_centers,id',
            'budget_amount' => 'nullable|numeric|min:0',
            'is_active' => 'sometimes|boolean',
        ]);

        $costCenter->update($validated);
        return response()->json($costCenter);
    }

    public function destroy(Request $request, CostCenter $costCenter)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($costCenter->business_id !== $businessId) abort(403);

        if ($costCenter->journalEntryLines()->count() > 0) {
            return response()->json(['message' => 'Cannot delete cost center with existing transactions'], 422);
        }

        $costCenter->delete();
        return response()->json(['message' => 'Cost center deleted']);
    }
}
