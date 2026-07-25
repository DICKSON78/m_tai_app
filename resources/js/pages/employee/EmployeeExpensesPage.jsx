import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/casfeta/PageHeader';
import { Plus, X, Search, SlidersHorizontal, DollarSign } from 'lucide-react';

const EXPENSE_CATEGORIES = {
    breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', transport: 'Transport',
    drinks: 'Drinks', rent: 'Rent', salaries: 'Salaries', water: 'Water',
    electricity: 'Electricity', security: 'Security', taxes: 'Government Taxes',
    internet: 'Internet', charity: 'Charity', maintenance: 'Maintenance', other: 'Other',
};

export default function EmployeeExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({ title: '', amount: '', category: 'other', type: 'daily', date: new Date().toISOString().split('T')[0], notes: '' });

    const fetchExpenses = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const res = await api.get('/employee/expenses', { params });
            const data = res.data?.data || [];
            setExpenses(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            setTotal(res.data?.total || data.length);
        } catch {
            setExpenses([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, dateFrom, dateTo]);

    useEffect(() => { fetchExpenses(); }, [fetchExpenses]);
    useEffect(() => { setCurrentPage(1); }, [dateFrom, dateTo]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/employee/expenses', form);
            setForm({ title: '', amount: '', category: 'other', type: 'daily', date: new Date().toISOString().split('T')[0], notes: '' });
            setShowForm(false);
            fetchExpenses();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to record expense.');
        } finally {
            setSubmitting(false);
        }
    };

    const hasActiveFilters = dateFrom || dateTo;

    return (
        <div className="space-y-6">
            <PageHeader title="Expenses" subtitle="View and record business expenses" icon={<DollarSign size={20} />}
                actions={
                    <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        <Plus size={16} /> Record Expense
                    </button>
                }
            />

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">Record New Expense</h3>
                        <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label>
                                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA]" placeholder="e.g. Office supplies" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Amount (TZS) *</label>
                                <input type="number" required min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA]" placeholder="0" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Category</label>
                                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA]">
                                    {Object.entries(EXPENSE_CATEGORIES).map(([key, label]) => (<option key={key} value={key}>{label}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA]">
                                    <option value="daily">Daily</option>
                                    <option value="monthly">Monthly</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label>
                                <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA]" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                                <input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 focus:border-[#00D4AA]" placeholder="Optional notes" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                            <button type="submit" disabled={submitting} className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{submitting ? 'Saving...' : 'Record Expense'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                    <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                    {hasActiveFilters && (
                        <button onClick={() => { setDateFrom(''); setDateTo(''); }} className="inline-flex items-center gap-1 ml-auto text-xs text-gray-500 hover:text-gray-700">
                            <X size={12} /> Clear filters
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">Start Date</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                    </div>
                    <div>
                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1 block">End Date</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Expenses</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Description</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Recorded By</th>
                            </tr></thead>
                            <tbody>
                                {expenses.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">No expenses found.</td></tr>
                                ) : expenses.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 text-sm text-gray-500">{row.date ? new Date(row.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                        <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{EXPENSE_CATEGORIES[row.category] || row.category || '-'}</span></td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{row.description || '-'}</td>
                                        <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00D4AA]">{row.type === 'monthly' ? 'Monthly' : 'Daily'}</span></td>
                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">TZS {Number(row.amount || 0).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{row.user?.name || row.registered_by || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100"><Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} /></div>
                </div>
            )}
        </div>
    );
}
