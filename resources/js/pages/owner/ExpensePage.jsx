import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Receipt, Plus, Pencil, Trash2, Calendar, Tag, FileText, DollarSign, Clock, TrendingUp, CalendarDays, Filter, RotateCcw, Search } from 'lucide-react';

const EXPENSE_CATEGORIES = [
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'transport', label: 'Transport' },
    { value: 'drinks', label: 'Drinks' },
    { value: 'rent', label: 'Rent' },
    { value: 'salaries', label: 'Salaries' },
    { value: 'water', label: 'Water' },
    { value: 'electricity', label: 'Electricity' },
    { value: 'security', label: 'Security' },
    { value: 'taxes', label: 'Government Taxes' },
    { value: 'internet', label: 'Internet' },
    { value: 'charity', label: 'Charity' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' },
];

const EXPENSE_TYPES = [
    { value: '', label: 'All' },
    { value: 'daily', label: 'Daily' },
    { value: 'monthly', label: 'Monthly' },
];

const CATEGORY_LABEL_MAP = Object.fromEntries(EXPENSE_CATEGORIES.map((c) => [c.value, c.label]));

const emptyForm = { category: '', description: '', amount: '', type: 'daily', date: '' };

export default function ExpensePage() {
    document.title = 'Expenses - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');

    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [filterCategory, setFilterCategory] = useState('');
    const [filterType, setFilterType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const [summary, setSummary] = useState({ today: 0, month: 0, year: 0 });

    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const [deleteId, setDeleteId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); });
    }, []);

    const fetchExpenses = useCallback(async () => {
        if (!selectedBusiness) { setExpenses([]); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (filterCategory) params.category = filterCategory;
            if (filterType) params.type = filterType;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/expenses`, { params });
            setExpenses(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch (error) { console.error('Failed to fetch expenses:', error); setExpenses([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage, filterCategory, filterType, dateFrom, dateTo]);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
    useEffect(() => { setCurrentPage(1); }, [filterCategory, filterType, dateFrom, dateTo, selectedBusiness]);

    const openAddModal = () => { setEditingId(null); setForm(emptyForm); setModalOpen(true); };

    const openEditModal = (expense) => {
        setEditingId(expense.id);
        setForm({ category: expense.category || '', description: expense.description || '', amount: expense.amount || '', type: expense.type || 'daily', date: expense.date || '' });
        setModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedBusiness || !form.category || !form.amount || !form.date) return;
        setSubmitting(true);
        try {
            const payload = { category: form.category, description: form.description, amount: Number(form.amount), type: form.type, date: form.date };
            if (editingId) {
                await api.put(`/owner/businesses/${selectedBusiness}/expenses/${editingId}`, payload);
            } else {
                await api.post(`/owner/businesses/${selectedBusiness}/expenses`, payload);
            }
            setModalOpen(false); setEditingId(null); setForm(emptyForm); fetchExpenses();
        } catch (error) { console.error('Failed to save expense:', error); alert(error?.response?.data?.message || 'Failed to save expense. Please try again.'); } finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!deleteId || !selectedBusiness) return;
        try { await api.delete(`/owner/businesses/${selectedBusiness}/expenses/${deleteId}`); fetchExpenses(); } catch (error) { console.error('Failed to delete expense:', error); alert(error?.response?.data?.message || 'Failed to delete expense. Please try again.'); } finally { setDeleteId(null); setDeleteModalOpen(false); }
    };

    const handleReset = () => { setFilterCategory(''); setFilterType(''); setDateFrom(''); setDateTo(''); };

    const formatCurrency = (val) => `TZS ${Number(val || 0).toLocaleString()}`;

    return (
        <div className="space-y-0">
            {selectedBusiness && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Today</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.today)}</p>
                        </div>
                        <div className="h-12 w-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0">
                            <Clock size={22} className="text-[#00D4AA]" />
                        </div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Month</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.month)}</p>
                        </div>
                        <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0">
                            <CalendarDays size={22} className="text-yellow-500" />
                        </div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">This Year</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.year)}</p>
                        </div>
                        <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0">
                            <TrendingUp size={22} className="text-red-500" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end mb-6">
                {selectedBusiness && (
                    <button
                        onClick={openAddModal}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}
                    >
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
                        <select
                            value={selectedBusiness}
                            onChange={(e) => setSelectedBusiness(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            <option value="">Select Business</option>
                            {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name}</option>))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                            <option value="">All Categories</option>
                            {EXPENSE_CATEGORIES.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                        </select>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                            {EXPENSE_TYPES.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                        <button onClick={handleReset} className="px-4 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30">
                            <RotateCcw size={12} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {!selectedBusiness ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center">
                        <Receipt size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">Select a business to view expenses</p>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : expenses.length === 0 ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center">
                        <Receipt size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No data available</p>
                    </div>
                </div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Expenses ({expenses.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Description</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Amount</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Registered By</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {expenses.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 text-gray-600 text-sm">
                                            {row.date ? new Date(row.date).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{CATEGORY_LABEL_MAP[row.category] || row.category || '-'}</span>
                                        </td>
                                        <td className="px-6 py-3 text-gray-700 text-sm">{row.description || '-'}</td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00B894]">{row.type === 'monthly' ? 'Monthly' : 'Daily'}</span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCurrency(row.amount)}</td>
                                        <td className="px-6 py-3 text-gray-600">{row.user?.name || row.registered_by || '-'}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEditModal(row)} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Edit">
                                                    <Pencil size={14} />
                                                </button>
                                                <button onClick={() => { setDeleteId(row.id); setDeleteModalOpen(true); }} className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all" title="Delete">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm); }} title={editingId ? 'Edit Expense' : 'Add Expense'} size="md">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Category <span className="text-red-500">*</span></label>
                            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]">
                                <option value="">-- Select Category --</option>
                                {EXPENSE_CATEGORIES.map((cat) => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Amount (TZS) <span className="text-red-500">*</span></label>
                            <input type="number" min="0" step="any" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required placeholder="Enter amount" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Type <span className="text-red-500">*</span></label>
                            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]">
                                <option value="daily">Daily</option>
                                <option value="monthly">Monthly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Date <span className="text-red-500">*</span></label>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} placeholder="Expense description..." className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] resize-none" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => { setModalOpen(false); setEditingId(null); setForm(emptyForm); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">
                            {submitting ? 'Saving...' : editingId ? 'Update' : 'Add'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }} onConfirm={handleDelete} title="Delete Expense" message="Are you sure you want to delete this expense? This action cannot be undone." confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
