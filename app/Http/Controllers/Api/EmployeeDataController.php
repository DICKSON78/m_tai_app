<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\Delivery;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Product;
use Illuminate\Http\Request;

class EmployeeDataController extends Controller
{
    private function getEmployeeBusinessId(Request $request): ?int
    {
        $user = $request->user();
        $employee = Employee::where('user_id', $user->id)->first();
        return $employee?->business_id;
    }

    public function inventory(Request $request)
    {
        $businessId = $this->getEmployeeBusinessId($request);
        if (!$businessId) {
            return response()->json(['message' => 'No business assigned.'], 403);
        }

        $query = Product::where('business_id', $businessId)
            ->where('is_published', true);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('name')
            ->paginate($request->per_page ?? 15);

        return response()->json($products);
    }

    public function customers(Request $request)
    {
        $businessId = $this->getEmployeeBusinessId($request);
        if (!$businessId) {
            return response()->json(['message' => 'No business assigned.'], 403);
        }

        $query = Customer::withCount('orders')
            ->where('business_id', $businessId);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('full_name')
            ->paginate($request->per_page ?? 15);

        return response()->json($customers);
    }

    public function deliveries(Request $request)
    {
        $businessId = $this->getEmployeeBusinessId($request);
        if (!$businessId) {
            return response()->json(['message' => 'No business assigned.'], 403);
        }

        $query = Delivery::with(['customer', 'transporter'])
            ->where('business_id', $businessId);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('item_description', 'like', "%{$search}%")
                  ->orWhere('destination', 'like', "%{$search}%")
                  ->orWhere('pickup_location', 'like', "%{$search}%");
            });
        }

        $deliveries = $query->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($deliveries);
    }

    public function expenses(Request $request)
    {
        $businessId = $this->getEmployeeBusinessId($request);
        if (!$businessId) {
            return response()->json(['message' => 'No business assigned.'], 403);
        }

        $query = Expense::with('recordedBy')
            ->where('business_id', $businessId);

        if ($request->filled('date_from')) {
            $query->whereDate('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('date', '<=', $request->date_to);
        }

        $expenses = $query->orderBy('date', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($expenses);
    }

    public function storeExpense(Request $request)
    {
        $businessId = $this->getEmployeeBusinessId($request);
        if (!$businessId) {
            return response()->json(['message' => 'No business assigned.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'amount' => 'required|numeric|min:0',
            'category' => 'nullable|string|max:100',
            'type' => 'nullable|string|max:100',
            'date' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $validated['business_id'] = $businessId;
        $validated['recorded_by'] = $request->user()->id;

        $expense = Expense::create($validated);

        return response()->json([
            'message' => 'Expense recorded.',
            'expense' => $expense,
        ], 201);
    }
}
