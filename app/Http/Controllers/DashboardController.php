<?php

namespace App\Http\Controllers;

use App\Models\Business;
use App\Models\Order;
use App\Models\Product;
use App\Models\Customer;
use App\Models\Employee;
use App\Models\Expense;
use App\Models\Loan;
use App\Models\CreditSale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class DashboardController extends Controller
{
    public function adminDashboard()
    {
        $data = [
            'totalShops' => Business::count(),
            'activeShops' => Business::where('status', 'active')->count(),
            'pendingApprovals' => Business::where('status', 'pending')->count(),
            'totalCustomers' => \App\Models\User::where('role', 'customer')->count(),
            'totalTransactions' => Order::count(),
            'systemRevenue' => Order::sum('total'),
        ];
        return view('dashboards.admin', compact('data'));
    }

    public function ownerDashboard()
    {
        $user = Auth::user();
        $business = $user->businesses()->first();

        $data = [
            'business' => $business,
            'totalProducts' => $business ? $business->products()->count() : 0,
            'totalOrders' => $business ? $business->orders()->count() : 0,
            'todaySales' => $business ? $business->orders()->whereDate('created_at', today())->sum('total') : 0,
            'totalExpenses' => $business ? $business->expenses()->sum('amount') : 0,
            'totalEmployees' => $business ? $business->employees()->count() : 0,
            'lowStockProducts' => $business ? $business->products()->where('quantity', '<=', 5)->count() : 0,
            'activeLoans' => $business ? $business->loans()->where('status', 'active')->count() : 0,
            'pendingCreditSales' => $business ? $business->creditSales()->where('status', 'pending')->sum('amount') : 0,
        ];
        return view('dashboards.owner', compact('data'));
    }

    public function employeeDashboard()
    {
        $user = Auth::user();
        $employee = $user->employees()->first();
        $business = $employee ? $employee->business : null;

        $data = [
            'employee' => $employee,
            'business' => $business,
            'todayOrders' => $business ? $business->orders()->whereDate('created_at', today())->count() : 0,
            'todaySales' => $business ? $business->orders()->whereDate('created_at', today())->sum('total') : 0,
        ];
        return view('dashboards.employee', compact('data'));
    }

    public function customerDashboard()
    {
        $user = Auth::user();
        $customer = $user->customer;

        $data = [
            'customer' => $customer,
            'totalOrders' => $customer ? $customer->orders()->count() : 0,
            'recentOrders' => $customer ? $customer->orders()->latest()->take(5)->get() : collect(),
        ];
        return view('dashboards.customer', compact('data'));
    }

    public function transporterDashboard()
    {
        $user = Auth::user();
        $transporter = $user->transporter;

        $data = [
            'transporter' => $transporter,
            'pendingDeliveries' => $transporter ? $transporter->deliveries()->where('status', 'pending')->count() : 0,
            'activeDeliveries' => $transporter ? $transporter->deliveries()->where('status', 'in_transit')->count() : 0,
            'completedDeliveries' => $transporter ? $transporter->deliveries()->where('status', 'delivered')->count() : 0,
        ];
        return view('dashboards.transporter', compact('data'));
    }
}
