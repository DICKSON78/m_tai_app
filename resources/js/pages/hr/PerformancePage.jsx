import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Star, Plus, Search, Pencil, Trash2, Eye } from 'lucide-react';

const RATING_LABELS = {
    exceptional: { label: 'Exceptional', classes: 'bg-green-100 text-green-700' },
    exceeds: { label: 'Exceeds Expectations', classes: 'bg-blue-100 text-blue-700' },
    meets: { label: 'Meets Expectations', classes: 'bg-yellow-100 text-yellow-700' },
    needs_improvement: { label: 'Needs Improvement', classes: 'bg-orange-100 text-orange-700' },
    unsatisfactory: { label: 'Unsatisfactory', classes: 'bg-red-100 text-red-700' },
};

const REVIEW_STATUS_LABELS = {
    draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-700' },
    submitted: { label: 'Submitted', classes: 'bg-blue-100 text-blue-700' },
    reviewed: { label: 'Reviewed', classes: 'bg-green-100 text-green-700' },
    acknowledged: { label: 'Acknowledged', classes: 'bg-purple-100 text-purple-700' },
};

const FILTER_TABS = [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'reviewed', label: 'Reviewed' },
];

const emptyForm = { employee_id: '', reviewer_id: '', review_period_start: '', review_period_end: '', rating: 'meets', strengths: '', areas_for_improvement: '', goals: '', comments: '' };
const fullName = (emp) => emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : '';

