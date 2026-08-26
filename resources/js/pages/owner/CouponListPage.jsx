import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { Ticket, Plus, Pencil, Trash2, Tag, DollarSign, Calendar, Hash, Filter, RotateCcw, Search, CheckCircle } from 'lucide-react';

const TABS = [
    { key: '', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'expired', label: 'Expired' },
];

const STATUS_MAP = {
    active: { label: 'Active', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    expired: { label: 'Expired', badge: 'bg-red-100 text-red-600' },
    used_up: { label: 'Used Up', badge: 'bg-yellow-100 text-yellow-700' },
    inactive: { label: 'Not Started', badge: 'bg-gray-100 text-gray-600' },
};

const emptyForm = { code: '', type: 'percentage', value: '', min_order_amount: '', max_discount: '', usage_limit: '', starts_at: '', expires_at: '' };

export default function CouponListPage() {
    document.title = 'Coupons - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [businessId, setBusinessId] = useState('');
    const [businessesLoading, setBusinessesLoading] = useState(true);
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0, expired: 0, used: 0 });
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => {
        setBusinessesLoading(true);
        api.get('/owner/businesses').then(res => { const list = res.data?.data || res.data || []; setBusinesses(list); if (list.length === 1) setBusinessId(String(list[0].id)); }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); }).finally(() => setBusinessesLoading(false));
    }, []);

    const fetchCoupons = useCallback(async () => {
        if (!businessId) { setCoupons([]); setStats({ total: 0, active: 0, expired: 0, used: 0 }); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get(`/owner/businesses/${businessId}/coupons`, { params });
            const data = res.data;
            setCoupons(data.data || []); setCurrentPage(data.current_page || 1); setLastPage(data.last_page || 1);
            if (data.stats) setStats(data.stats);
            else { const allCoupons = data.data || []; setStats({ total: data.total || allCoupons.length, active: allCoupons.filter(c => c.status === 'active').length, expired: allCoupons.filter(c => c.status === 'expired').length, used: allCoupons.filter(c => c.status === 'used_up').length }); }
        } catch (error) { console.error('Failed to fetch coupons:', error); setCoupons([]); } finally { setLoading(false); }
    }, [businessId, currentPage, statusFilter]);

    useEffect(() => { fetchCoupons(); }, [fetchCoupons]);
    useEffect(() => { setCurrentPage(1); }, [businessId, statusFilter]);

    const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
    const openEdit = (coupon) => { setEditing(coupon); setForm({ code: coupon.code || '', type: coupon.type || 'percentage', value: coupon.value || '', min_order_amount: coupon.min_order_amount || '', max_discount: coupon.max_discount || '', usage_limit: coupon.usage_limit || '', starts_at: coupon.starts_at ? coupon.starts_at.slice(0, 16) : '', expires_at: coupon.expires_at ? coupon.expires_at.slice(0, 16) : '' }); setErrors({}); setModalOpen(true); };
    const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); setErrors({}); };
    const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: null })); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true); setErrors({});
        const payload = { code: form.code, type: form.type, value: Number(form.value), min_order_amount: form.min_order_amount ? Number(form.min_order_amount) : null, max_discount: form.max_discount ? Number(form.max_discount) : null, usage_limit: form.usage_limit ? Number(form.usage_limit) : null, starts_at: form.starts_at || null, expires_at: form.expires_at || null };
        try { if (editing) await api.put(`/owner/businesses/${businessId}/coupons/${editing.id}`, payload); else await api.post(`/owner/businesses/${businessId}/coupons`, payload); closeModal(); fetchCoupons(); } catch (err) { console.error('Failed to save coupon:', err); if (err.response?.status === 422) setErrors(err.response.data?.errors || {}); } finally { setSubmitting(false); }
    };

    const confirmDelete = (coupon) => { setDeleting(coupon); setConfirmOpen(true); };
    const handleDelete = async () => { if (!deleting) return; try { await api.delete(`/owner/businesses/${businessId}/coupons/${deleting.id}`); setConfirmOpen(false); setDeleting(null); fetchCoupons(); } catch (error) { console.error('Failed to delete coupon:', error); alert(error?.response?.data?.message || 'Failed to delete coupon. Please try again.'); } };

    const formatPrice = (val) => `TZS ${Number(val || 0).toLocaleString()}`;

    const getCouponStatus = (coupon) => {
        if (coupon.status) return coupon.status;
        const now = new Date();
        if (coupon.expires_at && new Date(coupon.expires_at) < now) return 'expired';
        if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) return 'used_up';
        if (coupon.starts_at && new Date(coupon.starts_at) > now) return 'inactive';
        return 'active';
    };

    const handleReset = () => { setStatusFilter(''); };

    return (
        <div className="space-y-0">
            {businessId && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Coupons</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
                        <div className="h-12 w-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0"><Ticket size={22} className="text-[#00D4AA]" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active</p><p className="text-2xl font-bold text-gray-900">{stats.active}</p></div>
                        <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={22} className="text-green-500" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Expired</p><p className="text-2xl font-bold text-gray-900">{stats.expired}</p></div>
                        <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0"><Calendar size={22} className="text-red-500" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Used</p><p className="text-2xl font-bold text-gray-900">{stats.used}</p></div>
                        <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0"><Hash size={22} className="text-yellow-500" /></div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end mb-6">
                {businessId && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        <Plus size={16} /> <span className="hidden sm:inline">Add New</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4">
                    <Filter size={14} className="text-[#00D4AA] mr-2" /> Search Resources
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select value={businessId} onChange={(e) => setBusinessId(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                            <option value="">Select Business</option>
                            {businesses.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex gap-2 flex-wrap">
                            {TABS.map((tab) => (
                                <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${statusFilter === tab.key ? 'bg-[#00D4AA] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleReset} className="px-4 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30">
                            <RotateCcw size={12} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {!businessId ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center"><Ticket size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">Select a business to view coupons</p></div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : coupons.length === 0 ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center"><Ticket size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No data available</p></div>
                </div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Coupons ({coupons.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Code</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Value</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Min Order</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Usage</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-center">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {coupons.map((row) => {
                                    const status = getCouponStatus(row);
                                    const cfg = STATUS_MAP[status] || STATUS_MAP.active;
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3"><span className="font-mono font-bold text-[#00D4AA] text-sm bg-[#00D4AA]/10 px-2 py-1 rounded">{row.code}</span></td>
                                            <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00B894]">{row.type === 'percentage' ? 'Percentage' : 'Fixed'}</span></td>
                                            <td className="px-6 py-3 text-right font-semibold text-gray-800">{row.type === 'percentage' ? `${row.value}%` : formatPrice(row.value)}</td>
                                            <td className="px-6 py-3 text-right text-sm text-gray-600">{row.min_order_amount ? formatPrice(row.min_order_amount) : '-'}</td>
                                            <td className="px-6 py-3 text-right text-sm text-gray-600">{row.usage_count || 0}{row.usage_limit ? ` / ${row.usage_limit}` : ''}</td>
                                            <td className="px-6 py-3 text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>{cfg.label}</span></td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openEdit(row)} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Edit"><Pencil size={14} /></button>
                                                    <button onClick={() => confirmDelete(row)} className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
                    </div>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Coupon' : 'Create New Coupon'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Coupon Code <span className="text-red-500">*</span></label>
                            <input type="text" name="code" value={form.code} onChange={handleChange} required placeholder="e.g. SALE20" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] font-mono uppercase" />
                            {errors.code && <p className="mt-1 text-sm text-red-600">{errors.code[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Type <span className="text-red-500">*</span></label>
                            <select name="type" value={form.type} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]">
                                <option value="percentage">Percentage (%)</option>
                                <option value="fixed">Fixed Amount (TZS)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Value <span className="text-red-500">*</span></label>
                            <input type="number" name="value" value={form.value} onChange={handleChange} min="0" max={form.type === 'percentage' ? '100' : undefined} required placeholder={form.type === 'percentage' ? 'e.g. 10' : 'e.g. 5000'} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                            {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Minimum Order (TZS)</label>
                            <input type="number" name="min_order_amount" value={form.min_order_amount} onChange={handleChange} min="0" placeholder="Optional" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Maximum Discount (TZS)</label>
                            <input type="number" name="max_discount" value={form.max_discount} onChange={handleChange} min="0" placeholder="Optional" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Usage Limit</label>
                            <input type="number" name="usage_limit" value={form.usage_limit} onChange={handleChange} min="1" placeholder="Optional - unlimited" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Starts At</label>
                            <input type="datetime-local" name="starts_at" value={form.starts_at} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Expires At</label>
                            <input type="datetime-local" name="expires_at" value={form.expires_at} onChange={handleChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">
                            {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Create Coupon'}
                        </button>
                    </div>
                </form>
            </Modal>

            <div style={{ opacity: 0, height: 0, overflow: 'hidden' }}>
                {typeof CheckCircle === 'undefined' && null}
            </div>

            <ConfirmDialog isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setDeleting(null); }} onConfirm={handleDelete} title="Delete Coupon" message={`Are you sure you want to delete coupon "${deleting?.code}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
