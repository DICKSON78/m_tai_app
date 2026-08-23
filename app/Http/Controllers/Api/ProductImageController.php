<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProductImageController extends Controller
{
    public function index(Request $request, Product $product)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($product->business_id !== $businessId) abort(403);

        $images = $product->images()->orderBy('sort_order')->get();
        return response()->json($images);
    }

    public function store(Request $request, Product $product)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($product->business_id !== $businessId) abort(403);

        $request->validate([
            'image' => 'required|image|max:5120',
            'is_primary' => 'nullable|boolean',
        ]);

        $file = $request->file('image');
        $path = $file->store('products/' . $product->id, 'public');
        $url = Storage::disk('public')->url($path);

        $maxOrder = $product->images()->max('sort_order') ?? 0;

        $isPrimary = $request->boolean('is_primary', false);
        if ($isPrimary) {
            $product->images()->where('is_primary', true)->update(['is_primary' => false]);
        }

        $image = ProductImage::create([
            'product_id' => $product->id,
            'image_path' => $url,
            'is_primary' => $isPrimary,
            'sort_order' => $maxOrder + 1,
        ]);

        if (!$product->image) {
            $product->update(['image' => $url]);
        }

        return response()->json($image, 201);
    }

    public function destroy(Request $request, Product $product, ProductImage $productImage)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($product->business_id !== $businessId) abort(403);
        if ($productImage->product_id !== $product->id) abort(404);

        if (Str::startsWith($productImage->image_path, 'products/')) {
            Storage::disk('public')->delete($productImage->image_path);
        }

        $wasPrimary = $productImage->is_primary;
        $productImage->delete();

        if ($wasPrimary) {
            $first = $product->images()->first();
            if ($first) {
                $first->update(['is_primary' => true]);
                $product->update(['image' => $first->image_path]);
            } else {
                $product->update(['image' => null]);
            }
        }

        return response()->json(['message' => 'Image deleted']);
    }

    public function reorder(Request $request, Product $product)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($product->business_id !== $businessId) abort(403);

        $validated = $request->validate([
            'order' => 'required|array',
            'order.*.id' => 'required|exists:product_images,id',
            'order.*.sort_order' => 'required|integer|min:0',
        ]);

        foreach ($validated['order'] as $item) {
            ProductImage::where('id', $item['id'])
                ->where('product_id', $product->id)
                ->update(['sort_order' => $item['sort_order']]);
        }

        return response()->json(['message' => 'Order updated']);
    }
}
