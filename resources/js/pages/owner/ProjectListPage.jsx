import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import SummaryBox from '../../components/casfeta/SummaryBox';
import EmptyState from '../../components/casfeta/EmptyState';
import FormField from '../../components/casfeta/FormField';
import ActionBar from '../../components/casfeta/ActionBar';
import { Rocket, Plus, Pencil, Trash2, TrendingUp, Wallet, Calendar, Search, CheckCircle, XCircle, RefreshCw } from 'lucide-react';

const STATUS_TABS = [
    { key: '', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
];

const STATUS_MAP = {
    active: { label: 'Active', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    completed: { label: 'Completed', badge: 'bg-blue-100 text-blue-600' },
    cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-600' },
};

const ALLOCATION_LABELS = {
    investment: 'Investment',
    life_insurance: 'Life Insurance',
    savings: 'Savings',
    wallet: 'Wallet',
    bata: 'BATA',
};

const emptyForm = { project_name: '', required_capital: '', timeline_months: '', available_capital: '', monthly_savings_capacity: '', start_date: '', notes: '' };

export default function ProjectListPage() {
    document.title = 'Business Projects - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState({ total: 0, active: 0, completed: 0, total_capital: 0 });

    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    const [estimate, setEstimate] = useState(null);
    const [estimating, setEstimating] = useState(false);

    const [deleteId, setDeleteId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        api.get('/owner/businesses').then(res => { const biz = res.data?.data || res.data || []; setBusinesses(biz); if (biz.length === 1) setSelectedBusiness(biz[0].id); }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); });
    }, []);

    const fetchData = useCallback(async () => {
        if (!selectedBusiness) { setProjects([]); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/projects`, { params });
            setProjects(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch (error) { console.error('Failed to fetch projects:', error); setProjects([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage, search, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [selectedBusiness, search, statusFilter]);

    const openCreate = () => { setEditingItem(null); setForm(emptyForm); setFormErrors({}); setEstimate(null); setFormModalOpen(true); };

    const handleEstimate = async () => {
        if (!selectedBusiness) return;
        setEstimating(true);
        try {
            const payload = {
                required_capital: Number(form.required_capital),
                timeline_months: Number(form.timeline_months),
                available_capital: form.available_capital ? Number(form.available_capital) : 0,
                monthly_savings_capacity: form.monthly_savings_capacity ? Number(form.monthly_savings_capacity) : undefined,
                start_date: form.start_date || undefined,
            };
            const res = await api.post(`/owner/businesses/${selectedBusiness}/projects/estimate`, payload);
            setEstimate(res.data?.estimate || res.data || null);
        } catch (error) { console.error('Failed to estimate project:', error); alert(error?.response?.data?.message || 'Failed to estimate project.'); } finally { setEstimating(false); }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSubmitting(true); setFormErrors({});
        try {
            const payload = {
                project_name: form.project_name,
                required_capital: Number(form.required_capital),
                timeline_months: Number(form.timeline_months),
                available_capital: form.available_capital ? Number(form.available_capital) : 0,
                monthly_savings_capacity: form.monthly_savings_capacity ? Number(form.monthly_savings_capacity) : undefined,
                start_date: form.start_date || undefined,
                notes: form.notes || undefined,
            };
            if (editingItem) {
                await api.put(`/owner/businesses/${selectedBusiness}/projects/${editingItem.id}`, { project_name: form.project_name, notes: form.notes });
            } else {
                await api.post(`/owner/businesses/${selectedBusiness}/projects`, payload);
            }
            setFormModalOpen(false); setEditingItem(null); setForm(emptyForm); setEstimate(null); fetchData();
        } catch (error) {
            if (error.response?.status === 422) setFormErrors(error.response.data?.errors || {});
            else { console.error('Failed to save project:', error); alert(error?.response?.data?.message || 'Failed to save project.'); }
        } finally { setSubmitting(false); }
    };

    const handleStatusChange = async (item, newStatus) => {
        try { await api.put(`/owner/businesses/${selectedBusiness}/projects/${item.id}`, { status: newStatus }); fetchData(); } catch (error) { console.error('Failed to update status:', error); alert(error?.response?.data?.message || 'Failed to update status.'); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try { await api.delete(`/owner/businesses/${selectedBusiness}/projects/${deleteId}`); fetchData(); } catch (error) { console.error('Failed to delete project:', error); alert(error?.response?.data?.message || 'Failed to delete project.'); } finally { setDeleteId(null); setDeleteModalOpen(false); }
    };

    const formatCurrency = (val) => `TZS ${Number(val || 0).toLocaleString()}`;

    const renderAllocation = (alloc) => {
        if (!alloc || typeof alloc !== 'object') return null;
        const total = Object.values(alloc).reduce((s, v) => s + Number(v || 0), 0) || 1;
        const colors = ['bg-[#00D4AA]', 'bg-blue-500', 'bg-yellow-500', 'bg-purple-500', 'bg-red-500'];
        return (
            <div className="space-y-2">
                {Object.entries(alloc).map(([key, val], i) => (
                    <div key={key} className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                            <div className={`${colors[i % colors.length]} h-full rounded-full`} style={{ width: `${Math.max((Number(val) / total) * 100, 2)}%` }} />
                        </div>
                        <span className="text-xs text-gray-600 w-28 shrink-0 text-right">{ALLOCATION_LABELS[key] || key}: {val}%</span>
                    </div>
                ))}
            </div>
        );
    };

    const renderSavingsPlan = (plan) => {
        if (!plan) return null;
        return (
            <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Monthly Savings Needed</span><span className="font-semibold text-gray-800">{formatCurrency(plan.monthly_savings_needed)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Savings Capacity</span><span className="font-semibold text-gray-800">{formatCurrency(plan.monthly_savings_capacity)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Expected Total Savings</span><span className="font-semibold text-gray-800">{formatCurrency(plan.expected_total_savings)}</span></div>
                {plan.capital_gap !== undefined && <div className="flex justify-between"><span className="text-gray-500">Capital Gap</span><span className="font-semibold text-red-600">{formatCurrency(plan.capital_gap)}</span></div>}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Business Projects"
                subtitle="Plan your business expansion and capital needs."
                icon={<Rocket size={20} />}
                actions={selectedBusiness && (
                    <button onClick={openCreate} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md">
                        <Plus size={16} /> New Project
                    </button>
                )}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Business</label>
                <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                    <option value="">-- Select Business --</option>
                    {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name || biz.business_name}</option>))}
                </select>
            </div>

            {selectedBusiness && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryBox icon={<Rocket size={18} />} label="Total Projects" value={summary.total} color="text-[#00D4AA]" />
                    <SummaryBox icon={<RefreshCw size={18} />} label="Active" value={summary.active} color="text-[#00B894]" />
                    <SummaryBox icon={<CheckCircle size={18} />} label="Completed" value={summary.completed} color="text-blue-600" />
                    <SummaryBox icon={<Wallet size={18} />} label="Total Capital" value={formatCurrency(summary.total_capital)} color="text-yellow-600" />
                </div>
            )}

            {selectedBusiness && (
                <>
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_TABS.map((tab) => (
                            <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${statusFilter === tab.key ? 'bg-[#00D4AA] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
                        ))}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search projects..." className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                        </div>
                    </div>
                </>
            )}

            {!selectedBusiness ? (
                <EmptyState title="Select a business" description="Choose a business from the dropdown above to view projects." />
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : projects.length === 0 ? (
                <EmptyState title="No projects found" description="Create a project to start planning your business expansion." />
            ) : (
                <div className="space-y-4">
                    {projects.map((row) => {
                        const cfg = STATUS_MAP[row.status] || STATUS_MAP.active;
                        return (
                            <div key={row.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                            <Rocket size={18} className="text-[#00D4AA]" /> {row.project_name}
                                        </h3>
                                        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>{cfg.label}</span>
                                            <span className="inline-flex items-center gap-1"><Calendar size={14} /> Due {row.completion_date ? new Date(row.completion_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</span>
                                            <span className="inline-flex items-center gap-1"><TrendingUp size={14} /> {row.timeline_months} months</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {row.status === 'active' && <button onClick={() => handleStatusChange(row, 'completed')} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-100 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-200 transition-all" title="Mark completed"><CheckCircle size={14} /> Complete</button>}
                                        {row.status === 'active' && <button onClick={() => handleStatusChange(row, 'cancelled')} className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-medium hover:bg-red-200 transition-all" title="Cancel project"><XCircle size={14} /> Cancel</button>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                    <div><p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Required Capital</p><p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(row.required_capital)}</p></div>
                                    <div><p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Recommended Loan</p><p className="text-lg font-bold text-[#00B894] mt-1">{formatCurrency(row.recommended_loan_amount)}</p></div>
                                    <div><p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Completion Date</p><p className="text-lg font-bold text-gray-900 mt-1">{row.completion_date ? new Date(row.completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</p></div>
                                    <div><p className="text-xs uppercase tracking-wider text-gray-400 font-semibold">Timeline</p><p className="text-lg font-bold text-gray-900 mt-1">{row.timeline_months} mo</p></div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <SectionHeader icon={<Wallet size={16} />} title="Savings Plan" />
                                        <div className="mt-3">{renderSavingsPlan(row.savings_plan)}</div>
                                    </div>
                                    <div>
                                        <SectionHeader icon={<TrendingUp size={16} />} title="Capital Allocation (Mkoa)" />
                                        <div className="mt-3">{renderAllocation(row.allocation)}</div>
                                    </div>
                                </div>

                                {row.notes && <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{row.notes}</p>}

                                <div className="flex justify-end gap-2 border-t border-gray-100 pt-3">
                                    <button onClick={() => { setFormModalOpen(false); }} className="hidden" />
                                    <button onClick={() => { setEditingItem(row); setForm({ project_name: row.project_name, notes: row.notes || '', required_capital: row.required_capital, timeline_months: row.timeline_months }); setFormErrors({}); setEstimate(null); setFormModalOpen(true); }} className="inline-flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 rounded-lg text-sm transition-colors"><Pencil size={15} /> Edit</button>
                                    <button onClick={() => { setDeleteId(row.id); setDeleteModalOpen(true); }} className="inline-flex items-center gap-1 px-3 py-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg text-sm transition-colors"><Trash2 size={15} /> Delete</button>
                                </div>
                            </div>
                        );
                    })}
                    <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                </div>
            )}

            <Modal isOpen={formModalOpen} onClose={() => { setFormModalOpen(false); setEditingItem(null); setForm(emptyForm); setEstimate(null); }} title={editingItem ? 'Edit Project' : 'New Project'} size="lg">
                <form onSubmit={handleSave} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Project Name" required icon={<Rocket size={16} />} full>
                            <input type="text" value={form.project_name} onChange={(e) => setForm({ ...form, project_name: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        {formErrors.project_name && <p className="text-sm text-red-600 col-span-full -mt-2">{formErrors.project_name[0]}</p>}
                        {!editingItem && (
                            <>
                                <FormField label="Required Capital (TZS)" required icon={<Wallet size={16} />}>
                                    <input type="number" min="0" value={form.required_capital} onChange={(e) => setForm({ ...form, required_capital: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                </FormField>
                                <FormField label="Timeline (months)" required icon={<Calendar size={16} />}>
                                    <input type="number" min="1" value={form.timeline_months} onChange={(e) => setForm({ ...form, timeline_months: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                </FormField>
                                <FormField label="Available Capital (TZS)" icon={<Wallet size={16} />}>
                                    <input type="number" min="0" value={form.available_capital} onChange={(e) => setForm({ ...form, available_capital: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                </FormField>
                                <FormField label="Monthly Savings Capacity (TZS)" icon={<TrendingUp size={16} />}>
                                    <input type="number" min="0" value={form.monthly_savings_capacity} onChange={(e) => setForm({ ...form, monthly_savings_capacity: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                </FormField>
                                <FormField label="Start Date" icon={<Calendar size={16} />}>
                                    <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                </FormField>
                                <div className="md:col-span-2">
                                    <button type="button" onClick={handleEstimate} disabled={estimating || !form.required_capital || !form.timeline_months} className="inline-flex items-center gap-2 px-4 py-2.5 text-white rounded-lg text-sm font-medium shadow-md hover:shadow-lg disabled:opacity-50 transition-all" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                                        <RefreshCw size={15} /> {estimating ? 'Calculating...' : 'Preview Estimate'}
                                    </button>
                                    {estimate && (
                                        <div className="mt-4 bg-gray-50 rounded-xl p-4 space-y-3">
                                            <p className="text-sm font-semibold text-gray-900">Estimated Plan</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                                                <div><p className="text-gray-500 text-xs">Capital Gap</p><p className="font-bold text-red-600">{formatCurrency(estimate.capital_gap)}</p></div>
                                                <div><p className="text-gray-500 text-xs">Recommended Loan</p><p className="font-bold text-[#00B894]">{formatCurrency(estimate.recommended_loan_amount)}</p></div>
                                                <div><p className="text-gray-500 text-xs">Completion Date</p><p className="font-bold text-gray-800">{estimate.completion_date ? new Date(estimate.completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}</p></div>
                                            </div>
                                            <div>{renderSavingsPlan(estimate.savings_plan)}</div>
                                            <div className="pt-2 border-t border-gray-200">
                                                <p className="text-xs font-semibold text-gray-500 mb-2">Capital Allocation</p>
                                                {renderAllocation(estimate.allocation)}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        <FormField label="Notes" icon={<Rocket size={16} />} full>
                            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] resize-none" />
                        </FormField>
                    </div>
                    <ActionBar onCancel={() => { setFormModalOpen(false); setEditingItem(null); setForm(emptyForm); setEstimate(null); }} onCancelLabel="Cancel" onSubmit={handleSave} onSubmitLabel={editingItem ? 'Update Project' : 'Create Project'} loading={submitting} accent />
                </form>
            </Modal>

            <ConfirmDialog isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }} onConfirm={handleDelete} title="Delete Project" message="Are you sure you want to delete this project?" confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
