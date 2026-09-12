import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Building, Plus, Search, Edit2, Trash2, Eye } from 'lucide-react';
import Modal from '../../components/Modal';

const fmt = (n) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 0 }).format(n || 0);

const METHODS = { straight_line: 'Straight Line', declining_balance: 'Declining Balance', sum_of_years: 'Sum of Years', units_of_production: 'Units of Production' };
const STATUSES = { active: 'bg-green-100 text-green-700', disposed: 'bg-gray-100 text-gray-600', fully_depreciated: 'bg-yellow-100 text-yellow-700', sold: 'bg-red-100 text-red-700' };

const EMPTY = { name: '', purchase_date: '', purchase_price: '', salvage_value: '', useful_life_months: '', depreciation_method: 'straight_line', category_account_id: '', depreciation_account_id: '', location_id: '', notes: '' };

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/owner/finance/fixed-assets', { params: search ? { search } : {} }); setAssets(Array.isArray(res.data?.data) ? res.data.data : []); }
    catch (err) { console.error('fetch assets', err); setAssets([]); } finally { setLoading(false); }
  }, [search]);

  const fetchMeta = useCallback(async () => {
    try {
      const [a, c] = await Promise.all([
        api.get('/owner/finance/accounts', { params: { per_page: 100 } }),
        api.get('/owner/finance/cost-centers'),
      ]);
      setAccounts((a.data?.data && Array.isArray(a.data.data)) ? a.data.data : []);
      setCenters(Array.isArray(c.data) ? c.data : []);
    } catch (err) { console.error('fetch accounts/cost centers', err); }
  }, []);

  useEffect(() => { fetchAssets(); fetchMeta(); }, [fetchAssets, fetchMeta]);

  const openNew = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };

  const handleEdit = (a) => {
    setForm({
      name: a.name, purchase_date: a.purchase_date, purchase_price: a.purchase_price,
      salvage_value: a.salvage_value || '', useful_life_months: a.useful_life_months,
      depreciation_method: a.depreciation_method, category_account_id: a.category_account_id || '',
      depreciation_account_id: a.depreciation_account_id || '', location_id: a.location_id || '',
      notes: a.notes || '',
    });
    setEditing(a); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = {
        name: form.name,
        purchase_date: form.purchase_date,
        purchase_price: Number(form.purchase_price),
        salvage_value: Number(form.salvage_value || 0),
        useful_life_months: Number(form.useful_life_months),
        depreciation_method: form.depreciation_method,
        category_account_id: Number(form.category_account_id),
        depreciation_account_id: Number(form.depreciation_account_id),
        location_id: form.location_id ? Number(form.location_id) : null,
        notes: form.notes || null,
      };
      if (editing) await api.put(`/owner/finance/fixed-assets/${editing.id}`, payload);
      else await api.post('/owner/finance/fixed-assets', payload);
      setShowForm(false); setEditing(null); setForm(EMPTY); fetchAssets();
    } catch (err) { alert(err.response?.data?.message || 'Failed to save fixed asset'); } finally { setSaving(false); }
  };

  const handleDelete = async (a) => {
    if (!confirm(`Delete fixed asset "${a.name}"?`)) return;
    try { await api.delete(`/owner/finance/fixed-assets/${a.id}`); if (showDetail?.id === a.id) { setShowDetail(null); setDetail(null); } fetchAssets(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete'); }
  };

  const handleDepreciate = async (a) => {
    if (!confirm(`Run depreciation for "${a.name}"?`)) return;
    try { await api.post(`/owner/finance/fixed-assets/${a.id}/depreciate`); alert('Depreciation recorded'); setShowDetail(null); setDetail(null); fetchAssets(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDispose = async (a) => {
    const price = prompt(`Disposal price for "${a.name}" (TZS):`, a.net_book_value || '');
    if (price === null) return;
    const disposalPrice = Number(price);
    if (isNaN(disposalPrice) || disposalPrice < 0) { alert('Enter a valid disposal price'); return; }
    try { await api.post(`/owner/finance/fixed-assets/${a.id}/dispose`, { disposal_date: new Date().toISOString().slice(0, 10), disposal_price: disposalPrice }); alert('Asset disposed'); setShowDetail(null); setDetail(null); fetchAssets(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to dispose'); }
  };

  const openDetail = async (a) => {
    setShowDetail(a); setDetail(null);
    try { const res = await api.get(`/owner/finance/fixed-assets/${a.id}`); setDetail(res.data); } catch { setDetail(a); }
  };

  const inputCls = 'w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]';

  return (
    <div className="space-y-6">
      <PageHeader title="Fixed Assets" subtitle="Track assets and manage depreciation" icon={Building}
        actions={<button onClick={openNew}
          className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> New Asset
        </button>} />

      {showForm && (
        <Modal isOpen={true} onClose={() => { setShowForm(false); setEditing(null); }} title={`${editing ? 'Edit' : 'New'} Fixed Asset`} size="lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Purchase Date *</label>
                <input type="date" required value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Purchase Cost (TZS) *</label>
                <input type="number" min="0" required value={form.purchase_price} onChange={e => setForm({...form, purchase_price: e.target.value})} className={inputCls} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Salvage Value (TZS)</label>
                <input type="number" min="0" value={form.salvage_value} onChange={e => setForm({...form, salvage_value: e.target.value})} className={inputCls} /></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Useful Life (months) *</label>
                <input type="number" min="1" required value={form.useful_life_months} onChange={e => setForm({...form, useful_life_months: e.target.value})} className={inputCls} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Assigned Asset Account *</label>
                <select required value={form.category_account_id} onChange={e => setForm({...form, category_account_id: e.target.value})} className={inputCls}>
                  <option value="">Select account…</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name} ({a.type || ''})</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Depreciation Expense Account *</label>
                <select required value={form.depreciation_account_id} onChange={e => setForm({...form, depreciation_account_id: e.target.value})} className={inputCls}>
                  <option value="">Select account…</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.code} — {a.name} ({a.type || ''})</option>)}
                </select></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Depreciation Method</label>
                <select value={form.depreciation_method} onChange={e => setForm({...form, depreciation_method: e.target.value})} className={inputCls}>
                  {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Location (Cost Center)</label>
                <select value={form.location_id} onChange={e => setForm({...form, location_id: e.target.value})} className={inputCls}>
                  <option value="">None</option>
                  {centers.map(c => <option key={c.id} value={c.id}>{c.code ? `${c.code} — ` : ''}{c.name}</option>)}
                </select></div>
            </div>
            <div><label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
              <textarea value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} rows={2} className={inputCls} /></div>
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
            </div>
          </form>
        </Modal>
      )}

      {showDetail && (
        <Modal isOpen={true} onClose={() => { setShowDetail(null); setDetail(null); }} title={showDetail.name} size="lg">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500 text-xs">Asset Code</span><p className="font-mono font-medium">{showDetail.asset_code}</p></div>
              <div><span className="text-gray-500 text-xs">Status</span><p><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUSES[showDetail.status] || ''}`}>{showDetail.status?.replace('_', ' ')}</span></p></div>
              <div><span className="text-gray-500 text-xs">Asset Account</span><p className="font-medium">{detail?.category_account?.name || showDetail.category_account?.name || '-'}</p></div>
              <div><span className="text-gray-500 text-xs">Depreciation Account</span><p className="font-medium">{detail?.depreciation_account?.name || '-'}</p></div>
              <div><span className="text-gray-500 text-xs">Purchase Date</span><p className="font-medium">{showDetail.purchase_date}</p></div>
              <div><span className="text-gray-500 text-xs">Location</span><p className="font-medium">{detail?.location?.name || showDetail.location?.name || '-'}</p></div>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Financial Details</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500 text-xs">Purchase Cost</span><p className="font-bold">TZS {fmt((detail || showDetail).purchase_price)}</p></div>
                <div><span className="text-gray-500 text-xs">Salvage Value</span><p className="font-medium">TZS {fmt((detail || showDetail).salvage_value)}</p></div>
                <div><span className="text-gray-500 text-xs">Accumulated Depreciation</span><p className="font-bold text-orange-600">TZS {fmt((detail || showDetail).accumulated_depreciation)}</p></div>
                <div><span className="text-gray-500 text-xs">Net Book Value</span><p className="font-bold text-green-600">TZS {fmt((detail || showDetail).net_book_value)}</p></div>
                <div><span className="text-gray-500 text-xs">Monthly Depreciation</span><p className="font-medium">TZS {fmt((detail || showDetail).monthly_depreciation)}</p></div>
                <div><span className="text-gray-500 text-xs">Depreciation Method</span><p className="font-medium capitalize">{METHODS[(detail || showDetail).depreciation_method] || (detail || showDetail).depreciation_method}</p></div>
              </div>
            </div>
            {(detail?.notes || showDetail.notes) && (
              <div className="border-t pt-4 text-sm"><span className="text-gray-500 text-xs">Notes: </span><span>{detail?.notes || showDetail.notes}</span></div>
            )}
            <div className="border-t pt-4 flex gap-2">
              <button onClick={() => { setShowDetail(null); setDetail(null); handleDepreciate(showDetail); }} disabled={showDetail.status !== 'active'}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all disabled:opacity-40">Run Depreciation</button>
              <button onClick={() => handleDispose(showDetail)} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-300 transition-all">Dispose</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
      ) : assets.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><Building size={48} className="mx-auto mb-4 text-gray-300" /><p>No fixed assets found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map(a => (
            <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="text-xs font-mono text-gray-500">{a.asset_code}</span>
                  <h4 className="font-bold text-gray-900">{a.name}</h4>
                  {a.category_account?.name && <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{a.category_account.name}</span>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUSES[a.status]}`}>{a.status?.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div><span className="text-gray-500">Cost</span><p className="font-bold">TZS {fmt(a.purchase_price)}</p></div>
                <div><span className="text-gray-500">Book Value</span><p className="font-bold text-green-600">TZS {fmt(a.net_book_value)}</p></div>
                <div><span className="text-gray-500">Depreciated</span><p className="font-medium text-orange-600">TZS {fmt(a.accumulated_depreciation)}</p></div>
                <div><span className="text-gray-500">Monthly</span><p className="font-medium">TZS {fmt(a.monthly_depreciation)}</p></div>
              </div>
              <div className="flex gap-1 pt-3 border-t">
                <button onClick={() => openDetail(a)} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"><Eye size={12} /> Detail</button>
                <button onClick={() => handleEdit(a)} className="flex-1 px-3 py-1.5 text-xs font-medium text-[#00D4AA] bg-[#00D4AA]/10 rounded-lg hover:bg-[#00D4AA]/20 flex items-center justify-center gap-1"><Edit2 size={12} /> Edit</button>
                <button onClick={() => handleDepreciate(a)} className="flex-1 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100">Depr.</button>
                <button onClick={() => handleDelete(a)} className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}