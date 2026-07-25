import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { ShoppingCart, Search, Eye, CheckCircle, RefreshCw, Calendar, Filter, RotateCcw } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'pending', label: 'Pending' },
    { value: 'paid', label: 'Paid' },
    { value: 'partial', label: 'Partial' },
    { value: 'failed', label: 'Failed' },
    { value: 'refunded', label: 'Refunded' },
];

const ORDER_STATUS_MAP = {
    pending: { label: 'Pending', badge: 'bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmed', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    completed: { label: 'Completed', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-600' },
};

const PAYMENT_STATUS_MAP = {
    pending: { label: 'Pending', badge: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Paid', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    partial: { label: 'Partial', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    failed: { label: 'Failed', badge: 'bg-red-100 text-red-600' },
    refunded: { label: 'Refunded', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
};

export default function OrderListPage() {
    document.title = 'Orders - M-TAI';
    const navigate = useNavigate();

    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalOrders, setTotalOrders] = useState(0);

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [status, setStatus] = useState('');
    const [paymentStatus, setPaymentStatus] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [verifyOrder, setVerifyOrder] = useState(null);
    const [verifying, setVerifying] = useState(false);

    const [statusModalOrder, setStatusModalOrder] = useState(null);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusAction, setStatusAction] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    const [statusDropdownOrderId, setStatusDropdownOrderId] = useState(null);

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) {
                setSelectedBusiness(biz[0].id);
            }
        }).catch(() => setBusinesses([]));
    }, []);

    const fetchOrders = useCallback(async () => {
        if (!selectedBusiness) {
            setOrders([]);
            setTotalOrders(0);
            return;
        }
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                per_page: 15,
            };
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            if (status) params.status = status;
            if (paymentStatus) params.payment_status = paymentStatus;

            const res = await api.get(`/owner/businesses/${selectedBusiness}/orders`, { params });
            const data = res.data?.data || [];
            setOrders(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            setTotalOrders(res.data?.total || data.length);
        } catch {
            setOrders([]);
            setTotalOrders(0);
        } finally {
            setLoading(false);
        }
    }, [selectedBusiness, currentPage, dateFrom, dateTo, status, paymentStatus]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        setCurrentPage(1);
    }, [selectedBusiness, dateFrom, dateTo, status, paymentStatus]);

    const openVerifyModal = (order) => {
        setVerifyOrder(order);
        setVerifyModalOpen(true);
    };

    const handleVerify = async () => {
        if (!verifyOrder) return;
        setVerifying(true);
        try {
            await api.post(`/owner/orders/${verifyOrder.id}/verify`);
            setVerifyModalOpen(false);
            setVerifyOrder(null);
            fetchOrders();
        } catch {
        } finally {
            setVerifying(false);
        }
    };

    const openStatusModal = (order, newStatus) => {
        setStatusModalOrder(order);
        setStatusAction(newStatus);
        setStatusModalOpen(true);
    };

    const handleStatusChange = async () => {
        if (!statusModalOrder || !statusAction) return;
        setStatusUpdating(true);
        try {
            await api.post(`/owner/orders/${statusModalOrder.id}/status`, {
                status: statusAction,
            });
            setStatusModalOpen(false);
            setStatusModalOrder(null);
            setStatusAction('');
            fetchOrders();
        } catch {
        } finally {
            setStatusUpdating(false);
        }
    };

    const getNextStatusLabel = (currentStatus) => {
        const labels = {
            pending: 'Confirmed',
            confirmed: 'Completed',
        };
        const flow = { pending: 'confirmed', confirmed: 'completed' };
        const next = flow[currentStatus];
        return next ? labels[next] : null;
    };

    const handleReset = () => {
        setDateFrom('');
        setDateTo('');
        setStatus('');
        setPaymentStatus('');
    };

    return (
        <div className="space-y-0" onClick={() => { if (statusDropdownOrderId) setStatusDropdownOrderId(null); }}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4">
                    <Filter size={14} className="text-[#00D4AA] mr-2" /> Search Resources
                    {totalOrders > 0 && (
                        <span className="ml-auto text-sm text-gray-500">
                            Total orders: <span className="font-semibold text-gray-900">{totalOrders}</span>
                        </span>
                    )}
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={selectedBusiness}
                            onChange={(e) => setSelectedBusiness(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            <option value="">Select Business</option>
                            {businesses.map((biz) => (
                                <option key={biz.id} value={biz.id}>{biz.name || biz.business_name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={dateFrom}
                                onChange={(e) => setDateFrom(e.target.value)}
                                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                            />
                        </div>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                type="date"
                                value={dateTo}
                                onChange={(e) => setDateTo(e.target.value)}
                                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            {STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                        <select
                            value={paymentStatus}
                            onChange={(e) => setPaymentStatus(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            {PAYMENT_STATUS_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
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
                        <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">Select a business to view orders</p>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
                </div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Orders ({orders.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Code</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Total</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Payment</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <ShoppingCart size={40} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-sm text-gray-500">No data available</p>
                                        </td>
                                    </tr>
                                ) : orders.map((row) => {
                                    const oCfg = ORDER_STATUS_MAP[row.status] || ORDER_STATUS_MAP.pending;
                                    const pCfg = PAYMENT_STATUS_MAP[row.payment_status] || PAYMENT_STATUS_MAP.pending;
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <span className="font-mono text-sm font-semibold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">
                                                    {row.transaction_code || row.code || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-gray-700">{row.customer?.name || row.customer_name || '-'}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-gray-600 text-sm">
                                                    {row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="font-semibold text-gray-900">
                                                    TZS {Number(row.total || row.total_amount || 0).toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${oCfg.badge}`}>
                                                    {oCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${pCfg.badge}`}>
                                                    {pCfg.label}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/owner/orders/${row.id}`)}
                                                        className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-all"
                                                        title="View"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    {row.status === 'pending' && (
                                                        <button
                                                            onClick={() => openVerifyModal(row)}
                                                            className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all"
                                                            title="Confirm"
                                                        >
                                                            <CheckCircle size={14} />
                                                        </button>
                                                    )}
                                                    <div className="relative">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setStatusDropdownOrderId(statusDropdownOrderId === row.id ? null : row.id);
                                                            }}
                                                            className="h-8 w-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all"
                                                            title="Change Status"
                                                        >
                                                            <RefreshCw size={14} />
                                                        </button>
                                                        {statusDropdownOrderId === row.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1">
                                                                {row.status !== 'pending' && row.status !== 'cancelled' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setStatusDropdownOrderId(null);
                                                                            openStatusModal(row, 'cancelled');
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                )}
                                                                {row.status === 'pending' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setStatusDropdownOrderId(null);
                                                                            openStatusModal(row, 'confirmed');
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 text-sm text-[#00D4AA] hover:bg-[#00D4AA]/5 transition"
                                                                    >
                                                                        Confirm
                                                                    </button>
                                                                )}
                                                                {row.status === 'confirmed' && (
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            setStatusDropdownOrderId(null);
                                                                            openStatusModal(row, 'completed');
                                                                        }}
                                                                        className="w-full text-left px-4 py-2 text-sm text-[#00D4AA] hover:bg-[#00D4AA]/5 transition"
                                                                    >
                                                                        Complete
                                                                    </button>
                                                                )}
                                                                {(row.status === 'completed' || row.status === 'cancelled') && (
                                                                    <span className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-default">
                                                                        No action
                                                                    </span>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            <Modal isOpen={verifyModalOpen} onClose={() => { setVerifyModalOpen(false); setVerifyOrder(null); }} title="Confirm Order" size="sm">
                {verifyOrder && (
                    <div>
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Transaction Code</span>
                                <span className="text-sm font-semibold text-gray-800 font-mono">
                                    {verifyOrder.transaction_code || verifyOrder.code || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Customer</span>
                                <span className="text-sm font-medium text-gray-800">
                                    {verifyOrder.customer?.name || verifyOrder.customer_name || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Total</span>
                                <span className="text-sm font-bold text-gray-800">
                                    TZS {Number(verifyOrder.total || verifyOrder.total_amount || 0).toLocaleString()}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Are you sure you want to confirm this order? This action will mark the order as reviewed and accepted.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => { setVerifyModalOpen(false); setVerifyOrder(null); }}
                                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleVerify}
                                disabled={verifying}
                                className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]"
                            >
                                {verifying ? 'Confirming...' : 'Yes, Confirm'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={statusModalOpen} onClose={() => { setStatusModalOpen(false); setStatusModalOrder(null); setStatusAction(''); }} title="Change Order Status" size="sm">
                {statusModalOrder && (
                    <div>
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Transaction Code</span>
                                <span className="text-sm font-semibold text-gray-800 font-mono">
                                    {statusModalOrder.transaction_code || statusModalOrder.code || '-'}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Current Status</span>
                                {(() => {
                                    const cfg = ORDER_STATUS_MAP[statusModalOrder.status] || ORDER_STATUS_MAP.pending;
                                    return (
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>
                                            {cfg.label}
                                        </span>
                                    );
                                })()}
                            </div>
                        </div>
                        {statusAction === 'cancelled' ? (
                            <p className="text-sm text-red-600 mb-6">
                                Are you sure you want to cancel this order? This action cannot be undone.
                            </p>
                        ) : (
                            <p className="text-sm text-gray-600 mb-6">
                                This order will be changed to <strong>{getNextStatusLabel(statusModalOrder.status)}</strong>. Continue?
                            </p>
                        )}
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => { setStatusModalOpen(false); setStatusModalOrder(null); setStatusAction(''); }}
                                className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusChange}
                                disabled={statusUpdating}
                                className={`px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 ${
                                    statusAction === 'cancelled'
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-[#00D4AA] hover:bg-[#00B894]'
                                }`}
                            >
                                {statusUpdating ? 'Updating...' : statusAction === 'cancelled' ? 'Yes, Cancel' : 'Yes, Change'}
                            </button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
