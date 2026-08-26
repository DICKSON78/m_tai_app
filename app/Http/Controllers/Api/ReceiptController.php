<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Barryvdh\Dompdf\Facade\Pdf;

class ReceiptController extends Controller
{
    private static function e($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }

    public function generate(Request $request, Order $order)
    {
        $user = $request->user();
        $isOwner = $user->businesses()->where('id', $order->business_id)->exists();
        $isEmployee = $user->employees()->where('business_id', $order->business_id)->exists();
        $isCustomer = $order->customer && $order->customer->user_id === $user->id;
        $isAdmin = $user->role === 'admin';

        if (!$isOwner && !$isEmployee && !$isCustomer && !$isAdmin) {
            abort(403);
        }

        $receipt = $this->buildReceiptData($order);

        return response()->json([
            'receipt' => $receipt,
            'html' => $this->buildReceiptHtml($receipt),
        ]);
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
                <td style='text-align:right'>{$qty}</td>
                <td style='text-align:right'>{$price}</td>
                <td style='text-align:right'>{$total}</td>
            </tr>";
        }

        $discountLine = '';
        if (isset($receipt['discount']) && (float)$receipt['discount'] > 0) {
            $disc = $e($receipt['discount']);
            $discountLine = "<tr><td>Discount</td><td style='text-align:right'>-TZS {$disc}</td></tr>";
        }

        $businessName = $e($receipt['business']['name']);
        $businessCode = $e($receipt['business']['code']);
        $businessPhone = $e($receipt['business']['phone']);
        $txnCode = $e($receipt['order']['transaction_code']);
        $txnDate = $e($receipt['order']['date']);
        $payMethod = $e($receipt['order']['payment_method']);
        $subtotal = $e($receipt['subtotal']);
        $tax = $e($receipt['tax']);
        $total = $e($receipt['total']);
        $amountPaid = $e($receipt['amount_paid']);
        $change = $e($receipt['change']);
        $footer = $e($receipt['footer']);

        return <<<HTML
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: monospace; font-size: 12px; max-width: 300px; margin: 0 auto; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 2px 0; }
        .border-top { border-top: 1px dashed #000; margin: 8px 0; }
        .total-row { font-weight: bold; font-size: 14px; }
    </style>
</head>
<body>
    <div class="center bold">{$businessName}</div>
    <div class="center">{$businessCode}</div>
    <div class="center">{$businessPhone}</div>
    <div class="border-top"></div>
    <div><strong>Transaction:</strong> {$txnCode}</div>
    <div><strong>Date:</strong> {$txnDate}</div>
    <div><strong>Payment:</strong> {$payMethod}</div>
    <div class="border-top"></div>
    <table>
        <thead>
            <tr><th>Item</th><th style='text-align:right'>Qty</th><th style='text-align:right'>Price</th><th style='text-align:right'>Total</th></tr>
        </thead>
        <tbody>{$items}</tbody>
    </table>
    <div class="border-top"></div>
    <table>
        <tr><td>Subtotal</td><td style='text-align:right'>TZS {$subtotal}</td></tr>
        {$discountLine}
        <tr><td>Tax</td><td style='text-align:right'>TZS {$tax}</td></tr>
        <tr class="total-row"><td>TOTAL</td><td style='text-align:right'>TZS {$total}</td></tr>
        <tr><td>Paid</td><td style='text-align:right'>TZS {$amountPaid}</td></tr>
        <tr><td>Change</td><td style='text-align:right'>TZS {$change}</td></tr>
    </table>
    <div class="border-top"></div>
    <div class="center">{$footer}</div>
</body>
</html>
HTML;
    }

    public function generatePdf(Order $order)
    {
        $receipt = $this->buildReceiptData($order);
        $html = $this->buildReceiptHtml($receipt);

        $pdf = Pdf::loadHtml($html)
            ->setPaper('a5', 'portrait')
            ->setOption('isRemoteEnabled', true);

        return $pdf->download("receipt-{$order->transaction_code}.pdf");
    }

    public function printReceipt(Order $order)
    {
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
