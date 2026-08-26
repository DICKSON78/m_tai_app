<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Business;
use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\Dompdf\Facade\Pdf;

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
            'currency_code' => 'nullable|string|size:3',
            'exchange_rate' => 'nullable|numeric|min:0',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $currencyCode = strtoupper($validated['currency_code'] ?? 'TZS');
        $exchangeRate = (float) ($validated['exchange_rate'] ?? 1);
        $currencyId = null;

        if ($currencyCode !== 'TZS') {
            $currency = Currency::where('code', $currencyCode)->where('is_active', true)->first();
            if (! $currency) {
                return response()->json(['message' => "Currency '{$currencyCode}' is not supported."], 422);
            }
            $currencyId = $currency->id;

            if (! isset($validated['exchange_rate'])) {
                $baseCurrency = Currency::where('is_base', true)->first();
                $rate = $baseCurrency
                    ? \App\Models\ExchangeRate::where('business_id', $businessId)
                        ->where('from_currency', $baseCurrency->code)
                        ->where('to_currency', $currencyCode)
                        ->where('is_active', true)
                        ->latest('effective_date')
                        ->first()
                    : null;
                $exchangeRate = $rate ? (float) $rate->rate : 1;
            }
        }

        $invoice = DB::transaction(function () use ($validated, $businessId, $currencyId, $currencyCode, $exchangeRate) {
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
                'currency_id' => $currencyId,
                'currency_code' => $currencyCode,
                'exchange_rate' => $exchangeRate,
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

    public function generatePdf(Request $request, Invoice $invoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($invoice->business_id !== $businessId) abort(403);

        $invoice->load(['items', 'customer', 'business']);

        $html = $this->buildInvoiceHtml($invoice);

        $pdf = Pdf::loadHtml($html)
            ->setPaper('a4', 'portrait')
            ->setOption('isRemoteEnabled', true);

        return $pdf->download("invoice-{$invoice->invoice_number}.pdf");
    }

    public function printInvoice(Request $request, Invoice $invoice)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($invoice->business_id !== $businessId) abort(403);

        $invoice->load(['items', 'customer', 'business']);

        $html = $this->buildInvoiceHtml($invoice);

        return response($html)->header('Content-Type', 'text/html');
    }

    private function buildInvoiceHtml(Invoice $invoice)
    {
        $e = fn($v) => htmlspecialchars((string) $v, ENT_QUOTES, 'UTF-8');

        $businessName = $e($invoice->business->name);
        $businessCode = $e($invoice->business->business_code);
        $businessAddress = $e(
            $invoice->business->street
                ? $invoice->business->street . ', ' . ($invoice->business->ward ?? '') . ', ' . ($invoice->business->district ?? '')
                : ($invoice->business->district ?? '')
        );
        $businessPhone = $e($invoice->business->user->phone ?? '');

        $invoiceNumber = $e($invoice->invoice_number);
        $invoiceDate = $e($invoice->date->format('d/m/Y'));
        $dueDate = $e($invoice->due_date->format('d/m/Y'));
        $status = $e(ucfirst($invoice->status));
        $customerName = $e($invoice->customer->name ?? 'N/A');
        $notes = $e($invoice->notes ?? '');

        $rows = '';
        foreach ($invoice->items as $item) {
            $desc = $e($item->description);
            $qty = $e(number_format($item->quantity, 2));
            $price = $e(number_format($item->unit_price, 2));
            $taxRate = $e(number_format($item->tax_rate, 1));
            $amount = $e(number_format($item->amount, 2));
            $rows .= "<tr>
                <td>{$desc}</td>
                <td style='text-align:right'>{$qty}</td>
                <td style='text-align:right'>{$price}</td>
                <td style='text-align:right'>{$taxRate}%</td>
                <td style='text-align:right'>TZS {$amount}</td>
            </tr>";
        }

        $discountLine = '';
        if ((float) $invoice->discount_amount > 0) {
            $disc = $e(number_format($invoice->discount_amount, 2));
            $discountLine = "<tr><td colspan='4'>Discount</td><td style='text-align:right'>-TZS {$disc}</td></tr>";
        }

        $subtotal = $e(number_format($invoice->subtotal, 2));
        $taxAmount = $e(number_format($invoice->tax_amount, 2));
        $total = $e(number_format($invoice->total, 2));
        $amountPaid = $e(number_format($invoice->amount_paid, 2));
        $balance = $e(number_format($invoice->total - $invoice->amount_paid, 2));

        $notesBlock = $notes ? "<div class='footer'><strong>Notes:</strong> {$notes}</div>" : '';

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: sans-serif; font-size: 13px; max-width: 700px; margin: 0 auto; color: #333; }
        .header { display: flex; justify-content: space-between; margin-bottom: 20px; }
        .header-left h1 { margin: 0 0 5px 0; font-size: 20px; color: #2563eb; }
        .header-left p { margin: 2px 0; font-size: 12px; color: #666; }
        .header-right { text-align: right; }
        .header-right .invoice-label { font-size: 28px; font-weight: bold; color: #2563eb; text-transform: uppercase; }
        .info-grid { display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f9fafb; border-radius: 6px; }
        .info-block h3 { margin: 0 0 5px 0; font-size: 11px; text-transform: uppercase; color: #999; }
        .info-block p { margin: 2px 0; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        th { background: #2563eb; color: #fff; padding: 10px 8px; text-align: left; font-size: 12px; text-transform: uppercase; }
        th:last-child { text-align: right; }
        td { padding: 8px; border-bottom: 1px solid #e5e7eb; }
        .totals { margin-left: auto; width: 280px; }
        .totals table td { padding: 5px 8px; }
        .totals .total-row td { font-weight: bold; font-size: 16px; border-top: 2px solid #2563eb; color: #2563eb; }
        .footer { margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 11px; color: #999; text-align: center; }
        .status-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: bold; text-transform: uppercase; }
        .status-draft { background: #fef3c7; color: #92400e; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        .status-cancelled { background: #f3f4f6; color: #374151; }
    </style>
</head>
<body>
    <div class="header">
        <div class="header-left">
            <h1>{$businessName}</h1>
            <p>{$businessCode}</p>
            <p>{$businessAddress}</p>
            <p>{$businessPhone}</p>
        </div>
        <div class="header-right">
            <div class="invoice-label">Invoice</div>
            <p><strong>#{$invoiceNumber}</strong></p>
        </div>
    </div>

    <div class="info-grid">
        <div class="info-block">
            <h3>Bill To</h3>
            <p><strong>{$customerName}</strong></p>
        </div>
        <div class="info-block">
            <h3>Invoice Date</h3>
            <p>{$invoiceDate}</p>
        </div>
        <div class="info-block">
            <h3>Due Date</h3>
            <p>{$dueDate}</p>
        </div>
        <div class="info-block">
            <h3>Status</h3>
            <p><span class="status-badge status-{$invoice->status}">{$status}</span></p>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th style='text-align:right'>Qty</th>
                <th style='text-align:right'>Unit Price</th>
                <th style='text-align:right'>Tax</th>
                <th>Amount</th>
            </tr>
        </thead>
        <tbody>{$rows}</tbody>
    </table>

    <div class="totals">
        <table>
            <tr><td>Subtotal</td><td style='text-align:right'>TZS {$subtotal}</td></tr>
            {$discountLine}
            <tr><td>Tax</td><td style='text-align:right'>TZS {$taxAmount}</td></tr>
            <tr class="total-row"><td>Total</td><td style='text-align:right'>TZS {$total}</td></tr>
            <tr><td>Paid</td><td style='text-align:right'>TZS {$amountPaid}</td></tr>
            <tr><td><strong>Balance Due</strong></td><td style='text-align:right'><strong>TZS {$balance}</strong></td></tr>
        </table>
    </div>

    {$notesBlock}
</body>
</html>
HTML;
    }
}
