import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { CreditCard, Plus, Search, Eye, CheckCircle, X, Ban } from 'lucide-react';

const METHOD_CLASSES = {
  cash: 'bg-green-100 text-green-700', bank_transfer: 'bg-blue-100 text-blue-700',
  mobile_money: 'bg-purple-100 text-purple-700', cheque: 'bg-yellow-100 text-yellow-700',
  card: 'bg-indigo-100 text-indigo-700', other: 'bg-gray-100 text-gray-600',
};

const STATUS_CLASSES = {
  pending: 'bg-yellow-100 text-yellow-700', confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function SupplierPaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    supplier_id: '', supplier_invoice_id: '', purchase_order_id: '',
    payment_date: new Date().toISOString().split('T')[0], payment_method: 'cash',
    reference_number: '', amount: '', notes: '',
  });
  const [invoices, setInvoices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [summary, setSummary] = useState({});

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params = { per_page: 20 };
      if (search) params.search = search;
      if (methodFilter) params.method = methodFilter;
      const res = await api.get('/owner/purchases/payments', { params });
      setPayments(res.data.data || []);
      setCurrentPage(res.data.current_page || 1);
      setLastPage(res.data.last_page || 1);
    } catch (error) { console.error('Failed to fetch payments:', error); setPayments([]); } finally { setLoading(false); }
  }, [search, methodFilter]);

  const fetchDropdowns = useCallback(async () => {
    try {
      const supRes = await api.get('/owner/purchases/suppliers', { params: { per_page: 100 } });
      setSuppliers(supRes.data.data || []);
    } catch (error) { console.error('Failed to fetch suppliers:', error); }
  }, []);

  const fetchSummary = useCallback(async () => {
    try { const res = await api.get('/owner/purchases/payments/summary'); setSummary(res.data); } catch (error) { console.error('Failed to fetch payment summary:', error); }
  }, []);

  useEffect(() => { fetchPayments(); fetchDropdowns(); fetchSummary(); }, [fetchPayments, fetchDropdowns, fetchSummary]);

  const fetchSupplierInvoices = async (supplierId) => {
    if (!supplierId) { setInvoices([]); return; }
    try {
      const res = await api.get('/owner/purchases/invoices', { params: { supplier_id: supplierId, status: 'validated', per_page: 100 } });
      setInvoices(res.data.data || []);
    } catch (error) { console.error('Failed to fetch supplier invoices:', error); setInvoices([]); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/owner/purchases/payments', { ...form, amount: Number(form.amount) });
      setShowForm(false); resetForm(); fetchPayments(); fetchSummary();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const resetForm = () => setForm({
    supplier_id: '', supplier_invoice_id: '', purchase_order_id: '',
    payment_date: new Date().toISOString().split('T')[0], payment_method: 'cash',
    reference_number: '', amount: '', notes: '',
  });

  const handleConfirm = async (payment) => {
    if (!confirm('Confirm this payment?')) return;
    try { await api.post(`/owner/purchases/payments/${payment.id}/confirm`); fetchPayments(); fetchSummary(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleCancel = async (payment) => {
    if (!confirm('Cancel this payment?')) return;
    try { await api.post(`/owner/purchases/payments/${payment.id}/cancel`); fetchPayments(); fetchSummary(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const fmt = (n) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 0 }).format(n || 0);

  return (
    <div className="space-y-6">
      <PageHeader title="Supplier Payments" subtitle="Track and manage payments to suppliers" icon={CreditCard}
        actions={<button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> Record Payment
        </button>} />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Payments', value: summary.total_payments || 0, color: 'text-gray-900' },
          { label: 'Total Paid', value: `TZS ${fmt(summary.total_amount)}`, color: 'text-green-600' },
          { label: 'Pending', value: `TZS ${fmt(summary.pending)}`, color: 'text-yellow-600' },
          { label: 'This Month', value: `TZS ${fmt(summary.this_month)}`, color: 'text-blue-600' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5">
            <p className="text-xs text-gray-500 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">Record Supplier Payment</h3>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Supplier *</label>
                <select required value={form.supplier_id} onChange={e => { setForm({...form, supplier_id: e.target.value, supplier_invoice_id: ''}); fetchSupplierInvoices(e.target.value); }}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.code} - {s.name}</option>)}
                </select></div>
              {invoices.length > 0 && (
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Link to Invoice</label>
                  <select value={form.supplier_invoice_id} onChange={e => setForm({...form, supplier_invoice_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="">No specific invoice</option>
                    {invoices.map(inv => <option key={inv.id} value={inv.id}>{inv.invoice_number} - Balance: TZS {fmt(inv.total - inv.amount_paid)}</option>)}
                  </select></div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Payment Date *</label>
                  <input type="date" required value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Payment Method *</label>
                  <select value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="cash">Cash</option><option value="bank_transfer">Bank Transfer</option>
                    <option value="mobile_money">Mobile Money</option><option value="cheque">Cheque</option>
                    <option value="card">Card</option><option value="other">Other</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Amount (TZS) *</label>
                  <input type="number" min="1" required value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Reference Number</label>
                  <input type="text" value={form.reference_number} onChange={e => setForm({...form, reference_number: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                <textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-6 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold hover:shadow-lg disabled:opacity-50">
                  {saving ? 'Recording...' : 'Record Payment'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search payments..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
        </div>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {[{ l: 'All', v: '' }, { l: 'Cash', v: 'cash' }, { l: 'Bank', v: 'bank_transfer' }, { l: 'Mobile', v: 'mobile_money' }].map(f => (
            <button key={f.v} onClick={() => setMethodFilter(f.v)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${methodFilter === f.v ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{f.l}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
        ) : payments.length === 0 ? (
          <div className="text-center py-20 text-gray-500"><CreditCard size={48} className="mx-auto mb-4 text-gray-300" /><p>No payments found</p></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Payment #</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Supplier</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Method</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Amount</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="text-right px-5 py-3 font-medium text-gray-500">Actions</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-gray-900">{p.payment_number}</td>
                    <td className="px-5 py-3 text-gray-900">{p.supplier?.name}</td>
                    <td className="px-5 py-3 text-gray-600">{p.payment_date}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${METHOD_CLASSES[p.payment_method]}`}>{p.payment_method?.replace('_', ' ')}</span></td>
                    <td className="px-5 py-3 text-right font-medium">TZS {fmt(p.local_amount)}</td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_CLASSES[p.status]}`}>{p.status}</span></td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {p.status === 'pending' && (
                          <>
                            <button onClick={() => handleConfirm(p)} className="p-1.5 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50" title="Confirm"><CheckCircle size={15} /></button>
                            <button onClick={() => handleCancel(p)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50" title="Cancel"><Ban size={15} /></button>
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
      </div>
    </div>
  );
}
