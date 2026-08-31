<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use Illuminate\Http\Request;

class ShopController extends Controller
{
    public function searchShops(Request $request)
    {
        $request->validate(['q' => 'required|string|min:1']);

        $businesses = Business::where('status', 'active')
            ->where('is_published', true)
            ->where(function ($q) use ($request) {
                $q->where('business_name', 'like', "%{$request->q}%")
                  ->orWhere('business_code', 'like', "%{$request->q}%");
            })
            ->withCount('products')
            ->paginate(12);

        return response()->json($businesses);
    }

    public function openShop(Request $request, Business $business)
    {
        if ($business->status !== 'active') {
            return response()->json(['message' => 'Duka hili halijafunguliwa.'], 404);
        }

        $business->loadCount('products');
        $business->load(['products' => function ($q) {
            $q->where('is_published', true)
              ->where('quantity', '>', 0)
              ->with('category');
        }]);

        return response()->json($business);
    }

    public function shopProducts(Request $request, Business $business)
    {
        $products = $business->products()
            ->where('is_published', true)
            ->where('quantity', '>', 0)
            ->with('category');

        if ($request->has('search')) {
            $products->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        if ($request->has('category_id')) {
            $products->where('category_id', $request->category_id);
        }

        $products = $products->orderBy('name')->paginate(20);

        return response()->json($products);
    }

    public function products(Request $request)
    {
        $query = Product::where('is_published', true)
            ->where('quantity', '>', 0)
            ->whereHas('business', function ($q) {
                $q->where('status', 'active')
                  ->where('is_published', true);
            })
            ->with(['category', 'business:id,business_name', 'images']);

        if ($request->has('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', "%{$request->search}%")
                  ->orWhere('description', 'like', "%{$request->search}%");
            });
        }

        if ($request->has('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $products = $query->orderBy('name')->paginate(20);

        $products->getCollection()->transform(function ($product) {
            $product->setAttribute('images', $product->images->map(function ($img) {
                return [
                    'id' => $img->id,
                    'url' => $img->image_path
                        ? (preg_match('#^https?://#i', $img->image_path)
                            ? $img->image_path
                            : url('storage/' . ltrim($img->image_path, '/')))
                        : null,
                ];
            }));
            $product->setAttribute('stock_status', $product->stock_level);
            return $product;
        });

        return response()->json($products);
    }

    public function productDetail(Request $request, Product $product)
    {
        if (!$product->is_published) {
            return response()->json(['message' => 'Bidhaa hii haipatikani.'], 404);
        }

        $product->load(['category', 'business', 'images']);
        $product->loadCount('orderItems');
        $product->setAttribute('images', $product->images->map(function ($img) {
            return [
                'id' => $img->id,
                'url' => $img->image_path
                    ? (preg_match('#^https?://#i', $img->image_path)
                        ? $img->image_path
                        : url('storage/' . ltrim($img->image_path, '/')))
                    : null,
            ];
        }));
        $product->setAttribute('stock_status', $product->stock_level);

        return response()->json($product);
    }
}
