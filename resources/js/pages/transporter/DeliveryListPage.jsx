import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import PageHeader from '../../components/casfeta/PageHeader';
import { Truck, Clock, Package, CheckCircle } from 'lucide-react';

const DELIVERY_TABS = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Completed' },
];

const DELIVERY_STATUS_MAP = {
    pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
    accepted: { label: 'Accepted', classes: 'bg-blue-100 text-blue-700' },
    in_transit: { label: 'In Transit', classes: 'bg-green-100 text-green-700' },
    delivered: { label: 'Completed', classes: 'bg-green-100 text-green-700' },
    cancelled: { label: 'Cancelled', classes: 'bg-red-100 text-red-700' },
};

const GOODS_CATEGORIES = {
    mkate: 'Bread', chakula: 'Food', vinywaji: 'Drinks', dawa: 'Medicine',
    nguo: 'Clothing', vifaa_uyenzi: 'Building Materials', nyingine: 'Other',
};

export default function DeliveryListPage() {
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, pending: 0, in_transit: 0, delivered: 0 });
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusDelivery, setStatusDelivery] = useState(null);
    const [statusAction, setStatusAction] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [detailDelivery, setDetailDelivery] = useState(null);

    const fetchDeliveries = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (statusFilter) params.status = statusFilter;
            const res = await api.get('/transporter/deliveries', { params });
            const data = res.data?.data || [];
            setDeliveries(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.stats) {
                setStats(res.data.stats);
            } else {
                const total = res.data?.total || data.length;
                const pending = data.filter(d => d.status === 'pending' || d.status === 'accepted').length;
                const in_transit = data.filter(d => d.status === 'in_transit').length;
                const delivered = data.filter(d => d.status === 'delivered').length;
                setStats({ total, pending, in_transit, delivered });
            }
        } catch (error) { console.error('Failed to fetch deliveries:', error); setDeliveries([]); } finally { setLoading(false); }
    }, [currentPage, statusFilter]);

    useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);
    useEffect(() => { setCurrentPage(1); }, [statusFilter]);

    const openStatusModal = (delivery, newStatus) => { setStatusDelivery(delivery); setStatusAction(newStatus); setStatusModalOpen(true); };

    const handleStatusChange = async () => {
        if (!statusDelivery || !statusAction) return;
        setStatusUpdating(true);
        try {
            await api.put(`/transporter/deliveries/${statusDelivery.id}/status`, { status: statusAction });
            setStatusModalOpen(false); setStatusDelivery(null); setStatusAction('');
            fetchDeliveries();
        } catch (error) { console.error('Failed to update delivery status:', error); alert(error?.response?.data?.message || 'Failed to update delivery status. Please try again.'); } finally { setStatusUpdating(false); }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="My Deliveries" subtitle="Track and manage your deliveries" icon={<Truck size={20} />} />

            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: 'Total', value: stats.total, icon: Package, color: '#00D4AA' },
                    { label: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b' },
                    { label: 'In Transit', value: stats.in_transit, icon: Truck, color: '#8b5cf6' },
                    { label: 'Completed', value: stats.delivered, icon: CheckCircle, color: '#10b981' },
                ].map((s) => (
                    <div key={s.label} className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">{s.label}</p>
                                <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                                <s.icon className="w-6 h-6" style={{ color: s.color }} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {DELIVERY_TABS.map((tab) => (
                    <button key={tab.key} onClick={() => setStatusFilter(tab.key)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter === tab.key ? 'bg-[#00D4AA] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Deliveries</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">From</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">To</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Product</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Price</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Business</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                            </tr></thead>
                            <tbody>
                                {deliveries.length === 0 ? (
                                    <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500 text-sm">No deliveries found.</td></tr>
                                ) : deliveries.map((row) => {
                                    const cfg = DELIVERY_STATUS_MAP[row.status] || DELIVERY_STATUS_MAP.pending;
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 text-sm text-gray-600">{row.pickup_location || '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{row.destination || '-'}</td>
                                            <td className="px-6 py-3">
                                                <span className="text-sm font-medium text-gray-900 block">{row.item_description || '-'}</span>
                                                <span className="text-xs text-gray-500">{GOODS_CATEGORIES[row.goods_category] || row.goods_category || ''}{row.quantity ? ` x ${row.quantity}` : ''}</span>
                                            </td>
                                            <td className="px-6 py-3 text-sm font-semibold text-gray-900">TZS {Number(row.offered_price || 0).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{row.business?.name || row.business_name || '-'}</td>
                                            <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>{cfg.label}</span></td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-1">
                                                    <button onClick={() => setDetailDelivery(row) || setDetailModalOpen(true)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="View details">
                                                        <Truck size={14} />
                                                    </button>
                                                    {row.status === 'pending' && <button onClick={() => openStatusModal(row, 'accepted')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#00D4AA] hover:bg-[#00b894] transition-colors">Accept</button>}
                                                    {row.status === 'accepted' && <button onClick={() => openStatusModal(row, 'in_transit')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors">Start</button>}
                                                    {row.status === 'in_transit' && <button onClick={() => openStatusModal(row, 'delivered')} className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#00D4AA] hover:bg-[#00b894] transition-colors">Complete</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100"><Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} /></div>
                </div>
            )}

            <Modal isOpen={detailModalOpen} onClose={() => { setDetailModalOpen(false); setDetailDelivery(null); }} title="Delivery Details" size="md">
                {detailDelivery && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                            {[['Business', detailDelivery.business?.name || detailDelivery.business_name || '-'], ['Customer', detailDelivery.customer?.name || detailDelivery.customer_name || '-'], ['Product', detailDelivery.item_description || '-'], ['Category', GOODS_CATEGORIES[detailDelivery.goods_category] || detailDelivery.goods_category || '-'], ['Quantity', detailDelivery.quantity || '-'], ['From', detailDelivery.pickup_location || '-'], ['To', detailDelivery.destination || '-'], ['Price', `TZS ${Number(detailDelivery.offered_price || 0).toLocaleString()}`], ['Status', DELIVERY_STATUS_MAP[detailDelivery.status]?.label || detailDelivery.status]].map(([label, val]) => (
                                <div key={label} className="flex justify-between"><span className="text-sm text-gray-500">{label}</span><span className="text-sm font-medium text-gray-900">{val}</span></div>
                            ))}
                        </div>
                        <div className="flex justify-end"><button onClick={() => { setDetailModalOpen(false); setDetailDelivery(null); }} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Close</button></div>
                    </div>
                )}
            </Modal>

            <Modal isOpen={statusModalOpen} onClose={() => { setStatusModalOpen(false); setStatusDelivery(null); setStatusAction(''); }} title="Change Status" size="sm">
                {statusDelivery && (
                    <div>
                        <p className="text-sm text-gray-600 mb-6">This delivery will be changed to <strong>{DELIVERY_STATUS_MAP[statusAction]?.label || statusAction}</strong>. Continue?</p>
                        <div className="flex justify-end gap-3">
                            <button onClick={() => { setStatusModalOpen(false); setStatusDelivery(null); setStatusAction(''); }} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Cancel</button>
                            <button onClick={handleStatusChange} disabled={statusUpdating} className="px-5 py-2 text-sm font-medium text-white rounded-lg transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{statusUpdating ? 'Updating...' : 'Yes, Change'}</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
