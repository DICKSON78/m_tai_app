import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import { Megaphone, Plus, Trash2, Type, Users, Activity, Calendar, Search, Eye, EyeOff, SlidersHorizontal, X, Edit } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';

const TARGET_ROLE_BADGES = {
    all: { label: 'All Users', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700' },
    business_owner: { label: 'Owners', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' },
    customer: { label: 'Customers', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700' },
    driver: { label: 'Drivers', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700' },
    employee: { label: 'Employees', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
};

const TARGET_ROLE_OPTIONS = [
    { value: '', label: 'All Targets' },
    { value: 'all', label: 'All Users' },
    { value: 'business_owner', label: 'Owners' },
    { value: 'customer', label: 'Customers' },
    { value: 'driver', label: 'Drivers' },
    { value: 'employee', label: 'Employees' },
];

export default function AdminAnnouncementsPage() {
    document.title = 'Announcements - M-Tai Admin';
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState({ total: 0, active: 0, inactive: 0 });
    const [search, setSearch] = useState('');
    const [targetFilter, setTargetFilter] = useState('');
    const [activeFilter, setActiveFilter] = useState('');
    const [deleteId, setDeleteId] = useState(null);
    const [deleteTitle, setDeleteTitle] = useState('');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    const fetchAnnouncements = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (targetFilter) params.target_role = targetFilter;
            if (activeFilter !== '') params.is_active = activeFilter;
            const res = await api.get('/admin/announcements', { params });
            const data = res.data?.data || [];
            setAnnouncements(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch { setAnnouncements([]); } finally { setLoading(false); }
    }, [currentPage, search, targetFilter, activeFilter]);

    useEffect(() => { fetchAnnouncements(); }, [fetchAnnouncements]);
    useEffect(() => { setCurrentPage(1); }, [search, targetFilter, activeFilter]);

    const confirmDelete = (item) => { setDeleteId(item.id); setDeleteTitle(item.title || ''); setConfirmOpen(true); };
    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/admin/announcements/${deleteId}`);
            setConfirmOpen(false); setDeleteId(null); setDeleteTitle('');
            setSuccessModal(true); setTimeout(() => setSuccessModal(false), 2000);
            fetchAnnouncements();
        } catch { /* silent */ }
    };

    return (
        <div className="space-y-6">
                <PageHeader title="Announcements" subtitle="Manage platform announcements and notifications" icon={<Megaphone size={20} />} />
                <div className="flex items-center justify-between">
                    <div></div>
                    <Link to="/admin/announcements/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        <Plus className="w-4 h-4" /> New Announcement
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-6">
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                <Megaphone className="w-6 h-6 text-[#00D4AA]" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Active</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.active}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <Eye className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Inactive</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.inactive}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                <EyeOff className="w-6 h-6 text-red-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search announcements..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                        </div>
                        <select value={targetFilter} onChange={(e) => setTargetFilter(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                            {TARGET_ROLE_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                        <select value={activeFilter} onChange={(e) => setActiveFilter(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                            <option value="">All Status</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                        {(search || targetFilter || activeFilter) && (
                            <button onClick={() => { setSearch(''); setTargetFilter(''); setActiveFilter(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                                <X className="w-4 h-4" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Announcements</h3>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                    ) : announcements.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Megaphone className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No data available</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Title</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Target</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Created</th>
                                            <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {announcements.map((row) => {
                                            const cfg = TARGET_ROLE_BADGES[row.target_role] || TARGET_ROLE_BADGES.all;
                                            return (
                                                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <p className="font-semibold text-gray-900 truncate max-w-[250px]">{row.title}</p>
                                                        <p className="text-xs text-gray-500 line-clamp-1 max-w-[300px]">{row.message}</p>
                                                    </td>
                                                    <td className="px-6 py-3"><span className={cfg.className}>{cfg.label}</span></td>
                                                    <td className="px-6 py-3"><span className={row.is_active ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500'}>{row.is_active ? 'Active' : 'Inactive'}</span></td>
                                                    <td className="px-6 py-3 text-sm text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Link to={`/admin/announcements/${row.id}`} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 transition-all" title="View">
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                            <Link to={`/admin/announcements/${row.id}/edit`} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="Edit">
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={(e) => { e.stopPropagation(); confirmDelete(row); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
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
                        </>
                    )}
                </div>

                <ConfirmDialog isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setDeleteId(null); setDeleteTitle(''); }} onConfirm={handleDelete}
                    title="Delete Announcement" message={`Are you sure you want to delete "${deleteTitle}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" variant="danger" />

                <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Success" size="sm">
                    <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-gray-700 font-medium">Announcement deleted successfully</p>
                    </div>
                </Modal>
        </div>
    );
}
