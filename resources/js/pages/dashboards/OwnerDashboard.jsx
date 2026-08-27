import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Home, Package, DollarSign, ShoppingCart, Receipt, Users, AlertTriangle, Banknote, CreditCard, BarChart3, Zap } from 'lucide-react';

export default function OwnerDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const res = await api.get('/owner/dashboard');
            setStats(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-36 bg-white rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1,2,3,4].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Products</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{stats?.totalProducts || 0}</p>
                    </div>
                    <div className="stat-icon bg-[#00D4AA]/10 text-[#00D4AA] shrink-0">
                        <Package size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Total Sales</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">TZS {((stats?.todaySales || 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="stat-icon bg-emerald-500/10 text-emerald-600 shrink-0">
                        <DollarSign size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Total Orders</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{stats?.totalOrders || 0}</p>
                    </div>
                    <div className="stat-icon bg-blue-500/10 text-blue-600 shrink-0">
                        <ShoppingCart size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Total Expenses</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">TZS {((stats?.totalExpenses || 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="stat-icon bg-red-500/10 text-red-600 shrink-0">
                        <Receipt size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Employees</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{stats?.totalEmployees || 0}</p>
                    </div>
                    <div className="stat-icon bg-purple-500/10 text-purple-600 shrink-0">
                        <Users size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Low Stock</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{stats?.lowStockProducts || 0}</p>
                    </div>
                    <div className="stat-icon bg-yellow-500/10 text-yellow-600 shrink-0">
                        <AlertTriangle size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Active Loans</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">TZS {((stats?.activeLoans || 0) / 1000).toFixed(0)}K</p>
                    </div>
                    <div className="stat-icon bg-orange-500/10 text-orange-600 shrink-0">
                        <Banknote size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Customer Debts</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">TZS {((stats?.pendingCreditSales || 0) / 1000).toFixed(0)}K</p>
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
        </div>
    );
}
