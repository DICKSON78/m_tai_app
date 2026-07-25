<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Wishlist;
use App\Models\Product;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $wishlist = $request->user()->wishlist()
            ->with('product:id,name,selling_price,image,business_id')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($wishlist);
    }

    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $existing = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $validated['product_id'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Bidhaa tayari kwenye orodha ya mfuataji.'], 422);
        }

        Wishlist::create([
            'user_id' => $request->user()->id,
            'product_id' => $validated['product_id'],
        ]);

        return response()->json(['message' => 'Bidhaa imeongezwa kwenye mfuataji.'], 201);
    }

    public function remove(Request $request, Wishlist $wishlist)
    {
        if ($wishlist->user_id !== $request->user()->id) {
            abort(404);
        }

        $wishlist->delete();

        return response()->json(['message' => 'Bidhaa imeondolewa kwenye mfuataji.']);
    }

    public function check(Request $request, Product $product)
    {
        $exists = Wishlist::where('user_id', $request->user()->id)
            ->where('product_id', $product->id)
            ->exists();

        return response()->json(['is_wishlisted' => $exists]);
    }
}
