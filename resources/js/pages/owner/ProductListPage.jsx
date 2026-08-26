import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Package, Plus, Search, Eye, Pencil, Trash2, EyeOff, Filter, RotateCcw } from 'lucide-react';

export default function ProductListPage() {
    document.title = 'Products - M-TAI';
    const navigate = useNavigate();
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState([]);

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [stock, setStock] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [deleteId, setDeleteId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [togglingId, setTogglingId] = useState(null);

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) {
                setSelectedBusiness(biz[0].id);
            }
        }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); });
    }, []);

    const fetchProducts = useCallback(async () => {
        if (!selectedBusiness) {
            setProducts([]);
            return;
        }
        setLoading(true);
        try {
            const params = {
                page: currentPage,
                per_page: 15,
            };
            if (search) params.search = search;
            if (category) params.category = category;
            if (status) params.status = status;
            if (stock) params.stock = stock;

            const res = await api.get(`/owner/businesses/${selectedBusiness}/products`, { params });
            setProducts(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch (error) { console.error('Failed to fetch products:', error);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    }, [selectedBusiness, currentPage, search, category, status, stock]);

    useEffect(() => {
        if (selectedBusiness) {
            api.get(`/owner/businesses/${selectedBusiness}/categories`).then(res => {
                setCategories(res.data?.data || res.data || []);
            }).catch((error) => { console.error('Failed to fetch categories:', error); setCategories([]); });
        }
    }, [selectedBusiness]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, category, status, stock, selectedBusiness]);

    const handleDelete = async () => {
        if (!deleteId) return;
        try {
            await api.delete(`/owner/products/${deleteId}`);
            fetchProducts();
        } catch (error) { console.error('Failed to delete product:', error); alert(error?.response?.data?.message || 'Failed to delete product. Please try again.'); } finally {
        }
    };

    const handleTogglePublish = async (product) => {
        if (togglingId) return;
        setTogglingId(product.id);
        try {
            await api.post(`/owner/products/${product.id}/toggle-publish`);
            fetchProducts();
        } catch (error) { console.error('Failed to toggle publish status:', error); alert(error?.response?.data?.message || 'Failed to update product. Please try again.'); } finally {
        }
    };

    const handleReset = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        setStock('');
    };

    return (
        <div className="space-y-0">
            {selectedBusiness && (
                <div className="flex items-center justify-end mb-6">
                    <Link
                        to={`/owner/businesses/${selectedBusiness}/products/create`}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Add New</span>
                    </Link>
                </div>
            )}

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4">
                    <Filter size={14} className="text-[#00D4AA] mr-2" /> Search Resources
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search products..."
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        />
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedBusiness}
                            onChange={(e) => setSelectedBusiness(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            <option value="">All Businesses</option>
                            {businesses.map((biz) => (
                                <option key={biz.id} value={biz.id}>{biz.name}</option>
                            ))}
                        </select>
                        <select
                            value={category}
                            onChange={(e) => setCategory(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            <option value="">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                        </select>
                        <select
                            value={stock}
                            onChange={(e) => setStock(e.target.value)}
                            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            <option value="">All Stock</option>
                            <option value="low">Low Stock</option>
                            <option value="in_stock">In Stock</option>
                        </select>
                        <button
                            onClick={handleReset}
                            className="px-4 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30"
                        >
                            <RotateCcw size={12} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {!selectedBusiness ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center">
                        <Package size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">Select a business to view products</p>
                    </div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
                </div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Products ({products.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Image</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Category</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Purchase Price</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Selling Price</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Stock</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center">
                                            <Package size={40} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-sm text-gray-500">No data available</p>
                                        </td>
                                    </tr>
                                ) : products.map((row) => {
                                    const qty = Number(row.quantity || 0);
                                    const isPublished = row.status === 'published';
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                                    {row.image ? (
                                                        <img
                                                            src={row.image_url || `/storage/${row.image}`}
                                                            alt={row.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <Package size={18} />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="font-medium text-gray-800">{row.name}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-gray-600">{row.category?.name || '-'}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-gray-700">TZS {Number(row.buying_price || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-gray-700">TZS {Number(row.selling_price || 0).toLocaleString()}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    qty <= 5 ? 'bg-red-100 text-red-700' : qty <= 20 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                                                }`}>
                                                    {qty}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    isPublished ? 'bg-[#00D4AA]/10 text-[#00B894]' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {isPublished ? 'Published' : 'Draft'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => navigate(`/owner/products/${row.id}`)}
                                                        className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-all"
                                                        title="View"
                                                    >
                                                        <Eye size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/owner/products/${row.id}/edit`)}
                                                        className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleTogglePublish(row)}
                                                        disabled={togglingId === row.id}
                                                        className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all disabled:opacity-50 ${
                                                            isPublished ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-[#00D4AA]/10 text-[#00D4AA] hover:bg-[#00D4AA]/20'
                                                        }`}
                                                        title={isPublished ? 'Unpublish' : 'Publish'}
                                                    >
                                                        {isPublished ? <EyeOff size={14} /> : <Eye size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => { setDeleteId(row.id); setDeleteModalOpen(true); }}
                                                        className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={deleteModalOpen}
                onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }}
                onConfirm={handleDelete}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
