import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MAIN_LINKS = [
    { to: '/customer/dashboard', label: 'Overview', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
    { to: '/customer/shops', label: 'Shops', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
    { to: '/customer/orders', label: 'My Orders', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { to: '/customer/cart', label: 'My Cart', icon: 'M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z' },
];

const ACCOUNT_LINKS = [
    { to: '/customer/wishlist', label: 'Wishlist', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
    { to: '/customer/profile', label: 'Settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
];

function SideLink({ item, onNavigate }) {
    const location = useLocation();
    const active = location.pathname === item.to || location.pathname.startsWith(item.to + '/');
    return (
        <Link
            to={item.to}
            onClick={onNavigate}
            className={`side-link group ${active ? 'active' : ''}`}
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d={item.icon} />
            </svg>
            <span>{item.label}</span>
        </Link>
    );
}

export default function CustomerSidebar({ onNavigate }) {
    return (
        <div>
            <nav className="flex flex-col">
                <div className="side-section-title">Main</div>
                {MAIN_LINKS.map((item) => <SideLink key={item.to} item={item} onNavigate={onNavigate} />)}

                <div className="side-section-title">Account</div>
                {ACCOUNT_LINKS.map((item) => <SideLink key={item.to} item={item} onNavigate={onNavigate} />)}
            </nav>
        </div>
    );
}
