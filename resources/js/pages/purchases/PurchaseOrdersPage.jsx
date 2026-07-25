import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { ShoppingCart, Plus, Search, Eye, Edit2, X, CheckCircle, Send, Ban, Package } from 'lucide-react';

const STATUS_CLASSES = {
  draft: 'bg-gray-100 text-gray-600', sent: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-purple-100 text-purple-700', partially_received: 'bg-yellow-100 text-yellow-700',
  received: 'bg-green-100 text-green-700', cancelled: 'bg-red-100 text-red-700',
};

const PAYMENT_STATUS = {
  unpaid: 'bg-red-100 text-red-700', partial: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
};

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [form, setForm] = useState({
    supplier_id: '', order_date: new Date().toISOString().split('T')[0], expected_date: '',
    notes: '', items: [{ product_id: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: 0, unit: '' }],
  });
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [summary, setSummary] = useState({});

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/owner/purchases/orders', { params });
      setOrders(res.data.data || []);
      setCurrentPage(res.data.current_page || 1);
      setLastPage(res.data.last_page || 1);
    } catch { setOrders([]); } finally { setLoading(false); }
  }, [search, statusFilter]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/owner/purchases/suppliers', { params: { per_page: 100, status: 'active' } }),
        api.get('/owner/businesses/' + (localStorage.getItem('business_id') || '') + '/products', { params: { per_page: 500 } }).catch(() => ({ data: { data: [] } })),
      ]);
      setSuppliers(supRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch {}
  }, []);

  const fetchSummary = useCallback(async () => {
    try { const res = await api.get('/owner/purchases/orders/summary'); setSummary(res.data); } catch {}
  }, []);

  useEffect(() => { fetchOrders(); fetchDropdowns(); fetchSummary(); }, [fetchOrders, fetchDropdowns, fetchSummary]);

  const addItem = () => setForm({ ...form, items: [...form.items, { product_id: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: 0, unit: '' }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const calcItemTotal = (item) => {
    const sub = item.quantity * item.unit_price;
    const disc = sub * (item.discount_percent / 100);
    const tax = (sub - disc) * (item.tax_rate / 100);
    return sub - disc + tax;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, items: form.items.map(it => ({ ...it, quantity: Number(it.quantity), unit_price: Number(it.unit_price), discount_percent: Number(it.discount_percent || 0), tax_rate: Number(it.tax_rate || 0) })) };
      await api.post('/owner/purchases/orders', payload);
      setShowForm(false); resetForm(); fetchOrders(); fetchSummary();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const resetForm = () => setForm({
    supplier_id: '', order_date: new Date().toISOString().split('T')[0], expected_date: '', notes: '',
    items: [{ product_id: '', quantity: 1, unit_price: 0, discount_percent: 0, tax_rate: 0, unit: '' }],
  });

  const handleAction = async (orderId, action) => {
    try {
      await api.post(`/owner/purchases/orders/${orderId}/${action}`);
      fetchOrders(); fetchSummary();
      if (showDetail) handleViewDetail({ id: orderId });
    } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
  };

  const handleViewDetail = async (order) => {
    try { const res = await api.get(`/owner/purchases/orders/${order.id}`); setShowDetail(res.data); } catch {}
  };

  const fmt = (n) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Orders" subtitle="Create and manage purchase orders to suppliers" icon={ShoppingCart}
        actions={<button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> New Purchase Order
        </button>} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Orders', value: summary.total_orders || 0, color: 'text-gray-900' },
          { label: 'Draft', value: summary.draft || 0, color: 'text-gray-600' },
          { label: 'Confirmed', value: summary.confirmed || 0, color: 'text-purple-600' },
          { label: 'Total Value', value: `TZS ${fmt(summary.total_value)}`, color: 'text-blue-600' },
          { label: 'Outstanding', value: `TZS ${fmt(summary.total_outstanding)}`, color: 'text-red-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">New Purchase Order</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
                  <select required value={form.supplier_id} onChange={e => setForm({...form, supplier_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Order Date *</label>
                  <input type="date" required value={form.order_date} onChange={e => setForm({...form, order_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Expected Date</label>
                  <input type="date" value={form.expected_date} onChange={e => setForm({...form, expected_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Order Items</h4>
                  <button type="button" onClick={addItem} className="text-xs text-[#00D4AA] font-medium flex items-center gap-1 hover:underline"><Plus size={14} /> Add Item</button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-xl">
                      <div className="col-span-4">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Product *</label>}
                        <select required value={item.product_id} onChange={e => {
                          const prod = products.find(p => p.id == e.target.value);
                          updateItem(i, 'product_id', e.target.value);
                          if (prod) { updateItem(i, 'unit_price', prod.buying_price || 0); updateItem(i, 'unit', prod.unit || ''); }
                        }} className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]">
                          <option value="">Select product</option>
                          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                      </div>
                      <div className="col-span-2">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Qty *</label>}
                        <input type="number" min="0.01" step="0.01" required value={item.quantity} onChange={e => updateItem(i, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                      </div>
                      <div className="col-span-2">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Unit Price *</label>}
                        <input type="number" min="0" step="0.01" required value={item.unit_price} onChange={e => updateItem(i, 'unit_price', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                      </div>
                      <div className="col-span-1">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Disc %</label>}
                        <input type="number" min="0" max="100" value={item.discount_percent} onChange={e => updateItem(i, 'discount_percent', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                      </div>
                      <div className="col-span-1">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Tax %</label>}
                        <input type="number" min="0" max="100" value={item.tax_rate} onChange={e => updateItem(i, 'tax_rate', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                      </div>
                      <div className="col-span-2 text-right">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Total</label>}
                        <span className="text-xs font-bold text-gray-900">TZS {fmt(calcItemTotal(item))}</span>
                        {form.items.length > 1 && (
                          <button type="button" onClick={() => removeItem(i)} className="ml-2 text-red-400 hover:text-red-600"><X size={12} /></button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50">
                  {saving ? 'Creating...' : 'Create Order'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{showDetail.po_number}</h3>
                <p className="text-xs text-gray-500">{showDetail.supplier?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {showDetail.status === 'draft' && (
                  <button onClick={() => handleAction(showDetail.id, 'approve')} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Send size={12} /> Approve & Send</button>
                )}
                {showDetail.status === 'sent' && (
                  <button onClick={() => handleAction(showDetail.id, 'confirm')} className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><CheckCircle size={12} /> Confirm</button>
                )}
                {!['received', 'cancelled'].includes(showDetail.status) && (
                  <button onClick={() => handleAction(showDetail.id, 'cancel')} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Ban size={12} /> Cancel</button>
                )}
                <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-4 gap-4 text-sm">
                <div><p className="text-gray-500">Status</p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[showDetail.status]}`}>{showDetail.status?.replace('_', ' ')}</span></div>
                <div><p className="text-gray-500">Order Date</p><p className="font-medium">{showDetail.order_date}</p></div>
                <div><p className="text-gray-500">Expected</p><p className="font-medium">{showDetail.expected_date || '-'}</p></div>
                <div><p className="text-gray-500">Payment</p><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS[showDetail.payment_status]}`}>{showDetail.payment_status}</span></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left px-4 py-2 font-medium text-gray-500">Product</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Qty</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Received</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Unit Price</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Total</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {showDetail.items?.map(item => (
                      <tr key={item.id}>
                        <td className="px-4 py-2">{item.product?.name || item.description}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{item.received_quantity}</td>
                        <td className="px-4 py-2 text-right">TZS {fmt(item.unit_price)}</td>
                        <td className="px-4 py-2 text-right font-medium">TZS {fmt(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t font-bold">
                    <td colSpan={4} className="px-4 py-2 text-right">Total</td>
                    <td className="px-4 py-2 text-right">TZS {fmt(showDetail.total)}</td>
                  </tr></tfoot>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
          {[{ l: 'All', v: '' }, { l: 'Draft', v: 'draft' }, { l: 'Sent', v: 'sent' }, { l: 'Confirmed', v: 'confirmed' }, { l: 'Received', v: 'received' }, { l: 'Cancelled', v: 'cancelled' }].map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === f.v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><ShoppingCart size={48} className="mx-auto mb-4 text-gray-300" /><p>No purchase orders found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">PO Number</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Supplier</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Total</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Payment</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-blue-600 cursor-pointer" onClick={() => handleViewDetail(o)}>{o.po_number}</td>
                    <td className="px-5 py-3 text-gray-900">{o.supplier?.name}</td>
                    <td className="px-5 py-3 text-gray-600">{o.order_date}</td>
                    <td className="px-5 py-3 text-right font-medium">TZS {fmt(o.total)}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[o.status]}`}>{o.status?.replace('_', ' ')}</span></td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${PAYMENT_STATUS[o.payment_status]}`}>{o.payment_status}</span></td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleViewDetail(o)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Eye size={15} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
