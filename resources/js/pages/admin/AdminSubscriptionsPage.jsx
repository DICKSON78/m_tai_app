import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import { CreditCard, CheckCircle, Clock, XCircle, Plus, Trash2, Store, Tag, DollarSign, Activity, Calendar, Search, Eye, Edit, SlidersHorizontal, X, Loader2, AlertCircle } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';

const STATUS_MAP = {
    active: { label: 'Active', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' },
    expired: { label: 'Expired', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' },
    pending: { label: 'Pending', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
};

const PLAN_MAP = {
    daily: { label: 'Daily', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700' },
    monthly: { label: 'Monthly', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' },
    quarterly: { label: 'Quarterly', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700' },
    yearly: { label: 'Yearly', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
};

export default function AdminSubscriptionsPage() {
    document.title = 'Subscriptions - M-Tai Admin';
    const [subscriptions, setSubscriptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [planFilter, setPlanFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState({ total: 0, active: 0, expired: 0, pending: 0 });
    const [deleteId, setDeleteId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (planFilter) params.plan = planFilter;
            const res = await api.get('/admin/subscriptions', { params });
            setSubscriptions(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch (error) {
            console.error('Failed to fetch subscriptions:', error);
            setSubscriptions([]);
            setError('Failed to load subscriptions. Please try again.');
        } finally { setLoading(false); }
    }, [currentPage, search, statusFilter, planFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [search, statusFilter, planFilter]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try { await api.delete(`/admin/subscriptions/${deleteId}`); setSuccessModal(true); setTimeout(() => setSuccessModal(false), 2000); fetchData(); } catch (error) { console.error('Failed to delete subscription:', error); alert(error?.response?.data?.message || 'Failed to delete subscription. Please try again.'); } finally { setDeleteId(null); setConfirmOpen(false); }
    };

    return (
        <div className="space-y-6">
                <PageHeader title="Subscriptions" subtitle="Manage business subscription plans" icon={<CreditCard size={20} />} />
                <div className="flex items-center justify-between">
                    <div></div>
                    <Link to="/admin/subscriptions/new" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm transition-all" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        <Plus className="w-4 h-4" /> Add Subscription
                    </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                <CreditCard className="w-6 h-6 text-[#00D4AA]" />
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
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Pending</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.pending}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                                <Clock className="w-6 h-6 text-yellow-500" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Expired</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.expired}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                                <XCircle className="w-6 h-6 text-red-500" />
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
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search subscriptions..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                        </div>
                        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="expired">Expired</option>
                        </select>
                        <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                            <option value="">All Plans</option>
                            <option value="daily">Daily</option>
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="yearly">Yearly</option>
                        </select>
                        {(search || statusFilter || planFilter) && (
                            <button onClick={() => { setSearch(''); setStatusFilter(''); setPlanFilter(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                                <X className="w-4 h-4" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Subscriptions</h3>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-[#00D4AA]" /></div>
                    ) : error ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                            <p className="text-red-500 mb-4">{error}</p>
                            <button onClick={fetchData} className="px-4 py-2 bg-[#00D4AA] text-white rounded-lg">Retry</button>
                        </div>
                    ) : subscriptions.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <CreditCard className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No data available</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Business</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Plan</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Amount</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Start</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">End</th>
                                            <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {subscriptions.map((row) => {
                                            const sCfg = STATUS_MAP[row.status] || STATUS_MAP.pending;
                                            const pCfg = PLAN_MAP[row.plan] || PLAN_MAP.monthly;
                                            return (
                                                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <p className="font-semibold text-gray-900">{row.business?.business_name || row.business?.name || '-'}</p>
                                                        <p className="text-xs text-gray-500 font-mono">{row.business?.business_code || '-'}</p>
                                                    </td>
                                                    <td className="px-6 py-3"><span className={pCfg.className}>{pCfg.label}</span></td>
                                                    <td className="px-6 py-3 text-sm font-semibold text-gray-900">TZS {Number(row.amount).toLocaleString()}</td>
                                                    <td className="px-6 py-3"><span className={sCfg.className}>{sCfg.label}</span></td>
                                                    <td className="px-6 py-3 text-sm text-gray-500">{row.start_date ? new Date(row.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-500">{row.end_date ? new Date(row.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Link to={`/admin/subscriptions/${row.id}`} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 transition-all" title="View">
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                            <Link to={`/admin/subscriptions/${row.id}/edit`} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="Edit">
                                                                <Edit className="w-4 h-4" />
                                                            </Link>
                                                            <button onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); setConfirmOpen(true); }} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
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

                <ConfirmDialog isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setDeleteId(null); }} onConfirm={handleDelete}
                    title="Delete Subscription" message="Are you sure you want to delete this subscription? This action cannot be undone." confirmText="Delete" cancelText="Cancel" variant="danger" />

                <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Success" size="sm">
                    <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-gray-700 font-medium">Subscription deleted successfully</p>
                    </div>
                </Modal>
        </div>
    );
}