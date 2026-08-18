import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { GraduationCap, Plus, Pencil, Trash2, X, Users, Clock, Calendar } from 'lucide-react';

export default function TrainingPage() {
    const [programs, setPrograms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [enrolling, setEnrolling] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({ title: '', description: '', instructor: '', duration_hours: '', start_date: '', end_date: '', max_participants: '', cost: '' });
    const [saving, setSaving] = useState(false);
    const [statusFilter, setStatusFilter] = useState('');

    const fetchPrograms = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/owner/hr/training', { params });
            setPrograms(res.data.data || res.data || []);
        } catch { setPrograms([]); } finally { setLoading(false); }
    }, [statusFilter]);

    const fetchEmployees = useCallback(async () => {
        try { const res = await api.get('/owner/hr/employees', { params: { per_page: 200 } }); setEmployees(res.data.data || res.data || []); } catch { setEmployees([]); }
    }, []);

    useEffect(() => { fetchPrograms(); fetchEmployees(); }, [fetchPrograms, fetchEmployees]);

    const resetForm = () => { setForm({ title: '', description: '', instructor: '', duration_hours: '', start_date: '', end_date: '', max_participants: '', cost: '' }); setEditing(null); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = { ...form };
            if (!payload.duration_hours) delete payload.duration_hours;
            if (!payload.max_participants) delete payload.max_participants;
            if (!payload.cost) delete payload.cost;
            if (editing) {
                await api.put(`/owner/hr/training/${editing.id}`, { title: payload.title, description: payload.description, status: editing.status });
            } else {
                await api.post('/owner/hr/training', payload);
            }
            setShowForm(false); resetForm(); fetchPrograms();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
    };

    const handleStatusChange = async (program, status) => {
        try { await api.put(`/owner/hr/training/${program.id}`, { status }); fetchPrograms(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleEnroll = async (program, employeeId) => {
        try {
            await api.post(`/owner/hr/training/${program.id}/enroll`, { employee_id: employeeId });
            setEnrolling(null); fetchPrograms();
        } catch (err) { alert(err.response?.data?.message || 'Failed to enroll'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this training program?')) return;
        try { await api.delete(`/owner/hr/training/${id}`); fetchPrograms(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const openEdit = (p) => {
        setEditing(p);
        setForm({ title: p.title || '', description: p.description || '', instructor: p.instructor || '', duration_hours: p.duration_hours || '', start_date: p.start_date?.split('T')[0] || '', end_date: p.end_date?.split('T')[0] || '', max_participants: p.max_participants || '', cost: p.cost || '' });
        setShowForm(true);
    };

    const statusColor = (s) => ({ planned: 'bg-blue-100 text-blue-700', active: 'bg-green-100 text-green-700', completed: 'bg-gray-100 text-gray-600', cancelled: 'bg-red-100 text-red-600' }[s] || 'bg-gray-100 text-gray-500');

    const fmt = (n) => new Intl.NumberFormat('en-TZ').format(n || 0);

    return (
        <div className="space-y-6">
            <PageHeader title="Training Programs" subtitle="Manage employee training and development" icon={<GraduationCap size={20} />}
                actions={<button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Program</button>} />

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Program' : 'New Training Program'}</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Program Title *</label>
                                <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Customer Service Excellence" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                                <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Program description..." className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Instructor</label>
                                <input type="text" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} placeholder="Trainer name" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Duration (hours)</label>
                                <input type="number" min="1" value={form.duration_hours} onChange={(e) => setForm({ ...form, duration_hours: e.target.value })} placeholder="e.g. 8" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Start Date</label>
                                <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">End Date</label>
                                <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Max Participants</label>
                                <input type="number" min="0" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Cost (TZS)</label>
                                <input type="number" min="0" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {/* Filters */}
            <div className="flex gap-2">
                {['', 'planned', 'active', 'completed', 'cancelled'].map(s => (
                    <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-[#00D4AA] text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-[#00D4AA]'}`}>
                        {s || 'All'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : programs.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <GraduationCap className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No training programs found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {programs.map(p => (
                        <div key={p.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusColor(p.status)}`}>{p.status}</span>
                                <div className="flex gap-1">
                                    {p.status === 'planned' && <button onClick={() => handleStatusChange(p, 'active')} className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg" title="Start"><Clock size={14} /></button>}
                                    {p.status === 'active' && <button onClick={() => handleStatusChange(p, 'completed')} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg" title="Complete"><Clock size={14} /></button>}
                                    <button onClick={() => openEdit(p)} className="p-1.5 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={14} /></button>
                                    <button onClick={() => handleDelete(p.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                                </div>
                            </div>
                            <h3 className="text-sm font-bold text-gray-900 mb-1">{p.title}</h3>
                            {p.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
                            <div className="space-y-1.5 text-xs text-gray-500">
                                {p.instructor && <div className="flex items-center gap-1.5"><Users size={12} /> {p.instructor}</div>}
                                {p.duration_hours && <div className="flex items-center gap-1.5"><Clock size={12} /> {p.duration_hours}h</div>}
                                {p.start_date && <div className="flex items-center gap-1.5"><Calendar size={12} /> {p.start_date?.split('T')[0]}</div>}
                                {p.cost > 0 && <div className="text-xs font-medium text-gray-700">TZS {fmt(p.cost)}</div>}
                            </div>
                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-xs text-gray-400">{p.enrollments_count || 0} enrolled</span>
                                <button onClick={() => setEnrolling(p)} className="text-xs font-medium text-[#00b894] hover:underline">+ Enroll</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Enroll modal */}
            {enrolling && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16" onClick={() => setEnrolling(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-900">Enroll Employee</h2>
                            <button onClick={() => setEnrolling(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">Program: <strong>{enrolling.title}</strong></p>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Select Employee</label>
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                    {employees.map(emp => (
                                        <button key={emp.id} onClick={() => handleEnroll(enrolling, emp.id)} className="w-full text-left px-4 py-3 hover:bg-[#00D4AA]/10 border-b border-gray-50 last:border-0 transition-colors">
                                            <div className="text-sm font-medium text-gray-900">{emp.name || emp.employee_number}</div>
                                            <div className="text-xs text-gray-500">{emp.position || emp.department?.name || ''}</div>
                                        </button>
                                    ))}
                                    {employees.length === 0 && <p className="px-4 py-6 text-sm text-gray-500 text-center">No employees found</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
