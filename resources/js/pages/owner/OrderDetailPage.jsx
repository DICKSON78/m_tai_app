import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/casfeta/PageHeader';
import HeroBanner from '../../components/casfeta/HeroBanner';
import DataItem from '../../components/casfeta/DataItem';
import EmptyState from '../../components/casfeta/EmptyState';
import { ShoppingCart, User, Phone, MapPin, Package, CreditCard, DollarSign, Calendar, Clock, FileText, CheckCircle, RefreshCw, XCircle } from 'lucide-react';

const ORDER_STATUS_MAP = {
    pending: { label: 'Pending', badge: 'badge badge-yellow' },
    confirmed: { label: 'Confirmed', badge: 'badge badge-green' },
    completed: { label: 'Completed', badge: 'badge badge-green' },
    cancelled: { label: 'Cancelled', badge: 'badge badge-red' },
};

const PAYMENT_STATUS_MAP = {
    pending: { label: 'Pending', badge: 'badge badge-yellow' },
    paid: { label: 'Paid', badge: 'badge badge-green' },
    partial: { label: 'Partial', badge: 'badge badge-green' },
    failed: { label: 'Failed', badge: 'badge badge-red' },
    refunded: { label: 'Refunded', badge: 'badge badge-green' },
};

const PAYMENT_METHOD_MAP = {
    cash: 'Cash',
    mobile: 'Mobile',
    bank: 'Bank Transfer',
    card: 'Card',
    other: 'Other',
};

