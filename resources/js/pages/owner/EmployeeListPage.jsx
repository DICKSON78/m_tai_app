import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Users, Plus, Search, Pencil, Trash2, Briefcase, DollarSign, CheckCircle, Filter, RotateCcw } from 'lucide-react';

const ROLE_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'kasiri', label: 'Cashier' },
    { value: 'meneja', label: 'Manager' },
    { value: 'msimamizi_wa_stock', label: 'Storekeeper' },
    { value: 'msambazaji', label: 'Delivery Officer' },
];

const ROLE_LABELS = {
    kasiri: 'Cashier',
    meneja: 'Manager',
    msimamizi_wa_stock: 'Storekeeper',
    msambazaji: 'Delivery Officer',
};

const emptyForm = { name: '', phone: '', email: '', role: 'kasiri', salary: '', is_active: true };

export default function EmployeeListPage() {
    document.title = 'Employees - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [deleteId, setDeleteId] = useState(null);
    const [deleteName, setDeleteName] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [stats, setStats] = useState({ total: 0, active: 0, retired: 0 });

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch(() => setBusinesses([]));
    }, []);

    const fetchEmployees = useCallback(async () => {
        if (!selectedBusiness) { setEmployees([]); setStats({ total: 0, active: 0, retired: 0 }); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/employees`, { params });
            const data = res.data?.data || [];
            setEmployees(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.stats) { setStats(res.data.stats); } else {
                const total = res.data?.total || data.length;
                const active = data.filter(e => e.is_active).length;
                setStats({ total, active, retired: total - active });
            }
        } catch { setEmployees([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage, search, roleFilter]);

    useEffect(() => { fetchEmployees(); }, [fetchEmployees]);
    useEffect(() => { setCurrentPage(1); }, [selectedBusiness, search, roleFilter]);

    const openCreate = () => { setEditing(null); setForm(emptyForm); setErrors({}); setModalOpen(true); };
    const openEdit = (emp) => {
        setEditing(emp);
        setForm({ name: emp.name || '', phone: emp.phone || '', email: emp.email || '', role: emp.role || 'kasiri', salary: emp.salary || '', is_active: emp.is_active !== false });
        setErrors({}); setModalOpen(true);
    };
    const closeModal = () => { setModalOpen(false); setEditing(null); setForm(emptyForm); setErrors({}); };
    const handleChange = (e) => { const { name, value } = e.target; setForm(prev => ({ ...prev, [name]: value })); if (errors[name]) setErrors(prev => ({ ...prev, [name]: null })); };

    const handleSubmit = async (e) => {
        e.preventDefault(); setSubmitting(true); setErrors({});
        const payload = { name: form.name, phone: form.phone, email: form.email, role: form.role, salary: form.salary ? Number(form.salary) : null, is_active: form.is_active };
        try {
            if (editing) { await api.put(`/owner/employees/${editing.id}`, payload); }
            else { await api.post(`/owner/businesses/${selectedBusiness}/employees`, payload); }
            closeModal(); fetchEmployees();
        } catch (err) { if (err.response?.status === 422) setErrors(err.response.data?.errors || {}); } finally { setSubmitting(false); }
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        try { await api.delete(`/owner/employees/${deleteId}`); setConfirmOpen(false); setDeleteId(null); setDeleteName(''); fetchEmployees(); } catch {}
    };

    const handleReset = () => { setSearch(''); setRoleFilter(''); };

    const inputClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm";

    return (
        <div className="space-y-0">
            {selectedBusiness && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                        </div>
                        <div className="h-12 w-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0">
                            <Users size={22} className="text-[#00D4AA]" />
                        </div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
                        </div>
                        <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                            <CheckCircle size={22} className="text-green-500" />
                        </div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Retired</p>
                            <p className="text-2xl font-bold text-gray-900">{stats.retired}</p>
                        </div>
                        <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0">
                            <Briefcase size={22} className="text-yellow-500" />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end mb-6">
                {selectedBusiness && (
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Add New</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4">
                    <Filter size={14} className="text-[#00D4AA] mr-2" /> Search Resources
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search employees..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedBusiness}
                            onChange={(e) => setSelectedBusiness(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            <option value="">All Businesses</option>
                            {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name || biz.business_name}</option>))}
                        </select>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            {ROLE_OPTIONS.map((opt) => (<option key={opt.value} value={opt.value}>{opt.label}</option>))}
                        </select>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30"
                        >
                            <RotateCcw size={12} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {!selectedBusiness ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center">
                        <Users size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">Select a business to view employees</p>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Employees ({employees.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Phone</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Role</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Salary</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employees.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center">
                                            <Users size={40} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-sm text-gray-500">No data available</p>
                                        </td>
                                    </tr>
                                ) : employees.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] flex items-center justify-center text-xs font-bold uppercase">
                                                    {(row.name || '?')[0]?.toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-800">{row.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-gray-600">{row.phone || '-'}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00D4AA]">
                                                {ROLE_LABELS[row.role] || row.role || '-'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="text-gray-700">{row.salary ? `TZS ${Number(row.salary).toLocaleString()}` : '-'}</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${row.is_active !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                {row.is_active !== false ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => openEdit(row)}
                                                    className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all"
                                                    title="Edit"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                                <button
                                                    onClick={() => { setDeleteId(row.id); setDeleteName(row.name || ''); setConfirmOpen(true); }}
                                                    className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
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
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Name <span className="text-red-500">*</span></label>
                            <input type="text" name="name" value={form.name} onChange={handleChange} required className={`${inputClasses} ${errors.name ? 'border-red-500' : ''}`} placeholder="Enter name" />
                            {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Phone <span className="text-red-500">*</span></label>
                            <input type="text" name="phone" value={form.phone} onChange={handleChange} required className={`${inputClasses} ${errors.phone ? 'border-red-500' : ''}`} placeholder="Enter phone number" />
                            {errors.phone && <p className="mt-1.5 text-sm text-red-600">{errors.phone[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} className={`${inputClasses} ${errors.email ? 'border-red-500' : ''}`} placeholder="Enter email (optional)" />
                            {errors.email && <p className="mt-1.5 text-sm text-red-600">{errors.email[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Role <span className="text-red-500">*</span></label>
                            <select name="role" value={form.role} onChange={handleChange} required className={`${inputClasses} ${errors.role ? 'border-red-500' : ''}`}>
                                <option value="kasiri">Cashier</option>
                                <option value="meneja">Manager</option>
                                <option value="msimamizi_wa_stock">Storekeeper</option>
                                <option value="msambazaji">Delivery Officer</option>
                            </select>
                            {errors.role && <p className="mt-1.5 text-sm text-red-600">{errors.role[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Salary (Amount)</label>
                            <input type="number" name="salary" value={form.salary} onChange={handleChange} min="0" className={`${inputClasses} ${errors.salary ? 'border-red-500' : ''}`} placeholder="Enter salary amount" />
                            {errors.salary && <p className="mt-1.5 text-sm text-red-600">{errors.salary[0]}</p>}
                        </div>
                        <div className="flex items-center pt-6">
                            <label className="text-sm font-semibold text-gray-900 mr-4">Status</label>
                            <button type="button" onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-[#00D4AA] focus:ring-offset-2 ${form.is_active ? 'bg-[#00D4AA]' : 'bg-gray-200'}`}>
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${form.is_active ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="ml-3 text-sm text-gray-600">{form.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">
                            {submitting ? 'Processing...' : editing ? 'Save Changes' : 'Add Employee'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setDeleteId(null); setDeleteName(''); }} onConfirm={handleDelete} title="Delete Employee" message={`Are you sure you want to delete employee "${deleteName}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
