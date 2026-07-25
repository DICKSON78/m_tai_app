<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierInvoice;
use App\Models\SupplierPayment;
use App\Models\Supplier;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $invoices = SupplierInvoice::where('business_id', $businessId)
            ->with('supplier:id,name,code')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->supplier_id, fn($q, $v) => $q->where('supplier_id', $v))
            ->when($request->overdue, fn($q) => $q->where('status', '!=', 'paid')->where('due_date', '<', now()))
            ->when($request->search, function ($q, $v) {
                $q->where(function ($query) use ($v) {
                    $query->where('invoice_number', 'like', "%{$v}%")
                        ->orWhere('supplier_invoice_number', 'like', "%{$v}%");
                });
            })
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'supplier_invoice_number' => 'nullable|string|max:100',
            'subtotal' => 'required|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'withholding_tax' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'payment_terms' => 'nullable|string|max:50',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $validated['business_id'] = $businessId;
        $validated['invoice_number'] = $this->generateInvoiceNumber($businessId);
        $validated['total'] = $validated['subtotal'] - ($validated['discount_amount'] ?? 0) + ($validated['tax_amount'] ?? 0);

        $invoice = SupplierInvoice::create($validated);

        // Update supplier outstanding balance
        $supplier = Supplier::find($validated['supplier_id']);
        $supplier->increment('outstanding_balance', $validated['total']);

        return response()->json($invoice->load('supplier'), 201);
    }

    public function show(Request $request, SupplierInvoice $supplierInvoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierInvoice->business_id !== $businessId) abort(403);

        $supplierInvoice->load(['supplier', 'purchaseOrder', 'payments', 'validator']);

        return response()->json($supplierInvoice);
    }

    public function update(Request $request, SupplierInvoice $supplierInvoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierInvoice->business_id !== $businessId) abort(403);

        if (!in_array($supplierInvoice->status, ['draft'])) {
            return response()->json(['message' => 'Cannot edit validated invoice'], 422);
        }

        $validated = $request->validate([
            'supplier_invoice_number' => 'nullable|string|max:100',
            'due_date' => 'sometimes|date',
            'subtotal' => 'sometimes|numeric|min:0',
            'discount_amount' => 'nullable|numeric|min:0',
            'tax_amount' => 'nullable|numeric|min:0',
            'withholding_tax' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $oldTotal = $supplierInvoice->total;

        if (isset($validated['subtotal'])) {
            $validated['total'] = $validated['subtotal'] - ($validated['discount_amount'] ?? 0) + ($validated['tax_amount'] ?? 0);
        }

        $supplierInvoice->update($validated);

        // Update supplier balance if total changed
        $diff = $supplierInvoice->total - $oldTotal;
        if ($diff != 0) {
            $supplier = Supplier::find($supplierInvoice->supplier_id);
            $supplier->increment('outstanding_balance', $diff);
        }

        return response()->json($supplierInvoice);
    }

    public function validate_(Request $request, SupplierInvoice $supplierInvoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierInvoice->business_id !== $businessId) abort(403);

        if ($supplierInvoice->status !== 'draft') {
            return response()->json(['message' => 'Only draft invoices can be validated'], 422);
        }

        $supplierInvoice->update([
            'status' => 'validated',
            'validated_by' => $request->user()->id,
            'validated_at' => now(),
        ]);

        return response()->json($supplierInvoice);
    }

    public function destroy(Request $request, SupplierInvoice $supplierInvoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierInvoice->business_id !== $businessId) abort(403);

        if (!in_array($supplierInvoice->status, ['draft', 'cancelled'])) {
            return response()->json(['message' => 'Cannot delete invoice with payments'], 422);
        }

        if ($supplierInvoice->payments()->count() > 0) {
            return response()->json(['message' => 'Cannot delete invoice with payments'], 422);
        }

        DB::transaction(function () use ($supplierInvoice) {
            $supplier = Supplier::find($supplierInvoice->supplier_id);
            $supplier->decrement('outstanding_balance', $supplierInvoice->total);
            $supplierInvoice->delete();
        });

        return response()->json(['message' => 'Invoice deleted']);
    }

    public function aging(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $invoices = SupplierInvoice::where('business_id', $businessId)
            ->whereNotIn('status', ['paid', 'cancelled'])
            ->with('supplier:id,name,code')
            ->get();

        $aging = ['current' => 0, '1_30' => 0, '31_60' => 0, '61_90' => 0, 'over_90' => 0];
        $today = now();

        foreach ($invoices as $inv) {
            $days = $inv->due_date->diffInDays($today, false);
            $balance = $inv->total - $inv->amount_paid;

            if ($days <= 0) $aging['current'] += $balance;
            elseif ($days <= 30) $aging['1_30'] += $balance;
            elseif ($days <= 60) $aging['31_60'] += $balance;
            elseif ($days <= 90) $aging['61_90'] += $balance;
            else $aging['over_90'] += $balance;
        }

        return response()->json([
            'aging' => $aging,
            'total_outstanding' => array_sum($aging),
            'invoice_count' => $invoices->count(),
        ]);
    }

    private function generateInvoiceNumber($businessId): string
    {
        $year = date('Y');
        $last = SupplierInvoice::where('business_id', $businessId)
            ->whereYear('created_at', $year)
            ->latest('id')
            ->value('invoice_number');
        $number = 1;
        if ($last && preg_match('/SINV-' . $year . '-(\d+)/', $last, $m)) {
            $number = (int)$m[1] + 1;
        }
        return 'SINV-' . $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
