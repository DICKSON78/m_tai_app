import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import ConfirmDialog from '../../components/ConfirmDialog';
import { FileText, Plus, Search, Eye, CheckCircle, X, Clock, Edit2, Trash2, AlertTriangle } from 'lucide-react';

const STATUS_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-700', validated: 'bg-green-100 text-green-700',
  partially_paid: 'bg-blue-100 text-blue-700', paid: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-600',
};

const AGING_BUCKETS = [
  { label: 'Current (Not Due)', keys: ['current', 'not_due', 'not_due_yet'], cls: 'bg-emerald-50 border border-emerald-100', text: 'text-emerald-700' },
  { label: '1-30 Days', keys: ['1_30', 'days_1_30', '1-30', 'd30', '30'], cls: 'bg-yellow-50 border border-yellow-100', text: 'text-yellow-700' },
  { label: '31-60 Days', keys: ['31_60', 'days_31_60', '31-60', 'd60', '60'], cls: 'bg-orange-50 border border-orange-100', text: 'text-orange-700' },
  { label: '61-90 Days', keys: ['61_90', 'days_61_90', '61-90', 'd90', '90'], cls: 'bg-red-50 border border-red-100', text: 'text-red-700' },
  { label: '90+ Days', keys: ['over_90', 'above_90', '90_plus', 'more_than_90'], cls: 'bg-rose-100 border border-rose-200', text: 'text-rose-700' },
];

const EMPTY_ITEM = { product_id: '', description: '', quantity: 1, unit_price: 0, tax_rate: 0 };
const emptyForm = () => ({
  supplier_id: '', purchase_order_id: '', invoice_number: '',
  invoice_date: new Date().toISOString().split('T')[0], due_date: '', notes: '',
  items: [{ ...EMPTY_ITEM }],
});

const fmtCurrency = (n) => new Intl.NumberFormat('en-TZ', { style: 'currency', currency: 'TZS', minimumFractionDigits: 0 }).format(Number(n) || 0);
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const isOverdue = (inv) => {
  if (inv.status === 'paid' || inv.status === 'cancelled') return false;
  if (!inv.due_date) return false;
  if (inv.is_overdue !== undefined && inv.is_overdue !== null) return !!inv.is_overdue;
  return new Date(inv.due_date) < new Date(new Date().toDateString());
};

