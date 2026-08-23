import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import Pagination from '../../components/Pagination';
import { RotateCcw, Plus, Search, Eye, CheckCircle, X, Ban, Trash2 } from 'lucide-react';

const STATUS_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

const REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'defective', label: 'Defective' },
  { value: 'wrong_item', label: 'Wrong Item' },
  { value: 'quality_issue', label: 'Quality Issue' },
  { value: 'other', label: 'Other' },
];

const currencyFormatter = new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 });
const fmt = (n) => currencyFormatter.format(n || 0);
const today = () => new Date().toISOString().split('T')[0];
const humanize = (s) => (s || '').replace(/_/g, ' ');

const emptyItem = () => ({ product_id: '', quantity: 1, unit_price: 0, reason: 'damaged' });
const emptyForm = () => ({
  supplier_id: '',
  purchase_order_id: '',
  return_date: today(),
  reason: 'damaged',
  reason_details: '',
  items: [emptyItem()],
});

export default function PurchaseReturnsPage() {
  const [returns, setReturns] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [formError, setFormError] = useState('');
  const [showDetail, setShowDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [summary, setSummary] = useState({});

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page: currentPage, per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (supplierFilter) params.supplier_id = supplierFilter;
      const res = await api.get('/owner/purchases/returns', { params });
      const data = res.data;
      setReturns(data.data || []);
      setCurrentPage(data.current_page || 1);
      setLastPage(data.last_page || 1);
    } catch (err) {
      setReturns([]);
      setError(err.response?.data?.message || 'Failed to load purchase returns.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, search, statusFilter, supplierFilter]);

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
    try {
      const res = await api.get('/owner/purchases/returns/summary');
      setSummary(res.data || {});
    } catch { setSummary({}); }
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);
  useEffect(() => { fetchDropdowns(); fetchSummary(); }, [fetchDropdowns, fetchSummary]);

  const handleStatusFilter = (value) => { setStatusFilter(value); setCurrentPage(1); };
  const handleSupplierFilter = (e) => { setSupplierFilter(e.target.value); setCurrentPage(1); };

  const fetchPurchaseOrders = async (supplierId) => {
    setPurchaseOrders([]);
    if (!supplierId) return;
    try {
      const res = await api.get('/owner/purchases/orders', { params: { supplier_id: supplierId, per_page: 100 } });
      setPurchaseOrders(res.data.data || []);
    } catch { setPurchaseOrders([]); }
  };

  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const addItem = () => setForm({ ...form, items: [...form.items, emptyItem()] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const calcLineTotal = (item) => (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
  const calcGrandTotal = () => form.items.reduce((sum, it) => sum + calcLineTotal(it), 0);

  const resetForm = () => { setForm(emptyForm()); setPurchaseOrders([]); setFormError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.supplier_id) { setFormError('Please select a supplier.'); return; }
    const validItems = form.items.filter((it) => it.product_id && Number(it.quantity) > 0);
    if (validItems.length === 0) { setFormError('Add at least one item with a product and quantity.'); return; }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/owner/purchases/returns', {
        supplier_id: form.supplier_id,
        purchase_order_id: form.purchase_order_id || null,
        return_date: form.return_date,
        reason: form.reason,
        reason_details: form.reason_details,
        items: validItems.map((it) => ({
          product_id: it.product_id,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price) || 0,
          reason: it.reason,
        })),
      });
      setShowForm(false);
      resetForm();
      setCurrentPage(1);
      fetchReturns();
      fetchSummary();
    } catch (err) {
      const errors = err.response?.data?.errors;
      const firstError = errors ? Object.values(errors).flat()[0] : null;
      setFormError(firstError || err.response?.data?.message || 'Failed to create purchase return.');
    } finally {
      setSaving(false);
    }
  };

  const refreshDetail = async (id) => {
    try {
      const res = await api.get(`/owner/purchases/returns/${id}`);
      setShowDetail(res.data);
    } catch {}
  };

  const handleViewDetail = async (ret) => {
    setShowDetail({ ...(ret.supplier ? ret : {}), id: ret.id, return_number: ret.return_number, __loading: true });
    setDetailLoading(true);
    await refreshDetail(ret.id);
    setDetailLoading(false);
  };

  const handleAction = async (ret, action) => {
    const labels = { approve: 'Approve this return? Stock levels will be reduced.', reject: 'Reject this return?' };
    if (!confirm(labels[action])) return;
    setActionLoading(true);
    try {
      await api.post(`/owner/purchases/returns/${ret.id}/${action}`);
      fetchReturns();
      fetchSummary();
      if (showDetail?.id === ret.id) await refreshDetail(ret.id);
    } catch (err) { alert(err.response?.data?.message || 'Action failed'); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (ret) => {
    if (!confirm('Delete this return? This cannot be undone.')) return;
    setActionLoading(true);
    try {
      await api.delete(`/owner/purchases/returns/${ret.id}`);
      fetchReturns();
      fetchSummary();
      if (showDetail?.id === ret.id) setShowDetail(null);
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete return'); }
    finally { setActionLoading(false); }
  };

  const getReturnNumber = (r) => r.return_number || r.number || `RET-${r.id}`;
  const getReturnTotal = (r) => r.total ?? r.total_amount ?? 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Purchase Returns" subtitle="Manage goods returned to suppliers" icon={<RotateCcw size={20} />}
        actions={<button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> New Return
        </button>} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Returns', value: summary.total_returns || 0, color: 'text-gray-900' },
          { label: 'Pending', value: summary.pending || 0, color: 'text-yellow-600' },
          { label: 'Approved', value: summary.approved || 0, color: 'text-green-600' },
          { label: 'Rejected', value: summary.rejected || 0, color: 'text-red-600' },
          { label: 'Total Value', value: fmt(summary.total_value), color: 'text-blue-600' },
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
              <h3 className="text-lg font-bold text-gray-900">New Purchase Return</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {formError && (
                <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{formError}</div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
                  <select required value={form.supplier_id} onChange={(e) => { setForm({ ...form, supplier_id: e.target.value, purchase_order_id: '' }); fetchPurchaseOrders(e.target.value); }}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="">Select supplier</option>
                    {suppliers.map((s) => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Purchase Order</label>
                  <select value={form.purchase_order_id} onChange={(e) => setForm({ ...form, purchase_order_id: e.target.value })} disabled={!form.supplier_id}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA] disabled:bg-gray-50 disabled:text-gray-400">
                    <option value="">No specific PO</option>
                    {purchaseOrders.map((po) => <option key={po.id} value={po.id}>{po.po_number || `PO-${po.id}`}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Return Date *</label>
                  <input type="date" required max={today()} value={form.return_date} onChange={(e) => setForm({ ...form, return_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                  <select required value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Details</label>
                <textarea rows={2} value={form.reason_details} onChange={(e) => setForm({ ...form, reason_details: e.target.value })}
                  placeholder="Describe the issue with the delivered goods..."
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Returned Items</h4>
                  <button type="button" onClick={addItem} className="text-xs text-[#00D4AA] font-medium flex items-center gap-1 hover:underline"><Plus size={14} /> Add Item</button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-xl">
                      <div className="col-span-12 sm:col-span-4">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Product *</label>}
                        <select required value={item.product_id} onChange={(e) => {
                          const prod = products.find((p) => p.id == e.target.value);
                          updateItem(i, 'product_id', e.target.value);
                          if (prod && prod.buying_price != null) updateItem(i, 'unit_price', prod.buying_price);
                        }} className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]">
                          <option value="">Select product</option>
                          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select></div>
                      <div className="col-span-3 sm:col-span-2">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Qty *</label>}
                        <input type="number" min="0.01" step="0.01" required value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
                      <div className="col-span-4 sm:col-span-2">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Unit Price *</label>}
                        <input type="number" min="0" step="0.01" required value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg text-xs" /></div>
                      <div className="col-span-8 sm:col-span-3">
                        {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Reason</label>}
                        <select value={item.reason} onChange={(e) => updateItem(i, 'reason', e.target.value)}
                          className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]">
                          {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select></div>
                      <div className="col-span-12 sm:col-span-1 flex sm:flex-col items-center justify-between sm:items-end gap-1">
                        <span className="sm:hidden text-[10px] text-gray-500">Subtotal</span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-gray-900 whitespace-nowrap">{fmt(calcLineTotal(item))}</span>
                          {form.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(i)} className="text-red-400 hover:text-red-600" title="Remove item"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-end mt-3 pr-1">
                  <p className="text-sm text-gray-600">Estimated Total: <span className="font-bold text-gray-900">{fmt(calcGrandTotal())}</span></p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all disabled:opacity-50">
                  {saving ? 'Creating...' : (<><CheckCircle size={15} /> Create Return</>)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto" onClick={() => !detailLoading && setShowDetail(null)}>
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 mb-20 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{getReturnNumber(showDetail)}</h3>
                <p className="text-xs text-gray-500">{showDetail.supplier?.name || ''}</p>
              </div>
              <div className="flex items-center gap-2">
                {showDetail.status === 'pending' && (
                  <>
                    <button onClick={() => handleAction(showDetail, 'approve')} disabled={actionLoading}
                      className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-green-700 disabled:opacity-50"><CheckCircle size={12} /> Approve</button>
                    <button onClick={() => handleAction(showDetail, 'reject')} disabled={actionLoading}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-red-700 disabled:opacity-50"><Ban size={12} /> Reject</button>
                  </>
                )}
                <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
            </div>
            {detailLoading ? (
              <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div><p className="text-gray-500 mb-1">Status</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[showDetail.status] || 'bg-gray-100 text-gray-600'}`}>{humanize(showDetail.status)}</span></div>
                  <div><p className="text-gray-500 mb-1">Return Date</p><p className="font-medium text-gray-900">{showDetail.return_date || '-'}</p></div>
                  <div><p className="text-gray-500 mb-1">PO Reference</p><p className="font-medium text-gray-900">{showDetail.purchase_order?.po_number || '-'}</p></div>
                  <div><p className="text-gray-500 mb-1">Reason</p><p className="font-medium text-gray-900 capitalize">{humanize(showDetail.reason)}</p></div>
                </div>
                {showDetail.reason_details && (
                  <div><p className="text-gray-500 text-sm mb-1">Details</p>
                    <p className="text-sm text-gray-800 bg-gray-50 rounded-xl p-3">{showDetail.reason_details}</p></div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="text-left px-4 py-2 font-medium text-gray-500">Product</th>
                      <th className="text-left px-4 py-2 font-medium text-gray-500">Reason</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-500">Qty</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-500">Unit Price</th>
                      <th className="text-right px-4 py-2 font-medium text-gray-500">Total</th></tr></thead>
                    <tbody className="divide-y divide-gray-50">
                      {(showDetail.items || []).map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-2 text-gray-900">{item.product?.name || item.product_name || '-'}</td>
                          <td className="px-4 py-2 capitalize text-gray-600">{humanize(item.reason)}</td>
                          <td className="px-4 py-2 text-right">{item.quantity}</td>
                          <td className="px-4 py-2 text-right">{fmt(item.unit_price)}</td>
                          <td className="px-4 py-2 text-right font-medium">{fmt(item.total ?? (item.quantity * item.unit_price))}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot><tr className="border-t font-bold">
                      <td colSpan={4} className="px-4 py-2 text-right">Total</td>
                      <td className="px-4 py-2 text-right">{fmt(getReturnTotal(showDetail))}</td>
                    </tr></tfoot>
                  </table>
                </div>
                {(showDetail.status_history || showDetail.history || []).length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Status History</h4>
                    <ol className="space-y-3 border-l-2 border-gray-100 ml-2">
                      {(showDetail.status_history || showDetail.history || []).map((h, i) => (
                        <li key={i} className="pl-4 relative">
                          <span className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-[#00D4AA]" />
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[h.status] || 'bg-gray-100 text-gray-600'}`}>{humanize(h.status)}</span>
                            <span className="text-xs text-gray-400">{h.created_at || h.date || ''}</span>
                          </div>
                          {(h.notes || h.note || h.user?.name) && (
                            <p className="text-xs text-gray-500 mt-0.5">{[h.user?.name, h.notes || h.note].filter(Boolean).join(' - ')}</p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search returns..." value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
        </div>
        <select value={supplierFilter} onChange={handleSupplierFilter}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 focus:ring-2 focus:ring-[#00D4AA]">
          <option value="">All Suppliers</option>
          {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
          {[{ l: 'All', v: '' }, { l: 'Pending', v: 'pending' }, { l: 'Approved', v: 'approved' }, { l: 'Rejected', v: 'rejected' }].map((f) => (
            <button key={f.v} onClick={() => handleStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === f.v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">{error}</div>
      )}

      <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
        ) : returns.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <RotateCcw size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No purchase returns found</p>
            {!search && !statusFilter && !supplierFilter && (
              <button onClick={() => { resetForm(); setShowForm(true); }} className="mt-4 text-sm text-[#00D4AA] font-medium hover:underline">Create your first return</button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Return #</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Supplier</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">PO Ref</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Reason</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Total</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {returns.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-blue-600 cursor-pointer" onClick={() => handleViewDetail(r)}>{getReturnNumber(r)}</td>
                    <td className="px-5 py-3 text-gray-900">{r.supplier?.name || '-'}</td>
                    <td className="px-5 py-3 text-gray-600">{r.purchase_order?.po_number || '-'}</td>
                    <td className="px-5 py-3 text-gray-600">{r.return_date || '-'}</td>
                    <td className="px-5 py-3 capitalize text-gray-600">{humanize(r.reason)}</td>
                    <td className="px-5 py-3 text-right font-medium">{fmt(getReturnTotal(r))}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[r.status] || 'bg-gray-100 text-gray-600'}`}>{humanize(r.status)}</span></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {r.status === 'pending' && (
                          <>
                            <button onClick={() => handleAction(r, 'approve')} disabled={actionLoading} title="Approve"
                              className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 disabled:opacity-50"><CheckCircle size={15} /></button>
                            <button onClick={() => handleAction(r, 'reject')} disabled={actionLoading} title="Reject"
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"><Ban size={15} /></button>
                            <button onClick={() => handleDelete(r)} disabled={actionLoading} title="Delete"
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"><Trash2 size={15} /></button>
                          </>
                        )}
                        <button onClick={() => handleViewDetail(r)} title="View details"
                          className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Eye size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {!loading && returns.length > 0 && (
        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={(page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />
      )}
    </div>
  );
}
