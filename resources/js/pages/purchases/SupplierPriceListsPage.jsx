import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Tag, Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const EMPTY_FORM = {
  supplier_id: '', product_id: '', unit_price: '', min_quantity: 1,
  discount_percent: 0, currency: 'TZS', valid_from: new Date().toISOString().split('T')[0],
  valid_to: '', is_active: true,
};

export default function SupplierPriceListsPage() {
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supplierFilter, setSupplierFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [productSearch, setProductSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState({ total_prices: 0, active_count: 0, expiring_soon_count: 0 });

  const fetchItems = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { per_page: 20, page };
      if (supplierFilter) params.supplier_id = supplierFilter;
      if (activeFilter !== '') params.active = activeFilter;
      const res = await api.get('/owner/purchases/price-lists', { params });
      const data = res.data;
      setItems(data.data || []);
      setCurrentPage(data.current_page || 1);
      setLastPage(data.last_page || 1);
      setTotal(data.total ?? (data.data || []).length);
      if (!data.summary && !data.meta?.summary) {
        const rows = data.data || [];
        setSummary({
          total_prices: data.total ?? rows.length,
          active_count: rows.filter((r) => r.is_active).length,
          expiring_soon_count: rows.filter((r) => r.expiring_soon).length,
        });
      }
    } catch (error) { console.error('Failed to fetch price lists:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [supplierFilter, activeFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/owner/purchases/price-lists', { params: { per_page: 1 } });
      const s = res.data.summary || res.data.meta?.summary;
      if (s) setSummary(s);
    } catch (error) { console.error('Failed to fetch price list summary:', error); }
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const [supRes, prodRes] = await Promise.all([
        api.get('/owner/purchases/suppliers', { params: { per_page: 100, status: 'active' } }),
        api.get('/owner/businesses/' + (localStorage.getItem('business_id') || '') + '/products', { params: { per_page: 500 } }).catch(() => ({ data: { data: [] } })),
      ]);
      setSuppliers(supRes.data.data || []);
      setProducts(prodRes.data.data || []);
    } catch (error) { console.error('Failed to fetch dropdown data:', error); }
  }, []);

  useEffect(() => { fetchItems(1); }, [fetchItems]);
  useEffect(() => { fetchSummary(); fetchDropdowns(); }, [fetchSummary, fetchDropdowns]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) =>
      (p.name || '').toLowerCase().includes(q) ||
      (p.sku || '').toLowerCase().includes(q)
    );
  }, [products, productSearch]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setProductSearch('');
    setEditing(null);
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleEdit = async (item) => {
    try {
      const res = await api.get(`/owner/purchases/price-lists/${item.id}`);
      const d = res.data;
      setEditing(d);
      setForm({
        supplier_id: String(d.supplier_id || ''),
        product_id: String(d.product_id || ''),
        unit_price: d.unit_price ?? '',
        min_quantity: d.min_quantity ?? 1,
        discount_percent: d.discount_percent ?? 0,
        currency: d.currency || 'TZS',
        valid_from: d.valid_from ? String(d.valid_from).split('T')[0] : '',
        valid_to: d.valid_to ? String(d.valid_to).split('T')[0] : '',
        is_active: !!d.is_active,
      });
      setShowForm(true);
    } catch (error) { console.error('Failed to load price details:', error);
      alert('Failed to load price details');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        supplier_id: Number(form.supplier_id),
        product_id: Number(form.product_id),
        unit_price: Number(form.unit_price),
        min_quantity: Number(form.min_quantity || 1),
        discount_percent: Number(form.discount_percent || 0),
        currency: form.currency || 'TZS',
        valid_from: form.valid_from || null,
        valid_to: form.valid_to || null,
        is_active: form.is_active,
      };
      if (editing) {
        await api.put(`/owner/purchases/price-lists/${editing.id}`, payload);
      } else {
        await api.post('/owner/purchases/price-lists', payload);
      }
      setShowForm(false);
      resetForm();
      fetchItems(currentPage);
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save price');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    const label = item.supplier?.name || `#${item.id}`;
    if (!confirm(`Delete this price entry for "${label}"?`)) return;
    try {
      await api.delete(`/owner/purchases/price-lists/${item.id}`);
      if (items.length === 1 && currentPage > 1) fetchItems(currentPage - 1);
      else fetchItems(currentPage);
      fetchSummary();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
  };

  const fmtMoney = (n, currency = 'TZS') => {
    const value = Number(n || 0);
    try {
      return new Intl.NumberFormat('en-TZ', { style: 'currency', currency: currency || 'TZS', minimumFractionDigits: 0 }).format(value);
    } catch {
      return `${currency} ${value.toLocaleString()}`;
    }
  };

  const fmtDate = (d) => (d ? String(d).split('T')[0] : '-');

  const supplierName = (id) => suppliers.find((s) => s.id === id)?.name;

  return (
    <div className="space-y-6">
      <PageHeader title="Supplier Price Lists" subtitle="Manage supplier-specific pricing for your products" icon={Tag}
        actions={<button onClick={openCreate}
          className="bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-lg px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> Add Price
        </button>} />

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Prices', value: summary.total_prices || 0, color: 'text-gray-900' },
          { label: 'Active', value: summary.active_count || 0, color: 'text-green-600' },
          { label: 'Expiring Soon', value: summary.expiring_soon_count || 0, color: 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit Price' : 'New Supplier Price'}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
                  <select required value={form.supplier_id} onChange={(e) => setForm({ ...form, supplier_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="">Select supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Product *</label>
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" placeholder="Search products..." value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-[#00D4AA]" />
                  </div>
                  <select required value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" size={Math.min(Math.max(filteredProducts.length, 2), 5)}>
                    <option value="">Select product...</option>
                    {filteredProducts.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}{p.sku ? ` (${p.sku})` : ''}</option>
                    ))}
                    {filteredProducts.length === 0 && <option disabled>No products match</option>}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit Price *</label>
                  <input type="number" step="0.01" min="0" required value={form.unit_price}
                    onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Min Quantity</label>
                  <input type="number" min="1" value={form.min_quantity}
                    onChange={(e) => setForm({ ...form, min_quantity: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Discount %</label>
                  <input type="number" step="0.01" min="0" max="100" value={form.discount_percent}
                    onChange={(e) => setForm({ ...form, discount_percent: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Currency</label>
                  <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="TZS">TZS</option><option value="USD">USD</option><option value="KES">KES</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valid From</label>
                  <input type="date" value={form.valid_from} onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Valid To</label>
                  <input type="date" value={form.valid_to} onChange={(e) => setForm({ ...form, valid_to: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
                </div>
                <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                  <button type="button" role="switch" aria-checked={form.is_active}
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className={`relative h-6 w-11 rounded-full transition-colors ${form.is_active ? 'bg-gradient-to-r from-[#00D4AA] to-[#00b894]' : 'bg-gray-300'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${form.is_active ? 'left-[22px]' : 'left-0.5'}`} />
                  </button>
                  <span className="text-sm text-gray-700">{form.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select value={supplierFilter} onChange={(e) => setSupplierFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA] max-w-[220px]">
          <option value="">All Suppliers</option>
          {suppliers.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ l: 'All', v: '' }, { l: 'Active', v: '1' }, { l: 'Inactive', v: '0' }].map((f) => (
            <button key={f.v} onClick={() => setActiveFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${activeFilter === f.v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 shadow-sm overflow-hidden bg-white">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" />
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <Tag size={48} className="mx-auto mb-4 text-gray-300" />
            <p>No price entries found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Supplier</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Product (SKU)</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Unit Price</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Min Qty</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Discount</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Currency</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Valid From</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Valid To</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-500">Active</th>
                    <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item) => {
                    const expired = item.valid_to && new Date(item.valid_to) < new Date(new Date().toDateString());
                    return (
                      <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3 font-medium text-gray-900">{item.supplier?.name || supplierName(item.supplier_id) || '-'}</td>
                        <td className="px-5 py-3">
                          <div className="text-gray-900">{item.product?.name || '-'}</div>
                          {(item.product?.sku || item.sku) && <div className="text-xs text-gray-500">{item.product?.sku || item.sku}</div>}
                        </td>
                        <td className="px-5 py-3 text-right font-semibold text-gray-900">{fmtMoney(item.unit_price, item.currency)}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{item.min_quantity ?? '-'}</td>
                        <td className="px-5 py-3 text-right text-gray-600">{item.discount_percent ? `${item.discount_percent}%` : '-'}</td>
                        <td className="px-5 py-3 text-gray-600">{item.currency || 'TZS'}</td>
                        <td className={`px-5 py-3 ${expired ? 'text-red-600' : 'text-gray-600'}`}>{fmtDate(item.valid_from)}</td>
                        <td className={`px-5 py-3 ${expired ? 'text-red-600 font-medium' : 'text-gray-600'}`}>{fmtDate(item.valid_to)}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {item.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(item)} className="p-1.5 text-gray-400 hover:text-[#00D4AA] rounded-lg hover:bg-[#00D4AA]/5"><Edit2 size={15} /></button>
                            <button onClick={() => handleDelete(item)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {lastPage > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">Showing page {currentPage} of {lastPage} ({total} entries)</p>
                <div className="flex items-center gap-2">
                  <button onClick={() => fetchItems(currentPage - 1)} disabled={currentPage <= 1}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    Previous
                  </button>
                  <button onClick={() => fetchItems(currentPage + 1)} disabled={currentPage >= lastPage}
                    className="px-3 py-1.5 text-xs font-medium border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed">
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
