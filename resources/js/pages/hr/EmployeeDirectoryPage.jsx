import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Users, Plus, Search, Pencil, Trash2, Briefcase, DollarSign, CheckCircle } from 'lucide-react';

const EMPLOYEE_TYPES = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'intern', label: 'Intern' },
];

const EMPLOYEE_TYPE_LABELS = { full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract', intern: 'Intern' };
const STATUS_LABELS = { active: 'Active', inactive: 'Inactive', on_leave: 'On Leave', terminated: 'Terminated' };

const emptyForm = { first_name: '', last_name: '', employee_number: '', position: '', employment_type: 'full_time', base_salary: '', salary_type: 'monthly', phone: '', email: '', hire_date: '', department_id: '', status: 'active' };

export default function EmployeeDirectoryPage() {
    document.title = 'Employee Directory - M-TAI';
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [stats, setStats] = useState({ total: 0, active: 0, on_leave: 0, total_salary: 0 });
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [deleteId, setDeleteId] = useState(null);
    const [deleteName, setDeleteName] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);

    const fetchDepartments = useCallback(async () => {
        try { const res = await api.get('/owner/hr/departments'); setDepartments(res.data?.data || res.data || []); } catch (error) { console.error('Failed to fetch departments:', error); setDepartments([]); }
    }, []);

    const fetchSummary = useCallback(async () => {
        try { const res = await api.get('/owner/hr/employees/summary'); setStats(res.data || {}); } catch (error) { console.error('Failed to fetch employee summary:', error); setStats({ total: 0, active: 0, on_leave: 0, total_salary: 0 }); }
    }, []);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (filter !== 'all') params.status = filter;
            const res = await api.get('/owner/hr/employees', { params });
            setEmployees(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch (error) { console.error('Failed to fetch employees:', error); setEmployees([]); } finally { setLoading(false); }
    }, [currentPage, search, filter]);

    useEffect(() => { fetchDepartments(); fetchSummary(); }, [fetchDepartments, fetchSummary]);
    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
    useEffect(() => { setCurrentPage(1); }, [search, filter]);

    const fullName = (emp) => `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '-';
    const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
    const openEdit = (emp) => {
        setEditing(emp);
        setForm({
            first_name: emp.first_name || '', last_name: emp.last_name || '', employee_number: emp.employee_number || '',
            position: emp.position || '', employment_type: emp.employment_type || 'full_time', base_salary: emp.base_salary || '',
            salary_type: emp.salary_type || 'monthly', phone: emp.phone || '', email: emp.email || '',
            hire_date: emp.hire_date || '', department_id: emp.department_id || '', status: emp.status || 'active'
        });
        setErrors({}); setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); setErrors({}); };
    const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: null })); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true); setErrors({});
        try {
            const payload = { ...form };
            if (!payload.department_id) delete payload.department_id;
            if (editing) { await api.put(`/owner/hr/employees/${editing.id}`, payload); }
            else { await api.post('/owner/hr/employees', payload); }
            closeModal(); fetchEmployees(); fetchSummary();
        } catch (err) { console.error('Failed to save employee:', err); if (err.response?.status === 422) setErrors(err.response.data?.errors || {}); else alert(err.response?.data?.message || 'Failed'); } finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try { await api.delete(`/owner/hr/employees/${deleteId}`); setConfirmOpen(false); setDeleteId(null); setDeleteName(''); fetchEmployees(); fetchSummary(); } catch (error) { console.error('Failed to delete employee:', error); alert(error?.response?.data?.message || 'Failed to delete employee. Please try again.'); }
    };

    const statusColor = (s) => ({ active: 'bg-green-100 text-green-700', inactive: 'bg-gray-100 text-gray-600', on_leave: 'bg-yellow-100 text-yellow-700', terminated: 'bg-red-100 text-red-700' }[s] || 'bg-gray-100 text-gray-600');
    const inputClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm";

    return (
        <div className="space-y-0">
            <PageHeader title="Employee Directory" subtitle="Manage your team" icon={<Users size={20} />}
                actions={<button onClick={openCreate} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} />Add Employee</button>} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
                    <div className="h-12 w-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0"><Users size={22} className="text-[#00D4AA]" /></div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active</p><p className="text-2xl font-bold text-gray-900">{stats.active}</p></div>
                    <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={22} className="text-green-500" /></div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">On Leave</p><p className="text-2xl font-bold text-gray-900">{stats.on_leave}</p></div>
                    <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0"><Briefcase size={22} className="text-yellow-500" /></div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Payroll</p><p className="text-2xl font-bold text-gray-900">TZS {Number(stats.total_salary || 0).toLocaleString()}</p></div>
                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"><DollarSign size={22} className="text-blue-500" /></div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name, email, employee#..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {['all', 'active', 'on_leave', 'inactive'].map((tab) => (
                            <button key={tab} onClick={() => setFilter(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab ? 'bg-[#00D4AA] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {tab === 'all' ? 'All' : STATUS_LABELS[tab] || tab}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Employees ({employees.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Employee#</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Position</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Salary</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Hire Date</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.length === 0 ? (
                                    <tr><td colSpan={8} className="px-6 py-12 text-center"><Users size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No employees found</p></td></tr>
                                ) : employees.map((emp) => (
                                    <tr key={emp.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 text-sm text-gray-700">{emp.employee_number || '-'}</td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] flex items-center justify-center text-xs font-bold uppercase">{(emp.first_name || '?')[0]?.toUpperCase()}</div>
                                                <span className="font-medium text-gray-800">{fullName(emp)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{emp.position || '-'}</td>
                                        <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00D4AA]">{EMPLOYEE_TYPE_LABELS[emp.employment_type] || emp.employment_type || '-'}</span></td>
                                        <td className="px-6 py-3 text-sm text-gray-700">{emp.base_salary ? `TZS ${Number(emp.base_salary).toLocaleString()}` : '-'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{emp.hire_date || '-'}</td>
                                        <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(emp.status)}`}>{STATUS_LABELS[emp.status] || emp.status || '-'}</span></td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEdit(emp)} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Edit"><Pencil size={14} /></button>
                                                <button onClick={() => { setDeleteId(emp.id); setDeleteName(fullName(emp)); setConfirmOpen(true); }} className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all" title="Delete"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}

            <Modal isOpen={modalOpen} onClose={closeModal} title={editing ? 'Edit Employee' : 'Add New Employee'} size="lg">
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">First Name <span className="text-red-500">*</span></label>
                            <input type="text" name="first_name" value={form.first_name} onChange={handleChange} required className={`${inputClasses} ${errors.first_name ? 'border-red-500' : ''}`} placeholder="First name" />
                            {errors.first_name && <p className="mt-1.5 text-sm text-red-600">{errors.first_name[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Last Name <span className="text-red-500">*</span></label>
                            <input type="text" name="last_name" value={form.last_name} onChange={handleChange} required className={`${inputClasses} ${errors.last_name ? 'border-red-500' : ''}`} placeholder="Last name" />
                            {errors.last_name && <p className="mt-1.5 text-sm text-red-600">{errors.last_name[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Employee Number <span className="text-red-500">*</span></label>
                            <input type="text" name="employee_number" value={form.employee_number} onChange={handleChange} required className={`${inputClasses} ${errors.employee_number ? 'border-red-500' : ''}`} placeholder="e.g. EMP-001" />
                            {errors.employee_number && <p className="mt-1.5 text-sm text-red-600">{errors.employee_number[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Position <span className="text-red-500">*</span></label>
                            <input type="text" name="position" value={form.position} onChange={handleChange} required className={`${inputClasses} ${errors.position ? 'border-red-500' : ''}`} placeholder="Job title" />
                            {errors.position && <p className="mt-1.5 text-sm text-red-600">{errors.position[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Department</label>
                            <select name="department_id" value={form.department_id} onChange={handleChange} className={inputClasses}>
                                <option value="">No department</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Employment Type <span className="text-red-500">*</span></label>
                            <select name="employment_type" value={form.employment_type} onChange={handleChange} required className={inputClasses}>
                                {EMPLOYEE_TYPES.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Base Salary <span className="text-red-500">*</span></label>
                            <input type="number" name="base_salary" value={form.base_salary} onChange={handleChange} required min="0" className={`${inputClasses} ${errors.base_salary ? 'border-red-500' : ''}`} placeholder="Monthly salary" />
                            {errors.base_salary && <p className="mt-1.5 text-sm text-red-600">{errors.base_salary[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Salary Type</label>
                            <select name="salary_type" value={form.salary_type} onChange={handleChange} className={inputClasses}>
                                <option value="monthly">Monthly</option>
                                <option value="weekly">Weekly</option>
                                <option value="daily">Daily</option>
                                <option value="hourly">Hourly</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Email <span className="text-red-500">*</span></label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} required className={`${inputClasses} ${errors.email ? 'border-red-500' : ''}`} placeholder="employee@email.com" />
                            {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Phone</label>
                            <input type="text" name="phone" value={form.phone} onChange={handleChange} className={inputClasses} placeholder="Phone number" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Hire Date <span className="text-red-500">*</span></label>
                            <input type="date" name="hire_date" value={form.hire_date} onChange={handleChange} required className={inputClasses} />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Status</label>
                            <select name="status" value={form.status} onChange={handleChange} className={inputClasses}>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                                <option value="on_leave">On Leave</option>
                                <option value="terminated">Terminated</option>
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            {submitting ? 'Processing...' : editing ? 'Save Changes' : 'Add Employee'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setDeleteId(null); setDeleteName(''); }} onConfirm={handleDelete} title="Delete Employee" message={`Are you sure you want to delete "${deleteName}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
