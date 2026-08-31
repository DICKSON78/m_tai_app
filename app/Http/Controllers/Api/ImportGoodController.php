<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessCapital;
use App\Models\ImportGood;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Http\Request;

class ImportGoodController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:pending,received,shelved',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $imports = $business->importGoods()
            ->when($request->search, fn($q, $v) => $q->where('item_name', 'like', "%{$v}%"))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        $stats = [
            'total' => $business->importGoods()->count(),
            'pending' => $business->importGoods()->where('status', 'pending')->count(),
            'received' => $business->importGoods()->where('status', 'received')->count(),
            'shelved' => $business->importGoods()->where('status', 'shelved')->count(),
            'total_cost' => (float) $business->importGoods()->sum(\DB::raw('buying_price * quantity + transport_cost')),
        ];

        return response()->json(array_merge($imports->toArray(), ['stats' => $stats]));
    }

    public function store(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'buying_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'distance_km' => 'nullable|numeric|min:0',
            'transport_cost' => 'nullable|numeric|min:0',
            'transport_rate' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,account_transfer,pay_in_advance,new_capital',
        ]);

        $distance = $validated['distance_km'] ?? null;
        $transportCost = $validated['transport_cost'] ?? null;

        if ($transportCost === null && $distance !== null && $distance > 0) {
            $rate = $validated['transport_rate'] ?? config('mtai.transport_rate_per_km', 1000);
            $transportCost = round($distance * $rate, 2);
        }
        $transportCost = $transportCost ?? 0;

        $import = $business->importGoods()->create([
            'item_name' => $validated['item_name'],
            'quantity' => $validated['quantity'],
            'buying_price' => $validated['buying_price'],
            'selling_price' => $validated['selling_price'],
            'distance_km' => $distance,
            'transport_cost' => $transportCost,
            'payment_method' => $validated['payment_method'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Bidhaa imewekekwa kwa mafanikio.',
            'import_good' => $import->fresh(),
            'transport_cost_calculated' => $request->filled('transport_cost') ? false : ($transportCost > 0),
        ], 201);
    }

    public function show(Request $request, Business $business, ImportGood $importGood)
    {
        $this->authorizeBusiness($request, $business);

        if ($importGood->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kuona bidhaa hii.');
        }

        return response()->json(['import_good' => $importGood]);
    }

    public function update(Request $request, Business $business, ImportGood $importGood)
    {
        $this->authorizeBusiness($request, $business);

        if ($importGood->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kubadilisha bidhaa hii.');
        }

        $validated = $request->validate([
            'item_name' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|integer|min:1',
            'buying_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'distance_km' => 'nullable|numeric|min:0',
            'transport_cost' => 'nullable|numeric|min:0',
            'payment_method' => 'sometimes|in:cash,account_transfer,pay_in_advance,new_capital',
        ]);

        $importGood->update($validated);

        return response()->json([
            'message' => 'Bidhaa imesasishwa.',
            'import_good' => $importGood->fresh(),
        ]);
    }

    public function destroy(Request $request, Business $business, ImportGood $importGood)
    {
        $this->authorizeBusiness($request, $business);

        if ($importGood->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kufuta bidhaa hii.');
        }

        $importGood->delete();

        return response()->json(['message' => 'Bidhaa imefutwa.']);
    }

    public function updateStatus(Request $request, Business $business, ImportGood $importGood)
    {
        $this->authorizeBusiness($request, $business);

        if ($importGood->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kubadilisha hali ya bidhaa hii.');
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,received,shelved',
        ]);

        $previous = $importGood->status;
        $importGood->update(['status' => $validated['status']]);

        // Apply stock + capital only on the first move into an in-stock state.
        $inStock = in_array($validated['status'], ['received', 'shelved']);
        if ($inStock && $previous === 'pending') {
            $this->applyToStockAndCapital($request, $business, $importGood);
        }

        return response()->json([
            'message' => 'Hali ya bidhaa imesasishwa.',
            'import_good' => $importGood->fresh(),
        ]);
    }

    protected function applyToStockAndCapital(Request $request, Business $business, ImportGood $importGood)
    {
        $quantity = (int) $importGood->quantity;
        $unitCost = (float) $importGood->buying_price;
        $totalGoodsCost = round($unitCost * $quantity, 2);
        $transportCost = (float) $importGood->transport_cost;
        $totalCost = round($totalGoodsCost + $transportCost, 2);

        $product = $business->products()->firstOrCreate(
            ['name' => $importGood->item_name],
            [
                'business_id' => $business->id,
                'name' => $importGood->item_name,
                'buying_price' => $unitCost,
                'selling_price' => $importGood->selling_price,
                'wholesale_price' => $importGood->selling_price,
                'retail_price' => $importGood->selling_price,
                'quantity' => 0,
                'is_track_stock' => true,
            ]
        );

        $product->increment('quantity', $quantity);

        StockMovement::create([
            'business_id' => $business->id,
            'product_id' => $product->id,
            'type' => 'in',
            'quantity' => $quantity,
            'unit_cost' => $unitCost,
            'balance_after' => (int) $product->quantity,
            'reference_type' => 'import_good',
            'reference_id' => $importGood->id,
            'notes' => "Import shelved: {$importGood->item_name}",
            'moved_by' => $request->user()->id,
        ]);

        $sourceMap = [
            'account_transfer' => 'bank_loan',
            'pay_in_advance' => 'personal_savings',
            'new_capital' => 'other',
        ];
        $source = $sourceMap[$importGood->payment_method] ?? 'personal_savings';

        $business->capitals()->create([
            'capital_amount' => $totalCost,
            'source' => $source,
            'designation' => 'goods_import_stock_value',
            'registration_date' => now()->toDateString(),
        ]);

        $totalCapital = (float) $business->capitals()->sum('capital_amount');
        $business->update(['opening_capital' => $totalCapital]);
    }

    public function suggestions(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $days = (int) ($request->validate(['days' => 'nullable|integer|min:7|max:365'])['days'] ?? 90);

        $since = now()->subDays($days)->startOfDay();
        $priorSince = now()->subDays($days * 2)->startOfDay();
        $priorUntil = now()->subDays($days)->endOfDay();

        $products = $business->products()->get();

        $recommendations = [];

        foreach ($products as $product) {
            $recentQty = (float) OrderItem::whereHas('order', function ($q) use ($business, $since) {
                    $q->where('business_id', $business->id)
                        ->where('status', 'completed')
                        ->where('created_at', '>=', $since);
                })
                ->where('product_id', $product->id)
                ->sum('quantity');

            $priorQty = (float) OrderItem::whereHas('order', function ($q) use ($business, $priorSince, $priorUntil) {
                    $q->where('business_id', $business->id)
                        ->where('status', 'completed')
                        ->whereBetween('created_at', [$priorSince, $priorUntil]);
                })
                ->where('product_id', $product->id)
                ->sum('quantity');

            if ($recentQty <= 0 && $product->quantity > 0) {
                continue;
            }

            $stock = (int) $product->quantity;
            $threshold = max(1, (int) ($product->low_stock_threshold ?? 5));
            $isLow = $stock <= $threshold;
            $isOut = $stock <= 0;
            $trend = $priorQty > 0 ? (($recentQty - $priorQty) / $priorQty) * 100 : 100;

            $urgency = 0;
            if ($isOut) {
                $urgency += 100;
            }
            if ($isLow) {
                $urgency += 50;
            }
            $urgency += min(50, max(0, $recentQty));
            if ($trend > 30) {
                $urgency += 30;
            }

            $recommendations[] = [
                'product_id' => $product->id,
                'name' => $product->name,
                'current_stock' => $stock,
                'low_stock_threshold' => $threshold,
                'status' => $isOut ? 'out_of_stock' : ($isLow ? 'low_stock' : 'healthy'),
                'units_sold' => round($recentQty, 2),
                'prior_units_sold' => round($priorQty, 2),
                'demand_trend' => round($trend, 2),
                'suggested_quantity' => max((int) ($product->reorder_quantity ?? 0), (int) ceil(max(0, $threshold * 3 - $stock))),
                'urgency' => round($urgency, 2),
            ];
        }

        usort($recommendations, fn ($a, $b) => $b['urgency'] <=> $a['urgency']);

        return response()->json([
            'days' => $days,
            'suggestions' => array_slice($recommendations, 0, 20),
            'count' => count($recommendations),
        ]);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
