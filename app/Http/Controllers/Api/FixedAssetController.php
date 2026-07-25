<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FixedAsset;
use App\Models\DepreciationEntry;
use App\Models\JournalEntry;
use App\Models\JournalEntryLine;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FixedAssetController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $assets = FixedAsset::where('business_id', $businessId)
            ->with('categoryAccount:id,code,name', 'location:id,name,code')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->search, fn($q, $v) => $q->where('name', 'like', "%{$v}%")->orWhere('asset_code', 'like', "%{$v}%"))
            ->orderBy('asset_code')
            ->paginate($request->per_page ?? 20);

        return response()->json($assets);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_account_id' => 'required|exists:accounts,id',
            'depreciation_account_id' => 'required|exists:accounts,id',
            'purchase_date' => 'required|date',
            'purchase_price' => 'required|numeric|min:0',
            'salvage_value' => 'nullable|numeric|min:0',
            'useful_life_months' => 'required|integer|min:1',
            'depreciation_method' => 'nullable|in:straight_line,declining_balance,sum_of_years,units_of_production',
            'location_id' => 'nullable|exists:cost_centers,id',
            'notes' => 'nullable|string',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['asset_code'] = $this->generateAssetCode($businessId);
        $validated['current_value'] = $validated['purchase_price'];
        $validated['accumulated_depreciation'] = 0;

        $asset = FixedAsset::create($validated);
        return response()->json($asset->load('categoryAccount', 'location'), 201);
    }

    public function show(Request $request, FixedAsset $fixedAsset)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fixedAsset->business_id !== $businessId) abort(403);

        $fixedAsset->load([
            'categoryAccount', 'depreciationAccount', 'location',
            'depreciationEntries' => fn($q) => $q->latest()->limit(24),
        ]);

        $fixedAsset->monthly_depreciation = $fixedAsset->monthly_depreciation;
        $fixedAsset->net_book_value = $fixedAsset->net_book_value;
        $fixedAsset->depreciation_percent = $fixedAsset->depreciation_percent;

        return response()->json($fixedAsset);
    }

    public function update(Request $request, FixedAsset $fixedAsset)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fixedAsset->business_id !== $businessId) abort(403);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'location_id' => 'nullable|exists:cost_centers,id',
            'notes' => 'nullable|string',
        ]);

        $fixedAsset->update($validated);
        return response()->json($fixedAsset);
    }

    public function depreciate(Request $request, FixedAsset $fixedAsset)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fixedAsset->business_id !== $businessId) abort(403);

        if ($fixedAsset->status !== 'active') {
            return response()->json(['message' => 'Cannot depreciate inactive asset'], 422);
        }

        $monthlyAmount = $fixedAsset->monthly_depreciation;
        if ($monthlyAmount <= 0) {
            return response()->json(['message' => 'No depreciation to record'], 422);
        }

        $depreciation = DB::transaction(function () use ($fixedAsset, $monthlyAmount, $businessId, $request) {
            $entry = JournalEntry::create([
                'business_id' => $businessId,
                'date' => now()->toDateString(),
                'description' => "Depreciation: {$fixedAsset->name}",
                'reference' => "DEPR-{$fixedAsset->asset_code}",
                'journal_type' => 'depreciation',
                'total_debit' => $monthlyAmount,
                'total_credit' => $monthlyAmount,
                'is_posted' => true,
                'created_by' => $request->user()->id,
            ]);

            JournalEntryLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $fixedAsset->depreciation_account_id,
                'debit' => $monthlyAmount,
                'credit' => 0,
                'description' => 'Depreciation expense',
            ]);

            JournalEntryLine::create([
                'journal_entry_id' => $entry->id,
                'account_id' => $fixedAsset->category_account_id,
                'debit' => 0,
                'credit' => $monthlyAmount,
                'description' => 'Accumulated depreciation',
            ]);

            $newAccumulated = $fixedAsset->accumulated_depreciation + $monthlyAmount;
            $newValue = $fixedAsset->purchase_price - $newAccumulated;

            $fixedAsset->update([
                'accumulated_depreciation' => $newAccumulated,
                'current_value' => max($newValue, $fixedAsset->salvage_value),
                'status' => $newValue <= $fixedAsset->salvage_value ? 'fully_depreciated' : 'active',
            ]);

            return DepreciationEntry::create([
                'business_id' => $businessId,
                'fixed_asset_id' => $fixedAsset->id,
                'journal_entry_id' => $entry->id,
                'depreciation_date' => now()->toDateString(),
                'amount' => $monthlyAmount,
                'accumulated_total' => $newAccumulated,
                'notes' => 'Monthly depreciation',
            ]);
        });

        return response()->json($depreciation);
    }

    public function dispose(Request $request, FixedAsset $fixedAsset)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($fixedAsset->business_id !== $businessId) abort(403);

        $validated = $request->validate([
            'disposal_date' => 'required|date',
            'disposal_price' => 'required|numeric|min:0',
        ]);

        $fixedAsset->update([
            'status' => 'disposed',
            'disposal_date' => $validated['disposal_date'],
            'disposal_price' => $validated['disposal_price'],
        ]);

        return response()->json($fixedAsset);
    }

    public function summary(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $base = FixedAsset::where('business_id', $businessId);

        return response()->json([
            'total_assets' => (clone $base)->count(),
            'active' => (clone $base)->where('status', 'active')->count(),
            'total_cost' => (clone $base)->sum('purchase_price'),
            'total_depreciation' => (clone $base)->sum('accumulated_depreciation'),
            'net_book_value' => (clone $base)->sum(DB::raw('purchase_price - accumulated_depreciation')),
            'monthly_depreciation' => (clone $base)->where('status', 'active')->get()->sum('monthly_depreciation'),
        ]);
    }

    private function generateAssetCode($businessId): string
    {
        $last = FixedAsset::where('business_id', $businessId)->latest('id')->value('asset_code');
        $number = 1;
        if ($last && preg_match('/FA-(\d+)/', $last, $m)) {
            $number = (int)$m[1] + 1;
        }
        return 'FA-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
