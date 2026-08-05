<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Product;
use App\Models\StockBatch;
use App\Models\StockCount;
use App\Models\StockCountItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class InventoryController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $request->validate([
            'search' => 'nullable|string|max:255',
            'category_id' => 'nullable|integer|exists:categories,id',
            'stock_level' => 'nullable|in:out_of_stock,low,medium,healthy',
            'only_tracked' => 'nullable|boolean',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $products = $business->products()
            ->select('id', 'name', 'sku', 'barcode', 'image', 'category_id', 'unit',
                'quantity', 'buying_price', 'selling_price', 'low_stock_threshold',
                'reorder_quantity', 'is_track_stock', 'location')
            ->with('category:id,name')
            ->when($request->search, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('name', 'like', "%{$v}%")
                        ->orWhere('sku', 'like', "%{$v}%")
                        ->orWhere('barcode', 'like', "%{$v}%");
                });
            })
            ->when($request->category_id, fn ($q, $v) => $q->where('category_id', $v))
            ->when($request->boolean('only_tracked'), fn ($q) => $q->where('is_track_stock', true))
            ->when($request->stock_level, function ($q, $level) {
                match ($level) {
                    'out_of_stock' => $q->where('quantity', '<=', 0),
                    'low' => $q->whereRaw('quantity > 0 AND quantity <= low_stock_threshold'),
                    'medium' => $q->whereRaw('quantity > low_stock_threshold AND quantity <= low_stock_threshold * 3'),
                    'healthy' => $q->whereRaw('quantity > low_stock_threshold * 3'),
                };
            })
            ->orderBy('quantity', 'asc')
            ->paginate($request->per_page ?? 20);

        $products->getCollection()->transform(function ($product) {
            $product->stock_level = $product->stock_level;
            $product->stock_value_cost = (float) $product->stock_value_cost;
            $product->stock_value_retail = (float) $product->stock_value_retail;
            $product->reorder_needed = $product->is_track_stock && $product->quantity <= $product->low_stock_threshold;

            return $product;
        });

        return response()->json($products);
    }

    public function summary(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $totals = (object) $business->products()
            ->where('is_track_stock', true)
            ->selectRaw('COUNT(*) as total_products')
            ->selectRaw('COALESCE(SUM(quantity), 0) as total_units')
            ->selectRaw('COALESCE(SUM(quantity * buying_price), 0) as value_cost')
            ->selectRaw('COALESCE(SUM(quantity * selling_price), 0) as value_retail')
            ->selectRaw('COALESCE(SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END), 0) as out_of_stock')
            ->selectRaw('COALESCE(SUM(CASE WHEN quantity > 0 AND quantity <= low_stock_threshold THEN 1 ELSE 0 END), 0) as low_stock')
            ->first();

        $expiring = StockBatch::where('business_id', $business->id)
            ->where('quantity', '>', 0)
            ->whereBetween('expiry_date', [now()->startOfDay(), now()->addDays(90)->endOfDay()])
            ->count();

        $reorder = Product::where('business_id', $business->id)
            ->where('is_track_stock', true)
            ->whereRaw('quantity <= low_stock_threshold')
            ->count();

        return response()->json([
            'total_products' => (int) $totals->total_products,
            'total_units' => (int) $totals->total_units,
            'value_cost' => (float) $totals->value_cost,
            'value_retail' => (float) $totals->value_retail,
            'out_of_stock' => (int) $totals->out_of_stock,
            'low_stock' => (int) $totals->low_stock,
            'reorder_items' => $reorder,
            'expiring_batches' => $expiring,
        ]);
    }

    public function alerts(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $outOfStock = $business->products()
            ->where('is_track_stock', true)
            ->where('quantity', '<=', 0)
            ->select('id', 'name', 'sku', 'image', 'quantity', 'low_stock_threshold', 'selling_price', 'buying_price')
            ->orderBy('name')
            ->get()
            ->map(fn ($p) => $this->decorate($p));

        $lowStock = $business->products()
            ->where('is_track_stock', true)
            ->whereRaw('quantity > 0 AND quantity <= low_stock_threshold')
            ->select('id', 'name', 'sku', 'image', 'quantity', 'low_stock_threshold', 'reorder_quantity', 'selling_price', 'buying_price')
            ->orderByRaw('quantity / low_stock_threshold asc')
            ->get()
            ->map(function ($p) {
                $p = $this->decorate($p);
                $p->suggested_reorder = max((int) $p->reorder_quantity, (int) $p->low_stock_threshold - (int) $p->quantity);

                return $p;
            });

        $expiringBatches = StockBatch::where('business_id', $business->id)
            ->where('quantity', '>', 0)
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', now()->addDays(90)->endOfDay())
            ->with(['product:id,name,unit', 'supplier:id,name'])
            ->orderBy('expiry_date')
            ->get();

        return response()->json([
            'out_of_stock' => $outOfStock,
            'low_stock' => $lowStock,
            'expiring_batches' => $expiringBatches,
        ]);
    }

    public function movements(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $query = $business->stockMovements()
            ->with(['product:id,name,image,unit', 'movedBy:id,first_name,last_name,name', 'batch:id,batch_number,expiry_date']);

        if ($request->type) {
            $query->where('type', $request->type);
        }
        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->date_from) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->date_to) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }
        if ($request->search) {
            $query->whereHas('product', fn ($q) => $q->where('name', 'like', "%{$request->search}%"));
        }

        $movements = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($movements);
    }

    public function storeMovement(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'type' => 'required|in:in,out,adjustment,sale,sale_return,purchase_receipt,purchase_return,damage,transfer',
            'quantity' => 'required|numeric|min:0',
            'batch_id' => 'nullable|integer|exists:stock_batches,id',
            'batch_number' => 'nullable|string|max:255',
            'expiry_date' => 'nullable|date',
            'manufacturing_date' => 'nullable|date',
            'unit_cost' => 'nullable|numeric|min:0',
            'warehouse_location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $product = Product::where('business_id', $business->id)->findOrFail($validated['product_id']);

        return DB::transaction(function () use ($validated, $product, $request, $business) {
            $quantity = (float) $validated['quantity'];
            $type = $validated['type'];
            $outbound = in_array($type, ['out', 'sale', 'damage', 'purchase_return', 'transfer']);

            if ($type === 'adjustment') {
                $delta = $quantity - $product->quantity;
            } else {
                $delta = $outbound ? -$quantity : $quantity;
            }

            $newQuantity = $product->quantity + $delta;
            if ($newQuantity < 0) {
                return response()->json(['message' => 'Stok haitoshi. Hifadhi haiwezi kuwa chini ya sifuri.'], 422);
            }

            if ($delta > 0) {
                $this->applyInbound($product, $delta, $validated, $request->user()->id);
            } elseif ($delta < 0) {
                $this->applyOutbound($product, abs($delta), $validated, $request->user()->id);
            } else {
                return response()->json(['message' => 'Hakuna mabadiliko ya stok.'], 422);
            }

            $product->refresh();

            $movement = StockMovement::create([
                'business_id' => $business->id,
                'product_id' => $product->id,
                'batch_id' => $validated['batch_id'] ?? null,
                'type' => $type,
                'quantity' => abs($delta),
                'unit_cost' => $validated['unit_cost'] ?? $product->buying_price,
                'balance_after' => (string) $product->quantity,
                'notes' => $validated['notes'] ?? null,
                'moved_by' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Hifadhi imesajiliwa.',
                'movement' => $movement->load(['product:id,name', 'movedBy:id,first_name,last_name,name', 'batch:id,batch_number']),
                'new_quantity' => $product->quantity,
            ], 201);
        });
    }

    public function batches(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $query = StockBatch::where('business_id', $business->id)
            ->with(['product:id,name,sku,unit,buying_price', 'supplier:id,name']);

        if ($request->product_id) {
            $query->where('product_id', $request->product_id);
        }
        if ($request->status) {
            $query->when($request->status === 'expired', fn ($q) => $q->where('expiry_date', '<', now()->startOfDay()))
                ->when($request->status === 'expiring_soon', fn ($q) => $q->whereBetween('expiry_date', [now()->startOfDay(), now()->addDays(90)->endOfDay()]))
                ->when($request->status === 'ok', fn ($q) => $q->where(function ($q) {
                    $q->where('expiry_date', '>', now()->addDays(90))->orWhereNull('expiry_date');
                }));
        }

        $batches = $query->orderByRaw('COALESCE(expiry_date, "9999-12-31") asc')
            ->paginate($request->per_page ?? 20);

        $batches->getCollection()->transform(function ($batch) {
            $batch->expiry_status = $batch->expiry_status;
            $batch->expiry_days = $batch->expiry_date
                ? now()->startOfDay()->diffInDays($batch->expiry_date->startOfDay(), false)
                : null;

            return $batch;
        });

        return response()->json($batches);
    }

    public function storeBatch(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'product_id' => 'required|integer|exists:products,id',
            'batch_number' => 'required|string|max:255',
            'quantity' => 'required|numeric|min:0.01',
            'manufacturing_date' => 'nullable|date',
            'expiry_date' => 'nullable|date|after_or_equal:manufacturing_date',
            'supplier_id' => 'nullable|integer|exists:suppliers,id',
            'warehouse_location' => 'nullable|string|max:255',
            'notes' => 'nullable|string',
        ]);

        $product = Product::where('business_id', $business->id)->findOrFail($validated['product_id']);

        return DB::transaction(function () use ($validated, $product, $request, $business) {
            $existing = StockBatch::where('business_id', $business->id)
                ->where('batch_number', $validated['batch_number'])
                ->first();

            if ($existing && $existing->product_id !== $product->id) {
                return response()->json(['message' => 'Nambari ya batch tayari ipo kwa bidhaa nyingine.'], 422);
            }

            if ($existing) {
                $existing->increment('quantity', $validated['quantity']);
                $batch = $existing;
            } else {
                $batch = StockBatch::create([
                    'business_id' => $business->id,
                    'product_id' => $product->id,
                    'batch_number' => $validated['batch_number'],
                    'quantity' => $validated['quantity'],
                    'manufacturing_date' => $validated['manufacturing_date'] ?? null,
                    'expiry_date' => $validated['expiry_date'] ?? null,
                    'supplier_id' => $validated['supplier_id'] ?? null,
                    'received_at' => now()->toDateString(),
                    'received_by' => $request->user()->id,
                    'warehouse_location' => $validated['warehouse_location'] ?? null,
                    'notes' => $validated['notes'] ?? null,
                ]);
            }

            $product->increment('quantity', $validated['quantity']);

            StockMovement::create([
                'business_id' => $business->id,
                'product_id' => $product->id,
                'batch_id' => $batch->id,
                'type' => 'in',
                'quantity' => $validated['quantity'],
                'unit_cost' => $product->buying_price,
                'balance_after' => (string) ($product->fresh()->quantity),
                'notes' => 'Batch receive: '.$batch->batch_number,
                'moved_by' => $request->user()->id,
            ]);

            return response()->json([
                'message' => 'Batch imesajiliwa.',
                'batch' => $batch->load('product:id,name'),
            ], 201);
        });
    }

    public function stockCounts(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $counts = $business->stockCounts()
            ->with('countedBy:id,first_name,last_name,name')
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($counts);
    }

    public function storeStockCount(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'count_date' => 'required|date',
            'generate_items' => 'nullable|boolean',
            'category_id' => 'nullable|integer|exists:categories,id',
            'notes' => 'nullable|string',
        ]);

        $count = StockCount::create([
            'business_id' => $business->id,
            'name' => $validated['name'],
            'count_date' => $validated['count_date'],
            'status' => StockCount::STATUS_IN_PROGRESS,
            'counted_by' => $request->user()->id,
            'notes' => $validated['notes'] ?? null,
        ]);

        if ($request->boolean('generate_items')) {
            $products = $business->products()
                ->where('is_track_stock', true)
                ->when($validated['category_id'] ?? null, fn ($q, $v) => $q->where('category_id', $v))
                ->select('id', 'quantity')
                ->get();

            foreach ($products as $product) {
                $count->items()->create([
                    'product_id' => $product->id,
                    'expected_quantity' => (int) $product->quantity,
                ]);
            }
            $count->update(['total_items' => $products->count()]);
        }

        return response()->json($count->load('items.product:id,name,unit'), 201);
    }

    public function showStockCount(Request $request, Business $business, StockCount $stockCount)
    {
        $this->authorizeBusiness($request, $business);

        if ($stockCount->business_id !== $business->id) {
            abort(404);
        }

        $stockCount->load([
            'items.product:id,name,sku,unit,image,buying_price,selling_price,low_stock_threshold',
            'countedBy:id,first_name,last_name,name',
        ]);

        return response()->json($stockCount);
    }

    public function updateStockCountItems(Request $request, Business $business, StockCount $stockCount)
    {
        $this->authorizeBusiness($request, $business);

        if ($stockCount->business_id !== $business->id) {
            abort(404);
        }
        if (in_array($stockCount->status, [StockCount::STATUS_APPROVED, StockCount::STATUS_CANCELLED])) {
            return response()->json(['message' => 'Hesabu hii haipokei mabadiliko tena.'], 422);
        }

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|integer|exists:stock_count_items,id',
            'items.*.counted_quantity' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        $counted = 0;
        foreach ($validated['items'] as $item) {
            $countItem = StockCountItem::where('stock_count_id', $stockCount->id)->findOrFail($item['id']);
            $countedQty = isset($item['counted_quantity']) && $item['counted_quantity'] !== '' && $item['counted_quantity'] !== null
                ? (int) $item['counted_quantity'] : null;
            $countItem->update([
                'counted_quantity' => $countedQty,
                'variance' => $countedQty === null ? null : $countedQty - $countItem->expected_quantity,
                'notes' => $item['notes'] ?? null,
            ]);
            if ($countedQty !== null) {
                $counted++;
            }
        }

        $stockCount->update([
            'counted_items' => $counted,
            'status' => $counted === $stockCount->items()->count() ? StockCount::STATUS_COMPLETED : StockCount::STATUS_IN_PROGRESS,
        ]);

        return response()->json($stockCount->load('items.product:id,name,unit'));
    }

    public function approveStockCount(Request $request, Business $business, StockCount $stockCount)
    {
        $this->authorizeBusiness($request, $business);

        if ($stockCount->business_id !== $business->id) {
            abort(404);
        }
        if ($stockCount->status === StockCount::STATUS_APPROVED) {
            return response()->json(['message' => 'Hesabu hii tayari imeidhinishwa.'], 422);
        }
        if ($stockCount->status === StockCount::STATUS_CANCELLED) {
            return response()->json(['message' => 'Hesabu hii imefutwa.'], 422);
        }

        return DB::transaction(function () use ($stockCount, $request) {
            $totalVariance = 0;
            $varianceCount = 0;

            foreach ($stockCount->items as $item) {
                if ($item->counted_quantity === null) {
                    continue;
                }

                $variance = $item->counted_quantity - $item->expected_quantity;
                if ($variance == 0) {
                    continue;
                }

                $product = $item->product;
                if ($variance < 0) {
                    $this->applyOutbound($product, abs($variance), ['notes' => 'Stock count adjustment'], $request->user()->id);
                } else {
                    $this->applyInbound($product, $variance, ['notes' => 'Stock count adjustment'], $request->user()->id);
                }

                $product->refresh();
                StockMovement::create([
                    'business_id' => $stockCount->business_id,
                    'product_id' => $product->id,
                    'type' => 'adjustment',
                    'quantity' => abs($variance),
                    'unit_cost' => $product->buying_price,
                    'balance_after' => (string) $product->quantity,
                    'reference_type' => 'stock_count',
                    'reference_id' => $stockCount->id,
                    'notes' => 'Stock count: '.$stockCount->name.' (variance)',
                    'moved_by' => $request->user()->id,
                ]);

                $totalVariance += $variance * (float) $product->buying_price;
                $varianceCount++;
            }

            $stockCount->update([
                'status' => StockCount::STATUS_APPROVED,
                'total_variance' => $totalVariance,
            ]);

            return response()->json([
                'message' => 'Hesabu imeidhinishwa na stok imesasishwa.',
                'stock_count' => $stockCount->fresh(['items']),
                'variance_count' => $varianceCount,
            ]);
        });
    }

    protected function applyInbound(Product $product, float $quantity, array $data, int $userId)
    {
        $product->increment('quantity', $quantity);

        $batchNumber = $data['batch_number'] ?? null;
        if ($batchNumber) {
            $batch = StockBatch::where('business_id', $product->business_id)
                ->where('product_id', $product->id)
                ->where('batch_number', $batchNumber)
                ->first();
            if ($batch) {
                $batch->increment('quantity', $quantity);
            } else {
                StockBatch::create([
                    'business_id' => $product->business_id,
                    'product_id' => $product->id,
                    'batch_number' => $batchNumber,
                    'quantity' => $quantity,
                    'manufacturing_date' => $data['manufacturing_date'] ?? null,
                    'expiry_date' => $data['expiry_date'] ?? null,
                    'received_at' => now()->toDateString(),
                    'received_by' => $userId,
                    'warehouse_location' => $data['warehouse_location'] ?? null,
                    'notes' => $data['notes'] ?? null,
                ]);
            }
        }
    }

    protected function applyOutbound(Product $product, float $quantity, array $data, int $userId)
    {
        $product->decrement('quantity', $quantity);

        $batch = null;
        if (! empty($data['batch_id'])) {
            $batch = StockBatch::where('business_id', $product->business_id)
                ->where('product_id', $product->id)
                ->find($data['batch_id']);
        }

        $remaining = $quantity;
        if ($batch) {
            $deduct = min($remaining, $batch->quantity);
            $batch->decrement('quantity', $deduct);
            $remaining -= $deduct;
        } else {
            $batches = StockBatch::where('business_id', $product->business_id)
                ->where('product_id', $product->id)
                ->where('quantity', '>', 0)
                ->orderByRaw('COALESCE(expiry_date, "9999-12-31") asc')
                ->get();
            foreach ($batches as $b) {
                if ($remaining <= 0) {
                    break;
                }
                $deduct = min($remaining, $b->quantity);
                $b->decrement('quantity', $deduct);
                $remaining -= $deduct;
            }
        }
    }

    protected function decorate(Product $product)
    {
        $product->stock_level = $product->stock_level;
        $product->stock_value_cost = (float) $product->stock_value_cost;
        $product->stock_value_retail = (float) $product->stock_value_retail;

        return $product;
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
