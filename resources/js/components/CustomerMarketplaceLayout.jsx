import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

const NAV_LINKS = [
    { to: '/customer/shops', label: 'Shops', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
    { to: '/customer/orders', label: 'Orders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { to: '/customer/wishlist', label: 'Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
];

export default function CustomerMarketplaceLayout({ children }) {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [cartCount, setCartCount] = useState(0);
    const [search, setSearch] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
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

    const userInitials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <div className="min-h-screen flex flex-col bg-surface">
            {/* ===== Top navbar ===== */}
            <header className="sticky top-0 z-50" style={{ background: 'linear-gradient(135deg, #0a3d33 0%, #0d4a3e 50%, #06271f 100%)' }}>
                <div className="mx-auto max-w-7xl px-4">
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
                            <div className="w-9 h-9 rounded-lg overflow-hidden bg-white flex items-center justify-center" style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                                <img src="/icons/icon-96x96.png" alt="M-TAI" className="w-8 h-8 object-contain" />
                            </div>
                            <span className="hidden sm:block text-white font-black text-xl tracking-tight">M-TAI</span>
                        </Link>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1 max-w-2xl mx-2 lg:mx-4">
                            <div className="flex items-center bg-white rounded-full overflow-hidden border border-primary focus-within:ring-2 focus-within:ring-primary/50">
                                <div className="pl-4 text-gray-400">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search products..."
                                    className="flex-1 px-3 py-2.5 text-sm text-gray-800 outline-none bg-transparent"
                                />
                                <button type="submit" className="px-5 py-2.5 text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                                    Search
                                </button>
                            </div>
                        </form>

                        <div className="flex items-center gap-1.5 shrink-0">
                            {/* Desktop nav links */}
                            <nav className="hidden lg:flex items-center gap-1">
                                {NAV_LINKS.map((link) => (
                                    <Link
                                        key={link.to}
                                        to={link.to}
                                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                            isActive(link.to) ? 'bg-white/15 text-white' : 'text-white/70 hover:text-white hover:bg-white/10'
                                        }`}
                                    >
                                        {link.label}
                                    </Link>
                                ))}
                            </nav>

                            {/* Cart */}
                            <Link
                                to="/customer/cart"
                                className="relative p-2.5 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
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
                                    <button className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full hover:bg-white/10 transition-colors">
                                        <Avatar className="h-8 w-8 border-2 border-primary/40">
                                            <AvatarFallback className="text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                                                {userInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <svg className="w-4 h-4 text-white/60 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                        My Profile
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

                    {/* Mobile nav */}
                    {mobileOpen && (
                        <nav className="lg:hidden flex flex-col gap-1 pb-3">
                            {NAV_LINKS.map((link) => (
                                <Link
                                    key={link.to}
                                    to={link.to}
                                    onClick={() => setMobileOpen(false)}
                                    className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                        isActive(link.to) ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10'
                                    }`}
                                >
                                    {link.label}
                                </Link>
                            ))}
                            <Link to="/customer/profile" onClick={() => setMobileOpen(false)} className="px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10">
                                My Profile
                            </Link>
                        </nav>
                    )}
                </div>
            </header>

            {/* ===== Content ===== */}
            <main className="flex-1 w-full mx-auto max-w-7xl px-4 py-6 content-area">
                {children}
            </main>

            {/* ===== Footer ===== */}
            <footer className="mt-auto" style={{ background: '#06271f' }}>
                <div className="mx-auto max-w-7xl px-4 py-8">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 text-sm">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="w-8 h-8 rounded-lg overflow-hidden bg-white flex items-center justify-center">
                                    <img src="/icons/icon-96x96.png" alt="M-TAI" className="w-7 h-7 object-contain" />
                                </div>
                                <span className="text-white font-black text-lg">M-TAI</span>
                            </div>
                            <p className="text-white/50 leading-relaxed">Your trusted marketplace for fresh goods and everyday essentials, delivered fast.</p>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Shop</h4>
                            <ul className="space-y-2 text-white/60">
                                <li><Link to="/customer/shops" className="hover:text-primary transition-colors">Browse Shops</Link></li>
                                <li><Link to="/customer/orders" className="hover:text-primary transition-colors">My Orders</Link></li>
                                <li><Link to="/customer/wishlist" className="hover:text-primary transition-colors">Wishlist</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Support</h4>
                            <ul className="space-y-2 text-white/60">
                                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Delivery Info</a></li>
                                <li><a href="#" className="hover:text-primary transition-colors">Returns</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-white font-semibold mb-3">Trust & Safety</h4>
                            <ul className="space-y-2 text-white/60">
                                <li className="flex items-center gap-2"><Badge variant="outline" className="rounded-full border-primary/40 text-primary-light">Secure Payment</Badge></li>
                                <li className="flex items-center gap-2"><Badge variant="outline" className="rounded-full border-primary/40 text-primary-light">Fast Delivery</Badge></li>
                                <li className="flex items-center gap-2"><Badge variant="outline" className="rounded-full border-primary/40 text-primary-light">24/7 Support</Badge></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-4 border-t border-white/10 text-center text-white/40 text-xs">
                        © {new Date().getFullYear()} M-TAI. All rights reserved.
                    </div>
                </div>
            </footer>
        </div>
    );
}
