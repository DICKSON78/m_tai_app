<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StockController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $products = $business->products()
            ->select('id', 'name', 'image', 'quantity', 'selling_price', 'buying_price')
            ->with('category:id,name');

        if ($request->has('stock_level')) {
            switch ($request->stock_level) {
                case 'out_of_stock':
                    $products->where('quantity', 0);
                    break;
                case 'low':
                    $products->where('quantity', '>', 0)->where('quantity', '<=', 5);
                    break;
                case 'medium':
                    $products->where('quantity', '>', 5)->where('quantity', '<=', 20);
                    break;
                case 'healthy':
                    $products->where('quantity', '>', 20);
                    break;
            }
        }

        if ($request->has('search')) {
            $products->where('name', 'like', "%{$request->search}%");
        }

        $products = $products->orderBy('quantity', 'asc')->paginate(20);

        $products->getCollection()->transform(function ($product) {
            $product->stock_level = $this->getStockLevel($product->quantity);
            $product->stock_value = $product->quantity * $product->buying_price;
            return $product;
        });

        return response()->json($products);
    }

    public function alerts(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $outOfStock = $business->products()->where('quantity', 0)->count();
        $lowStock = $business->products()->where('quantity', '>', 0)->where('quantity', '<=', 5)->count();
        $mediumStock = $business->products()->where('quantity', '>', 5)->where('quantity', '<=', 20)->count();
        $healthyStock = $business->products()->where('quantity', '>', 20)->count();
        $totalProducts = $business->products()->count();
        $totalStockValue = (float) $business->products()->sum(DB::raw('quantity * buying_price'));

        $lowStockProducts = $business->products()
            ->where('quantity', '<=', 5)
            ->where('quantity', '>', 0)
            ->select('id', 'name', 'image', 'quantity', 'selling_price')
            ->orderBy('quantity', 'asc')
            ->limit(10)
            ->get()
            ->map(function ($p) {
                $p->stock_level = $this->getStockLevel($p->quantity);
                return $p;
            });

        return response()->json([
            'summary' => [
                'out_of_stock' => $outOfStock,
                'low_stock' => $lowStock,
                'medium_stock' => $mediumStock,
                'healthy_stock' => $healthyStock,
                'total_products' => $totalProducts,
                'total_stock_value' => $totalStockValue,
            ],
            'low_stock_products' => $lowStockProducts,
        ]);
    }

    public function recordMovement(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'type' => 'required|in:in,out,adjustment',
            'quantity' => 'required|integer|min:1',
            'notes' => 'nullable|string',
        ]);

        $product = Product::where('business_id', $business->id)->findOrFail($validated['product_id']);

        if ($validated['type'] === 'in') {
            $product->increment('quantity', $validated['quantity']);
        } elseif ($validated['type'] === 'out') {
            if ($product->quantity < $validated['quantity']) {
                return response()->json(['message' => 'Stok haiwezi kuwa chini ya sifuri.'], 422);
            }
            $product->decrement('quantity', $validated['quantity']);
        } else {
            $product->update(['quantity' => $validated['quantity']]);
        }

        $movement = StockMovement::create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'type' => $validated['type'],
            'quantity' => $validated['quantity'],
            'notes' => $validated['notes'] ?? null,
            'moved_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Hifadhi imesajiliwa.',
            'movement' => $movement->load(['product:id,name', 'movedBy:id,name']),
            'new_quantity' => $product->fresh()->quantity,
        ], 201);
    }

    public function productMovements(Request $request, Product $product)
    {
        $movements = $product->stockMovements()
            ->with('movedBy:id,name')
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json($movements);
    }

    public function movements(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $query = $business->stockMovements()
            ->with(['product:id,name,image', 'movedBy:id,name']);

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('product_id')) {
            $query->where('product_id', $request->product_id);
        }

        if ($request->has('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        $movements = $query->orderBy('created_at', 'desc')->paginate(20);

        return response()->json($movements);
    }

    public function fastMoving(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $products = Product::where('business_id', $business->id)
            ->select('id', 'name', 'image', 'quantity', 'selling_price')
            ->withCount(['orderItems as total_sold' => function ($q) {
                $q->select(DB::raw('COALESCE(SUM(quantity), 0)'));
            }])
            ->orderBy('total_sold', 'desc')
            ->limit(20)
            ->get();

        return response()->json($products);
    }

    protected function getStockLevel($quantity)
    {
        if ($quantity <= 0) return 'out_of_stock';
        if ($quantity <= 5) return 'low';
        if ($quantity <= 20) return 'medium';
        return 'healthy';
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
