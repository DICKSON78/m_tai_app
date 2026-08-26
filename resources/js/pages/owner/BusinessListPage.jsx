import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Store, Plus, Package, ShoppingCart, Users, DollarSign, Eye, Pencil, RefreshCw } from 'lucide-react';

const statusConfig = {
    pending: { label: 'Pending', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
    active: { label: 'Active', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700' },
    suspended: { label: 'Suspended', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' },
    closed: { label: 'Closed', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700' },
};

export default function BusinessListPage() {
    document.title = 'My Businesses - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchBusinesses(); }, []);

    const fetchBusinesses = async () => {
        setLoading(true); setError(null);
        try { const res = await api.get('/owner/businesses'); setBusinesses(res.data.data || res.data); }
        catch (err) { console.error('Failed to load businesses:', err); setError('Failed to load businesses. Please try again.'); }
        finally { setLoading(false); }
    };

    const handleSwitch = async (business) => {
        try { await api.post(`/owner/businesses/${business.id}/switch`); localStorage.setItem('active_business_id', business.id); window.location.reload(); }
        catch (err) { console.error('Failed to switch business:', err); alert('Failed to switch business.'); }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4AA]"></div></div>;
    }

    return (
        <div className="space-y-0">
            <div className="flex items-center justify-end mb-6">
                <Link
                    to="/owner/businesses/new"
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}
                >
                    <Plus size={16} /> <span className="hidden sm:inline">Add New</span>
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl text-red-700 text-sm mb-6">{error}</div>
            )}

            {businesses.length === 0 ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center">
                        <Store size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500 mb-3">No businesses yet</p>
                        <Link to="/owner/businesses/new" className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            <Plus size={16} /> Add Business
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {businesses.map((biz) => {
                        const status = statusConfig[biz.status] || statusConfig.pending;
                        return (
                            <div key={biz.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-lg font-bold text-gray-800 truncate">{biz.business_name}</h3>
                                            <p className="text-sm text-gray-500 mt-0.5 font-mono">{biz.code}</p>
                                        </div>
                                        <span className={`${status.badge} shrink-0 ml-3`}>{status.label}</span>
                                    </div>
                                </div>

                                <div className="p-6">
                                    <div className="mb-4">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00D4AA]">
                                            {biz.business_category || biz.business_type || 'Business'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mb-4">
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <Package size={16} className="mx-auto text-gray-400 mb-1" />
                                            <p className="text-lg font-bold text-gray-800">{biz.products_count ?? 0}</p>
                                            <p className="text-xs text-gray-500">Products</p>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <ShoppingCart size={16} className="mx-auto text-gray-400 mb-1" />
                                            <p className="text-lg font-bold text-gray-800">{biz.orders_count ?? 0}</p>
                                            <p className="text-xs text-gray-500">Orders</p>
                                        </div>
                                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                                            <Users size={16} className="mx-auto text-gray-400 mb-1" />
                                            <p className="text-lg font-bold text-gray-800">{biz.employees_count ?? 0}</p>
                                            <p className="text-xs text-gray-500">Staff</p>
                                        </div>
                                    </div>

                                    <div className="mb-4 p-3 bg-[#00D4AA]/5 border border-[#00D4AA]/20 rounded-lg">
                                        <div className="flex items-center gap-2">
                                            <DollarSign size={14} className="text-[#00D4AA]" />
                                            <p className="text-xs text-[#00D4AA] font-semibold">Opening Capital</p>
                                        </div>
                                        <p className="text-lg font-bold text-[#00B894] mt-1">TZS {(biz.opening_capital || 0).toLocaleString()}</p>
                                    </div>

                                    <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                                        <Link to={`/owner/businesses/${biz.id}`} className="flex-1 text-center px-3 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm inline-flex items-center justify-center gap-1.5">
                                            <Eye size={14} /> Details
                                        </Link>
                                        <Link to={`/owner/businesses/${biz.id}/edit`} className="flex-1 text-center px-3 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm inline-flex items-center justify-center gap-1.5">
                                            <Pencil size={14} /> Edit
                                        </Link>
                                        {biz.status === 'active' && (
                                            <button onClick={() => handleSwitch(biz)} className="flex-1 text-center px-3 py-2.5 bg-[#00D4AA] text-white font-bold rounded-lg hover:bg-[#00B894] transition-all duration-200 text-sm inline-flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg">
                                                <RefreshCw size={14} /> Switch
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
