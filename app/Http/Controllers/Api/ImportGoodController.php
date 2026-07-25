<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\ImportGood;
use Illuminate\Http\Request;

class ImportGoodController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $request->validate([
            'search' => 'nullable|string|max:255',
            'status' => 'nullable|in:pending,received,shelved',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $imports = $business->importGoods()
            ->when($request->search, fn($q, $v) => $q->where('item_name', 'like', "%{$v}%"))
            ->when($request->status, fn($q, $v) => $q->where('status', $v))
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        $stats = [
            'total' => $business->importGoods()->count(),
            'pending' => $business->importGoods()->where('status', 'pending')->count(),
            'received' => $business->importGoods()->where('status', 'received')->count(),
            'shelved' => $business->importGoods()->where('status', 'shelved')->count(),
            'total_cost' => (float) $business->importGoods()->sum(\DB::raw('buying_price * quantity + transport_cost')),
        ];

        return response()->json(array_merge($imports->toArray(), ['stats' => $stats]));
    }

    public function store(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'item_name' => 'required|string|max:255',
            'quantity' => 'required|integer|min:1',
            'buying_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'distance_km' => 'nullable|numeric|min:0',
            'transport_cost' => 'nullable|numeric|min:0',
            'payment_method' => 'required|in:cash,account_transfer,pay_in_advance,new_capital',
        ]);

        $import = $business->importGoods()->create([
            'item_name' => $validated['item_name'],
            'quantity' => $validated['quantity'],
            'buying_price' => $validated['buying_price'],
            'selling_price' => $validated['selling_price'],
            'distance_km' => $validated['distance_km'] ?? null,
            'transport_cost' => $validated['transport_cost'] ?? 0,
            'payment_method' => $validated['payment_method'],
            'status' => 'pending',
        ]);

        return response()->json([
            'message' => 'Bidhaa imewekekwa kwa mafanikio.',
            'import_good' => $import,
        ], 201);
    }

    public function show(Request $request, Business $business, ImportGood $importGood)
    {
        $this->authorizeBusiness($request, $business);

        if ($importGood->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kuona bidhaa hii.');
        }

        return response()->json(['import_good' => $importGood]);
    }

    public function update(Request $request, Business $business, ImportGood $importGood)
    {
        $this->authorizeBusiness($request, $business);

        if ($importGood->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kubadilisha bidhaa hii.');
        }

        $validated = $request->validate([
            'item_name' => 'sometimes|string|max:255',
            'quantity' => 'sometimes|integer|min:1',
            'buying_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'distance_km' => 'nullable|numeric|min:0',
            'transport_cost' => 'nullable|numeric|min:0',
            'payment_method' => 'sometimes|in:cash,account_transfer,pay_in_advance,new_capital',
        ]);

        $importGood->update($validated);

        return response()->json([
            'message' => 'Bidhaa imesasishwa.',
            'import_good' => $importGood->fresh(),
        ]);
    }

    public function destroy(Request $request, Business $business, ImportGood $importGood)
    {
        $this->authorizeBusiness($request, $business);

        if ($importGood->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kufuta bidhaa hii.');
        }

        $importGood->delete();

        return response()->json(['message' => 'Bidhaa imefutwa.']);
    }

    public function updateStatus(Request $request, Business $business, ImportGood $importGood)
    {
        $this->authorizeBusiness($request, $business);

        if ($importGood->business_id !== $business->id) {
            abort(403, 'Huna ruhusa kubadilisha hali ya bidhaa hii.');
        }

        $validated = $request->validate([
            'status' => 'required|in:pending,received,shelved',
        ]);

        $importGood->update(['status' => $validated['status']]);

        return response()->json([
            'message' => 'Hali ya bidhaa imesasishwa.',
            'import_good' => $importGood->fresh(),
        ]);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
