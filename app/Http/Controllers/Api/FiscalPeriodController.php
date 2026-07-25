<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FiscalPeriod;
use Illuminate\Http\Request;

class FiscalPeriodController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $periods = FiscalPeriod::where('business_id', $businessId)
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('start_date', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($periods);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $overlap = FiscalPeriod::where('business_id', $businessId)
            ->where('start_date', '<=', $validated['end_date'])
            ->where('end_date', '>=', $validated['start_date'])
            ->exists();

        if ($overlap) {
            return response()->json(['message' => 'Period overlaps with existing period'], 422);
        }

        $validated['business_id'] = $businessId;
        $period = FiscalPeriod::create($validated);
        return response()->json($period, 201);
    }

    public function show(Request $request, FiscalPeriod $fiscalPeriod)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fiscalPeriod->business_id !== $businessId) abort(403);

        $fiscalPeriod->load(['journalEntries' => function ($q) {
            $q->with('lines.account:id,code,name')->latest()->limit(50);
        }, 'closer']);

        return response()->json($fiscalPeriod);
    }

    public function close(Request $request, FiscalPeriod $fiscalPeriod)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fiscalPeriod->business_id !== $businessId) abort(403);

        if ($fiscalPeriod->status === 'closed') {
            return response()->json(['message' => 'Period is already closed'], 422);
        }

        $fiscalPeriod->update(['status' => 'closing']);

        // Auto-generate closing entries for revenue and expense accounts
        // This is a simplified version - in production you'd want more sophisticated closing

        $fiscalPeriod->close($request->user()->id);

        return response()->json($fiscalPeriod);
    }

    public function destroy(Request $request, FiscalPeriod $fiscalPeriod)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fiscalPeriod->business_id !== $businessId) abort(403);

        if ($fiscalPeriod->status === 'closed') {
            return response()->json(['message' => 'Cannot delete closed period'], 422);
        }

        $fiscalPeriod->delete();
        return response()->json(['message' => 'Period deleted']);
    }
}
