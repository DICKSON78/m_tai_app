import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../../components/ui/chart';
import { Area, AreaChart, Bar, BarChart, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Home, Package, DollarSign, ShoppingCart, Receipt, Users, AlertTriangle, Banknote, CreditCard, BarChart3, Zap, TrendingUp, Store } from 'lucide-react';

const STATUS_MAP = {
    pending: { label: 'Pending', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmed', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00B894]' },
    completed: { label: 'Completed', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700' },
    cancelled: { label: 'Cancelled', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' },
};

const revenueChartConfig = {
    revenue: { label: 'Revenue', color: '#00D4AA' },
};

const ordersChartConfig = {
    orders: { label: 'Orders', color: '#00b894' },
};

export default function OwnerDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState({
        totalProducts: 0,
        todaySales: 0,
        totalOrders: 0,
        totalExpenses: 0,
        totalEmployees: 0,
        lowStockProducts: 0,
        activeLoans: 0,
        pendingCreditSales: 0,
    });
    const [recentOrders, setRecentOrders] = useState([]);
    const [revenueData, setRevenueData] = useState([]);
    const [ordersData, setOrdersData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDashboard = async () => {
            setLoading(true);
            try {
                const res = await api.get('/owner/dashboard');
                const d = res.data;
                setStats((prev) => ({ ...prev, ...d }));
                setRecentOrders(d.recent_orders || []);
                setRevenueData(d.monthly_revenue || []);
                setOrdersData(d.monthly_orders || []);
            } catch (error) { console.error('Failed to fetch dashboard:', error); } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-14 bg-white rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA]">
                    <Home size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.name?.split(' ')[0]}</h1>
                    <p className="text-sm text-gray-500">Here's what's happening with your business today.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Products</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{Number(stats.totalProducts || 0).toLocaleString()}</p>
                    </div>
                    <div className="stat-icon bg-[#00D4AA]/10 text-[#00D4AA] shrink-0">
                        <Package size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Total Sales</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">TZS {((stats.todaySales || 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="stat-icon bg-[#00D4AA]/10 text-[#00D4AA] shrink-0">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Total Orders</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{Number(stats.totalOrders || 0).toLocaleString()}</p>
                    </div>
                    <div className="stat-icon bg-blue-500/10 text-blue-600 shrink-0">
                        <ShoppingCart size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Total Expenses</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">TZS {((stats.totalExpenses || 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="stat-icon bg-red-500/10 text-red-600 shrink-0">
                        <Receipt size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Employees</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{Number(stats.totalEmployees || 0).toLocaleString()}</p>
                    </div>
                    <div className="stat-icon bg-purple-500/10 text-purple-600 shrink-0">
                        <Users size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Low Stock</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{Number(stats.lowStockProducts || 0).toLocaleString()}</p>
                    </div>
                    <div className="stat-icon bg-yellow-500/10 text-yellow-600 shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Active Loans</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">TZS {((stats.activeLoans || 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="stat-icon bg-orange-500/10 text-orange-600 shrink-0">
                        <Banknote size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Customer Debts</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">TZS {((stats.pendingCreditSales || 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="stat-icon bg-red-500/10 text-red-600 shrink-0">
                        <CreditCard size={24} />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Zap size={18} className="text-yellow-600" />
                        </div>
                        Quick Actions
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Products', desc: 'Manage inventory', to: '/owner/products', icon: <Package size={20} />, bg: 'bg-[#00D4AA]/10', color: 'text-[#00D4AA]' },
                            { label: 'Orders', desc: 'View orders', to: '/owner/orders', icon: <ShoppingCart size={20} />, bg: 'bg-blue-100', color: 'text-blue-600' },
                            { label: 'Employees', desc: 'Manage staff', to: '/owner/employees', icon: <Users size={20} />, bg: 'bg-purple-100', color: 'text-purple-600' },
                            { label: 'Reports', desc: 'View analytics', to: '/owner/reports', icon: <BarChart3 size={20} />, bg: 'bg-amber-100', color: 'text-amber-600' },
                        ].map((action, i) => (
                            <Link key={i} to={action.to} className="quick-action">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 ${action.bg} rounded-xl flex items-center justify-center`}>
                                        <span className={action.color}>{action.icon}</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-900 text-sm">{action.label}</p>
                                        <p className="text-xs text-gray-500">{action.desc}</p>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="card">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center">
                                <TrendingUp size={18} className="text-[#00D4AA]" />
                            </div>
                            Revenue Overview
                        </h3>
                    </div>
                    <div className="p-6">
                        {revenueData.length > 0 ? (
                            <ChartContainer config={revenueChartConfig} className="h-[280px] w-full">
                                <AreaChart data={revenueData}>
                                    <defs>
                                        <linearGradient id="fillOwnerRevenue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00D4AA" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00D4AA" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
                                    <ChartTooltip content={<ChartTooltipContent formatter={(v) => `TZS ${Number(v).toLocaleString()}`} />} />
                                    <Area type="monotone" dataKey="revenue" stroke="#00D4AA" strokeWidth={2} fill="url(#fillOwnerRevenue)" />
                                </AreaChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No revenue data yet</div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                <Store size={18} className="text-emerald-600" />
                            </div>
                            Orders Trend
                        </h3>
                    </div>
                    <div className="p-6">
                        {ordersData.length > 0 ? (
                            <ChartContainer config={ordersChartConfig} className="h-[280px] w-full">
                                <BarChart data={ordersData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="orders" fill="#00D4AA" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No orders data yet</div>
                        )}
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <ShoppingCart size={18} className="text-purple-600" />
                        </div>
                        Recent Orders
                    </h3>
                </div>
                {recentOrders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ShoppingCart size={32} className="text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-900 mb-1">No recent orders</p>
                        <p className="text-gray-500 text-sm">Orders will appear here as they come in.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Customer</th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Amount</th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="text-left py-3 px-6 text-xs font-semibold text-gray-500 uppercase">Date</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentOrders.map((row, i) => {
                                    const cfg = STATUS_MAP[row.status] || STATUS_MAP.pending;
                                    return (
                                        <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                                            <td className="py-3 px-6 text-sm font-medium text-gray-900">{row.customer?.full_name || row.customer_name || '-'}</td>
                                            <td className="py-3 px-6 text-sm font-semibold text-gray-900">TZS {Number(row.total || row.total_amount || 0).toLocaleString()}</td>
                                            <td className="py-3 px-6"><span className={cfg.className}>{cfg.label}</span></td>
                                            <td className="py-3 px-6 text-sm text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}