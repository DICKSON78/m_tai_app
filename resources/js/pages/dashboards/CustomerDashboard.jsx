import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';

const TRUST_ITEMS = [
    { label: 'Fast Delivery', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
    { label: 'Secure Payment', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
    { label: '24/7 Support', icon: 'M18 9.5v9m2-9a2 2 0 00-2-2m-8 1V5a2 2 0 00-2-2H8m5 7v3m0 0a2 2 0 11-4 0 2 2 0 014 0zm-1 6v1m2-5h-2m-2 0a2 2 0 11-4 0 2 2 0 014 0zm4.5 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z' },
    { label: 'Easy Returns', icon: 'M4 4v5h5M20 20v-5h-5m-9.07 3A8 8 0 1011.93 4M4 4l2.5.5m0 0L6.5 3M16 12a2 2 0 11-4 0 2 2 0 014 0z' },
];

const BANNER_FALLBACKS = [
    { url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1400&q=80', title: 'Fresh produce delivered daily', subtitle: 'Farm-fresh fruits & veggies at your door.' },
    { url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1400&q=80', title: 'Everyday kitchen essentials', subtitle: 'Everything for your home, delivered fast.' },
    { url: 'https://images.unsplash.com/photo-1606787366850-de6330128bfc?auto=format&fit=crop&w=1400&q=80', title: 'Hot deals just for you', subtitle: 'Save big on your favorite products today.' },
];

const CATEGORY_ACCENTS = ['#0FAE8C', '#2F80ED', '#F2994A', '#EB5757', '#9B51E0', '#27AE60'];

function normalizePaginated(payload) {
    const body = payload && typeof payload === 'object' ? payload : {};
    const paginated = Array.isArray(body.data?.data) ? body.data : body;
    return {
        items: Array.isArray(paginated?.data) ? paginated.data : [],
        currentPage: typeof paginated?.current_page === 'number' ? paginated.current_page : 1,
        lastPage: typeof paginated?.last_page === 'number' ? paginated.last_page : 1,
    };
}

function BannerCarousel({ slides }) {
    const [index, setIndex] = useState(0);
    useEffect(() => {
        if (slides.length < 2) return;
        const id = setInterval(() => setIndex(i => (i + 1) % slides.length), 4000);
        return () => clearInterval(id);
    }, [slides.length]);

    return (
        <div className="relative overflow-hidden rounded-2xl shadow-lg" style={{ height: 240 }}>
            <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
                {slides.map((slide, i) => (
                    <div key={i} className="relative w-full h-full shrink-0">
                        {slide.url ? (
                            <img src={slide.url} alt={slide.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }} />
                        )}
                        <div className="absolute inset-0 bg-black/25" />
                        <div className="absolute bottom-6 left-6 right-6 text-white">
                            <p className="text-[11px] font-bold tracking-[2px] text-primary-light mb-1">M-TAI • FEATURED</p>
                            <p className="text-2xl md:text-3xl font-black leading-tight">{slide.title}</p>
                            <p className="text-sm text-white/90 mt-1 max-w-md">{slide.subtitle}</p>
                        </div>
                    </div>
                ))}
            </div>
            {slides.length > 1 && (
                <div className="absolute right-4 bottom-3 flex gap-1.5">
                    {slides.map((_, i) => (
                        <span key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/50'}`} />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CustomerDashboard() {
    const { user } = useAuth();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCategoryId, setSelectedCategoryId] = useState(null);
    const [productsCount, setProductsCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const seqRef = useRef(0);

    const greeting = (() => {
        const h = new Date().getHours();
        if (h < 12) return 'Good morning';
        if (h < 17) return 'Good afternoon';
        return 'Good evening';
    })();
    const userName = user?.name?.trim() || 'Shopper';

    const fetchProducts = useCallback(async (categoryId) => {
        seqRef.current += 1;
        const id = seqRef.current;
        setLoading(true);
        try {
            const res = await api.get('/shop/products', {
                params: { category_id: categoryId ?? undefined, per_page: 24 },
            });
            if (id !== seqRef.current) return;
            const result = normalizePaginated(res.data);
            setProducts(result.items);
            setProductsCount(res.data?.total ?? result.items.length);
            const map = new Map();
            result.items.forEach(p => {
                if (p.category?.name && p.category.id && !map.has(p.category.id)) {
                    map.set(p.category.id, p.category.name);
                }
            });
            setCategories(Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name)));
        } catch (e) {
            console.error(e);
            setProducts([]);
            setProductsCount(0);
        } finally {
            if (id === seqRef.current) {
                setLoading(false);
                setRefreshing(false);
            }
        }
    }, []);

    useEffect(() => {
        fetchProducts(selectedCategoryId);
    }, [selectedCategoryId, fetchProducts]);

    // Refresh products when cart is updated (to reflect stock changes)
    useEffect(() => {
        const handler = () => fetchProducts(selectedCategoryId);
        window.addEventListener('mtai-cart-updated', handler);
        return () => window.removeEventListener('mtai-cart-updated', handler);
    }, [fetchProducts, selectedCategoryId]);

    const bannerSlides = useMemo(() => {
        const withImages = [];
        for (const p of products) {
            const url = p.images?.[0]?.url;
            if (url) {
                withImages.push({ url, title: p.name.length > 30 ? p.name.slice(0, 30) + '…' : p.name, subtitle: p.business?.business_name || p.business?.name || 'Fresh goods, delivered fast' });
            }
            if (withImages.length >= 3) break;
        }
        return withImages.length >= 3 ? withImages : BANNER_FALLBACKS;
    }, [products]);

    const categoryAccent = (i) => CATEGORY_ACCENTS[i % CATEGORY_ACCENTS.length];

    return (
        <div className="space-y-5">
            {/* Greeting */}
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{greeting},</p>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900">{userName} 👋</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Fresh goods, delivered fast</p>
                </div>
            </div>

            {/* Trust row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {TRUST_ITEMS.map((item) => (
                    <div key={item.label} className="flex items-center gap-2.5 bg-white rounded-xl border border-gray-200 p-3">
                        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: '#d0f9f1' }}>
                            <svg className="w-5 h-5 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                            </svg>
                        </div>
                        <span className="text-xs font-semibold text-gray-700">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Banner */}
            <BannerCarousel slides={bannerSlides} />

            {/* Category chips */}
            <div className="flex gap-2.5 overflow-x-auto pb-1">
                <button
                    onClick={() => setSelectedCategoryId(null)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-semibold transition-colors shrink-0 ${
                        selectedCategoryId === null ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:border-primary'
                    }`}
                    style={selectedCategoryId === null ? { background: 'linear-gradient(135deg, #00D4AA, #00b894)' } : undefined}
                >
                    All Products
                </button>
                {categories.map((c, i) => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedCategoryId(c.id)}
                        className={`flex items-center gap-2 pl-2 pr-4 py-1 rounded-full border text-sm font-semibold transition-colors shrink-0 ${
                            selectedCategoryId === c.id ? 'text-white border-transparent' : 'bg-white border-gray-200 text-gray-600 hover:border-primary'
                        }`}
                        style={selectedCategoryId === c.id ? { background: 'linear-gradient(135deg, #00D4AA, #00b894)' } : undefined}
                    >
                        <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs text-white font-bold" style={{ background: categoryAccent(i) }}>
                            {c.name.charAt(0).toUpperCase()}
                        </span>
                        {c.name}
                    </button>
                ))}
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between pt-2">
                <h2 className="text-xl font-black text-gray-900">{productsCount === 0 ? 'Explore' : 'For You'}</h2>
                <span className="text-sm text-gray-500">{productsCount} item{productsCount === 1 ? '' : 's'}</span>
            </div>

            {/* Product grid */}
            {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-200 animate-pulse h-72" />
                    ))}
                </div>
            ) : products.length === 0 ? (
                <div className="card empty-state">
                    <div className="empty-state-icon">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-gray-800 mb-1">No products found</h2>
                    <p className="text-gray-500">Try a different category or check back soon.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
