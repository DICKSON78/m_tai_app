<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    public function index(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $query = $business->coupons();

        if ($request->has('active')) {
            if ($request->active === 'true') {
                $query->where('is_active', true)
                    ->where(function ($q) {
                        $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                    });
            } else {
                $query->where(function ($q) {
                    $q->where('is_active', false)
                      ->orWhere('expires_at', '<=', now());
                });
            }
        }

        return response()->json($query->orderBy('created_at', 'desc')->paginate(20));
    }

    public function store(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        $validated = $request->validate([
            'code' => 'required|string|max:50|unique:coupons,code',
            'type' => 'required|in:percentage,fixed',
            'value' => 'required|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date|after:starts_at',
        ]);

        $validated['code'] = strtoupper($validated['code']);
        $validated['business_id'] = $business->id;

        $coupon = Coupon::create($validated);

        return response()->json([
            'message' => 'Kuponi imeundwa.',
            'coupon' => $coupon,
        ], 201);
    }

    public function show(Business $business, Coupon $coupon)
    {
        if ($business->user_id !== request()->user()->id) {
            abort(403);
        }

        if ($coupon->business_id !== $business->id) {
            abort(404);
        }

        return response()->json($coupon);
    }

    public function update(Request $request, Business $business, Coupon $coupon)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($coupon->business_id !== $business->id) {
            abort(404);
        }

        $validated = $request->validate([
            'type' => 'sometimes|in:percentage,fixed',
            'value' => 'sometimes|numeric|min:0',
            'min_order_amount' => 'nullable|numeric|min:0',
            'max_discount' => 'nullable|numeric|min:0',
            'usage_limit' => 'nullable|integer|min:1',
            'starts_at' => 'nullable|date',
            'expires_at' => 'nullable|date',
            'is_active' => 'sometimes|boolean',
        ]);

        $coupon->update($validated);

        return response()->json([
            'message' => 'Kuponi imesasishwa.',
            'coupon' => $coupon->fresh(),
        ]);
    }

    public function destroy(Business $business, Coupon $coupon)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403);
        }

        if ($coupon->business_id !== $business->id) {
            abort(404);
        }

        $coupon->delete();

        return response()->json(['message' => 'Kuponi imefutwa.']);
    }

    public function validateCoupon(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'business_id' => 'required|exists:businesses,id',
            'order_amount' => 'required|numeric|min:0',
        ]);

        $coupon = Coupon::where('code', strtoupper($validated['code']))
            ->where('business_id', $validated['business_id'])
            ->first();

        if (!$coupon) {
            return response()->json(['message' => 'Kuponi haijapatikana.'], 404);
        }

        if (!$coupon->isValid()) {
            return response()->json(['message' => 'Kuponi si halali au imeisha muda.'], 422);
        }

        if ($validated['order_amount'] < $coupon->min_order_amount) {
            return response()->json([
                'message' => "Kiasi cha chini cha amri ni TZS " . number_format($coupon->min_order_amount),
            ], 422);
        }

        $discount = $coupon->calculateDiscount($validated['order_amount']);

        return response()->json([
            'valid' => true,
            'coupon' => $coupon,
            'discount' => $discount,
            'message' => "Punguzo la TZS " . number_format($discount),
        ]);
    }
}
