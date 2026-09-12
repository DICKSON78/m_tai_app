import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Store, Plus, Package, ShoppingCart, Users, DollarSign, Eye, Pencil, RefreshCw, MapPin, CheckCircle, TrendingUp } from 'lucide-react';
import Pagination from '../../components/Pagination';

const statusFilters = [
    { key: '', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'pending', label: 'Pending' },
    { key: 'suspended', label: 'Suspended' },
];

const statusBadge = {
    active: 'badge badge-green',
    pending: 'badge badge-yellow',
    suspended: 'badge badge-red',
    closed: 'badge badge-gray',
};
const statusLabel = {
    active: 'Active',
    pending: 'Pending',
    suspended: 'Suspended',
    closed: 'Closed',
};

const avatarColors = [
    'bg-[#00D4AA]/10 text-[#00B894]',
    'bg-blue-100 text-blue-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-rose-100 text-rose-700',
    'bg-cyan-100 text-cyan-700',
];

const PER_PAGE = 10;

export default function BusinessListPage() {
    document.title = 'My Businesses - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [activeId, setActiveId] = useState(() => localStorage.getItem('active_business_id'));
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => { fetchBusinesses(); }, []);

    const fetchBusinesses = async () => {
        setLoading(true); setError(null);
        try {
            const res = await api.get('/owner/businesses', { params: { per_page: 200 } });
            setBusinesses(res.data.data || res.data || []);
        } catch (err) {
            console.error('Failed to load businesses:', err);
            setError('Failed to load businesses. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSwitch = async (business) => {
        try {
            await api.post(`/owner/businesses/${business.id}/switch`);
            localStorage.setItem('active_business_id', business.id);
            setActiveId(business.id);
            window.location.reload();
        } catch (err) {
            console.error('Failed to switch business:', err);
            alert('Failed to switch business.');
        }
    };

    const filtered = useMemo(() => {
        return businesses.filter((b) => {
            if (statusFilter && b.status !== statusFilter) return false;
            if (search && !b.business_name?.toLowerCase().includes(search.toLowerCase()) && !b.business_code?.toLowerCase().includes(search.toLowerCase())) return false;
            return true;
        });
    }, [businesses, statusFilter, search]);

    const totals = useMemo(() => {
        const arr = businesses.length ? businesses : [];
        return {
            count: arr.length,
            products: arr.reduce((s, b) => s + (b.products_count || 0), 0),
            orders: arr.reduce((s, b) => s + (b.orders_count || 0), 0),
            staff: arr.reduce((s, b) => s + (b.employees_count || 0), 0),
            capital: arr.reduce((s, b) => s + Number(b.opening_capital || 0), 0),
        };
    }, [businesses]);

    const pageItems = useMemo(() => {
        const start = (currentPage - 1) * PER_PAGE;
        return filtered.slice(start, start + PER_PAGE);
    }, [filtered, currentPage]);

    const lastPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

    useEffect(() => { setCurrentPage(1); }, [statusFilter, search]);

    if (loading) {
        return (
            <div className="space-y-6">
                <PageHeader title="My Businesses" subtitle="Manage all your businesses in one place." icon={<Store size={20} />} />
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4AA]"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader
                title="My Businesses"
                subtitle={`${totals.count} ${totals.count === 1 ? 'business' : 'businesses'} registered`}
                icon={<Store size={20} />}
                actions={
                    <Link to="/owner/businesses/new" className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        <Plus size={16} /> Add Business
                    </Link>
                }
            />

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-700 text-sm">{error}</div>
            )}

            {businesses.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                    <StatCard icon={<Store size={20} />} value={totals.count} label="Businesses" color="bg-[#00D4AA]/10 text-[#00B894]" />
                    <StatCard icon={<Package size={20} />} value={totals.products} label="Products" color="bg-blue-100 text-blue-700" />
                    <StatCard icon={<ShoppingCart size={20} />} value={totals.orders} label="Orders" color="bg-purple-100 text-purple-700" />
                    <StatCard icon={<Users size={20} />} value={totals.staff} label="Staff" color="bg-amber-100 text-amber-700" />
                    <StatCard icon={<DollarSign size={20} />} value={`TZS ${(totals.capital / 1000000).toFixed(1)}M`} label="Total Capital" color="bg-emerald-100 text-emerald-700" />
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
                    {statusFilters.map((f) => (
                        <button key={f.key} onClick={() => setStatusFilter(f.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === f.key ? 'bg-[#00D4AA] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}>
                            {f.label}
                        </button>
                    ))}
                </div>
                <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search businesses..." className="w-full sm:w-64 px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
            </div>

            {pageItems.length === 0 ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center">
                        <Store size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500 mb-3">No businesses found</p>
                        <Link to="/owner/businesses/new" className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            <Plus size={16} /> Add Business
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
                        <h3 className="text-sm font-semibold text-gray-900">Businesses ({filtered.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100 text-left">
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Business</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Code</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Location</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Products</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Orders</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Staff</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Capital</th>
                                    <th className="px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pageItems.map((biz, i) => {
                                    const isActive = String(biz.id) === String(activeId);
                                    const locationParts = [biz.ward, biz.district, biz.region].filter(Boolean);
                                    return (
                                        <tr key={biz.id} className={`border-b border-gray-50 hover:bg-gray-50 transition-colors ${isActive ? 'bg-[#00D4AA]/5' : ''}`}>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-9 h-9 rounded-full ${avatarColors[i % avatarColors.length]} flex items-center justify-center text-xs font-bold uppercase shrink-0`}>
                                                        {biz.business_name?.charAt(0) || 'B'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <span className="font-medium text-gray-800 flex items-center gap-1.5">
                                                            {biz.business_name}
                                                            {isActive && <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-[#00D4AA]/10 text-[#00B894] shrink-0"><CheckCircle size={10} /> Active</span>}
                                                        </span>
                                                        <span className="block text-xs text-gray-500">{biz.business_category || biz.business_type || 'Business'}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="font-mono text-xs text-gray-600">{biz.business_code}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`${statusBadge[biz.status] || 'badge badge-gray'}`}>{statusLabel[biz.status] || biz.status}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center gap-1.5 text-sm text-gray-600">
                                                    <MapPin size={13} className="text-gray-400" />
                                                    {locationParts.length ? locationParts.join(', ') : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00B894]">{biz.products_count ?? 0}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">{biz.orders_count ?? 0}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{biz.employees_count ?? 0}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {Number(biz.opening_capital) > 0 ? (
                                                    <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                                        <TrendingUp size={13} className="text-[#00B894]" />
                                                        TZS {Number(biz.opening_capital).toLocaleString()}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2 justify-end">
                                                    <Link to={`/owner/businesses/${biz.id}`} title="View" className="h-8 w-8 bg-[#00D4AA]/10 text-[#00B894] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all">
                                                        <Eye size={14} />
                                                    </Link>
                                                    <Link to={`/owner/businesses/${biz.id}/edit`} title="Edit" className="h-8 w-8 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-all">
                                                        <Pencil size={14} />
                                                    </Link>
                                                    {biz.status === 'active' && (
                                                        <button onClick={() => handleSwitch(biz)} disabled={isActive} title={isActive ? 'Currently active' : 'Switch'} className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-[#00D4AA]/20 text-[#00B894] cursor-default' : 'bg-[#00D4AA] text-white hover:bg-[#00B894]'}`}>
                                                            <RefreshCw size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filtered.length > PER_PAGE && (
                        <div className="px-6 py-4 border-t border-gray-100">
                            <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function StatCard({ icon, value, label, color }) {
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>{icon}</div>
            <div>
                <p className="text-lg font-bold text-gray-900">{value}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">{label}</p>
            </div>
        </div>
    );
}