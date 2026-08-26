import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { Truck, Search, MapPin, CheckCircle, Package, Clock, SlidersHorizontal, X } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';

const STATUS_COLORS = {
    pending: 'bg-yellow-100 text-yellow-700',
    picked_up: 'bg-blue-100 text-blue-700',
    in_transit: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    failed: 'bg-red-100 text-red-700',
};

export default function AdminDeliveriesPage() {
    document.title = 'Deliveries - M-Tai Admin';
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState({});

    const fetchDeliveries = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/admin/deliveries', { params });
            setDeliveries(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch (error) { console.error('Failed to fetch deliveries:', error); setDeliveries([]); } finally { setLoading(false); }
    }, [currentPage, search, statusFilter]);

    useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);
    useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

    return (
        <div className="space-y-6">
            <PageHeader
                title="Deliveries"
                subtitle="Monitor all delivery operations across the platform"
                icon={<Truck size={20} />}
            />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.total || deliveries.length || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                <Package className="w-6 h-6 text-[#00D4AA]" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.pending || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-yellow-500" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">In Transit</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.in_transit || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <Truck className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Delivered</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.delivered || 0}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" placeholder="Search deliveries..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                        </div>
                        <div>
                            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                                <option value="">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="picked_up">Picked Up</option>
                                <option value="in_transit">In Transit</option>
                                <option value="delivered">Delivered</option>
                                <option value="failed">Failed</option>
                            </select>
                        </div>
                        {(search || statusFilter) && (
                            <button onClick={() => { setSearch(''); setStatusFilter(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                                <X className="w-4 h-4" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Deliveries</h3>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                    ) : deliveries.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Truck className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No data available</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Order</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Transporter</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Address</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {deliveries.map((d) => (
                                            <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3 text-sm font-medium text-gray-900">#{d.order?.transaction_code || d.id}</td>
                                                <td className="px-6 py-3 text-sm text-gray-600">{d.customer?.full_name || '-'}</td>
                                                <td className="px-6 py-3 text-sm text-gray-600">{d.transporter?.name || d.transporter?.user?.name || '-'}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-1 text-sm text-gray-600">
                                                        <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="truncate max-w-[200px]">{d.address || d.delivery_address || '-'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-700'}`}>
                                                        {d.status?.replace('_', ' ')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-500">{new Date(d.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100">
                                <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                            </div>
                        </>
                    )}
                </div>
        </div>
    );
}