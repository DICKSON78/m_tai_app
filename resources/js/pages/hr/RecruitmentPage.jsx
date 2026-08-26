import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Briefcase, Plus, Search, Pencil, Trash2, Eye, Users } from 'lucide-react';

const JOB_STATUS_LABELS = {
    draft: { label: 'Draft', classes: 'bg-yellow-100 text-yellow-700' },
    open: { label: 'Open', classes: 'bg-green-100 text-green-700' },
    closed: { label: 'Closed', classes: 'bg-gray-100 text-gray-700' },
    cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
};

const APP_STATUS_LABELS = {
    pending: { label: 'Pending', classes: 'bg-blue-100 text-blue-700' },
    reviewed: { label: 'Reviewed', classes: 'bg-yellow-100 text-yellow-700' },
    shortlisted: { label: 'Shortlisted', classes: 'bg-green-100 text-green-700' },
    interview: { label: 'Interview', classes: 'bg-purple-100 text-purple-700' },
    hired: { label: 'Hired', classes: 'bg-[#00D4AA]/10 text-[#00D4AA]' },
    rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-700' },
};

const EMPLOYMENT_TYPES = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
];
const EMPLOYMENT_TYPE_LABELS = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', intern: 'Intern' };

const emptyJobForm = { title: '', description: '', department_id: '', employment_type: 'full_time', salary_range: '', location: '', closing_date: '' };