export default function OrderDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const [verifyModalOpen, setVerifyModalOpen] = useState(false);
    const [verifying, setVerifying] = useState(false);

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusAction, setStatusAction] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    const [cancelModalOpen, setCancelModalOpen] = useState(false);
    const [cancelling, setCancelling] = useState(false);

    const fetchOrder = async () => {
        try {
            const res = await api.get(`/orders/${id}`);
            setOrder(res.data?.data || res.data);
        } catch (error) {
            console.error('Failed to fetch order:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const handleVerify = async () => {
        setVerifying(true);
        try {
            await api.post(`/owner/orders/${id}/verify`);
            setVerifyModalOpen(false);
            fetchOrder();
        } catch (error) {
            console.error('Failed to verify order:', error);
            alert(error?.response?.data?.message || 'Failed to verify order. Please try again.');
        } finally {
            setVerifying(false);
        }
    };

    const openStatusModal = (newStatus) => {
        setStatusAction(newStatus);
        setStatusModalOpen(true);
    };

    const handleStatusChange = async () => {
        if (!statusAction) return;
        setStatusUpdating(true);
        try {
            await api.post(`/owner/orders/${id}/status`, { status: statusAction });
            setStatusModalOpen(false);
            setStatusAction('');
            fetchOrder();
        } catch (error) {
            console.error('Failed to update order status:', error);
            alert(error?.response?.data?.message || 'Failed to update order status. Please try again.');
        } finally {
            setStatusUpdating(false);
        }
    };

    const handleCancel = async () => {
        setCancelling(true);
        try {
            await api.post(`/owner/orders/${id}/status`, { status: 'cancelled' });
            setCancelModalOpen(false);
            fetchOrder();
        } catch (error) {
            console.error('Failed to cancel order:', error);
            alert(error?.response?.data?.message || 'Failed to cancel order. Please try again.');
        } finally {
            setCancelling(false);
        }
    };

    const getNextStatus = (currentStatus) => {
        const flow = {
            pending: 'confirmed',
            confirmed: 'completed',
        };
        return flow[currentStatus] || null;
    };

    const getNextStatusLabel = (currentStatus) => {
        const labels = {
            pending: 'Confirmed',
            confirmed: 'Completed',
        };
        const next = getNextStatus(currentStatus);
        return next ? labels[next] : null;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
            </div>
        );
    }

    if (!order) {
        return (
            <EmptyState
                title="Order not found"
                description="The order you're looking for doesn't exist or has been removed."
                actionTo="/owner/orders"
                actionLabel="Back to Orders"
            />
        );
    }

    const statusCfg = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
    const paymentCfg = PAYMENT_STATUS_MAP[order.payment_status] || PAYMENT_STATUS_MAP.pending;
    const items = order.items || order.order_items || [];
    const subtotal = Number(order.subtotal || 0);
    const discount = Number(order.discount || 0);
    const tax = Number(order.tax || 0);
    const total = Number(order.total || order.total_amount || 0);
    const orderCode = order.transaction_code || order.code || `#${order.id}`;

    const statusColor = order.status === 'cancelled' ? 'bg-red-500'
        : order.status === 'completed' ? 'bg-green-500'
        : order.status === 'confirmed' ? 'bg-blue-500'
        : 'bg-yellow-500';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Order Details"
                subtitle={orderCode}
                icon={<ShoppingCart size={22} />}
                backTo="/owner/orders"
                actions={
                    <>
                        {order.status === 'pending' && (
                            <button
                                onClick={() => setVerifyModalOpen(true)}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] text-white font-medium rounded-lg hover:bg-[#00B894] transition-all duration-200 text-sm shadow-md hover:shadow-lg"
                            >
                                <CheckCircle size={16} />
                                Verify
                            </button>
                        )}
                        {getNextStatus(order.status) && (
                            <button
                                onClick={() => openStatusModal(getNextStatus(order.status))}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm"
                            >
                                <RefreshCw size={16} />
                                Change Status
                            </button>
                        )}
                        {order.status !== 'completed' && order.status !== 'cancelled' && (
                            <button
                                onClick={() => setCancelModalOpen(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-all duration-200 text-sm border border-red-200"
                            >
                                <XCircle size={16} />
                                Cancel
                            </button>
                        )}
                    </>
                }
            />

            <HeroBanner
                icon={<ShoppingCart size={36} />}
                name={`Order ${orderCode}`}
                subtitle={order.customer?.name || order.customer_name || 'Customer order'}
                status={statusCfg.label}
                statusColor={statusColor}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><User size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Customer Information</h3>
                                    <p className="text-xs text-gray-500">Customer details for this order</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DataItem
                                    label="Customer Name"
                                    value={order.customer?.name || order.customer_name || '-'}
                                    icon={<User size={14} />}
                                />
                                <DataItem
                                    label="Phone Number"
                                    value={order.customer?.phone || order.customer_phone || order.phone || '-'}
                                    icon={<Phone size={14} />}
                                />
                                {(order.customer?.location || order.customer?.address || order.delivery_address) && (
                                    <DataItem
                                        label="Location"
                                        value={order.customer?.location || order.customer?.address || order.delivery_address || '-'}
                                        icon={<MapPin size={14} />}
                                        full
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><Package size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Ordered Items</h3>
                                    <p className="text-xs text-gray-500">{items.length} item(s) in this order</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {items.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">No items listed.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="re-table">
                                        <thead>
                                            <tr>
                                                <th>Product</th>
                                                <th className="text-center">Quantity</th>
                                                <th className="text-right">Unit Price</th>
                                                <th className="text-right">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item, index) => {
                                                const qty = Number(item.quantity || 0);
                                                const unitPrice = Number(item.unit_price || item.price || 0);
                                                const itemTotal = Number(item.total || item.subtotal || qty * unitPrice);
                                                return (
                                                    <tr key={item.id || index}>
                                                        <td>
                                                            <span className="font-medium text-gray-800">
                                                                {item.product?.name || item.product_name || item.name || '-'}
                                                            </span>
                                                        </td>
                                                        <td className="text-center text-gray-700">{qty}</td>
                                                        <td className="text-right text-gray-700">
                                                            TZS {unitPrice.toLocaleString()}
                                                        </td>
                                                        <td className="text-right font-semibold text-gray-800">
                                                            TZS {itemTotal.toLocaleString()}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><CreditCard size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Payment</h3>
                                    <p className="text-xs text-gray-500">Payment details for this order</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DataItem
                                    label="Payment Method"
                                    value={PAYMENT_METHOD_MAP[order.payment_method] || order.payment_method || '-'}
                                    icon={<CreditCard size={14} />}
                                />
                                <DataItem
                                    label="Payment Status"
                                    value={paymentCfg.label}
                                    icon={<CheckCircle size={14} />}
                                />
                                <DataItem
                                    label="Amount Paid"
                                    value={`TZS ${Number(order.amount_paid || order.paid_amount || 0).toLocaleString()}`}
                                    icon={<DollarSign size={14} />}
                                />
                                {(order.payment_reference || order.reference) && (
                                    <DataItem
                                        label="Payment Reference"
                                        value={order.payment_reference || order.reference}
                                        icon={<FileText size={14} />}
                                        mono
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><DollarSign size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
                                    <p className="text-xs text-gray-500">Order totals</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <DollarSign size={14} className="text-gray-400" />
                                    <span className="text-sm text-gray-500">Subtotal</span>
                                </div>
                                <span className="text-sm font-semibold text-gray-900">TZS {subtotal.toLocaleString()}</span>
                            </div>
                            {discount > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={14} className="text-red-400" />
                                        <span className="text-sm text-gray-500">Discount</span>
                                    </div>
                                    <span className="text-sm font-semibold text-red-500">-TZS {discount.toLocaleString()}</span>
                                </div>
                            )}
                            {tax > 0 && (
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={14} className="text-gray-400" />
                                        <span className="text-sm text-gray-500">Tax</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">TZS {tax.toLocaleString()}</span>
                                </div>
                            )}
                            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                <span className="text-gray-800 font-semibold text-sm">Total</span>
                                <span className="text-lg font-bold text-[#00D4AA]">TZS {total.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><Clock size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Additional Details</h3>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span className="text-sm text-gray-500">Order Date</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    }) : '-'}</span>
                                </div>
                                {order.updated_at && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-gray-400" />
                                            <span className="text-sm text-gray-500">Last Updated</span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{new Date(order.updated_at).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}</span>
                                    </div>
                                )}
                                {order.notes && (
                                    <div className="bg-gray-50 p-4 rounded-lg mt-3">
                                        <p className="text-xs text-gray-500 mb-1">Notes</p>
                                        <p className="text-sm text-gray-700">{order.notes}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Modal isOpen={verifyModalOpen} onClose={() => setVerifyModalOpen(false)} title="Verify Order" size="sm">
                <div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Transaction Code</span>
                            <span className="text-sm font-semibold text-gray-800 font-mono">
                                {order.transaction_code || order.code || `#${order.id}`}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Customer</span>
                            <span className="text-sm font-medium text-gray-800">
                                {order.customer?.name || order.customer_name || '-'}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Total</span>
                            <span className="text-sm font-bold text-gray-800">
                                TZS {total.toLocaleString()}
                            </span>
                        </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to verify this order? This action will mark the order as reviewed and accepted.
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setVerifyModalOpen(false)}
                            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleVerify}
                            disabled={verifying}
                            className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]"
                        >
                            {verifying ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Verifying...
                                </span>
                            ) : 'Yes, Verify'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={statusModalOpen} onClose={() => { setStatusModalOpen(false); setStatusAction(''); }} title="Change Order Status" size="sm">
                <div>
                    <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-gray-500">Current Status</span>
                            <span className={statusCfg.badge}>
                                {statusCfg.label}
                            </span>
                        </div>
                        {statusAction && (
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">New Status</span>
                                <span className={(ORDER_STATUS_MAP[statusAction] || ORDER_STATUS_MAP.pending).badge}>
                                    {(ORDER_STATUS_MAP[statusAction] || ORDER_STATUS_MAP.pending).label}
                                </span>
                            </div>
                        )}
                    </div>
                    <p className="text-sm text-gray-600 mb-6">
                        {statusAction === 'cancelled'
                            ? 'Are you sure you want to cancel this order? This action cannot be undone.'
                            : `This order will be changed to "${getNextStatusLabel(order.status)}". Continue?`
                        }
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => { setStatusModalOpen(false); setStatusAction(''); }}
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
                            {statusUpdating ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Updating...
                                </span>
                            ) : statusAction === 'cancelled' ? 'Yes, Cancel' : 'Yes, Change'}
                        </button>
                    </div>
                </div>
            </Modal>

            <Modal isOpen={cancelModalOpen} onClose={() => setCancelModalOpen(false)} title="Cancel Order" size="sm">
                <div>
                    <p className="text-sm text-gray-600 mb-6">
                        Are you sure you want to cancel this order? This action cannot be undone and the order will be marked as "Cancelled".
                    </p>
                    <div className="flex justify-end space-x-3">
                        <button
                            onClick={() => setCancelModalOpen(false)}
                            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={cancelling}
                            className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-red-500 hover:bg-red-600"
                        >
                            {cancelling ? (
                                <span className="flex items-center gap-2">
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Cancelling...
                                </span>
                            ) : 'Yes, Cancel'}
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
