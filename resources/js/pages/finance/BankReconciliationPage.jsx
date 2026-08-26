import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import Pagination from '../../components/Pagination';
import { CheckCircle, Plus, Search, Eye, Trash2, X, Building, CreditCard } from 'lucide-react';

const currencyFmt = new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 });
const fmt = (n) => currencyFmt.format(Number(n) || 0);

const STATUS_CLASSES = { draft: 'bg-yellow-100 text-yellow-700', reconciled: 'bg-green-100 text-green-700', voided: 'bg-red-100 text-red-700' };

const accountName = (rec) => rec.bank_account?.account_name || rec.bank_account_name || `Account #${rec.bank_account_id}`;

const txSignedAmount = (tx) => {
    const debit = Number(tx.debit || 0);
    const credit = Number(tx.credit || 0);
    if (debit || credit) return credit - debit;
    const amount = Number(tx.amount || 0);
    return ['debit', 'withdrawal'].includes(String(tx.type || '').toLowerCase()) ? -amount : amount;
};

export default function BankReconciliationPage() {
    const [reconciliations, setReconciliations] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [accountFilter, setAccountFilter] = useState('');
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ bank_account_id: '', reconciliation_date: new Date().toISOString().split('T')[0], statement_balance: '', notes: '' });
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [finalizing, setFinalizing] = useState(false);

    const fetchReconciliations = useCallback(async () => {
        setLoading(true);
        try {
            const params = { per_page: 20, page: currentPage };
            if (statusFilter) params.status = statusFilter;
            if (accountFilter) params.bank_account_id = accountFilter;
            const res = await api.get('/owner/finance/bank-reconciliations', { params });
            setReconciliations(res.data.data || []);
            setCurrentPage(res.data.current_page || 1);
            setLastPage(res.data.last_page || 1);
        } catch (error) { console.error('Failed to fetch reconciliations:', error); setReconciliations([]); } finally { setLoading(false); }
    }, [statusFilter, accountFilter, currentPage]);

    const fetchAccounts = useCallback(async () => {
        try {
            const res = await api.get('/owner/finance/bank-accounts');
            setAccounts(Array.isArray(res.data) ? res.data : res.data.data || []);
        } catch (error) { console.error('Failed to fetch bank accounts:', error); setAccounts([]); }
    }, []);

    useEffect(() => { fetchReconciliations(); }, [fetchReconciliations]);
    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
    useEffect(() => { setCurrentPage(1); }, [statusFilter, accountFilter]);

    const filtered = reconciliations.filter((r) => {
        if (!search) return true;
        const q = search.toLowerCase();
        return String(accountName(r)).toLowerCase().includes(q) || String(r.notes || '').toLowerCase().includes(q);
    });

    const stats = {
        total: filtered.length,
        drafts: filtered.filter((r) => r.status === 'draft').length,
        reconciled: filtered.filter((r) => r.status === 'reconciled').length,
        difference: filtered.reduce((s, r) => s + Number(r.difference ?? (Number(r.statement_balance || 0) - Number(r.book_balance || 0))), 0),
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/owner/finance/bank-reconciliations', { ...form, statement_balance: Number(form.statement_balance || 0) });
            setShowForm(false);
            setForm({ bank_account_id: '', reconciliation_date: new Date().toISOString().split('T')[0], statement_balance: '', notes: '' });
            fetchReconciliations();
        } catch (err) { alert(err.response?.data?.message || 'Failed to create reconciliation'); } finally { setSaving(false); }
    };

    const openDetail = async (id) => {
        setDetailLoading(true);
        setSelectedIds([]);
        try {
            const res = await api.get(`/owner/finance/bank-reconciliations/${id}`);
            setDetail({ reconciliation: res.data.reconciliation || {}, transactions: res.data.unreconciled_transactions || [] });
        } catch (err) { alert(err.response?.data?.message || 'Failed to load reconciliation'); } finally { setDetailLoading(false); }
    };

    const handleDelete = async (rec) => {
        if (!confirm('Delete this draft reconciliation?')) return;
        try { await api.delete(`/owner/finance/bank-reconciliations/${rec.id}`); fetchReconciliations(); } catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
    };

    const toggleSelect = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

    const toggleSelectAll = () => {
        if (!detail) return;
        setSelectedIds(selectedIds.length === detail.transactions.length ? [] : detail.transactions.map((t) => t.id));
    };

    const handleFinalize = async () => {
        if (!detail || selectedIds.length === 0) return;
        setFinalizing(true);
        try {
            await api.post(`/owner/finance/bank-reconciliations/${detail.reconciliation.id}/reconcile`, { transaction_ids: selectedIds.map(Number) });
            setDetail(null);
            setSelectedIds([]);
            fetchReconciliations();
        } catch (err) { alert(err.response?.data?.message || 'Failed to finalize reconciliation'); } finally { setFinalizing(false); }
    };

    const selectedTxs = detail ? detail.transactions.filter((t) => selectedIds.includes(t.id)) : [];
    const selectedTotal = selectedTxs.reduce((s, t) => s + txSignedAmount(t), 0);
    const allSelected = detail && detail.transactions.length > 0 && selectedIds.length === detail.transactions.length;

    if (detailLoading) return <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;

    if (detail) {
        const rec = detail.reconciliation;
        const isDraft = rec.status === 'draft';
        return (
            <div className="space-y-6">
                <PageHeader title={`Reconciliation #${rec.id}`} subtitle={`${accountName(rec)} · ${new Date(rec.reconciliation_date).toLocaleDateString()}`} icon={<CreditCard size={20} />}
                    actions={<button onClick={() => setDetail(null)} className="inline-flex items-center gap-1.5 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-sm font-medium transition-all"><X size={15} /> Close</button>} />

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">Reconciliation Details</h3>
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_CLASSES[rec.status] || ''}`}>{rec.status}</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">Date</p><p className="text-sm font-semibold text-gray-900">{new Date(rec.reconciliation_date).toLocaleDateString()}</p></div>
                        <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">Statement Balance</p><p className="text-sm font-semibold text-gray-900">{fmt(rec.statement_balance)}</p></div>
                        <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">Book Balance</p><p className="text-sm font-semibold text-gray-900">{rec.book_balance != null ? fmt(rec.book_balance) : '-'}</p></div>
                        <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">Difference</p><p className={`text-sm font-semibold ${Math.abs(Number(rec.difference || 0)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>{fmt(rec.difference)}</p></div>
                        <div><p className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</p><p className="text-sm text-gray-600">{rec.notes || '-'}</p></div>
                    </div>
                </div>

                <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
                    <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">Unreconciled Transactions</h3>
                            <p className="text-sm text-gray-500 mt-0.5">{isDraft ? 'Select the transactions that appear on your bank statement.' : 'This reconciliation is finalized.'}</p>
                        </div>
                        <div className="text-sm">
                            <span className="font-medium text-gray-900">{selectedIds.length}</span>
                            <span className="text-gray-500"> of {detail.transactions.length} selected · Net: </span>
                            <span className={`font-semibold ${selectedTotal < 0 ? 'text-red-600' : 'text-green-600'}`}>{fmt(selectedTotal)}</span>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="px-6 py-3 w-12">{detail.transactions.length > 0 && (
                                    <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} disabled={!isDraft} className="h-4 w-4 accent-[#00D4AA] cursor-pointer disabled:cursor-not-allowed" aria-label="Select all transactions" />
                                )}</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Date</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Description</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Reference</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Debit</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Credit</th>
                            </tr></thead>
                            <tbody>
                                {detail.transactions.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12"><div className="flex flex-col items-center gap-2 text-center"><CheckCircle className="w-10 h-10 text-green-500" /><p className="text-sm text-gray-500">No unreconciled transactions. Everything is matched.</p></div></td></tr>
                                ) : detail.transactions.map((tx) => (
                                    <tr key={tx.id} className={`border-b border-gray-50 transition-colors ${selectedIds.includes(tx.id) ? 'bg-[#00D4AA]/5' : 'hover:bg-gray-50'}`}>
                                        <td className="px-6 py-3">
                                            <input type="checkbox" checked={selectedIds.includes(tx.id)} onChange={() => toggleSelect(tx.id)} disabled={!isDraft} className="h-4 w-4 accent-[#00D4AA] cursor-pointer disabled:cursor-not-allowed" aria-label={`Select transaction ${tx.id}`} />
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{new Date(tx.date || tx.transaction_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-sm text-gray-900">{tx.description || tx.narration || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-500">{tx.reference || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-right font-semibold text-red-600">{Number(tx.debit) > 0 ? fmt(tx.debit) : '-'}</td>
                                        <td className="px-6 py-3 text-sm text-right font-semibold text-green-600">{Number(tx.credit) > 0 ? fmt(tx.credit) : '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {isDraft && (
                        <div className="px-6 py-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                            <p className="text-sm text-gray-500">{selectedIds.length > 0 ? `${selectedIds.length} transaction(s) totaling ${fmt(selectedTotal)} will be marked as reconciled.` : 'Select at least one transaction to finalize.'}</p>
                            <button onClick={handleFinalize} disabled={selectedIds.length === 0 || finalizing} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-all">
                                <CheckCircle size={16} />{finalizing ? 'Finalizing...' : 'Finalize Reconciliation'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <PageHeader title="Bank Reconciliation" subtitle="Match bank statements against your book records" icon={<Building size={20} />}
                actions={<button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-lg px-4 py-2 text-sm font-semibold hover:opacity-90 transition-all"><Plus size={16} /> New Reconciliation</button>} />

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500 mb-1">Total Reconciliations</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div><div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center"><Building className="w-6 h-6 text-[#00D4AA]" /></div></div></div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500 mb-1">Draft</p><p className="text-2xl font-bold text-gray-900">{stats.drafts}</p></div><div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center"><CreditCard className="w-6 h-6 text-yellow-500" /></div></div></div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500 mb-1">Reconciled</p><p className="text-2xl font-bold text-gray-900">{stats.reconciled}</p></div><div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-500" /></div></div></div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500 mb-1">Total Difference</p><p className={`text-2xl font-bold ${Math.abs(stats.difference) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>{fmt(stats.difference)}</p></div><div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center"><X className="w-6 h-6 text-red-500" /></div></div></div>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">New Bank Reconciliation</h3><button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Bank Account *</label><select required value={form.bank_account_id} onChange={(e) => setForm({ ...form, bank_account_id: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="">Select account</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.account_name}{a.bank_name ? ` - ${a.bank_name}` : ''}</option>)}</select></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Reconciliation Date *</label><input type="date" required value={form.reconciliation_date} onChange={(e) => setForm({ ...form, reconciliation_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Statement Balance *</label><input type="number" min="0" step="0.01" required value={form.statement_balance} onChange={(e) => setForm({ ...form, statement_balance: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="0.00" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label><input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="Optional notes" /></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                            <button type="submit" disabled={saving} className="bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 hover:opacity-90 transition-all">{saving ? 'Creating...' : 'Create Reconciliation'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                    {[{ v: '', l: 'All' }, { v: 'draft', l: 'Draft' }, { v: 'reconciled', l: 'Reconciled' }, { v: 'voided', l: 'Voided' }].map((s) => (
                        <button key={s.v} onClick={() => setStatusFilter(s.v)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === s.v ? 'bg-[#00D4AA] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}>{s.l}</button>
                    ))}
                </div>
                <select value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)} className="px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 bg-white">
                    <option value="">All Bank Accounts</option>
                    {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_name}</option>)}
                </select>
                <div className="relative flex-1 max-w-xs">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..." className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Date</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Bank Account</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Statement Balance</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Book Balance</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Difference</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                            </tr></thead>
                            <tbody>
                                {filtered.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12"><div className="flex flex-col items-center gap-2 text-center"><Building className="w-10 h-10 text-gray-300" /><p className="text-sm text-gray-500">No reconciliations found. Create one to start matching your bank statement.</p></div></td></tr>
                                ) : filtered.map((rec) => (
                                    <tr key={rec.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm text-gray-600">{new Date(rec.reconciliation_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{accountName(rec)}</td>
                                        <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">{fmt(rec.statement_balance)}</td>
                                        <td className="px-6 py-3 text-sm text-right text-gray-600">{rec.book_balance != null ? fmt(rec.book_balance) : '-'}</td>
                                        <td className={`px-6 py-3 text-sm text-right font-semibold ${Math.abs(Number(rec.difference || 0)) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>{fmt(rec.difference)}</td>
                                        <td className="px-6 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_CLASSES[rec.status] || ''}`}>{rec.status}</span></td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => openDetail(rec.id)} className="p-2 text-[#00D4AA] bg-[#00D4AA]/10 rounded-lg hover:bg-[#00D4AA]/20 transition-colors" title="View details"><Eye size={16} /></button>
                                                {rec.status === 'draft' && <button onClick={() => handleDelete(rec)} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors" title="Delete draft"><Trash2 size={16} /></button>}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {lastPage > 1 && <div className="px-6 py-4 border-t border-gray-100"><Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} /></div>}
                </div>
            )}
        </div>
    );
}
