<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BillOfMaterial;
use App\Models\WorkOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ManufacturingController extends Controller
{
    private function businessId(Request $r): int
    {
        return $r->user()->current_business_id ?? $r->user()->businesses()->first()?->id;
    }

    // ── BOM ────────────────────────────────────────────

    public function boms(Request $request)
    {
        $q = BillOfMaterial::where('business_id', $this->businessId($request))
            ->with('product:id,name,unit')
            ->withCount('items');

        if ($request->status) {
            $q->where('status', $request->status);
        }
        if ($request->search) {
            $q->where('name', 'like', "%{$request->search}%");
        }

        return response()->json($q->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    public function storeBom(Request $request)
    {
        $v = $request->validate([
            'name' => 'required|string|max:255',
            'product_id' => 'required|exists:products,id',
            'description' => 'nullable|string',
            'estimated_cost' => 'nullable|numeric|min:0',
            'quantity_per_build' => 'nullable|integer|min:1',
            'items' => 'nullable|array',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.quantity' => 'required_with:items|numeric|min:0.001',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        $bid = $this->businessId($request);
        $code = 'BOM-'.strtoupper(Str::random(6));

        $bom = BillOfMaterial::create([
            'business_id' => $bid,
            'name' => $v['name'],
            'code' => $code,
            'product_id' => $v['product_id'],
            'description' => $v['description'] ?? null,
            'estimated_cost' => $v['estimated_cost'] ?? 0,
            'quantity_per_build' => $v['quantity_per_build'] ?? 1,
            'status' => 'draft',
        ]);

        if (! empty($v['items'])) {
            foreach ($v['items'] as $item) {
                $bom->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        }

        return response()->json($bom->load('items.product:id,name,unit,buying_price'), 201);
    }

    public function showBom(BillOfMaterial $bom)
    {
        return response()->json($bom->load('items.product:id,name,unit,buying_price', 'product:id,name,unit'));
    }

    public function updateBom(Request $request, BillOfMaterial $bom)
    {
        $v = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'estimated_cost' => 'nullable|numeric|min:0',
            'status' => 'sometimes|in:draft,active,archived',
            'items' => 'nullable|array',
            'items.*.product_id' => 'required_with:items|exists:products,id',
            'items.*.quantity' => 'required_with:items|numeric|min:0.001',
            'items.*.unit_cost' => 'nullable|numeric|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        $bom->update(collect($v)->only(['name', 'description', 'estimated_cost', 'status'])->toArray());

        if (isset($v['items'])) {
            $bom->items()->delete();
            foreach ($v['items'] as $item) {
                $bom->items()->create([
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_cost' => $item['unit_cost'] ?? 0,
                    'notes' => $item['notes'] ?? null,
                ]);
            }
        }

        return response()->json($bom->load('items.product:id,name,unit,buying_price'));
    }

    public function destroyBom(BillOfMaterial $bom)
    {
        $bom->items()->delete();
        $bom->delete();

        return response()->json(['message' => 'BOM deleted']);
    }

    // ── Work Orders ────────────────────────────────────

    public function workOrders(Request $request)
    {
        $q = WorkOrder::where('business_id', $this->businessId($request))
            ->with('billOfMaterial:id,name,code');

        if ($request->status) {
            $q->where('status', $request->status);
        }
        if ($request->search) {
            $q->where('order_number', 'like', "%{$request->search}%");
        }

        return response()->json($q->orderByDesc('created_at')->paginate($request->per_page ?? 20));
    }

    public function storeWorkOrder(Request $request)
    {
        $v = $request->validate([
            'product_name' => 'required|string|max:255',
            'bill_of_material_id' => 'nullable|exists:bill_of_materials,id',
            'quantity_planned' => 'required|integer|min:1',
            'estimated_cost' => 'nullable|numeric|min:0',
            'planned_start' => 'nullable|date',
            'planned_end' => 'nullable|date|after_or_equal:planned_start',
            'notes' => 'nullable|string',
        ]);

        $bid = $this->businessId($request);
        $orderNumber = 'WO-'.strtoupper(Str::random(6));

        $wo = WorkOrder::create(array_merge($v, [
            'business_id' => $bid,
            'order_number' => $orderNumber,
            'status' => 'planned',
        ]));

        return response()->json($wo->load('billOfMaterial:id,name,code'), 201);
    }

    public function showWorkOrder(WorkOrder $workOrder)
    {
        return response()->json($workOrder->load('billOfMaterial:id,name,code'));
    }

    public function updateWorkOrder(Request $request, WorkOrder $workOrder)
    {
        $v = $request->validate([
            'status' => 'sometimes|in:draft,planned,in_progress,on_hold,completed,cancelled',
            'quantity_completed' => 'nullable|integer|min:0',
            'quantity_scrapped' => 'nullable|integer|min:0',
            'actual_cost' => 'nullable|numeric|min:0',
            'actual_start' => 'nullable|date',
            'actual_end' => 'nullable|date',
            'notes' => 'nullable|string',
        ]);

        if (isset($v['status'])) {
            if ($v['status'] === 'in_progress' && ! $workOrder->actual_start) {
                $v['actual_start'] = now()->toDateString();
            }
            if ($v['status'] === 'completed' && ! $workOrder->actual_end) {
                $v['actual_end'] = now()->toDateString();
                $v['quantity_completed'] = $v['quantity_completed'] ?? $workOrder->quantity_planned;
            }
        }

        $workOrder->update($v);

        return response()->json($workOrder->load('billOfMaterial:id,name,code'));
    }

    public function destroyWorkOrder(WorkOrder $workOrder)
    {
        $workOrder->delete();

        return response()->json(['message' => 'Work order deleted']);
    }

    // ── Summary ────────────────────────────────────────

    public function summary(Request $request)
    {
        $bid = $this->businessId($request);

        return response()->json([
            'total_boms' => BillOfMaterial::where('business_id', $bid)->count(),
            'active_boms' => BillOfMaterial::where('business_id', $bid)->where('status', 'active')->count(),
            'total_work_orders' => WorkOrder::where('business_id', $bid)->count(),
            'planned_orders' => WorkOrder::where('business_id', $bid)->where('status', 'planned')->count(),
            'in_progress_orders' => WorkOrder::where('business_id', $bid)->where('status', 'in_progress')->count(),
            'completed_orders' => WorkOrder::where('business_id', $bid)->where('status', 'completed')->count(),
            'total_produced' => WorkOrder::where('business_id', $bid)->sum('quantity_completed'),
            'total_scrapped' => WorkOrder::where('business_id', $bid)->sum('quantity_scrapped'),
        ]);
    }
}
