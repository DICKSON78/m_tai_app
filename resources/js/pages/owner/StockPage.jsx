import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import EmptyState from '../../components/casfeta/EmptyState';
import ActionBar from '../../components/casfeta/ActionBar';
import { Package, Search, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, RotateCcw, Plus, Filter } from 'lucide-react';

const TABS = [
    { key: 'all', label: 'All Stock', icon: Package },
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { key: 'history', label: 'Movement History', icon: Clock },
];

const STOCK_LEVEL_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'healthy', label: 'Good' },
];

const MOVEMENT_TYPES = [
    { value: '', label: 'All' },
    { value: 'in', label: 'Stock In' },
    { value: 'out', label: 'Stock Out' },
    { value: 'adjustment', label: 'Adjusted' },
];

const STOCK_BADGE = {
    out_of_stock: { label: 'Out of Stock', cls: 'bg-red-100 text-red-700' },
    low: { label: 'Low', cls: 'bg-red-100 text-red-700' },
    medium: { label: 'Medium', cls: 'bg-yellow-100 text-yellow-700' },
    healthy: { label: 'Good', cls: 'bg-[#00D4AA]/10 text-[#00B894]' },
};

const MOVEMENT_TYPE_MAP = {
    in: { label: 'Stock In', cls: 'bg-[#00D4AA]/10 text-[#00B894]' },
    out: { label: 'Stock Out', cls: 'bg-red-100 text-red-700' },
    adjustment: { label: 'Adjusted', cls: 'bg-blue-100 text-blue-700' },
};

