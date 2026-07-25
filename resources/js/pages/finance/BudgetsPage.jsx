import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Target, Plus, Pencil, Trash2, X, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';

function fmt(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function ProgressBar({ spent, budget }) {
    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const overBudget = spent > budget;
    const color = overBudget ? '#EF4444' : pct > 80 ? '#F59E0B' : '#00D4AA';
    return (
        <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
        </div>
    );
}

export default function BudgetsPage() {
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingBudget, setEditingBudget] = useState(null);
    const [form, setForm] = useState({ name: '', account_id: '', budget_amount: '', period: 'monthly', start_date: '', end_date: '', notes: '' });
    const [coa, setCoa] = useState([]);
    const [saving, setSaving] = useState(false);

    const fetchBudgets = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/owner/finance/budgets'); setBudgets(res.data.data || res.data || []); } catch { setBudgets([]); } finally { setLoading(false); }
    }, []);

    const fetchCoa = useCallback(async () => {
        try { const res = await api.get('/owner/finance/accounts', { params: { per_page: 200 } }); setCoa(res.data.data || []); } catch { setCoa([]); }
    }, []);

    useEffect(() => { fetchBudgets(); fetchCoa(); }, [fetchBudgets, fetchCoa]);

    const resetForm = () => { setForm({ name: '', account_id: '', budget_amount: '', period: 'monthly', start_date: '', end_date: '', notes: '' }); setEditingBudget(null); };

    const openEdit = (budget) => {
        setEditingBudget(budget);
        setForm({
            name: budget.name || '',
            account_id: budget.account_id || '',
            budget_amount: budget.budget_amount || '',
            period: budget.period || 'monthly',
            start_date: budget.start_date || '',
            end_date: budget.end_date || '',
            notes: budget.notes || '',
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editingBudget) {
                await api.put(`/owner/finance/budgets/${editingBudget.id}`, form);
            } else {
                await api.post('/owner/finance/budgets', form);
            }
            setShowForm(false); resetForm(); fetchBudgets();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save budget'); } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this budget?')) return;
        try { await api.delete(`/owner/finance/budgets/${id}`); fetchBudgets(); } catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
    };

    const totalBudgeted = budgets.reduce((s, b) => s + Number(b.budget_amount || 0), 0);
    const totalSpent = budgets.reduce((s, b) => s + Number(b.spent || 0), 0);
    const overallPct = totalBudgeted > 0 ? ((totalSpent / totalBudgeted) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6">
            <PageHeader title="Budgets" subtitle="Plan and track your financial budgets" icon={<Target size={20} />}
                actions={<button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Budget</button>} />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Budgeted</p>
                    <p className="text-2xl font-bold text-gray-900">TZS {fmt(totalBudgeted)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-gray-900">TZS {fmt(totalSpent)}</p>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <p className="text-xs font-medium text-gray-500 uppercase mb-1">Overall Usage</p>
                    <p className={`text-2xl font-bold ${Number(overallPct) > 100 ? 'text-red-600' : 'text-gray-900'}`}>{overallPct}%</p>
                    <div className="mt-2"><ProgressBar spent={totalSpent} budget={totalBudgeted} /></div>
                </div>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{editingBudget ? 'Edit Budget' : 'New Budget'}</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Budget Name *</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Marketing Budget" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Chart of Account</label>
                                <select value={form.account_id} onChange={(e) => setForm({ ...form, account_id: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">
                                    <option value="">Select account (optional)</option>
                                    {coa.map(a => <option key={a.id} value={a.id}>{a.code} - {a.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Budget Amount (TZS) *</label>
                                <input type="number" min="0" step="0.01" required value={form.budget_amount} onChange={(e) => setForm({ ...form, budget_amount: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Period *</label>
                                <select value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">
                                    <option value="weekly">Weekly</option>
                                    <option value="monthly">Monthly</option>
                                    <option value="quarterly">Quarterly</option>
                                    <option value="yearly">Yearly</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date *</label>
                                <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label>
                                <textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : editingBudget ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {budgets.map(b => {
                        const spent = Number(b.spent || 0);
                        const budget = Number(b.budget_amount || 0);
                        const pct = budget > 0 ? ((spent / budget) * 100).toFixed(1) : 0;
                        const remaining = budget - spent;
                        const overBudget = spent > budget;
                        return (
                            <div key={b.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-base font-bold text-gray-900">{b.name}</h4>
                                            {overBudget ? <AlertTriangle size={14} className="text-red-500" /> : pct > 80 ? <AlertTriangle size={14} className="text-yellow-500" /> : <CheckCircle size={14} className="text-green-500" />}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5 capitalize">{b.period || 'monthly'} period</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button onClick={() => openEdit(b)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg transition-colors"><Pencil size={14} /></button>
                                        <button onClick={() => handleDelete(b.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between mb-2">
                                    <div>
                                        <p className="text-xs text-gray-500">Spent</p>
                                        <p className={`text-lg font-bold ${overBudget ? 'text-red-600' : 'text-gray-900'}`}>TZS {fmt(spent)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Budget</p>
                                        <p className="text-lg font-bold text-gray-900">TZS {fmt(budget)}</p>
                                    </div>
                                </div>
                                <ProgressBar spent={spent} budget={budget} />
                                <div className="flex justify-between mt-2">
                                    <span className={`text-xs font-semibold ${overBudget ? 'text-red-600' : 'text-gray-600'}`}>{pct}% used</span>
                                    <span className={`text-xs font-semibold ${remaining < 0 ? 'text-red-600' : 'text-green-600'}`}>{remaining < 0 ? `Over TZS ${fmt(Math.abs(remaining))}` : `TZS ${fmt(remaining)} remaining`}</span>
                                </div>
                                {b.start_date && <p className="text-xs text-gray-400 mt-2">{b.start_date}{b.end_date ? ` - ${b.end_date}` : ' - Ongoing'}</p>}
                            </div>
                        );
                    })}
                    {budgets.length === 0 && (
                        <div className="col-span-2 text-center py-12 text-gray-500">
                            <Target className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No budgets found. Create your first budget to start tracking.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
