import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Users, Plus, Pencil, Trash2, X, Phone, Mail, Building, Target, TrendingUp, Calendar, CheckCircle } from 'lucide-react';

const STATUS_COLORS = { new: 'bg-blue-100 text-blue-700', contacted: 'bg-yellow-100 text-yellow-700', qualified: 'bg-purple-100 text-purple-700', proposal: 'bg-indigo-100 text-indigo-700', negotiation: 'bg-orange-100 text-orange-700', won: 'bg-green-100 text-green-700', lost: 'bg-red-100 text-red-600' };
const STAGE_COLORS = { prospecting: 'bg-gray-100 text-gray-700', qualification: 'bg-blue-100 text-blue-700', proposal: 'bg-indigo-100 text-indigo-700', negotiation: 'bg-orange-100 text-orange-700', closed_won: 'bg-green-100 text-green-700', closed_lost: 'bg-red-100 text-red-600' };
const ACTIVITY_ICONS = { call: Phone, email: Mail, meeting: Users, task: Target, note: TrendingUp };

const TAB_HEADERS = {
    leads: ['Name', 'Company', 'Source', 'Value', 'Status'],
    deals: ['Title', 'Amount', 'Stage', 'Close Date'],
    activities: ['Type', 'Subject', 'Due', 'Status'],
    campaigns: ['Name', 'Type', 'Budget', 'Status'],
};

