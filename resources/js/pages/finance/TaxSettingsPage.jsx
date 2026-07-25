import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Receipt, Plus, Pencil, Trash2, X, ToggleLeft, ToggleRight } from 'lucide-react';

export default function TaxSettingsPage() {
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingRate, setEditingRate] = useState(null);
    const [form, setForm] = useState({ name: '', rate: '', type: 'percentage', is_active: true, description: '' });
    const [saving, setSaving] = useState(false);

    const fetchRates = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/owner/finance/tax-rates'); setRates(res.data.data || res.data || []); } catch { setRates([]); } finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchRates(); }, [fetchRates]);

    const resetForm = () => { setForm({ name: '', rate: '', type: 'percentage', is_active: true, description: '' }); setEditingRate(null); };

    const openEdit = (rate) => {
        setEditingRate(rate);
        setForm({
            name: rate.name || '',
            rate: rate.rate || '',
            type: rate.type || 'percentage',
            is_active: rate.is_active !== undefined ? rate.is_active : true,
            description: rate.description || '',
        });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editingRate) {
                await api.put(`/owner/finance/tax-rates/${editingRate.id}`, form);
            } else {
                await api.post('/owner/finance/tax-rates', form);
            }
            setShowForm(false); resetForm(); fetchRates();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save tax rate'); } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this tax rate?')) return;
        try { await api.delete(`/owner/finance/tax-rates/${id}`); fetchRates(); } catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
    };

    const handleToggleActive = async (rate) => {
        try {
            await api.put(`/owner/finance/tax-rates/${rate.id}`, { ...rate, is_active: !rate.is_active });
            fetchRates();
        } catch (err) { alert(err.response?.data?.message || 'Failed to toggle'); }
    };

    const activeRates = rates.filter(r => r.is_active);
    const inactiveRates = rates.filter(r => !r.is_active);

    return (
        <div className="space-y-6">
            <PageHeader title="Tax Settings" subtitle="Manage tax rates for invoices and transactions" icon={<Receipt size={20} />}
                actions={<button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Tax Rate</button>} />

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{editingRate ? 'Edit Tax Rate' : 'New Tax Rate'}</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Tax Name *</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. VAT, GST, Sales Tax" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Rate *</label>
                                <input type="number" min="0" step="0.01" required value={form.rate} onChange={(e) => setForm({ ...form, rate: e.target.value })} placeholder="e.g. 18" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">
                                    <option value="percentage">Percentage (%)</option>
                                    <option value="fixed">Fixed Amount</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Status</label>
                                <button type="button" onClick={() => setForm({ ...form, is_active: !form.is_active })} className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm border rounded-lg transition-colors ${form.is_active ? 'border-green-200 bg-green-50 text-green-700' : 'border-gray-200 bg-gray-50 text-gray-500'}`}>
                                    {form.is_active ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                    {form.is_active ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Optional description" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : editingRate ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : rates.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Receipt className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No tax rates configured. Add your first tax rate to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {activeRates.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Active Rates ({activeRates.length})</h3>
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Rate</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Type</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Description</th>
                                            <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {activeRates.map(rate => (
                                            <tr key={rate.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                        <span className="text-sm font-semibold text-gray-900">{rate.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#00D4AA]/10 text-[#00b894]">
                                                        {rate.type === 'percentage' ? `${rate.rate}%` : `TZS ${Number(rate.rate).toLocaleString()}`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-600 capitalize">{rate.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                                                <td className="px-6 py-3 text-sm text-gray-500 max-w-xs truncate">{rate.description || '-'}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => handleToggleActive(rate)} className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg transition-colors" title="Deactivate">
                                                            <ToggleRight size={16} />
                                                        </button>
                                                        <button onClick={() => openEdit(rate)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg transition-colors"><Pencil size={16} /></button>
                                                        <button onClick={() => handleDelete(rate.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {inactiveRates.length > 0 && (
                        <div>
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 px-1">Inactive Rates ({inactiveRates.length})</h3>
                            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden opacity-60">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Rate</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Type</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Description</th>
                                            <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {inactiveRates.map(rate => (
                                            <tr key={rate.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                                                        <span className="text-sm font-medium text-gray-500 line-through">{rate.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-500">
                                                        {rate.type === 'percentage' ? `${rate.rate}%` : `TZS ${Number(rate.rate).toLocaleString()}`}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-400 capitalize">{rate.type === 'percentage' ? 'Percentage' : 'Fixed Amount'}</td>
                                                <td className="px-6 py-3 text-sm text-gray-400 max-w-xs truncate">{rate.description || '-'}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button onClick={() => handleToggleActive(rate)} className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Activate">
                                                            <ToggleLeft size={16} />
                                                        </button>
                                                        <button onClick={() => openEdit(rate)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg transition-colors"><Pencil size={16} /></button>
                                                        <button onClick={() => handleDelete(rate.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
