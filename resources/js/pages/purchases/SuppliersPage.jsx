import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Truck, Plus, Search, Eye, Edit2, Trash2, X, Phone, Mail, MapPin, Star, Ban, CheckCircle } from 'lucide-react';

const STATUS_CLASSES = {
  active: 'bg-green-100 text-green-700',
  inactive: 'bg-gray-100 text-gray-600',
  blocked: 'bg-red-100 text-red-700',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: '', contact_person: '', email: '', phone: '', secondary_phone: '',
    address: '', city: '', country: 'Tanzania', postal_code: '', tax_number: '',
    registration_number: '', payment_terms: 'net_30', credit_limit: '',
    currency: 'TZS', bank_name: '', bank_account_number: '', bank_branch: '',
    notes: '', preferred_payment_method: '',
  });
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [summary, setSummary] = useState({});
  const [showDetail, setShowDetail] = useState(null);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 20 };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/owner/purchases/suppliers', { params });
      setSuppliers(res.data.data || []);
      setCurrentPage(res.data.current_page || 1);
      setLastPage(res.data.last_page || 1);
    } catch (error) { console.error('Failed to fetch suppliers:', error); setSuppliers([]); } finally { setLoading(false); }
  }, [search, statusFilter]);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await api.get('/owner/purchases/suppliers/summary');
      setSummary(res.data);
    } catch (error) { console.error('Failed to fetch supplier summary:', error); }
  }, []);(() => { fetchSuppliers(); fetchSummary(); }, [fetchSuppliers, fetchSummary]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, credit_limit: form.credit_limit ? Number(form.credit_limit) : 0 };
      if (editing) {
        await api.put(`/owner/purchases/suppliers/${editing.id}`, payload);
      } else {
        await api.post('/owner/purchases/suppliers', payload);
      }
      setShowForm(false); setEditing(null); resetForm(); fetchSuppliers(); fetchSummary();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save supplier'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (supplier) => {
    if (!confirm(`Delete supplier "${supplier.name}"?`)) return;
    try {
      await api.delete(`/owner/purchases/suppliers/${supplier.id}`);
      fetchSuppliers(); fetchSummary();
    } catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleEdit = (supplier) => {
    setForm({
      name: supplier.name || '', contact_person: supplier.contact_person || '',
      email: supplier.email || '', phone: supplier.phone || '',
      secondary_phone: supplier.secondary_phone || '', address: supplier.address || '',
      city: supplier.city || '', country: supplier.country || 'Tanzania',
      postal_code: supplier.postal_code || '', tax_number: supplier.tax_number || '',
      registration_number: supplier.registration_number || '',
      payment_terms: supplier.payment_terms || 'net_30',
      credit_limit: supplier.credit_limit || '', currency: supplier.currency || 'TZS',
      bank_name: supplier.bank_name || '', bank_account_number: supplier.bank_account_number || '',
      bank_branch: supplier.bank_branch || '', notes: supplier.notes || '',
      preferred_payment_method: supplier.preferred_payment_method || '',
    });
    setEditing(supplier); setShowForm(true);
  };

  const resetForm = () => setForm({
    name: '', contact_person: '', email: '', phone: '', secondary_phone: '',
    address: '', city: '', country: 'Tanzania', postal_code: '', tax_number: '',
    registration_number: '', payment_terms: 'net_30', credit_limit: '',
    currency: 'TZS', bank_name: '', bank_account_number: '', bank_branch: '',
    notes: '', preferred_payment_method: '',
  });

  const handleViewDetail = async (supplier) => {
    try {
      const res = await api.get(`/owner/purchases/suppliers/${supplier.id}`);
      setShowDetail(res.data);
    } catch (err) { alert('Failed to load details'); }
  };

  const fmt = (n) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Suppliers" subtitle="Manage your suppliers and vendor relationships" icon={Truck}
        actions={<button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> Add Supplier
        </button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Suppliers', value: summary.total || 0, color: 'text-gray-900' },
          { label: 'Active', value: summary.active || 0, color: 'text-green-600' },
          { label: 'Blocked', value: summary.blocked || 0, color: 'text-red-600' },
          { label: 'Outstanding', value: `TZS ${fmt(summary.total_outstanding)}`, color: 'text-orange-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-3xl mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit Supplier' : 'New Supplier'}</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Contact Person</label>
                  <input type="text" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                  <input type="text" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Address</label>
                  <input type="text" value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                  <input type="text" value={form.city} onChange={e => setForm({...form, city: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                  <input type="text" value={form.country} onChange={e => setForm({...form, country: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Tax Number</label>
                  <input type="text" value={form.tax_number} onChange={e => setForm({...form, tax_number: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Payment Terms</label>
                  <select value={form.payment_terms} onChange={e => setForm({...form, payment_terms: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="cod">Cash on Delivery</option><option value="net_7">Net 7</option>
                    <option value="net_15">Net 15</option><option value="net_30">Net 30</option>
                    <option value="net_60">Net 60</option><option value="net_90">Net 90</option>
                    <option value="prepaid">Prepaid</option>
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Credit Limit (TZS)</label>
                  <input type="number" value={form.credit_limit} onChange={e => setForm({...form, credit_limit: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Bank Name</label>
                  <input type="text" value={form.bank_name} onChange={e => setForm({...form, bank_name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Bank Account</label>
                  <input type="text" value={form.bank_account_number} onChange={e => setForm({...form, bank_account_number: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Bank Branch</label>
                  <input type="text" value={form.bank_branch} onChange={e => setForm({...form, bank_branch: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div className="sm:col-span-2"><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{showDetail.name}</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500">Code:</span> <span className="font-medium ml-2">{showDetail.code}</span></div>
                <div><span className="text-gray-500">Status:</span>
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${showDetail.is_blocked ? STATUS_CLASSES.blocked : showDetail.is_active ? STATUS_CLASSES.active : STATUS_CLASSES.inactive}`}>
                    {showDetail.is_blocked ? 'Blocked' : showDetail.is_active ? 'Active' : 'Inactive'}
                  </span></div>
                <div className="flex items-center gap-2"><Mail size={14} className="text-gray-400" /><span>{showDetail.email || '-'}</span></div>
                <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /><span>{showDetail.phone || '-'}</span></div>
                <div className="flex items-center gap-2"><MapPin size={14} className="text-gray-400" /><span>{[showDetail.city, showDetail.country].filter(Boolean).join(', ') || '-'}</span></div>
                <div><span className="text-gray-500">Tax #:</span> <span className="ml-2">{showDetail.tax_number || '-'}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                <div><p className="text-xs text-gray-500">Credit Limit</p><p className="font-bold">TZS {fmt(showDetail.credit_limit)}</p></div>
                <div><p className="text-xs text-gray-500">Outstanding</p><p className="font-bold text-orange-600">TZS {fmt(showDetail.outstanding_balance)}</p></div>
                <div><p className="text-xs text-gray-500">Available Credit</p><p className="font-bold text-green-600">TZS {fmt(showDetail.balance)}</p></div>
              </div>
              {showDetail.stats && (
                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-xl">
                  <div><p className="text-xs text-gray-500">Total Orders</p><p className="font-bold">{showDetail.stats.total_orders}</p></div>
                  <div><p className="text-xs text-gray-500">Total Invoices</p><p className="font-bold">{showDetail.stats.total_invoices}</p></div>
                  <div><p className="text-xs text-gray-500">Total Payments</p><p className="font-bold">{showDetail.stats.total_payments}</p></div>
                </div>
              )}
              {showDetail.bank_name && (
                <div className="p-4 bg-gray-50 rounded-xl text-sm">
                  <p className="font-medium mb-2">Bank Details</p>
                  <p>{showDetail.bank_name} - {showDetail.bank_branch || ''} - A/C: {showDetail.bank_account_number}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ l: 'All', v: '' }, { l: 'Active', v: 'active' }, { l: 'Inactive', v: 'inactive' }].map(f => (
            <button key={f.v} onClick={() => setStatusFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${statusFilter === f.v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" />
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><Truck size={48} className="mx-auto mb-4 text-gray-300" /><p>No suppliers found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Code</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Name</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Contact</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Phone</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Balance</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {suppliers.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{s.code}</td>
                    <td className="px-5 py-3">
                      <div className="font-medium text-gray-900">{s.name}</div>
                      {s.email && <div className="text-xs text-gray-500">{s.email}</div>}
                    </td>
                    <td className="px-5 py-3 text-gray-600">{s.contact_person || '-'}</td>
                    <td className="px-5 py-3 text-gray-600">{s.phone || '-'}</td>
                    <td className="px-5 py-3 text-right font-medium text-orange-600">TZS {fmt(s.outstanding_balance)}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.is_blocked ? STATUS_CLASSES.blocked : s.is_active ? STATUS_CLASSES.active : STATUS_CLASSES.inactive}`}>
                        {s.is_blocked ? 'Blocked' : s.is_active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleViewDetail(s)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"><Eye size={15} /></button>
                        <button onClick={() => handleEdit(s)} className="p-1.5 text-gray-400 hover:text-[#00D4AA] rounded-lg hover:bg-[#00D4AA]/5"><Edit2 size={15} /></button>
                        <button onClick={() => handleDelete(s)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={15} /></button>
                      </div>
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
