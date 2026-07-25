import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import { X, RotateCcw, CheckCircle } from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', badge: 'badge badge-yellow', icon: '⏳' },
    confirmed: { label: 'Confirmed', badge: 'badge badge-green', icon: '✓' },
    processing: { label: 'Processing', badge: 'badge badge-green', icon: '⚙' },
    completed: { label: 'Completed', badge: 'badge badge-green', icon: '✓' },
    cancelled: { label: 'Cancelled', badge: 'badge badge-red', icon: '✕' },
    delivered: { label: 'Delivered', badge: 'badge badge-green', icon: '✓' },
    shipped: { label: 'Shipped', badge: 'badge badge-blue', icon: '🚚' },
};

const PAYMENT_STATUS_CONFIG = {
    paid: { label: 'Paid', badge: 'badge badge-green' },
    pending: { label: 'Pending', badge: 'badge badge-yellow' },
    unpaid: { label: 'Unpaid', badge: 'badge badge-red' },
    failed: { label: 'Failed', badge: 'badge badge-red' },
    refunded: { label: 'Refunded', badge: 'badge badge-gray' },
};

const PAYMENT_METHOD_LABELS = {
    mobile_money: 'Mobile Money',
    bank_card: 'Bank Card',
    cash: 'M-Pesa',
};

