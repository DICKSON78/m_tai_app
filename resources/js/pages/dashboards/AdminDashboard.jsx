import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import StatsCard from '../../components/StatsCard';

export default function AdminDashboard() {
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
                api.get('/admin/dashboard'),
                api.get('/admin/orders?per_page=5')
            ]);
            setStats(dashRes.data.data);
            setOrders(ordersRes.data.data?.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-white rounded-2xl animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Admin Header */}
            <div className="relative rounded-2xl p-8 overflow-hidden" style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mtadoi">Msimamizi</p>
                    </div>
                    <h1 className="text-3xl font-black text-white mb-2">
                        Dashibodi ya Msimamizi
                    </h1>
                    <p className="text-white/50">Fuatilia shughuli zote za mfumo wa M-TAI.</p>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <StatsCard
                    title="JUMLA BIASHARA"
                    value={stats?.total_businesses || 0}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
                    color="primary"
                />
                <StatsCard
                    title="WATEJA"
                    value={stats?.total_customers || 0}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
                    color="info"
                />
                <StatsCard
                    title="WATUMIAJI"
                    value={stats?.total_users || 0}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>}
                    color="gold"
                />
                <StatsCard
                    title="MAAGIZO"
                    value={stats?.total_orders || 0}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
                    color="success"
                />
                <StatsCard
                    title="MAPATO"
                    value={`TZS ${((stats?.total_revenue || 0) / 1000000).toFixed(1)}M`}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                    color="success"
                />
                <StatsCard
                    title="WATEJA MPYA"
                    value={stats?.new_customers_this_month || 0}
                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>}
                    color="primary"
                />
            </div>

            {/* Quick Actions */}
            <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">HARAKA</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {[
                        { icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4', label: 'Biashara', href: '/admin/shops', color: 'bg-primary/10 text-primary' },
                        { icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z', label: 'Watumiaji', href: '/admin/users', color: 'bg-green-500/10 text-green-500' },
                        { icon: 'M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z', label: 'Matangazo', href: '/admin/announcements', color: 'bg-orange-100 text-orange-600' },
                    ].map((action, i) => (
                        <a
                            key={i}
                            href={action.href}
                            className="card group flex items-center space-x-4 hover:shadow-md transition-shadow"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${action.color} group-hover:scale-110 transition-transform duration-300`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={action.icon} />
                                </svg>
                            </div>
                            <div>
                                <p className="font-bold text-gray-900 text-sm">{action.label}</p>
                                <p className="text-xs text-gray-400 mt-0.5">Fungua</p>
                            </div>
                        </a>
                    ))}
                </div>
            </div>

            {/* Recent Orders */}
            {orders.length > 0 && (
                <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-4">MAAGIZO YA HAI</p>
                    <div className="re-table-wrap">
                        <div className="overflow-x-auto">
                            <table className="re-table">
                                <thead>
                                    <tr>
                                        <th>Nambari</th>
                                        <th>Mteja</th>
                                        <th>Kiasi</th>
                                        <th>Hali</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {orders.map(order => (
                                        <tr key={order.id}>
                                            <td className="font-semibold text-gray-900">#{order.order_number}</td>
                                            <td>{order.customer?.name || 'N/A'}</td>
                                            <td className="font-semibold text-gray-900">TZS {Number(order.total_amount).toLocaleString()}</td>
                                            <td>
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    order.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                                                    order.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {order.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
