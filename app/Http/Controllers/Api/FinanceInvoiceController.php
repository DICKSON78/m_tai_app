<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Business;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class FinanceInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $invoices = Invoice::where('business_id', $businessId)
            ->with('customer:id,name')
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->when($request->search, fn($q, $v) => $q->where('invoice_number', 'like', "%{$v}%"))
            ->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 20);
        return response()->json($invoices);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'customer_id' => 'nullable|exists:customers,id',
            'invoice_number' => 'required|string|max:50',
            'date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:date',
            'notes' => 'nullable|string',
            'discount_amount' => 'nullable|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.unit_price' => 'required|numeric|min:0',
            'items.*.tax_rate' => 'nullable|numeric|min:0|max:100',
            'items.*.account_id' => 'nullable|exists:accounts,id',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $invoice = DB::transaction(function () use ($validated, $businessId) {
            $subtotal = 0;
            $taxAmount = 0;
            foreach ($validated['items'] as $item) {
                $lineAmount = $item['quantity'] * $item['unit_price'];
                $subtotal += $lineAmount;
                $taxAmount += $lineAmount * ($item['tax_rate'] ?? 0) / 100;
            }

            $discount = $validated['discount_amount'] ?? 0;
            $total = $subtotal + $taxAmount - $discount;

            $invoice = Invoice::create([
                'business_id' => $businessId,
                'customer_id' => $validated['customer_id'] ?? null,
                'invoice_number' => $validated['invoice_number'],
                'date' => $validated['date'],
                'due_date' => $validated['due_date'],
                'notes' => $validated['notes'] ?? null,
                'subtotal' => $subtotal,
                'tax_amount' => $taxAmount,
                'discount_amount' => $discount,
                'total' => $total,
                'status' => 'draft',
            ]);

            foreach ($validated['items'] as $item) {
                $amount = $item['quantity'] * $item['unit_price'];
                InvoiceItem::create([
                    'invoice_id' => $invoice->id,
                    'description' => $item['description'],
                    'quantity' => $item['quantity'],
                    'unit_price' => $item['unit_price'],
                    'tax_rate' => $item['tax_rate'] ?? 0,
                    'amount' => $amount,
                    'account_id' => $item['account_id'] ?? null,
                ]);
            }

            return $invoice;
        });

        return response()->json($invoice->load('items', 'customer'), 201);
    }

    public function show(Request $request, Invoice $invoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($invoice->business_id !== $businessId) abort(403);
        return response()->json($invoice->load('items', 'customer'));
    }

    public function update(Request $request, Invoice $invoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($invoice->business_id !== $businessId) abort(403);
        $validated = $request->validate([
            'status' => 'sometimes|in:draft,sent,paid,partial,overdue,cancelled',
            'notes' => 'nullable|string',
        ]);
        $invoice->update($validated);
        return response()->json($invoice);
    }

    public function recordPayment(Request $request, Invoice $invoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($invoice->business_id !== $businessId) abort(403);
        $validated = $request->validate(['amount' => 'required|numeric|min:0.01']);
        $invoice->amount_paid += $validated['amount'];
        $invoice->status = $invoice->amount_paid >= $invoice->total ? 'paid' : 'partial';
        $invoice->save();
        return response()->json($invoice);
    }

    public function destroy(Request $request, Invoice $invoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($invoice->business_id !== $businessId) abort(403);
        $invoice->items()->delete();
        $invoice->delete();
        return response()->json(['message' => 'Invoice deleted']);
    }
}
