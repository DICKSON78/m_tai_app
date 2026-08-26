import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import { ShoppingCart, Edit, Hash, User, Store, DollarSign, CheckCircle, CreditCard, Calendar } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';
import HeroBanner from '../../components/casfeta/HeroBanner';
import InfoCard from '../../components/casfeta/InfoCard';
import DataItem from '../../components/casfeta/DataItem';

const ORDER_STATUS_MAP = {
    pending: { label: 'Pending', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
    confirmed: { label: 'Confirmed', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700' },
    completed: { label: 'Completed', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' },
};

const PAYMENT_STATUS_MAP = {
    pending: { label: 'Pending', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
    paid: { label: 'Paid', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' },
    partial: { label: 'Partial', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700' },
    failed: { label: 'Failed', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700' },
    refunded: { label: 'Refunded', badge: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700' },
};

export default function AdminOrderShowPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/admin/orders/${id}`).then(res => setOrder(res.data)).catch((error) => { console.error('Failed to fetch order:', error); navigate('/admin/orders'); }).finally(() => setLoading(false));
    }, [id, navigate]);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;
    if (!order) return null;

    const status = ORDER_STATUS_MAP[order.status] || ORDER_STATUS_MAP.pending;
    const payment = PAYMENT_STATUS_MAP[order.payment_status] || PAYMENT_STATUS_MAP.pending;

    return (
        <div className="space-y-6">
            <PageHeader
                title={`Order ${order.transaction_code || order.code}`}
                subtitle="Order Details"
                backTo="/admin/orders"
                icon={<ShoppingCart size={20} />}
                actions={
                    <Link to={`/admin/orders/${id}/edit`} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#00D4AA] hover:bg-[#00B894] text-white rounded-lg text-sm font-medium transition-all">
                        <Edit size={15} /> Edit
                    </Link>
                }
            />

            <HeroBanner
                icon={<ShoppingCart size={36} />}
                name={`Order ${order.transaction_code || order.code}`}
                subtitle={`${order.customer?.name || order.customer_name || 'Unknown'} - TZS ${Number(order.total || order.total_amount || 0).toLocaleString()}`}
                status={status.label}
                statusColor={order.status === 'completed' ? 'bg-green-500' : order.status === 'cancelled' ? 'bg-red-500' : order.status === 'confirmed' ? 'bg-blue-500' : 'bg-yellow-500'}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <InfoCard icon={<Hash size={18} />} title="Order Information" subtitle="Basic order details">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DataItem label="Code" value={order.transaction_code || order.code || '-'} icon={<Hash size={14} />} mono />
                            <DataItem label="Customer" value={order.customer?.name || order.customer_name || '-'} icon={<User size={14} />} />
                            <DataItem label="Shop" value={order.business?.name || order.business_name || '-'} icon={<Store size={14} />} />
                            <DataItem label="Total" value={`TZS ${Number(order.total || order.total_amount || 0).toLocaleString()}`} icon={<DollarSign size={14} />} />
                            <DataItem label="Date" value={order.created_at ? new Date(order.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} icon={<Calendar size={14} />} />
                            <DataItem label="Order Status" value={status.label} icon={<CheckCircle size={14} />} />
                        </div>
                    </InfoCard>
                </div>

                <div className="space-y-6">
                    <InfoCard icon={<CreditCard size={18} />} title="Payment & Status" subtitle="Payment information">
                        <div className="space-y-4">
                            <DataItem label="Payment Status" value={payment.label} icon={<CreditCard size={14} />} />
                            <DataItem label="Total Amount" value={`TZS ${Number(order.total || order.total_amount || 0).toLocaleString()}`} icon={<DollarSign size={14} />} />
                        </div>
                        {order.customer && (
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Customer Info</h4>
                                <div className="space-y-4">
                                    <DataItem label="Name" value={order.customer.name || '-'} icon={<User size={14} />} />
                                    <DataItem label="Phone" value={order.customer.phone || '-'} icon={<User size={14} />} />
                                    <DataItem label="Email" value={order.customer.email || '-'} icon={<User size={14} />} />
                                </div>
                            </div>
                        )}
                    </InfoCard>
                </div>
            </div>
        </div>
    );
}
