import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import EmptyState from '../../components/casfeta/EmptyState';
import ActionBar from '../../components/casfeta/ActionBar';
import {
    Package, Search, AlertTriangle, Clock, Layers, ClipboardCheck, Plus, Filter,
    ArrowUpRight, RotateCcw, Boxes, Calendar, Hash, CheckCircle, XCircle, Tag,
} from 'lucide-react';

const TABS = [
    { key: 'stock', label: 'Stock', icon: Package },
    { key: 'alerts', label: 'Alerts', icon: AlertTriangle },
    { key: 'movements', label: 'Movements', icon: Clock },
    { key: 'batches', label: 'Batches', icon: Layers },
    { key: 'counts', label: 'Stock Counts', icon: ClipboardCheck },
];

const STOCK_LEVEL_OPTIONS = [
    { value: '', label: 'All Levels' },
    { value: 'out_of_stock', label: 'Out of Stock' },
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'healthy', label: 'Healthy' },
];

const STOCK_BADGE = {
    out_of_stock: { label: 'Out of Stock', cls: 'bg-red-100 text-red-700' },
    low: { label: 'Low', cls: 'bg-orange-100 text-orange-700' },
    medium: { label: 'Medium', cls: 'bg-yellow-100 text-yellow-700' },
    healthy: { label: 'Healthy', cls: 'bg-[#00D4AA]/10 text-[#00B894]' },
};

const MOVEMENT_TYPE_MAP = {
    in: { label: 'Stock In', cls: 'bg-[#00D4AA]/10 text-[#00B894]' },
    out: { label: 'Stock Out', cls: 'bg-red-100 text-red-700' },
    adjustment: { label: 'Adjustment', cls: 'bg-blue-100 text-blue-700' },
    sale: { label: 'Sale', cls: 'bg-indigo-100 text-indigo-700' },
    sale_return: { label: 'Sale Return', cls: 'bg-emerald-100 text-emerald-700' },
    purchase_receipt: { label: 'Purchase Receipt', cls: 'bg-cyan-100 text-cyan-700' },
    purchase_return: { label: 'Purchase Return', cls: 'bg-purple-100 text-purple-700' },
    damage: { label: 'Damage', cls: 'bg-rose-100 text-rose-700' },
    transfer: { label: 'Transfer', cls: 'bg-teal-100 text-teal-700' },
};

const COUNT_STATUS = {
    draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-700' },
    in_progress: { label: 'In Progress', cls: 'bg-blue-100 text-blue-700' },
    completed: { label: 'Completed', cls: 'bg-cyan-100 text-cyan-700' },
    approved: { label: 'Approved', cls: 'bg-[#00D4AA]/10 text-[#00B894]' },
    cancelled: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
};

const OUTBOUND_TYPES = ['out', 'sale', 'damage', 'purchase_return', 'transfer'];

