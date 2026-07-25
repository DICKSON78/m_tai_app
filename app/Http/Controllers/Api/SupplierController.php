<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use Illuminate\Http\Request;

class SupplierController extends Controller
{
    public function index(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $suppliers = Supplier::where('business_id', $businessId)
            ->when($request->status, fn($q, $v) => $q->where('is_active', $v === 'active'))
            ->when($request->blocked, fn($q, $v) => $q->where('is_blocked', $v === 'true'))
            ->when($request->search, function ($q, $v) use ($businessId) {
                $q->where(function ($query) use ($v) {
                    $query->where('name', 'like', "%{$v}%")
                        ->orWhere('code', 'like', "%{$v}%")
                        ->orWhere('email', 'like', "%{$v}%")
                        ->orWhere('phone', 'like', "%{$v}%")
                        ->orWhere('contact_person', 'like', "%{$v}%");
                });
            })
            ->orderBy($request->sort ?? 'name', $request->order ?? 'asc')
            ->paginate($request->per_page ?? 20);

        return response()->json($suppliers);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'secondary_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'postal_code' => 'nullable|string|max:20',
            'tax_number' => 'nullable|string|max:50',
            'registration_number' => 'nullable|string|max:50',
            'payment_terms' => 'nullable|string|max:50',
            'credit_limit' => 'nullable|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_branch' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'preferred_payment_method' => 'nullable|string|max:50',
        ]);

        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $validated['business_id'] = $businessId;
        $validated['code'] = $validated['code'] ?? $this->generateCode($businessId);

        $supplier = Supplier::create($validated);
        return response()->json($supplier, 201);
    }

    public function show(Request $request, Supplier $supplier)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplier->business_id !== $businessId) abort(403);

        $supplier->load(['purchaseOrders' => fn($q) => $q->latest()->limit(10),
            'invoices' => fn($q) => $q->latest()->limit(10),
            'payments' => fn($q) => $q->latest()->limit(10),
            'priceLists' => fn($q) => $q->where('is_active', true),
        ]);

        $supplier->load_count('purchaseOrders', 'invoices', 'payments');
        $supplier->stats = [
            'total_orders' => $supplier->purchase_orders_count,
            'total_invoices' => $supplier->invoices_count,
            'total_payments' => $supplier->payments_count,
            'outstanding_balance' => $supplier->outstanding_balance,
            'credit_limit' => $supplier->credit_limit,
            'available_credit' => $supplier->balance,
        ];

        return response()->json($supplier);
    }

    public function update(Request $request, Supplier $supplier)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplier->business_id !== $businessId) abort(403);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'phone' => 'nullable|string|max:50',
            'secondary_phone' => 'nullable|string|max:50',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:100',
            'country' => 'nullable|string|max:100',
            'tax_number' => 'nullable|string|max:50',
            'payment_terms' => 'nullable|string|max:50',
            'credit_limit' => 'nullable|numeric|min:0',
            'bank_name' => 'nullable|string|max:100',
            'bank_account_number' => 'nullable|string|max:50',
            'bank_branch' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
            'is_blocked' => 'sometimes|boolean',
            'rating' => 'nullable|numeric|min:0|max:5',
        ]);

        $supplier->update($validated);
        return response()->json($supplier);
    }

    public function destroy(Request $request, Supplier $supplier)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        if ($supplier->business_id !== $businessId) abort(403);

        if ($supplier->purchaseOrders()->count() > 0) {
            return response()->json(['message' => 'Cannot delete supplier with existing purchase orders'], 422);
        }

        $supplier->delete();
        return response()->json(['message' => 'Supplier deleted']);
    }

    public function summary(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $suppliers = Supplier::where('business_id', $businessId);

        return response()->json([
            'total' => (clone $suppliers)->count(),
            'active' => (clone $suppliers)->where('is_active', true)->count(),
            'blocked' => (clone $suppliers)->where('is_blocked', true)->count(),
            'total_outstanding' => (clone $suppliers)->sum('outstanding_balance'),
            'total_credit_limit' => (clone $suppliers)->sum('credit_limit'),
        ]);
    }

    private function generateCode($businessId): string
    {
        $last = Supplier::where('business_id', $businessId)->latest('id')->value('code');
        $number = 1;
        if ($last && preg_match('/SUP-(\d+)/', $last, $m)) {
            $number = (int)$m[1] + 1;
        }
        return 'SUP-' . str_pad($number, 5, '0', STR_PAD_LEFT);
    }
}
