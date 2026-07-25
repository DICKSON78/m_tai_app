import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { BookOpen, Plus, Search, Edit2, Trash2, X } from 'lucide-react';
import Pagination from '../../components/Pagination';

const TYPES = { asset: 'bg-blue-100 text-blue-700', liability: 'bg-red-100 text-red-700', equity: 'bg-purple-100 text-purple-700', revenue: 'bg-green-100 text-green-700', expense: 'bg-orange-100 text-orange-700' };

export default function ChartOfAccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editAccount, setEditAccount] = useState(null);
    const [form, setForm] = useState({ code: '', name: '', type: 'asset', sub_type: '', description: '', opening_balance: 0, parent_id: '', is_bank_account: false });
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        try {
            const params = { per_page: 50 };
            if (search) params.search = search;
            if (typeFilter) params.type = typeFilter;
            const res = await api.get('/owner/finance/accounts', { params });
            setAccounts(res.data.data || []);
            setCurrentPage(res.data.current_page || 1);
            setLastPage(res.data.last_page || 1);
        } catch { setAccounts([]); } finally { setLoading(false); }
    }, [search, typeFilter]);

    useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = { ...form, opening_balance: Number(form.opening_balance || 0), parent_id: form.parent_id || null };
            if (editAccount) {
                await api.put(`/owner/finance/accounts/${editAccount.id}`, payload);
            } else {
                await api.post('/owner/finance/accounts', payload);
            }
            setShowForm(false); setEditAccount(null);
            setForm({ code: '', name: '', type: 'asset', sub_type: '', description: '', opening_balance: 0, parent_id: '', is_bank_account: false });
            fetchAccounts();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save account'); } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this account?')) return;
        try { await api.delete(`/owner/finance/accounts/${id}`); fetchAccounts(); } catch (err) { alert(err.response?.data?.message || 'Cannot delete'); }
    };

    const openEdit = (account) => { setEditAccount(account); setForm({ code: account.code, name: account.name, type: account.type, sub_type: account.sub_type || '', description: account.description || '', opening_balance: account.opening_balance || 0, parent_id: account.parent_id || '', is_bank_account: account.is_bank_account || false }); setShowForm(true); };

    return (
        <div className="space-y-6">
            <PageHeader title="Chart of Accounts" subtitle="Manage your accounts" icon={<BookOpen size={20} />}
                actions={<button onClick={() => { setEditAccount(null); setForm({ code: '', name: '', type: 'asset', sub_type: '', description: '', opening_balance: 0, parent_id: '', is_bank_account: false }); setShowForm(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Account</button>} />

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{editAccount ? 'Edit Account' : 'New Account'}</h3>
                        <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Code *</label><input type="text" required value={form.code} onChange={(e) => setForm({...form, code: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="e.g. 1000" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label><input type="text" required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="e.g. Cash" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Type *</label><select value={form.type} onChange={(e) => setForm({...form, type: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="asset">Asset</option><option value="liability">Liability</option><option value="equity">Equity</option><option value="revenue">Revenue</option><option value="expense">Expense</option></select></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Parent Account</label><select value={form.parent_id} onChange={(e) => setForm({...form, parent_id: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="">None (Top Level)</option>{accounts.filter(a => a.id !== editAccount?.id).map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Sub Type</label><input type="text" value={form.sub_type} onChange={(e) => setForm({...form, sub_type: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="e.g. current_asset" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Opening Balance</label><input type="number" value={form.opening_balance} onChange={(e) => setForm({...form, opening_balance: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Description</label><input type="text" value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            <div className="flex items-end"><label className="flex items-center gap-2 px-3 py-2.5 border border-gray-200 rounded-lg text-sm cursor-pointer hover:bg-gray-50"><input type="checkbox" checked={form.is_bank_account} onChange={(e) => setForm({...form, is_bank_account: e.target.checked})} className="rounded border-gray-300 text-[#00D4AA] focus:ring-[#00D4AA]" /> Bank Account</label></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search accounts..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30" /></div>
                    <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
                        {[{v:'',l:'All'},{v:'asset',l:'Assets'},{v:'liability',l:'Liabilities'},{v:'equity',l:'Equity'},{v:'revenue',l:'Revenue'},{v:'expense',l:'Expenses'}].map(t => <button key={t.v} onClick={() => setTypeFilter(t.v)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${typeFilter===t.v ? 'bg-[#00D4AA] text-white' : 'text-gray-600 hover:bg-white'}`}>{t.l}</button>)}
                    </div>
                </div>
            </div>

            {loading ? <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div> : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Code</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Type</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Sub Type</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Opening Balance</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                            </tr></thead>
                            <tbody>
                                {accounts.length === 0 ? <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">No accounts found</td></tr> : accounts.map(a => (
                                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm font-mono font-semibold text-gray-900">{a.code}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{a.name}</td>
                                        <td className="px-6 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${TYPES[a.type] || ''}`}>{a.type}</span></td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{a.sub_type || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-900 text-right">TZS {Number(a.opening_balance || 0).toLocaleString()}</td>
                                        <td className="px-6 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${a.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{a.is_active ? 'Active' : 'Inactive'}</span></td>
                                        <td className="px-6 py-3 text-right"><button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-[#00D4AA]"><Edit2 size={14} /></button><button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></td>
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