export default function RecruitmentPage() {
    document.title = 'Recruitment - M-TAI';
    const [activeTab, setActiveTab] = useState('jobs');
    const [jobs, setJobs] = useState([]);
    const [applications, setApplications] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [selectedJob, setSelectedJob] = useState(null);

    const [jobModalOpen, setJobModalOpen] = useState(false);
    const [editingJob, setEditingJob] = useState(null);
    const [jobForm, setJobForm] = useState(emptyJobForm);
    const [jobSubmitting, setJobSubmitting] = useState(false);
    const [jobErrors, setJobErrors] = useState({});

    const [deleteId, setDeleteId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const [jobDetailModal, setJobDetailModal] = useState({ open: false, data: null });

    const fetchDepartments = useCallback(async () => {
        try { const res = await api.get('/owner/hr/departments'); setDepartments(res.data?.data || res.data || []); } catch (error) { console.error('Failed to fetch departments:', error); setDepartments([]); }
    }, []);

    const fetchJobs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            const res = await api.get('/owner/hr/jobs', { params });
            setJobs(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch (error) { console.error('Failed to fetch jobs:', error); setJobs([]); } finally { setLoading(false); }
    }, [currentPage]);

    const fetchApplications = useCallback(async () => {
        setLoading(true);
        try {
            if (selectedJob) {
                const res = await api.get(`/owner/hr/jobs/${selectedJob}/applications`, { params: { page: currentPage, per_page: 15 } });
                const apps = (res.data?.data || []).map(a => ({ ...a, _jobTitle: jobs.find(j => j.id === selectedJob)?.title }));
                setApplications(apps);
                setCurrentPage(res.data?.current_page || 1);
                setLastPage(res.data?.last_page || 1);
            } else {
                const res = await api.get('/owner/hr/jobs', { params: { page: currentPage, per_page: 100 } });
                const allApps = [];
                (res.data?.data || []).forEach(j => {
                    (j.applications || []).forEach(a => { a._jobTitle = j.title; allApps.push(a); });
                });
                setApplications(allApps);
            }
        } catch (error) { console.error('Failed to fetch applications:', error); setApplications([]); } finally { setLoading(false); }
    }, [currentPage, selectedJob, jobs]);

    useEffect(() => { fetchDepartments(); }, [fetchDepartments]);
    useEffect(() => { if (activeTab === 'jobs') fetchJobs(); else fetchApplications(); }, [activeTab, fetchJobs, fetchApplications]);
    useEffect(() => { setCurrentPage(1); }, [activeTab, selectedJob]);

    const openCreateJob = () => { setEditingJob(null); setJobForm(emptyJobForm); setJobErrors({}); setJobModalOpen(true); };
    const openEditJob = (job) => {
        setEditingJob(job);
        setJobForm({ title: job.title || '', description: job.description || '', department_id: job.department_id || '', employment_type: job.employment_type || 'full_time', salary_range: job.salary_range || '', location: job.location || '', closing_date: job.closing_date || '' });
        setJobErrors({}); setJobModalOpen(true);
    };
    const handleJobChange = (e) => { const { name, value } = e.target; setJobForm(prev => ({ ...prev, [name]: value })); };

    const handleJobSubmit = async (e) => {
        e.preventDefault(); setJobSubmitting(true); setJobErrors({});
        try {
            const payload = { ...jobForm };
            if (!payload.department_id) delete payload.department_id;
            if (editingJob) { await api.put(`/owner/hr/jobs/${editingJob.id}`, payload); }
            else { await api.post('/owner/hr/jobs', payload); }
            setJobModalOpen(false); fetchJobs();
        } catch (err) { console.error('Failed to create job:', err); if (err.response?.status === 422) setJobErrors(err.response.data?.errors || {}); else alert(err.response?.data?.message || 'Failed'); } finally { setJobSubmitting(false); }
    };

    const handleDeleteJob = async () => {
        if (!deleteId) return;
        try { await api.delete(`/owner/hr/jobs/${deleteId}`); setConfirmOpen(false); setDeleteId(null); fetchJobs(); } catch (error) { console.error('Failed to delete job:', error); alert(error?.response?.data?.message || 'Failed to delete job. Please try again.'); }
    };

    const openJobDetail = async (job) => {
        try { const res = await api.get(`/owner/hr/jobs/${job.id}`); setJobDetailModal({ open: true, data: res.data }); }
        catch (error) { console.error('Failed to fetch job detail:', error); setJobDetailModal({ open: true, data: job }); }
    };

    const updateApplicationStatus = async (id, status) => {
        try { await api.put(`/owner/hr/applications/${id}`, { status }); fetchApplications(); } catch (error) { console.error('Failed to update application status:', error); alert(error?.response?.data?.message || 'Failed to update status. Please try again.'); }
    };

    const inputClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm";

    return (
        <div className="space-y-0">
            <PageHeader title="Recruitment" subtitle="Manage job postings and candidates" icon={<Briefcase size={20} />}
                actions={<button onClick={openCreateJob} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} />New Job</button>} />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <div className="flex gap-2">
                    <button onClick={() => { setActiveTab('jobs'); setSelectedJob(null); }} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'jobs' ? 'bg-[#00D4AA] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Job Postings</button>
                    <button onClick={() => setActiveTab('applications')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'applications' ? 'bg-[#00D4AA] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Applications</button>
                </div>
            </div>

            {activeTab === 'applications' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                    <div className="flex gap-4">
                        <select value={selectedJob || ''} onChange={(e) => setSelectedJob(e.target.value || null)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                            <option value="">All Jobs</option>
                            {jobs.map((j) => (<option key={j.id} value={j.id}>{j.title}</option>))}
                        </select>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : activeTab === 'jobs' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Job Postings ({jobs.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Title</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Location</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Applications</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center"><Briefcase size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No job postings found</p></td></tr>
                                ) : jobs.map((job) => {
                                    const st = JOB_STATUS_LABELS[job.status] || { label: job.status, classes: 'bg-gray-100 text-gray-700' };
                                    return (
                                        <tr key={job.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-800">{job.title}</td>
                                            <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00D4AA]">{EMPLOYMENT_TYPE_LABELS[job.employment_type] || job.employment_type || '-'}</span></td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{job.location || '-'}</td>
                                            <td className="px-6 py-3"><span className="inline-flex items-center gap-1 text-sm text-gray-600"><Users size={12} />{job.applications_count ?? 0}</span></td>
                                            <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.classes}`}>{st.label}</span></td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openJobDetail(job)} className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-all" title="View"><Eye size={14} /></button>
                                                    <button onClick={() => openEditJob(job)} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Edit"><Pencil size={14} /></button>
                                                    <button onClick={() => { setDeleteId(job.id); setConfirmOpen(true); }} className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all" title="Delete"><Trash2 size={14} /></button>
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
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Applications ({applications.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Candidate</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Email</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Job</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center"><Users size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No applications found</p></td></tr>
                                ) : applications.map((app) => {
                                    const st = APP_STATUS_LABELS[app.status] || { label: app.status, classes: 'bg-gray-100 text-gray-700' };
                                    return (
                                        <tr key={app.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] flex items-center justify-center text-xs font-bold uppercase">{(app.candidate_name || '?')[0]?.toUpperCase()}</div>
                                                    <span className="font-medium text-gray-800">{app.candidate_name || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{app.candidate_email || '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{app._jobTitle || '-'}</td>
                                            <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.classes}`}>{st.label}</span></td>
                                            <td className="px-6 py-3">
                                                <select value={app.status} onChange={(e) => updateApplicationStatus(app.id, e.target.value)} className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-[#00D4AA]">
                                                    {Object.entries(APP_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                </select>
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

            <Modal isOpen={jobModalOpen} onClose={() => setJobModalOpen(false)} title={editingJob ? 'Edit Job Posting' : 'New Job Posting'} size="lg">
                <form onSubmit={handleJobSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Title <span className="text-red-500">*</span></label>
                            <input type="text" name="title" value={jobForm.title} onChange={handleJobChange} required className={`${inputClasses} ${jobErrors.title ? 'border-red-500' : ''}`} placeholder="e.g. Store Manager" />
                            {jobErrors.title && <p className="mt-1.5 text-sm text-red-600">{jobErrors.title[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Department</label>
                            <select name="department_id" value={jobForm.department_id} onChange={handleJobChange} className={inputClasses}>
                                <option value="">No department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Employment Type</label>
                            <select name="employment_type" value={jobForm.employment_type} onChange={handleJobChange} className={inputClasses}>
                                {EMPLOYMENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Location</label>
                            <input type="text" name="location" value={jobForm.location} onChange={handleJobChange} className={inputClasses} placeholder="e.g. Dar es Salaam" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Salary Range</label>
                            <input type="text" name="salary_range" value={jobForm.salary_range} onChange={handleJobChange} className={inputClasses} placeholder="e.g. 500,000 - 800,000 TZS" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Closing Date</label>
                            <input type="date" name="closing_date" value={jobForm.closing_date} onChange={handleJobChange} className={inputClasses} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                        <textarea name="description" value={jobForm.description} onChange={handleJobChange} rows={4} className={inputClasses} placeholder="Job description, responsibilities, requirements..." />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setJobModalOpen(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
                        <button type="submit" disabled={jobSubmitting} className="px-6 py-2.5 font-bold text-white rounded-lg disabled:opacity-50 text-sm" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            {jobSubmitting ? 'Processing...' : editingJob ? 'Save Changes' : 'Create Job'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={jobDetailModal.open} onClose={() => setJobDetailModal({ open: false, data: null })} title="Job Details" size="lg">
                {jobDetailModal.data && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="sm:col-span-2"><p className="text-xs font-semibold text-gray-400 uppercase">Title</p><p className="text-sm font-medium text-gray-900">{jobDetailModal.data.title}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Type</p><p className="text-sm font-medium text-gray-900">{EMPLOYMENT_TYPE_LABELS[jobDetailModal.data.employment_type] || '-'}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Location</p><p className="text-sm font-medium text-gray-900">{jobDetailModal.data.location || '-'}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Salary Range</p><p className="text-sm font-medium text-gray-900">{jobDetailModal.data.salary_range || '-'}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Status</p><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(JOB_STATUS_LABELS[jobDetailModal.data.status] || { classes: 'bg-gray-100 text-gray-700' }).classes}`}>{(JOB_STATUS_LABELS[jobDetailModal.data.status] || { label: jobDetailModal.data.status }).label}</span></div>
                        </div>
                        {jobDetailModal.data.description && <div><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Description</p><p className="text-sm text-gray-700 whitespace-pre-line">{jobDetailModal.data.description}</p></div>}
                        {jobDetailModal.data.applications && jobDetailModal.data.applications.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Applications ({jobDetailModal.data.applications.length})</p>
                                <div className="space-y-2">
                                    {jobDetailModal.data.applications.map((a) => (
                                        <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] flex items-center justify-center text-xs font-bold uppercase">{(a.candidate_name || '?')[0]?.toUpperCase()}</div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{a.candidate_name}</p>
                                                    <p className="text-xs text-gray-500">{a.candidate_email}</p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(APP_STATUS_LABELS[a.status] || { classes: 'bg-gray-100 text-gray-700', label: a.status }).classes}`}>{(APP_STATUS_LABELS[a.status] || { label: a.status }).label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setDeleteId(null); }} onConfirm={handleDeleteJob} title="Delete Job" message="Are you sure you want to delete this job posting and all its applications?" confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
