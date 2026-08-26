<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FiscalYear;
use Illuminate\Http\Request;

class FiscalYearController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $years = FiscalYear::where('business_id', $businessId)
            ->orderBy('start_date', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($years);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $overlap = FiscalYear::where('business_id', $businessId)
            ->where('start_date', '<=', $validated['end_date'])
            ->where('end_date', '>=', $validated['start_date'])
            ->exists();

        if ($overlap) {
            return response()->json(['message' => 'Fiscal year overlaps with existing fiscal year'], 422);
        }

        $validated['business_id'] = $businessId;
        $year = FiscalYear::create($validated);
        return response()->json($year, 201);
    }

    public function show(Request $request, FiscalYear $fiscalYear)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fiscalYear->business_id !== $businessId) abort(403);

        return response()->json($fiscalYear);
    }

    public function update(Request $request, FiscalYear $fiscalYear)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fiscalYear->business_id !== $businessId) abort(403);

        if ($fiscalYear->is_closed) {
            return response()->json(['message' => 'Cannot update a closed fiscal year'], 422);
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date|after:start_date',
        ]);

        $fiscalYear->update($validated);
        return response()->json($fiscalYear);
    }

    public function destroy(Request $request, FiscalYear $fiscalYear)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fiscalYear->business_id !== $businessId) abort(403);

        if ($fiscalYear->is_closed) {
            return response()->json(['message' => 'Cannot delete a closed fiscal year'], 422);
        }

        $fiscalYear->delete();
        return response()->json(['message' => 'Fiscal year deleted']);
    }

    public function close(Request $request, FiscalYear $fiscalYear)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fiscalYear->business_id !== $businessId) abort(403);

        if ($fiscalYear->is_closed) {
            return response()->json(['message' => 'Fiscal year is already closed'], 422);
        }

        $fiscalYear->update(['is_closed' => true]);
        return response()->json($fiscalYear);
    }
}
