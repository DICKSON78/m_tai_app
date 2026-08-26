import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import Pagination from '../../components/Pagination';
import { Package, Plus, Search, Eye, CheckCircle, X, Trash2 } from 'lucide-react';

const STATUS_CLASSES = {
  draft: 'bg-gray-100 text-gray-600',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const INSPECTION_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-700',
  passed: 'bg-green-100 text-green-700',
  passed_with_notes: 'bg-blue-100 text-blue-700',
  failed: 'bg-red-100 text-red-700',
};

const fmtTZS = new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 });

export default function PurchaseReceptionsPage() {
  const [receptions, setReceptions] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [summary, setSummary] = useState({});

  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    purchase_order_id: '', reception_date: new Date().toISOString().split('T')[0], notes: '',
  });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [items, setItems] = useState([]);
  const [itemsLoading, setItemsLoading] = useState(false);

  const [showDetail, setShowDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchReceptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/owner/purchases/receptions', { params });
      setReceptions(res.data.data || []);
      setCurrentPage(res.data.current_page || 1);
      setLastPage(res.data.last_page || 1);
    } catch (error) { console.error('Failed to fetch receptions:', error); setReceptions([]); } finally { setLoading(false); }
  }, [search, statusFilter]);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/owner/purchases/orders', { params: { per_page: 100, status: 'confirmed' } });
      setOrders(res.data.data || []);
    } catch (error) { console.error('Failed to fetch purchase orders:', error); setOrders([]); }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/owner/purchases/receptions/summary');
      setSummary(res.data);
    } catch (error) { console.error('Failed to fetch reception summary:', error); }
  }, []);

  useEffect(() => { fetchReceptions(); fetchSummary(); }, [fetchReceptions, fetchSummary]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  const resetForm = () => {
    setForm({ purchase_order_id: '', reception_date: new Date().toISOString().split('T')[0], notes: '' });
    setSelectedOrder(null);
    setItems([]);
  };

  const handleSelectPO = async (poId) => {
    setForm(f => ({ ...f, purchase_order_id: poId }));
    setSelectedOrder(null);
    setItems([]);
    if (!poId) return;
    setItemsLoading(true);
    try {
      const res = await api.get(`/owner/purchases/orders/${poId}`);
      const order = res.data;
      setSelectedOrder(order);
      setItems((order.items || []).map(it => {
        const outstanding = Math.max(0, Number(it.quantity || 0) - Number(it.received_quantity || 0));
        return {
          purchase_order_item_id: it.id,
          product_id: it.product?.id || it.product_id || '',
          received_quantity: outstanding,
          accepted_quantity: outstanding,
          rejected_quantity: 0,
          inspection_status: 'pending',
          rejection_reason: '',
          batch_number: '',
          expiry_date: '',
          warehouse_location: '',
        };
      }));
    } catch (error) { console.error('Failed to fetch PO details:', error); setItems([]); } finally { setItemsLoading(false); }
  };

  const updateItem = (i, field, val) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, [field]: val } : it));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = items.filter(it => Number(it.received_quantity) > 0);
    if (!filled.length) return alert('Enter received quantities for at least one item');
    setSaving(true);
    try {
      await api.post('/owner/purchases/receptions', {
        purchase_order_id: form.purchase_order_id,
        reception_date: form.reception_date,
        notes: form.notes,
        items: filled.map(it => ({
          ...it,
          received_quantity: Number(it.received_quantity),
          accepted_quantity: Number(it.accepted_quantity || 0),
          rejected_quantity: Number(it.rejected_quantity || 0),
        })),
      });
      setShowForm(false); resetForm(); fetchReceptions(); fetchSummary();
    } catch (err) { alert(err.response?.data?.message || 'Failed to record reception'); }
    finally { setSaving(false); }
  };

  const handleConfirm = async (reception) => {
    if (!confirm('Confirm this reception? Stock will be updated.')) return;
    try { await api.post(`/owner/purchases/receptions/${reception.id}/confirm`); fetchReceptions(); fetchSummary(); if (showDetail?.id === reception.id) viewDetail(reception); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (reception) => {
    if (!confirm('Delete this draft reception?')) return;
    try { await api.delete(`/owner/purchases/receptions/${reception.id}`); fetchReceptions(); fetchSummary(); if (showDetail?.id === reception.id) setShowDetail(null); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const viewDetail = async (reception) => {
    setDetailLoading(true);
    setShowDetail({ id: reception.id });
    try { const res = await api.get(`/owner/purchases/receptions/${reception.id}`); setShowDetail(res.data); }
    catch { setShowDetail(null); console.error('Failed to load reception detail'); }
    finally { setDetailLoading(false); }
  };

  const itemQty = (r, key) => r[key] ?? r[`total_${key}`]
    ?? (r.items || []).reduce((s, i) => s + Number(i[key] || 0), 0);

  const fmt = (n) => fmtTZS.format(n || 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Receptions" subtitle="Record goods received against purchase orders (GRNs)" icon={Package}
        actions={<button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> New Reception
        </button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Receptions', value: summary.total ?? summary.total_receptions ?? receptions.length, color: 'text-gray-900' },
          { label: 'Draft', value: summary.draft ?? receptions.filter(r => r.status === 'draft').length, color: 'text-gray-600' },
          { label: 'Confirmed', value: summary.confirmed ?? receptions.filter(r => r.status === 'confirmed').length, color: 'text-green-600' },
          { label: 'Total Received', value: fmt(summary.total_received ?? summary.total_received_value ?? 0), color: 'text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-5xl mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Record Goods Received</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Purchase Order *</label>
                  <select required value={form.purchase_order_id} onChange={e => handleSelectPO(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="">Select purchase order</option>
                    {orders.map(o => <option key={o.id} value={o.id}>{o.po_number} - {o.supplier?.name}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Reception Date *</label>
                  <input type="date" required value={form.reception_date} onChange={e => setForm({...form, reception_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input type="text" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>

              {form.purchase_order_id && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">Received Items</h4>
                    {selectedOrder && <span className="text-xs text-gray-400">Ordered: {selectedOrder.po_number} | Supplier: {selectedOrder.supplier?.name}</span>}
                  </div>
                  {itemsLoading ? (
                    <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#00D4AA]" /></div>
                  ) : items.length === 0 ? (
                    <div className="text-center py-10 text-gray-500"><Package size={36} className="mx-auto mb-3 text-gray-300" /><p className="text-sm">No items on this purchase order</p></div>
                  ) : (
                    <div className="space-y-3">
                      <div className="hidden md:grid grid-cols-12 gap-2 px-3 text-[10px] font-medium text-gray-500 uppercase tracking-wide">
                        <div className="col-span-3">Product</div>
                        <div className="col-span-1">Ordered</div>
                        <div className="col-span-1">Received</div>
                        <div className="col-span-1">Accepted</div>
                        <div className="col-span-1">Rejected</div>
                        <div className="col-span-2">Inspection</div>
                        <div className="col-span-2">Batch</div>
                        <div className="col-span-1">Expiry</div>
                      </div>
                      {items.map((item, i) => {
                        const orderItem = selectedOrder?.items?.find(oi => oi.id === item.purchase_order_item_id);
                        const product = orderItem?.product;
                        return (
                          <div key={i} className="grid grid-cols-2 md:grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-xl">
                            <div className="col-span-2 md:col-span-3">
                              <label className="block md:hidden text-[10px] text-gray-500 mb-1">Product</label>
                              <p className="text-xs font-medium text-gray-900 truncate" title={product?.name}>{product?.name || `Item #${item.purchase_order_item_id}`}</p>
                            </div>
                            <div className="md:col-span-1">
                              <label className="block md:hidden text-[10px] text-gray-500 mb-1">Ordered</label>
                              <p className="text-xs text-gray-600 py-1.5">{Number(orderItem?.quantity || 0)}</p>
                            </div>
                            <div className="md:col-span-1">
                              <label className="block md:hidden text-[10px] text-gray-500 mb-1">Received *</label>
                              <input type="number" min="0" step="0.01" value={item.received_quantity} onChange={e => updateItem(i, 'received_quantity', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]" />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block md:hidden text-[10px] text-gray-500 mb-1">Accepted</label>
                              <input type="number" min="0" step="0.01" value={item.accepted_quantity} onChange={e => updateItem(i, 'accepted_quantity', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]" />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block md:hidden text-[10px] text-gray-500 mb-1">Rejected</label>
                              <input type="number" min="0" step="0.01" value={item.rejected_quantity} onChange={e => updateItem(i, 'rejected_quantity', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]" />
                            </div>
                            <div className="md:col-span-2">
                              <label className="block md:hidden text-[10px] text-gray-500 mb-1">Inspection</label>
                              <select value={item.inspection_status} onChange={e => updateItem(i, 'inspection_status', e.target.value)}
                                className={`w-full px-2 py-1.5 border rounded-lg text-xs ${item.inspection_status === 'failed' ? 'border-red-200' : 'focus:ring-2 focus:ring-[#00D4AA]'}`}>
                                <option value="pending">Pending</option>
                                <option value="passed">Passed</option>
                                <option value="passed_with_notes">Passed w/ Notes</option>
                                <option value="failed">Failed</option>
                              </select>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block md:hidden text-[10px] text-gray-500 mb-1">Batch #</label>
                              <input type="text" placeholder="Batch #" value={item.batch_number} onChange={e => updateItem(i, 'batch_number', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]" />
                            </div>
                            <div className="md:col-span-1">
                              <label className="block md:hidden text-[10px] text-gray-500 mb-1">Expiry</label>
                              <input type="date" value={item.expiry_date} onChange={e => updateItem(i, 'expiry_date', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]" />
                            </div>
                            {(item.inspection_status === 'failed' || item.inspection_status === 'passed_with_notes') && (
                              <div className="col-span-2 md:col-span-8">
                                <label className="block text-[10px] text-gray-500 mb-1">Rejection Reason / Inspection Notes</label>
                                <input type="text" placeholder="Reason for rejection..." value={item.rejection_reason} onChange={e => updateItem(i, 'rejection_reason', e.target.value)}
                                  className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]" />
                              </div>
                            )}
                            <div className="col-span-2 md:col-span-4">
                              <label className="block text-[10px] text-gray-500 mb-1">Warehouse Location</label>
                              <input type="text" placeholder="e.g. A1-Shelf-3" value={item.warehouse_location} onChange={e => updateItem(i, 'warehouse_location', e.target.value)}
                                className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={saving || itemsLoading || !form.purchase_order_id}
                  className="px-6 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50">
                  {saving ? 'Recording...' : 'Record Reception'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 mb-20 shadow-2xl">
            {detailLoading ? (
              <div className="flex items-center justify-center py-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
            ) : (
              <>
                <div className="flex items-center justify-between px-6 py-4 border-b">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{showDetail.grn_number || showDetail.reception_number}</h3>
                    <p className="text-xs text-gray-500">{showDetail.purchase_order?.po_number} · {showDetail.supplier?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {showDetail.status === 'draft' && (
                      <>
                        <button onClick={() => handleConfirm(showDetail)} className="px-3 py-1.5 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-lg text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Confirm</button>
                        <button onClick={() => handleDelete(showDetail)} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                      </>
                    )}
                    <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div><p className="text-gray-500">Status</p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[showDetail.status]}`}>{showDetail.status}</span></div>
                    <div><p className="text-gray-500">Reception Date</p><p className="font-medium">{showDetail.reception_date}</p></div>
                    <div><p className="text-gray-500">Confirmed At</p><p className="font-medium">{showDetail.confirmed_at || '-'}</p></div>
                    <div><p className="text-gray-500">Recorded By</p><p className="font-medium">{showDetail.recorded_by?.name || showDetail.user?.name || '-'}</p></div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b"><th className="text-left px-4 py-2 font-medium text-gray-500">Product</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500">Received</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500">Accepted</th>
                        <th className="text-right px-4 py-2 font-medium text-gray-500">Rejected</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Inspection</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Batch</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Expiry</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-500">Location</th></tr></thead>
                      <tbody className="divide-y divide-gray-50">
                        {showDetail.items?.map(item => (
                          <tr key={item.id}>
                            <td className="px-4 py-2">{item.product?.name || item.description}</td>
                            <td className="px-4 py-2 text-right">{item.received_quantity}</td>
                            <td className="px-4 py-2 text-right">{item.accepted_quantity}</td>
                            <td className="px-4 py-2 text-right text-red-600">{item.rejected_quantity || '-'}</td>
                            <td className="px-4 py-2"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${INSPECTION_CLASSES[item.inspection_status] || 'bg-gray-100 text-gray-600'}`}>{item.inspection_status?.replace(/_/g, ' ')}</span>
                              {item.rejection_reason && <p className="text-[10px] text-gray-400 mt-0.5">{item.rejection_reason}</p>}</td>
                            <td className="px-4 py-2 text-gray-600">{item.batch_number || '-'}</td>
                            <td className="px-4 py-2 text-gray-600">{item.expiry_date || '-'}</td>
                            <td className="px-4 py-2 text-gray-600">{item.warehouse_location || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {showDetail.notes && (
                    <div><p className="text-xs text-gray-500 mb-1">Notes</p><p className="text-sm text-gray-900">{showDetail.notes}</p></div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search receptions..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ l: 'All', v: '' }, { l: 'Draft', v: 'draft' }, { l: 'Confirmed', v: 'confirmed' }].map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === f.v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
        ) : receptions.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><Package size={48} className="mx-auto mb-4 text-gray-300" /><p>No receptions found</p></div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">GRN Number</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">PO Number</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Supplier</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-center px-5 py-3 font-medium text-gray-500">Received / Accepted / Rejected</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {receptions.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-gray-900">{r.grn_number || r.reception_number}</td>
                      <td className="px-5 py-3 text-blue-600 cursor-pointer" onClick={() => viewDetail(r)}>{r.purchase_order?.po_number || '-'}</td>
                      <td className="px-5 py-3 text-gray-900">{r.supplier?.name || '-'}</td>
                      <td className="px-5 py-3 text-gray-600">{r.reception_date}</td>
                      <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[r.status] || 'bg-gray-100 text-gray-600'}`}>{r.status}</span></td>
                      <td className="px-5 py-3 text-center">
                        <span className="font-medium text-gray-900">{itemQty(r, 'received_quantity')}</span>
                        <span className="text-gray-400"> / </span>
                        <span className="font-medium text-green-600">{itemQty(r, 'accepted_quantity')}</span>
                        <span className="text-gray-400"> / </span>
                        <span className={`font-medium ${Number(itemQty(r, 'rejected_quantity')) > 0 ? 'text-red-600' : 'text-gray-400'}`}>{itemQty(r, 'rejected_quantity')}</span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => viewDetail(r)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50" title="View"><Eye size={15} /></button>
                          {r.status === 'draft' && (
                            <>
                              <button onClick={() => handleConfirm(r)} className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50" title="Confirm"><CheckCircle size={15} /></button>
                              <button onClick={() => handleDelete(r)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Delete"><Trash2 size={15} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {lastPage > 1 && (
              <div className="px-6 py-4 border-t border-gray-100"><Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} /></div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
