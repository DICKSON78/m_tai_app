<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Customer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $request->validate([
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:100',
        ]);

        $customers = $business->customers()
            ->when($request->search, function ($q, $v) {
                $q->where(function ($q) use ($v) {
                    $q->where('full_name', 'like', "%{$v}%")
                        ->orWhere('phone', 'like', "%{$v}%")
                        ->orWhereHas('user', function ($uq) use ($v) {
                            $uq->where('email', 'like', "%{$v}%");
                        });
                });
            })
            ->withCount('orders')
            ->withSum('orders', 'total')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return response()->json($customers);
    }

    public function store(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'location' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'road' => 'nullable|string|max:255',
        ]);

        $user = null;

        if ($validated['phone']) {
            $user = User::where('phone', $validated['phone'])->first();

            if (!$user) {
                $user = User::create([
                    'name' => $validated['full_name'],
                    'phone' => $validated['phone'],
                    'email' => $validated['email'] ?? null,
                    'role' => 'customer',
                    'user_code' => User::generateUserCode(),
                    'is_active' => true,
                ]);
            }
        }

        $existingCustomer = $business->customers()
            ->where('phone', $validated['phone'])
            ->first();

        if ($existingCustomer) {
            return response()->json([
                'message' => 'Mteja kwa nambari hii ya simu tayariupo kwenye biashara hii.',
            ], 422);
        }

        $customer = Customer::create([
            'business_id' => $business->id,
            'user_id' => $user?->id,
            'customer_code' => Customer::generateCustomerCode(),
            'full_name' => $validated['full_name'],
            'phone' => $validated['phone'],
            'location' => $validated['location'] ?? null,
            'street' => $validated['street'] ?? null,
            'road' => $validated['road'] ?? null,
            'is_guest' => false,
        ]);

        return response()->json([
            'message' => 'Mteja ameongezwa kwa mafanikio.',
            'customer' => $customer,
        ], 201);
    }

    public function show(Request $request, Business $business, Customer $customer)
    {
        $this->authorizeBusiness($request, $business);

        if ($customer->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kuona mteja huyu.');
        }

        $totalSpent = (float) $customer->orders()->sum('total');
        $totalOrders = $customer->orders()->count();
        $avgOrderValue = $totalOrders > 0 ? round($totalSpent / $totalOrders, 2) : 0;

        $recentOrders = $customer->orders()
            ->with('items.product:id,name')
            ->latest()
            ->limit(10)
            ->get();

        $customer->load('user:id,name,phone,email');
        $customer->loadCount(['orders', 'deliveries', 'creditSales', 'loans']);

        return response()->json([
            'customer' => $customer,
            'stats' => [
                'total_spent' => $totalSpent,
                'total_orders' => $totalOrders,
                'average_order_value' => $avgOrderValue,
            ],
            'recent_orders' => $recentOrders,
        ]);
    }

    public function update(Request $request, Business $business, Customer $customer)
    {
        $this->authorizeBusiness($request, $business);

        if ($customer->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kubadilisha mteja huyu.');
        }

        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'phone' => 'sometimes|string|max:20',
            'email' => 'nullable|email|max:255',
            'location' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'road' => 'nullable|string|max:255',
        ]);

        $customerData = collect($validated)->except('email')->toArray();
        $customer->update($customerData);

        if ($customer->user_id) {
            $userUpdates = [];
            if (isset($validated['full_name'])) {
                $userUpdates['name'] = $validated['full_name'];
            }
            if (isset($validated['email'])) {
                $userUpdates['email'] = $validated['email'];
            }
            if (!empty($userUpdates)) {
                $customer->user->update($userUpdates);
            }
        }

        return response()->json([
            'message' => 'Mteja amesasishwa.',
            'customer' => $customer->fresh(),
        ]);
    }

    public function destroy(Request $request, Business $business, Customer $customer)
    {
        $this->authorizeBusiness($request, $business);

        if ($customer->business_id !== $business->id) {
            abort(403, 'Huna ruhusa ya kufuta mteja huyu.');
        }

        $hasOrders = $customer->orders()->count() > 0;
        $hasLoans = $customer->loans()->where('status', 'active')->count() > 0;

        if ($hasOrders || $hasLoans) {
            return response()->json([
                'message' => 'Haiwezi kufuta mteja aliye na maagizo au mikopo inayotumika.',
            ], 422);
        }

        $customer->delete();

        return response()->json([
            'message' => 'Mteja amefutwa.',
        ]);
    }

    public function stats(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $totalCustomers = $business->customers()->count();

        $newThisMonth = $business->customers()
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $returningCustomers = $business->customers()
            ->whereHas('orders', function ($q) {
                $q->where('created_at', '>=', now()->subDays(90));
            })
            ->whereHas('orders', function ($q) {
                $q->where('created_at', '<', now()->subDays(30));
            })
            ->count();

        $topBySpending = $business->customers()
            ->withSum('orders', 'total')
            ->withCount('orders')
            ->having('orders_sum_total', '>', 0)
            ->orderByDesc('orders_sum_total')
            ->limit(10)
            ->get()
            ->map(fn ($c) => [
                'id' => $c->id,
                'full_name' => $c->full_name,
                'phone' => $c->phone,
                'total_spent' => (float) ($c->orders_sum_total ?? 0),
                'total_orders' => $c->orders_count,
            ]);

        return response()->json([
            'total_customers' => $totalCustomers,
            'new_this_month' => $newThisMonth,
            'returning_customers' => $returningCustomers,
            'top_by_spending' => $topBySpending,
        ]);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
