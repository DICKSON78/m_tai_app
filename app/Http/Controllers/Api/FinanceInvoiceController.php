<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Business;
use App\Models\Currency;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class FinanceInvoiceController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $invoices = Invoice::where('business_id', $businessId)
            ->with('customer:id,full_name')
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
        $customerName = $e($invoice->customer->full_name ?? 'N/A');
        $customerContact = $invoice->customer->phone
            ? '<p>' . $e($invoice->customer->phone) . '</p>'
            : '';
        $generatedDate = now()->format('d/m/Y H:i');
        $notes = $e($invoice->notes ?? '');
        $subParts = array_filter(array_filter([$businessAddress, $businessPhone]));
        $subHead = count($subParts) ? ' · ' . implode(' · ', $subParts) : '';

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
        $logo = \App\Helpers\Branding::logoImgHtml(80, 'left');

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #1e293b; max-width: 720px; margin: 0 auto; padding: 24px; }
        .brand-band { background: #0f172a; color: #fff; padding: 18px 24px; border-radius: 10px 10px 0 0; display: flex; justify-content: space-between; align-items: center; }
        .brand-band .shop { font-size: 18px; font-weight: 700; letter-spacing: .2px; }
        .brand-band .shop small { display: block; font-size: 11px; font-weight: 400; color: #94a3b8; margin-top: 2px; }
        .brand-band .doc-label { font-size: 26px; font-weight: 800; text-transform: uppercase; color: #00D4AA; letter-spacing: 2px; }
        .meta-bar { background: #f8fafc; border: 1px solid #e2e8f0; border-top: none; padding: 14px 24px; display: flex; justify-content: space-between; border-radius: 0 0 10px 10px; margin-bottom: 22px; }
        .meta-bar div { font-size: 12px; }
        .meta-bar .k { color: #64748b; text-transform: uppercase; font-size: 10px; letter-spacing: .5px; }
        .meta-bar .v { font-weight: 600; color: #0f172a; margin-top: 1px; }
        .cols { display: flex; justify-content: space-between; margin-bottom: 22px; }
        .box { flex: 1; }
        .box h4 { font-size: 10px; text-transform: uppercase; letter-spacing: .6px; color: #64748b; margin-bottom: 6px; }
        .box p { font-size: 12.5px; line-height: 1.5; color: #0f172a; }
        .box.right { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 18px; }
        th { background: #00D4AA; color: #0f172a; padding: 10px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; }
        th:first-child { border-radius: 6px 0 0 0; }
        th:last-child { border-radius: 0 6px 0 0; }
        td { padding: 9px 10px; border-bottom: 1px solid #eef2f7; font-size: 12px; }
        tbody tr:nth-child(even) { background: #fafcfe; }
        .num { text-align: right; font-variant-numeric: tabular-nums; }
        .totals { margin-left: auto; width: 300px; }
        .totals table { margin-bottom: 0; }
        .totals td { padding: 6px 10px; border-bottom: none; font-size: 12px; }
        .totals .total-row td { font-size: 15px; font-weight: 800; color: #0f172a; border-top: 2px solid #00D4AA; padding-top: 9px; }
        .totals .balance-row td { font-weight: 700; color: #065f46; }
        .status-badge { display: inline-block; padding: 3px 12px; border-radius: 20px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; letter-spacing: .4px; }
        .status-draft { background: #fef3c7; color: #92400e; }
        .status-sent { background: #dbeafe; color: #1e40af; }
        .status-paid { background: #d1fae5; color: #065f46; }
        .status-partial { background: #fef3c7; color: #92400e; }
        .status-overdue { background: #fee2e2; color: #991b1b; }
        .status-cancelled { background: #f1f5f9; color: #475569; }
        .notes { margin-top: 10px; padding: 12px 14px; background: #f8fafc; border-left: 3px solid #00D4AA; border-radius: 6px; font-size: 11.5px; color: #475569; }
        .notes strong { color: #0f172a; }
        .footer { margin-top: 28px; padding-top: 12px; border-top: 1px solid #e2e8f0; font-size: 10.5px; color: #94a3b8; text-align: center; }
    </style>
</head>
<body>
    <div class="brand-band">
        <div class="shop">
            <div class="logo-wrap">{$logo}</div>
            <div>{$businessName}<small>{$businessCode}{$subHead}</small></div>
        </div>
        <div class="doc-label">Invoice</div>
    </div>

    <div class="meta-bar">
        <div><div class="k">Invoice #</div><div class="v">{$invoiceNumber}</div></div>
        <div><div class="k">Status</div><div class="v"><span class="status-badge status-{$invoice->status}">{$status}</span></div></div>
        <div><div class="k">Invoice Date</div><div class="v">{$invoiceDate}</div></div>
        <div><div class="k">Due Date</div><div class="v">{$dueDate}</div></div>
    </div>

    <div class="cols">
        <div class="box">
            <h4>Bill To</h4>
            <p>{$customerName}</p>
            {$customerContact}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>Description</th>
                <th class='num'>Qty</th>
                <th class='num'>Unit Price</th>
                <th class='num'>Tax</th>
                <th class='num'>Amount</th>
            </tr>
        </thead>
        <tbody>{$rows}</tbody>
    </table>

    <div class="totals">
        <table>
            <tr><td>Subtotal</td><td class='num'>TZS {$subtotal}</td></tr>
            {$discountLine}
            <tr><td>Tax</td><td class='num'>TZS {$taxAmount}</td></tr>
            <tr class="total-row"><td>Total</td><td class='num'>TZS {$total}</td></tr>
            <tr><td>Paid</td><td class='num'>TZS {$amountPaid}</td></tr>
            <tr class="balance-row"><td>Balance Due</td><td class='num'>TZS {$balance}</td></tr>
        </table>
    </div>

    {$notesBlock}
    <div class="footer">Generated by M-TAI on {$generatedDate} · This is a system-generated document.</div>
</body>
</html>
HTML;
    }
}
