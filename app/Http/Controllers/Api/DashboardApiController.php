<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardApiController extends Controller
{
    public function adminDashboard()
    {
        $totalOrders = Order::count();
        $totalRevenue = (float) Order::where('status', 'completed')->sum('total');
        $avgOrderValue = $totalOrders > 0 ? round($totalRevenue / $totalOrders) : 0;

        $newCustomersMonth = User::where('role', 'customer')
            ->whereMonth('created_at', now()->month)
            ->whereYear('created_at', now()->year)
            ->count();

        $recentOrders = Order::with(['business:id,business_name', 'customer:id,full_name'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        $monthlyRevenue = Order::where('status', 'completed')
            ->where('created_at', '>=', now()->subMonths(6)->startOfMonth())
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

        $monthlyOrders = Order::where('created_at', '>=', now()->subMonths(6)->startOfMonth())
            ->select(
                DB::raw("DATE_FORMAT(created_at, '%Y-%m') as month"),
                DB::raw('COUNT(*) as orders')
            )
            ->groupBy('month')
            ->orderBy('month', 'asc')
            ->get()
            ->map(fn ($row) => [
                'month' => date('M', strtotime($row->month . '-01')),
                'orders' => (int) $row->orders,
            ]);

        return response()->json([
            'total_businesses' => Business::count(),
            'total_customers' => User::where('role', 'customer')->count(),
            'total_users' => User::count(),
            'total_orders' => $totalOrders,
            'total_revenue' => $totalRevenue,
            'new_customers_month' => $newCustomersMonth,
            'avg_order_value' => $avgOrderValue,
            'recent_orders' => $recentOrders,
            'monthly_revenue' => $monthlyRevenue,
            'monthly_orders' => $monthlyOrders,
        ]);
    }

    public function ownerDashboard(Request $request)
    {
        $business = $request->user()->businesses()->first();

        return response()->json([
            'business' => $business,
            'totalProducts' => $business ? $business->products()->count() : 0,
            'totalOrders' => $business ? $business->orders()->count() : 0,
            'todaySales' => $business ? (float) $business->orders()->whereDate('created_at', today())->sum('total') : 0,
            'totalExpenses' => $business ? (float) $business->expenses()->sum('amount') : 0,
            'totalEmployees' => $business ? $business->employees()->count() : 0,
            'lowStockProducts' => $business ? $business->products()->where('quantity', '<=', 5)->count() : 0,
            'activeLoans' => $business ? $business->loans()->where('status', 'active')->count() : 0,
            'pendingCreditSales' => $business ? (float) $business->creditSales()->where('status', 'pending')->sum('amount') : 0,
        ]);
    }

    public function employeeDashboard(Request $request)
    {
        $employee = $request->user()->employees()->first();
        $business = $employee ? $employee->business : null;

        return response()->json([
            'employee' => $employee,
            'business' => $business,
            'todayOrders' => $business ? $business->orders()->whereDate('created_at', today())->count() : 0,
            'todaySales' => $business ? (float) $business->orders()->whereDate('created_at', today())->sum('total') : 0,
        ]);
    }

    public function customerDashboard(Request $request)
    {
        $customer = $request->user()->customer;

        return response()->json([
            'customer' => $customer,
            'totalOrders' => $customer ? $customer->orders()->count() : 0,
            'recentOrders' => $customer ? $customer->orders()->latest()->take(5)->get() : [],
        ]);
    }

    public function transporterDashboard(Request $request)
    {
        $transporter = $request->user()->transporter;

        return response()->json([
            'transporter' => $transporter,
            'pendingDeliveries' => $transporter ? $transporter->deliveries()->where('status', 'pending')->count() : 0,
            'activeDeliveries' => $transporter ? $transporter->deliveries()->where('status', 'in_transit')->count() : 0,
            'completedDeliveries' => $transporter ? $transporter->deliveries()->where('status', 'delivered')->count() : 0,
        ]);
    }
}
