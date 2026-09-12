<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Barryvdh\DomPDF\Facade\Pdf;

class ReceiptController extends Controller
{
    private static function e($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }

    public function generate(Request $request, Order $order)
    {
        $this->authorizeReceipt($request->user(), $order);

        $receipt = $this->buildReceiptData($order);

        return response()->json([
            'receipt' => $receipt,
            'html' => $this->buildReceiptHtml($receipt),
        ]);
    }

    protected function authorizeReceipt($user, Order $order)
    {
        $isOwner = $user->businesses()->where('id', $order->business_id)->exists();
        $isEmployee = $user->employees()->where('business_id', $order->business_id)->exists();
        $isCustomer = $order->customer && $order->customer->user_id === $user->id;
        $isAdmin = $user->role === 'admin';

        if (!$isOwner && !$isEmployee && !$isCustomer && !$isAdmin) {
            abort(403);
        }
    }

    protected function buildReceiptHtml($receipt)
    {
        $e = [self::class, 'e'];

        $items = '';
        foreach ($receipt['items'] as $item) {
            $name = $e($item['name']);
            $qty = $e($item['quantity']);
            $price = $e($item['price']);
            $total = $e($item['total']);
            $items .= "<tr>
                <td>{$name}</td>
                <td class='num'>{$qty}</td>
                <td class='num'>{$price}</td>
                <td class='num'>{$total}</td>
            </tr>";
        }

        $discountLine = '';
        if (isset($receipt['discount']) && (float)$receipt['discount'] > 0) {
            $disc = $e($receipt['discount']);
            $discountLine = "<tr><td>Discount</td><td class='num'>-TZS {$disc}</td></tr>";
        }

        $businessName = $e($receipt['business']['name']);
        $businessCode = $e($receipt['business']['code']);
        $businessPhone = $e($receipt['business']['phone']);
        $txnCode = $e($receipt['order']['transaction_code']);
        $txnDate = $e($receipt['order']['date']);
        $payMethod = $e($receipt['order']['payment_method']);
        $orderStatus = $e(strtoupper($receipt['order']['status'] ?? ''));
        $subtotal = $e($receipt['subtotal']);
        $tax = $e($receipt['tax']);
        $total = $e($receipt['total']);
        $amountPaid = $e($receipt['amount_paid']);
        $change = $e($receipt['change']);
        $footer = $e($receipt['footer']);
        $logo = \App\Helpers\Branding::logoImgHtml(80, 'center');

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11.5px; color: #1e293b; max-width: 340px; margin: 0 auto; padding: 18px; }
        .logo { text-align: center; margin-bottom: 8px; }
        .center { text-align: center; }
        .shop-name { font-size: 16px; font-weight: 700; color: #0f172a; }
        .shop-meta { font-size: 10.5px; color: #64748b; margin-top: 2px; }
        .brand-line { height: 3px; background: linear-gradient(90deg, #00D4AA, #0f172a); border-radius: 2px; margin: 10px 0; }
        .meta-grid { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .meta-grid .k { color: #64748b; text-transform: uppercase; font-size: 9px; letter-spacing: .5px; }
        .meta-grid .v { font-weight: 600; color: #0f172a; margin-top: 1px; }
        .dash { border-top: 1px dashed #cbd5e1; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: .5px; text-align: left; padding: 4px 0; border-bottom: 1px solid #e2e8f0; }
        th.num, td.num { text-align: right; }
        td { padding: 5px 0; font-size: 11px; color: #1e293b; }
        td.num { font-variant-numeric: tabular-nums; }
        .totals td { padding: 3px 0; }
        .total-row td { font-size: 13px; font-weight: 800; color: #0f172a; border-top: 1px solid #e2e8f0; padding-top: 7px; }
        .grand { color: #065f46; font-weight: 700; }
        .footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 12px; }
    </style>
</head>
<body>
    <div class="logo">{$logo}</div>
    <div class="center">
        <div class="shop-name">{$businessName}</div>
        <div class="shop-meta">{$businessCode}</div>
        <div class="shop-meta">{$businessPhone}</div>
    </div>
    <div class="brand-line"></div>

    <div class="meta-grid">
        <div><div class="k">Transaction</div><div class="v">{$txnCode}</div></div>
        <div style="text-align:right"><div class="k">Payment</div><div class="v">{$payMethod}</div></div>
    </div>
    <div class="meta-grid">
        <div><div class="k">Date</div><div class="v">{$txnDate}</div></div>
        <div style="text-align:right"><div class="k">Status</div><div class="v">{$orderStatus}</div></div>
    </div>
    <div class="dash"></div>

    <table>
        <thead>
            <tr><th>Item</th><th class="num">Qty</th><th class="num">Price</th><th class="num">Total</th></tr>
        </thead>
        <tbody>{$items}</tbody>
    </table>
    <div class="dash"></div>

    <table class="totals">
        <tr><td>Subtotal</td><td class="num">TZS {$subtotal}</td></tr>
        {$discountLine}
        <tr><td>Tax</td><td class="num">TZS {$tax}</td></tr>
        <tr class="total-row"><td>TOTAL</td><td class="num">TZS {$total}</td></tr>
        <tr><td>Paid</td><td class="num">TZS {$amountPaid}</td></tr>
        <tr class="grand"><td>Change</td><td class="num">TZS {$change}</td></tr>
    </table>

    <div class="dash"></div>
    <div class="footer">{$footer}</div>
</body>
</html>
HTML;
    }

    public function generatePdf(Request $request, Order $order)
    {
        $this->authorizeReceipt($request->user(), $order);

        $receipt = $this->buildReceiptData($order);
        $html = $this->buildReceiptHtml($receipt);

        $pdf = Pdf::loadHtml($html)
            ->setPaper('a5', 'portrait')
            ->setOption('isRemoteEnabled', true)
            ->setOption('isHtml5ParserEnabled', true);

        return $pdf->download("receipt-{$order->transaction_code}.pdf");
    }

    public function printReceipt(Request $request, Order $order)
    {
        $this->authorizeReceipt($request->user(), $order);

        $receipt = $this->buildReceiptData($order);
        $html = $this->buildReceiptHtml($receipt);

        return response($html)->header('Content-Type', 'text/html');
    }

    private function buildReceiptData(Order $order)
    {
        $order->load(['items.product', 'business', 'customer', 'payments']);

        $firstPayment = $order->payments->first();
        $paymentMethod = $firstPayment?->method ?? 'cash';
        $amountPaid = $order->payments->where('status', 'confirmed')->sum('amount')
            ?: $order->payments->sum('amount')
            ?: $order->total;

        return [
            'business' => [
                'name' => $order->business->name,
                'code' => $order->business->business_code,
                'address' => $order->business->street
                    ? $order->business->street . ', ' . ($order->business->ward ?? '') . ', ' . ($order->business->district ?? '')
                    : ($order->business->district ?? ''),
                'phone' => $order->business->user->phone ?? '',
            ],
            'order' => [
                'transaction_code' => $order->transaction_code,
                'date' => $order->created_at->format('d/m/Y H:i'),
                'status' => $order->status,
                'payment_method' => $paymentMethod,
            ],
            'items' => $order->items->map(function ($item) {
                return [
                    'name' => $item->product->name ?? 'Product',
                    'quantity' => $item->quantity,
                    'price' => number_format($item->unit_price, 2),
                    'total' => number_format($item->total_price, 2),
                ];
            }),
            'subtotal' => number_format($order->subtotal, 2),
            'discount' => number_format($order->discount ?? 0, 2),
            'tax' => number_format($order->tax ?? 0, 2),
            'total' => number_format($order->total, 2),
            'amount_paid' => number_format($amountPaid, 2),
            'change' => number_format(max(0, $amountPaid - $order->total), 2),
            'footer' => $order->business->settings['receipt_footer'] ?? 'Thank you for your purchase!',
        ];
    }
}