export default function OrderDetailPage() {
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [cancelling, setCancelling] = useState(false);
    const [reordering, setReordering] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data.data || res.data);
        } catch {
            setError('Failed to fetch order details.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    const formatPrice = (price) => `TZS ${Number(price || 0).toLocaleString()}`;

    const handleCancel = async () => {
        if (!confirm('Are you sure you want to cancel this order?')) return;
        setCancelling(true);
        try {
            await api.post(`/customer/orders/${id}/cancel`);
            setMessage('Order cancelled successfully.');
            fetchOrder();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to cancel order.');
        } finally {
            setCancelling(false);
        }
    };

    const handleReorder = async () => {
        setReordering(true);
        try {
            const res = await api.get(`/customer/orders/${id}/reorder`);
            setMessage(`Items added to cart! (${res.data.cart_count} items)`);
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to reorder.');
        } finally {
            setReordering(false);
        }
    };

    const getStatusConfig = (status) => STATUS_CONFIG[status] || { label: status, badge: 'badge badge-gray', icon: '•' };
    const getPaymentStatusConfig = (status) => PAYMENT_STATUS_CONFIG[status] || { label: status, badge: 'badge badge-gray' };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    if (error) {
        return (
            <Layout>
                <div className="max-w-3xl mx-auto px-4 py-16 text-center">
                    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6">
                        {error}
                    </div>
                    <Link
                        to="/customer/orders"
                        className="btn-primary inline-flex"
                    >
                        Back to Orders
                    </Link>
                </div>
            </Layout>
        );
    }

    if (!order) return null;

    const status = getStatusConfig(order.status);
    const payStatus = getPaymentStatusConfig(order.payment_status);
    const items = order.items || order.order_items || [];
    const subtotal = order.subtotal || order.sub_total || items.reduce((sum, item) => {
        return sum + (parseFloat(item.selling_price || item.price || 0) * parseInt(item.quantity || 1, 10));
    }, 0);
    const discount = order.discount || 0;
    const tax = order.tax || 0;
    const total = order.total || order.total_amount || (subtotal - discount + tax);

    const timeline = order.timeline || order.status_history || order.statuses || [];

    return (
        <Layout>
            <div style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }} className="rounded-2xl p-8 overflow-hidden mx-4 mt-4">
                <div className="max-w-5xl mx-auto py-2">
                    <div className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <Link to="/customer/orders" className="hover:text-white transition">Orders</Link>
                        <span>/</span>
                        <span className="text-white font-medium">
                            {order.transaction_code || order.code || `Order #${order.id}`}
                        </span>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">
                                Order {order.transaction_code || order.code || `#${order.id}`}
                            </h1>
                            <p className="text-sm text-white/70">
                                Created: {formatDate(order.created_at || order.date)}
                            </p>
                        </div>
                        <div className="flex items-center flex-wrap gap-2">
                            <span className={status.badge}>
                                {status.label}
                            </span>
                            <span className={payStatus.badge}>
                                {payStatus.label}
                            </span>
                            {['pending', 'confirmed'].includes(order.status) && (
                                <button
                                    onClick={handleCancel}
                                    disabled={cancelling}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50 transition-colors"
                                >
                                    <X size={14} />
                                    {cancelling ? 'Cancelling...' : 'Cancel Order'}
                                </button>
                            )}
                            {order.status === 'completed' && (
                                <button
                                    onClick={handleReorder}
                                    disabled={reordering}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#00D4AA] bg-[#d0f9f1] rounded-lg hover:bg-[#b0f2e3] disabled:opacity-50 transition-colors"
                                >
                                    <RotateCcw size={14} />
                                    {reordering ? 'Adding...' : 'Reorder'}
                                </button>
                            )}
                        </div>
                    </div>

                    {message && (
                        <div className="mt-4 flex items-center gap-2 bg-[#d0f9f1] text-[#006b53] px-4 py-2.5 rounded-lg text-sm">
                            <CheckCircle size={16} />
                            {message}
                            <button onClick={() => setMessage('')} className="ml-auto text-[#006b53]/60 hover:text-[#006b53]">
                                <X size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {order.shop_name && (
                            <div className="card">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">Shop</h2>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                                        <span className="text-primary font-bold text-sm">
                                            {order.shop_name?.charAt(0)?.toUpperCase()}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-gray-800">{order.shop_name}</p>
                                        {order.shop_code && (
                                            <p className="text-xs text-gray-500">{order.shop_code}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="re-table-wrap">
                            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                <h2 className="text-sm font-semibold text-gray-700">Ordered Items</h2>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="re-table">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-3 px-6 font-medium text-gray-500">Product</th>
                                            <th className="text-center py-3 px-4 font-medium text-gray-500">Quantity</th>
                                            <th className="text-right py-3 px-4 font-medium text-gray-500">Unit Price</th>
                                            <th className="text-right py-3 px-6 font-medium text-gray-500">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {items.map((item, index) => {
                                            const price = parseFloat(item.selling_price || item.price || 0);
                                            const qty = parseInt(item.quantity || 1, 10);
                                            const lineTotal = price * qty;
                                            return (
                                                <tr key={item.id || index} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-4 px-6">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                                {item.image || item.product?.image ? (
                                                                    <img
                                                                        src={item.image_url || item.product?.image_url || `/storage/${item.image || item.product?.image}`}
                                                                        alt={item.name || item.product?.name}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center">
                                                                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <span className="font-medium text-gray-800">
                                                                {item.name || item.product?.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center text-gray-700">{qty}</td>
                                                    <td className="py-4 px-4 text-right text-gray-700">{formatPrice(price)}</td>
                                                    <td className="py-4 px-6 text-right font-semibold text-gray-800">{formatPrice(lineTotal)}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {timeline.length > 0 && (
                            <div className="card">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Order History</h2>
                                <div className="relative">
                                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
                                    <div className="space-y-6">
                                        {timeline.map((event, index) => {
                                            const eventStatus = getStatusConfig(event.status || event.new_status);
                                            return (
                                                <div key={event.id || index} className="relative flex items-start space-x-4">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 z-10 ${
                                                        index === 0 ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                                                    }`}>
                                                        <span className="text-xs font-bold">
                                                            {timeline.length - index}
                                                        </span>
                                                    </div>
                                                    <div className="flex-1 pb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <p className="font-medium text-gray-800 text-sm">
                                                                {eventStatus.label}
                                                            </p>
                                                            {event.note && (
                                                                <span className="text-xs text-gray-400">
                                                                    — {event.note}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 mt-0.5">
                                                            {formatDate(event.created_at || event.date)}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="card">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Payment Details</h2>
                            <dl className="space-y-3">
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500">Payment Method</dt>
                                    <dd className="text-sm font-medium text-gray-800">
                                        {PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method || '-'}
                                    </dd>
                                </div>
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500">Payment Status</dt>
                                    <dd>
                                        <span className={payStatus.badge}>
                                            {payStatus.label}
                                        </span>
                                    </dd>
                                </div>
                                {order.paid_at && (
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Payment Date</dt>
                                        <dd className="text-sm font-medium text-gray-800">{formatDate(order.paid_at)}</dd>
                                    </div>
                                )}
                            </dl>
                        </div>

                        <div className="card">
                            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-4">Cost Summary</h2>
                            <dl className="space-y-3">
                                <div className="flex justify-between">
                                    <dt className="text-sm text-gray-500">Product</dt>
                                    <dd className="text-sm text-gray-800">{formatPrice(subtotal)}</dd>
                                </div>
                                {discount > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Discount</dt>
                                        <dd className="text-sm text-green-600">-{formatPrice(discount)}</dd>
                                    </div>
                                )}
                                {tax > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Tax</dt>
                                        <dd className="text-sm text-gray-800">{formatPrice(tax)}</dd>
                                    </div>
                                )}
                                {order.shipping_cost > 0 && (
                                    <div className="flex justify-between">
                                        <dt className="text-sm text-gray-500">Shipping</dt>
                                        <dd className="text-sm text-gray-800">{formatPrice(order.shipping_cost)}</dd>
                                    </div>
                                )}
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex justify-between">
                                        <dt className="font-semibold text-gray-800">Total</dt>
                                        <dd className="text-lg font-bold text-primary">{formatPrice(total)}</dd>
                                    </div>
                                </div>
                            </dl>
                        </div>

                        <Link
                            to="/customer/orders"
                            className="block text-center text-sm text-primary hover:underline"
                        >
                            ← Back to Orders
                        </Link>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
