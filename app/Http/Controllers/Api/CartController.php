<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $cart = $request->session()->get('cart', []);
        $items = [];
        $total = 0;

        foreach ($cart as $key => $item) {
            $product = Product::find($item['product_id']);
            if ($product && $product->is_published && $product->quantity > 0) {
                $itemTotal = $item['quantity'] * $item['price'];
                $items[] = [
                    'key' => $key,
                    'product_id' => $product->id,
                    'name' => $product->name,
                    'image' => $product->image,
                    'price' => $item['price'],
                    'quantity' => min($item['quantity'], $product->quantity),
                    'available_quantity' => $product->quantity,
                    'total' => $itemTotal,
                    'business_id' => $product->business_id,
                ];
                $total += $itemTotal;
            }
        }

        return response()->json([
            'items' => $items,
            'total' => $total,
            'count' => count($items),
        ]);
    }

    public function add(Request $request)
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'price_type' => 'sometimes|in:selling,wholesale,retail',
        ]);

        $product = Product::findOrFail($validated['product_id']);

        if (!$product->is_published || $product->quantity < $validated['quantity']) {
            return response()->json(['message' => 'Bidhaa haipatikani au stok imeisha.'], 422);
        }

        $priceType = $validated['price_type'] ?? 'selling';
        $price = match($priceType) {
            'wholesale' => $product->wholesale_price ?? $product->selling_price,
            'retail' => $product->retail_price ?? $product->selling_price,
            default => $product->selling_price,
        };

        $cart = $request->session()->get('cart', []);
        $key = "product_{$product->id}";

        if (isset($cart[$key])) {
            $newQty = $cart[$key]['quantity'] + $validated['quantity'];
            if ($newQty > $product->quantity) {
                return response()->json(['message' => 'Kiasi kinazidi stok iliyopo.'], 422);
            }
            $cart[$key]['quantity'] = $newQty;
        } else {
            $cart[$key] = [
                'product_id' => $product->id,
                'quantity' => $validated['quantity'],
                'price' => (float) $price,
            ];
        }

        $request->session()->put('cart', $cart);

        return response()->json(['message' => 'Imeongezwa kwenye kikapu.', 'cart_count' => count($cart)]);
    }

    public function update(Request $request, $key)
    {
        $validated = $request->validate([
            'quantity' => 'required|integer|min:1',
        ]);

        $cart = $request->session()->get('cart', []);

        if (!isset($cart[$key])) {
            return response()->json(['message' => 'Kitu hiki hakipo kwenye kikapu.'], 404);
        }

        $product = Product::find($cart[$key]['product_id']);
        if ($validated['quantity'] > $product->quantity) {
            return response()->json(['message' => 'Kiasi kinazidi stok iliyopo.'], 422);
        }

        $cart[$key]['quantity'] = $validated['quantity'];
        $request->session()->put('cart', $cart);

        return response()->json(['message' => 'Imebadilishwa.', 'cart_count' => count($cart)]);
    }

    public function remove(Request $request, $key)
    {
        $cart = $request->session()->get('cart', []);

        if (!isset($cart[$key])) {
            return response()->json(['message' => 'Kitu hiki hakipo kwenye kikapu.'], 404);
        }

        unset($cart[$key]);
        $request->session()->put('cart', $cart);

        return response()->json(['message' => 'Imeondolewa.', 'cart_count' => count($cart)]);
    }

    public function clear(Request $request)
    {
        $request->session()->forget('cart');
        return response()->json(['message' => 'Kikapu kimesafishwa.', 'cart_count' => 0]);
    }
}
