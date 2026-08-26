import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/casfeta/PageHeader';
import { Truck } from 'lucide-react';

const STATUS_CONFIG = {
    pending: { label: 'Pending', badge: 'badge badge-yellow', color: 'text-yellow-600' },
    picked_up: { label: 'Picked Up', badge: 'badge badge-blue', color: 'text-blue-600' },
    in_transit: { label: 'In Transit', badge: 'badge badge-blue', color: 'text-blue-600' },
    delivered: { label: 'Delivered', badge: 'badge badge-green', color: 'text-green-600' },
    failed: { label: 'Failed', badge: 'badge badge-red', color: 'text-red-600' },
};

export default function CustomerDeliveriesPage() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchDeliveries = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/customer/deliveries', { params: { page: currentPage } });
            const data = res.data?.data || [];
            setDeliveries(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch (error) { console.error('Failed to fetch deliveries:', error); setDeliveries([]); } finally {
            setLoading(false);
        }
    }, [currentPage]);

    useEffect(() => {
        fetchDeliveries();
    }, [fetchDeliveries]);

    const formatDate = (dateStr) => {
        if (!dateStr) return '-';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div>
            <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-2">
                <PageHeader title="Deliveries" subtitle="Track your delivery orders" icon={<Truck size={20} />} />
            </div>
            <div style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }} className="rounded-2xl p-8 overflow-hidden mx-4 mt-4">
                <div className="relative">
                    <p className="text-[11px] font-semibold text-[#00D4AA] uppercase tracking-widest mb-1.5">Deliveries</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">My Deliveries</h1>
                    <p className="text-white/50 text-sm">Track your order deliveries</p>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
                    </div>
                ) : deliveries.length === 0 ? (
                    <div className="text-center py-16">
                        <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl">📦</span>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">No deliveries yet</h3>
                        <p className="text-sm text-gray-500 mb-6">Your order deliveries will appear here</p>
                        <Link to="/customer/orders" className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-[#00D4AA] rounded-lg hover:bg-[#00B894] transition-colors">
                            Browse Orders
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {deliveries.map((delivery) => {
                            const st = STATUS_CONFIG[delivery.status] || { label: delivery.status, badge: 'badge badge-gray', color: 'text-gray-600' };
                            return (
                                <div key={delivery.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-800">{delivery.item_description || 'Delivery'}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">#{delivery.id} &middot; {formatDate(delivery.created_at)}</p>
                                        </div>
                                        <span className={st.badge}>{st.label}</span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                                        <div>
                                            <p className="text-gray-400 text-xs mb-0.5">From</p>
                                            <p className="text-gray-700">{delivery.pickup_location || '-'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400 text-xs mb-0.5">To</p>
                                            <p className="text-gray-700">{delivery.destination || '-'}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between text-sm border-t border-gray-100 pt-3">
                                        <div className="flex items-center gap-4">
                                            {delivery.transporter && (
                                                <div>
                                                    <p className="text-gray-400 text-xs">Driver</p>
                                                    <p className="text-gray-700">{delivery.transporter.full_name || '-'}</p>
                                                </div>
                                            )}
                                            {delivery.cost && (
                                                <div>
                                                    <p className="text-gray-400 text-xs">Cost</p>
                                                    <p className="text-gray-700 font-medium">TZS {Number(delivery.cost).toLocaleString()}</p>
                                                </div>
                                            )}
                                        </div>
                                        {delivery.order_id && (
                                            <Link
                                                to={`/customer/orders/${delivery.order_id}`}
                                                className="text-xs text-[#00D4AA] hover:text-[#00B894] font-medium"
                                            >
                                                View Order
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}

                        <Pagination
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
