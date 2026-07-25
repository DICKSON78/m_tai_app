import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Building, Plus, Search, Edit2, Trash2, X, Eye } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 0 }).format(n || 0);

const METHODS = { straight_line: 'Straight Line', declining_balance: 'Declining Balance', units_of_production: 'Units of Production' };
const STATUSES = { active: 'bg-green-100 text-green-700', disposed: 'bg-gray-100 text-gray-600', fully_depreciated: 'bg-yellow-100 text-yellow-700' };

export default function FixedAssetsPage() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', category: '', purchase_date: '', purchase_cost: '', salvage_value: '', useful_life_years: '', depreciation_method: 'straight_line', description: '', location: '', supplier: '' });
  const [saving, setSaving] = useState(false);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    try { const res = await api.get('/owner/finance/fixed-assets', { params: search ? { search } : {} }); setAssets(res.data || []); }
    catch { setAssets([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const payload = { ...form, purchase_cost: Number(form.purchase_cost), salvage_value: Number(form.salvage_value || 0), useful_life_years: Number(form.useful_life_years) };
      if (editing) await api.put(`/owner/finance/fixed-assets/${editing.id}`, payload);
      else await api.post('/owner/finance/fixed-assets', payload);
      setShowForm(false); setEditing(null); resetForm(); fetchAssets();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); } finally { setSaving(false); }
  };

  const handleDelete = async (a) => {
    if (!confirm(`Delete "${a.name}"?`)) return;
    try { await api.delete(`/owner/finance/fixed-assets/${a.id}`); fetchAssets(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDepreciate = async (a) => {
    if (!confirm(`Run depreciation for "${a.name}"?`)) return;
    try { await api.post(`/owner/finance/fixed-assets/${a.id}/depreciate`); alert('Depreciation recorded'); fetchAssets(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleEdit = (a) => {
    setForm({ name: a.name, code: a.code, category: a.category || '', purchase_date: a.purchase_date, purchase_cost: a.purchase_cost, salvage_value: a.salvage_value || '', useful_life_years: a.useful_life_years, depreciation_method: a.depreciation_method, description: a.description || '', location: a.location || '', supplier: a.supplier || '' });
    setEditing(a); setShowForm(true);
  };

  const resetForm = () => setForm({ name: '', code: '', category: '', purchase_date: '', purchase_cost: '', salvage_value: '', useful_life_years: '', depreciation_method: 'straight_line', description: '', location: '', supplier: '' });

  return (
    <div className="space-y-6">
      <PageHeader title="Fixed Assets" subtitle="Track assets and manage depreciation" icon={Building}
        actions={<button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> New Asset
        </button>} />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-2xl mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit' : 'New'} Fixed Asset</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                  <input type="text" required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <input type="text" value={form.category} onChange={e => setForm({...form, category: e.target.value})} placeholder="e.g. Equipment, Vehicle, Building" className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Purchase Date *</label>
                  <input type="date" required value={form.purchase_date} onChange={e => setForm({...form, purchase_date: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Purchase Cost (TZS) *</label>
                  <input type="number" min="0" required value={form.purchase_cost} onChange={e => setForm({...form, purchase_cost: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Salvage Value (TZS)</label>
                  <input type="number" min="0" value={form.salvage_value} onChange={e => setForm({...form, salvage_value: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Useful Life (years) *</label>
                  <input type="number" min="1" required value={form.useful_life_years} onChange={e => setForm({...form, useful_life_years: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Depreciation Method</label>
                <select value={form.depreciation_method} onChange={e => setForm({...form, depreciation_method: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                  {Object.entries(METHODS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Location</label>
                  <input type="text" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Supplier</label>
                  <input type="text" value={form.supplier} onChange={e => setForm({...form, supplier: e.target.value})} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={2} className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-xl mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{showDetail.name}</h3>
              <button onClick={() => setShowDetail(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-gray-500 text-xs">Code</span><p className="font-mono font-medium">{showDetail.code}</p></div>
                <div><span className="text-gray-500 text-xs">Category</span><p className="font-medium">{showDetail.category || '-'}</p></div>
                <div><span className="text-gray-500 text-xs">Status</span><p><span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUSES[showDetail.status] || ''}`}>{showDetail.status?.replace('_', ' ')}</span></p></div>
                <div><span className="text-gray-500 text-xs">Purchase Date</span><p className="font-medium">{showDetail.purchase_date}</p></div>
              </div>
              <div className="border-t pt-4">
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Financial Details</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-gray-500 text-xs">Purchase Cost</span><p className="font-bold">TZS {fmt(showDetail.purchase_cost)}</p></div>
                  <div><span className="text-gray-500 text-xs">Salvage Value</span><p className="font-medium">TZS {fmt(showDetail.salvage_value)}</p></div>
                  <div><span className="text-gray-500 text-xs">Accumulated Depreciation</span><p className="font-bold text-orange-600">TZS {fmt(showDetail.accumulated_depreciation)}</p></div>
                  <div><span className="text-gray-500 text-xs">Net Book Value</span><p className="font-bold text-green-600">TZS {fmt(showDetail.net_book_value)}</p></div>
                  <div><span className="text-gray-500 text-xs">Monthly Depreciation</span><p className="font-medium">TZS {fmt(showDetail.monthly_depreciation)}</p></div>
                  <div><span className="text-gray-500 text-xs">Depreciation Method</span><p className="font-medium capitalize">{METHODS[showDetail.depreciation_method] || showDetail.depreciation_method}</p></div>
                </div>
              </div>
              {(showDetail.location || showDetail.supplier) && (
                <div className="border-t pt-4 text-sm">
                  {showDetail.location && <div className="mb-2"><span className="text-gray-500 text-xs">Location: </span><span>{showDetail.location}</span></div>}
                  {showDetail.supplier && <div><span className="text-gray-500 text-xs">Supplier: </span><span>{showDetail.supplier}</span></div>}
                </div>
              )}
              <div className="border-t pt-4">
                <button onClick={() => { setShowDetail(null); handleDepreciate(showDetail); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all">Run Depreciation</button>
              </div>
            </div>
          </div>
        </div>
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
                  <span className="text-xs font-mono text-gray-500">{a.code}</span>
                  <h4 className="font-bold text-gray-900">{a.name}</h4>
                  {a.category && <span className="text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{a.category}</span>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium capitalize ${STATUSES[a.status]}`}>{a.status?.replace('_', ' ')}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                <div><span className="text-gray-500">Cost</span><p className="font-bold">TZS {fmt(a.purchase_cost)}</p></div>
                <div><span className="text-gray-500">Book Value</span><p className="font-bold text-green-600">TZS {fmt(a.net_book_value)}</p></div>
                <div><span className="text-gray-500">Depreciated</span><p className="font-medium text-orange-600">TZS {fmt(a.accumulated_depreciation)}</p></div>
                <div><span className="text-gray-500">Monthly</span><p className="font-medium">TZS {fmt(a.monthly_depreciation)}</p></div>
              </div>
              <div className="flex gap-1 pt-3 border-t">
                <button onClick={() => setShowDetail(a)} className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-1"><Eye size={12} /> Detail</button>
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
