<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;

class ReceiptController extends Controller
{
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

        $order->load(['items.product', 'business', 'customer', 'payments']);

        $firstPayment = $order->payments->first();
        $paymentMethod = $firstPayment?->method ?? 'cash';
        $amountPaid = $order->payments->where('status', 'confirmed')->sum('amount')
            ?: $order->payments->sum('amount')
            ?: $order->total;

        $receipt = [
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

        return response()->json([
            'receipt' => $receipt,
            'html' => $this->buildReceiptHtml($receipt),
        ]);
    }

    protected function buildReceiptHtml($receipt)
    {
        $items = '';
        foreach ($receipt['items'] as $item) {
            $items .= "<tr>
                <td>{$item['name']}</td>
                <td style='text-align:right'>{$item['quantity']}</td>
                <td style='text-align:right'>{$item['price']}</td>
                <td style='text-align:right'>{$item['total']}</td>
            </tr>";
        }

        $discountLine = '';
        if (isset($receipt['discount']) && (float)$receipt['discount'] > 0) {
            $discountLine = "<tr><td>Discount</td><td style='text-align:right'>-TZS {$receipt['discount']}</td></tr>";
        }

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
    <div class="center bold">{$receipt['business']['name']}</div>
    <div class="center">{$receipt['business']['code']}</div>
    <div class="center">{$receipt['business']['phone']}</div>
    <div class="border-top"></div>
    <div><strong>Transaction:</strong> {$receipt['order']['transaction_code']}</div>
    <div><strong>Date:</strong> {$receipt['order']['date']}</div>
    <div><strong>Payment:</strong> {$receipt['order']['payment_method']}</div>
    <div class="border-top"></div>
    <table>
        <thead>
            <tr><th>Item</th><th style='text-align:right'>Qty</th><th style='text-align:right'>Price</th><th style='text-align:right'>Total</th></tr>
        </thead>
        <tbody>{$items}</tbody>
    </table>
    <div class="border-top"></div>
    <table>
        <tr><td>Subtotal</td><td style='text-align:right'>TZS {$receipt['subtotal']}</td></tr>
        {$discountLine}
        <tr><td>Tax</td><td style='text-align:right'>TZS {$receipt['tax']}</td></tr>
        <tr class="total-row"><td>TOTAL</td><td style='text-align:right'>TZS {$receipt['total']}</td></tr>
        <tr><td>Paid</td><td style='text-align:right'>TZS {$receipt['amount_paid']}</td></tr>
        <tr><td>Change</td><td style='text-align:right'>TZS {$receipt['change']}</td></tr>
    </table>
    <div class="border-top"></div>
    <div class="center">{$receipt['footer']}</div>
</body>
</html>
HTML;
    }
}
