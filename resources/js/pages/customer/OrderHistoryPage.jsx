import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/casfeta/PageHeader';
import { ShoppingCart } from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', badge: 'badge badge-yellow' },
    confirmed: { label: 'Confirmed', badge: 'badge badge-green' },
    processing: { label: 'Processing', badge: 'badge badge-green' },
    completed: { label: 'Completed', badge: 'badge badge-green' },
    cancelled: { label: 'Cancelled', badge: 'badge badge-red' },
    delivered: { label: 'Delivered', badge: 'badge badge-green' },
};

const PAYMENT_STATUS_CONFIG = {
    paid: { label: 'Paid', badge: 'badge badge-green' },
    pending: { label: 'Pending', badge: 'badge badge-yellow' },
    unpaid: { label: 'Unpaid', badge: 'badge badge-red' },
    failed: { label: 'Failed', badge: 'badge badge-red' },
    refunded: { label: 'Refunded', badge: 'badge badge-gray' },
};

export default function OrderHistoryPage() {
    const navigate = useNavigate();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [filterStatus, setFilterStatus] = useState('');

    const fetchOrders = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const params = { page, per_page: 10 };
            if (filterStatus) params.status = filterStatus;

            const res = await api.get('/orders', { params });
            const data = res.data;
            setOrders(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotalOrders(data.total || 0);
        } catch {
            setOrders([]);
        } finally {
            setLoading(false);
        }
    }, [filterStatus]);

    useEffect(() => {
        fetchOrders(1);
    }, [fetchOrders]);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus]);

    const handlePageChange = (page) => {
        fetchOrders(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch {
            return dateStr;
        }
    };

    const formatPrice = (price) => `TZS ${Number(price || 0).toLocaleString()}`;

    const getStatusConfig = (status) => STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    const getPaymentStatusConfig = (status) => PAYMENT_STATUS_CONFIG[status] || { label: status, badge: 'badge badge-gray' };

    return (
        <div>
            <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-2">
                <PageHeader title="My Orders" subtitle="View your order history and track deliveries" icon={<ShoppingCart size={20} />} />
            </div>
            <div style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }} className="rounded-2xl p-8 overflow-hidden mx-4 mt-4">
                <div className="py-2">
                    <h1 className="text-2xl font-bold text-white mb-1">Order History</h1>
                    {totalOrders > 0 && (
                        <p className="text-sm text-white/70">Total orders: {totalOrders}</p>
                    )}
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <div className="tab-nav">
                        <button
                            onClick={() => setFilterStatus('')}
                            className={`tab-btn ${
                                !filterStatus ? 'tab-btn-active' : 'tab-btn-inactive'
                            }`}
                        >
                            All
                        </button>
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <button
                                key={key}
                                onClick={() => setFilterStatus(key)}
                                className={`tab-btn ${
                                    filterStatus === key ? 'tab-btn-active' : 'tab-btn-inactive'
                                }`}
                            >
                                {config.label}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : orders.length === 0 ? (
                    <div className="card empty-state">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">No Orders</h2>
                        <p className="text-gray-500 mb-6">You haven't placed any orders yet.</p>
                        <Link
                            to="/customer/shops"
                            className="btn-primary inline-flex"
                        >
                            Start Shopping
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {orders.map((order) => {
                                const status = getStatusConfig(order.status);
                                const payStatus = getPaymentStatusConfig(order.payment_status);
                                return (
                                    <div
                                        key={order.id}
                                        onClick={() => navigate(`/customer/orders/${order.id}`)}
                                        className="stat-card cursor-pointer"
                                    >
                                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="font-bold text-gray-800">
                                                        {order.transaction_code || order.code || `#${order.id}`}
                                                    </h3>
                                                    <span className={status.badge}>
                                                        {status.label}
                                                    </span>
                                                    <span className={payStatus.badge}>
                                                        {payStatus.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                    <span className="flex items-center space-x-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span>{formatDate(order.created_at || order.date)}</span>
                                                    </span>
                                                    {order.shop_name && (
                                                        <span className="flex items-center space-x-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                                            </svg>
                                                            <span>{order.shop_name}</span>
                                                        </span>
                                                    )}
                                                    {order.items_count !== undefined && (
                                                        <span className="flex items-center space-x-1">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                            </svg>
                                                            <span>{order.items_count} products</span>
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <p className="text-lg font-bold text-primary">
                                                    {formatPrice(order.total || order.total_amount)}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    View ›
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
