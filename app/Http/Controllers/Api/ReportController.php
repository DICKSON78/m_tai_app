<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\CreditSale;
use App\Models\Customer;
use App\Models\Delivery;
use App\Models\Expense;
use App\Models\Loan;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function salesReport(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'period' => 'sometimes|in:daily,weekly,monthly,yearly',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $period = $validated['period'] ?? 'daily';
        $dateFrom = $validated['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $validated['date_to'] ?? now()->toDateString();

        $periodColumn = match ($period) {
            'daily' => DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d') as period"),
            'weekly' => DB::raw("DATE_FORMAT(created_at, '%Y-W%u') as period"),
            'monthly' => DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
            'yearly' => DB::raw("DATE_FORMAT(created_at, '%Y') as period"),
            default => DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d') as period"),
        };

        $orders = $business->orders()
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo);

        $salesByPeriod = (clone $orders)
            ->select(
                $periodColumn,
                DB::raw('COUNT(*) as total_orders'),
                DB::raw('SUM(total) as total_revenue'),
                DB::raw('SUM(subtotal) as total_subtotal'),
                DB::raw('SUM(discount) as total_discount'),
                DB::raw('SUM(tax) as total_tax'),
                DB::raw('AVG(total) as average_order_value')
            )
            ->groupBy('period')
            ->orderBy('period', 'desc')
            ->get();

        $totalRevenue = (clone $orders)->sum('total');
        $totalOrders = (clone $orders)->count();
        $totalDiscount = (clone $orders)->sum('discount');
        $totalTax = (clone $orders)->sum('tax');

        $salesByPaymentMethod = $business->payments()
            ->whereHas('order', function ($q) use ($dateFrom, $dateTo) {
                $q->where('status', 'completed')
                    ->whereDate('created_at', '>=', $dateFrom)
                    ->whereDate('created_at', '<=', $dateTo);
            })
            ->select('method', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('method')
            ->get();

        $topProducts = OrderItem::whereHas('order', function ($q) use ($business, $dateFrom, $dateTo) {
                $q->where('business_id', $business->id)
                    ->where('status', 'completed')
                    ->whereDate('created_at', '>=', $dateFrom)
                    ->whereDate('created_at', '<=', $dateTo);
            })
            ->select('product_id', DB::raw('SUM(quantity) as total_quantity'), DB::raw('SUM(total_price) as total_revenue'))
            ->with('product:id,name,image')
            ->groupBy('product_id')
            ->orderBy('total_revenue', 'desc')
            ->limit(10)
            ->get();

        return response()->json([
            'summary' => [
                'total_revenue' => (float) $totalRevenue,
                'total_orders' => $totalOrders,
                'average_order_value' => $totalOrders > 0 ? round((float) $totalRevenue / $totalOrders, 2) : 0,
                'total_discount' => (float) $totalDiscount,
                'total_tax' => (float) $totalTax,
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'by_period' => $salesByPeriod,
            'by_payment_method' => $salesByPaymentMethod,
            'top_products' => $topProducts,
        ]);
    }

    public function profitReport(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'period' => 'sometimes|in:daily,weekly,monthly,yearly',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $period = $validated['period'] ?? 'daily';
        $dateFrom = $validated['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $validated['date_to'] ?? now()->toDateString();

        $periodColumn = match ($period) {
            'daily' => DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d') as period"),
            'weekly' => DB::raw("DATE_FORMAT(created_at, '%Y-W%u') as period"),
            'monthly' => DB::raw("DATE_FORMAT(created_at, '%Y-%m') as period"),
            'yearly' => DB::raw("DATE_FORMAT(created_at, '%Y') as period"),
            default => DB::raw("DATE_FORMAT(created_at, '%Y-%m-%d') as period"),
        };

        $orders = $business->orders()
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo);

        $revenueByPeriod = (clone $orders)
            ->select(
                $periodColumn,
                DB::raw('SUM(total) as revenue')
            )
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        $cogsByPeriod = OrderItem::whereHas('order', function ($q) use ($business, $dateFrom, $dateTo) {
                $q->where('business_id', $business->id)
                    ->where('status', 'completed')
                    ->whereDate('created_at', '>=', $dateFrom)
                    ->whereDate('created_at', '<=', $dateTo);
            })
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select(
                match ($period) {
                    'daily' => DB::raw("DATE_FORMAT(order_items.created_at, '%Y-%m-%d') as period"),
                    'weekly' => DB::raw("DATE_FORMAT(order_items.created_at, '%Y-W%u') as period"),
                    'monthly' => DB::raw("DATE_FORMAT(order_items.created_at, '%Y-%m') as period"),
                    'yearly' => DB::raw("DATE_FORMAT(order_items.created_at, '%Y') as period"),
                    default => DB::raw("DATE_FORMAT(order_items.created_at, '%Y-%m-%d') as period"),
                },
                DB::raw('SUM(order_items.quantity * products.buying_price) as cost_of_goods')
            )
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        $expensesByPeriod = $business->expenses()
            ->whereDate('date', '>=', $dateFrom)
            ->whereDate('date', '<=', $dateTo)
            ->select(
                match ($period) {
                    'daily' => DB::raw("DATE_FORMAT(date, '%Y-%m-%d') as period"),
                    'weekly' => DB::raw("DATE_FORMAT(date, '%Y-W%u') as period"),
                    'monthly' => DB::raw("DATE_FORMAT(date, '%Y-%m') as period"),
                    'yearly' => DB::raw("DATE_FORMAT(date, '%Y') as period"),
                    default => DB::raw("DATE_FORMAT(date, '%Y-%m-%d') as period"),
                },
                DB::raw('SUM(amount) as expenses')
            )
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        $allPeriods = $revenueByPeriod->keys()
            ->merge($cogsByPeriod->keys())
            ->merge($expensesByPeriod->keys())
            ->unique()
            ->sort()
            ->values();

        $profitByPeriod = $allPeriods->map(function ($period) use ($revenueByPeriod, $cogsByPeriod, $expensesByPeriod) {
            $revenue = (float) ($revenueByPeriod->get($period)->revenue ?? 0);
            $cogs = (float) ($cogsByPeriod->get($period)->cost_of_goods ?? 0);
            $expenses = (float) ($expensesByPeriod->get($period)->expenses ?? 0);
            $gtp = $revenue - $cogs;
            $gdp = $gtp - $expenses;

            return [
                'period' => $period,
                'revenue' => round($revenue, 2),
                'cost_of_goods' => round($cogs, 2),
                'gross_profit' => round($gtp, 2),
                'expenses' => round($expenses, 2),
                'net_profit' => round($gdp, 2),
                'profit_margin' => $revenue > 0 ? round(($gdp / $revenue) * 100, 2) : 0,
            ];
        })->values();

        $totalRevenue = (float) $orders->sum('total');

        $totalCogs = OrderItem::whereHas('order', function ($q) use ($business, $dateFrom, $dateTo) {
                $q->where('business_id', $business->id)
                    ->where('status', 'completed')
                    ->whereDate('created_at', '>=', $dateFrom)
                    ->whereDate('created_at', '<=', $dateTo);
            })
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->sum(DB::raw('order_items.quantity * products.buying_price'));

        $totalExpenses = $business->expenses()
            ->whereDate('date', '>=', $dateFrom)
            ->whereDate('date', '<=', $dateTo)
            ->sum('amount');

        $gtp = $totalRevenue - (float) $totalCogs;
        $gdp = $gtp - (float) $totalExpenses;

        return response()->json([
            'summary' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_cost_of_goods' => round((float) $totalCogs, 2),
                'grand_total_profit' => round($gtp, 2),
                'total_expenses' => round((float) $totalExpenses, 2),
                'grand_daily_profit' => round($gdp, 2),
                'profit_margin' => $totalRevenue > 0 ? round(($gdp / $totalRevenue) * 100, 2) : 0,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'by_period' => $profitByPeriod,
        ]);
    }

    public function expenseReport(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'period' => 'sometimes|in:daily,weekly,monthly,yearly',
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'category' => 'nullable|string',
        ]);

        $period = $validated['period'] ?? 'monthly';
        $dateFrom = $validated['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $validated['date_to'] ?? now()->toDateString();

        $periodColumn = match ($period) {
            'daily' => DB::raw("DATE_FORMAT(date, '%Y-%m-%d') as period"),
            'weekly' => DB::raw("DATE_FORMAT(date, '%Y-W%u') as period"),
            'monthly' => DB::raw("DATE_FORMAT(date, '%Y-%m') as period"),
            'yearly' => DB::raw("DATE_FORMAT(date, '%Y') as period"),
            default => DB::raw("DATE_FORMAT(date, '%Y-%m') as period"),
        };

        $query = $business->expenses()
            ->whereDate('date', '>=', $dateFrom)
            ->whereDate('date', '<=', $dateTo);

        if (!empty($validated['category'])) {
            $query->where('category', $validated['category']);
        }

        $byPeriod = (clone $query)
            ->select(
                $periodColumn,
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('period')
            ->orderBy('period', 'desc')
            ->get();

        $byCategory = (clone $query)
            ->select(
                'category',
                DB::raw('SUM(amount) as total_amount'),
                DB::raw('COUNT(*) as count')
            )
            ->groupBy('category')
            ->orderBy('total_amount', 'desc')
            ->get();

        $byType = (clone $query)
            ->select('type', DB::raw('SUM(amount) as total_amount'), DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->get();

        $totalExpenses = (clone $query)->sum('amount');

        return response()->json([
            'summary' => [
                'total_expenses' => (float) $totalExpenses,
                'period' => $period,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'by_period' => $byPeriod,
            'by_category' => $byCategory,
            'by_type' => $byType,
        ]);
    }

    public function inventoryReport(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $products = $business->products()->select('id', 'name', 'quantity', 'buying_price', 'selling_price');

        $totalProducts = (clone $products)->count();
        $totalStockValue = (float) (clone $products)->sum(DB::raw('quantity * buying_price'));
        $totalRetailValue = (float) (clone $products)->sum(DB::raw('quantity * selling_price'));

        $outOfStock = (clone $products)->where('quantity', 0)->count();
        $lowStock = (clone $products)->where('quantity', '>', 0)->where('quantity', '<=', 5)->count();
        $mediumStock = (clone $products)->where('quantity', '>', 5)->where('quantity', '<=', 20)->count();
        $healthyStock = (clone $products)->where('quantity', '>', 20)->count();

        $byCategory = $business->products()
            ->join('categories', 'products.category_id', '=', 'categories.id')
            ->select(
                'categories.name as category_name',
                DB::raw('COUNT(products.id) as product_count'),
                DB::raw('SUM(products.quantity) as total_quantity'),
                DB::raw('SUM(products.quantity * products.buying_price) as stock_value'),
                DB::raw('SUM(products.quantity * products.selling_price) as retail_value')
            )
            ->groupBy('categories.id', 'categories.name')
            ->get();

        $potentialProfit = $totalRetailValue - $totalStockValue;

        $topValueProducts = $business->products()
            ->select('id', 'name', 'quantity', 'buying_price', 'selling_price')
            ->orderByRaw('quantity * buying_price', 'desc')
            ->limit(10)
            ->get()
            ->map(function ($p) {
                $p->stock_value = round($p->quantity * $p->buying_price, 2);
                $p->potential_profit = round($p->quantity * ($p->selling_price - $p->buying_price), 2);
                return $p;
            });

        return response()->json([
            'summary' => [
                'total_products' => $totalProducts,
                'total_stock_value' => round($totalStockValue, 2),
                'total_retail_value' => round($totalRetailValue, 2),
                'potential_profit' => round($potentialProfit, 2),
                'out_of_stock' => $outOfStock,
                'low_stock' => $lowStock,
                'medium_stock' => $mediumStock,
                'healthy_stock' => $healthyStock,
            ],
            'by_category' => $byCategory,
            'top_value_products' => $topValueProducts,
        ]);
    }

    public function customerReport(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
            'limit' => 'nullable|integer|min:1|max:50',
        ]);

        $dateFrom = $validated['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $validated['date_to'] ?? now()->toDateString();
        $limit = $validated['limit'] ?? 20;

        $ordersQuery = Order::where('business_id', $business->id)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo);

        $topCustomers = (clone $ordersQuery)
            ->join('customers', 'orders.customer_id', '=', 'customers.id')
            ->select(
                'customers.id',
                'customers.full_name',
                'customers.phone',
                DB::raw('COUNT(orders.id) as total_orders'),
                DB::raw('SUM(orders.total) as total_spent'),
                DB::raw('AVG(orders.total) as average_order_value'),
                DB::raw('MAX(orders.created_at) as last_order_date')
            )
            ->groupBy('customers.id', 'customers.full_name', 'customers.phone')
            ->orderBy('total_spent', 'desc')
            ->limit($limit)
            ->get();

        $totalCustomers = $business->customers()->count();
        $activeCustomers = (clone $ordersQuery)->distinct('customer_id')->count('customer_id');

        $customerTypeBreakdown = $business->customers()
            ->select('is_guest', DB::raw('COUNT(*) as count'))
            ->groupBy('is_guest')
            ->get()
            ->map(function ($item) {
                return [
                    'type' => $item->is_guest ? 'guest' : 'registered',
                    'count' => $item->count,
                ];
            });

        $newCustomers = $business->customers()
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->count();

        return response()->json([
            'summary' => [
                'total_customers' => $totalCustomers,
                'active_customers' => $activeCustomers,
                'new_customers' => $newCustomers,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'top_customers' => $topCustomers,
            'customer_types' => $customerTypeBreakdown,
        ]);
    }

    public function loanReport(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $loans = $business->loans();

        $totalLoans = (clone $loans)->count();
        $totalLoanAmount = (float) (clone $loans)->sum('loan_amount');
        $totalLoanBalance = (float) (clone $loans)->sum('loan_balance');
        $totalPaid = $totalLoanAmount - $totalLoanBalance;

        $byStatus = (clone $loans)
            ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(loan_amount) as total_amount'), DB::raw('SUM(loan_balance) as total_balance'))
            ->groupBy('status')
            ->get();

        $byType = (clone $loans)
            ->select('loan_type', DB::raw('COUNT(*) as count'), DB::raw('SUM(loan_amount) as total_amount'), DB::raw('SUM(loan_balance) as total_balance'))
            ->groupBy('loan_type')
            ->get();

        $overdueLoans = (clone $loans)
            ->where('status', 'active')
            ->where('due_date', '<', now())
            ->get(['id', 'loan_type', 'loan_amount', 'loan_balance', 'due_date']);

        return response()->json([
            'summary' => [
                'total_loans' => $totalLoans,
                'total_loan_amount' => round($totalLoanAmount, 2),
                'total_paid' => round($totalPaid, 2),
                'total_balance' => round($totalLoanBalance, 2),
                'overdue_count' => $overdueLoans->count(),
            ],
            'by_status' => $byStatus,
            'by_type' => $byType,
            'overdue_loans' => $overdueLoans,
        ]);
    }

    public function deliveryReport(Request $request, Business $business)
    {
        $this->authorizeBusiness($request, $business);

        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $dateFrom = $validated['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $validated['date_to'] ?? now()->toDateString();

        $deliveries = $business->deliveries()
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo);

        $totalDeliveries = (clone $deliveries)->count();
        $totalValue = (float) (clone $deliveries)->sum('offered_price');

        $byStatus = (clone $deliveries)
            ->select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(offered_price) as total_value'))
            ->groupBy('status')
            ->get();

        $byGoodsCategory = (clone $deliveries)
            ->select('goods_category', DB::raw('COUNT(*) as count'), DB::raw('SUM(offered_price) as total_value'))
            ->groupBy('goods_category')
            ->get();

        $pendingDeliveries = $business->deliveries()
            ->where('status', 'pending')
            ->with('customer:id,full_name,phone')
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $completedDeliveries = $business->deliveries()
            ->where('status', 'delivered')
            ->count();

        $completionRate = $totalDeliveries > 0
            ? round(($completedDeliveries / $totalDeliveries) * 100, 2)
            : 0;

        return response()->json([
            'summary' => [
                'total_deliveries' => $totalDeliveries,
                'total_value' => round($totalValue, 2),
                'completed' => $completedDeliveries,
                'completion_rate' => $completionRate,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
            'by_status' => $byStatus,
            'by_goods_category' => $byGoodsCategory,
            'pending_deliveries' => $pendingDeliveries,
        ]);
    }

    public function sales(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $dateFrom = $validated['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $validated['date_to'] ?? now()->toDateString();

        $orders = Order::where('business_id', $businessId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo);

        $totalRevenue = (float) (clone $orders)->sum('total');
        $totalOrders = (clone $orders)->count();

        return response()->json([
            'summary' => [
                'total_revenue' => round($totalRevenue, 2),
                'total_orders' => $totalOrders,
                'average_order_value' => $totalOrders > 0 ? round($totalRevenue / $totalOrders, 2) : 0,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    public function profit(Request $request)
    {
        $businessId = $request->user()->current_business_id ?? $request->user()->businesses()->first()?->id;

        $validated = $request->validate([
            'date_from' => 'nullable|date',
            'date_to' => 'nullable|date',
        ]);

        $dateFrom = $validated['date_from'] ?? now()->startOfMonth()->toDateString();
        $dateTo = $validated['date_to'] ?? now()->toDateString();

        $revenue = (float) Order::where('business_id', $businessId)
            ->where('status', 'completed')
            ->whereDate('created_at', '>=', $dateFrom)
            ->whereDate('created_at', '<=', $dateTo)
            ->sum('total');

        $cogs = (float) OrderItem::whereHas('order', function ($q) use ($businessId, $dateFrom, $dateTo) {
                $q->where('business_id', $businessId)
                    ->where('status', 'completed')
                    ->whereDate('created_at', '>=', $dateFrom)
                    ->whereDate('created_at', '<=', $dateTo);
            })
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->sum(DB::raw('order_items.quantity * products.buying_price'));

        $expenses = (float) Expense::where('business_id', $businessId)
            ->whereDate('date', '>=', $dateFrom)
            ->whereDate('date', '<=', $dateTo)
            ->sum('amount');

        $grossProfit = $revenue - $cogs;
        $netProfit = $grossProfit - $expenses;

        return response()->json([
            'summary' => [
                'total_revenue' => round($revenue, 2),
                'total_cost_of_goods' => round($cogs, 2),
                'gross_profit' => round($grossProfit, 2),
                'total_expenses' => round($expenses, 2),
                'net_profit' => round($netProfit, 2),
                'profit_margin' => $revenue > 0 ? round(($netProfit / $revenue) * 100, 2) : 0,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
            ],
        ]);
    }

    protected function authorizeBusiness(Request $request, Business $business)
    {
        if ($business->user_id !== $request->user()->id) {
            abort(403, 'Huna ruhusa ya kufanya operesheni hii.');
        }
    }
}
