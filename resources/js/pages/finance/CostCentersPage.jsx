import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Layers, Plus, Search, Edit2, Trash2, X } from 'lucide-react';

const fmt = (n) => new Intl.NumberFormat('en-TZ', { minimumFractionDigits: 0 }).format(n || 0);

export default function CostCentersPage() {
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ code: '', name: '', description: '', parent_id: '', budget_amount: '' });
  const [saving, setSaving] = useState(false);

  const fetchCenters = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      const res = await api.get('/owner/finance/cost-centers', { params });
      setCenters(res.data || []);
    } catch { setCenters([]); } finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchCenters(); }, [fetchCenters]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, budget_amount: form.budget_amount ? Number(form.budget_amount) : 0, parent_id: form.parent_id || null };
      if (editing) {
        await api.put(`/owner/finance/cost-centers/${editing.id}`, payload);
      } else {
        await api.post('/owner/finance/cost-centers', payload);
      }
      setShowForm(false); setEditing(null); resetForm(); fetchCenters();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (center) => {
    if (!confirm(`Delete cost center "${center.name}"?`)) return;
    try { await api.delete(`/owner/finance/cost-centers/${center.id}`); fetchCenters(); }
    catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleEdit = (center) => {
    setForm({ code: center.code, name: center.name, description: center.description || '', parent_id: center.parent_id || '', budget_amount: center.budget_amount || '' });
    setEditing(center); setShowForm(true);
  };

  const resetForm = () => setForm({ code: '', name: '', description: '', parent_id: '', budget_amount: '' });

  const rootCenters = centers.filter(c => !c.parent_id);
  const childCenters = centers.filter(c => c.parent_id);

  return (
    <div className="space-y-6">
      <PageHeader title="Cost Centers" subtitle="Track budgets and expenses by department or project" icon={Layers}
        actions={<button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
          className="px-4 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold flex items-center gap-2 hover:shadow-lg transition-all">
          <Plus size={16} /> New Cost Center
        </button>} />

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-20 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg mx-4 mb-20 shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h3 className="text-lg font-bold text-gray-900">{editing ? 'Edit' : 'New'} Cost Center</h3>
              <button onClick={() => { setShowForm(false); setEditing(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Code *</label>
                  <input type="text" required value={form.code} onChange={e => setForm({...form, code: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                  <input type="text" required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div><label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                <input type="text" value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Parent Center</label>
                  <select value={form.parent_id} onChange={e => setForm({...form, parent_id: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]">
                    <option value="">None (Root)</option>
                    {rootCenters.map(c => <option key={c.id} value={c.id}>{c.code} - {c.name}</option>)}
                  </select></div>
                <div><label className="block text-xs font-medium text-gray-600 mb-1">Budget (TZS)</label>
                  <input type="number" min="0" value={form.budget_amount} onChange={e => setForm({...form, budget_amount: e.target.value})}
                    className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" /></div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 text-sm text-gray-600">Cancel</button>
                <button type="submit" disabled={saving} className="px-6 py-2 bg-gradient-to-r from-[#00D4AA] to-[#00b894] text-white rounded-xl text-sm font-semibold disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search cost centers..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#00D4AA]" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]" /></div>
      ) : centers.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><Layers size={48} className="mx-auto mb-4 text-gray-300" /><p>No cost centers found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rootCenters.map(center => {
            const children = childCenters.filter(c => c.parent_id === center.id);
            const usagePercent = center.budget_amount > 0 ? Math.min((center.spent_amount / center.budget_amount) * 100, 100) : 0;
            return (
              <div key={center.id} className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono text-gray-500">{center.code}</span>
                    <h4 className="font-bold text-gray-900">{center.name}</h4>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(center)} className="p-1.5 text-gray-400 hover:text-[#00D4AA] rounded-lg hover:bg-[#00D4AA]/5"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(center)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 size={14} /></button>
                  </div>
                </div>
                {center.description && <p className="text-xs text-gray-500 mb-3">{center.description}</p>}
                {center.budget_amount > 0 && (
                  <div className="mb-3">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Budget Usage</span>
                      <span className="font-medium">{usagePercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className={`h-2 rounded-full transition-all ${usagePercent > 90 ? 'bg-red-500' : usagePercent > 70 ? 'bg-yellow-500' : 'bg-[#00D4AA]'}`}
                        style={{ width: `${usagePercent}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                      <span>TZS {fmt(center.spent_amount)} spent</span>
                      <span>TZS {fmt(center.budget_amount)} budget</span>
                    </div>
                  </div>
                )}
                {children.length > 0 && (
                  <div className="border-t pt-3 mt-3 space-y-1">
                    <p className="text-[10px] text-gray-500 uppercase font-medium">Sub-Centers ({children.length})</p>
                    {children.map(child => (
                      <div key={child.id} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700">{child.name}</span>
                        <span className="text-gray-500">TZS {fmt(child.spent_amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