export default function StockPage() {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [activeTab, setActiveTab] = useState('stock');

    // Stock list
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [stockLevel, setStockLevel] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState({});

    // Alerts
    const [alerts, setAlerts] = useState(null);
    const [alertsLoading, setAlertsLoading] = useState(false);

    // Movements
    const [movements, setMovements] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [movementType, setMovementType] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [historyPage, setHistoryPage] = useState(1);
    const [historyLastPage, setHistoryLastPage] = useState(1);

    // Batches
    const [batches, setBatches] = useState([]);
    const [batchesLoading, setBatchesLoading] = useState(false);
    const [batchPage, setBatchPage] = useState(1);
    const [batchLastPage, setBatchLastPage] = useState(1);

    // Stock counts
    const [counts, setCounts] = useState([]);
    const [countsLoading, setCountsLoading] = useState(false);
    const [countsPage, setCountsPage] = useState(1);
    const [countsLastPage, setCountsLastPage] = useState(1);

    // Modals
    const [movementModalOpen, setMovementModalOpen] = useState(false);
    const [movementForm, setMovementForm] = useState({ product_id: '', type: 'in', quantity: '', batch_id: '', batch_number: '', expiry_date: '', notes: '' });
    const [movementSubmitting, setMovementSubmitting] = useState(false);
    const [movementProducts, setMovementProducts] = useState([]);
    const [selectedProductBatches, setSelectedProductBatches] = useState([]);

    const [batchModalOpen, setBatchModalOpen] = useState(false);
    const [batchForm, setBatchForm] = useState({ product_id: '', batch_number: '', quantity: '', manufacturing_date: '', expiry_date: '', supplier_id: '', warehouse_location: '', notes: '' });
    const [batchSubmitting, setBatchSubmitting] = useState(false);
    const [suppliers, setSuppliers] = useState([]);

    const [countModalOpen, setCountModalOpen] = useState(false);
    const [countForm, setCountForm] = useState({ name: '', count_date: '', generate_items: true, notes: '' });
    const [countSubmitting, setCountSubmitting] = useState(false);

    const [countDetail, setCountDetail] = useState(null);
    const [countDetailLoading, setCountDetailLoading] = useState(false);
    const [countItemsForm, setCountItemsForm] = useState([]);
    const [countSaving, setCountSaving] = useState(false);
    const [countApproving, setCountApproving] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch(() => setBusinesses([]));
    }, []);

    useEffect(() => {
        if (!selectedBusiness) return;
        api.get(`/owner/businesses/${selectedBusiness}/categories`).then(res => setCategories(res.data?.data || res.data || [])).catch(() => setCategories([]));
    }, [selectedBusiness]);

    const fetchSummary = useCallback(async () => {
        if (!selectedBusiness) return;
        try {
            const res = await api.get(`/owner/businesses/${selectedBusiness}/inventory/summary`);
            setSummary(res.data || {});
        } catch { setSummary({}); }
    }, [selectedBusiness]);

    const fetchStock = useCallback(async () => {
        if (!selectedBusiness) { setProducts([]); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (stockLevel) params.stock_level = stockLevel;
            if (categoryId) params.category_id = categoryId;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/inventory/stock`, { params });
            setProducts(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch { setProducts([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage, search, stockLevel, categoryId]);

    const fetchAlerts = useCallback(async () => {
        if (!selectedBusiness) return;
        setAlertsLoading(true);
        try { const res = await api.get(`/owner/businesses/${selectedBusiness}/inventory/alerts`); setAlerts(res.data || null); }
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
            const res = await api.get(`/owner/businesses/${selectedBusiness}/inventory/movements`, { params });
            setMovements(res.data?.data || []);
            setHistoryPage(res.data?.current_page || 1);
            setHistoryLastPage(res.data?.last_page || 1);
        } catch { setMovements([]); } finally { setHistoryLoading(false); }
    }, [selectedBusiness, historyPage, movementType, dateFrom, dateTo]);

    const fetchBatches = useCallback(async () => {
        if (!selectedBusiness) { setBatches([]); return; }
        setBatchesLoading(true);
        try {
            const res = await api.get(`/owner/businesses/${selectedBusiness}/inventory/batches`, { params: { page: batchPage, per_page: 15 } });
            setBatches(res.data?.data || []);
            setBatchPage(res.data?.current_page || 1);
            setBatchLastPage(res.data?.last_page || 1);
        } catch { setBatches([]); } finally { setBatchesLoading(false); }
    }, [selectedBusiness, batchPage]);

    const fetchCounts = useCallback(async () => {
        if (!selectedBusiness) { setCounts([]); return; }
        setCountsLoading(true);
        try {
            const res = await api.get(`/owner/businesses/${selectedBusiness}/inventory/stock-counts`, { params: { page: countsPage, per_page: 10 } });
            setCounts(res.data?.data || []);
            setCountsPage(res.data?.current_page || 1);
            setCountsLastPage(res.data?.last_page || 1);
        } catch { setCounts([]); } finally { setCountsLoading(false); }
    }, [selectedBusiness, countsPage]);

    useEffect(() => {
        if (activeTab === 'stock') { fetchStock(); fetchSummary(); }
        else if (activeTab === 'alerts') fetchAlerts();
        else if (activeTab === 'movements') fetchMovements();
        else if (activeTab === 'batches') fetchBatches();
        else if (activeTab === 'counts') fetchCounts();
    }, [activeTab, fetchStock, fetchSummary, fetchAlerts, fetchMovements, fetchBatches, fetchCounts]);

    useEffect(() => { setCurrentPage(1); }, [search, stockLevel, categoryId, selectedBusiness]);
    useEffect(() => { setHistoryPage(1); }, [movementType, dateFrom, dateTo, selectedBusiness]);
    useEffect(() => { setBatchPage(1); }, [selectedBusiness]);
    useEffect(() => { setCountsPage(1); }, [selectedBusiness]);

    const flash = (msg, ok = true) => { setError(''); setSuccess(''); if (ok) setSuccess(msg); else setError(msg); setTimeout(() => { setSuccess(''); setError(''); }, 4000); };

    useEffect(() => {
        if (selectedBusiness && (movementModalOpen || batchModalOpen)) {
            api.get(`/owner/businesses/${selectedBusiness}/products`, { params: { per_page: 200 } })
                .then(res => setMovementProducts(res.data?.data || res.data || []))
                .catch(() => setMovementProducts([]));
        }
        if (selectedBusiness && batchModalOpen) {
            api.get(`/owner/businesses/${selectedBusiness}/suppliers`, { params: { per_page: 200 } })
                .then(res => setSuppliers(res.data?.data || res.data || []))
                .catch(() => setSuppliers([]));
        }
    }, [selectedBusiness, movementModalOpen, batchModalOpen]);

    useEffect(() => {
        if (selectedBusiness && movementForm.product_id) {
            api.get(`/owner/businesses/${selectedBusiness}/inventory/batches`, { params: { product_id: movementForm.product_id, per_page: 200 } })
                .then(res => setSelectedProductBatches((res.data?.data || []).filter(b => b.quantity > 0)))
                .catch(() => setSelectedProductBatches([]));
        } else {
            setSelectedProductBatches([]);
        }
    }, [selectedBusiness, movementForm.product_id]);

    const loadMovementProducts = useCallback(() => {
        if (selectedBusiness) {
            api.get(`/owner/businesses/${selectedBusiness}/products`, { params: { per_page: 200 } })
                .then(res => setMovementProducts(res.data?.data || res.data || []))
                .catch(() => setMovementProducts([]));
        }
    }, [selectedBusiness]);

    const handleRecordMovement = async (e) => {
        e.preventDefault();
        if (!selectedBusiness || !movementForm.product_id || !movementForm.quantity) return;
        setMovementSubmitting(true);
        try {
            await api.post(`/owner/businesses/${selectedBusiness}/inventory/movements`, {
                product_id: movementForm.product_id,
                type: movementForm.type,
                quantity: Number(movementForm.quantity),
                batch_id: movementForm.batch_id || undefined,
                batch_number: movementForm.batch_number || undefined,
                expiry_date: movementForm.expiry_date || undefined,
                notes: movementForm.notes || undefined,
            });
            setMovementModalOpen(false);
            setMovementForm({ product_id: '', type: 'in', quantity: '', batch_id: '', batch_number: '', expiry_date: '', notes: '' });
            flash('Movement recorded successfully.');
            if (activeTab === 'stock') { fetchStock(); fetchSummary(); } else if (activeTab === 'movements') fetchMovements(); else if (activeTab === 'batches') fetchBatches();
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to record movement.', false);
        } finally { setMovementSubmitting(false); }
    };

    const handleAdjust = (product) => {
        setMovementForm({ product_id: String(product.id), type: 'adjustment', quantity: product.quantity, batch_id: '', batch_number: '', expiry_date: '', notes: 'Stock count adjustment' });
        setMovementModalOpen(true);
    };

    const handleAddStock = (product) => {
        setMovementForm({ product_id: String(product.id), type: 'in', quantity: '', batch_id: '', batch_number: '', expiry_date: '', notes: '' });
        setMovementModalOpen(true);
    };

    const handleCreateBatch = async (e) => {
        e.preventDefault();
        if (!selectedBusiness || !batchForm.product_id || !batchForm.quantity) return;
        setBatchSubmitting(true);
        try {
            await api.post(`/owner/businesses/${selectedBusiness}/inventory/batches`, batchForm);
            setBatchModalOpen(false);
            setBatchForm({ product_id: '', batch_number: '', quantity: '', manufacturing_date: '', expiry_date: '', supplier_id: '', warehouse_location: '', notes: '' });
            flash('Batch received and stock updated.');
            if (activeTab === 'batches') fetchBatches(); else if (activeTab === 'stock') { fetchStock(); fetchSummary(); }
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to receive batch.', false);
        } finally { setBatchSubmitting(false); }
    };

    const handleCreateCount = async (e) => {
        e.preventDefault();
        if (!selectedBusiness || !countForm.name || !countForm.count_date) return;
        setCountSubmitting(true);
        try {
            const res = await api.post(`/owner/businesses/${selectedBusiness}/inventory/stock-counts`, countForm);
            setCountModalOpen(false);
            setCountForm({ name: '', count_date: '', generate_items: true, notes: '' });
            flash('Stock count created.');
            fetchCounts();
            openCountDetail(res.data);
        } catch (err) {
            flash(err.response?.data?.message || 'Failed to create stock count.', false);
        } finally { setCountSubmitting(false); }
    };

    const openCountDetail = async (count) => {
        setCountDetailLoading(true);
        try {
            const res = await api.get(`/owner/businesses/${selectedBusiness}/inventory/stock-counts/${count.id}`);
            const detail = res.data?.data || res.data;
            setCountDetail(detail);
            setCountItemsForm((detail.items || []).map(i => ({ id: i.id, product_id: i.product_id, product_name: i.product?.name, expected: i.expected_quantity, counted: i.counted_quantity === null ? '' : i.counted_quantity, variance: i.variance })));
        } catch { flash('Failed to load stock count.', false); } finally { setCountDetailLoading(false); }
    };

    const updateCountItem = (id, value) => {
        setCountItemsForm(prev => prev.map(it => {
            if (it.id !== id) return it;
            const counted = value === '' ? '' : Number(value);
            const variance = counted === '' ? null : counted - it.expected;
            return { ...it, counted, variance };
        }));
    };

    const saveCountItems = async () => {
        setCountSaving(true);
        try {
            const items = countItemsForm.map(it => ({ id: it.id, counted_quantity: it.counted === '' ? null : it.counted }));
            const res = await api.put(`/owner/businesses/${selectedBusiness}/inventory/stock-counts/${countDetail.id}/items`, { items });
            setCountDetail(res.data?.data || res.data);
            setCountItemsForm((res.data?.data || res.data).items.map(i => ({ id: i.id, product_id: i.product_id, product_name: i.product?.name, expected: i.expected_quantity, counted: i.counted_quantity === null ? '' : i.counted_quantity, variance: i.variance })));
            flash('Count quantities saved.');
        } catch (err) { flash(err.response?.data?.message || 'Failed to save counts.', false); } finally { setCountSaving(false); }
    };

    const approveCount = async () => {
        setCountApproving(true);
        try {
            await api.post(`/owner/businesses/${selectedBusiness}/inventory/stock-counts/${countDetail.id}/approve`);
            flash('Stock count approved and stock adjusted.');
            fetchCounts();
            setCountDetail(null);
        } catch (err) { flash(err.response?.data?.message || 'Failed to approve count.', false); } finally { setCountApproving(false); }
    };

    const fmtTZS = (n) => 'TZS ' + Number(n || 0).toLocaleString();
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Inventory Management"
                subtitle="Track stock levels, movements, batches and physical counts."
                icon={<Package size={20} />}
                actions={selectedBusiness && (
                    <div className="flex gap-2">
                        <button onClick={() => { setBatchModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-all">
                            <Boxes size={16} /> Receive Batch
                        </button>
                        <button onClick={() => { setMovementModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md">
                            <Plus size={16} /> Record Movement
                        </button>
                    </div>
                )}
            />

            {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{error}</div>}
            {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm px-4 py-3 rounded-lg">{success}</div>}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Business</label>
                <select value={selectedBusiness} onChange={(e) => { setSelectedBusiness(e.target.value); setActiveTab('stock'); }}
                    className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                    <option value="">-- Select Business --</option>
                    {businesses.map(biz => <option key={biz.id} value={biz.id}>{biz.business_name || biz.name}</option>)}
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="flex overflow-x-auto">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-all whitespace-nowrap ${activeTab === tab.key ? 'border-[#00D4AA] text-[#00B894] bg-[#00D4AA]/5' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
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
                    {activeTab === 'stock' && (
                        <>
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Products</p>
                                    <p className="text-2xl font-bold text-gray-900">{summary.total_products || 0}</p>
                                    <p className="text-xs text-gray-400 mt-1">{summary.total_units || 0} units on hand</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Stock Value (Cost)</p>
                                    <p className="text-2xl font-bold text-gray-900">{fmtTZS(summary.value_cost)}</p>
                                    <p className="text-xs text-gray-400 mt-1">Retail {fmtTZS(summary.value_retail)}</p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Out of Stock</p>
                                    <p className="text-2xl font-bold text-red-600">{summary.out_of_stock || 0}</p>
                                    <p className="text-xs text-gray-400 mt-1">Low: <span className="text-orange-600 font-semibold">{summary.low_stock || 0}</span> | Reorder: <span className="text-orange-600 font-semibold">{summary.reorder_items || 0}</span></p>
                                </div>
                                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                    <p className="text-sm font-medium text-gray-500 mb-1">Expiring Soon (90d)</p>
                                    <p className="text-2xl font-bold text-yellow-600">{summary.expiring_batches || 0}</p>
                                    <p className="text-xs text-gray-400 mt-1">Batches nearing expiry</p>
                                </div>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField label="Search Products" icon={<Search size={16} />}>
                                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name, SKU or barcode..." className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                    </FormField>
                                    <FormField label="Stock Level" icon={<Filter size={16} />}>
                                        <select value={stockLevel} onChange={(e) => setStockLevel(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                            {STOCK_LEVEL_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Category" icon={<Tag size={16} />}>
                                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                            <option value="">All Categories</option>
                                            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </FormField>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                            ) : products.length === 0 ? (
                                <EmptyState title="No products found" description="No products match your criteria." />
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Product</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">SKU</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">On Hand</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Threshold</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Cost Value</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>
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
                                                                    <div>
                                                                        <span className="font-medium text-gray-800">{row.name}</span>
                                                                        <span className="block text-xs text-gray-400">{row.category?.name || 'Uncategorized'}{row.location ? ` · ${row.location}` : ''}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-6 py-4 text-gray-500 font-mono text-xs">{row.sku || '-'}</td>
                                                            <td className="px-6 py-4 text-right font-semibold text-gray-800">{Number(row.quantity || 0).toLocaleString()} <span className="text-xs font-normal text-gray-400">{row.unit || 'pcs'}</span></td>
                                                            <td className="px-6 py-4 text-right text-gray-500">{row.low_stock_threshold || 0}</td>
                                                            <td className="px-6 py-4 text-right text-gray-700">{fmtTZS(row.stock_value_cost)}</td>
                                                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span></td>
                                                            <td className="px-6 py-4 text-right">
                                                                <div className="flex justify-end gap-2">
                                                                    <button onClick={() => handleAddStock(row)} title="Add stock" className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all">
                                                                        <ArrowUpRight size={12} /> Add
                                                                    </button>
                                                                    <button onClick={() => handleAdjust(row)} title="Adjust stock" className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all">
                                                                        <RotateCcw size={12} /> Adjust
                                                                    </button>
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
                        </>
                    )}

                    {activeTab === 'alerts' && (
                        alertsLoading ? (
                            <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-6">
                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                        <SectionHeader icon={<AlertTriangle size={18} />} title={`Out of Stock (${alerts?.out_of_stock?.length || 0})`} />
                                        {alerts?.out_of_stock?.length ? (
                                            <div className="divide-y divide-gray-100 mt-4">
                                                {alerts.out_of_stock.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between py-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{p.name}</p>
                                                            <p className="text-xs text-gray-400">SKU: {p.sku || '-'} · Needs reorder</p>
                                                        </div>
                                                        <button onClick={() => handleAddStock(p)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00D4AA] text-white rounded-lg text-xs font-medium hover:bg-[#00B894] transition-all">
                                                            <Plus size={12} /> Restock
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-gray-400 text-sm mt-4">No out of stock items.</p>}
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                        <SectionHeader icon={<AlertTriangle size={18} />} title={`Low Stock (${alerts?.low_stock?.length || 0})`} />
                                        {alerts?.low_stock?.length ? (
                                            <div className="divide-y divide-gray-100 mt-4">
                                                {alerts.low_stock.map(p => (
                                                    <div key={p.id} className="flex items-center justify-between py-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{p.name}</p>
                                                            <p className="text-xs text-gray-500">{p.quantity} {p.unit || 'pcs'} / threshold {p.low_stock_threshold} · Suggest reorder {p.suggested_reorder}</p>
                                                        </div>
                                                        <button onClick={() => handleAddStock(p)} className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#00D4AA] text-white rounded-lg text-xs font-medium hover:bg-[#00B894] transition-all">
                                                            <Plus size={12} /> Restock
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : <p className="text-gray-400 text-sm mt-4">All stock levels are healthy.</p>}
                                    </div>
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <SectionHeader icon={<Layers size={18} />} title={`Expiring Batches (${alerts?.expiring_batches?.length || 0})`} />
                                    {alerts?.expiring_batches?.length ? (
                                        <div className="divide-y divide-gray-100 mt-4">
                                            {alerts.expiring_batches.map(b => {
                                                const expired = new Date(b.expiry_date) < new Date();
                                                return (
                                                    <div key={b.id} className="flex items-center justify-between py-3">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{b.product?.name}</p>
                                                            <p className="text-xs text-gray-500">Batch {b.batch_number} · {b.quantity} {b.product?.unit || 'pcs'}</p>
                                                        </div>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${expired ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {expired ? 'Expired' : 'Expires ' + fmtDate(b.expiry_date)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : <p className="text-gray-400 text-sm mt-4">No expiring batches.</p>}
                                </div>
                            </div>
                        )
                    )}

                    {activeTab === 'movements' && (
                        <>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <FormField label="Movement Type" icon={<Filter size={16} />}>
                                        <select value={movementType} onChange={(e) => setMovementType(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                            <option value="">All Types</option>
                                            {Object.entries(MOVEMENT_TYPE_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                        </select>
                                    </FormField>
                                    <FormField label="Start Date" icon={<Calendar size={16} />}>
                                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                    </FormField>
                                    <FormField label="End Date" icon={<Calendar size={16} />}>
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
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Balance</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Batch</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Recorded By</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Notes</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {movements.map(row => {
                                                    const cfg = MOVEMENT_TYPE_MAP[row.type] || MOVEMENT_TYPE_MAP.in;
                                                    const inbound = ['in', 'sale_return', 'purchase_receipt'].includes(row.type);
                                                    return (
                                                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 text-gray-600">{fmtDate(row.created_at)}</td>
                                                            <td className="px-6 py-4 font-medium text-gray-800">{row.product?.name || '-'}</td>
                                                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.cls}`}>{cfg.label}</span></td>
                                                            <td className={`px-6 py-4 text-right font-semibold ${inbound ? 'text-[#00B894]' : 'text-red-600'}`}>{inbound ? '+' : '-'}{Number(row.quantity || 0).toLocaleString()}</td>
                                                            <td className="px-6 py-4 text-right text-gray-600">{row.balance_after ?? '-'}</td>
                                                            <td className="px-6 py-4 text-gray-500">{row.batch?.batch_number || '-'}</td>
                                                            <td className="px-6 py-4 text-gray-600">{row.moved_by?.first_name ? `${row.moved_by.first_name} ${row.moved_by.last_name || ''}` : (row.moved_by?.name || '-')}</td>
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

                    {activeTab === 'batches' && (
                        <>
                            <div className="flex justify-end">
                                <button onClick={() => setBatchModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md">
                                    <Boxes size={16} /> Receive New Batch
                                </button>
                            </div>
                            {batchesLoading ? (
                                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                            ) : batches.length === 0 ? (
                                <EmptyState title="No batches" description="Receive stock as batches to track expiry and lots." />
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Batch</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Product</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Qty Remaining</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Expiry</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Supplier</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Location</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {batches.map(b => {
                                                    const st = b.expiry_status;
                                                    const cls = st === 'expired' ? 'bg-red-100 text-red-700' : st === 'expiring_soon' ? 'bg-yellow-100 text-yellow-700' : 'bg-[#00D4AA]/10 text-[#00B894]';
                                                    const label = st === 'expired' ? 'Expired' : st === 'expiring_soon' ? `Expires ${fmtDate(b.expiry_date)}` : 'Valid';
                                                    return (
                                                        <tr key={b.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 font-mono text-xs font-semibold text-gray-800">{b.batch_number}</td>
                                                            <td className="px-6 py-4 font-medium text-gray-800">{b.product?.name}</td>
                                                            <td className="px-6 py-4 text-right font-semibold text-gray-800">{Number(b.quantity).toLocaleString()} <span className="text-xs font-normal text-gray-400">{b.product?.unit || 'pcs'}</span></td>
                                                            <td className="px-6 py-4 text-gray-600">{fmtDate(b.expiry_date)}</td>
                                                            <td className="px-6 py-4 text-gray-600">{b.supplier?.name || '-'}</td>
                                                            <td className="px-6 py-4 text-gray-500">{b.warehouse_location || '-'}</td>
                                                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span></td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={batchPage} lastPage={batchLastPage} onPageChange={setBatchPage} />
                                </div>
                            )}
                        </>
                    )}

                    {activeTab === 'counts' && (
                        <>
                            <div className="flex justify-end">
                                <button onClick={() => setCountModalOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md">
                                    <ClipboardCheck size={16} /> New Stock Count
                                </button>
                            </div>
                            {countsLoading ? (
                                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                            ) : counts.length === 0 ? (
                                <EmptyState title="No stock counts" description="Create a stock count to perform physical inventory." />
                            ) : (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Name</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Date</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Counted</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Variance</th>
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Status</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {counts.map(c => {
                                                    const st = COUNT_STATUS[c.status] || COUNT_STATUS.draft;
                                                    return (
                                                        <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                                            <td className="px-6 py-4 font-medium text-gray-800">{c.name}</td>
                                                            <td className="px-6 py-4 text-gray-600">{fmtDate(c.count_date)}</td>
                                                            <td className="px-6 py-4 text-right text-gray-600">{c.counted_items} / {c.total_items}</td>
                                                            <td className="px-6 py-4 text-right font-semibold text-gray-700">{fmtTZS(c.total_variance)}</td>
                                                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.cls}`}>{st.label}</span></td>
                                                            <td className="px-6 py-4 text-right">
                                                                <button onClick={() => openCountDetail(c)} className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50 transition-all">
                                                                    View / Count
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination currentPage={countsPage} lastPage={countsLastPage} onPageChange={setCountsPage} />
                                </div>
                            )}
                        </>
                    )}
                </>
            )}

            {/* Record Movement Modal */}
            <Modal isOpen={movementModalOpen} onClose={() => { setMovementModalOpen(false); setMovementForm({ product_id: '', type: 'in', quantity: '', batch_id: '', batch_number: '', expiry_date: '', notes: '' }); }} title="Record Stock Movement" size="lg">
                <form onSubmit={handleRecordMovement} className="space-y-4">
                    <SectionHeader icon={<Plus size={18} />} title="Movement Details" />
                    <FormField label="Product" required icon={<Package size={16} />}>
                        <select value={movementForm.product_id} onChange={(e) => setMovementForm({ ...movementForm, product_id: e.target.value, batch_id: '' })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                            <option value="">-- Select Product --</option>
                            {movementProducts.map(p => <option key={p.id} value={p.id}>{p.name} ({p.quantity || 0} in stock)</option>)}
                        </select>
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Movement Type" required icon={<Filter size={16} />}>
                            <select value={movementForm.type} onChange={(e) => setMovementForm({ ...movementForm, type: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                <option value="in">Stock In</option>
                                <option value="out">Stock Out</option>
                                <option value="sale">Sale</option>
                                <option value="sale_return">Sale Return</option>
                                <option value="purchase_receipt">Purchase Receipt</option>
                                <option value="purchase_return">Purchase Return</option>
                                <option value="damage">Damage</option>
                                <option value="transfer">Transfer</option>
                                <option value="adjustment">Adjustment (set absolute qty)</option>
                            </select>
                        </FormField>
                        <FormField label={movementForm.type === 'adjustment' ? 'New Absolute Quantity' : 'Quantity'} required icon={<ArrowUpRight size={16} />}>
                            <input type="number" min="0" value={movementForm.quantity} onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })} required placeholder={movementForm.type === 'adjustment' ? 'New on-hand qty' : 'Enter quantity'} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                    </div>
                    {OUTBOUND_TYPES.includes(movementForm.type) && (
                        <FormField label="Deduct From Batch (optional)" icon={<Layers size={16} />}>
                            <select value={movementForm.batch_id} onChange={(e) => setMovementForm({ ...movementForm, batch_id: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                <option value="">FIFO (oldest batch first)</option>
                                {selectedProductBatches.map(b => <option key={b.id} value={b.id}>{b.batch_number} ({b.quantity} left{!['no_expiry', 'ok'].includes(b.expiry_status) ? ` · ${b.expiry_status}` : ''})</option>)}
                            </select>
                        </FormField>
                    )}
                    {['in', 'purchase_receipt', 'sale_return'].includes(movementForm.type) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50 rounded-xl p-4">
                            <FormField label="New Batch Number (optional)" icon={<Hash size={16} />}>
                                <input type="text" value={movementForm.batch_number} onChange={(e) => setMovementForm({ ...movementForm, batch_number: e.target.value })} placeholder="e.g. BATCH-2026-01" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                            </FormField>
                            <FormField label="Expiry Date (optional)" icon={<Calendar size={16} />}>
                                <input type="date" value={movementForm.expiry_date} onChange={(e) => setMovementForm({ ...movementForm, expiry_date: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                            </FormField>
                        </div>
                    )}
                    <FormField label="Description" icon={<Clock size={16} />}>
                        <textarea value={movementForm.notes} onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })} rows={3} placeholder="Movement description..." className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] resize-none" />
                    </FormField>
                    <ActionBar onCancel={() => { setMovementModalOpen(false); setMovementForm({ product_id: '', type: 'in', quantity: '', batch_id: '', batch_number: '', expiry_date: '', notes: '' }); }} onCancelLabel="Cancel" onSubmit={handleRecordMovement} onSubmitLabel="Record Movement" loading={movementSubmitting} accent />
                </form>
            </Modal>

            {/* Receive Batch Modal */}
            <Modal isOpen={batchModalOpen} onClose={() => setBatchModalOpen(false)} title="Receive Stock Batch" size="lg">
                <form onSubmit={handleCreateBatch} className="space-y-4">
                    <SectionHeader icon={<Boxes size={18} />} title="Batch Details" subtitle="Adds stock to the product and tracks the batch." />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Product" required icon={<Package size={16} />}>
                            <select value={batchForm.product_id} onChange={(e) => setBatchForm({ ...batchForm, product_id: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                <option value="">-- Select Product --</option>
                                {movementProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Batch Number" required icon={<Hash size={16} />}>
                            <input type="text" value={batchForm.batch_number} onChange={(e) => setBatchForm({ ...batchForm, batch_number: e.target.value })} required placeholder="e.g. BATCH-2026-001" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Quantity" required icon={<ArrowUpRight size={16} />}>
                            <input type="number" min="0.01" step="0.01" value={batchForm.quantity} onChange={(e) => setBatchForm({ ...batchForm, quantity: e.target.value })} required placeholder="Received quantity" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Supplier" icon={<Package size={16} />}>
                            <select value={batchForm.supplier_id} onChange={(e) => setBatchForm({ ...batchForm, supplier_id: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                <option value="">-- Optional --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </FormField>
                        <FormField label="Manufacturing Date" icon={<Calendar size={16} />}>
                            <input type="date" value={batchForm.manufacturing_date} onChange={(e) => setBatchForm({ ...batchForm, manufacturing_date: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Expiry Date" icon={<Calendar size={16} />}>
                            <input type="date" value={batchForm.expiry_date} onChange={(e) => setBatchForm({ ...batchForm, expiry_date: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Location" icon={<Package size={16} />}>
                            <input type="text" value={batchForm.warehouse_location} onChange={(e) => setBatchForm({ ...batchForm, warehouse_location: e.target.value })} placeholder="e.g. Warehouse A" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Notes" icon={<Clock size={16} />}>
                            <input type="text" value={batchForm.notes} onChange={(e) => setBatchForm({ ...batchForm, notes: e.target.value })} placeholder="Optional notes" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                    </div>
                    <ActionBar onCancel={() => setBatchModalOpen(false)} onCancelLabel="Cancel" onSubmit={handleCreateBatch} onSubmitLabel="Receive Batch" loading={batchSubmitting} accent />
                </form>
            </Modal>

            {/* New Stock Count Modal */}
            <Modal isOpen={countModalOpen} onClose={() => setCountModalOpen(false)} title="New Stock Count" size="md">
                <form onSubmit={handleCreateCount} className="space-y-4">
                    <SectionHeader icon={<ClipboardCheck size={18} />} title="Count Details" />
                    <FormField label="Count Name" required icon={<Hash size={16} />}>
                        <input type="text" value={countForm.name} onChange={(e) => setCountForm({ ...countForm, name: e.target.value })} required placeholder="e.g. Monthly Count - August 2026" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                    </FormField>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Count Date" required icon={<Calendar size={16} />}>
                            <input type="date" value={countForm.count_date} onChange={(e) => setCountForm({ ...countForm, count_date: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Generate Items" icon={<Package size={16} />}>
                            <select value={countForm.generate_items} onChange={(e) => setCountForm({ ...countForm, generate_items: e.target.value === 'true' })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                <option value="true">Yes — from current stock</option>
                                <option value="false">No — empty list</option>
                            </select>
                        </FormField>
                    </div>
                    <FormField label="Notes" icon={<Clock size={16} />}>
                        <textarea value={countForm.notes} onChange={(e) => setCountForm({ ...countForm, notes: e.target.value })} rows={2} placeholder="Optional notes" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] resize-none" />
                    </FormField>
                    <ActionBar onCancel={() => setCountModalOpen(false)} onCancelLabel="Cancel" onSubmit={handleCreateCount} onSubmitLabel="Create Count" loading={countSubmitting} accent />
                </form>
            </Modal>

            {/* Stock Count Detail Modal */}
            <Modal isOpen={Boolean(countDetail)} onClose={() => setCountDetail(null)} title={countDetail ? countDetail.name : ''} description={countDetail ? `Count date: ${fmtDate(countDetail.count_date)} · Status: ${COUNT_STATUS[countDetail.status]?.label || countDetail.status}` : ''} size="xl">
                {countDetailLoading ? (
                    <div className="flex items-center justify-center h-48"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                ) : countDetail && (
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                                        <th className="text-left px-4 py-3 font-semibold text-gray-600">Product</th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Expected</th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Counted</th>
                                        <th className="text-right px-4 py-3 font-semibold text-gray-600">Variance</th>
                                    </tr></thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {countItemsForm.map(it => (
                                            <tr key={it.id}>
                                                <td className="px-4 py-3 font-medium text-gray-800">{it.product_name}</td>
                                                <td className="px-4 py-3 text-right text-gray-600">{it.expected}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={it.counted}
                                                        onChange={(e) => updateCountItem(it.id, e.target.value)}
                                                        disabled={['approved', 'cancelled'].includes(countDetail.status)}
                                                        className="w-28 text-right px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] disabled:bg-gray-50"
                                                    />
                                                </td>
                                                <td className={`px-4 py-3 text-right font-semibold ${it.variance === null ? 'text-gray-400' : it.variance > 0 ? 'text-[#00B894]' : it.variance < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                                                    {it.variance === null ? '-' : (it.variance > 0 ? '+' : '') + it.variance}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {!['approved', 'cancelled'].includes(countDetail.status) && (
                            <div className="flex justify-end gap-3">
                                <button onClick={saveCountItems} disabled={countSaving} className="inline-flex items-center gap-2 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all disabled:opacity-50">
                                    {countSaving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></span> : <CheckCircle size={16} />}
                                    Save Counted Quantities
                                </button>
                                <button onClick={approveCount} disabled={countApproving} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md disabled:opacity-50">
                                    {countApproving ? <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span> : <CheckCircle size={16} />}
                                    Approve & Apply Adjustments
                                </button>
                            </div>
                        )}
                        {['approved'].includes(countDetail.status) && (
                            <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-3 flex items-center gap-2">
                                <CheckCircle size={16} /> Approved — variances have been applied to stock.
                            </p>
                        )}
                        {['cancelled'].includes(countDetail.status) && (
                            <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center gap-2">
                                <XCircle size={16} /> This count was cancelled.
                            </p>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