export default function PerformancePage() {
    document.title = 'Performance Reviews - M-TAI';
    const [reviews, setReviews] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [deleteId, setDeleteId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [detailModal, setDetailModal] = useState({ open: false, data: null });

    const fetchEmployees = useCallback(async () => {
        try { const res = await api.get('/owner/hr/employees', { params: { per_page: 200 } }); setEmployees(res.data?.data || []); } catch (error) { console.error('Failed to fetch employees:', error); setEmployees([]); }
    }, []);

    const fetchReviews = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (filter !== 'all') params.status = filter;
            const res = await api.get('/owner/hr/performance', { params });
            setReviews(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch (error) { console.error('Failed to fetch performance reviews:', error); setReviews([]); } finally { setLoading(false); }
    }, [currentPage, filter]);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
    useEffect(() => { fetchReviews(); }, [fetchReviews]);
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
    const openEdit = (r) => {
        setEditing(r);
        setForm({
            employee_id: r.employee_id || '', reviewer_id: r.reviewer_id || '',
            review_period_start: r.review_period_start || '', review_period_end: r.review_period_end || '',
            rating: r.rating || 'meets', strengths: r.strengths || '', areas_for_improvement: r.areas_for_improvement || '',
            goals: r.goals || '', comments: r.comments || ''
        });
        setErrors({}); setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); setErrors({}); };
    const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: null })); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true); setErrors({});
        try {
            const payload = { ...form };
            if (editing) { await api.put(`/owner/hr/performance/${editing.id}`, payload); }
            else { await api.post('/owner/hr/performance', payload); }
            closeModal(); fetchReviews();
        } catch (err) { console.error('Failed to save performance review:', err); if (err.response?.status === 422) setErrors(err.response.data?.errors || {}); else alert(err.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try { await api.delete(`/owner/hr/performance/${deleteId}`); setConfirmOpen(false); setDeleteId(null); fetchReviews(); } catch (error) { console.error('Failed to delete performance review:', error); alert(error?.response?.data?.message || 'Failed to delete review. Please try again.'); }
    };

    const inputClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm";

    return (
        <div className="space-y-0">
            <PageHeader title="Performance Reviews" subtitle="Track employee performance" icon={<Star size={20} />}
                actions={<button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} />New Review</button>} />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <div className="flex gap-2">
                    {FILTER_TABS.map((tab) => (
                        <button key={tab.value} onClick={() => setFilter(tab.value)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab.value ? 'bg-[#00D4AA] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Reviews ({reviews.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Employee</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Reviewer</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Period</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Rating</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center"><Star size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No reviews found</p></td></tr>
                                ) : reviews.map((r) => {
                                    const st = REVIEW_STATUS_LABELS[r.status] || { label: r.status, classes: 'bg-gray-100 text-gray-700' };
                                    const rating = RATING_LABELS[r.rating] || { label: r.rating || '-', classes: 'bg-gray-100 text-gray-700' };
                                    return (
                                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] flex items-center justify-center text-xs font-bold uppercase">{(fullName(r.employee) || '?')[0]?.toUpperCase()}</div>
                                                    <span className="font-medium text-gray-800">{fullName(r.employee) || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{fullName(r.reviewer) || '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{r.review_period_start && r.review_period_end ? `${r.review_period_start} - ${r.review_period_end}` : '-'}</td>
                                            <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${rating.classes}`}>{rating.label}</span></td>
                                            <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.classes}`}>{st.label}</span></td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => setDetailModal({ open: true, data: r })} className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-all" title="View"><Eye size={14} /></button>
                                                    <button onClick={() => openEdit(r)} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Edit"><Pencil size={14} /></button>
                                                    <button onClick={() => { setDeleteId(r.id); setConfirmOpen(true); }} className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all" title="Delete"><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Review' : 'New Performance Review'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Employee <span className="text-red-500">*</span></label>
                            <select name="employee_id" value={form.employee_id} onChange={handleChange} required className={`${inputClasses} ${errors.employee_id ? 'border-red-500' : ''}`}>
                                <option value="">Select employee</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                            </select>
                            {errors.employee_id && <p className="mt-1.5 text-sm text-red-600">{errors.employee_id[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Reviewer <span className="text-red-500">*</span></label>
                            <select name="reviewer_id" value={form.reviewer_id} onChange={handleChange} required className={`${inputClasses} ${errors.reviewer_id ? 'border-red-500' : ''}`}>
                                <option value="">Select reviewer</option>
                                {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                            </select>
                            {errors.reviewer_id && <p className="mt-1.5 text-sm text-red-600">{errors.reviewer_id[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Period Start <span className="text-red-500">*</span></label>
                            <input type="date" name="review_period_start" value={form.review_period_start} onChange={handleChange} required className={`${inputClasses} ${errors.review_period_start ? 'border-red-500' : ''}`} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Period End <span className="text-red-500">*</span></label>
                            <input type="date" name="review_period_end" value={form.review_period_end} onChange={handleChange} required className={`${inputClasses} ${errors.review_period_end ? 'border-red-500' : ''}`} />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Rating</label>
                            <select name="rating" value={form.rating} onChange={handleChange} className={inputClasses}>
                                {Object.entries(RATING_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Strengths</label>
                        <textarea name="strengths" value={form.strengths} onChange={handleChange} rows={2} className={inputClasses} placeholder="Employee strengths..." />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Areas for Improvement</label>
                        <textarea name="areas_for_improvement" value={form.areas_for_improvement} onChange={handleChange} rows={2} className={inputClasses} placeholder="Areas for improvement..." />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Goals</label>
                        <textarea name="goals" value={form.goals} onChange={handleChange} rows={2} className={inputClasses} placeholder="Performance goals..." />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Comments</label>
                        <textarea name="comments" value={form.comments} onChange={handleChange} rows={2} className={inputClasses} placeholder="Additional comments..." />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white rounded-lg disabled:opacity-50 text-sm" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            {submitting ? 'Processing...' : editing ? 'Save Changes' : 'Create Review'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={detailModal.open} onClose={() => setDetailModal({ open: false, data: null })} title="Review Details" size="lg">
                {detailModal.data && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Employee</p><p className="text-sm font-medium text-gray-900">{fullName(detailModal.data.employee)}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Reviewer</p><p className="text-sm font-medium text-gray-900">{fullName(detailModal.data.reviewer)}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Period</p><p className="text-sm font-medium text-gray-900">{detailModal.data.review_period_start} - {detailModal.data.review_period_end}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Rating</p><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(RATING_LABELS[detailModal.data.rating] || { classes: 'bg-gray-100 text-gray-700' }).classes}`}>{(RATING_LABELS[detailModal.data.rating] || { label: detailModal.data.rating }).label}</span></div>
                        </div>
                        {detailModal.data.strengths && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Strengths</p><p className="text-sm text-gray-700">{detailModal.data.strengths}</p></div>}
                        {detailModal.data.areas_for_improvement && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Areas for Improvement</p><p className="text-sm text-gray-700">{detailModal.data.areas_for_improvement}</p></div>}
                        {detailModal.data.goals && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Goals</p><p className="text-sm text-gray-700">{detailModal.data.goals}</p></div>}
                        {detailModal.data.comments && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Comments</p><p className="text-sm text-gray-700">{detailModal.data.comments}</p></div>}
                        <div><p className="text-xs font-semibold text-gray-400 uppercase">Status</p><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(REVIEW_STATUS_LABELS[detailModal.data.status] || { classes: 'bg-gray-100 text-gray-700' }).classes}`}>{(REVIEW_STATUS_LABELS[detailModal.data.status] || { label: detailModal.data.status }).label}</span></div>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setDeleteId(null); }} onConfirm={handleDelete} title="Delete Review" message="Are you sure you want to delete this performance review?" confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
