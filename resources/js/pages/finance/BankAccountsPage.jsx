import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Building2, Plus, Search, ArrowUpRight, ArrowDownLeft, X, Eye } from 'lucide-react';

export default function BankAccountsPage() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ bank_name: '', account_name: '', account_number: '', sort_code: '', account_id: '' });
    const [coa, setCoa] = useState([]);
    const [saving, setSaving] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [txLoading, setTxLoading] = useState(false);
    const [showTxForm, setShowTxForm] = useState(false);
    const [txForm, setTxForm] = useState({ date: new Date().toISOString().split('T')[0], description: '', reference: '', type: 'credit', amount: '' });

    const fetchAccounts = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/owner/finance/bank-accounts'); setAccounts(res.data || []); } catch { setAccounts([]); } finally { setLoading(false); }
    }, []);

    const fetchCoa = useCallback(async () => {
        try { const res = await api.get('/owner/finance/accounts', { params: { type: 'asset', per_page: 200 } }); setCoa(res.data.data || []); } catch { setCoa([]); }
    }, []);

    useEffect(() => { fetchAccounts(); fetchCoa(); }, [fetchAccounts, fetchCoa]);

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try { await api.post('/owner/finance/bank-accounts', form); setShowForm(false); setForm({ bank_name: '', account_name: '', account_number: '', sort_code: '', account_id: '' }); fetchAccounts(); } catch (err) { alert(err.response?.data?.message || 'Failed'); } finally { setSaving(false); }
    };

    const handleTxSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try { await api.post(`/owner/finance/bank-accounts/${selectedAccount.id}/transactions`, txForm); setShowTxForm(false); setTxForm({ date: new Date().toISOString().split('T')[0], description: '', reference: '', type: 'credit', amount: '' }); viewTransactions(selectedAccount); } catch (err) { alert(err.response?.data?.message || 'Failed'); } finally { setSaving(false); }
    };

    const viewTransactions = async (account) => {
        setSelectedAccount(account); setTxLoading(true);
        try { const res = await api.get(`/owner/finance/bank-accounts/${account.id}/transactions`); setTransactions(res.data.data || []); } catch { setTransactions([]); } finally { setTxLoading(false); }
    };

    const handleDelete = async (id) => { if (!confirm('Delete?')) return; try { await api.delete(`/owner/finance/bank-accounts/${id}`); fetchAccounts(); } catch (err) { alert(err.response?.data?.message); } };

    return (
        <div className="space-y-6">
            <PageHeader title="Bank Accounts" subtitle="Manage bank accounts and transactions" icon={<Building2 size={20} />}
                actions={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Account</button>} />

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">New Bank Account</h3><button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Chart of Account *</label><select required value={form.account_id} onChange={(e) => setForm({...form, account_id: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="">Select account</option>{coa.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}</select></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Bank Name *</label><input type="text" required value={form.bank_name} onChange={(e) => setForm({...form, bank_name: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Account Name *</label><input type="text" required value={form.account_name} onChange={(e) => setForm({...form, account_name: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Account Number</label><input type="text" value={form.account_number} onChange={(e) => setForm({...form, account_number: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {showTxForm && selectedAccount && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">Add Transaction - {selectedAccount.account_name}</h3><button onClick={() => setShowTxForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
                    <form onSubmit={handleTxSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label><input type="date" required value={txForm.date} onChange={(e) => setTxForm({...txForm, date: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Description *</label><input type="text" required value={txForm.description} onChange={(e) => setTxForm({...txForm, description: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Type *</label><select value={txForm.type} onChange={(e) => setTxForm({...txForm, type: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="credit">Deposit (Credit)</option><option value="debit">Withdrawal (Debit)</option></select></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Amount *</label><input type="number" min="0.01" step="0.01" required value={txForm.amount} onChange={(e) => setTxForm({...txForm, amount: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => setShowTxForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : 'Add Transaction'}</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {accounts.map(acc => (
                        <div key={acc.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div><p className="text-sm font-medium text-gray-500">{acc.bank_name}</p><p className="text-lg font-bold text-gray-900">{acc.account_name}</p><p className="text-xs text-gray-400 mt-1">{acc.account_number || 'No account number'}</p></div>
                                <Building2 className="w-8 h-8 text-[#00D4AA]" />
                            </div>
                            <div className="border-t border-gray-100 pt-4 mb-4">
                                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Balance</p>
                                <p className="text-2xl font-bold text-gray-900">TZS {Number(acc.balance || 0).toLocaleString()}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => viewTransactions(acc)} className="flex-1 px-3 py-2 text-xs font-medium text-[#00D4AA] bg-[#00D4AA]/10 rounded-lg hover:bg-[#00D4AA]/20 transition-colors">View Transactions</button>
                                <button onClick={() => { setSelectedAccount(acc); setShowTxForm(true); }} className="flex-1 px-3 py-2 text-xs font-medium text-white bg-[#00D4AA] rounded-lg hover:bg-[#00b894] transition-colors">Add Transaction</button>
                            </div>
                        </div>
                    ))}
                    {accounts.length === 0 && <div className="col-span-3 text-center py-12 text-gray-500 text-sm">No bank accounts found. Add your first bank account to get started.</div>}
                </div>
            )}

            {selectedAccount && !showTxForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Transactions - {selectedAccount.account_name}</h3>
                        <button onClick={() => setSelectedAccount(null)} className="text-sm text-gray-500 hover:text-gray-700">Close</button>
                    </div>
                    {txLoading ? <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div> : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Date</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Description</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Reference</th>
                                    <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Debit</th>
                                    <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Credit</th>
                                    <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Balance</th>
                                </tr></thead>
                                <tbody>
                                    {transactions.length === 0 ? <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">No transactions</td></tr> : transactions.map(tx => (
                                        <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm text-gray-600">{new Date(tx.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-3 text-sm text-gray-900">{tx.description}</td>
                                            <td className="px-6 py-3 text-sm text-gray-500">{tx.reference || '-'}</td>
                                            <td className="px-6 py-3 text-sm text-right font-semibold text-red-600">{Number(tx.debit) > 0 ? `TZS ${Number(tx.debit).toLocaleString()}` : '-'}</td>
                                            <td className="px-6 py-3 text-sm text-right font-semibold text-green-600">{Number(tx.credit) > 0 ? `TZS ${Number(tx.credit).toLocaleString()}` : '-'}</td>
                                            <td className="px-6 py-3 text-sm text-right font-semibold text-gray-900">TZS {Number(tx.balance_after).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
