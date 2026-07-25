import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { BookOpen, Plus, Search, Trash2, X } from 'lucide-react';
import Pagination from '../../components/Pagination';

export default function JournalEntriesPage() {
    const [entries, setEntries] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', reference: '', lines: [{ account_id: '', debit: 0, credit: 0, description: '' }, { account_id: '', debit: 0, credit: 0, description: '' }] });
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = { per_page: 20 };
            if (search) params.search = search;
            const [entriesRes, accountsRes] = await Promise.all([api.get('/owner/finance/journal', { params }), api.get('/owner/finance/accounts', { per_page: 200 })]);
            setEntries(entriesRes.data.data || []);
            setCurrentPage(entriesRes.data.current_page || 1);
            setLastPage(entriesRes.data.last_page || 1);
            setAccounts(accountsRes.data.data || []);
        } catch { setEntries([]); } finally { setLoading(false); }
    }, [search]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalDebit = form.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const totalCredit = form.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

    const addLine = () => setForm({...form, lines: [...form.lines, { account_id: '', debit: 0, credit: 0, description: '' }]});
    const removeLine = (i) => setForm({...form, lines: form.lines.filter((_, idx) => idx !== i)});
    const updateLine = (i, field, value) => { const lines = [...form.lines]; lines[i][field] = value; setForm({...form, lines}); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isBalanced) return alert('Debits must equal credits');
        setSaving(true);
        try {
            await api.post('/owner/finance/journal', form);
            setShowForm(false); setForm({ date: new Date().toISOString().split('T')[0], description: '', reference: '', lines: [{ account_id: '', debit: 0, credit: 0, description: '' }, { account_id: '', debit: 0, credit: 0, description: '' }] });
            fetchData();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); } finally { setSaving(false); }
    };

    const handleDelete = async (id) => { if (!confirm('Delete?')) return; try { await api.delete(`/owner/finance/journal/${id}`); fetchData(); } catch (err) { alert(err.response?.data?.message || 'Cannot delete'); } };

    return (
        <div className="space-y-6">
            <PageHeader title="Journal Entries" subtitle="Double-entry bookkeeping" icon={<BookOpen size={20} />}
                actions={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Entry</button>} />

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">New Journal Entry</h3><button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label><input type="date" required value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label><input type="text" required value={form.description} onChange={(e) => setForm({...form, description: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="Description" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Reference</label><input type="text" value={form.reference} onChange={(e) => setForm({...form, reference: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="Ref #" /></div>
                        </div>
                        <div className="space-y-3">
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase px-1"><div className="col-span-4">Account</div><div className="col-span-3">Description</div><div className="col-span-2">Debit</div><div className="col-span-2">Credit</div><div className="col-span-1"></div></div>
                            {form.lines.map((line, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-4"><select value={line.account_id} onChange={(e) => updateLine(i, 'account_id', e.target.value)} className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg"><option value="">Select account</option>{accounts.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select></div>
                                    <div className="col-span-3"><input type="text" value={line.description} onChange={(e) => updateLine(i, 'description', e.target.value)} className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg" placeholder="Description" /></div>
                                    <div className="col-span-2"><input type="number" min="0" step="0.01" value={line.debit} onChange={(e) => updateLine(i, 'debit', e.target.value)} className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg text-right" /></div>
                                    <div className="col-span-2"><input type="number" min="0" step="0.01" value={line.credit} onChange={(e) => updateLine(i, 'credit', e.target.value)} className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg text-right" /></div>
                                    <div className="col-span-1">{form.lines.length > 2 && <button type="button" onClick={() => removeLine(i)} className="p-1 text-gray-400 hover:text-red-500"><X size={14} /></button>}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between mt-4">
                            <button type="button" onClick={addLine} className="inline-flex items-center gap-1 text-sm text-[#00D4AA] font-medium"><Plus size={14} /> Add Line</button>
                            <div className="flex gap-6 text-sm"><span className={totalDebit === totalCredit ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>Debit: TZS {Number(totalDebit).toLocaleString()}</span><span className={totalDebit === totalCredit ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>Credit: TZS {Number(totalCredit).toLocaleString()}</span></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                            <button type="submit" disabled={saving || !isBalanced} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : 'Post Entry'}</button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search entries..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30" /></div></div>

            {loading ? <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div> : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Date</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Reference</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Description</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Debit</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Credit</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                            </tr></thead>
                            <tbody>
                                {entries.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">No entries found</td></tr> : entries.map(e => (
                                    <tr key={e.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm text-gray-600">{new Date(e.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-sm font-mono text-gray-900">{e.reference || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-900">{e.description}</td>
                                        <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">TZS {Number(e.total_debit).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">TZS {Number(e.total_credit).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-right"><button onClick={() => handleDelete(e.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></td>
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
