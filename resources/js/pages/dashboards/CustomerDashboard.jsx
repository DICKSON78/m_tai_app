import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import ProductCard from '../../components/ProductCard';
import ShimmerProductGrid from '../../components/ShimmerProductGrid';

const TRUST_ITEMS = [
    { label: 'Get Fast', icon: 'M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0' },
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

function categoryIcon(name) {
    const n = (name || '').toLowerCase();
    if (n.includes('groc') || n.includes('food') || n.includes('produc')) return 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z';
    if (n.includes('fruit') || n.includes('veget') || n.includes('fresh')) return 'M12 22c5-3 8-7 8-12a8 8 0 10-16 0c0 5 3 9 8 12zm0 0V8';
    if (n.includes('drink') || n.includes('bever')) return 'M9 3h6m-1.5 0v4.5a4.5 4.5 0 01-9 0V3m9 8.5a4.5 4.5 0 01-9 .5M7 18h10m-4-1.5V21';
    if (n.includes('baker') || n.includes('bread')) return 'M12 3a4 4 0 00-4 4c0 1.5 1 2 1 3.5C9 12.5 10.5 14 12 14s3-1.5 3-3.5C15 9 16 8.5 16 7a4 4 0 00-4-4zm0 0c3 1 5 3 5 6H7c0-3 2-5 5-6zM5 15h14M7 21h10M8 15v3m8-3v3';
    if (n.includes('dairy') || n.includes('milk')) return 'M19 4h-2V2h-2v2H9V2H7v2H5a2 2 0 00-2 2v1a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM6 9l1 11a1 1 0 001 1h8a1 1 0 001-1l1-11M7 4v2M10 4v2m4-2v2M7 4v2';
    if (n.includes('cloth') || n.includes('fashion') || n.includes('apparel')) return 'M16 20V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v16m0 0a2 2 0 102 2 2 2 0 10-2-2zm8 0a2 2 0 102 2 2 2 0 10-2-2zM2 8V6a2 2 0 012-2h4m0 14H3a1 1 0 01-1-1V9a1 1 0 011-1h4m12 14V6a2 2 0 00-2-2h-4m0 14h4a1 1 0 001-1V9a1 1 0 00-1-1h-4';
    if (n.includes('elect') || n.includes('gadget')) return 'M12 4v16m-3-13h6M10 3h4m-6 5h8m-8 4h8';
    if (n.includes('home') || n.includes('house')) return 'M3 12l9-9 9 9M5 10v10a1 1 0 001 1h3m10-11v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6';
    if (n.includes('beaut') || n.includes('cosmetic')) return 'M7 21h10m-2-3h-6m1-15h4m-2-2v4m-5 4a3 3 0 016 0c0 2-1.5 2.5-1.5 4H9c0-1.5-1.5-2-1.5-4a3 3 0 016 0';
    if (n.includes('health') || n.includes('pharm')) return 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2m-7-2h8';
    if (n.includes('station') || n.includes('office') || n.includes('paper')) return 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10M9 15h6';
    return 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4';
}

function normalizePaginated(payload) {
    const body = payload && typeof payload === 'object' ? payload : {};
    const paginated = Array.isArray(body.data?.data) ? body.data : body;
    return {
        items: Array.isArray(paginated?.data) ? paginated.data : [],
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
        <div className="relative overflow-hidden rounded-2xl shadow-md" style={{ height: 200 }}>
            <div className="flex h-full transition-transform duration-500 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
                {slides.map((slide, i) => (
                    <div key={i} className="relative w-full h-full shrink-0">
                        {slide.url ? (
                            <img src={slide.url} alt={slide.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }} />
                        )}
                        <div className="absolute inset-0 bg-black/25" />
                        <div className="absolute bottom-5 left-5 right-5 text-white">
                            <p className="text-[10px] font-bold tracking-[2px] text-primary-light mb-1">M-TAI • FEATURED</p>
                            <p className="text-xl md:text-2xl font-black leading-tight">{slide.title}</p>
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
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(true);
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
                params: { category_id: categoryId ?? undefined, per_page: 40 },
            });
            if (id !== seqRef.current) return;
            const result = normalizePaginated(res.data);
            setProducts(result.items);
            setTotalCount(res.data?.total ?? result.items.length);
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
            setTotalCount(0);
        } finally {
            if (id === seqRef.current) setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProducts(selectedCategoryId);
    }, [selectedCategoryId, fetchProducts]);

    const bannerSlides = useMemo(() => {
        const withImages = [];
        for (const p of products) {
            const url = p.images?.[0]?.url;
            if (url) {
                withImages.push({ url, title: p.name.length > 34 ? p.name.slice(0, 34) + '…' : p.name, subtitle: p.business?.business_name || p.business?.name || 'Fresh goods, delivered fast' });
            }
            if (withImages.length >= 3) break;
        }
        return withImages.length >= 3 ? withImages : BANNER_FALLBACKS;
    }, [products]);

    const categoryAccent = (c) => CATEGORY_ACCENTS[Math.abs(c.id) % CATEGORY_ACCENTS.length];
    const chipList = [{ name: 'All', id: null }, ...categories];

    return (
        <div className="w-full space-y-5">
            {/* Greeting + categories — static (sticky, opaque, like the app) */}
            <div className="sticky top-0 z-20 bg-[#f5f7f5] pb-2 pt-1 border-b border-gray-200">
            {/* Greeting */}
            <div className="flex items-center gap-3 pl-4">
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                    {userName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-500">{greeting},</p>
                    <h1 className="text-xl font-black text-gray-900 truncate">{userName}</h1>
                    <p className="text-xs text-gray-500">Fresh goods, delivered fast</p>
                </div>
            </div>

            {/* Category chips — tile style (like the app) */}
            <div className="flex gap-2.5 overflow-x-auto pb-0.5 px-4 mt-3" style={{ scrollbarWidth: 'none' }}>
                {chipList.map((c) => {
                    const active = selectedCategoryId === c.id;
                    return (
                        <button
                            key={c.name}
                            onClick={() => setSelectedCategoryId(c.id)}
                            className="flex flex-col items-center gap-1.5 shrink-0 w-[68px]"
                        >
                            <span
                                className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${active ? 'text-white' : 'text-primary-dark'}`}
                                style={active ? { background: 'linear-gradient(135deg, #00D4AA, #00b894)' } : { background: '#d0f9f1' }}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={categoryIcon(c.name)} />
                                </svg>
                            </span>
                            <span className={`text-[11px] text-center truncate w-full ${active ? 'font-semibold text-primary-dark' : 'text-gray-500'}`}>{c.name}</span>
                        </button>
                    );
                })}
            </div>
            </div>

            {/* Banner */}
            <BannerCarousel slides={bannerSlides} />

            {/* Trust row */}
            <div className="grid grid-cols-4 gap-2">
                {TRUST_ITEMS.map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-1.5">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#d0f9f1' }}>
                            <svg className="w-5 h-5 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                            </svg>
                        </div>
                        <span className="text-[10px] font-medium text-gray-500 text-center leading-tight">{item.label}</span>
                    </div>
                ))}
            </div>

            {/* Section header */}
            <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: '#d0f9f1' }}>
                        <svg className="w-4 h-4 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                        </svg>
                    </span>
                    <h2 className="text-lg font-black text-gray-900">{selectedCategoryId ? 'Category' : 'For You'}</h2>
                </div>
                <span className="text-xs text-gray-500">{totalCount} item{totalCount === 1 ? '' : 's'}</span>
            </div>

            {/* Product grid (e-commerce layout, fills width) */}
            {loading ? (
                <ShimmerProductGrid count={10} columns="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3" />
            ) : products.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 py-12 text-center">
                    <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-bold text-gray-800 mb-1">No products found</h2>
                    <p className="text-sm text-gray-500">Try a different category or check back soon.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pb-4">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
