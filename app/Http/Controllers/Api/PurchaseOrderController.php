<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\SupplierInvoice;
use App\Models\SupplierPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseOrderController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $orders = PurchaseOrder::where('business_id', $businessId)
            ->with('supplier:id,name,code')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->payment_status, fn($q, $v) => $q->where('payment_status', $v))
            ->when($request->supplier_id, fn($q, $v) => $q->where('supplier_id', $v))
            ->when($request->from_date, fn($q, $v) => $q->where('order_date', '>=', $v))
            ->when($request->to_date, fn($q, $v) => $q->where('order_date', '<=', $v))
            ->when($request->search, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('po_number', 'like', "%{$v}%")
                        ->orWhere('notes', 'like', "%{$v}%");
                });
            })
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($orders);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'order_date' => 'required|date',
            'expected_date' => 'nullable|date|after_or_equal:order_date',
            'currency' => 'nullable|string|max:3',
            'discount_amount' => 'nullable|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.description' => 'nullable|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.discount_percent' => 'nullable|numeric|min:0|max:100',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.unit' => 'nullable|string',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $order = DB::transaction(function () use ($validated, $businessId, $request) {
            $po = PurchaseOrder::create([
                'business_id' => $businessId,
                'supplier_id' => $validated['supplier_id'],
                'po_number' => $this->generatePoNumber($businessId),
                'status' => 'draft',
                'order_date' => $validated['order_date'],
                'expected_date' => $validated['expected_date'] ?? null,
                'currency' => $validated['currency'] ?? 'TZS',
                'discount_amount' => $validated['discount_amount'] ?? 0,
                'shipping_cost' => $validated['shipping_cost'] ?? 0,
                'notes' => $validated['notes'] ?? null,
                'terms_conditions' => $validated['terms_conditions'] ?? null,
                'created_by' => $request->user()->id,
            ]);

            $subtotal = 0;
            $totalTax = 0;

            foreach ($validated['items'] as $item) {
                $lineSubtotal = $item['quantity'] * $item['unit_price'];
                $lineDiscount = $lineSubtotal * (($item['discount_percent'] ?? 0) / 100);
                $lineAfterDiscount = $lineSubtotal - $lineDiscount;
                $lineTax = $lineAfterDiscount * (($item['tax_rate'] ?? 0) / 100);
                $lineTotal = $lineAfterDiscount + $lineTax;

                $po->items()->create([
                    'business_id' => $businessId,
                    'product_id' => $item['product_id'],
                    'description' => $item['description'] ?? null,
                    'quantity' => $item['quantity'],
                    'received_quantity' => 0,
                    'unit_price' => $item['unit_price'],
                    'discount_percent' => $item['discount_percent'] ?? 0,
                    'discount_amount' => $lineDiscount,
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'tax_amount' => $lineTax,
                    'subtotal' => $lineAfterDiscount,
                    'total' => $lineTotal,
                    'unit' => $item['unit'] ?? null,
                ]);

                $subtotal += $lineAfterDiscount;
                $totalTax += $lineTax;
            }

            $po->update([
                'subtotal' => $subtotal,
                'tax_amount' => $totalTax,
                'total' => $subtotal + $totalTax - ($po->discount_amount) + ($po->shipping_cost),
            ]);

            return $po;
        });

        return response()->json($order->load('items.product', 'supplier'), 201);
    }

    public function show(Request $request, PurchaseOrder $purchaseOrder)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseOrder->business_id !== $businessId) abort(403);

        $purchaseOrder->load([
            'items.product',
            'supplier',
            'receptions' => fn($q) => $q->latest()->limit(10),
            'receptions.items',
            'invoices',
            'payments',
            'creator',
            'approver',
        ]);

        return response()->json($purchaseOrder);
    }

    public function update(Request $request, PurchaseOrder $purchaseOrder)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseOrder->business_id !== $businessId) abort(403);

        if (!in_array($purchaseOrder->status, ['draft', 'sent'])) {
            return response()->json(['message' => 'Cannot edit order in current status'], 422);
        }

        $validated = $request->validate([
            'supplier_id' => 'sometimes|exists:suppliers,id',
            'expected_date' => 'nullable|date',
            'discount_amount' => 'nullable|numeric|min:0',
            'shipping_cost' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'terms_conditions' => 'nullable|string',
        ]);

        $purchaseOrder->update($validated);
        return response()->json($purchaseOrder->load('items.product', 'supplier'));
    }

    public function destroy(Request $request, PurchaseOrder $purchaseOrder)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseOrder->business_id !== $businessId) abort(403);

        if (!in_array($purchaseOrder->status, ['draft', 'cancelled'])) {
            return response()->json(['message' => 'Cannot delete order in current status'], 422);
        }

        DB::transaction(function () use ($purchaseOrder) {
            $purchaseOrder->items()->delete();
            $purchaseOrder->delete();
        });

        return response()->json(['message' => 'Purchase order deleted']);
    }

    public function approve(Request $request, PurchaseOrder $purchaseOrder)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseOrder->business_id !== $businessId) abort(403);

        if ($purchaseOrder->status !== 'draft') {
            return response()->json(['message' => 'Only draft orders can be approved'], 422);
        }

        $purchaseOrder->update([
            'approval_status' => 'approved',
            'status' => 'sent',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        return response()->json($purchaseOrder);
    }

    public function confirm(Request $request, PurchaseOrder $purchaseOrder)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseOrder->business_id !== $businessId) abort(403);

        if ($purchaseOrder->status !== 'sent') {
            return response()->json(['message' => 'Only sent orders can be confirmed'], 422);
        }

        $purchaseOrder->update(['status' => 'confirmed']);
        return response()->json($purchaseOrder);
    }

    public function cancel(Request $request, PurchaseOrder $purchaseOrder)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseOrder->business_id !== $businessId) abort(403);

        if (in_array($purchaseOrder->status, ['received', 'cancelled'])) {
            return response()->json(['message' => 'Cannot cancel order in current status'], 422);
        }

        $purchaseOrder->update(['status' => 'cancelled']);
        return response()->json($purchaseOrder);
    }

    public function summary(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $base = PurchaseOrder::where('business_id', $businessId);

        return response()->json([
            'total_orders' => (clone $base)->count(),
            'draft' => (clone $base)->where('status', 'draft')->count(),
            'sent' => (clone $base)->where('status', 'sent')->count(),
            'confirmed' => (clone $base)->where('status', 'confirmed')->count(),
            'received' => (clone $base)->where('status', 'received')->count(),
            'cancelled' => (clone $base)->where('status', 'cancelled')->count(),
            'total_value' => (clone $base)->whereNotIn('status', ['cancelled'])->sum('total'),
            'total_paid' => (clone $base)->sum('amount_paid'),
            'total_outstanding' => (clone $base)->whereNotIn('status', ['cancelled'])->sum(DB::raw('total - amount_paid')),
            'overdue' => (clone $base)->where('status', 'confirmed')
                ->where('expected_date', '<', now())
                ->where('status', '!=', 'received')
                ->count(),
        ]);
    }

    private function generatePoNumber($businessId): string
    {
        $year = date('Y');
        $last = PurchaseOrder::where('business_id', $businessId)
            ->whereYear('created_at', $year)
            ->latest('id')
            ->value('po_number');
        $number = 1;
        if ($last && preg_match('/PO-' . $year . '-(\d+)/', $last, $m)) {
            $number = (int)$m[1] + 1;
        }
        return 'PO-' . $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
