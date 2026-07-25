<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\TaxRate;
use App\Models\Business;
use Illuminate\Http\Request;

class FinanceTaxController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $taxRates = TaxRate::where('business_id', $businessId)->get();
        return response()->json($taxRates);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'rate' => 'required|numeric|min:0|max:100',
            'account_id' => 'nullable|exists:accounts,id',
        ]);
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['is_active'] = true;
        $taxRate = TaxRate::create($validated);
        return response()->json($taxRate, 201);
    }

    public function update(Request $request, TaxRate $taxRate)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($taxRate->business_id !== $businessId) abort(403);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'rate' => 'sometimes|numeric|min:0|max:100',
            'is_active' => 'sometimes|boolean',
        ]);
        $taxRate->update($validated);
        return response()->json($taxRate);
    }

    public function destroy(Request $request, TaxRate $taxRate)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($taxRate->business_id !== $businessId) abort(403);
        $taxRate->delete();
        return response()->json(['message' => 'Tax rate deleted']);
    }
}
