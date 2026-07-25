<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseReception;
use App\Models\PurchaseReceptionItem;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseReceptionController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $receptions = PurchaseReception::where('business_id', $businessId)
            ->with(['supplier:id,name,code', 'purchaseOrder:id,po_number'])
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->supplier_id, fn($q, $v) => $q->where('supplier_id', $v))
            ->when($request->search, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('grn_number', 'like', "%{$v}%");
                });
            })
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($receptions);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'purchase_order_id' => 'required|exists:purchase_orders,id',
            'reception_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.purchase_order_item_id' => 'required|exists:purchase_order_items,id',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.received_quantity' => 'required|numeric|min:0',
            'items.*.accepted_quantity' => 'required|numeric|min:0',
            'items.*.rejected_quantity' => 'nullable|numeric|min:0',
            'items.*.inspection_status' => 'nullable|in:pending,passed,failed,partial',
            'items.*.rejection_reason' => 'nullable|string',
            'items.*.batch_number' => 'nullable|string',
            'items.*.expiry_date' => 'nullable|date',
            'items.*.warehouse_location' => 'nullable|string',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $po = PurchaseOrder::findOrFail($validated['purchase_order_id']);
        if ($po->business_id !== $businessId) abort(403);

        $reception = DB::transaction(function () use ($validated, $businessId, $po, $request) {
            $grn = PurchaseReception::create([
                'business_id' => $businessId,
                'purchase_order_id' => $validated['purchase_order_id'],
                'supplier_id' => $po->supplier_id,
                'grn_number' => $this->generateGrnNumber($businessId),
                'reception_date' => $validated['reception_date'],
                'notes' => $validated['notes'] ?? null,
                'received_by' => $request->user()->id,
            ]);

            $totalQty = 0;
            $totalAccepted = 0;
            $totalRejected = 0;

            foreach ($validated['items'] as $item) {
                $rejected = $item['rejected_quantity'] ?? ($item['received_quantity'] - $item['accepted_quantity']);
                $inspectionStatus = $item['inspection_status'] ?? (
                    $rejected > 0 ? 'partial' : 'passed'
                );

                $grn->items()->create([
                    'business_id' => $businessId,
                    'purchase_order_item_id' => $item['purchase_order_item_id'],
                    'product_id' => $item['product_id'],
                    'ordered_quantity' => PurchaseOrderItem::find($item['purchase_order_item_id'])->quantity,
                    'received_quantity' => $item['received_quantity'],
                    'accepted_quantity' => $item['accepted_quantity'],
                    'rejected_quantity' => $rejected,
                    'inspection_status' => $inspectionStatus,
                    'rejection_reason' => $item['rejection_reason'] ?? null,
                    'batch_number' => $item['batch_number'] ?? null,
                    'expiry_date' => $item['expiry_date'] ?? null,
                    'warehouse_location' => $item['warehouse_location'] ?? null,
                ]);

                // Update PO item received quantity
                $poItem = PurchaseOrderItem::find($item['purchase_order_item_id']);
                $poItem->increment('received_quantity', $item['received_quantity']);

                // Update product stock
                $product = Product::find($item['product_id']);
                $product->increment('quantity', $item['accepted_quantity']);

                // Create stock movement
                $product->stockMovements()->create([
                    'business_id' => $businessId,
                    'type' => 'in',
                    'quantity' => $item['accepted_quantity'],
                    'reference' => $grn->grn_number,
                    'notes' => "PO Reception: {$po->po_number}",
                ]);

                $totalQty += $item['received_quantity'];
                $totalAccepted += $item['accepted_quantity'];
                $totalRejected += $rejected;
            }

            $grn->update([
                'total_quantity' => $totalQty,
                'total_accepted' => $totalAccepted,
                'total_rejected' => $totalRejected,
            ]);

            // Update PO status
            $this->updatePoStatus($po);

            return $grn;
        });

        return response()->json($reception->load('items.product', 'supplier'), 201);
    }

    public function show(Request $request, PurchaseReception $purchaseReception)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseReception->business_id !== $businessId) abort(403);

        $purchaseReception->load([
            'items.product',
            'items.purchaseOrderItem',
            'supplier',
            'purchaseOrder',
            'receiver',
            'inspector',
        ]);

        return response()->json($purchaseReception);
    }

    public function confirm(Request $request, PurchaseReception $purchaseReception)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseReception->business_id !== $businessId) abort(403);

        if ($purchaseReception->status !== 'draft') {
            return response()->json(['message' => 'Only draft receptions can be confirmed'], 422);
        }

        $purchaseReception->update(['status' => 'confirmed']);
        return response()->json($purchaseReception);
    }

    public function destroy(Request $request, PurchaseReception $purchaseReception)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseReception->business_id !== $businessId) abort(403);

        if ($purchaseReception->status !== 'draft') {
            return response()->json(['message' => 'Cannot delete confirmed reception'], 422);
        }

        DB::transaction(function () use ($purchaseReception) {
            // Reverse stock for each item
            foreach ($purchaseReception->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->decrement('quantity', $item->accepted_quantity);
                    $product->stockMovements()->create([
                        'business_id' => $purchaseReception->business_id,
                        'type' => 'out',
                        'quantity' => $item->accepted_quantity,
                        'reference' => $purchaseReception->grn_number,
                        'notes' => "Reception reversal",
                    ]);
                }

                // Reverse PO item received quantity
                $poItem = PurchaseOrderItem::find($item->purchase_order_item_id);
                if ($poItem) {
                    $poItem->decrement('received_quantity', $item->received_quantity);
                }
            }

            $po = $purchaseReception->purchaseOrder;
            $purchaseReception->items()->delete();
            $purchaseReception->delete();
            $this->updatePoStatus($po);
        });

        return response()->json(['message' => 'Reception deleted']);
    }

    private function updatePoStatus(PurchaseOrder $po)
    {
        $totalQty = $po->items->sum('quantity');
        $receivedQty = $po->items->sum('received_quantity');

        if ($receivedQty == 0) {
            $po->update(['status' => 'confirmed']);
        } elseif ($receivedQty >= $totalQty) {
            $po->update(['status' => 'received', 'received_date' => now()]);
        } else {
            $po->update(['status' => 'partially_received']);
        }
    }

    private function generateGrnNumber($businessId): string
    {
        $year = date('Y');
        $last = PurchaseReception::where('business_id', $businessId)
            ->whereYear('created_at', $year)
            ->latest('id')
            ->value('grn_number');
        $number = 1;
        if ($last && preg_match('/GRN-' . $year . '-(\d+)/', $last, $m)) {
            $number = (int)$m[1] + 1;
        }
        return 'GRN-' . $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