export default function StockPage() {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [activeTab, setActiveTab] = useState('all');

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [stockLevel, setStockLevel] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState({ total_products: 0, total_stock: 0, total_value: 0 });

    const [alerts, setAlerts] = useState(null);
    const [alertsLoading, setAlertsLoading] = useState(false);

    const [movements, setMovements] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [movementType, setMovementType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyLastPage, setHistoryLastPage] = useState(1);

    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [movementForm, setMovementForm] = useState({ product_id: '', type: 'in', quantity: '', notes: '' });
    const [movementSubmitting, setMovementSubmitting] = useState(false);
    const [movementProducts, setMovementProducts] = useState([]);

    const [adjustModalOpen, setAdjustModalOpen] = useState(false);
    const [adjustProduct, setAdjustProduct] = useState(null);
    const [adjustQuantity, setAdjustQuantity] = useState('');
    const [adjustNotes, setAdjustNotes] = useState('');
    const [adjustSubmitting, setAdjustSubmitting] = useState(false);

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch(() => setBusinesses([]));
    }, []);

    const fetchStock = useCallback(async () => {
        if (!selectedBusiness) { setProducts([]); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (stockLevel) params.stock_level = stockLevel;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/stock`, { params });
            setProducts(res.data?.data || res.data?.products || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch { setProducts([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage, search, stockLevel]);

    const fetchAlerts = useCallback(async () => {
        if (!selectedBusiness) return;
        setAlertsLoading(true);
        try { const res = await api.get(`/owner/businesses/${selectedBusiness}/stock/alerts`); setAlerts(res.data?.data || res.data || null); }
        catch { setAlerts(null); } finally { setAlertsLoading(false); }
    }, [selectedBusiness]);

    const fetchMovements = useCallback(async () => {
        if (!selectedBusiness) { setMovements([]); return; }
        setHistoryLoading(true);
        try {
            const params = { page: historyPage, per_page: 15 };
            if (movementType) params.type = movementType;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/stock/history`, { params });
            setMovements(res.data?.data || res.data || []);
            setHistoryPage(res.data?.current_page || 1);
            setHistoryLastPage(res.data?.last_page || 1);
        } catch { setMovements([]); } finally { setHistoryLoading(false); }
    }, [selectedBusiness, historyPage, movementType, dateFrom, dateTo]);

    useEffect(() => {
        if (activeTab === 'all') fetchStock();
        else if (activeTab === 'alerts') fetchAlerts();
        else if (activeTab === 'history') fetchMovements();
    }, [activeTab, fetchStock, fetchAlerts, fetchMovements]);

    useEffect(() => { setCurrentPage(1); }, [search, stockLevel, selectedBusiness]);
    useEffect(() => { setHistoryPage(1); }, [movementType, dateFrom, dateTo, selectedBusiness]);

    useEffect(() => {
        if (selectedBusiness && movementModalOpen) {
            api.get(`/owner/businesses/${selectedBusiness}/products`, { params: { per_page: 200 } })
                .then(res => setMovementProducts(res.data?.data || res.data || []))
                .catch(() => setMovementProducts([]));
        }
    }, [selectedBusiness, movementModalOpen]);

    const handleRecordMovement = async (e) => {
        e.preventDefault();
        if (!selectedBusiness || !movementForm.product_id || !movementForm.quantity) return;
        setMovementSubmitting(true);
        try {
            await api.post(`/owner/businesses/${selectedBusiness}/stock`, {
                product_id: movementForm.product_id, type: movementForm.type, quantity: Number(movementForm.quantity), notes: movementForm.notes,
            });
            setMovementModalOpen(false);
            setMovementForm({ product_id: '', type: 'in', quantity: '', notes: '' });
            if (activeTab === 'all') fetchStock(); else if (activeTab === 'history') fetchMovements();
        } catch {} finally { setMovementSubmitting(false); }
    };

    const handleQuickRestock = (product) => { setAdjustProduct(product); setAdjustQuantity(''); setAdjustNotes(''); setAdjustModalOpen(true); };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        if (!adjustProduct || !adjustQuantity) return;
        setAdjustSubmitting(true);
        try {
            await api.post(`/owner/businesses/${selectedBusiness}/stock`, {
                product_id: adjustProduct.id, type: 'in', quantity: Number(adjustQuantity), notes: adjustNotes || 'Adjust stock',
            });
            setAdjustModalOpen(false); setAdjustProduct(null);
            if (activeTab === 'all') fetchStock(); else if (activeTab === 'alerts') fetchAlerts();
        } catch {} finally { setAdjustSubmitting(false); }
    };

    return (
        <div className="space-y-6">
            <PageHeader
                title="Inventory"
                subtitle="Monitor stock levels and manage inventory movements."
                icon={<Package size={20} />}
                actions={selectedBusiness && (
                    <button onClick={() => setMovementModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md">
                        <Plus size={16} /> Record Movement
                    </button>
                )}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Business</label>
                <select value={selectedBusiness} onChange={(e) => { setSelectedBusiness(e.target.value); setActiveTab('all'); }}
                    className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                    <option value="">-- Select Business --</option>
                    {businesses.map(biz => <option key={biz.id} value={biz.id}>{biz.name}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex border-b border-gray-200">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all ${activeTab === tab.key ? 'border-[#00D4AA] text-[#00B894] bg-[#00D4AA]/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
                                <Icon size={16} /> {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {!selectedBusiness ? (
                <EmptyState title="Select a business" description="Choose a business from the dropdown to view inventory." />
            ) : (
                <>
                    {activeTab === 'all' && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">Total Products</p>
                                            <p className="text-2xl font-bold text-gray-900">{summary.total_products}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                            <Package className="w-6 h-6 text-[#00D4AA]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">Stock on Hand</p>
                                            <p className="text-2xl font-bold text-gray-900">{summary.total_stock}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                            <Package className="w-6 h-6 text-[#00D4AA]" />
                                        </div>
                                    </div>
                                </div>
                                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-gray-500 mb-1">Stock Value</p>
                                            <p className="text-2xl font-bold text-gray-900">TZS {Number(summary.total_value || 0).toLocaleString()}</p>
                                        </div>
                                        <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                            <Package className="w-6 h-6 text-[#00D4AA]" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <FormField label="Search Products" icon={<Search size={16} />}>
                                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                    </FormField>
                                    <FormField label="Stock Level" icon={<Filter size={16} />}>
                                        <select value={stockLevel} onChange={(e) => setStockLevel(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                            {STOCK_LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </FormField>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                            ) : products.length === 0 ? (
                                <EmptyState title="No products found" description="No products match your search criteria." />
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Product</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Quantity</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Selling Price</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Value</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Action</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {products.map(row => {
                                                    const level = row.stock_level || 'healthy';
                                                    const cfg = STOCK_BADGE[level] || STOCK_BADGE.healthy;
                                                    return (
                                                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                                        {row.image ? <img src={row.image_url || `/storage/${row.image}`} alt={row.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={16} /></div>}
                                                                    </div>
                                                                    <span className="font-medium text-gray-800">{row.name}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-right font-semibold text-gray-800">{Number(row.quantity || 0).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right text-gray-700">TZS {Number(row.selling_price || 0).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right text-gray-700">TZS {(Number(row.quantity || 0) * Number(row.selling_price || 0)).toLocaleString()}</td>
                                                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span></td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button onClick={() => handleQuickRestock(row)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all">
                                                                    <RotateCcw size={12} /> Adjust
                                                                </button>
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
                        </>
                    )}

                    {activeTab === 'alerts' && (
                        alertsLoading ? (
                            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                        ) : (
                            <div className="space-y-6">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <SectionHeader icon={<AlertTriangle size={18} />} title="Stock Level Distribution" />
                                    {alerts?.distribution ? (
                                        <div className="space-y-4 mt-4">
                                            {[
                                                { key: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-500' },
                                                { key: 'low', label: 'Low', color: 'bg-red-400' },
                                                { key: 'medium', label: 'Medium', color: 'bg-yellow-400' },
                                                { key: 'healthy', label: 'Good', color: 'bg-[#00D4AA]' },
                                            ].map(({ key, label, color }) => {
                                                const count = alerts.distribution[key] || 0;
                                                const max = Math.max(...Object.values(alerts.distribution || {}), 1);
                                                const pct = (count / max) * 100;
                                                return (
                                                    <div key={key} className="flex items-center space-x-4">
                                                        <span className="text-sm text-gray-600 w-24 text-right">{label}</span>
                                                        <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                                                            <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }} />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-700 w-12">{count}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : <p className="text-gray-400 text-sm mt-4">No distribution data.</p>}
                                </div>

                                {alerts?.total_stock_value !== undefined && (
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">TOTAL STOCK VALUE</p>
                                        <p className="text-2xl font-extrabold text-gray-900 mt-1">TZS {Number(alerts.total_stock_value || 0).toLocaleString()}</p>
                                    </div>
                                )}

                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <SectionHeader icon={<AlertTriangle size={18} />} title="Low Stock Products" />
                                    {alerts?.low_stock_products && alerts.low_stock_products.length > 0 ? (
                                        <div className="divide-y divide-gray-100 mt-4">
                                            {alerts.low_stock_products.map(product => (
                                                <div key={product.id} className="flex items-center justify-between py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                                                            {product.image ? <img src={product.image_url || `/storage/${product.image}`} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-gray-400"><Package size={16} /></div>}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{product.name}</p>
                                                            <p className="text-xs text-gray-500">Level: {Number(product.quantity || 0)}</p>
                                                        </div>
                                                    </div>
                                                    <button onClick={() => handleQuickRestock(product)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all">
                                                        <RotateCcw size={12} /> Adjust
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : <p className="text-gray-400 text-sm mt-4">No low stock products.</p>}
                                </div>
                            </div>
                        )
                    )}

                    {activeTab === 'history' && (
                        <>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField label="Movement Type" icon={<Filter size={16} />}>
                                        <select value={movementType} onChange={(e) => setMovementType(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                            {MOVEMENT_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Start Date" icon={<Clock size={16} />}>
                                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                    </FormField>
                                    <FormField label="End Date" icon={<Clock size={16} />}>
                                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                    </FormField>
                                </div>
                            </div>

                            {historyLoading ? (
                                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                            ) : movements.length === 0 ? (
                                <EmptyState title="No movement history" description="No stock movements match your filters." />
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Date</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Product</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Type</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Quantity</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Recorded By</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Description</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {movements.map(row => {
                                                    const cfg = MOVEMENT_TYPE_MAP[row.type] || MOVEMENT_TYPE_MAP.in;
                                                    return (
                                                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-gray-600 text-sm">{row.created_at ? new Date(row.created_at).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                                            <td className="px-6 py-4 font-medium text-gray-800">{row.product?.name || row.product_name || '-'}</td>
                                                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span></td>
                                                            <td className={`px-6 py-4 text-right font-semibold ${row.type === 'out' ? 'text-red-600' : 'text-[#00B894]'}`}>{row.type === 'out' ? '-' : '+'}{Number(row.quantity || 0).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-gray-600">{row.user?.name || row.registered_by || '-'}</td>
                                                            <td className="px-6 py-4 text-gray-500 text-sm">{row.notes || '-'}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={historyPage} lastPage={historyLastPage} onPageChange={setHistoryPage} />
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            <Modal isOpen={movementModalOpen} onClose={() => { setMovementModalOpen(false); setMovementForm({ product_id: '', type: 'in', quantity: '', notes: '' }); }} title="Record Stock Movement" size="md">
                <form onSubmit={handleRecordMovement} className="space-y-4">
                    <SectionHeader icon={<Plus size={18} />} title="Movement Details" />
                    <FormField label="Product" required icon={<Package size={16} />}>
                        <select value={movementForm.product_id} onChange={(e) => setMovementForm({ ...movementForm, product_id: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                            <option value="">-- Select Product --</option>
                            {movementProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Movement Type" required icon={<Filter size={16} />}>
                            <select value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                <option value="in">Stock In</option>
                                <option value="out">Stock Out</option>
                                <option value="adjustment">Adjusted</option>
                            </select>
                        </FormField>
                        <FormField label="Quantity" required icon={<ArrowUpRight size={16} />}>
                            <input type="number" min="1" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} required placeholder="Enter quantity" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                    </div>
                    <FormField label="Description" icon={<Clock size={16} />}>
                        <textarea value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} rows={3} placeholder="Movement description..." className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] resize-none" />
                    </FormField>
                    <ActionBar onCancel={() => { setMovementModalOpen(false); setMovementForm({ product_id: '', type: 'in', quantity: '', notes: '' }); }} onCancelLabel="Cancel" onSubmit={handleRecordMovement} onSubmitLabel="Record Movement" loading={movementSubmitting} accent />
                </form>
            </Modal>

            <Modal isOpen={adjustModalOpen} onClose={() => { setAdjustModalOpen(false); setAdjustProduct(null); }} title="Adjust Stock" size="sm">
                {adjustProduct && (
                    <form onSubmit={handleAdjustSubmit} className="space-y-4">
                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-sm text-gray-500">Product</p>
                            <p className="font-medium text-gray-800">{adjustProduct.name}</p>
                            <p className="text-sm text-gray-500 mt-1">Current level: <span className="font-semibold">{Number(adjustProduct.quantity || 0)}</span></p>
                        </div>
                        <FormField label="New Quantity" required icon={<ArrowUpRight size={16} />}>
                            <input type="number" min="1" value={adjustQuantity} onChange={(e) => setAdjustQuantity(e.target.value)} required placeholder="Enter quantity" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Description" icon={<Clock size={16} />}>
                            <textarea value={adjustNotes} onChange={(e) => setAdjustNotes(e.target.value)} rows={2} placeholder="Description..." className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] resize-none" />
                        </FormField>
                        <ActionBar onCancel={() => { setAdjustModalOpen(false); setAdjustProduct(null); }} onCancelLabel="Cancel" onSubmit={handleAdjustSubmit} onSubmitLabel="Save" loading={adjustSubmitting} accent />
                    </form>
                )}
            </Modal>
        </div>
    );
}
