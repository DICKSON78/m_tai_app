import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Warehouse as WarehouseIcon, Plus, Pencil, Trash2, X, MapPin, ArrowRightLeft, Package, ChevronDown, ChevronRight } from 'lucide-react';

const STATUS_COLORS = { active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-500', pending: 'bg-yellow-100 text-yellow-700', in_transit: 'bg-blue-100 text-blue-700', received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-600' };
const TEMP_COLORS = { ambient: 'bg-gray-100 text-gray-600', cold: 'bg-blue-100 text-blue-700', frozen: 'bg-indigo-100 text-indigo-700' };

export default function WarehousePage() {
    const [tab, setTab] = useState('warehouses');
    const [summary, setSummary] = useState({});
    const [warehouses, setWarehouses] = useState([]);
    const [transfers, setTransfers] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('');
    const [expandedWh, setExpandedWh] = useState(null);
    const [whDetail, setWhDetail] = useState(null);
    const [selectedBusiness, setSelectedBusiness] = useState('');

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch(() => {});
    }, []);

    const fetchSummary = useCallback(async () => { try { const r = await api.get('/owner/warehouses/summary'); setSummary(r.data); } catch {} }, []);
    const fetchProducts = useCallback(async () => {
        if (!selectedBusiness) return;
        try { const r = await api.get(`/owner/businesses/${selectedBusiness}/products`, { params: { per_page: 200 } }); setProducts(r.data.data || r.data || []); } catch { setProducts([]); }
    }, [selectedBusiness]);

    const fetchWarehouses = useCallback(async () => {
        setLoading(true);
        try { const p = {}; if (filter) p.status = filter; const r = await api.get('/owner/warehouses/', { params: p }); setWarehouses(r.data.data || []); } catch { setWarehouses([]); } finally { setLoading(false); }
    }, [filter]);

    const fetchTransfers = useCallback(async () => {
        setLoading(true);
        try { const p = {}; if (filter) p.status = filter; const r = await api.get('/owner/warehouses/transfers/list', { params: p }); setTransfers(r.data.data || []); } catch { setTransfers([]); } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { fetchSummary(); fetchProducts(); }, [fetchSummary, fetchProducts, selectedBusiness]);
    useEffect(() => { setFilter(''); }, [tab]);
    useEffect(() => { if (tab === 'warehouses') fetchWarehouses(); else fetchTransfers(); }, [tab, fetchWarehouses, fetchTransfers]);

    const fetchDetail = async (id) => {
        try { const r = await api.get(`/owner/warehouses/${id}`); setWhDetail(r.data); } catch {}
    };

    const resetForm = () => { setForm({}); setEditing(null); };

    const openNew = () => {
        resetForm();
        if (tab === 'warehouses') setForm({ name: '', address: '', city: '', phone: '', manager_name: '', total_capacity: '' });
        else setForm({ product_id: '', from_warehouse_id: '', to_warehouse_id: '', quantity: '', transfer_date: new Date().toISOString().split('T')[0], notes: '' });
        setShowForm(true);
    };

    const openEdit = (item) => {
        setEditing(item);
        if (tab === 'warehouses') setForm({ name: item.name, address: item.address || '', city: item.city || '', phone: item.phone || '', manager_name: item.manager_name || '', total_capacity: item.total_capacity || '', status: item.status });
        else setForm({ ...item, transfer_date: item.transfer_date?.split('T')[0] || '', received_date: item.received_date?.split('T')[0] || '' });
        setShowForm(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = { ...form };
            if (!payload.total_capacity) delete payload.total_capacity;
            if (tab === 'warehouses') {
                ['city', 'phone', 'manager_name', 'address'].forEach(k => { if (!payload[k]) delete payload[k]; });
                if (editing) await api.put(`/owner/warehouses/${editing.id}`, payload);
                else await api.post('/owner/warehouses/', payload);
            } else {
                ['bill_of_material_id', 'notes', 'from_bin_location_id', 'to_bin_location_id'].forEach(k => { if (!payload[k]) delete payload[k]; });
                if (editing) { await api.put(`/owner/warehouses/transfers/${editing.id}`, payload); }
                else await api.post('/owner/warehouses/transfers', payload);
            }
            setShowForm(false); resetForm(); fetchSummary();
            if (tab === 'warehouses') fetchWarehouses(); else fetchTransfers();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
    };

    const handleDelete = async (item) => {
        if (!confirm('Delete this item?')) return;
        try {
            if (tab === 'warehouses') await api.delete(`/owner/warehouses/${item.id}`);
            else await api.delete(`/owner/warehouses/transfers/${item.id}`);
            fetchSummary(); if (tab === 'warehouses') fetchWarehouses(); else fetchTransfers();
        } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleTransferAction = async (transfer, action) => {
        try { await api.post(`/owner/warehouses/transfers/${transfer.id}/${action}`); fetchTransfers(); fetchSummary(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const addZone = async (warehouseId) => {
        const name = prompt('Zone name:');
        if (!name) return;
        try { await api.post(`/owner/warehouses/${warehouseId}/zones`, { name }); fetchDetail(warehouseId); fetchWarehouses(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const addBin = async (zoneId) => {
        const code = prompt('Bin code (e.g. A-01):');
        if (!code) return;
        try { await api.post(`/owner/warehouses/zones/${zoneId}/bins`, { code }); if (whDetail) fetchDetail(whDetail.id); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const fmt = (n) => new Intl.NumberFormat('en-TZ').format(n || 0);

    return (
        <div className="space-y-6">
            <PageHeader title="Warehouse Management" subtitle="Manage warehouses, zones, bin locations and transfers" icon={<WarehouseIcon size={20} />} />

            {/* Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: 'Warehouses', value: summary.total_warehouses, sub: `${summary.active_warehouses || 0} active` },
                  { label: 'Zones', value: summary.total_zones, sub: `${summary.total_bin_locations || 0} bins` },
                  { label: 'Products Stored', value: summary.total_products_stored, sub: 'unique SKUs' },
                  { label: 'Transfers', value: summary.total_transfers, sub: `${summary.pending_transfers || 0} pending` }
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
                {[['warehouses', 'Warehouses'], ['transfers', 'Transfers']].map(([k, l]) => (
                    <button key={k} onClick={() => setTab(k)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${tab === k ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{l}</button>
                ))}
            </div>

            <div className="flex gap-3 items-center">
                <button onClick={openNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New {tab === 'warehouses' ? 'Warehouse' : 'Transfer'}</button>
                <div className="flex gap-1">
                    {(tab === 'warehouses' ? ['', 'active', 'inactive'] : ['', 'pending', 'in_transit', 'received', 'cancelled']).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${filter === f ? 'bg-[#00D4AA] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#00D4AA]'}`}>{f || 'All'}</button>
                    ))}
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit' : 'New'} {tab === 'warehouses' ? 'Warehouse' : 'Transfer'}</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tab === 'warehouses' && (<>
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label><input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Address</label><input value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">City</label><input value={form.city || ''} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label><input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Manager</label><input value={form.manager_name || ''} onChange={e => setForm({ ...form, manager_name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Total Capacity</label><input type="number" min="0" value={form.total_capacity || ''} onChange={e => setForm({ ...form, total_capacity: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                {editing && <div><label className="text-sm font-medium text-gray-700 mb-1 block">Status</label><select value={form.status || 'active'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>}
                            </>)}
                            {tab === 'transfers' && (<>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Product *</label><select required value={form.product_id || ''} onChange={e => setForm({ ...form, product_id: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="">Select...</option>{products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Quantity *</label><input type="number" min="1" required value={form.quantity || ''} onChange={e => setForm({ ...form, quantity: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">From Warehouse</label><select value={form.from_warehouse_id || ''} onChange={e => setForm({ ...form, from_warehouse_id: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="">Select...</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">To Warehouse</label><select value={form.to_warehouse_id || ''} onChange={e => setForm({ ...form, to_warehouse_id: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20"><option value="">Select...</option>{warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Transfer Date *</label><input type="date" required value={form.transfer_date || ''} onChange={e => setForm({ ...form, transfer_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
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

            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : tab === 'warehouses' ? (
                <div className="space-y-3">
                    {warehouses.map(wh => (
                        <div key={wh.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50" onClick={() => { setExpandedWh(expandedWh === wh.id ? null : wh.id); if (expandedWh !== wh.id) fetchDetail(wh.id); }}>
                                <div className="flex items-center gap-3">
                                    {expandedWh === wh.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-900">{wh.name}</span>
                                            <span className="text-xs font-mono text-gray-400">{wh.code}</span>
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[wh.status]}`}>{wh.status}</span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-0.5">{wh.zones_count || 0} zones {wh.city && `| ${wh.city}`} {wh.manager_name && `| Mgr: ${wh.manager_name}`}</div>
                                    </div>
                                </div>
                                <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                                    <button onClick={() => addZone(wh.id)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg" title="Add Zone"><MapPin size={14} /></button>
                                    <button onClick={() => openEdit(wh)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(wh)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            {expandedWh === wh.id && whDetail && whDetail.id === wh.id && (
                                <div className="border-t border-gray-100 p-4 bg-gray-50/50">
                                    {!whDetail.zones?.length && <p className="text-sm text-gray-500 text-center py-4">No zones yet. Click the zone icon to add one.</p>}
                                    {whDetail.zones?.map(zone => (
                                        <div key={zone.id} className="ml-4 mb-3 bg-white rounded-xl border border-gray-100 p-3">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <MapPin size={14} className="text-gray-400" />
                                                    <span className="text-sm font-semibold text-gray-800">{zone.name}</span>
                                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TEMP_COLORS[zone.temperature] || ''}`}>{zone.temperature}</span>
                                                </div>
                                                <button onClick={() => addBin(zone.id)} className="text-xs font-medium text-[#00b894] hover:underline">+ Bin</button>
                                            </div>
                                            {zone.bin_locations?.length > 0 ? (
                                                <div className="grid grid-cols-3 md:grid-cols-6 gap-1.5">
                                                    {zone.bin_locations.map(bin => (
                                                        <div key={bin.id} className="bg-gray-50 rounded-lg p-2 text-center border border-gray-100">
                                                            <Package size={12} className="mx-auto text-gray-400 mb-0.5" />
                                                            <p className="text-xs font-mono font-bold text-gray-700">{bin.code}</p>
                                                            <p className="text-xs text-gray-500">{bin.quantity} units</p>
                                                            {bin.product && <p className="text-xs text-gray-400 truncate">{bin.product.name}</p>}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : <p className="text-xs text-gray-400 ml-6">No bin locations</p>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {!warehouses.length && <div className="text-center py-12 text-gray-500"><WarehouseIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-sm">No warehouses configured.</p></div>}
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead><tr className="border-b border-gray-100">
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Ref #</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Product</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">From</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">To</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Qty</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Date</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                            <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                        </tr></thead>
                        <tbody>
                            {transfers.map(t => (
                                <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3 text-sm font-mono text-gray-700">{t.reference_number}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{t.product?.name || '-'}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{t.from_warehouse?.name || '-'}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{t.to_warehouse?.name || '-'}</td>
                                    <td className="px-6 py-3 text-sm text-gray-700 font-medium">{t.quantity}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{t.transfer_date}</td>
                                    <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[t.status]}`}>{t.status?.replace('_', ' ')}</span></td>
                                    <td className="px-6 py-3"><div className="flex items-center justify-end gap-1">
                                        {t.status === 'pending' && <>
                                            <button onClick={() => handleTransferAction(t, 'confirm')} className="p-2 text-green-500 hover:bg-green-50 rounded-lg" title="Confirm Received">✓</button>
                                            <button onClick={() => handleTransferAction(t, 'cancel')} className="p-2 text-red-400 hover:bg-red-50 rounded-lg" title="Cancel">✕</button>
                                        </>}
                                        <button onClick={() => handleDelete(t)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                                    </div></td>
                                </tr>
                            ))}
                            {!transfers.length && <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-500 text-sm">No transfers found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
