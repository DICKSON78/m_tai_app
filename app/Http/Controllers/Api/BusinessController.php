<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\BusinessCapital;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BusinessController extends Controller
{
    public function index(Request $request)
    {
        $businesses = $request->user()->businesses()
            ->withCount(['products', 'orders', 'employees'])
            ->get();

        return response()->json($businesses);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'business_name' => 'required|string|max:255',
            'business_type' => 'required|string|max:255',
            'business_category' => 'required|string|max:255',
            'region' => 'required|string|max:255',
            'district' => 'required|string|max:255',
            'ward' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'road' => 'nullable|string|max:255',
            'working_days' => 'nullable|array',
            'working_hours' => 'nullable|array',
            'payment_code' => 'nullable|string|max:50',
            'bank_account_number' => 'nullable|string|max:50',
        ]);

        $validated['user_id'] = $request->user()->id;
        $validated['business_code'] = Business::generateBusinessCode($validated['district']);
        $validated['status'] = 'pending';

        $business = Business::create($validated);

        return response()->json($business, 201);
    }

    public function show(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $business->loadCount(['products', 'orders', 'employees', 'customers']);
        $business->load('capitals');

        return response()->json($business);
    }

    public function update(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'business_name' => 'sometimes|string|max:255',
            'business_type' => 'sometimes|string|max:255',
            'business_category' => 'sometimes|string|max:255',
            'region' => 'sometimes|string|max:255',
            'district' => 'sometimes|string|max:255',
            'ward' => 'nullable|string|max:255',
            'street' => 'nullable|string|max:255',
            'road' => 'nullable|string|max:255',
            'working_days' => 'nullable|array',
            'working_hours' => 'nullable|array',
            'payment_code' => 'nullable|string|max:50',
            'bank_account_number' => 'nullable|string|max:50',
            'business_logo' => 'nullable|image|max:2048',
            'is_published' => 'sometimes|boolean',
        ]);

        if ($request->hasFile('business_logo')) {
            if ($business->business_logo) {
                Storage::disk('public')->delete($business->business_logo);
            }
            $validated['business_logo'] = $request->file('business_logo')->store('businesses', 'public');
        }

        $business->update($validated);

        return response()->json($business);
    }

    public function destroy(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        if ($business->orders()->count() > 0) {
            return response()->json(['message' => 'Haiwezi kufuta biashara yenye maagizo.'], 422);
        }

        $business->delete();

        return response()->json(['message' => 'Biashara imefutwa.']);
    }

    public function switch(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        if ($business->status !== 'active') {
            return response()->json(['message' => 'Biashara hii haijaamilishwa.'], 422);
        }

        $request->session()->put('active_business_id', $business->id);

        return response()->json([
            'message' => 'Umefanikiwa kubadilisha biashara.',
            'business' => $business,
        ]);
    }

    public function addCapital(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'capital_amount' => 'required|numeric|min:0',
            'source' => 'required|in:personal_savings,salary_income,farm_income,bank_loan,friendly_loan,mali_kauli_loan,amana_cash,other',
            'designation' => 'nullable|string',
            'registration_date' => 'required|date',
        ]);

        $capital = $business->capitals()->create($validated);

        $totalCapital = $business->capitals()->sum('capital_amount');
        $business->update(['opening_capital' => $totalCapital]);

        return response()->json([
            'message' => 'Mtaji umewekwa.',
            'capital' => $capital,
            'total_capital' => $totalCapital,
        ], 201);
    }

    public function getCapitals(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $capitals = $business->capitals()->get();
        $total = $business->capitals()->sum('capital_amount');

        return response()->json([
            'capitals' => $capitals,
            'total_capital' => $total,
        ]);
    }

    public function profile(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;
        $business = Business::with('user:id,name,email')->find($businessId);

        return response()->json($business);
    }

    public function stats(Request $request, ?Business $business = null)
    {
        if ($business === null) {
            $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

            return response()->json([
                'products_count' => \App\Models\Product::where('business_id', $businessId)->count(),
                'orders_count' => \App\Models\Order::where('business_id', $businessId)->count(),
                'customers_count' => \App\Models\Customer::where('business_id', $businessId)->count(),
                'revenue' => \App\Models\Order::where('business_id', $businessId)->where('status', 'completed')->sum('total'),
            ]);
        }

        $this->authorizeBusiness($request, $business);

        return response()->json([
            'total_products' => $business->products()->count(),
            'published_products' => $business->products()->where('is_published', true)->count(),
            'draft_products' => $business->products()->where('is_draft', true)->count(),
            'low_stock' => $business->products()->where('quantity', '<=', 5)->count(),
            'total_orders' => $business->orders()->count(),
            'today_orders' => $business->orders()->whereDate('created_at', today())->count(),
            'total_sales' => (float) $business->orders()->sum('total'),
            'today_sales' => (float) $business->orders()->whereDate('created_at', today())->sum('total'),
            'total_employees' => $business->employees()->count(),
            'total_customers' => $business->customers()->count(),
            'opening_capital' => (float) $business->opening_capital,
            'total_expenses' => (float) $business->expenses()->sum('amount'),
        ]);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
