import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { CreditCard, Plus, Pencil, Trash2, User, Phone, Package, DollarSign, Calendar, FileText, Search, Clock, CheckCircle, TrendingDown, Filter, RotateCcw } from 'lucide-react';

const STATUS_TABS = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'partial', label: 'Partial' },
    { key: 'cleared', label: 'Cleared' },
    { key: 'overdue', label: 'Overdue' },
];

const STATUS_MAP = {
    pending: { label: 'Pending', badge: 'bg-yellow-100 text-yellow-700' },
    partial: { label: 'Partial', badge: 'bg-blue-100 text-blue-600' },
    cleared: { label: 'Cleared', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    overdue: { label: 'Overdue', badge: 'bg-red-100 text-red-600' },
};

const emptyForm = { customer_name: '', customer_phone: '', product_name: '', quantity: '', amount: '', due_date: '', notes: '' };

export default function CreditSalesPage() {
    document.title = 'Credit Sales - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [creditSales, setCreditSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [stats, setStats] = useState({ total: 0, pending: 0, partial: 0, cleared: 0, overdue: 0, total_outstanding: 0 });
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [payModalOpen, setPayModalOpen] = useState(false);
    const [payItem, setPayItem] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [payError, setPayError] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        api.get('/owner/businesses').then(res => { const biz = res.data?.data || res.data || []; setBusinesses(biz); if (biz.length === 1) setSelectedBusiness(biz[0].id); }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); });
    }, []);

    const fetchData = useCallback(async () => {
        if (!selectedBusiness) { setCreditSales([]); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/credit-sales`, { params });
            setCreditSales(res.data?.data || []); setCurrentPage(res.data?.current_page || 1); setLastPage(res.data?.last_page || 1);
            if (res.data?.stats) setStats(res.data.stats);
        } catch (error) { console.error('Failed to fetch credit sales:', error); setCreditSales([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage, search, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [selectedBusiness, search, statusFilter]);

    const handleAdd = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try { await api.post(`/owner/businesses/${selectedBusiness}/credit-sales`, { ...form, quantity: Number(form.quantity), amount: Number(form.amount) }); setAddModalOpen(false); setForm(emptyForm); fetchData(); } catch (error) { console.error('Failed to add credit sale:', error); alert(error?.response?.data?.message || 'Failed to add credit sale. Please try again.'); } finally { setSubmitting(false); }
    };

    const handleEdit = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try { await api.put(`/owner/businesses/${selectedBusiness}/credit-sales/${editingItem.id}`, { ...form, quantity: Number(form.quantity), amount: Number(form.amount) }); setEditModalOpen(false); setEditingItem(null); setForm(emptyForm); fetchData(); } catch (error) { console.error('Failed to update credit sale:', error); alert(error?.response?.data?.message || 'Failed to update credit sale. Please try again.'); } finally { setSubmitting(false); }
    };

    const handlePay = async (e) => {
        e.preventDefault(); if (!payItem) return;
        const amount = Number(payAmount); const remaining = payItem.amount - payItem.amount_paid;
        if (!amount || amount <= 0) { setPayError('Enter a valid amount.'); return; }
        if (amount > remaining) { setPayError(`Amount cannot exceed remaining balance of TZS ${remaining.toLocaleString()}.`); return; }
        try { await api.post(`/owner/businesses/${selectedBusiness}/credit-sales/${payItem.id}/pay`, { amount }); setPayModalOpen(false); setPayItem(null); setPayAmount(''); setPayError(''); fetchData(); } catch (err) { console.error('Failed to process payment:', err); setPayError(err.response?.data?.message || 'Payment failed.'); }
    };

    const handleDelete = async () => { if (!deleteId) return; try { await api.delete(`/owner/businesses/${selectedBusiness}/credit-sales/${deleteId}`); fetchData(); } catch (error) { console.error('Failed to delete credit sale:', error); alert(error?.response?.data?.message || 'Failed to delete credit sale. Please try again.'); } finally { setDeleteId(null); setDeleteModalOpen(false); } };
    const openEdit = (item) => { setEditingItem(item); setForm({ customer_name: item.customer_name || '', customer_phone: item.customer_phone || '', product_name: item.product_name || '', quantity: item.quantity || '', amount: item.amount || '', due_date: item.due_date || '', notes: item.notes || '' }); setEditModalOpen(true); };
    const handleReset = () => { setSearch(''); setStatusFilter(''); };
    const formatCurrency = (val) => `TZS ${Number(val || 0).toLocaleString()}`;

    return (
        <div className="space-y-0">
            {selectedBusiness && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
                        <div className="h-12 w-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0"><CreditCard size={22} className="text-[#00D4AA]" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</p><p className="text-2xl font-bold text-gray-900">{stats.pending}</p></div>
                        <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0"><Clock size={22} className="text-yellow-500" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Cleared</p><p className="text-2xl font-bold text-gray-900">{stats.cleared}</p></div>
                        <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={22} className="text-green-500" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Outstanding</p><p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.total_outstanding)}</p></div>
                        <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0"><TrendingDown size={22} className="text-red-500" /></div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end mb-6">
                {selectedBusiness && (
                    <button onClick={() => { setForm(emptyForm); setAddModalOpen(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
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
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, phone, or product..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                            <option value="">All Businesses</option>
                            {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name || biz.business_name}</option>))}
                        </select>
                        <div className="flex gap-2 flex-wrap">
                            {STATUS_TABS.map((tab) => (
                                <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${statusFilter === tab.key ? 'bg-[#00D4AA] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
                            ))}
                        </div>
                        <button onClick={handleReset} className="px-4 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30">
                            <RotateCcw size={12} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {!selectedBusiness ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center"><CreditCard size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">Select a business to view credit sales</p></div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : creditSales.length === 0 ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center"><CreditCard size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No data available</p></div>
                </div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Credit Sales ({creditSales.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Product</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Total</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Paid</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Balance</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-center">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Due Date</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {creditSales.map((row) => {
                                    const cfg = STATUS_MAP[row.status] || STATUS_MAP.pending;
                                    const remaining = row.amount - row.amount_paid;
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3"><p className="font-medium text-gray-800">{row.customer_name}</p><p className="text-xs text-gray-500">{row.customer_phone}</p></td>
                                            <td className="px-6 py-3 text-gray-700">{row.product_name}</td>
                                            <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCurrency(row.amount)}</td>
                                            <td className="px-6 py-3 text-right text-[#00B894] font-medium">{formatCurrency(row.amount_paid)}</td>
                                            <td className="px-6 py-3 text-right font-semibold text-red-600">{formatCurrency(remaining)}</td>
                                            <td className="px-6 py-3 text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>{cfg.label}</span></td>
                                            <td className="px-6 py-3 text-gray-600 text-sm">{row.due_date ? new Date(row.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    {row.status !== 'cleared' && <button onClick={() => { setPayItem(row); setPayAmount(''); setPayError(''); setPayModalOpen(true); }} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Pay"><DollarSign size={14} /></button>}
                                                    <button onClick={() => openEdit(row)} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Edit"><Pencil size={14} /></button>
                                                    <button onClick={() => { setDeleteId(row.id); setDeleteModalOpen(true); }} className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}

            <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Credit Sale" size="md">
                <form onSubmit={handleAdd} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Customer Name <span className="text-red-500">*</span></label><input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Customer Phone <span className="text-red-500">*</span></label><input type="text" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Product Name <span className="text-red-500">*</span></label><input type="text" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Quantity <span className="text-red-500">*</span></label><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Total (TZS) <span className="text-red-500">*</span></label><input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Due Date <span className="text-red-500">*</span></label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Notes (optional)" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] resize-none" /></div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setAddModalOpen(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">{submitting ? 'Saving...' : 'Save'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingItem(null); }} title="Edit Credit Sale" size="md">
                <form onSubmit={handleEdit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Customer Name <span className="text-red-500">*</span></label><input type="text" value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Customer Phone <span className="text-red-500">*</span></label><input type="text" value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Product Name <span className="text-red-500">*</span></label><input type="text" value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Quantity <span className="text-red-500">*</span></label><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Total (TZS) <span className="text-red-500">*</span></label><input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Due Date <span className="text-red-500">*</span></label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div className="md:col-span-2"><label className="block text-sm font-semibold text-gray-900 mb-2">Notes</label><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] resize-none" /></div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => { setEditModalOpen(false); setEditingItem(null); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">{submitting ? 'Saving...' : 'Update'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={payModalOpen} onClose={() => { setPayModalOpen(false); setPayItem(null); setPayAmount(''); setPayError(''); }} title="Pay Credit Sale" size="sm">
                {payItem && (
                    <form onSubmit={handlePay} className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Customer</span><span className="text-sm font-medium">{payItem.customer_name}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Total</span><span className="text-sm font-semibold">{formatCurrency(payItem.amount)}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Paid</span><span className="text-sm text-[#00B894]">{formatCurrency(payItem.amount_paid)}</span></div>
                            <div className="flex justify-between border-t pt-2"><span className="text-sm font-medium">Balance</span><span className="text-sm font-bold text-red-600">{formatCurrency(payItem.amount - payItem.amount_paid)}</span></div>
                        </div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Payment Amount (TZS) <span className="text-red-500">*</span></label><input type="number" min="1" max={payItem.amount - payItem.amount_paid} value={payAmount} onChange={(e) => { setPayAmount(e.target.value); setPayError(''); }} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        {payError && <p className="text-sm text-red-600">{payError}</p>}
                        <div className="flex justify-end space-x-3 pt-2">
                            <button type="button" onClick={() => { setPayModalOpen(false); setPayItem(null); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                            <button type="submit" className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">Pay Now</button>
                        </div>
                    </form>
                )}
            </Modal>

            <ConfirmDialog isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }} onConfirm={handleDelete} title="Delete Credit Sale" message="Are you sure you want to delete this credit sale?" confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
