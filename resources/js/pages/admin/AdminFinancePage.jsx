import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Banknote, TrendingUp, ShoppingCart, CreditCard, ArrowUpRight } from 'lucide-react';
import { LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../../components/casfeta/PageHeader';

const COLORS = ['#00D4AA', '#0ea5e9', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function AdminFinancePage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('this_month');

    useEffect(() => {
        const fetchFinance = async () => {
            setLoading(true);
            try {
                const res = await api.get('/admin/finance', { params: { period } });
                setData(res.data);
            } catch (error) { console.error('Failed to fetch finance data:', error);
                try {
                    const dashRes = await api.get('/admin/dashboard');
                    setData({
                        total_revenue: dashRes.data.total_revenue || 0,
                        total_orders: dashRes.data.total_orders || 0,
                        avg_order_value: dashRes.data.avg_order_value || 0,
                        total_subscriptions_revenue: 0,
                        monthly_revenue: dashRes.data.monthly_revenue || [],
                        revenue_by_payment: [],
                        recent_payments: [],
                    });
                } catch (error2) { console.error('Failed to fetch dashboard fallback:', error2); }
            } finally { setLoading(false); }
        };
        fetchFinance();
    }, [period]);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;

    const d = data || {};

    return (
        <div className="space-y-6">
            <PageHeader
                title="Finance & Accounting"
                subtitle="Revenue, payments, and financial overview"
                icon={<Banknote size={20} />}
                actions={
                    <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                        {[
                            { value: 'this_week', label: 'This Week' },
                            { value: 'this_month', label: 'This Month' },
                            { value: 'this_year', label: 'This Year' },
                            { value: 'all_time', label: 'All Time' },
                        ].map((opt) => (
                            <button key={opt.value} onClick={() => setPeriod(opt.value)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${period === opt.value ? 'bg-[#00D4AA] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}>
                                {opt.label}
                            </button>
                        ))}
                    </div>
                }
            />

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'TOTAL REVENUE', value: `TZS ${Number(d.total_revenue || 0).toLocaleString()}`, icon: TrendingUp, color: '#00D4AA' },
                    { label: 'TOTAL ORDERS', value: d.total_orders || 0, icon: ShoppingCart, color: '#f59e0b' },
                    { label: 'AVG ORDER VALUE', value: `TZS ${Number(d.avg_order_value || 0).toLocaleString()}`, icon: ArrowUpRight, color: '#0ea5e9' },
                    { label: 'SUBSCRIPTIONS REV.', value: `TZS ${Number(d.total_subscriptions_revenue || 0).toLocaleString()}`, icon: CreditCard, color: '#10b981' },
                ].map((s) => (
                    <div key={s.label} className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{s.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                                <s.icon className="w-6 h-6" style={{ color: s.color }} />
                            </div>
                        </div>
                    </div>
                ))}
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
                                <LineChart data={d.monthly_revenue || []}>
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
                            <div className="w-8 h-8 rounded-lg bg-[#0ea5e9]/10 flex items-center justify-center"><Banknote size={16} className="text-[#0ea5e9]" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Revenue by Payment Method</h3>
                                <p className="text-xs text-gray-500">Payment distribution</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <div className="h-72">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={d.revenue_by_payment || []} dataKey="total" nameKey="method" cx="50%" cy="50%" outerRadius={100} label={({ method, percent }) => `${method} (${(percent * 100).toFixed(0)}%)`}>
                                        {(d.revenue_by_payment || []).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => [`TZS ${Number(value).toLocaleString()}`, 'Amount']} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#f59e0b]/10 flex items-center justify-center"><CreditCard size={16} className="text-[#f59e0b]" /></div>
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900">Recent Payments</h3>
                            <p className="text-xs text-gray-500">Latest payment records</p>
                        </div>
                    </div>
                </div>
                {(d.recent_payments || []).length === 0 ? (
                    <div className="p-12 text-center text-gray-500 text-sm">No payments recorded yet</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Business</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Method</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                                <th className="text-center px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            </tr></thead>
                            <tbody>
                                {(d.recent_payments || []).map((p, i) => (
                                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 text-sm text-gray-600">{new Date(p.created_at).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{p.business_name || '-'}</td>
                                        <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">{p.method}</span></td>
                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">TZS {Number(p.amount).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'confirmed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}`}>{p.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
