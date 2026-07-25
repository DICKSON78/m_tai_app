<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\ExchangeRate;
use Illuminate\Http\Request;

class CurrencyController extends Controller
{
    public function index()
    {
        $currencies = Currency::where('is_active', true)->orderBy('code')->get();
        return response()->json($currencies);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string|max:3|unique:currencies,code',
            'name' => 'required|string|max:100',
            'symbol' => 'required|string|max:10',
            'decimal_places' => 'nullable|integer|min:0|max:4',
            'is_base' => 'sometimes|boolean',
        ]);

        if ($validated['is_base'] ?? false) {
            Currency::where('is_base', true)->update(['is_base' => false]);
        }

        $currency = Currency::create($validated);
        return response()->json($currency, 201);
    }

    public function exchangeRates(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $rates = ExchangeRate::where('business_id', $businessId)
            ->when($request->currency, function ($q, $v) {
                $q->where('from_currency', $v)->orWhere('to_currency', $v);
            })
            ->orderBy('effective_date', 'desc')
            ->paginate($request->per_page ?? 50);

        return response()->json($rates);
    }

    public function storeExchangeRate(Request $request)
    {
        $validated = $request->validate([
            'from_currency' => 'required|string|max:3',
            'to_currency' => 'required|string|max:3',
            'rate' => 'required|numeric|min:0',
            'effective_date' => 'required|date',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;

        $rate = ExchangeRate::create($validated);
        return response()->json($rate, 201);
    }

    public function convert(Request $request)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:0',
            'from' => 'required|string|max:3',
            'to' => 'required|string|max:3',
        ]);

        if ($validated['from'] === $validated['to']) {
            return response()->json(['amount' => $validated['amount'], 'rate' => 1]);
        }

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $rate = ExchangeRate::where('business_id', $businessId)
            ->where('from_currency', $validated['from'])
            ->where('to_currency', $validated['to'])
            ->where('is_active', true)
            ->orderBy('effective_date', 'desc')
            ->first();

        if (!$rate) {
            return response()->json(['message' => 'Exchange rate not found'], 404);
        }

        return response()->json([
            'amount' => $validated['amount'] * $rate->rate,
            'rate' => $rate->rate,
            'from' => $validated['from'],
            'to' => $validated['to'],
        ]);
    }
}