export default function CrmPage() {
    const [tab, setTab] = useState('leads');
    const [summary, setSummary] = useState({});
    const [leads, setLeads] = useState([]);
    const [deals, setDeals] = useState([]);
    const [activities, setActivities] = useState([]);
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [filter, setFilter] = useState('');
    const [search, setSearch] = useState('');

    const fetchSummary = useCallback(async () => { try { const r = await api.get('/owner/crm/summary'); setSummary(r.data); } catch (error) { console.error('Failed to fetch CRM summary:', error); } }, []);

    const fetchLeads = useCallback(async () => {
        setLoading(true);
        try { const p = {}; if (filter) p.status = filter; if (search) p.search = search; const r = await api.get('/owner/crm/leads', { params: p }); setLeads(r.data.data || []); } catch (error) { console.error('Failed to fetch leads:', error); setLeads([]); } finally { setLoading(false); }
    }, [filter, search]);

    const fetchDeals = useCallback(async () => {
        setLoading(true);
        try { const p = {}; if (filter) p.stage = filter; const r = await api.get('/owner/crm/deals', { params: p }); setDeals(r.data.data || []); } catch (error) { console.error('Failed to fetch deals:', error); setDeals([]); } finally { setLoading(false); }
    }, [filter]);

    const fetchActivities = useCallback(async () => {
        setLoading(true);
        try { const p = {}; if (filter) p.type = filter; const r = await api.get('/owner/crm/activities', { params: p }); setActivities(r.data.data || []); } catch (error) { console.error('Failed to fetch activities:', error); setActivities([]); } finally { setLoading(false); }
    }, [filter]);

    const fetchCampaigns = useCallback(async () => {
        setLoading(true);
        try { const p = {}; if (filter) p.status = filter; const r = await api.get('/owner/crm/campaigns', { params: p }); setCampaigns(r.data.data || []); } catch (error) { console.error('Failed to fetch campaigns:', error); setCampaigns([]); } finally { setLoading(false); }
    }, [filter]);

    useEffect(() => { fetchSummary(); }, [fetchSummary]);
    useEffect(() => { setFilter(''); setSearch(''); }, [tab]);
    useEffect(() => { if (tab === 'leads') fetchLeads(); else if (tab === 'deals') fetchDeals(); else if (tab === 'activities') fetchActivities(); else if (tab === 'campaigns') fetchCampaigns(); }, [tab, fetchLeads, fetchDeals, fetchActivities, fetchCampaigns]);

    const resetForm = () => { setForm({}); setEditing(null); };

    const openNew = () => {
        resetForm();
        if (tab === 'leads') setForm({ name: '', email: '', phone: '', company: '', source: 'other', estimated_value: '', notes: '' });
        else if (tab === 'deals') setForm({ title: '', amount: '', stage: 'prospecting', expected_close_date: '', notes: '' });
        else if (tab === 'activities') setForm({ type: 'note', subject: '', description: '', due_date: '' });
        else if (tab === 'campaigns') setForm({ name: '', description: '', type: 'other', budget: '', start_date: '', end_date: '' });
        setShowForm(true);
    };

    const openEdit = (item) => { setEditing(item); setForm({ ...item, expected_close_date: item.expected_close_date?.split('T')[0] || '', due_date: item.due_date?.split('T')[0] || '', start_date: item.start_date?.split('T')[0] || '', end_date: item.end_date?.split('T')[0] || '' }); setShowForm(true); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const prefix = '/owner/crm';
            const endpoints = { leads: 'leads', deals: 'deals', activities: 'activities', campaigns: 'campaigns' };
            const ep = endpoints[tab];
            if (editing) { await api.put(`${prefix}/${ep}/${editing.id}`, form); }
            else { await api.post(`${prefix}/${ep}`, form); }
            setShowForm(false); resetForm(); fetchSummary();
            if (tab === 'leads') fetchLeads(); else if (tab === 'deals') fetchDeals(); else if (tab === 'activities') fetchActivities(); else fetchCampaigns();
        } catch (err) { console.error('Failed to save CRM entity:', err); alert(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
    };

    const handleDelete = async (item) => {
        if (!confirm('Delete this item?')) return;
        try {
            const endpoints = { leads: 'leads', deals: 'deals', activities: 'activities', campaigns: 'campaigns' };
            await api.delete(`/owner/crm/${endpoints[tab]}/${item.id}`);
            fetchSummary();
            if (tab === 'leads') fetchLeads(); else if (tab === 'deals') fetchDeals(); else if (tab === 'activities') fetchActivities(); else fetchCampaigns();
        } catch (err) { console.error('Failed to delete:', err); alert(err.response?.data?.message || 'Failed'); }
    };

    const handleComplete = async (activity) => {
        try { await api.post(`/owner/crm/activities/${activity.id}/complete`); fetchActivities(); } catch (err) { console.error('Failed to complete activity:', err); alert(err.response?.data?.message); }
    };

    const fmt = (n) => new Intl.NumberFormat('en-TZ').format(n || 0);

    const tabs = ['leads', 'deals', 'activities', 'campaigns'];
    const tabFilters = {
        leads: ['', 'new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
        deals: ['', 'prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
        activities: ['', 'call', 'email', 'meeting', 'task', 'note'],
        campaigns: ['', 'draft', 'active', 'paused', 'completed'],
    };

    return (
        <div className="space-y-6">
            <PageHeader title="CRM" subtitle="Manage leads, deals, activities and campaigns" icon={<Users size={20} />} />

            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: 'Total Leads', value: summary.total_leads, sub: `${summary.new_leads || 0} new`, color: 'blue' },
                  { label: 'Open Deals', value: summary.open_deals, sub: `TZS ${fmt(summary.open_deals_value)}`, color: 'purple' },
                  { label: 'Won Deals', value: summary.won_leads, sub: `TZS ${fmt(summary.won_deals_value)}`, color: 'green' },
                  { label: 'Pending Tasks', value: summary.pending_activities, sub: `${summary.active_campaigns || 0} campaigns`, color: 'orange' }
                ].map((c, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <p className="text-xs text-gray-500">{c.label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{c.value || 0}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                {tabs.map(t => (
                    <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${tab === t ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>{t}</button>
                ))}
            </div>

            <div className="flex gap-3 items-center">
                <button onClick={openNew} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New {tab.slice(0, -1)}</button>
                {tab === 'leads' && <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />}
                <div className="flex gap-1 flex-wrap">
                    {tabFilters[tab].map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${filter === f ? 'bg-[#00D4AA] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#00D4AA]'}`}>{f || 'All'}</button>
                    ))}
                </div>
            </div>

            {/* Form */}
            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit' : 'New'} {tab.slice(0, -1)}</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tab === 'leads' && (<>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label><input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Email</label><input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label><input value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Company</label><input value={form.company || ''} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Source</label><select value={form.source || 'other'} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">{['website','referral','social_media','cold_call','advertisement','other'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Est. Value (TZS)</label><input type="number" min="0" value={form.estimated_value || ''} onChange={e => setForm({ ...form, estimated_value: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                {editing && <div><label className="text-sm font-medium text-gray-700 mb-1 block">Status</label><select value={form.status || 'new'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">{['new','contacted','qualified','proposal','negotiation','won','lost'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>}
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label><textarea rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            </>)}
                            {tab === 'deals' && (<>
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Title *</label><input required value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Amount (TZS)</label><input type="number" min="0" value={form.amount || ''} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Stage</label><select value={form.stage || 'prospecting'} onChange={e => setForm({ ...form, stage: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">{['prospecting','qualification','proposal','negotiation','closed_won','closed_lost'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Expected Close</label><input type="date" value={form.expected_close_date || ''} onChange={e => setForm({ ...form, expected_close_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label><textarea rows={2} value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            </>)}
                            {tab === 'activities' && (<>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Type *</label><select required value={form.type || 'note'} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">{['call','email','meeting','task','note'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Due Date</label><input type="date" value={form.due_date || ''} onChange={e => setForm({ ...form, due_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Subject *</label><input required value={form.subject || ''} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Description</label><textarea rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            </>)}
                            {tab === 'campaigns' && (<>
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label><input required value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Type</label><select value={form.type || 'other'} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">{['email','sms','social_media','event','other'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}</select></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Budget (TZS)</label><input type="number" min="0" value={form.budget || ''} onChange={e => setForm({ ...form, budget: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label><input type="date" value={form.start_date || ''} onChange={e => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                <div><label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label><input type="date" value={form.end_date || ''} onChange={e => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                                {editing && <div><label className="text-sm font-medium text-gray-700 mb-1 block">Status</label><select value={form.status || 'draft'} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">{['draft','active','paused','completed'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>}
                                <div className="md:col-span-2"><label className="text-sm font-medium text-gray-700 mb-1 block">Description</label><textarea rows={2} value={form.description || ''} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            </>)}
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead><tr className="border-b border-gray-100">
                            {(TAB_HEADERS[tab] || []).map(h => <th key={h} className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">{h}</th>)}
                            <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                        </tr></thead>
                        <tbody>
                            {tab === 'leads' && leads.map(l => (
                                <tr key={l.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3"><span className="text-sm font-semibold text-gray-900">{l.name}</span>{l.email && <span className="block text-xs text-gray-400">{l.email}</span>}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{l.company || '-'}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{l.source?.replace('_', ' ')}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-gray-700">TZS {fmt(l.estimated_value)}</td>
                                    <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[l.status] || 'bg-gray-100 text-gray-500'}`}>{l.status}</span></td>
                                    <td className="px-6 py-3"><div className="flex items-center justify-end gap-1"><button onClick={() => openEdit(l)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={14} /></button><button onClick={() => handleDelete(l)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button></div></td>
                                </tr>
                            ))}
                            {tab === 'deals' && deals.map(d => (
                                <tr key={d.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3"><span className="text-sm font-semibold text-gray-900">{d.title}</span></td>
                                    <td className="px-6 py-3 text-sm font-medium text-gray-700">TZS {fmt(d.amount)}</td>
                                    <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STAGE_COLORS[d.stage] || 'bg-gray-100 text-gray-500'}`}>{d.stage?.replace('_', ' ')}</span></td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{d.expected_close_date ? new Date(d.expected_close_date).toLocaleDateString() : '-'}</td>
                                    <td className="px-6 py-3"><div className="flex items-center justify-end gap-1"><button onClick={() => openEdit(d)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={14} /></button><button onClick={() => handleDelete(d)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button></div></td>
                                </tr>
                            ))}
                            {tab === 'activities' && activities.map(a => {
                                const Icon = ACTIVITY_ICONS[a.type] || TrendingUp;
                                return (
                                    <tr key={a.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3"><div className="flex items-center gap-2"><Icon size={14} className="text-gray-400" /><span className="text-sm font-medium text-gray-700 capitalize">{a.type}</span></div></td>
                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">{a.subject}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}</td>
                                        <td className="px-6 py-3">{a.completed ? <span className="inline-flex items-center gap-1 text-xs text-green-600"><CheckCircle size={12} /> Done</span> : <button onClick={() => handleComplete(a)} className="text-xs text-[#00b894] hover:underline">Complete</button>}</td>
                                        <td className="px-6 py-3"><div className="flex items-center justify-end gap-1"><button onClick={() => openEdit(a)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={14} /></button><button onClick={() => handleDelete(a)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button></div></td>
                                    </tr>
                                );
                            })}
                            {tab === 'campaigns' && campaigns.map(c => (
                                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3"><span className="text-sm font-semibold text-gray-900">{c.name}</span></td>
                                    <td className="px-6 py-3 text-sm text-gray-600 capitalize">{c.type?.replace('_', ' ')}</td>
                                    <td className="px-6 py-3 text-sm font-medium text-gray-700">TZS {fmt(c.budget)}</td>
                                    <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[c.status] || 'bg-gray-100 text-gray-500'}`}>{c.status}</span></td>
                                    <td className="px-6 py-3"><div className="flex items-center justify-end gap-1"><button onClick={() => openEdit(c)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={14} /></button><button onClick={() => handleDelete(c)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button></div></td>
                                </tr>
                            ))}
                            {((tab === 'leads' && !leads.length) || (tab === 'deals' && !deals.length) || (tab === 'activities' && !activities.length) || (tab === 'campaigns' && !campaigns.length)) && (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">No {tab} found.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