export default function SupplierInvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(null);

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [supplierFilter, setSupplierFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const [summary, setSummary] = useState({});
  const [aging, setAging] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [showDetail, setShowDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteInvoice, setDeleteInvoice] = useState(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, statusFilter, supplierFilter]);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    setListError(null);
    try {
      const params = { page: currentPage, per_page: 15 };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter) params.status = statusFilter;
      if (supplierFilter) params.supplier_id = supplierFilter;
      const res = await api.get('/owner/purchases/invoices', { params });
      setInvoices(res.data.data || []);
      setCurrentPage(res.data.current_page || 1);
      setLastPage(res.data.last_page || 1);
      setTotalRecords(res.data.total ?? (res.data.data || []).length);
    } catch (err) {
      setListError(err.response?.data?.message || 'Failed to load invoices');
      setInvoices([]);
    } finally { setLoading(false); }
  }, [currentPage, debouncedSearch, statusFilter, supplierFilter]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [supRes, poRes, prodRes] = await Promise.all([
        api.get('/owner/purchases/suppliers', { params: { per_page: 100, status: 'active' } }),
        api.get('/owner/purchases/orders', { params: { per_page: 100 } }).catch(() => ({ data: { data: [] } })),
        api.get('/owner/businesses/' + (localStorage.getItem('business_id') || '') + '/products', { params: { per_page: 500 } }).catch(() => ({ data: { data: [] } })),
      ]);
      setSuppliers(supRes.data.data || []);
      setPurchaseOrders(poRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (error) { console.error('Failed to fetch dropdown data:', error); }
  }, []); = useCallback(async () => {
    try { const res = await api.get('/owner/purchases/invoices', { params: { per_page: 1, summary: 1 } }); setSummary(res.data.summary || {}); } catch (error) { console.error('Failed to fetch invoice summary:', error); }
    try {
      const res = await api.get('/owner/purchases/invoices/aging');
      setAging(res.data?.data || res.data);
    } catch (error) { console.error('Failed to fetch aging data:', error); setAging(null); }
  }, []);

  useEffect(() => { fetchInvoices(); fetchDropdowns(); fetchSummary(); }, [fetchInvoices, fetchDropdowns, fetchSummary]);

  const refreshAll = () => { fetchInvoices(); fetchSummary(); };

  const addItem = () => setForm({ ...form, items: [...form.items, { ...EMPTY_ITEM }] });
  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i, field, val) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: val };
    setForm({ ...form, items });
  };

  const calcTotals = () => {
    let subtotal = 0, taxAmount = 0;
    form.items.forEach(it => {
      const line = Number(it.quantity || 0) * Number(it.unit_price || 0);
      subtotal += line;
      taxAmount += line * (Number(it.tax_rate || 0) / 100);
    });
    return { subtotal: round2(subtotal), taxAmount: round2(taxAmount), total: round2(subtotal + taxAmount) };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totals = calcTotals();
    setSaving(true);
    try {
      const payload = {
        supplier_id: form.supplier_id,
        purchase_order_id: form.purchase_order_id || null,
        invoice_number: form.invoice_number,
        invoice_date: form.invoice_date,
        due_date: form.due_date || null,
        subtotal: totals.subtotal,
        tax_amount: totals.taxAmount,
        total: totals.total,
        notes: form.notes,
        items: form.items.map(it => ({
          product_id: it.product_id || null,
          description: it.description,
          quantity: Number(it.quantity),
          unit_price: Number(it.unit_price),
          tax_rate: Number(it.tax_rate || 0),
        })),
      };
      if (editingId) await api.put(`/owner/purchases/invoices/${editingId}`, payload);
      else await api.post('/owner/purchases/invoices', payload);
      setShowForm(false); setEditingId(null); setForm(emptyForm()); refreshAll();
    } catch (err) {
      const msg = err.response?.data?.message
        || (err.response?.data?.errors && Object.values(err.response.data.errors)[0]?.[0])
        || 'Failed to save invoice';
      alert(msg);
    } finally { setSaving(false); }
  };

  const handleEdit = async (inv) => {
    setEditingId(inv.id);
    setShowForm(true);
    try {
      const res = await api.get(`/owner/purchases/invoices/${inv.id}`);
      const d = res.data?.data || res.data;
      setForm({
        supplier_id: d.supplier_id ? String(d.supplier_id) : '',
        purchase_order_id: d.purchase_order_id ? String(d.purchase_order_id) : '',
        invoice_number: d.invoice_number || '',
        invoice_date: (d.invoice_date || '').split('T')[0],
        due_date: d.due_date ? String(d.due_date).split('T')[0] : '',
        notes: d.notes || '',
        items: (Array.isArray(d.items) && d.items.length ? d.items : [{ ...EMPTY_ITEM }]).map(it => ({
          product_id: it.product_id ? String(it.product_id) : '',
          description: it.description || it.product?.name || '',
          quantity: it.quantity ?? 1,
          unit_price: it.unit_price ?? 0,
          tax_rate: it.tax_rate ?? 0,
        })),
      });
    } catch (error) { console.error('Failed to load invoice for editing:', error); alert('Failed to load invoice for editing'); }
  };

  const handleDelete = async () => {
    if (!deleteInvoice) return;
    try {
      await api.delete(`/owner/purchases/invoices/${deleteInvoice.id}`);
      if (showDetail?.id === deleteInvoice.id) setShowDetail(null);
      refreshAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete invoice'); }
    finally { setConfirmOpen(false); setDeleteInvoice(null); }
  };

  const handleValidate = async (id) => {
    try {
      await api.post(`/owner/purchases/invoices/${id}/validate`);
      refreshAll();
      if (showDetail?.id === id) openDetail({ id });
    } catch (err) { alert(err.response?.data?.message || 'Failed to validate invoice'); }
  };

  const openDetail = async (inv) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/owner/purchases/invoices/${inv.id}`);
      setShowDetail(res.data?.data || res.data);
    } catch (error) { console.error('Failed to load invoice details:', error); alert('Failed to load invoice details'); }
    finally { setDetailLoading(false); }
  };

  const getBucketRow = (data, keys) => {
    const src = Array.isArray(data) ? data : (data?.buckets ?? data);
    if (Array.isArray(src)) {
      for (const row of src) {
        const label = String(row.bucket ?? row.range ?? row.label ?? row.days ?? '').toLowerCase().replace(/\s+/g, '');
        if (keys.some(k => label.includes(k.toLowerCase().replace(/_/g, '')))) return row;
      }
      return null;
    }
    if (!src || typeof src !== 'object') return null;
    for (const k of keys) if (src[k] !== undefined) return src[k];
    return null;
  };
  const bucketAmount = (row) => !row ? 0 : typeof row === 'object' ? (row.amount ?? row.total ?? row.value ?? 0) : row;
  const bucketCount = (row) => !row || typeof row !== 'object' ? null : (row.count ?? row.invoices_count ?? null);

  const totals = calcTotals();

  return (
    <div className="space-y-6">
      <PageHeader title="Supplier Invoices" subtitle="Track, validate and manage supplier invoices" icon={FileText}
        actions={<button onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> New Invoice
        </button>} />

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Invoices', value: summary.total_invoices ?? invoices.length, color: 'text-gray-900' },
          { label: 'Pending', value: summary.pending ?? 0, color: 'text-yellow-600' },
          { label: 'Validated', value: summary.validated ?? 0, color: 'text-green-600' },
          { label: 'Overdue', value: summary.overdue_count ?? 0, color: 'text-red-600' },
          { label: 'Total Amount', value: fmtCurrency(summary.total_amount), color: 'text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {aging && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={16} className="text-[#00D4AA]" />
            <h3 className="text-sm font-semibold text-gray-900">Invoice Aging Summary</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {AGING_BUCKETS.map(b => {
              const row = getBucketRow(aging, b.keys);
              const count = bucketCount(row);
              return (
                <div key={b.label} className={`rounded-xl p-4 ${b.cls}`}>
                  <p className={`text-xs font-medium ${b.text}`}>{b.label}</p>
                  <p className={`text-lg font-bold mt-1 ${b.text}`}>{fmtCurrency(bucketAmount(row))}</p>
                  {count !== null && <p className="text-xs text-gray-500 mt-0.5">{count} invoice{count === 1 ? '' : 's'}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
        </div>
        <select value={supplierFilter} onChange={e => setSupplierFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
          <option value="">All Suppliers</option>
          {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-wrap">
          {[{ l: 'All', v: '' }, { l: 'Pending', v: 'pending' }, { l: 'Validated', v: 'validated' }, { l: 'Paid', v: 'paid' }, { l: 'Overdue', v: 'overdue' }].map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === f.v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      {listError && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-red-700"><AlertTriangle size={16} /> {listError}</div>
          <button onClick={fetchInvoices} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700">Retry</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <FileText size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No supplier invoices found</p>
            {!search && !statusFilter && !supplierFilter && (
              <button onClick={() => { setEditingId(null); setForm(emptyForm()); setShowForm(true); }}
                className="mt-4 px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold inline-flex items-center gap-2 hover:shadow-lg transition-all">
                <Plus size={16} /> Create your first invoice
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Invoice #</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Supplier</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Invoice Date</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Due Date</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Amount</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
                </tr></thead>
                <tbody className="divide-y divide-gray-50">
                  {invoices.map(inv => {
                    const overdue = isOverdue(inv);
                    return (
                      <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-blue-600 cursor-pointer" onClick={() => openDetail(inv)}>{inv.invoice_number}</td>
                        <td className="px-5 py-3 text-gray-900">{inv.supplier?.name || '-'}</td>
                        <td className="px-5 py-3 text-gray-600">{inv.invoice_date}</td>
                        <td className="px-5 py-3">
                          <span className={overdue ? 'text-red-600 font-medium flex items-center gap-1' : 'text-gray-600'}>
                            {overdue && <Clock size={12} />}{inv.due_date || '-'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium">{fmtCurrency(inv.total)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[overdue ? 'overdue' : inv.status] || STATUS_CLASSES.pending}`}>
                            {(overdue ? 'overdue' : inv.status)?.replace('_', ' ') || 'pending'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {inv.status === 'pending' && (
                              <button onClick={() => handleValidate(inv.id)} title="Validate"
                                className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50"><CheckCircle size={15} /></button>
                            )}
                            {inv.status === 'pending' && (
                              <button onClick={() => handleEdit(inv)} title="Edit"
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Edit2 size={15} /></button>
                            )}
                            <button onClick={() => openDetail(inv)} title="View"
                              className="p-1.5 text-gray-400 hover:text-[#00D4AA] rounded-lg hover:bg-teal-50"><Eye size={15} /></button>
                            <button onClick={() => { setDeleteInvoice(inv); setConfirmOpen(true); }} title="Delete"
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => { setConfirmOpen(false); setDeleteInvoice(null); }}
        onConfirm={handleDelete}
        title="Delete Invoice"
        message={`Are you sure you want to delete invoice "${deleteInvoice?.invoice_number}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">Showing page {currentPage} of {lastPage} · {totalRecords} invoice{totalRecords === 1 ? '' : 's'}</p>
              <div className="flex gap-2">
                <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">Previous</button>
                <button disabled={currentPage >= lastPage} onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {detailLoading && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4AA]" />
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-10 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-4xl mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Invoice' : 'New Supplier Invoice'}</h3>
              <button onClick={() => { setShowForm(false); setEditingId(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
                  <select required value={form.supplier_id} onChange={e => setForm({ ...form, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="">Select supplier</option>
                    {suppliers.map(s => <option key={s.id} value={s.id}>{s.code ? `${s.code} - ` : ''}{s.name}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Purchase Order (optional)</label>
                  <select value={form.purchase_order_id} onChange={e => setForm({ ...form, purchase_order_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="">None</option>
                    {purchaseOrders.map(po => <option key={po.id} value={po.id}>{po.po_number}{po.supplier?.name ? ` - ${po.supplier.name}` : ''}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Invoice Number *</label>
                  <input type="text" required value={form.invoice_number} onChange={e => setForm({ ...form, invoice_number: e.target.value })}
                    placeholder="e.g. INV-2026-001" className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Invoice Date *</label>
                  <input type="date" required value={form.invoice_date} onChange={e => setForm({ ...form, invoice_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Due Date</label>
                  <input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">Invoice Items</h4>
                  <button type="button" onClick={addItem} className="text-xs text-[#00D4AA] font-medium flex items-center gap-1 hover:underline"><Plus size={14} /> Add Item</button>
                </div>
                <div className="space-y-3">
                  {form.items.map((item, i) => {
                    const line = Number(item.quantity || 0) * Number(item.unit_price || 0);
                    return (
                      <div key={i} className="grid grid-cols-12 gap-2 items-end p-3 bg-gray-50 rounded-xl">
                        <div className="col-span-4">
                          {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Product</label>}
                          <select value={item.product_id} onChange={e => {
                            const prod = products.find(p => p.id == e.target.value);
                            updateItem(i, 'product_id', e.target.value);
                            if (prod && !item.description) updateItem(i, 'description', prod.name);
                          }} className="w-full px-2 py-1.5 border rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]">
                            <option value="">General item</option>
                            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                        </div>
                        <div className="col-span-3">
                          {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Description *</label>}
                          <input type="text" required value={item.description} onChange={e => updateItem(i, 'description', e.target.value)}
                            className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                        </div>
                        <div className="col-span-1">
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
                          {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Tax %</label>}
                          <input type="number" min="0" max="100" step="0.01" value={item.tax_rate} onChange={e => updateItem(i, 'tax_rate', e.target.value)}
                            className="w-full px-2 py-1.5 border rounded-lg text-xs" />
                        </div>
                        <div className="col-span-1 text-right">
                          {i === 0 && <label className="block text-[10px] text-gray-500 mb-1">Line Total</label>}
                          <span className="text-xs font-bold text-gray-900">{fmtCurrency(line)}</span>
                          {form.items.length > 1 && (
                            <button type="button" onClick={() => removeItem(i)} className="ml-2 text-red-400 hover:text-red-600 align-middle"><X size={12} /></button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="w-full sm:w-64 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmtCurrency(totals.subtotal)}</span></div>
                    <div className="flex justify-between text-gray-600"><span>Tax</span><span>{fmtCurrency(totals.taxAmount)}</span></div>
                    <div className="flex justify-between font-bold text-gray-900 pt-1 border-t"><span>Total</span><span>{fmtCurrency(totals.total)}</span></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50">
                  {saving ? 'Saving...' : editingId ? 'Update Invoice' : 'Create Invoice'}</button>
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
                <h3 className="text-lg font-bold text-gray-900">{showDetail.invoice_number}</h3>
                <p className="text-xs text-gray-500">{showDetail.supplier?.name}</p>
              </div>
              <div className="flex items-center gap-2">
                {showDetail.status === 'pending' && (
                  <button onClick={() => handleValidate(showDetail.id)}
                    className="px-3 py-1.5 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-lg text-xs font-medium flex items-center gap-1">
                    <CheckCircle size={12} /> Validate
                  </button>
                )}
                {showDetail.status === 'pending' && (
                  <button onClick={() => { setShowDetail(null); handleEdit(showDetail); }}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Edit2 size={12} /> Edit</button>
                )}
                <button onClick={() => { setDeleteInvoice(showDetail); setConfirmOpen(true); }}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div><p className="text-gray-500">Status</p>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${STATUS_CLASSES[isOverdue(showDetail) ? 'overdue' : showDetail.status] || STATUS_CLASSES.pending}`}>
                    {(isOverdue(showDetail) ? 'overdue' : showDetail.status)?.replace('_', ' ') || 'pending'}
                  </span></div>
                <div><p className="text-gray-500">Invoice Date</p><p className="font-medium">{showDetail.invoice_date || '-'}</p></div>
                <div><p className="text-gray-500">Due Date</p>
                  <p className={`font-medium flex items-center gap-1 ${isOverdue(showDetail) ? 'text-red-600' : ''}`}>
                    {isOverdue(showDetail) && <Clock size={13} />}{showDetail.due_date || '-'}
                  </p></div>
                <div><p className="text-gray-500">Purchase Order</p><p className="font-medium">{showDetail.purchase_order?.po_number || showDetail.po_number || '-'}</p></div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b"><th className="text-left px-4 py-2 font-medium text-gray-500">Description</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Qty</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Unit Price</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Tax %</th>
                    <th className="text-right px-4 py-2 font-medium text-gray-500">Total</th></tr></thead>
                  <tbody className="divide-y divide-gray-50">
                    {(showDetail.items || []).map((item, i) => (
                      <tr key={item.id ?? i}>
                        <td className="px-4 py-2">{item.description || item.product?.name || '-'}</td>
                        <td className="px-4 py-2 text-right">{item.quantity}</td>
                        <td className="px-4 py-2 text-right">{fmtCurrency(item.unit_price)}</td>
                        <td className="px-4 py-2 text-right">{item.tax_rate ?? 0}%</td>
                        <td className="px-4 py-2 text-right font-medium">{fmtCurrency(item.total ?? (item.quantity * item.unit_price * (1 + (item.tax_rate || 0) / 100)))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-end">
                <div className="w-full sm:w-64 space-y-1 text-sm">
                  <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>{fmtCurrency(showDetail.subtotal)}</span></div>
                  <div className="flex justify-between text-gray-600"><span>Tax</span><span>{fmtCurrency(showDetail.tax_amount)}</span></div>
                  <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t"><span>Total</span><span>{fmtCurrency(showDetail.total)}</span></div>
                </div>
              </div>
              {showDetail.notes && (
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600"><p className="text-xs font-medium text-gray-500 mb-1">Notes</p>{showDetail.notes}</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
