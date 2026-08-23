<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BinLocation;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\Warehouse;
use App\Models\WarehouseTransfer;
use App\Models\WarehouseZone;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class WarehouseController extends Controller
{
    private function businessId(Request $r): int
    {
        return $r->user()->current_business_id ?? $r->user()->businesses()->first()?->id;
    }

    // ── Warehouses ─────────────────────────────────────

    public function warehouses(Request $request)
    {
        $q = Warehouse::where('business_id', $this->businessId($request))->withCount('zones');

        if ($request->status) {
            $q->where('status', $request->status);
        }
        if ($request->search) {
            $q->where('name', 'like', "%{$request->search}%");
        }

        return response()->json($q->orderBy('name')->paginate($request->per_page ?? 20));
    }

    public function storeWarehouse(Request $request)
    {
        $v = $request->validate([
            'name' => 'required|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'manager_name' => 'nullable|string|max:255',
            'total_capacity' => 'nullable|numeric|min:0',
        ]);

        $bid = $this->businessId($request);
        $code = 'WH-'.strtoupper(Str::random(4));

        $wh = Warehouse::create(array_merge($v, [
            'business_id' => $bid,
            'code' => $code,
            'status' => 'active',
        ]));

        return response()->json($wh, 201);
    }

    public function showWarehouse(Warehouse $warehouse)
    {
        return response()->json($warehouse->load('zones.binLocations.product:id,name,unit'));
    }

    public function updateWarehouse(Request $request, Warehouse $warehouse)
    {
        $v = $request->validate([
            'name' => 'sometimes|string|max:255',
            'address' => 'nullable|string|max:255',
            'city' => 'nullable|string|max:100',
            'phone' => 'nullable|string|max:50',
            'manager_name' => 'nullable|string|max:255',
            'total_capacity' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:active,inactive',
        ]);
        $warehouse->update($v);

        return response()->json($warehouse);
    }

    public function destroyWarehouse(Warehouse $warehouse)
    {
        $warehouse->zones()->each(function ($zone) {
            $zone->binLocations()->delete();
            $zone->delete();
        });
        $warehouse->delete();

        return response()->json(['message' => 'Warehouse deleted']);
    }

    // ── Zones ──────────────────────────────────────────

    public function storeZone(Request $request, Warehouse $warehouse)
    {
        $v = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'description' => 'nullable|string',
            'capacity' => 'nullable|numeric|min:0',
            'temperature' => 'sometimes|in:ambient,cold,frozen',
        ]);
        $v['code'] = $v['code'] ?? strtoupper(substr($v['name'], 0, 4));
        $zone = $warehouse->zones()->create($v);

        return response()->json($zone, 201);
    }

    public function updateZone(WarehouseZone $zone)
    {
        $v = request()->validate([
            'name' => 'sometimes|string|max:255',
            'capacity' => 'nullable|numeric|min:0',
            'temperature' => 'sometimes|in:ambient,cold,frozen',
        ]);
        $zone->update($v);

        return response()->json($zone);
    }

    public function destroyZone(WarehouseZone $zone)
    {
        $zone->binLocations()->delete();
        $zone->delete();

        return response()->json(['message' => 'Zone deleted']);
    }

    // ── Bin Locations ──────────────────────────────────

    public function storeBinLocation(Request $request, WarehouseZone $zone)
    {
        $v = $request->validate([
            'code' => 'required|string|max:50',
            'name' => 'nullable|string|max:255',
            'product_id' => 'nullable|exists:products,id',
            'min_quantity' => 'nullable|integer|min:0',
            'max_quantity' => 'nullable|integer|min:0',
        ]);
        $v['quantity'] = 0;
        $bin = $zone->binLocations()->create($v);

        return response()->json($bin, 201);
    }

    public function destroyBinLocation(BinLocation $bin)
    {
        $bin->delete();

        return response()->json(['message' => 'Bin location deleted']);
    }

    // ── Transfers ──────────────────────────────────────

    public function transfers(Request $request)
    {
        $q = WarehouseTransfer::where('business_id', $this->businessId($request))
            ->with('product:id,name,unit', 'fromWarehouse:id,name,code', 'toWarehouse:id,name,code');

        if ($request->status) {
            $q->where('status', $request->status);
        }

        return response()->json($q->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    public function storeTransfer(Request $request)
    {
        $v = $request->validate([
            'product_id' => 'required|exists:products,id',
            'from_warehouse_id' => 'nullable|exists:warehouses,id',
            'to_warehouse_id' => 'nullable|exists:warehouses,id',
            'quantity' => 'required|integer|min:1',
            'transfer_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $bid = $this->businessId($request);
        $v['business_id'] = $bid;
        $v['reference_number'] = 'TRF-'.strtoupper(Str::random(6));
        $v['status'] = 'pending';

        $transfer = WarehouseTransfer::create($v);

        return response()->json($transfer->load('product:id,name', 'fromWarehouse:id,name', 'toWarehouse:id,name'), 201);
    }

    public function confirmTransfer(WarehouseTransfer $transfer)
    {
        \DB::transaction(function () use ($transfer) {
            $product = Product::findOrFail($transfer->product_id);
            $qty = (int) $transfer->quantity;

            if ($transfer->from_warehouse_id && $product->quantity < $qty) {
                abort(422, 'Stock haitoshi kwa transfer hii');
            }

            if ($transfer->from_warehouse_id) {
                $product->decrement('quantity', $qty);
                StockMovement::create([
                    'business_id' => $transfer->business_id,
                    'product_id' => $transfer->product_id,
                    'type' => 'transfer',
                    'quantity' => -$qty,
                    'unit_cost' => $product->buying_price,
                    'balance_after' => $product->quantity,
                    'reference_type' => WarehouseTransfer::class,
                    'reference_id' => $transfer->id,
                    'notes' => "Transfer out to warehouse #{$transfer->to_warehouse_id}",
                ]);
            }

            if ($transfer->to_warehouse_id) {
                $product->increment('quantity', $qty);
                StockMovement::create([
                    'business_id' => $transfer->business_id,
                    'product_id' => $transfer->product_id,
                    'type' => 'transfer',
                    'quantity' => $qty,
                    'unit_cost' => $product->buying_price,
                    'balance_after' => $product->quantity,
                    'reference_type' => WarehouseTransfer::class,
                    'reference_id' => $transfer->id,
                    'notes' => "Transfer in from warehouse #{$transfer->from_warehouse_id}",
                ]);
            }

            $transfer->update(['status' => 'received', 'received_date' => now()->toDateString()]);
        });

        return response()->json($transfer);
    }

    public function cancelTransfer(WarehouseTransfer $transfer)
    {
        $transfer->update(['status' => 'cancelled']);

        return response()->json($transfer);
    }

    public function destroyTransfer(WarehouseTransfer $transfer)
    {
        $transfer->delete();

        return response()->json(['message' => 'Transfer deleted']);
    }

    // ── Summary ────────────────────────────────────────

    public function summary(Request $request)
    {
        $bid = $this->businessId($request);

        return response()->json([
            'total_warehouses' => Warehouse::where('business_id', $bid)->count(),
            'active_warehouses' => Warehouse::where('business_id', $bid)->where('status', 'active')->count(),
            'total_zones' => WarehouseZone::whereIn('warehouse_id', Warehouse::where('business_id', $bid)->pluck('id'))->count(),
            'total_bin_locations' => BinLocation::whereIn('warehouse_zone_id',
                WarehouseZone::whereIn('warehouse_id', Warehouse::where('business_id', $bid)->pluck('id'))->pluck('id')
            )->count(),
            'total_products_stored' => BinLocation::whereIn('warehouse_zone_id',
                WarehouseZone::whereIn('warehouse_id', Warehouse::where('business_id', $bid)->pluck('id'))->pluck('id')
            )->whereNotNull('product_id')->distinct('product_id')->count('product_id'),
            'pending_transfers' => WarehouseTransfer::where('business_id', $bid)->where('status', 'pending')->count(),
            'in_transit' => WarehouseTransfer::where('business_id', $bid)->where('status', 'in_transit')->count(),
            'total_transfers' => WarehouseTransfer::where('business_id', $bid)->count(),
        ]);
    }
}
