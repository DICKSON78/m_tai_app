import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { ShoppingCart, Search, Eye, Edit, Hash, User, Store, DollarSign, CheckCircle, CreditCard, Calendar, Clock, SlidersHorizontal, X, Trash2, Plus } from 'lucide-react';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import PageHeader from '../../components/casfeta/PageHeader';

const ORDER_STATUS_MAP = {
    pending: { label: 'Pending', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmed', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700' },
    completed: { label: 'Completed', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' },
};

const PAYMENT_STATUS_MAP = {
    pending: { label: 'Pending', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
    paid: { label: 'Paid', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' },
    partial: { label: 'Partial', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700' },
    failed: { label: 'Failed', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' },
    refunded: { label: 'Refunded', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700' },
};

export default function AdminOrdersPage() {
    document.title = 'Orders - M-Tai Admin';
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState({ total: 0, pending: 0, confirmed: 0, completed: 0, cancelled: 0, total_revenue: 0 });
    const [deleteId, setDeleteId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (status) params.status = status;
            if (paymentStatus) params.payment_status = paymentStatus;
            const res = await api.get('/admin/orders', { params });
            const data = res.data?.data || [];
            setOrders(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch (error) { console.error('Failed to fetch orders:', error); setOrders([]); } finally { setLoading(false); }
    }, [currentPage, search, status, paymentStatus]);

    useEffect(() => { fetchOrders(); }, [fetchOrders]);
    useEffect(() => { setCurrentPage(1); }, [search, status, paymentStatus]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try { await api.delete(`/admin/orders/${deleteId}`); setSuccessModal(true); setTimeout(() => setSuccessModal(false), 2000); fetchOrders(); } catch (error) { console.error('Failed to delete order:', error); alert(error?.response?.data?.message || 'Failed to delete order. Please try again.'); }
        setDeleteId(null); setConfirmOpen(false);
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Order Management"
                subtitle="View and manage all platform orders"
                icon={<ShoppingCart size={20} />}
            />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Orders</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                <ShoppingCart className="w-6 h-6 text-[#00D4AA]" />
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
                                <p className="text-sm font-medium text-gray-500 mb-1">Completed</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.completed}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <CheckCircle className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">TZS {Number(summary.total_revenue || 0).toLocaleString()}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <DollarSign className="w-6 h-6 text-blue-500" />
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
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                        </div>
                        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                            <option value="">All Statuses</option>
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                        <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)} className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                            <option value="">All Payments</option>
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="partial">Partial</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                        </select>
                        {(search || status || paymentStatus) && (
                            <button onClick={() => { setSearch(''); setStatus(''); setPaymentStatus(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                                <X className="w-4 h-4" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Orders</h3>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                    ) : orders.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <ShoppingCart className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No data available</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Order Code</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Shop</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Total</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Payment</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                            <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {orders.map((row) => {
                                            const oCfg = ORDER_STATUS_MAP[row.status] || ORDER_STATUS_MAP.pending;
                                            const pCfg = PAYMENT_STATUS_MAP[row.payment_status] || PAYMENT_STATUS_MAP.pending;
                                            return (
                                                <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-3"><span className="font-mono text-sm text-gray-700 bg-gray-100 px-2 py-0.5 rounded">{row.transaction_code || row.code || '-'}</span></td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">{row.customer?.name || row.customer_name || '-'}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">{row.business?.name || row.business_name || '-'}</td>
                                                    <td className="px-6 py-3 text-sm font-semibold text-gray-900">TZS {Number(row.total || row.total_amount || 0).toLocaleString()}</td>
                                                    <td className="px-6 py-3"><span className={oCfg.className}>{oCfg.label}</span></td>
                                                    <td className="px-6 py-3"><span className={pCfg.className}>{pCfg.label}</span></td>
                                                    <td className="px-6 py-3 text-sm text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <Link to={`/admin/orders/${row.id}`} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 transition-all" title="View">
                                                                <Eye className="w-4 h-4" />
                                                            </Link>
                                                            <Link to={`/admin/orders/${row.id}/edit`} className="h-8 w-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-teal-600 hover:bg-teal-50 transition-all" title="Edit">
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
                    title="Delete Order" message="Are you sure you want to delete this order? This action cannot be undone." confirmText="Delete" cancelText="Cancel" variant="danger" />
                <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Success" size="sm">
                    <div className="text-center py-4">
                        <div className="w-16 h-16 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <p className="text-gray-700 font-medium">Order deleted successfully</p>
                    </div>
                </Modal>
            </div>
    );
}
