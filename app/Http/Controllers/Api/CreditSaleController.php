<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\CreditSale;
use Illuminate\Http\Request;

class CreditSaleController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:pending,partial,cleared,overdue',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $creditSales = $business->creditSales()
            ->when($request->search, function ($q, $v) {
                $q->where(function ($q) use ($v) {
                    $q->where('customer_name', 'like', "%{$v}%")
                        ->orWhere('customer_phone', 'like', "%{$v}%")
                        ->orWhere('product_name', 'like', "%{$v}%");
                });
            })
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        $stats = [
            'total' => $business->creditSales()->count(),
            'pending' => $business->creditSales()->where('status', 'pending')->count(),
            'partial' => $business->creditSales()->where('status', 'partial')->count(),
            'cleared' => $business->creditSales()->where('status', 'cleared')->count(),
            'overdue' => $business->creditSales()->where('status', 'overdue')->count(),
            'total_amount' => (float) $business->creditSales()->sum('amount'),
            'total_paid' => (float) $business->creditSales()->sum('amount_paid'),
            'total_outstanding' => (float) $business->creditSales()->sum('amount') - (float) $business->creditSales()->sum('amount_paid'),
        ];

        return response()->json(array_merge($creditSales->toArray(), ['stats' => $stats]));
    }

    public function store(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'customer_name' => 'required|string|max:255',
            'customer_phone' => 'required|string|max:20',
            'product_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'amount' => 'required|numeric|min:0',
            'due_date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $creditSale = $business->creditSales()->create([
            'customer_name' => $validated['customer_name'],
            'customer_phone' => $validated['customer_phone'],
            'product_name' => $validated['product_name'],
            'quantity' => $validated['quantity'],
            'amount' => $validated['amount'],
            'due_date' => $validated['due_date'],
            'amount_paid' => 0,
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Kopesha imerekodwa kwa mafanikio.',
            'credit_sale' => $creditSale,
        ], 201);
    }

    public function show(Request $request, Business $business, CreditSale $creditSale)
    {
        $this->authorizeBusiness($request, $business);

        if ($creditSale->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kuona kopesha hii.');
        }

        return response()->json(['credit_sale' => $creditSale]);
    }

    public function update(Request $request, Business $business, CreditSale $creditSale)
    {
        $this->authorizeBusiness($request, $business);

        if ($creditSale->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kubadilisha kopesha hii.');
        }

        $validated = $request->validate([
            'customer_name' => 'sometimes|string|max:255',
            'customer_phone' => 'sometimes|string|max:20',
            'product_name' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|integer|min:1',
            'amount' => 'sometimes|numeric|min:0',
            'due_date' => 'sometimes|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $creditSale->update($validated);

        return response()->json([
            'message' => 'Kopesha imesasishwa.',
            'credit_sale' => $creditSale->fresh(),
        ]);
    }

    public function destroy(Request $request, Business $business, CreditSale $creditSale)
    {
        $this->authorizeBusiness($request, $business);

        if ($creditSale->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kufuta kopesha hii.');
        }

        $creditSale->delete();

        return response()->json(['message' => 'Kopesha imefutwa.']);
    }

    public function pay(Request $request, Business $business, CreditSale $creditSale)
    {
        $this->authorizeBusiness($request, $business);

        if ($creditSale->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kulipa kopesha hii.');
        }

        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
        ]);

        $remaining = $creditSale->amount - $creditSale->amount_paid;
        $paymentAmount = min($validated['amount'], $remaining);

        $creditSale->amount_paid += $paymentAmount;

        if ($creditSale->amount_paid >= $creditSale->amount) {
            $creditSale->status = 'cleared';
        } elseif ($creditSale->amount_paid > 0) {
            $creditSale->status = 'partial';
        }

        $creditSale->save();

        return response()->json([
            'message' => 'Malipo yamepokelewa kwa mafanikio.',
            'credit_sale' => $creditSale->fresh(),
        ]);
    }

    public function markOverdue(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $updated = $business->creditSales()
            ->whereIn('status', ['pending', 'partial'])
            ->where('due_date', '<', now()->toDateString())
            ->update(['status' => 'overdue']);

        return response()->json([
            'message' => "Kopesha {$updated} zimeshachelewa zimekamilishwa.",
            'updated' => $updated,
        ]);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
