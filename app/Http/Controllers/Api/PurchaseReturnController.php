<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\PurchaseReturn;
use App\Models\PurchaseReturnItem;
use App\Models\StockMovement;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PurchaseReturnController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $returns = PurchaseReturn::where('business_id', $businessId)
            ->with(['supplier:id,name,code', 'purchaseOrder:id,po_number'])
            ->when($request->status, fn ($q, $v) => $q->where('status', $v))
            ->when($request->supplier_id, fn ($q, $v) => $q->where('supplier_id', $v))
            ->when($request->search, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('return_number', 'like', "%{$v}%")
                        ->orWhere('reason', 'like', "%{$v}%");
                });
            })
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($returns);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'return_date' => 'required|date',
            'reason' => 'required|string|max:255',
            'reason_details' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.reason' => 'nullable|string',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $return = DB::transaction(function () use ($validated, $businessId, $request) {
            $totalAmount = collect($validated['items'])->sum(fn ($item) => $item['quantity'] * $item['unit_price']);

            $pr = PurchaseReturn::create([
                'business_id' => $businessId,
                'supplier_id' => $validated['supplier_id'],
                'purchase_order_id' => $validated['purchase_order_id'] ?? null,
                'return_number' => $this->generateReturnNumber($businessId),
                'return_date' => $validated['return_date'],
                'status' => 'pending',
                'reason' => $validated['reason'],
                'reason_details' => $validated['reason_details'] ?? null,
                'total_amount' => $totalAmount,
                'created_by' => $request->user()->id,
            ]);

            foreach ($validated['items'] as $item) {
                $total = $item['quantity'] * $item['unit_price'];
                $pr->items()->create([
                    'business_id' => $businessId,
                    'product_id' => $item['product_id'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'total' => $total,
                    'reason' => $item['reason'] ?? null,
                ]);
            }

            return $pr;
        });

        return response()->json($return->load('items.product', 'supplier'), 201);
    }

    public function show(Request $request, PurchaseReturn $purchaseReturn)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseReturn->business_id !== $businessId) abort(403);

        $purchaseReturn->load(['items.product', 'supplier', 'purchaseOrder', 'creator', 'approver']);
        return response()->json($purchaseReturn);
    }

    public function approve(Request $request, PurchaseReturn $purchaseReturn)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseReturn->business_id !== $businessId) abort(403);

        if ($purchaseReturn->status !== 'pending') {
            return response()->json(['message' => 'Tonly pending returns can be approved'], 422);
        }

        DB::transaction(function () use ($purchaseReturn, $request) {
            foreach ($purchaseReturn->items as $item) {
                $product = Product::find($item->product_id);
                if ($product) {
                    $product->decrement('quantity', $item->quantity);
                    $product->stockMovements()->create([
                        'business_id' => $purchaseReturn->business_id,
                        'type' => 'purchase_return',
                        'quantity' => -$item->quantity,
                        'balance_after' => (string) $product->fresh()->quantity,
                        'reference_type' => 'purchase_return',
                        'reference_id' => $purchaseReturn->id,
                        'notes' => "Return: {$purchaseReturn->return_number}",
                        'moved_by' => $request->user()->id,
                    ]);
                }
            }

            $purchaseReturn->update([
                'status' => 'approved',
                'approved_by' => $request->user()->id,
            ]);
        });

        return response()->json($purchaseReturn);
    }

    public function reject(Request $request, PurchaseReturn $purchaseReturn)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseReturn->business_id !== $businessId) abort(403);

        if ($purchaseReturn->status !== 'pending') {
            return response()->json(['message' => 'Only pending returns can be rejected'], 422);
        }

        $purchaseReturn->update(['status' => 'rejected']);
        return response()->json($purchaseReturn);
    }

    public function destroy(Request $request, PurchaseReturn $purchaseReturn)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($purchaseReturn->business_id !== $businessId) abort(403);

        if (!in_array($purchaseReturn->status, ['pending'])) {
            return response()->json(['message' => 'Cannot delete processed return'], 422);
        }

        DB::transaction(function () use ($purchaseReturn) {
            $purchaseReturn->items()->delete();
            $purchaseReturn->delete();
        });

        return response()->json(['message' => 'Purchase return deleted']);
    }

    public function summary(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $base = PurchaseReturn::where('business_id', $businessId);

        return response()->json([
            'total_returns' => (clone $base)->count(),
            'pending' => (clone $base)->where('status', 'pending')->count(),
            'approved' => (clone $base)->where('status', 'approved')->count(),
            'rejected' => (clone $base)->where('status', 'rejected')->count(),
            'total_value' => (clone $base)->where('status', 'approved')->sum('total_amount'),
        ]);
    }

    private function generateReturnNumber($businessId): string
    {
        $year = date('Y');
        $last = PurchaseReturn::where('business_id', $businessId)
            ->whereYear('created_at', $year)
            ->latest('id')
            ->value('return_number');
        $number = 1;
        if ($last && preg_match('/PR-' . $year . '-(\d+)/', $last, $m)) {
            $number = (int)$m[1] + 1;
        }
        return 'PR-' . $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
