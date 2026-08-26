import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { Truck, Plus, User, Package, MapPin, DollarSign, Search, Clock, CheckCircle, RotateCcw, Filter } from 'lucide-react';

const DELIVERY_TABS = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'accepted', label: 'Accepted' },
    { key: 'in_transit', label: 'In Transit' },
    { key: 'delivered', label: 'Delivered' },
    { key: 'cancelled', label: 'Cancelled' },
];

const DELIVERY_STATUS_MAP = {
    pending: { label: 'Pending', badge: 'bg-yellow-100 text-yellow-700' },
    accepted: { label: 'Accepted', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    in_transit: { label: 'In Transit', badge: 'bg-blue-100 text-blue-600' },
    delivered: { label: 'Delivered', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    cancelled: { label: 'Cancelled', badge: 'bg-red-100 text-red-600' },
};

const GOODS_CATEGORIES = [
    { value: 'mkate', label: 'Bread' },
    { value: 'chakula', label: 'Food' },
    { value: 'vinywaji', label: 'Drinks' },
    { value: 'dawa', label: 'Medicine' },
    { value: 'nguo', label: 'Clothing' },
    { value: 'vifaa_uyenzi', label: 'Construction Materials' },
    { value: 'nyingine', label: 'Other' },
];

export default function DeliveryListPage() {
    document.title = 'Deliveries - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(false);
    const [stats, setStats] = useState({ total: 0, pending: 0, in_transit: 0, delivered: 0 });
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [customers, setCustomers] = useState([]);
    const [statusDropdownId, setStatusDropdownId] = useState(null);

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm, setCreateForm] = useState({ customer_id: '', goods_category: '', item_description: '', quantity: '', pickup_location: '', destination: '', offered_price: '', is_negotiable: false });
    const [createErrors, setCreateErrors] = useState({});
    const [createSubmitting, setCreateSubmitting] = useState(false);

    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [assignDelivery, setAssignDelivery] = useState(null);
    const [transporterId, setTransporterId] = useState('');
    const [assignSubmitting, setAssignSubmitting] = useState(false);

    const [statusModalOpen, setStatusModalOpen] = useState(false);
    const [statusDelivery, setStatusDelivery] = useState(null);
    const [statusAction, setStatusAction] = useState('');
    const [statusUpdating, setStatusUpdating] = useState(false);

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); });
    }, []);

    const fetchDeliveries = useCallback(async () => {
        if (!selectedBusiness) { setDeliveries([]); setStats({ total: 0, pending: 0, in_transit: 0, delivered: 0 }); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/deliveries`, { params });
            const data = res.data?.data || [];
            setDeliveries(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.stats) setStats(res.data.stats);
            else {
                const total = res.data?.total || data.length;
                const pending = data.filter(d => d.status === 'pending').length;
                const in_transit = data.filter(d => d.status === 'in_transit').length;
                const delivered = data.filter(d => d.status === 'delivered').length;
                setStats({ total, pending, in_transit, delivered });
            }
        } catch (error) { console.error('Failed to fetch deliveries:', error); setDeliveries([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage, search, statusFilter]);

    useEffect(() => { fetchDeliveries(); }, [fetchDeliveries]);
    useEffect(() => { setCurrentPage(1); }, [selectedBusiness, search, statusFilter]);

    useEffect(() => {
        if (selectedBusiness && (createModalOpen || assignModalOpen)) {
            api.get(`/owner/businesses/${selectedBusiness}/customers`, { params: { per_page: 200 } }).then(res => setCustomers(res.data?.data || res.data || [])).catch((error) => { console.error('Failed to fetch customers:', error); setCustomers([]); });
        }
    }, [selectedBusiness, createModalOpen, assignModalOpen]);

    const handleCreateChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCreateForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (createErrors[name]) setCreateErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleCreateDelivery = async (e) => {
        e.preventDefault();
        setCreateSubmitting(true); setCreateErrors({});
        try {
            await api.post(`/owner/businesses/${selectedBusiness}/deliveries`, { customer_id: createForm.customer_id, goods_category: createForm.goods_category, item_description: createForm.item_description, quantity: Number(createForm.quantity) || 1, pickup_location: createForm.pickup_location, destination: createForm.destination, offered_price: Number(createForm.offered_price) || 0, is_negotiable: createForm.is_negotiable });
            setCreateModalOpen(false);
            setCreateForm({ customer_id: '', goods_category: '', item_description: '', quantity: '', pickup_location: '', destination: '', offered_price: '', is_negotiable: false });
            fetchDeliveries();
        } catch (err) { console.error('Failed to create delivery:', err); if (err.response?.status === 422) setCreateErrors(err.response.data?.errors || {}); } finally { setCreateSubmitting(false); }
    };

    const openAssignModal = (delivery) => { setAssignDelivery(delivery); setTransporterId(''); setAssignModalOpen(true); };

    const handleAssign = async (e) => {
        e.preventDefault();
        if (!assignDelivery || !transporterId.trim()) return;
        setAssignSubmitting(true);
        try { await api.post(`/owner/businesses/${selectedBusiness}/deliveries/${assignDelivery.id}/assign`, { transporter_id: transporterId.trim() }); setAssignModalOpen(false); setAssignDelivery(null); setTransporterId(''); fetchDeliveries(); } catch (error) { console.error('Failed to assign transporter:', error); alert(error?.response?.data?.message || 'Failed to assign transporter. Please try again.'); } finally { setAssignSubmitting(false); }
    };

    const openStatusModal = (delivery, newStatus) => { setStatusDelivery(delivery); setStatusAction(newStatus); setStatusModalOpen(true); };

    const handleStatusChange = async () => {
        if (!statusDelivery || !statusAction) return;
        setStatusUpdating(true);
        try { await api.put(`/owner/businesses/${selectedBusiness}/deliveries/${statusDelivery.id}`, { status: statusAction }); setStatusModalOpen(false); setStatusDelivery(null); setStatusAction(''); fetchDeliveries(); } catch (error) { console.error('Failed to update delivery status:', error); alert(error?.response?.data?.message || 'Failed to update delivery status. Please try again.'); } finally { setStatusUpdating(false); }
    };

    const handleReset = () => { setSearch(''); setStatusFilter(''); };
    const formatCurrency = (val) => `TZS ${Number(val || 0).toLocaleString()}`;

    return (
        <div className="space-y-0" onClick={() => { if (statusDropdownId) setStatusDropdownId(null); }}>
            {selectedBusiness && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
                        <div className="h-12 w-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0"><Truck size={22} className="text-[#00D4AA]" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</p><p className="text-2xl font-bold text-gray-900">{stats.pending}</p></div>
                        <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0"><Clock size={22} className="text-yellow-500" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">In Transit</p><p className="text-2xl font-bold text-gray-900">{stats.in_transit}</p></div>
                        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"><RotateCcw size={22} className="text-blue-500" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Delivered</p><p className="text-2xl font-bold text-gray-900">{stats.delivered}</p></div>
                        <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={22} className="text-green-500" /></div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end mb-6">
                {selectedBusiness && (
                    <button onClick={() => { setCreateForm({ customer_id: '', goods_category: '', item_description: '', quantity: '', pickup_location: '', destination: '', offered_price: '', is_negotiable: false }); setCreateErrors({}); setCreateModalOpen(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        <Plus size={16} /> <span className="hidden sm:inline">Add New</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4">
                    <Filter size={14} className="text-[#00D4AA] mr-2" /> Search Resources
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search deliveries..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                            <option value="">All Businesses</option>
                            {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name || biz.business_name}</option>))}
                        </select>
                        <div className="flex gap-2 flex-wrap">
                            {DELIVERY_TABS.map((tab) => (
                                <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${statusFilter === tab.key ? 'bg-[#00D4AA] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleReset} className="px-4 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30">
                            <RotateCcw size={12} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {!selectedBusiness ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center"><Truck size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">Select a business to view deliveries</p></div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : deliveries.length === 0 ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center"><Truck size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No data available</p></div>
                </div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Deliveries ({deliveries.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Goods</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">From</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">To</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Price</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Transporter</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-center">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {deliveries.map((row) => {
                                    const cfg = DELIVERY_STATUS_MAP[row.status] || DELIVERY_STATUS_MAP.pending;
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-800">{row.customer?.name || row.customer_name || '-'}</td>
                                            <td className="px-6 py-3">
                                                <div><span className="font-medium text-gray-800 block">{row.item_description || '-'}</span><span className="text-xs text-gray-500">{GOODS_CATEGORIES.find(c => c.value === row.goods_category)?.label || ''} {row.quantity ? `x ${row.quantity}` : ''}</span></div>
                                            </td>
                                            <td className="px-6 py-3 text-gray-600 text-sm">{row.pickup_location || '-'}</td>
                                            <td className="px-6 py-3 text-gray-600 text-sm">{row.destination || '-'}</td>
                                            <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCurrency(row.offered_price)}{row.is_negotiable && <span className="text-xs text-gray-400 ml-1">(Neg.)</span>}</td>
                                            <td className="px-6 py-3 text-gray-700 text-sm">{row.transporter?.name || row.transporter_name || <span className="text-gray-400 italic">Unassigned</span>}</td>
                                            <td className="px-6 py-3 text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>{cfg.label}</span></td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    {row.status === 'pending' && !row.transporter_id && (
                                                        <button onClick={() => openAssignModal(row)} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Assign"><User size={14} /></button>
                                                    )}
                                                    <div className="relative">
                                                        <button onClick={(e) => { e.stopPropagation(); setStatusDropdownId(statusDropdownId === row.id ? null : row.id); }} className="h-8 w-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-all" title="Change Status"><RotateCcw size={14} /></button>
                                                        {statusDropdownId === row.id && (
                                                            <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1">
                                                                {row.status !== 'pending' && row.status !== 'cancelled' && row.status !== 'delivered' && (
                                                                    <button onClick={(e) => { e.stopPropagation(); setStatusDropdownId(null); openStatusModal(row, 'cancelled'); }} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">Cancel</button>
                                                                )}
                                                                {(row.status === 'delivered' || row.status === 'cancelled') && <span className="block w-full text-left px-4 py-2 text-sm text-gray-400 cursor-default">No action</span>}
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
                        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}

            <Modal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Request New Delivery" size="lg">
                <form onSubmit={handleCreateDelivery} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Customer <span className="text-red-500">*</span></label><select name="customer_id" value={createForm.customer_id} onChange={handleCreateChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"><option value="">-- Select Customer --</option>{customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}</select>{createErrors.customer_id && <p className="mt-1 text-sm text-red-600">{createErrors.customer_id[0]}</p>}</div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Goods Category <span className="text-red-500">*</span></label><select name="goods_category" value={createForm.goods_category} onChange={handleCreateChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]"><option value="">-- Select Category --</option>{GOODS_CATEGORIES.map((c) => (<option key={c.value} value={c.value}>{c.label}</option>))}</select></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Item Description <span className="text-red-500">*</span></label><input type="text" name="item_description" value={createForm.item_description} onChange={handleCreateChange} required placeholder="Describe the item" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Quantity</label><input type="number" name="quantity" value={createForm.quantity} onChange={handleCreateChange} min="1" placeholder="1" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Pickup Location <span className="text-red-500">*</span></label><input type="text" name="pickup_location" value={createForm.pickup_location} onChange={handleCreateChange} required placeholder="Pickup location" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Destination <span className="text-red-500">*</span></label><input type="text" name="destination" value={createForm.destination} onChange={handleCreateChange} required placeholder="Destination" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Offered Price (TZS) <span className="text-red-500">*</span></label><input type="number" name="offered_price" value={createForm.offered_price} onChange={handleCreateChange} min="0" required placeholder="0" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div className="flex items-end pb-1"><label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" name="is_negotiable" checked={createForm.is_negotiable} onChange={handleCreateChange} className="w-4 h-4 text-[#00D4AA] border-gray-300 rounded focus:ring-[#00D4AA]" /><span className="text-sm text-gray-700">Price is negotiable</span></label></div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setCreateModalOpen(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={createSubmitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">{createSubmitting ? 'Submitting...' : 'Submit Request'}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={assignModalOpen} onClose={() => { setAssignModalOpen(false); setAssignDelivery(null); setTransporterId(''); }} title="Assign Transporter" size="sm">
                {assignDelivery && (
                    <form onSubmit={handleAssign} className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Customer</span><span className="text-sm font-medium text-gray-800">{assignDelivery.customer?.name || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Goods</span><span className="text-sm font-medium text-gray-800">{assignDelivery.item_description || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">From</span><span className="text-sm text-gray-800">{assignDelivery.pickup_location || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">To</span><span className="text-sm text-gray-800">{assignDelivery.destination || '-'}</span></div>
                        </div>
                        <div><label className="block text-sm font-semibold text-gray-900 mb-2">Transporter ID <span className="text-red-500">*</span></label><input type="text" value={transporterId} onChange={(e) => setTransporterId(e.target.value)} required placeholder="Enter transporter ID" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" /></div>
                        <div className="flex justify-end space-x-3 pt-2">
                            <button type="button" onClick={() => { setAssignModalOpen(false); setAssignDelivery(null); setTransporterId(''); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                            <button type="submit" disabled={assignSubmitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">{assignSubmitting ? 'Assigning...' : 'Assign'}</button>
                        </div>
                    </form>
                )}
            </Modal>

            <Modal isOpen={statusModalOpen} onClose={() => { setStatusModalOpen(false); setStatusDelivery(null); setStatusAction(''); }} title="Update Delivery Status" size="sm">
                {statusDelivery && (
                    <div>
                        <div className="bg-gray-50 rounded-xl p-4 mb-6 space-y-3">
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Customer</span><span className="text-sm font-medium text-gray-800">{statusDelivery.customer?.name || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Current Status</span><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${DELIVERY_STATUS_MAP[statusDelivery.status]?.badge || ''}`}>{DELIVERY_STATUS_MAP[statusDelivery.status]?.label || ''}</span></div>
                        </div>
                        {statusAction === 'cancelled' ? <p className="text-sm text-red-600 mb-6">Are you sure you want to cancel this delivery? This action cannot be undone.</p> : <p className="text-sm text-gray-600 mb-6">This delivery will be updated to <strong>{DELIVERY_STATUS_MAP[statusAction]?.label || statusAction}</strong>. Continue?</p>}
                        <div className="flex justify-end space-x-3">
                            <button onClick={() => { setStatusModalOpen(false); setStatusDelivery(null); setStatusAction(''); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                            <button onClick={handleStatusChange} disabled={statusUpdating} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">{statusUpdating ? 'Updating...' : statusAction === 'cancelled' ? 'Yes, Cancel' : 'Yes, Update'}</button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}
