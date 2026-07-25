import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/casfeta/PageHeader';
import { Package, Search, SlidersHorizontal, X } from 'lucide-react';

const STOCK_BADGE = {
    out_of_stock: { label: 'Out of Stock', classes: 'bg-red-100 text-red-700' },
    low: { label: 'Low', classes: 'bg-red-100 text-red-700' },
    medium: { label: 'Medium', classes: 'bg-yellow-100 text-yellow-700' },
    healthy: { label: 'Good', classes: 'bg-green-100 text-green-700' },
};

export default function EmployeeInventoryPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchStock = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            const res = await api.get('/employee/inventory', { params });
            const data = res.data?.data || res.data?.products || [];
            setProducts(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            setTotal(res.data?.total || data.length);
        } catch {
            setProducts([]);
            setTotal(0);
        } finally {
            setLoading(false);
        }
    }, [currentPage, search]);

    useEffect(() => { fetchStock(); }, [fetchStock]);
    useEffect(() => { setCurrentPage(1); }, [search]);

    return (
        <div className="space-y-6">
            <PageHeader title="Inventory" subtitle="View current stock levels" icon={<Package size={20} />}
                actions={search ? (
                    <button onClick={() => setSearch('')} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                        <X size={14} /> Clear search
                    </button>
                ) : null}
            />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                    <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search products..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Products</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Quantity</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Selling Price</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Value</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                            </tr></thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">No products found.</td></tr>
                                ) : products.map((row) => {
                                    const level = row.stock_level || 'healthy';
                                    const cfg = STOCK_BADGE[level] || STOCK_BADGE.healthy;
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.name}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600 font-semibold">{Number(row.quantity || 0).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">TZS {Number(row.selling_price || 0).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">TZS {(Number(row.quantity || 0) * Number(row.selling_price || 0)).toLocaleString()}</td>
                                            <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.classes}`}>{cfg.label}</span></td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100"><Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} /></div>
                </div>
            )}
        </div>
    );
}
