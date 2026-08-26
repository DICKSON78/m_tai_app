import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import { Users, Search, Eye, Pencil, Trash2, Plus, User, Phone, Hash, Shield, Calendar, Crown, SlidersHorizontal, X } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';

const ROLE_OPTIONS = [
    { value: '', label: 'All Roles' },
    { value: 'admin', label: 'Admin' },
    { value: 'business_owner', label: 'Owner' },
    { value: 'customer', label: 'Customer' },
    { value: 'driver', label: 'Driver' },
    { value: 'employee', label: 'Employee' },
];

const ROLE_BADGES = {
    admin: { label: 'Admin', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' },
    business_owner: { label: 'Owner', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' },
    customer: { label: 'Customer', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700' },
    driver: { label: 'Driver', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700' },
    employee: { label: 'Employee', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
};

export default function AdminUsersPage() {
    document.title = 'Users - M-Tai Admin';
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [summary, setSummary] = useState({ total: 0, admins: 0, owners: 0, customers: 0, drivers: 0, employees: 0 });
    const [deleteId, setDeleteId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (role) params.role = role;
            const res = await api.get('/admin/users', { params });
            const data = res.data?.data || [];
            setUsers(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            setTotal(res.data?.total || data.length);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch (error) { console.error('Failed to fetch users:', error); setUsers([]); setTotal(0); } finally { setLoading(false); }
    }, [currentPage, search, role]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => { setCurrentPage(1); }, [search, role]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try { await api.delete(`/admin/users/${deleteId}`); setSuccessModal(true); setTimeout(() => setSuccessModal(false), 2000); fetchUsers(); } catch (error) { console.error('Failed to delete user:', error); alert(error?.response?.data?.message || 'Failed to delete user. Please try again.'); }
        setDeleteId(null); setConfirmOpen(false);
    };

    return (
        <div className="space-y-6">
                <PageHeader
                    title="User Management"
                    subtitle="View and manage all platform users"
                    icon={<Users size={20} />}
                    actions={
                        <Link to="/admin/customers/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            <Plus className="w-4 h-4" /> Add User
                        </Link>
                    }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                <Users className="w-6 h-6 text-[#00D4AA]" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Admins</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.admins}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-red-500" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Owners</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.owners}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Crown className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Customers</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.customers}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <User className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                        </div>
                        <div>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                                {ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                        {(search || role) && (
                            <button onClick={() => { setSearch(''); setRole(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                                <X className="w-4 h-4" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Users</h3>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                    ) : users.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No data available</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Phone</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Code</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Role</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Created</th>
                                            <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((row) => (
                                            <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA] font-bold text-sm">
                                                            {(row.name || '?')[0]?.toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900">{row.name || '-'}</p>
                                                            <p className="text-xs text-gray-500">{row.email || '-'}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3 text-sm text-gray-600">{row.phone || '-'}</td>
                                                <td className="px-6 py-3"><span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{row.code || '-'}</span></td>
                                                <td className="px-6 py-3"><span className={(ROLE_BADGES[row.role] || ROLE_BADGES.customer).className}>{(ROLE_BADGES[row.role] || ROLE_BADGES.customer).label}</span></td>
                                                <td className="px-6 py-3 text-sm text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Link to={`/admin/customers/${row.id}`} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 transition-all" title="View">
                                                            <Eye className="w-4 h-4" />
                                                        </Link>
                                                        <Link to={`/admin/customers/${row.id}/edit`} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="Edit">
                                                            <Pencil className="w-4 h-4" />
                                                        </Link>
                                                        <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); setConfirmOpen(true); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                                                            <Trash2 className="w-4 h-4" />
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
                        </>
                    )}
                </div>

                <ConfirmDialog isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setDeleteId(null); }} onConfirm={handleDelete}
                    title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone." confirmText="Delete" cancelText="Cancel" variant="danger" />

                <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Success" size="sm">
                    <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-gray-700 font-medium">User deleted successfully</p>
                    </div>
                </Modal>
        </div>
    );
}
