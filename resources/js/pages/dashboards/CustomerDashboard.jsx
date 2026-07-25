import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { ShoppingCart, Clock, Search, Package, Zap } from 'lucide-react';

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [dashRes, ordersRes] = await Promise.all([
                api.get('/customer/dashboard'),
                api.get('/customer/orders?per_page=5')
            ]);
            setStats(dashRes.data.data);
            const ordersData = ordersRes.data;
            setOrders(ordersData.data || ordersData.data?.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-40 bg-white rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {[1,2].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    const STATUS_MAP = {
        pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
        confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-700' },
        processing: { label: 'Processing', className: 'bg-blue-100 text-blue-700' },
        completed: { label: 'Completed', className: 'bg-emerald-100 text-emerald-700' },
        cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
        delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-700' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA]">
                    <ShoppingCart size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name?.split(' ')[0]}</h1>
                    <p className="text-sm text-gray-500">Shop your favorite products with ease.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Total Orders</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{stats?.total_orders || 0}</p>
                    </div>
                    <div className="stat-icon bg-[#00D4AA]/10 text-[#00D4AA] shrink-0">
                        <ShoppingCart size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Pending</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{stats?.pending_orders || 0}</p>
                    </div>
                    <div className="stat-icon bg-yellow-500/10 text-yellow-600 shrink-0">
                        <Clock size={24} />
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link to="/customer/shops" className="quick-action">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center">
                                    <span className="text-[#00D4AA]"><Search size={20} /></span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Browse Shops</p>
                                    <p className="text-xs text-gray-500">Find products you love</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                            <Package size={18} className="text-purple-600" />
                        </div>
                        Recent Orders
                    </h3>
                    <Link to="/customer/orders" className="text-[#00D4AA] text-sm font-semibold hover:text-[#00b894] transition-colors">
                        View All →
                    </Link>
                </div>
                {orders.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-900 mb-1">No Orders Yet</p>
                        <p className="text-gray-500 text-sm">Start shopping to see your orders here</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-3">
                        {orders.map(order => {
                            const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
                            return (
                                <Link
                                    key={order.id}
                                    to={`/customer/orders/${order.id}`}
                                    className="quick-action block"
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">#{order.order_number}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-gray-900 text-sm">TZS {Number(order.total_amount || order.total || 0).toLocaleString()}</p>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1 ${status.className}`}>
                                                {status.label}
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
