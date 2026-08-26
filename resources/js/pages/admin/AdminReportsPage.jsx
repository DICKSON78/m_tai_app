import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { TrendingUp, ShoppingCart, Store, Users, UserCheck, Calendar } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/casfeta/PageHeader';
import InfoCard from '../../components/casfeta/InfoCard';
import DataItem from '../../components/casfeta/DataItem';

export default function AdminReportsPage() {
    const [stats, setStats] = useState({
        total_businesses: 0, total_customers: 0, total_users: 0,
        total_orders: 0, total_revenue: 0, new_customers_month: 0,
    });
    const [monthlyData, setMonthlyData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('this_month');

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await api.get('/admin/reports', { params: { range: dateRange } });
                const d = res.data;
                setStats({
                    total_businesses: d.total_businesses ?? 0,
                    total_customers: d.total_customers ?? 0,
                    total_users: d.total_users ?? 0,
                    total_orders: d.total_orders ?? 0,
                    total_revenue: d.total_revenue ?? 0,
                    new_customers_month: d.new_customers_month ?? 0,
                });
                setMonthlyData(d.monthly_data || []);
            } catch (error) { console.error('Failed to fetch reports:', error);
                try {
                    const dashRes = await api.get('/admin/dashboard');
                    const d = dashRes.data;
                    setStats({
                        total_businesses: d.total_businesses ?? 0, total_customers: d.total_customers ?? 0,
                        total_users: d.total_users ?? 0, total_orders: d.total_orders ?? 0,
                        total_revenue: d.total_revenue ?? 0, new_customers_month: d.new_customers_month ?? 0,
                    });
                } catch (error2) { console.error('Failed to fetch dashboard fallback:', error2); }
            } finally { setLoading(false); }
        };
        fetchData();
    }, [dateRange]);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Reports"
                subtitle="Overview of your platform performance"
                icon={<TrendingUp size={20} />}
                actions={
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { value: 'this_week', label: 'This Week' },
                            { value: 'this_month', label: 'This Month' },
                            { value: 'this_year', label: 'This Year' },
                            { value: 'all_time', label: 'All Time' },
                        ].map((opt) => (
                            <button key={opt.value} onClick={() => setDateRange(opt.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dateRange === opt.value ? 'bg-[#00D4AA] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Revenue</p>
                            <p className="text-2xl font-bold text-gray-900">TZS {Number(stats.total_revenue).toLocaleString()}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-[#00D4AA]" />
                        </div>
                    </div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_orders}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                            <ShoppingCart className="w-6 h-6 text-yellow-500" />
                        </div>
                    </div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Businesses</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_businesses}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                            <Store className="w-6 h-6 text-green-500" />
                        </div>
                    </div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Customers</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_customers}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-500" />
                        </div>
                    </div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total_users}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                            <UserCheck className="w-6 h-6 text-purple-500" />
                        </div>
                    </div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">New Customers (Month)</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.new_customers_month}</p>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                            <Calendar className="w-6 h-6 text-orange-500" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><TrendingUp size={16} className="text-[#00D4AA]" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Revenue Trend</h3>
                                <p className="text-xs text-gray-500">Monthly revenue</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} formatter={(value) => [`TZS ${Number(value).toLocaleString()}`, 'Revenue']} />
                                    <Line type="monotone" dataKey="revenue" stroke="#00D4AA" strokeWidth={3} dot={{ fill: '#00D4AA', strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center"><ShoppingCart size={16} className="text-yellow-500" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Orders by Month</h3>
                                <p className="text-xs text-gray-500">Monthly orders</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                                    <Bar dataKey="orders" fill="#00D4AA" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><TrendingUp size={16} className="text-[#00D4AA]" /></div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
                            <p className="text-xs text-gray-500">Platform overview</p>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DataItem label="Total Businesses" value={stats.total_businesses} icon={<Store size={14} />} />
                        <DataItem label="Total Orders" value={stats.total_orders} icon={<ShoppingCart size={14} />} />
                        <DataItem label="Total Revenue" value={`TZS ${Number(stats.total_revenue).toLocaleString()}`} icon={<TrendingUp size={14} />} />
                        <DataItem label="New Customers (This Month)" value={stats.new_customers_month} icon={<Calendar size={14} />} />
                        <DataItem label="Total Users" value={stats.total_users} icon={<Users size={14} />} />
                    </div>
                </div>
            </div>
        </div>
    );
}
