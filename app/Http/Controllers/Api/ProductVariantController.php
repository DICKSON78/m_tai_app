<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Http\Request;

class ProductVariantController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'is_active' => 'nullable|boolean',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $product = Product::findOrFail($request->product_id);
        $business = $product->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $variants = ProductVariant::where('product_id', $request->product_id)
            ->when($request->has('is_active'), fn($q) => $q->where('is_active', $request->boolean('is_active')))
            ->when($request->search, function ($q) use ($request) {
                $q->where(function ($q) use ($request) {
                    $q->where('name', 'like', "%{$request->search}%")
                        ->orWhere('sku', 'like', "%{$request->search}%");
                });
            })
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($variants);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:255',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'attributes' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $product = Product::findOrFail($validated['product_id']);
        $business = $product->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $variant = ProductVariant::create($validated);

        return response()->json($variant, 201);
    }

    public function show(ProductVariant $variant)
    {
        $variant->load('product');

        return response()->json($variant);
    }

    public function update(Request $request, ProductVariant $variant)
    {
        $business = $variant->product->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'sku' => 'nullable|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'quantity' => 'sometimes|integer|min:0',
            'attributes' => 'nullable|array',
            'is_active' => 'nullable|boolean',
        ]);

        $variant->update($validated);

        return response()->json($variant);
    }

    public function destroy(ProductVariant $variant)
    {
        $business = $variant->product->business;

        if ($business->user_id !== request()->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $variant->delete();

        return response()->json(['message' => 'Variant imefutwa.']);
    }
}
