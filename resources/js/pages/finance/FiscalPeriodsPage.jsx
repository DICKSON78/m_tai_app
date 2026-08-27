import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Calendar, Plus, Pencil, Trash2, X, Lock, Unlock, ChevronDown } from 'lucide-react';

export default function FiscalPeriodsPage() {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', start_date: '', end_date: '' });
    const [saving, setSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');
    const [detailPeriod, setDetailPeriod] = useState(null);

    const fetchPeriods = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/owner/finance/fiscal-periods', { params });
            setPeriods(res.data.data || res.data || []);
        } catch (error) { console.error('Failed to fetch fiscal periods:', error); setPeriods([]); } finally { setLoading(false); }
    }, [statusFilter]);

    useEffect(() => { fetchPeriods(); }, [fetchPeriods]);

    const resetForm = () => { setForm({ name: '', start_date: '', end_date: '' }); setEditing(null); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            if (editing) {
                await api.put(`/owner/finance/fiscal-periods/${editing.id}`, form);
            } else {
                await api.post('/owner/finance/fiscal-periods', form);
            }
            setShowForm(false); resetForm(); fetchPeriods();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
    };

    const handleClose = async (period) => {
        if (!confirm(`Close period "${period.name}"? This will generate closing entries and cannot be undone.`)) return;
        try {
            await api.post(`/owner/finance/fiscal-periods/${period.id}/close`);
            fetchPeriods();
            if (detailPeriod?.id === period.id) fetchDetail(period.id);
        } catch (err) { alert(err.response?.data?.message || 'Failed to close'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this period?')) return;
        try { await api.delete(`/owner/finance/fiscal-periods/${id}`); fetchPeriods(); } catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
    };

    const fetchDetail = async (id) => {
        try {
            const res = await api.get(`/owner/finance/fiscal-periods/${id}`);
            setDetailPeriod(res.data);
        } catch (error) { console.error('Failed to fetch fiscal period detail:', error); }
    };

    const openEdit = (p) => {
        setEditing(p);
        setForm({ name: p.name || '', start_date: p.start_date?.split('T')[0] || '', end_date: p.end_date?.split('T')[0] || '' });
        setShowForm(true);
    };

    const fmt = (n) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 2 }).format(n || 0);

    const statusColor = (s) => {
        const m = { open: 'bg-green-100 text-green-700', closing: 'bg-yellow-100 text-yellow-700', closed: 'bg-gray-100 text-gray-500' };
        return m[s] || 'bg-gray-100 text-gray-500';
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Fiscal Periods" subtitle="Manage accounting periods and close books" icon={<Calendar size={20} />}
                actions={<button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Period</button>} />

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Period' : 'New Fiscal Period'}</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Period Name *</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. FY 2026, Q1 2026" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date *</label>
                                <input type="date" required value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">End Date *</label>
                                <input type="date" required value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {['', 'open', 'closing', 'closed'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-[#00D4AA] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#00D4AA]'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : periods.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No fiscal periods configured.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Start Date</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">End Date</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {periods.map(p => (
                                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3">
                                        <button onClick={() => fetchDetail(p.id)} className="text-sm font-semibold text-gray-900 hover:text-[#00b894]">{p.name}</button>
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{p.start_date ? new Date(p.start_date).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{p.end_date ? new Date(p.end_date).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span></td>
                                    <td className="px-6 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            {p.status === 'open' && (
                                                <button onClick={() => handleClose(p)} className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-lg" title="Close Period"><Lock size={16} /></button>
                                            )}
                                            {p.status !== 'closed' && (
                                                <>
                                                    <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={16} /></button>
                                                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                                </>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Detail modal */}
            {detailPeriod && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16" onClick={() => setDetailPeriod(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">{detailPeriod.name}</h2>
                                <p className="text-sm text-gray-500 mt-1">{detailPeriod.start_date?.split('T')[0]} to {detailPeriod.end_date?.split('T')[0]}</p>
                            </div>
                            <button onClick={() => setDetailPeriod(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColor(detailPeriod.status)}`}>{detailPeriod.status}</span>
                                {detailPeriod.closer && <span className="text-sm text-gray-500">Closed by: {detailPeriod.closer?.name}</span>}
                            </div>
                            {detailPeriod.journal_entries?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Recent Journal Entries</h4>
                                    <div className="bg-gray-50 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-gray-200">
                                                <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Date</th>
                                                <th className="text-left px-4 py-2 font-medium text-gray-500 text-xs">Description</th>
                                                <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Debit</th>
                                                <th className="text-right px-4 py-2 font-medium text-gray-500 text-xs">Credit</th>
                                            </tr></thead>
                                            <tbody>
                                                {detailPeriod.journal_entries.map(je => (
                                                    <tr key={je.id} className="border-b border-gray-100">
                                                        <td className="px-4 py-2 text-gray-600">{je.date}</td>
                                                        <td className="px-4 py-2 text-gray-900 font-medium">{je.description}</td>
                                                        <td className="px-4 py-2 text-right text-gray-600">{fmt(je.total_debit)}</td>
                                                        <td className="px-4 py-2 text-right text-gray-600">{fmt(je.total_credit)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
