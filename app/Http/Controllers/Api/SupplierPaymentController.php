<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplierPayment;
use App\Models\SupplierInvoice;
use App\Models\Supplier;
use App\Models\PurchaseOrder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SupplierPaymentController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $payments = SupplierPayment::where('business_id', $businessId)
            ->with(['supplier:id,name,code', 'invoice:invoice_number,total,amount_paid'])
            ->when($request->supplier_id, fn($q, $v) => $q->where('supplier_id', $v))
            ->when($request->method, fn($q, $v) => $q->where('payment_method', $v))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->from_date, fn($q, $v) => $q->where('payment_date', '>=', $v))
            ->when($request->to_date, fn($q, $v) => $q->where('payment_date', '<=', $v))
            ->orderBy($request->sort ?? 'created_at', $request->order ?? 'desc')
            ->paginate($request->per_page ?? 20);

        return response()->json($payments);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'supplier_invoice_id' => 'nullable|exists:supplier_invoices,id',
            'purchase_order_id' => 'nullable|exists:purchase_orders,id',
            'payment_date' => 'required|date',
            'payment_method' => 'required|in:cash,bank_transfer,mobile_money,cheque,card,other',
            'reference_number' => 'nullable|string|max:100',
            'amount' => 'required|numeric|min:0.01',
            'currency' => 'nullable|string|max:3',
            'exchange_rate' => 'nullable|numeric|min:0',
            'withholding_tax' => 'nullable|numeric|min:0',
            'discount_taken' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'bank_account_id' => 'nullable|exists:bank_accounts,id',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $payment = DB::transaction(function () use ($validated, $businessId, $request) {
            $exchangeRate = $validated['exchange_rate'] ?? 1;
            $localAmount = $validated['amount'] * $exchangeRate;

            $validated['business_id'] = $businessId;
            $validated['payment_number'] = $this->generatePaymentNumber($businessId);
            $validated['local_amount'] = $localAmount;
            $validated['received_by'] = $request->user()->id;

            $payment = SupplierPayment::create($validated);

            if (!empty($validated['supplier_invoice_id'])) {
                $invoice = SupplierInvoice::find($validated['supplier_invoice_id']);
                $invoice->increment('amount_paid', $localAmount);
                $balance = $invoice->total - $invoice->amount_paid;
                if ($balance <= 0) {
                    $invoice->update(['status' => 'paid']);
                } elseif ($invoice->amount_paid > 0) {
                    $invoice->update(['status' => 'partial']);
                }
            }

            if (!empty($validated['purchase_order_id'])) {
                $po = PurchaseOrder::find($validated['purchase_order_id']);
                $po->increment('amount_paid', $localAmount);
                $balance = $po->total - $po->amount_paid;
                if ($balance <= 0) {
                    $po->update(['payment_status' => 'paid']);
                } elseif ($po->amount_paid > 0) {
                    $po->update(['payment_status' => 'partial']);
                }
            }

            $supplier = Supplier::find($validated['supplier_id']);
            $supplier->decrement('outstanding_balance', $localAmount);

            return $payment;
        });

        return response()->json($payment->load('supplier', 'invoice'), 201);
    }

    public function show(Request $request, SupplierPayment $supplierPayment)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierPayment->business_id !== $businessId) abort(403);

        $supplierPayment->load(['supplier', 'invoice', 'purchaseOrder', 'bankAccount', 'receiver', 'confirmer']);
        return response()->json($supplierPayment);
    }

    public function confirm(Request $request, SupplierPayment $supplierPayment)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierPayment->business_id !== $businessId) abort(403);

        if ($supplierPayment->status !== 'pending') {
            return response()->json(['message' => 'Only pending payments can be confirmed'], 422);
        }

        $supplierPayment->update([
            'status' => 'confirmed',
            'confirmed_by' => $request->user()->id,
        ]);

        return response()->json($supplierPayment);
    }

    public function destroy(Request $request, SupplierPayment $supplierPayment)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierPayment->business_id !== $businessId) abort(403);

        if ($supplierPayment->status === 'confirmed') {
            return response()->json(['message' => 'Cannot delete confirmed payment. Cancel it first.'], 422);
        }

        DB::transaction(function () use ($supplierPayment) {
            if ($supplierPayment->supplier_invoice_id) {
                $invoice = SupplierInvoice::find($supplierPayment->supplier_invoice_id);
                $invoice->decrement('amount_paid', $supplierPayment->local_amount);
                $invoice->update(['status' => 'validated']);
            }

            if ($supplierPayment->purchase_order_id) {
                $po = PurchaseOrder::find($supplierPayment->purchase_order_id);
                $po->decrement('amount_paid', $supplierPayment->local_amount);
                $po->update(['payment_status' => 'unpaid']);
            }

            $supplier = Supplier::find($supplierPayment->supplier_id);
            $supplier->increment('outstanding_balance', $supplierPayment->local_amount);

            $supplierPayment->delete();
        });

        return response()->json(['message' => 'Payment deleted']);
    }

    public function cancel(Request $request, SupplierPayment $supplierPayment)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplierPayment->business_id !== $businessId) abort(403);

        if ($supplierPayment->status === 'cancelled') {
            return response()->json(['message' => 'Payment already cancelled'], 422);
        }

        DB::transaction(function () use ($supplierPayment) {
            if ($supplierPayment->supplier_invoice_id) {
                $invoice = SupplierInvoice::find($supplierPayment->supplier_invoice_id);
                $invoice->decrement('amount_paid', $supplierPayment->local_amount);
                $invoice->update(['status' => 'validated']);
            }

            if ($supplierPayment->purchase_order_id) {
                $po = PurchaseOrder::find($supplierPayment->purchase_order_id);
                $po->decrement('amount_paid', $supplierPayment->local_amount);
                $po->update(['payment_status' => 'unpaid']);
            }

            $supplier = Supplier::find($supplierPayment->supplier_id);
            $supplier->increment('outstanding_balance', $supplierPayment->local_amount);

            $supplierPayment->update(['status' => 'cancelled']);
        });

        return response()->json($supplierPayment);
    }

    public function summary(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $base = SupplierPayment::where('business_id', $businessId);

        return response()->json([
            'total_payments' => (clone $base)->count(),
            'total_amount' => (clone $base)->where('status', 'confirmed')->sum('local_amount'),
            'pending' => (clone $base)->where('status', 'pending')->sum('local_amount'),
            'this_month' => (clone $base)->whereMonth('payment_date', now()->month)
                ->whereYear('payment_date', now()->year)
                ->where('status', 'confirmed')
                ->sum('local_amount'),
            'by_method' => (clone $base)->where('status', 'confirmed')
                ->selectRaw('payment_method, count(*) as count, sum(local_amount) as total')
                ->groupBy('payment_method')
                ->get(),
        ]);
    }

    private function generatePaymentNumber($businessId): string
    {
        $year = date('Y');
        $last = SupplierPayment::where('business_id', $businessId)
            ->whereYear('created_at', $year)
            ->latest('id')
            ->value('payment_number');
        $number = 1;
        if ($last && preg_match('/SPAY-' . $year . '-(\d+)/', $last, $m)) {
            $number = (int)$m[1] + 1;
        }
        return 'SPAY-' . $year . '-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
