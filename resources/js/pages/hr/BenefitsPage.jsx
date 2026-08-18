import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Heart, Plus, Pencil, Trash2, X, UserPlus, UserMinus, Users } from 'lucide-react';

export default function BenefitsPage() {
    const [benefits, setBenefits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [assigning, setAssigning] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [form, setForm] = useState({ name: '', description: '', provider: '', cost_per_employee: '', type: 'insurance' });
    const [enrollDate, setEnrollDate] = useState(new Date().toISOString().split('T')[0]);
    const [saving, setSaving] = useState(false);

    const fetchBenefits = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/owner/hr/benefits'); setBenefits(res.data.data || res.data || []); } catch { setBenefits([]); } finally { setLoading(false); }
    }, []);

    const fetchEmployees = useCallback(async () => {
        try { const res = await api.get('/owner/hr/employees', { params: { per_page: 200 } }); setEmployees(res.data.data || res.data || []); } catch { setEmployees([]); }
    }, []);

    useEffect(() => { fetchBenefits(); fetchEmployees(); }, [fetchBenefits, fetchEmployees]);

    const resetForm = () => { setForm({ name: '', description: '', provider: '', cost_per_employee: '', type: 'insurance' }); setEditing(null); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const payload = { ...form };
            if (!payload.cost_per_employee) delete payload.cost_per_employee;
            if (editing) {
                await api.put(`/owner/hr/benefits/${editing.id}`, payload);
            } else {
                await api.post('/owner/hr/benefits', payload);
            }
            setShowForm(false); resetForm(); fetchBenefits();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
    };

    const handleAssign = async (benefit, employeeId) => {
        try {
            await api.post(`/owner/hr/benefits/${benefit.id}/assign`, { employee_id: employeeId, enrollment_date: enrollDate });
            setAssigning(null); fetchBenefits();
        } catch (err) { alert(err.response?.data?.message || 'Failed to assign'); }
    };

    const handleUnassign = async (assignmentId) => {
        if (!confirm('Remove this employee from the benefit?')) return;
        try { await api.delete(`/owner/hr/benefits/assignments/${assignmentId}`); fetchBenefits(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this benefit? All assignments will be removed.')) return;
        try { await api.delete(`/owner/hr/benefits/${id}`); fetchBenefits(); } catch (err) { alert(err.response?.data?.message || 'Failed'); }
    };

    const openEdit = (b) => {
        setEditing(b);
        setForm({ name: b.name || '', description: b.description || '', provider: b.provider || '', cost_per_employee: b.cost_per_employee || '', type: b.type || 'insurance' });
        setShowForm(true);
    };

    const typeColor = (t) => ({ insurance: 'bg-blue-100 text-blue-700', allowance: 'bg-green-100 text-green-700', pension: 'bg-purple-100 text-purple-700', other: 'bg-gray-100 text-gray-600' }[t] || 'bg-gray-100 text-gray-500');

    const fmt = (n) => new Intl.NumberFormat('en-TZ').format(n || 0);

    return (
        <div className="space-y-6">
            <PageHeader title="Employee Benefits" subtitle="Manage benefits programs and enrollments" icon={<Heart size={20} />}
                actions={<button onClick={() => { resetForm(); setShowForm(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Benefit</button>} />

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{editing ? 'Edit Benefit' : 'New Benefit'}</h3>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Benefit Name *</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Health Insurance" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Type</label>
                                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">
                                    <option value="insurance">Insurance</option>
                                    <option value="allowance">Allowance</option>
                                    <option value="pension">Pension</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Provider</label>
                                <input type="text" value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} placeholder="Insurance/company name" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Cost per Employee (TZS)</label>
                                <input type="number" min="0" value={form.cost_per_employee} onChange={(e) => setForm({ ...form, cost_per_employee: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
                                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : benefits.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                    <Heart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No benefits configured yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {benefits.map(b => (
                        <div key={b.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-gray-900">{b.name}</h3>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${typeColor(b.type)}`}>{b.type}</span>
                                    </div>
                                    {b.description && <p className="text-xs text-gray-500 mt-1">{b.description}</p>}
                                </div>
                                <div className="flex gap-1">
                                    <button onClick={() => setAssigning(b)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg" title="Assign employee"><UserPlus size={16} /></button>
                                    <button onClick={() => openEdit(b)} className="p-2 text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg"><Pencil size={16} /></button>
                                    <button onClick={() => handleDelete(b.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                {b.provider && <span>Provider: {b.provider}</span>}
                                {b.cost_per_employee > 0 && <span className="font-medium text-gray-700">TZS {fmt(b.cost_per_employee)}/mo</span>}
                                <span className="flex items-center gap-1"><Users size={12} /> {b.employee_benefits_count || 0} employees</span>
                            </div>
                            {b.employee_benefits?.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-gray-100">
                                    <div className="flex flex-wrap gap-2">
                                        {b.employee_benefits.filter(eb => eb.status === 'active').map(eb => (
                                            <div key={eb.id} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1">
                                                <span className="text-xs text-gray-700">{eb.employee?.name || eb.employee?.employee_number || `Emp #${eb.employee_id}`}</span>
                                                <button onClick={() => handleUnassign(eb.id)} className="text-gray-400 hover:text-red-500" title="Remove"><UserMinus size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Assign modal */}
            {assigning && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16" onClick={() => setAssigning(null)}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-900">Assign Benefit</h2>
                            <button onClick={() => setAssigning(null)} className="p-2 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">Benefit: <strong>{assigning.name}</strong></p>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Enrollment Date</label>
                                <input type="date" value={enrollDate} onChange={(e) => setEnrollDate(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Select Employee</label>
                                <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                                    {employees.map(emp => (
                                        <button key={emp.id} onClick={() => handleAssign(assigning, emp.id)} className="w-full text-left px-4 py-3 hover:bg-[#00D4AA]/10 border-b border-gray-50 last:border-0 transition-colors">
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
