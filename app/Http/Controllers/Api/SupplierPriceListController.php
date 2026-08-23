<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierPriceList;
use Illuminate\Http\Request;

class SupplierPriceListController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $prices = SupplierPriceList::where('business_id', $businessId)
            ->with(['supplier:id,name,code', 'product:id,name,sku'])
            ->when($request->supplier_id, fn ($q, $v) => $q->where('supplier_id', $v))
            ->when($request->product_id, fn ($q, $v) => $q->where('product_id', $v))
            ->when($request->active !== null, fn ($q, $v) => $q->where('is_active', $v === 'true' || $v === '1'))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($prices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'product_id' => 'required|exists:products,id',
            'unit_price' => 'required|numeric|min:0',
            'min_quantity' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'currency' => 'nullable|string|max:3',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date|after_or_equal:valid_from',
            'is_active' => 'nullable|boolean',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $exists = SupplierPriceList::where('business_id', $businessId)
            ->where('supplier_id', $validated['supplier_id'])
            ->where('product_id', $validated['product_id'])
            ->where('is_active', true)
            ->exists();

        if ($exists) {
            return response()->json(['message' => 'Active price already exists for this supplier-product combination'], 422);
        }

        $price = SupplierPriceList::create(array_merge($validated, [
            'business_id' => $businessId,
            'currency' => $validated['currency'] ?? 'TZS',
            'is_active' => $validated['is_active'] ?? true,
        ]));

        return response()->json($price->load('supplier', 'product'), 201);
    }

    public function show(Request $request, SupplierPriceList $supplierPriceList)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierPriceList->business_id !== $businessId) abort(403);

        return response()->json($supplierPriceList->load('supplier', 'product'));
    }

    public function update(Request $request, SupplierPriceList $supplierPriceList)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierPriceList->business_id !== $businessId) abort(403);

        $validated = $request->validate([
            'unit_price' => 'sometimes|numeric|min:0',
            'min_quantity' => 'nullable|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'valid_from' => 'nullable|date',
            'valid_to' => 'nullable|date',
            'is_active' => 'nullable|boolean',
        ]);

        $supplierPriceList->update($validated);
        return response()->json($supplierPriceList->load('supplier', 'product'));
    }

    public function destroy(Request $request, SupplierPriceList $supplierPriceList)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierPriceList->business_id !== $businessId) abort(403);

        $supplierPriceList->delete();
        return response()->json(['message' => 'Supplier price deleted']);
    }
}
