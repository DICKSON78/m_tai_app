import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import EmptyState from '../../components/casfeta/EmptyState';
import SectionHeader from '../../components/casfeta/SectionHeader';
import { Store, Plus, Package, ShoppingCart, Users, DollarSign, Eye, Pencil, RefreshCw, MapPin, Clock, TrendingUp, CheckCircle } from 'lucide-react';

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

const headerColors = [
    'from-[#00D4AA] to-[#00b894]',
    'from-[#3b82f6] to-[#2563eb]',
    'from-[#f59e0b] to-[#d97706]',
    'from-[#8b5cf6] to-[#7c3aed]',
    'from-[#ec4899] to-[#db2777]',
    'from-[#14b8a6] to-[#0d9488]',
];

export default function BusinessListPage() {
    document.title = 'My Businesses - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [activeId, setActiveId] = useState(() => localStorage.getItem('active_business_id'));

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

            {filtered.length === 0 ? (
                <EmptyState title="No businesses found" description={businesses.length === 0 ? "Create your first business to get started." : "Try a different search or filter."} actionTo="/owner/businesses/new" actionLabel="Add Business" />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filtered.map((biz, i) => {
                        const isActive = String(biz.id) === String(activeId);
                        const color = headerColors[i % headerColors.length];
                        const initial = biz.business_name?.charAt(0)?.toUpperCase() || 'B';
                        const locationParts = [biz.ward, biz.district, biz.region].filter(Boolean);

                        return (
                            <div key={biz.id} className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 ${isActive ? 'border-[#00D4AA] shadow-lg ring-2 ring-[#00D4AA]/20' : 'border-gray-200 shadow-sm hover:shadow-md'}`}>
                                <div className={`bg-gradient-to-r ${color} px-6 py-5 relative`}>
                                    {isActive && (
                                        <div className="absolute top-3 right-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-[#00B894]"><CheckCircle size={10} /> Current</span>
                                        </div>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-xl bg-white/25 flex items-center justify-center text-white font-bold text-lg shrink-0">{initial}</div>
                                        <div className="min-w-0">
                                            <h3 className="text-white font-bold text-base truncate">{biz.business_name}</h3>
                                            <p className="text-white/75 text-xs font-mono mt-0.5">{biz.business_code}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className={`${statusBadge[biz.status] || 'badge badge-gray'}`}>{statusLabel[biz.status] || biz.status}</span>
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00B894]">{biz.business_category || biz.business_type || 'Business'}</span>
                                    </div>

                                    {locationParts.length > 0 && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <MapPin size={12} className="shrink-0 text-gray-400" />
                                            <span className="truncate">{locationParts.join(', ')}</span>
                                        </div>
                                    )}

                                    {biz.working_hours && (
                                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                            <Clock size={12} className="shrink-0 text-gray-400" />
                                            <span>{biz.working_hours.open} — {biz.working_hours.close}</span>
                                        </div>
                                    )}

                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                                            <Package size={14} className="mx-auto text-gray-400 mb-1" />
                                            <p className="text-sm font-bold text-gray-900">{biz.products_count ?? 0}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Products</p>
                                        </div>
                                        <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                                            <ShoppingCart size={14} className="mx-auto text-gray-400 mb-1" />
                                            <p className="text-sm font-bold text-gray-900">{biz.orders_count ?? 0}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Orders</p>
                                        </div>
                                        <div className="text-center p-2.5 bg-gray-50 rounded-lg">
                                            <Users size={14} className="mx-auto text-gray-400 mb-1" />
                                            <p className="text-sm font-bold text-gray-900">{biz.employees_count ?? 0}</p>
                                            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Staff</p>
                                        </div>
                                    </div>

                                    {Number(biz.opening_capital) > 0 && (
                                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-1.5">
                                                <TrendingUp size={13} className="text-[#00B894]" />
                                                <span className="text-xs font-medium text-gray-600">Opening Capital</span>
                                            </div>
                                            <span className="text-sm font-bold text-[#00B894]">TZS {Number(biz.opening_capital).toLocaleString()}</span>
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                                        <Link to={`/owner/businesses/${biz.id}`} className="flex-1 text-center px-3 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all text-sm inline-flex items-center justify-center gap-1.5">
                                            <Eye size={14} /> View
                                        </Link>
                                        <Link to={`/owner/businesses/${biz.id}/edit`} className="flex-1 text-center px-3 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all text-sm inline-flex items-center justify-center gap-1.5">
                                            <Pencil size={14} /> Edit
                                        </Link>
                                        {biz.status === 'active' && (
                                            <button onClick={() => handleSwitch(biz)} disabled={isActive} className={`flex-1 text-center px-3 py-2.5 font-bold rounded-lg transition-all text-sm inline-flex items-center justify-center gap-1.5 shadow-md ${isActive ? 'bg-[#00D4AA]/20 text-[#00B894] cursor-default shadow-none' : 'bg-[#00D4AA] text-white hover:bg-[#00B894] hover:shadow-lg'}`}>
                                                <RefreshCw size={14} /> {isActive ? 'Active' : 'Switch'}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
