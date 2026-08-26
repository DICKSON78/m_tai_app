import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import SummaryBox from '../../components/casfeta/SummaryBox';
import EmptyState from '../../components/casfeta/EmptyState';
import ActionBar from '../../components/casfeta/ActionBar';
import { Package, Plus, Pencil, Trash2, DollarSign, MapPin, Truck, CreditCard, Search, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

const STATUS_TABS = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'received', label: 'Received' },
    { key: 'shelved', label: 'Shelved' },
];

const STATUS_MAP = {
    pending: { label: 'Pending', badge: 'bg-yellow-100 text-yellow-700' },
    received: { label: 'Received', badge: 'bg-blue-100 text-blue-600' },
    shelved: { label: 'Shelved', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
};

const PAYMENT_METHODS = [
    { value: 'cash', label: 'Cash' },
    { value: 'account_transfer', label: 'Account Transfer' },
    { value: 'pay_in_advance', label: 'Pay in Advance' },
    { value: 'new_capital', label: 'New Capital' },
];

const PAYMENT_LABEL_MAP = Object.fromEntries(PAYMENT_METHODS.map(m => [m.value, m.label]));
const emptyForm = { item_name: '', quantity: '', buying_price: '', selling_price: '', distance_km: '', transport_cost: '', payment_method: 'cash' };

export default function ImportGoodsPage() {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [imports, setImports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [stats, setStats] = useState({ total: 0, pending: 0, received: 0, shelved: 0, total_cost: 0 });
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        api.get('/owner/businesses').then(res => { const biz = res.data?.data || res.data || []; setBusinesses(biz); if (biz.length === 1) setSelectedBusiness(biz[0].id); }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); });
    }, []);

    const fetchData = useCallback(async () => {
        if (!selectedBusiness) { setImports([]); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/imports`, { params });
            setImports(res.data?.data || []); setCurrentPage(res.data?.current_page || 1); setLastPage(res.data?.last_page || 1);
            if (res.data?.stats) setStats(res.data.stats);
        } catch (error) { console.error('Failed to fetch imports:', error); setImports([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage, search, statusFilter]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [selectedBusiness, search, statusFilter]);

    const handleAdd = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try { await api.post(`/owner/businesses/${selectedBusiness}/imports`, { ...form, quantity: Number(form.quantity), buying_price: Number(form.buying_price), selling_price: Number(form.selling_price), distance_km: form.distance_km ? Number(form.distance_km) : null, transport_cost: form.transport_cost ? Number(form.transport_cost) : 0 }); setAddModalOpen(false); setForm(emptyForm); fetchData(); } catch (error) { console.error('Failed to add import:', error); alert(error?.response?.data?.message || 'Failed to add import. Please try again.'); } finally { setSubmitting(false); }
    };

    const handleEdit = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try { await api.put(`/owner/businesses/${selectedBusiness}/imports/${editingItem.id}`, { ...form, quantity: Number(form.quantity), buying_price: Number(form.buying_price), selling_price: Number(form.selling_price), distance_km: form.distance_km ? Number(form.distance_km) : null, transport_cost: form.transport_cost ? Number(form.transport_cost) : 0 }); setEditModalOpen(false); setEditingItem(null); fetchData(); } catch (error) { console.error('Failed to edit import:', error); alert(error?.response?.data?.message || 'Failed to edit import. Please try again.'); } finally { setSubmitting(false); }
    };

    const handleStatusChange = async (item, newStatus) => { try { await api.put(`/owner/businesses/${selectedBusiness}/imports/${item.id}/status`, { status: newStatus }); fetchData(); } catch (error) { console.error('Failed to update import status:', error); alert(error?.response?.data?.message || 'Failed to update status. Please try again.'); } };
    const handleDelete = async () => { if (!deleteId) return; try { await api.delete(`/owner/businesses/${selectedBusiness}/imports/${deleteId}`); fetchData(); } catch (error) { console.error('Failed to delete import:', error); alert(error?.response?.data?.message || 'Failed to delete import. Please try again.'); } finally { setDeleteId(null); setDeleteModalOpen(false); } };
    const openEdit = (item) => { setEditingItem(item); setForm({ item_name: item.item_name || '', quantity: item.quantity || '', buying_price: item.buying_price || '', selling_price: item.selling_price || '', distance_km: item.distance_km || '', transport_cost: item.transport_cost || '', payment_method: item.payment_method || 'cash' }); setEditModalOpen(true); };
    const formatCurrency = (val) => `TZS ${Number(val || 0).toLocaleString()}`;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Import Goods"
                subtitle="Track goods imported from suppliers."
                icon={<Package size={20} />}
                actions={selectedBusiness && (
                    <button onClick={() => { setForm(emptyForm); setAddModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md">
                        <Plus size={16} /> Add Item
                    </button>
                )}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Business</label>
                <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                    <option value="">-- Select Business --</option>
                    {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name || biz.business_name}</option>))}
                </select>
            </div>

            {selectedBusiness && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <SummaryBox icon={<Package size={18} />} label="Total" value={stats.total} color="text-[#00D4AA]" />
                    <SummaryBox icon={<Clock size={18} />} label="Pending" value={stats.pending} color="text-yellow-600" />
                    <SummaryBox icon={<CheckCircle size={18} />} label="Received" value={stats.received} color="text-blue-600" />
                    <SummaryBox icon={<DollarSign size={18} />} label="Total Cost" value={formatCurrency(stats.total_cost)} color="text-red-600" />
                </div>
            )}

            {selectedBusiness && (
                <>
                    <div className="flex gap-2 flex-wrap">
                        {STATUS_TABS.map((tab) => (
                            <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${statusFilter === tab.key ? 'bg-[#00D4AA] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{tab.label}</button>
                        ))}
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search goods..." className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                        </div>
                    </div>
                </>
            )}

            {!selectedBusiness ? (
                <EmptyState title="Select a business" description="Choose a business from the dropdown above to view imported goods." />
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : imports.length === 0 ? (
                <EmptyState title="No imported goods found" description="No items match your current filters." />
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Item</th>
                                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Qty</th>
                                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Buying</th>
                                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Selling</th>
                                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Transport</th>
                                    <th className="text-center px-6 py-3 font-semibold text-gray-600">Payment</th>
                                    <th className="text-center px-6 py-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {imports.map((row) => {
                                    const cfg = STATUS_MAP[row.status] || STATUS_MAP.pending;
                                    return (
                                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 font-medium text-gray-800">{row.item_name}</td>
                                            <td className="px-6 py-4 text-right text-gray-600">{row.quantity}</td>
                                            <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(row.buying_price)}</td>
                                            <td className="px-6 py-4 text-right text-gray-700">{formatCurrency(row.selling_price)}</td>
                                            <td className="px-6 py-4 text-right text-gray-600">{formatCurrency(row.transport_cost)}</td>
                                            <td className="px-6 py-4 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">{PAYMENT_LABEL_MAP[row.payment_method] || row.payment_method}</span></td>
                                            <td className="px-6 py-4 text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>{cfg.label}</span></td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    {row.status === 'pending' && <button onClick={() => handleStatusChange(row, 'received')} className="inline-flex items-center gap-1 px-2 py-1 bg-[#00D4AA] text-white rounded-lg text-xs font-medium hover:bg-[#00B894] transition-all">Received</button>}
                                                    {row.status === 'received' && <button onClick={() => handleStatusChange(row, 'shelved')} className="inline-flex items-center gap-1 px-2 py-1 bg-[#00D4AA] text-white rounded-lg text-xs font-medium hover:bg-[#00B894] transition-all">Shelve</button>}
                                                    <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg text-gray-400 hover:text-[#00D4AA] hover:bg-[#00D4AA]/10 transition-colors" title="Edit"><Pencil size={15} /></button>
                                                    <button onClick={() => { setDeleteId(row.id); setDeleteModalOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 size={15} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                </div>
            )}

            <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Item" size="md">
                <form onSubmit={handleAdd} className="space-y-4">
                    <SectionHeader icon={<Package size={18} />} title="Item Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Item Name" required icon={<Package size={16} />} full>
                            <input type="text" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Quantity" required icon={<Package size={16} />}>
                            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Buying Price (TZS)" required icon={<DollarSign size={16} />}>
                            <input type="number" min="0" value={form.buying_price} onChange={(e) => setForm({ ...form, buying_price: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Selling Price (TZS)" required icon={<DollarSign size={16} />}>
                            <input type="number" min="0" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Distance (km)" icon={<MapPin size={16} />}>
                            <input type="number" min="0" step="0.1" value={form.distance_km} onChange={(e) => setForm({ ...form, distance_km: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Transport Cost (TZS)" icon={<Truck size={16} />}>
                            <input type="number" min="0" value={form.transport_cost} onChange={(e) => setForm({ ...form, transport_cost: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Payment Method" required icon={<CreditCard size={16} />}>
                            <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <ActionBar onCancel={() => setAddModalOpen(false)} onCancelLabel="Cancel" onSubmit={handleAdd} onSubmitLabel="Save" loading={submitting} accent />
                </form>
            </Modal>

            <Modal isOpen={editModalOpen} onClose={() => { setEditModalOpen(false); setEditingItem(null); }} title="Edit Item" size="md">
                <form onSubmit={handleEdit} className="space-y-4">
                    <SectionHeader icon={<Package size={18} />} title="Edit Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Item Name" required icon={<Package size={16} />} full>
                            <input type="text" value={form.item_name} onChange={(e) => setForm({ ...form, item_name: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Quantity" required icon={<Package size={16} />}>
                            <input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Buying Price (TZS)" required icon={<DollarSign size={16} />}>
                            <input type="number" min="0" value={form.buying_price} onChange={(e) => setForm({ ...form, buying_price: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Selling Price (TZS)" required icon={<DollarSign size={16} />}>
                            <input type="number" min="0" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Payment Method" required icon={<CreditCard size={16} />}>
                            <select value={form.payment_method} onChange={(e) => setForm({ ...form, payment_method: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </FormField>
                    </div>
                    <ActionBar onCancel={() => { setEditModalOpen(false); setEditingItem(null); }} onCancelLabel="Cancel" onSubmit={handleEdit} onSubmitLabel="Update" loading={submitting} accent />
                </form>
            </Modal>

            <ConfirmDialog isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }} onConfirm={handleDelete} title="Delete Item" message="Are you sure you want to delete this item?" confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
