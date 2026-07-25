<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Coupon;
use App\Models\CouponUsage;
use App\Models\Customer;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class OrderController extends Controller
{
    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'payment_method' => 'required|in:cash,mobile_money,bank_transfer,card,other',
            'notes' => 'nullable|string|max:1000',
            'price_type' => 'sometimes|in:selling,wholesale,retail',
            'coupon_code' => 'nullable|string|max:50',
        ]);

        $cart = $request->session()->get('cart', []);

        if (empty($cart)) {
            return response()->json(['message' => 'Cart is empty. Please add products.'], 422);
        }

        $products = Product::whereIn('id', collect($cart)->pluck('product_id'))->get()->keyBy('id');

        $grouped = [];
        foreach ($cart as $key => $item) {
            $product = $products->get($item['product_id']);
            if (!$product || !$product->is_published || $product->quantity < $item['quantity']) {
                return response()->json([
                    'message' => "Product '{$product?->name}' is unavailable or out of stock.",
                ], 422);
            }
            $businessId = $product->business_id;
            $grouped[$businessId][] = ['key' => $key, 'product' => $product, 'quantity' => $item['quantity'], 'price' => $item['price']];
        }

        $orders = [];

        DB::beginTransaction();

        try {
            foreach ($grouped as $businessId => $items) {
                $business = Business::with('settings')->find($businessId);

                $subtotal = 0;
                $orderItemsData = [];

                foreach ($items as $item) {
                    $product = $item['product'];
                    $lineTotal = $item['price'] * $item['quantity'];
                    $subtotal += $lineTotal;

                    $orderItemsData[] = [
                        'product_id' => $product->id,
                        'quantity' => $item['quantity'],
                        'unit_price' => $item['price'],
                        'total_price' => $lineTotal,
                    ];

                    $product->decrement('quantity', $item['quantity']);
                }

                // Find or create customer per business
                $customer = null;
                $customerRecord = Customer::where('business_id', $businessId)
                    ->where('phone', $validated['customer_phone'])
                    ->first();

                if ($customerRecord) {
                    $customer = $customerRecord;
                } else {
                    $customer = Customer::create([
                        'business_id' => $businessId,
                        'full_name' => $validated['customer_name'],
                        'phone' => $validated['customer_phone'],
                        'customer_code' => Customer::generateCustomerCode(),
                        'is_guest' => true,
                    ]);
                }

                // Apply coupon discount
                $discount = 0;
                $couponUsageId = null;
                if (!empty($validated['coupon_code'])) {
                    $coupon = \App\Models\Coupon::where('business_id', $businessId)
                        ->where('code', $validated['coupon_code'])
                        ->where('is_active', true)
                        ->first();

                    if ($coupon && $coupon->isValid()) {
                        $discount = $coupon->calculateDiscount($subtotal);
                        $couponUsageId = $coupon->id;
                    }
                }

                // Apply tax from business settings
                $taxRate = 0;
                if ($business && is_array($business->settings)) {
                    $taxRate = (float) ($business->settings['tax_rate'] ?? 0);
                }
                $taxableAmount = max(0, $subtotal - $discount);
                $tax = round($taxableAmount * ($taxRate / 100), 2);
                $total = round($taxableAmount + $tax, 2);

                $order = Order::create([
                    'business_id' => $businessId,
                    'customer_id' => $customer->id,
                    'transaction_code' => Order::generateTransactionCode(),
                    'subtotal' => $subtotal,
                    'discount' => $discount,
                    'tax' => $tax,
                    'total' => $total,
                    'status' => 'pending',
                    'payment_status' => $total > 0 ? 'unpaid' : 'paid',
                    'notes' => $validated['notes'] ?? null,
                ]);

                foreach ($orderItemsData as $itemData) {
                    $order->items()->create($itemData);
                }

                $payment = $order->payments()->create([
                    'business_id' => $businessId,
                    'amount' => $total,
                    'method' => $validated['payment_method'],
                    'reference_number' => null,
                    'status' => 'pending',
                ]);

                // Record coupon usage
                if ($couponUsageId) {
                    \App\Models\CouponUsage::create([
                        'coupon_id' => $couponUsageId,
                        'user_id' => $request->user()?->id,
                        'order_id' => $order->id,
                        'discount_amount' => $discount,
                    ]);
                    \App\Models\Coupon::where('id', $couponUsageId)->increment('used_count');
                }

                $orders[] = $order->load(['items.product', 'payments', 'customer']);
            }

            $request->session()->forget('cart');

            DB::commit();

            return response()->json([
                'message' => 'Order placed successfully.',
                'orders' => $orders,
                'total_orders' => count($orders),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Checkout failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'An error occurred while placing the order. Please try again.'], 500);
        }
    }

    public function myOrders(Request $request)
    {
        $user = $request->user();

        $orders = Order::whereHas('customer', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->with(['items.product', 'business', 'payments'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($orders);
    }

    public function show(Request $request, Order $order)
    {
        $user = $request->user();
        $isCustomer = $order->customer && $order->customer->user_id === $user->id;
        $isOwner = $user->businesses()->where('id', $order->business_id)->exists();
        $isEmployee = $user->employees()->where('business_id', $order->business_id)->exists();
        $isAdmin = $user->role === 'admin';

        if (!$isCustomer && !$isOwner && !$isEmployee && !$isAdmin) {
            abort(403);
        }

        $order->load(['items.product.category', 'payments', 'business', 'customer']);

        return response()->json($order);
    }

    public function ownerOrders(Request $request)
    {
        $user = $request->user();

        $businessIds = $user->businesses()->pluck('id');

        $orders = Order::whereIn('business_id', $businessIds)
            ->with(['customer', 'items.product'])
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($orders);
    }

    public function verify(Request $request)
    {
        $validated = $request->validate([
            'transaction_code' => 'required|string|exists:orders,transaction_code',
            'customer_name' => 'required|string|max:255',
            'customer_code' => 'nullable|string|max:255',
            'amount' => 'required|numeric|min:0',
        ]);

        $order = Order::where('transaction_code', $validated['transaction_code'])
            ->with(['business', 'items.product'])
            ->firstOrFail();

        $user = $request->user();
        $businessIds = $user->businesses()->pluck('id');
        $employeeBusinessIds = $user->employees()->pluck('business_id');

        $allowedIds = $businessIds->merge($employeeBusinessIds)->unique();

        if (!$allowedIds->contains($order->business_id)) {
            return response()->json(['message' => 'Huna ruhusa ya kuthibitisha agizo hili.'], 403);
        }

        if ($order->status === 'completed') {
            return response()->json(['message' => 'Agizo hili tayari limethibitishwa.'], 422);
        }

        if ((float) $validated['amount'] !== (float) $order->total) {
            return response()->json([
                'message' => 'Kiasi hakilingani na jumla ya agizo. Ikilingani ni ' . number_format($order->total, 2),
                'expected' => $order->total,
                'provided' => $validated['amount'],
            ], 422);
        }

        DB::beginTransaction();

        try {
            $order->update([
                'status' => 'completed',
                'payment_status' => 'paid',
                'processed_by' => $user->id,
            ]);

            $order->payments()->update([
                'status' => 'confirmed',
                'received_by' => $user->id,
            ]);

            DB::commit();

            $order->load(['items.product', 'payments', 'customer', 'business']);

            return response()->json([
                'message' => 'Agizo limethibitishwa.',
                'order' => $order,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Order verification failed: ' . $e->getMessage(), ['trace' => $e->getTraceAsString()]);
            return response()->json(['message' => 'Hitilafu wakati wa kuthibitisha agizo.'], 500);
        }
    }

    public function updateStatus(Request $request)
    {
        $validated = $request->validate([
            'transaction_code' => 'required|string|exists:orders,transaction_code',
            'status' => 'required|in:pending,confirmed,completed,cancelled',
        ]);

        $order = Order::where('transaction_code', $validated['transaction_code'])
            ->firstOrFail();

        $user = $request->user();
        $businessIds = $user->businesses()->pluck('id');
        $employeeBusinessIds = $user->employees()->pluck('business_id');

        $allowedIds = $businessIds->merge($employeeBusinessIds)->unique();

        if (!$allowedIds->contains($order->business_id)) {
            return response()->json(['message' => 'Huna ruhusa ya kubadilisha hali ya agizo hili.'], 403);
        }

        if ($order->status === 'completed' || $order->status === 'cancelled') {
            return response()->json(['message' => 'Agizo haliwezi kubadilishwa kwa kuwa tayari limekamilika.'], 422);
        }

        $order->update(['status' => $validated['status']]);

        if ($validated['status'] === 'cancelled') {
            $order->update(['payment_status' => 'unpaid']);

            foreach ($order->items as $item) {
                $item->product()->increment('quantity', $item->quantity);
            }

            $order->payments()->update(['status' => 'failed']);
        }

        if ($validated['status'] === 'completed') {
            $order->update(['payment_status' => 'paid', 'processed_by' => $user->id]);
            $order->payments()->update(['status' => 'confirmed', 'received_by' => $user->id]);
        }

        $order->load(['items.product', 'payments']);

        return response()->json([
            'message' => 'Hali ya agizo imebadilishwa.',
            'order' => $order,
        ]);
    }

    public function cancelOrder(Request $request, Order $order)
    {
        $user = $request->user();
        $isCustomer = $order->customer && $order->customer->user_id === $user->id;

        if (!$isCustomer) {
            abort(403);
        }

        if (!in_array($order->status, ['pending', 'confirmed'])) {
            return response()->json(['message' => 'Order cannot be cancelled at this stage.'], 422);
        }

        DB::beginTransaction();
        try {
            $order->update(['status' => 'cancelled', 'payment_status' => 'unpaid']);

            foreach ($order->items as $item) {
                $item->product()->increment('quantity', $item->quantity);
            }

            $order->payments()->update(['status' => 'failed']);

            DB::commit();

            return response()->json(['message' => 'Order cancelled successfully.']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to cancel order.'], 500);
        }
    }

    public function reorder(Request $request, Order $order)
    {
        $user = $request->user();
        $isCustomer = $order->customer && $order->customer->user_id === $user->id;

        if (!$isCustomer) {
            abort(403);
        }

        $cart = $request->session()->get('cart', []);
        $order->load('items.product');

        foreach ($order->items as $item) {
            if ($item->product && $item->product->is_published && $item->product->quantity >= $item->quantity) {
                $key = 'reorder_' . $item->product_id . '_' . now()->timestamp;
                $cart[$key] = [
                    'product_id' => $item->product_id,
                    'quantity' => $item->quantity,
                    'price' => $item->unit_price,
                ];
            }
        }

        $request->session()->put('cart', $cart);

        return response()->json([
            'message' => 'Items added to cart.',
            'cart_count' => count($cart),
        ]);
    }
}
