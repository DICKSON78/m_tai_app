import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import CustomerSidebar from './CustomerSidebar';
import CustomerRightRail from './CustomerRightRail';

export default function CustomerMarketplaceLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [cartCount, setCartCount] = useState(0);
    const [search, setSearch] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [filterOpen, setFilterOpen] = useState(false);
    const [filterMin, setFilterMin] = useState('');
    const [filterMax, setFilterMax] = useState('');
    const counterRef = useRef(0);

    const refreshCartCount = useCallback(async () => {
        try {
            const res = await api.get('/cart');
            setCartCount(res.data?.count || 0);
        } catch (e) {
            // ignore
        }
    }, []);

    useEffect(() => {
        refreshCartCount();
        const id = setInterval(refreshCartCount, 4000);
        const handler = () => refreshCartCount();
        window.addEventListener('mtai-cart-updated', handler);
        return () => {
            clearInterval(id);
            window.removeEventListener('mtai-cart-updated', handler);
        };
    }, [refreshCartCount]);

    const handleSearch = (e) => {
        e.preventDefault();
        const q = search.trim();
        setMobileOpen(false);
        if (q) navigate(`/customer/shops?q=${encodeURIComponent(q)}`);
        else navigate('/customer/shops');
    };

    const applyFilter = () => {
        const params = new URLSearchParams();
        const min = filterMin.trim();
        const max = filterMax.trim();
        if (min) params.set('min', min);
        if (max) params.set('max', max);
        navigate(`/customer/shops${params.toString() ? `?${params.toString()}` : ''}`);
    };

    return (
        <div className="h-screen flex flex-col bg-surface overflow-hidden">
            {/* ===== Top navbar (glassmorphism, teal like active buttons) ===== */}
            <header
                className="shrink-0 z-50 backdrop-blur-xl border-b border-white/20 shadow-sm"
                style={{ background: 'linear-gradient(135deg, rgba(0,212,170,0.97), rgba(0,184,148,0.97))' }}
            >
                <div className="mx-auto max-w-[1440px] px-2 sm:px-4">
                    <div className="flex items-center gap-3 h-16">
                        {/* Mobile hamburger */}
                        <button
                            className="lg:hidden text-white/80 hover:text-white p-1"
                            onClick={() => setMobileOpen(v => !v)}
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>

                        {/* Logo */}
                        <Link to="/customer/dashboard" className="flex items-center gap-2 shrink-0">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-white flex items-center justify-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                                <img src="/icons/icon-96x96.png?v=2" alt="M-TAI" className="w-8 h-8 rounded-full object-cover" />
                            </div>
                            <span className="hidden sm:block text-white font-black text-xl tracking-tight">M-TAI</span>
                        </Link>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative flex-1 min-w-0 max-w-3xl mx-2 lg:mx-6">
                            <div className="flex items-center bg-white rounded-xl overflow-hidden border border-primary focus-within:ring-2 focus-within:ring-primary/50 shadow-sm">
                                <div className="pl-4 text-gray-400 shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products, shops..."
                                    className="flex-1 px-3 py-2.5 text-sm text-gray-800 outline-none bg-transparent min-w-0"
                                />
                                <span className="w-px h-5 bg-gray-200 shrink-0" />
                                <button
                                    type="button"
                                    onClick={() => setFilterOpen(v => !v)}
                                    className={`px-2.5 py-2.5 shrink-0 transition-colors ${filterOpen ? 'text-primary-dark' : 'text-gray-400 hover:text-primary-dark'}`}
                                    aria-label="Filter"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zM4 6h4m4 0h8m-8 12a2 2 0 100 4 2 2 0 000-4zM4 18h4m10 0h2m-2-4a2 2 0 100 4 2 2 0 000-4z" />
                                    </svg>
                                </button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                                    Search
                                </button>
                            </div>

                            {/* Filter panel */}
                            {filterOpen && (
                                <div className="absolute left-0 right-0 top-full z-50 mt-2 bg-white rounded-xl shadow-lg border border-gray-100 p-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <p className="text-sm font-bold text-gray-900">Filter Products</p>
                                        <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-600" aria-label="Close">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-500 mb-1.5">Price Range (TZS)</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                            <span className="px-2.5 text-xs font-semibold text-gray-400 bg-gray-50 self-stretch flex items-center">Min</span>
                                            <input
                                                value={filterMin}
                                                onChange={(e) => setFilterMin(e.target.value)}
                                                type="number"
                                                min="0"
                                                placeholder="0"
                                                className="flex-1 min-w-0 px-2 py-2 text-sm outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                                            <span className="px-2.5 text-xs font-semibold text-gray-400 bg-gray-50 self-stretch flex items-center">Max</span>
                                            <input
                                                value={filterMax}
                                                onChange={(e) => setFilterMax(e.target.value)}
                                                type="number"
                                                min="0"
                                                placeholder="Any"
                                                className="flex-1 min-w-0 px-2 py-2 text-sm outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end gap-2 mt-3">
                                        <button
                                            onClick={() => { setFilterMin(''); setFilterMax(''); setFilterOpen(false); navigate('/customer/shops'); }}
                                            className="px-3 py-1.5 text-sm font-semibold text-gray-600 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
                                        >
                                            Clear
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => { setFilterOpen(false); applyFilter(); }}
                                            className="px-4 py-1.5 text-sm font-bold text-white rounded-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                </div>
                            )}
                        </form>

                        <div className="flex items-center gap-1 shrink-0">
                            {/* Cart */}
                            <Link
                                to="/customer/cart"
                                className="relative p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* User */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-1.5 px-3 py-1 rounded-full hover:bg-white/10 transition-colors">
                                        <span className="text-sm font-bold text-white hidden md:block max-w-[120px] truncate">{(user?.name || 'Customer')}</span>
                                        <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60">
                                    <DropdownMenuLabel>
                                        <p className="font-semibold">{user?.name || 'Customer'}</p>
                                        <p className="text-xs font-normal text-gray-500">{user?.email || ''}</p>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate('/customer/profile')} className="cursor-pointer">
                                        Settings
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/customer/wishlist')} className="cursor-pointer">
                                        My Wishlist
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
                                        Sign Out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>

                    {/* Mobile nav (collapsible sidebar) */}
                    {mobileOpen && (
                        <div className="lg:hidden pb-3">
                            <CustomerSidebar onNavigate={() => setMobileOpen(false)} />
                        </div>
                    )}
                </div>
            </header>

            {/* ===== Body: static sidebar + scrollable content + static right rail ===== */}
            <div className="flex-1 min-h-0 flex bg-[#f5f7f5]">
                {/* Sidebar — static (never scrolls) */}
                <aside className="customer-sidebar shrink-0 hidden lg:block overflow-y-auto py-4 ml-2.5 pr-3 border-r border-gray-200">
                    <CustomerSidebar />
                </aside>

                {/* Main content — the ONLY scrollable area */}
                <div className="flex-1 min-w-0 min-h-0 overflow-y-auto">
                    <div className="px-3 py-4">
                        {children}
                    </div>
                </div>

                {/* Right rail — static (never scrolls) */}
                <aside className="hidden lg:block w-64 shrink-0 overflow-y-auto py-4 pl-3 mr-2.5 border-l border-gray-200">
                    <CustomerRightRail />
                </aside>
            </div>
        </div>
    );
}
