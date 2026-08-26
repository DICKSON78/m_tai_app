import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Factory, Plus, Pencil, Trash2, X, Settings, Play, Pause, CheckCircle, AlertTriangle } from 'lucide-react';

const STATUS_COLORS = { draft: 'bg-gray-100 text-gray-600', active: 'bg-green-100 text-green-700', archived: 'bg-gray-100 text-gray-400', planned: 'bg-blue-100 text-blue-700', in_progress: 'bg-yellow-100 text-yellow-700', on_hold: 'bg-orange-100 text-orange-700', completed: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' };

export default function ManufacturingPage() {
    const [tab, setTab] = useState('boms');
    const [summary, setSummary] = useState({});
    const [boms, setBoms] = useState([]);
    const [workOrders, setWorkOrders] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});
    const [items, setItems] = useState([]);
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('');
    const [selectedBusiness, setSelectedBusiness] = useState('');

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch(() => {});
    }, []);

    const fetchSummary = useCallback(async () => { try { const r = await api.get('/owner/manufacturing/summary'); setSummary(r.data); } catch {} }, []);
    const fetchProducts = useCallback(async () => {
        if (!selectedBusiness) return;
        try { const r = await api.get(`/owner/businesses/${selectedBusiness}/products`, { params: { per_page: 200 } }); setProducts(r.data.data || r.data || []); } catch { setProducts([]); }
    }, [selectedBusiness]);

    const fetchBoms = useCallback(async () => {
        setLoading(true);
        try { const p = {}; if (filter) p.status = filter; const r = await api.get('/owner/manufacturing/boms', { params: p }); setBoms(r.data.data || []); } catch { setBoms([]); } finally { setLoading(false); }
    }, [filter]);

    const fetchWorkOrders = useCallback(async () => {
        setLoading(true);
        try { const p = {}; if (filter) p.status = filter; const r = await api.get('/owner/manufacturing/work-orders', { params: p }); setWorkOrders(r.data.data || []); } catch { setWorkOrders([]); } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { fetchSummary(); fetchProducts(); }, [fetchSummary, fetchProducts, selectedBusiness]);
    useEffect(() => { setFilter(''); }, [tab]);
    useEffect(() => { if (tab === 'boms') fetchBoms(); else fetchWorkOrders(); }, [tab, fetchBoms, fetchWorkOrders]);

    const resetForm = () => { setForm({}); setItems([]); setEditing(null); };

    const openNew = () => {
        resetForm();
        if (tab === 'boms') setForm({ name: '', product_id: '', description: '', estimated_cost: '', quantity_per_build: '1' });
        else setForm({ product_name: '', bill_of_material_id: '', quantity_planned: '1', estimated_cost: '', planned_start: '', planned_end: '', notes: '' });
        setShowForm(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        if (tab === 'boms') {
            setForm({ name: item.name, product_id: item.product_id, description: item.description || '', estimated_cost: item.estimated_cost || '', quantity_per_build: item.quantity_per_build || 1 });
            setItems(item.items?.map(i => ({ product_id: i.product_id, quantity: i.quantity, unit_cost: i.unit_cost || '', notes: i.notes || '' })) || []);
        } else {
            setForm({ product_name: item.product_name, bill_of_material_id: item.bill_of_material_id || '', quantity_planned: item.quantity_planned, estimated_cost: item.estimated_cost || '', planned_start: item.planned_start?.split('T')[0] || '', planned_end: item.planned_end?.split('T')[0] || '', notes: item.notes || '', status: item.status });
        }
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = { ...form };
            if (!payload.estimated_cost) delete payload.estimated_cost;
            if (tab === 'boms') {
                if (items.length > 0) payload.items = items.filter(i => i.product_id);
                if (!payload.quantity_per_build) payload.quantity_per_build = 1;
            }
            if (tab === 'work-orders') {
                ['planned_start', 'planned_end'].forEach(k => { if (!payload[k]) delete payload[k]; });
                if (!payload.bill_of_material_id) delete payload.bill_of_material_id;
            }
            if (editing) {
                await api.put(`/owner/manufacturing/${tab}/${editing.id}`, payload);
            } else {
                await api.post(`/owner/manufacturing/${tab}`, payload);
            }
            setShowForm(false); resetForm(); fetchSummary();
            if (tab === 'boms') fetchBoms(); else fetchWorkOrders();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
    };

    const handleDelete = async (item) => {
        if (!confirm('Delete this item?')) return;
        try { await api.delete(`/owner/manufacturing/${tab}/${item.id}`); fetchSummary(); if (tab === 'boms') fetchBoms(); else fetchWorkOrders(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleStatusChange = async (item, status) => {
        try { await api.put(`/owner/manufacturing/${tab}/${item.id}`, { status }); if (tab === 'boms') fetchBoms(); else fetchWorkOrders(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const fmt = (n) => new Intl.NumberFormat('en-TZ').format(n || 0);

    return (
        <div className="space-y-6">
            <PageHeader title="Manufacturing" subtitle="Manage BOMs and work orders" icon={<Factory size={20} />} />

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: 'BOMs', value: summary.total_boms, sub: `${summary.active_boms || 0} active` },
                  { label: 'Work Orders', value: summary.total_work_orders, sub: `${summary.planned_orders || 0} planned` },
                  { label: 'In Progress', value: summary.in_progress_orders, sub: 'active now' },
                  { label: 'Completed', value: summary.completed_orders, sub: `${fmt(summary.total_produced)} produced` }
                ].map((c, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <p className="text-xs text-gray-500">{c.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{c.value || 0}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {[['boms', 'Bill of Materials'], ['work-orders', 'Work Orders']].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === k ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{l}</button>
                ))}
            </div>

            <div className="flex gap-3 items-center">
                <button onClick={openNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New {tab === 'boms' ? 'BOM' : 'Work Order'}</button>
                <div className="flex gap-1">
                    {(tab === 'boms' ? ['', 'draft', 'active', 'archived'] : ['', 'planned', 'in_progress', 'on_hold', 'completed', 'cancelled']).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${filter === f ? 'bg-[#00D4AA] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#00D4AA]'}`}>{f || 'All'}</button>
                    ))}
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit' : 'New'} {tab === 'boms' ? 'BOM' : 'Work Order'}</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tab === 'boms' && (<>
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">BOM Name *</label><input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Output Product *</label><select required value={form.product_id || ''} onChange={e => setForm({ ...form, product_id: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="">Select...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Qty Per Build</label><input type="number" min="1" value={form.quantity_per_build || '1'} onChange={e => setForm({ ...form, quantity_per_build: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Est. Cost (TZS)</label><input type="number" min="0" value={form.estimated_cost || ''} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Description</label><textarea rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div className="md:col-span-2">
                                    <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium text-gray-700">Materials</label><button type="button" onClick={() => setItems([...items, { product_id: '', quantity: 1, unit_cost: '', notes: '' }])} className="text-xs font-medium text-[#00b894] hover:underline">+ Add Item</button></div>
                                    {items.map((item, idx) => (
                                        <div key={idx} className="grid grid-cols-5 gap-2 mb-2 items-center">
                                            <select value={item.product_id} onChange={e => { const n = [...items]; n[idx].product_id = e.target.value; setItems(n); }} className="col-span-2 px-2 py-2 text-xs border border-gray-200 rounded-lg"><option value="">Material...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                                            <input type="number" step="any" min="0.001" value={item.quantity} onChange={e => { const n = [...items]; n[idx].quantity = e.target.value; setItems(n); }} className="px-2 py-2 text-xs border border-gray-200 rounded-lg" placeholder="Qty" />
                                            <input type="number" min="0" value={item.unit_cost} onChange={e => { const n = [...items]; n[idx].unit_cost = e.target.value; setItems(n); }} className="px-2 py-2 text-xs border border-gray-200 rounded-lg" placeholder="Unit cost" />
                                            <button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                                        </div>
                                    ))}
                                </div>
                            </>)}
                            {tab === 'work-orders' && (<>
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Product Name *</label><input required value={form.product_name || ''} onChange={e => setForm({ ...form, product_name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Quantity *</label><input type="number" min="1" required value={form.quantity_planned || ''} onChange={e => setForm({ ...form, quantity_planned: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Est. Cost (TZS)</label><input type="number" min="0" value={form.estimated_cost || ''} onChange={e => setForm({ ...form, estimated_cost: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Planned Start</label><input type="date" value={form.planned_start || ''} onChange={e => setForm({ ...form, planned_start: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Planned End</label><input type="date" value={form.planned_end || ''} onChange={e => setForm({ ...form, planned_end: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                {editing && <div><label className="text-sm font-medium text-gray-700 mb-1 block">Status</label><select value={form.status || 'planned'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">{['draft','planned','in_progress','on_hold','completed','cancelled'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>}
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label><textarea rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            </>)}
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead><tr className="border-b border-gray-100">
                            {tab === 'boms' ? (<>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Code</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Product</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Items</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Est. Cost</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                            </>) : (<>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Order #</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Product</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Planned</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Completed</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                            </>)}
                            <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                        </tr></thead>
                        <tbody>
                            {tab === 'boms' && boms.map(b => (
                                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3"><span className="text-sm font-semibold text-gray-900">{b.name}</span></td>
                                    <td className="px-6 py-3 text-xs font-mono text-gray-500">{b.code}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{b.product?.name || '-'}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{b.items_count || 0}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-gray-700">TZS {fmt(b.estimated_cost)}</td>
                                    <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[b.status]}`}>{b.status}</span></td>
                                    <td className="px-6 py-3"><div className="flex items-center justify-end gap-1">
                                        {b.status === 'draft' && <button onClick={() => handleStatusChange(b, 'active')} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Activate"><Play size={14} /></button>}
                                        {b.status === 'active' && <button onClick={() => handleStatusChange(b, 'archived')} className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg" title="Archive"><Pause size={14} /></button>}
                                        <button onClick={() => openEdit(b)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={14} /></button>
                                        <button onClick={() => handleDelete(b)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                                    </div></td>
                                </tr>
                            ))}
                            {tab === 'work-orders' && workOrders.map(w => (
                                <tr key={w.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3"><span className="text-sm font-semibold text-gray-900">{w.order_number}</span></td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{w.product_name}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{w.quantity_planned}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{w.quantity_completed}/{w.quantity_planned}</td>
                                    <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[w.status]}`}>{w.status?.replace('_', ' ')}</span></td>
                                    <td className="px-6 py-3"><div className="flex items-center justify-end gap-1">
                                        {w.status === 'planned' && <button onClick={() => handleStatusChange(w, 'in_progress')} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Start"><Play size={14} /></button>}
                                        {w.status === 'in_progress' && <button onClick={() => handleStatusChange(w, 'completed')} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg" title="Complete"><CheckCircle size={14} /></button>}
                                        <button onClick={() => openEdit(w)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={14} /></button>
                                        <button onClick={() => handleDelete(w)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                                    </div></td>
                                </tr>
                            ))}
                            {((tab === 'boms' && !boms.length) || (tab === 'work-orders' && !workOrders.length)) && (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm">No {tab === 'boms' ? 'BOMs' : 'work orders'} found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
