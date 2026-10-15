import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import CustomerSidebar from './CustomerSidebar';
import CustomerRightRail from './CustomerRightRail';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

export default function CustomerMarketplaceLayout({ children }) {
    const { user, logout } = useAuth();
    const { t } = useTranslation();
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

    const avatarInitial = ((user?.name || 'C').trim().charAt(0) || 'C').toUpperCase();

    return (
        <div className="h-screen flex flex-col bg-surface overflow-hidden">
            {/* ===== Top navbar — same design as website (dark #0A140C), customer context ===== */}
            <header className="shrink-0 z-50 bg-[#0A140C] border-b border-white/5">
                <div className="mx-auto max-w-7xl px-6">
                    <div className="flex items-center justify-between h-[72px] gap-3">
                        {/* Mobile hamburger */}
                        <button
                            className="lg:hidden text-white p-2"
                            onClick={() => setMobileOpen(v => !v)}
                        >
                            <div className="w-6 h-5 flex flex-col justify-between">
                                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'rotate-45 translate-y-2' : ''}`} />
                                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileOpen ? 'opacity-0' : ''}`} />
                                <span className={`w-full h-0.5 bg-white transition-all duration-300 ${mobileOpen ? '-rotate-45 -translate-y-2' : ''}`} />
                            </div>
                        </button>

                        {/* Logo */}
                        <Link to="/customer/dashboard" className="flex items-center gap-3 group shrink-0">
                            <div className="relative">
                                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg shadow-black/20 overflow-hidden">
                                    <img src="/icons/icon-96x96.png?v=2" alt="M-TAI" className="w-8 h-8 rounded-full object-cover" />
                                </div>
                                <div className="absolute -inset-1 bg-[#00D4AA]/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight hidden sm:block">M-TAI</span>
                        </Link>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="relative hidden md:block flex-1 min-w-0 max-w-md mx-2">
                            <div className="flex items-center bg-white rounded-full overflow-hidden shadow-lg shadow-black/20">
                                <div className="pl-4 text-gray-400 shrink-0">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder={t("shop.search_products")+ " or shops..."}
                                    className="flex-1 px-3 py-2.5 text-sm text-gray-800 outline-none bg-transparent min-w-0"
                                />
                                <button
                                    type="button"
                                    onClick={() => setFilterOpen(v => !v)}
                                    className={`px-2.5 py-2.5 shrink-0 transition-colors ${filterOpen ? 'text-primary-dark' : 'text-gray-400 hover:text-primary-dark'}`}
                                    aria-label="Filter"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4 2 2 0 000-4zM4 6h4m4 0h8m-8 12a2 2 0 100 4 2 2 0 000-4zM4 18h4m10 0h2m-2-4a2 2 0 100 4 2 2 0 000-4z" />
                                    </svg>
                                </button>
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-[#0A140C] shrink-0 bg-gradient-to-r from-[#00D4AA] to-[#00B894]">
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

                        <div className="flex items-center gap-3 shrink-0">
                            {/* Cart */}
                            <Link
                                to="/customer/cart"
                                className="relative p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                </svg>
                                {cartCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#00D4AA] text-[10px] font-bold text-[#0A140C] flex items-center justify-center border-2 border-[#0A140C]">
                                        {cartCount > 99 ? '99+' : cartCount}
                                    </span>
                                )}
                            </Link>

                            {/* User avatar */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-[#0A140C] shrink-0 bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:shadow-lg hover:shadow-[#00D4AA]/25 transition-all" aria-label="Account">
                                        {avatarInitial}
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-60">
                                    <DropdownMenuLabel>
                                        <div className="flex items-center gap-3">
                                            <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-[#0A140C] shrink-0 bg-gradient-to-r from-[#00D4AA] to-[#00B894]">
                                                {avatarInitial}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{user?.name || 'Customer'}</p>
                                                <p className="text-xs font-normal text-gray-500 truncate">{user?.email || ''}</p>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => navigate('/customer/profile')} className="cursor-pointer">
                                        {t('profile.profile')}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/customer/profile')} className="cursor-pointer">
                                        {t('settings.settings')}
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
                                        {t('common.logout')}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <LanguageSwitcher className="text-white" />
                        </div>
                    </div>

                    {/* Mobile nav */}
                    {mobileOpen && (
                        <div className="lg:hidden bg-[#0A140C]/95 backdrop-blur-xl border-t border-white/5 px-6 py-6">
                            <form onSubmit={handleSearch} className="mb-4">
                                <div className="flex items-center bg-white rounded-full overflow-hidden">
                                    <input
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder={t("shop.search_products")}
                                        className="flex-1 px-4 py-2.5 text-sm text-gray-800 outline-none bg-transparent min-w-0"
                                    />
                                    <button type="submit" className="px-5 py-2.5 text-sm font-bold text-[#0A140C] bg-gradient-to-r from-[#00D4AA] to-[#00B894]">Search</button>
                                </div>
                            </form>
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
