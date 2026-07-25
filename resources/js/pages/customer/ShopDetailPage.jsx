import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';

export default function ShopDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [shop, setShop] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);

    const [search, setSearch] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [quantities, setQuantities] = useState({});
    const [addingId, setAddingId] = useState(null);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        fetchShop();
    }, [id]);

    const fetchShop = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/shops/${id}`);
            setShop(res.data.data || res.data);
        } catch {
            setShop(null);
        } finally {
            setLoading(false);
        }
    };

    const fetchProducts = useCallback(async (page = 1) => {
        setProductsLoading(true);
        try {
            const params = { page, per_page: 12 };
            if (search) params.search = search;
            if (selectedCategory) params.category = selectedCategory;

            const res = await api.get(`/shops/${id}/products`, { params });
            const data = res.data;
            setProducts(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);

            if (!categories.length) {
                setCategories(data.categories || []);
            }
        } catch {
            setProducts([]);
        } finally {
            setProductsLoading(false);
        }
    }, [id, search, selectedCategory, categories.length]);

    useEffect(() => {
        fetchProducts(1);
    }, [fetchProducts]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search, selectedCategory]);

    const getQuantity = (productId) => quantities[productId] || 1;

    const handleQuantityChange = (productId, value) => {
        const num = parseInt(value, 10);
        if (isNaN(num) || num < 1) return;
        setQuantities((prev) => ({ ...prev, [productId]: num }));
    };

    const incrementQty = (productId) => {
        setQuantities((prev) => ({
            ...prev,
            [productId]: (prev[productId] || 1) + 1,
        }));
    };

    const decrementQty = (productId) => {
        setQuantities((prev) => ({
            ...prev,
            [productId]: Math.max(1, (prev[productId] || 1) - 1),
        }));
    };

    const handleAddToCart = async (product) => {
        const qty = getQuantity(product.id);
        setAddingId(product.id);
        try {
            await api.post('/cart', {
                product_id: product.id,
                quantity: qty,
            });
            setToast(`"${product.name}" added to cart`);
            setTimeout(() => setToast(null), 3000);
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to add to cart.';
            setToast(msg);
            setTimeout(() => setToast(null), 4000);
        } finally {
            setAddingId(null);
        }
    };

    const handlePageChange = (page) => {
        fetchProducts(page);
        window.scrollTo({ top: 400, behavior: 'smooth' });
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    if (!shop) {
        return (
            <Layout>
                <div className="px-4 sm:px-6 lg:px-8 py-16 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Shop not found</h2>
                    <p className="text-gray-500 mb-6">The shop you are looking for could not be found.</p>
                    <Link
                        to="/customer/shops"
                        className="btn-primary inline-flex"
                    >
                        Back to Shop
                    </Link>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            {toast && (
                <div className="fixed top-20 right-4 z-50 bg-primary text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}

            <div style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }} className="rounded-2xl p-8 overflow-hidden mx-4 mt-4">
                <div className="py-2">
                    <div className="flex items-center space-x-2 text-sm text-white/70 mb-4">
                        <Link to="/customer/shops" className="hover:text-white transition">Shop</Link>
                        <span>/</span>
                        <span className="text-white font-medium">{shop.business_name}</span>
                    </div>

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                {shop.logo ? (
                                    <img
                                        src={shop.logo_url || `/storage/${shop.logo}`}
                                        alt={shop.business_name}
                                        className="w-16 h-16 rounded-xl object-cover"
                                    />
                                ) : (
                                    <span className="text-white font-bold text-2xl">
                                        {shop.business_name?.charAt(0)?.toUpperCase()}
                                    </span>
                                )}
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold text-white">{shop.business_name}</h1>
                                <p className="text-white/70">{shop.code}</p>
                                <div className="flex items-center space-x-2 mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                                        {shop.business_category || shop.business_type || 'Business'}
                                    </span>
                                    {shop.region && (
                                        <span className="text-white/70 text-sm">
                                            {shop.district ? `${shop.district}, ` : ''}{shop.region}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-64 shrink-0">
                        <div className="card">
                            <h3 className="font-semibold text-gray-800 mb-3 text-sm">Categories</h3>
                            <div className="space-y-1">
                                <button
                                    onClick={() => setSelectedCategory('')}
                                    className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                                        !selectedCategory
                                            ? 'bg-primary/10 text-primary'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    All Products
                                </button>
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id || cat.slug}
                                        onClick={() => setSelectedCategory(cat.slug || cat.id)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition ${
                                            selectedCategory === (cat.slug || cat.id)
                                                ? 'bg-primary/10 text-primary'
                                                : 'text-gray-600 hover:bg-gray-100'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="mb-6">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products in shop..."
                                    className="form-input pl-10"
                                />
                                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {productsLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="card empty-state">
                                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                </svg>
                                <p className="text-gray-500 text-lg font-medium">No products found</p>
                                <p className="text-gray-400 text-sm mt-1">Try searching with a different name or category</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {products.map((product) => {
                                        const qty = getQuantity(product.id);
                                        const isAdding = addingId === product.id;
                                        return (
                                            <div
                                                key={product.id}
                                                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all group"
                                            >
                                                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                                    {product.image ? (
                                                        <img
                                                            src={product.image_url || `/storage/${product.image}`}
                                                            alt={product.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <svg className="w-16 h-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                    {product.category && (
                                                        <span className="absolute top-3 left-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-primary shadow-sm">
                                                            {product.category.name || product.category}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="p-4">
                                                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-1">
                                                        {product.name}
                                                    </h3>
                                                    <p className="text-xl font-bold text-primary mb-3">
                                                        TZS {Number(product.selling_price || 0).toLocaleString()}
                                                    </p>

                                                    <div className="flex items-center space-x-2 mb-3">
                                                        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                                            <button
                                                                onClick={() => decrementQty(product.id)}
                                                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition text-sm font-bold"
                                                            >
                                                                −
                                                            </button>
                                                            <input
                                                                type="number"
                                                                min="1"
                                                                value={qty}
                                                                onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                                                className="w-10 text-center text-sm border-l border-r border-gray-300 py-1.5 outline-none focus:ring-1 focus:ring-primary"
                                                            />
                                                            <button
                                                                onClick={() => incrementQty(product.id)}
                                                                className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition text-sm font-bold"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                        <span className="text-xs text-gray-500">
                                                            {product.quantity > 0 ? `${product.quantity} available` : 'Out of Stock'}
                                                        </span>
                                                    </div>

                                                    <button
                                                        onClick={() => handleAddToCart(product)}
                                                        disabled={isAdding || product.quantity <= 0}
                                                        className="w-full btn-primary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                    >
                                                        {isAdding ? (
                                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                        ) : (
                                                            <>
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                                                </svg>
                                                                <span>Add to Cart</span>
                                                            </>
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    lastPage={lastPage}
                                    onPageChange={handlePageChange}
                                />
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
