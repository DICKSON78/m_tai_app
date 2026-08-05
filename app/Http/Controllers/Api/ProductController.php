<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'business_id' => 'required|integer|exists:businesses,id',
            'category' => 'nullable|integer|exists:categories,id',
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:published,draft,all',
            'low_stock' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $business = Business::findOrFail($request->business_id);

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $products = $business->products()
            ->with('category:id,name')
            ->when($request->category, fn($q, $v) => $q->where('category_id', $v))
            ->when($request->search, function ($q, $v) {
                $q->where(function ($q) use ($v) {
                    $q->where('name', 'like', "%{$v}%")
                        ->orWhere('description', 'like', "%{$v}%");
                });
            })
            ->when($request->status === 'published', fn($q) => $q->where('is_published', true))
            ->when($request->status === 'draft', fn($q) => $q->where('is_draft', true))
            ->when($request->low_stock, fn($q) => $q->where('quantity', '<=', 5))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($products);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|integer|exists:businesses,id',
            'category_id' => 'nullable|integer|exists:categories,id',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'buying_price' => 'nullable|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'retail_price' => 'nullable|numeric|min:0',
            'quantity' => 'required|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'sku' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'reorder_quantity' => 'nullable|integer|min:0',
            'is_track_stock' => 'nullable|boolean',
            'location' => 'nullable|string|max:255',
        ]);

        $business = Business::findOrFail($validated['business_id']);

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $validated['user_id'] = $request->user()->id;
        $validated['is_published'] = false;
        $validated['is_draft'] = true;
        $validated['slug'] = Str::slug($validated['name']) . '-' . Str::random(5);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product = Product::create($validated);

        return response()->json($product, 201);
    }

    public function show(Request $request, Product $product)
    {
        $business = $product->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $product->load('category');
        $product->loadCount(['orderItems', 'stockMovements']);

        return response()->json($product);
    }

    public function update(Request $request, Product $product)
    {
        $business = $product->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $validated = $request->validate([
            'category_id' => 'nullable|integer|exists:categories,id',
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string|max:2000',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'buying_price' => 'nullable|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'wholesale_price' => 'nullable|numeric|min:0',
            'retail_price' => 'nullable|numeric|min:0',
            'quantity' => 'sometimes|integer|min:0',
            'unit' => 'nullable|string|max:50',
            'sku' => 'nullable|string|max:255',
            'barcode' => 'nullable|string|max:255',
            'low_stock_threshold' => 'nullable|integer|min:0',
            'reorder_quantity' => 'nullable|integer|min:0',
            'is_track_stock' => 'nullable|boolean',
            'location' => 'nullable|string|max:255',
        ]);

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $validated['image'] = $request->file('image')->store('products', 'public');
        }

        $product->update($validated);

        return response()->json($product);
    }

    public function destroy(Request $request, Product $product)
    {
        $business = $product->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        if ($product->orderItems()->count() > 0) {
            return response()->json(['message' => 'Haiwezi kufuta bidhaa iliyounganishwa na maagizo.'], 422);
        }

        $product->delete();

        return response()->json(['message' => 'Bidhaa imefutwa.']);
    }

    public function publish(Request $request, Product $product)
    {
        $business = $product->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $product->update([
            'is_published' => true,
            'is_draft' => false,
        ]);

        return response()->json([
            'message' => 'Bidhaa imechapishwa.',
            'product' => $product,
        ]);
    }

    public function stock(Request $request, Product $product)
    {
        $business = $product->business;

        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa');
        }

        $data = $request->validate([
            'quantity' => 'required|integer|min:0',
            'action' => 'required|in:add,subtract',
        ]);

        if ($data['action'] === 'add') {
            $product->increment('quantity', $data['quantity']);
        } else {
            if ($product->quantity < $data['quantity']) {
                return response()->json(['message' => 'Hakuna bidhaa za kutosha kwenye stock.'], 400);
            }
            $product->decrement('quantity', $data['quantity']);
        }

        $product->refresh();

        return response()->json([
            'message' => 'Staki imesasishwa.',
            'quantity' => $product->quantity,
        ]);
    }
}
