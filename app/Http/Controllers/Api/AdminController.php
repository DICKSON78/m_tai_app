<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Customer;
use App\Models\User;
use App\Models\Order;
use App\Models\PlatformNotification;
use App\Models\Subscription;
use App\Models\OrderItem;
use App\Models\Expense;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AdminController extends Controller
{
    public function allBusinesses(Request $request)
    {
        $query = Business::with('user:id,name,email,phone');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('business_name', 'like', "%{$search}%")
                  ->orWhere('business_code', 'like', "%{$search}%")
                  ->orWhereHas('user', function ($uq) use ($search) {
                      $uq->where('name', 'like', "%{$search}%")
                         ->orWhere('email', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('business_type')) {
            $query->where('business_type', $request->business_type);
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20);

        $summary = [
            'total' => Business::count(),
            'shops' => Business::where('business_type', 'shop')->count(),
            'restaurants' => Business::where('business_type', 'restaurant')->count(),
            'pharmacies' => Business::where('business_type', 'pharmacy')->count(),
            'supermarkets' => Business::where('business_type', 'supermarket')->count(),
        ];

        return response()->json(['data' => $paginated->items(), 'summary' => $summary, 'current_page' => $paginated->currentPage(), 'last_page' => $paginated->lastPage(), 'total' => $paginated->total()]);
    }

    public function showBusiness(Business $business)
    {
        $business->load('user:id,name,email,phone');
        $business->loadCount('products');
        return response()->json($business);
    }

    public function storeBusiness(Request $request)
    {
        $validated = $request->validate([
            'business_name' => 'required|string|max:255',
            'business_type' => 'required|string|max:100',
            'business_category' => 'nullable|string|max:100',
            'region' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'ward' => 'nullable|string|max:100',
            'street' => 'nullable|string|max:255',
            'road' => 'nullable|string|max:255',
            'user_id' => 'required|exists:users,id',
        ]);

        $validated['business_code'] = Business::generateBusinessCode($validated['district'] ?? 'HQ');
        $validated['status'] = 'active';

        $business = Business::create($validated);

        return response()->json([
            'message' => 'Business created successfully.',
            'business' => $business->fresh()->load('user:id,name,email,phone'),
        ], 201);
    }

    public function updateBusiness(Request $request, Business $business)
    {
        $validated = $request->validate([
            'business_name' => 'sometimes|string|max:255',
            'business_type' => 'sometimes|string|max:100',
            'business_category' => 'nullable|string|max:100',
            'region' => 'nullable|string|max:100',
            'district' => 'nullable|string|max:100',
            'ward' => 'nullable|string|max:100',
            'street' => 'nullable|string|max:255',
            'road' => 'nullable|string|max:255',
            'status' => 'sometimes|in:active,suspended,closed',
        ]);

        $business->update($validated);
        return response()->json(['message' => 'Business updated successfully.', 'business' => $business->fresh()->load('user:id,name,email,phone')]);
    }

    public function deleteBusiness(Business $business)
    {
        $business->delete();
        return response()->json(['message' => 'Business deleted successfully.']);
    }

    public function verifyShop(Request $request, Business $business)
    {
        if ($business->status !== 'pending') {
            return response()->json(['message' => 'Shops in status "' . $business->status . '" cannot be verified.'], 422);
        }

        $business->update(['status' => 'active', 'verified_at' => now()]);

        if ($business->user) {
            PushNotificationController::sendNotification(
                $business->user,
                'Shop approved',
                "Hongera! Biashara yako \"{$business->business_name}\" imethibitishwa na sasa iko hai.",
                ['type' => 'shop_approval', 'business_id' => $business->id],
            );
        }

        return response()->json([
            'message' => 'Shop verified and activated.',
            'business' => $business->fresh()->load('user:id,name,email,phone'),
        ]);
    }

    public function approveShop(Request $request, Business $business)
    {
        return $this->verifyShop($request, $business);
    }

    public function suspendShop(Request $request, Business $business)
    {
        if (! in_array($business->status, ['active', 'pending'])) {
            return response()->json(['message' => 'Shop cannot be suspended from status "' . $business->status . '".'], 422);
        }

        $validated = $request->validate([
            'reason' => 'nullable|string|max:1000',
        ]);

        $business->update([
            'status' => 'suspended',
            'suspension_reason' => $validated['reason'] ?? null,
        ]);

        return response()->json([
            'message' => 'Shop suspended.',
            'business' => $business->fresh()->load('user:id,name,email,phone'),
        ]);
    }

    public function reactivateShop(Request $request, Business $business)
    {
        if ($business->status !== 'suspended') {
            return response()->json(['message' => 'Only suspended shops can be reactivated.'], 422);
        }

        $business->update(['status' => 'active', 'suspension_reason' => null]);

        return response()->json([
            'message' => 'Shop reactivated.',
            'business' => $business->fresh()->load('user:id,name,email,phone'),
        ]);
    }

    public function closeShop(Request $request, Business $business)
    {
        if ($business->status === 'closed') {
            return response()->json(['message' => 'Shop is already closed.'], 422);
        }

        $business->update(['status' => 'closed']);

        return response()->json([
            'message' => 'Shop closed.',
            'business' => $business->fresh()->load('user:id,name,email,phone'),
        ]);
    }

    public function allUsers(Request $request)
    {
        $query = User::query();

        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20);

        $summary = [
            'total' => User::count(),
            'admins' => User::where('role', 'admin')->count(),
            'owners' => User::where('role', 'business_owner')->count(),
            'customers' => User::where('role', 'customer')->count(),
            'employees' => User::where('role', 'employee')->count(),
            'transporters' => User::where('role', 'transporter')->count(),
        ];

        return response()->json(['data' => $paginated->items(), 'summary' => $summary, 'current_page' => $paginated->currentPage(), 'last_page' => $paginated->lastPage(), 'total' => $paginated->total()]);
    }

    public function storeUser(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255|unique:users',
            'phone' => 'nullable|string|max:50',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,business_owner,customer,employee,transporter',
        ]);

        $validated['password'] = bcrypt($validated['password']);

        $user = User::create($validated);

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user,
        ], 201);
    }

    public function showUser($id)
    {
        $user = User::withCount('businesses')->findOrFail($id);

        $customer = Customer::where('user_id', $user->id)->first();
        $user->orders_count = $customer ? Order::where('customer_id', $customer->id)->count() : 0;

        return response()->json($user);
    }

    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone' => 'nullable|string|max:50',
            'role' => 'sometimes|in:admin,business_owner,customer,employee,transporter',
        ]);
        $user->update($validated);
        return response()->json(['message' => 'User updated successfully.', 'user' => $user->fresh()]);
    }

    public function deleteUser($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['message' => 'User deleted successfully.']);
    }

    public function allOrders(Request $request)
    {
        $query = Order::with(['business:id,business_name,business_code', 'customer:id,full_name,phone']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('transaction_code', 'like', "%{$search}%")
                  ->orWhereHas('business', function ($bq) use ($search) {
                      $bq->where('business_name', 'like', "%{$search}%");
                  });
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('payment_status')) {
            $query->where('payment_status', $request->payment_status);
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20);

        $summary = [
            'total' => Order::count(),
            'pending' => Order::where('status', 'pending')->count(),
            'confirmed' => Order::where('status', 'confirmed')->count(),
            'completed' => Order::where('status', 'completed')->count(),
            'cancelled' => Order::where('status', 'cancelled')->count(),
            'total_revenue' => (float) Order::where('status', 'completed')->sum('total'),
        ];

        return response()->json(['data' => $paginated->items(), 'summary' => $summary, 'current_page' => $paginated->currentPage(), 'last_page' => $paginated->lastPage(), 'total' => $paginated->total()]);
    }

    public function showOrder(Order $order)
    {
        $order->load(['business:id,business_name,business_code', 'customer:id,full_name,phone,email', 'items.product', 'payments']);
        return response()->json($order);
    }

    public function updateOrder(Request $request, Order $order)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:pending,confirmed,completed,cancelled',
            'payment_status' => 'sometimes|in:unpaid,partial,paid',
        ]);
        $order->update($validated);
        return response()->json(['message' => 'Order updated successfully.', 'order' => $order->fresh()->load(['business:id,business_name', 'customer:id,full_name'])]);
    }

    public function deleteOrder(Order $order)
    {
        $order->delete();
        return response()->json(['message' => 'Order deleted successfully.']);
    }

    public function subscriptions(Request $request)
    {
        $query = Subscription::with(['business:id,business_name,business_code']);

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->whereHas('business', function ($bq) use ($search) {
                    $bq->where('business_name', 'like', "%{$search}%")
                       ->orWhere('business_code', 'like', "%{$search}%");
                });
            });
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('plan')) {
            $query->where('plan', $request->plan);
        }

        $subscriptions = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20);

        $summary = [
            'total' => Subscription::count(),
            'active' => Subscription::where('status', 'active')->count(),
            'expired' => Subscription::where('status', 'expired')->count(),
            'suspended' => Subscription::where('status', 'suspended')->count(),
            'total_revenue' => (float) Subscription::where('status', 'active')->sum('amount'),
        ];

        return response()->json([
            'data' => $subscriptions->items(),
            'summary' => $summary,
            'current_page' => $subscriptions->currentPage(),
            'last_page' => $subscriptions->lastPage(),
            'total' => $subscriptions->total(),
        ]);
    }

    public function showSubscription(Subscription $subscription)
    {
        $subscription->load(['business:id,business_name,business_code']);
        return response()->json($subscription);
    }

    public function updateSubscription(Request $request, Subscription $subscription)
    {
        $validated = $request->validate([
            'status' => 'sometimes|in:active,expired,suspended',
            'expires_at' => 'sometimes|date',
        ]);

        $subscription->update($validated);

        return response()->json([
            'message' => 'Subscription updated.',
            'subscription' => $subscription->fresh()->load(['business:id,business_name']),
        ]);
    }

    public function createSubscription(Request $request)
    {
        $validated = $request->validate([
            'business_id' => 'required|exists:businesses,id',
            'plan' => 'required|in:daily,monthly,quarterly,yearly',
            'amount' => 'nullable|numeric|min:0',
            'status' => 'nullable|in:active,expired,suspended',
        ]);

        $business = Business::findOrFail($validated['business_id']);

        $tier = null;
        if (isset($validated['amount'])) {
            $amount = $validated['amount'];
        } else {
            $profit = $this->computeBusinessProfit($business);
            $tier = $this->resolvePerformanceTier($profit);
            $dailyRate = config('mtai.subscription_rates.' . $tier, 1000);
            $multiplier = config('mtai.subscription_plan_multipliers.' . $validated['plan'], 1);
            $amount = round($dailyRate * $multiplier, 2);
        }

        $subscription = Subscription::create([
            'business_id' => $validated['business_id'],
            'plan' => $validated['plan'],
            'performance_tier' => $tier ?? 'custom',
            'amount' => $amount,
            'status' => $validated['status'] ?? 'active',
            'start_date' => now()->toDateString(),
            'end_date' => match ($validated['plan']) {
                'daily' => now()->addDay()->toDateString(),
                'monthly' => now()->addMonth()->toDateString(),
                'quarterly' => now()->addMonths(3)->toDateString(),
                'yearly' => now()->addYear()->toDateString(),
            },
        ]);

        return response()->json([
            'message' => 'Subscription created.',
            'subscription' => $subscription->fresh()->load(['business:id,business_name']),
            'profit_used' => $tier ? $profit : null,
            'performance_tier' => $tier ?? 'custom',
        ], 201);
    }

    /**
     * Compute the business's net profit for the current month:
     * revenue (completed orders) - COGS (order items cost) - expenses.
     */
    protected function computeBusinessProfit(Business $business)
    {
        $monthStart = now()->startOfMonth()->toDateString();
        $monthEnd = now()->toDateString();

        $revenue = (float) $business->orders()
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $monthStart)
            ->whereDate('created_at', '<=', $monthEnd)
            ->sum('total');

        $cogs = (float) OrderItem::whereHas('order', function ($q) use ($business, $monthStart, $monthEnd) {
                $q->where('business_id', $business->id)
                    ->where('status', 'completed')
                    ->whereDate('created_at', '>=', $monthStart)
                    ->whereDate('created_at', '<=', $monthEnd);
            })
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select(DB::raw('SUM(order_items.quantity * products.buying_price) as cogs'))
            ->value('cogs');

        $expenses = (float) Expense::where('business_id', $business->id)
            ->whereDate('date', '>=', $monthStart)
            ->whereDate('date', '<=', $monthEnd)
            ->sum('amount');

        return round($revenue - ($cogs ?? 0) - $expenses, 2);
    }

    /**
     * Map a computed profit to a subscription performance tier (SRS §22).
     */
    protected function resolvePerformanceTier($profit)
    {
        if ($profit < 100000) {
            return 'below_100000';
        }
        if ($profit < 500000) {
            return 'below_500000';
        }
        if ($profit < 1000000) {
            return 'below_1000000';
        }
        return 'above_1000000';
    }

    public function deleteSubscription(Subscription $subscription)
    {
        $subscription->delete();
        return response()->json(['message' => 'Subscription deleted.']);
    }

    public function createAnnouncement(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'message' => 'required|string',
            'type' => 'nullable|in:update,maintenance,promotion,alert',
            'target' => 'nullable|in:all,shops,customers,delivery_providers',
        ]);

        $announcement = PlatformNotification::create([
            'title' => $validated['title'],
            'message' => $validated['message'],
            'type' => $validated['type'] ?? 'update',
            'target' => $validated['target'] ?? 'all',
            'sent_by' => $request->user()->id,
        ]);

        return response()->json([
            'message' => 'Announcement created.',
            'announcement' => $announcement,
        ], 201);
    }

    public function announcements(Request $request)
    {
        $query = PlatformNotification::query();

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('target')) {
            $query->where('target', $request->target);
        }

        $paginated = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 20);

        $summary = [
            'total' => PlatformNotification::count(),
        ];

        return response()->json(['data' => $paginated->items(), 'summary' => $summary, 'current_page' => $paginated->currentPage(), 'last_page' => $paginated->lastPage(), 'total' => $paginated->total()]);
    }

    public function showAnnouncement(PlatformNotification $announcement)
    {
        return response()->json($announcement);
    }

    public function updateAnnouncement(Request $request, PlatformNotification $announcement)
    {
        $validated = $request->validate([
            'title' => 'sometimes|string|max:255',
            'message' => 'sometimes|string',
            'type' => 'nullable|in:update,maintenance,promotion,alert',
            'target' => 'nullable|in:all,shops,customers,delivery_providers',
        ]);

        $announcement->update($validated);
        return response()->json(['message' => 'Announcement updated.', 'announcement' => $announcement->fresh()]);
    }

    public function deleteAnnouncement(PlatformNotification $announcement)
    {
        $announcement->delete();
        return response()->json(['message' => 'Announcement deleted.']);
    }

    public function reports(Request $request)
    {
        $range = $request->range ?? 'this_month';

        $since = match ($range) {
            'this_week' => now()->startOfWeek(),
            'this_month' => now()->startOfMonth(),
            'this_year' => now()->startOfYear(),
            'all_time' => now()->subYears(10),
            default => now()->startOfMonth(),
        };

        $newCustomersMonth = User::where('role', 'customer')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $monthlyData = Order::where('status', 'completed')
            ->where('created_at', '>=', $since)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('SUM(total) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get()
            ->map(fn ($row) => [
                'month' => date('M', strtotime($row->month . '-01')),
                'revenue' => (float) $row->revenue,
                'orders' => (int) $row->orders,
            ]);

        return response()->json([
            'total_businesses' => Business::count(),
            'total_customers' => User::where('role', 'customer')->count(),
            'total_users' => User::count(),
            'total_orders' => Order::count(),
            'total_revenue' => (float) Order::where('status', 'completed')->sum('total'),
            'new_customers_month' => $newCustomersMonth,
            'monthly_data' => $monthlyData,
        ]);
    }

    public function profitability(Request $request)
    {
        $range = $request->range ?? 'this_month';
        $since = match ($range) {
            'this_week' => now()->startOfWeek(),
            'this_month' => now()->startOfMonth(),
            'this_year' => now()->startOfYear(),
            'all_time' => now()->subYears(10),
            default => now()->startOfMonth(),
        };

        $completedIds = Order::where('status', 'completed')
            ->whereDate('created_at', '>=', $since)
            ->pluck('id');

        $revenue = (float) Order::where('status', 'completed')
            ->where('created_at', '>=', $since)
            ->sum('total');

        $cogs = (float) OrderItem::whereIn('order_id', $completedIds)
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select(DB::raw('SUM(order_items.quantity * products.buying_price) as cogs'))
            ->value('cogs');

        $expenses = (float) Expense::whereDate('date', '>=', $since)->sum('amount');

        $grossProfit = $revenue - $cogs;
        $netProfit = $grossProfit - $expenses;
        $margin = $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : 0;

        $topBusinesses = Business::withCount('orders')
            ->withSum(['orders as revenue' => fn ($q) => $q->where('status', 'completed')], 'total')
            ->orderByDesc('revenue')
            ->take((int) $request->get('top', 10))
            ->get()
            ->map(fn ($b) => [
                'id' => $b->id,
                'name' => $b->name,
                'type' => $b->type,
                'revenue' => round((float) $b->revenue, 2),
                'orders_count' => $b->orders_count,
            ]);

        return response()->json([
            'period' => $range,
            'total_revenue' => round($revenue, 2),
            'total_cogs' => round($cogs, 2),
            'total_expenses' => round($expenses, 2),
            'gross_profit' => round($grossProfit, 2),
            'net_profit' => round($netProfit, 2),
            'net_margin_percent' => $margin,
            'top_businesses' => $topBusinesses,
        ]);
    }

    public function finance(Request $request)
    {
        $period = $request->period ?? 'all_time';
        $since = match ($period) {
            'this_week' => now()->startOfWeek(),
            'this_month' => now()->startOfMonth(),
            'this_year' => now()->startOfYear(),
            'all_time' => now()->subYears(10),
            default => now()->startOfMonth(),
        };

        $totalRevenue = (float) Order::where('status', 'completed')->sum('total');
        $totalOrders = Order::count();
        $avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders) : 0;
        $totalSubsRevenue = (float) \App\Models\Subscription::sum('amount');

        $monthlyRevenue = Order::where('status', 'completed')
            ->where('created_at', '>=', $since)
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('SUM(total) as revenue')
            )
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get()
            ->map(fn ($row) => [
                'month' => date('M', strtotime($row->month . '-01')),
                'revenue' => (float) $row->revenue,
            ]);

        $revenueByPayment = \App\Models\Payment::where('status', 'confirmed')
            ->where('created_at', '>=', $since)
            ->select('method', DB::raw('SUM(amount) as total'))
            ->groupBy('method')
            ->get()
            ->map(fn ($row) => [
                'method' => $row->method,
                'total' => (float) $row->total,
            ]);

        $recentPayments = \App\Models\Payment::with('order:id,business_id')
            ->where('status', 'confirmed')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($p) {
                $business = $p->order ? \App\Models\Business::find($p->order->business_id) : null;
                return [
                    'id' => $p->id,
                    'amount' => $p->amount,
                    'method' => $p->method,
                    'status' => $p->status,
                    'business_name' => $business?->business_name ?? '-',
                    'created_at' => $p->created_at,
                ];
            });

        return response()->json([
            'total_revenue' => $totalRevenue,
            'total_orders' => $totalOrders,
            'avg_order_value' => $avgOrderValue,
            'total_subscriptions_revenue' => $totalSubsRevenue,
            'monthly_revenue' => $monthlyRevenue,
            'revenue_by_payment' => $revenueByPayment,
            'recent_payments' => $recentPayments,
        ]);
    }

    public function deliveries(Request $request)
    {
        $query = \App\Models\Delivery::with(['order:id,transaction_code', 'customer:id,full_name', 'transporter'])
            ->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->whereHas('order', function ($q) use ($search) {
                $q->where('transaction_code', 'like', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status !== '') {
            $query->where('status', $request->status);
        }

        $paginated = $query->paginate($request->per_page ?? 15);

        $summary = [
            'total' => \App\Models\Delivery::count(),
            'pending' => \App\Models\Delivery::where('status', 'pending')->count(),
            'in_transit' => \App\Models\Delivery::where('status', 'in_transit')->count(),
            'delivered' => \App\Models\Delivery::where('status', 'delivered')->count(),
        ];

        return response()->json([
            'data' => $paginated->items(),
            'summary' => $summary,
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function allCoupons(Request $request)
    {
        $query = \App\Models\Coupon::with('business:id,business_name')
            ->orderBy('created_at', 'desc');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('code', 'like', "%{$search}%")
                  ->orWhereHas('business', function ($bq) use ($search) {
                      $bq->where('business_name', 'like', "%{$search}%");
                  });
            });
        }

        $paginated = $query->paginate($request->per_page ?? 15);

        return response()->json([
            'data' => $paginated->items(),
            'current_page' => $paginated->currentPage(),
            'last_page' => $paginated->lastPage(),
            'total' => $paginated->total(),
        ]);
    }

    public function getSettings(Request $request)
    {
        $settings = cache()->remember('system_settings', 3600, function () {
            return [
                'app_name' => 'M-TAI',
                'app_version' => '1.0.0',
                'currency' => 'TZS',
                'max_file_upload_size' => 2048,
                'max_businesses_per_user' => 5,
                'default_pagination' => 20,
                'maintenance_mode' => false,
            ];
        });

        return response()->json($settings);
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'app_name' => 'sometimes|string|max:255',
            'currency' => 'sometimes|string|max:10',
            'max_file_upload_size' => 'sometimes|integer|min:100',
            'max_businesses_per_user' => 'sometimes|integer|min:1',
            'default_pagination' => 'sometimes|integer|min:5',
            'maintenance_mode' => 'sometimes|boolean',
        ]);

        cache()->forget('system_settings');
        $settings = cache()->remember('system_settings', 3600, fn () => $validated);

        return response()->json(['message' => 'Settings updated.', 'settings' => $settings]);
    }
}
