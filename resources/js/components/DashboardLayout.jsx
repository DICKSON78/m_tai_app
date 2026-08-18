import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Sheet, SheetContent } from './ui/sheet';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

const navConfig = {
    admin: [
        { label: 'Overview', items: [
            { to: '/admin/dashboard', label: 'Dashboard', icon: 'home' },
        ]},
        { label: 'Business Management', items: [
            { to: '/admin/shops', label: 'All Businesses', icon: 'store' },
            { to: '/admin/subscriptions', label: 'Subscriptions', icon: 'credit-card' },
        ]},
        { label: 'User Management', items: [
            { to: '/admin/customers', label: 'All Users', icon: 'users' },
        ]},
        { label: 'Finance', items: [
            { to: '/admin/finance', label: 'Revenue Overview', icon: 'banknotes' },
            { to: '/admin/orders', label: 'All Orders', icon: 'shopping-cart' },
            { to: '/owner/finance/accounts', label: 'Chart of Accounts', icon: 'collection' },
            { to: '/owner/finance/journal', label: 'Journal Entries', icon: 'clipboard' },
            { to: '/owner/finance/invoices', label: 'Invoices', icon: 'credit-card' },
            { to: '/owner/finance/bills', label: 'Bills', icon: 'shopping-cart' },
            { to: '/owner/finance/bank-accounts', label: 'Bank Accounts', icon: 'banknotes' },
            { to: '/owner/finance/reports', label: 'Finance Reports', icon: 'chart-bar' },
            { to: '/owner/finance/budgets', label: 'Budgets', icon: 'currency-dollar' },
            { to: '/owner/finance/tax-settings', label: 'Tax Settings', icon: 'cog' },
            { to: '/owner/finance/general-ledger', label: 'General Ledger', icon: 'clipboard' },
            { to: '/owner/finance/cost-centers', label: 'Cost Centers', icon: 'collection' },
            { to: '/owner/finance/fixed-assets', label: 'Fixed Assets', icon: 'building' },
            { to: '/owner/finance/fiscal-periods', label: 'Fiscal Periods', icon: 'calendar' },
            { to: '/owner/finance/currencies', label: 'Currencies', icon: 'currency-dollar' },
        ]},
        { label: 'HR', items: [
            { to: '/admin/hr', label: 'HR Overview', icon: 'user-group' },
            { to: '/owner/hr/employees', label: 'Employee Directory', icon: 'users' },
            { to: '/owner/hr/attendance', label: 'Attendance', icon: 'clipboard' },
            { to: '/owner/hr/leave', label: 'Leave Management', icon: 'calendar' },
            { to: '/owner/hr/payroll', label: 'Payroll', icon: 'banknotes' },
            { to: '/owner/hr/performance', label: 'Performance', icon: 'trending-up' },
            { to: '/owner/hr/recruitment', label: 'Recruitment', icon: 'user-group' },
            { to: '/owner/hr/training', label: 'Training', icon: 'clipboard' },
            { to: '/owner/hr/benefits', label: 'Benefits', icon: 'heart' },
        ]},
        { label: 'CRM & Sales', items: [
            { to: '/owner/crm', label: 'CRM', icon: 'users' },
        ]},
        { label: 'Purchases', items: [
            { to: '/owner/purchases/suppliers', label: 'Suppliers', icon: 'truck' },
            { to: '/owner/purchases/orders', label: 'Purchase Orders', icon: 'shopping-cart' },
            { to: '/owner/purchases/payments', label: 'Supplier Payments', icon: 'credit-card' },
        ]},
        { label: 'Operations', items: [
            { to: '/admin/deliveries', label: 'Deliveries', icon: 'truck' },
            { to: '/owner/warehouses', label: 'Warehouses', icon: 'building' },
            { to: '/owner/manufacturing', label: 'Manufacturing', icon: 'clipboard' },
        ]},
        { label: 'Marketing', items: [
            { to: '/admin/announcements', label: 'Announcements', icon: 'megaphone' },
            { to: '/admin/promotions', label: 'Promotions & Coupons', icon: 'ticket' },
        ]},
        { label: 'Reports & Analytics', items: [
            { to: '/admin/reports', label: 'Analytics', icon: 'chart-bar' },
            { to: '/admin/audit-logs', label: 'Audit Logs', icon: 'shield' },
        ]},
        { label: 'System', items: [
            { to: '/admin/settings', label: 'Platform Settings', icon: 'cog' },
        ]},
    ],
    business_owner: [
        { label: 'Main', items: [
            { to: '/owner/dashboard', label: 'Dashboard', icon: 'home' },
            { to: '/owner/businesses', label: 'Businesses', icon: 'store' },
            { to: '/owner/products', label: 'Products', icon: 'package' },
            { to: '/owner/categories', label: 'Categories', icon: 'collection' },
        ]},
        { label: 'People', items: [
            { to: '/owner/customers', label: 'Customers', icon: 'users' },
            { to: '/owner/employees', label: 'Employees', icon: 'user-group' },
        ]},
        { label: 'Business', items: [
            { to: '/owner/inventory', label: 'Inventory', icon: 'clipboard' },
            { to: '/owner/loans', label: 'Loans', icon: 'banknotes' },
            { to: '/owner/expenses', label: 'Expenses', icon: 'currency-dollar' },
            { to: '/owner/credit-sales', label: 'Credit Sales', icon: 'credit-card' },
            { to: '/owner/imports', label: 'Imports', icon: 'package' },
            { to: '/owner/investments', label: 'Savings & Investment', icon: 'banknotes' },
        ]},
        { label: 'Services', items: [
            { to: '/owner/deliveries', label: 'Deliveries', icon: 'truck' },
            { to: '/owner/coupons', label: 'Coupons', icon: 'ticket' },
        ]},
        { label: 'Reports', items: [
            { to: '/owner/reports', label: 'Reports', icon: 'trending-up' },
        ]},
        { label: 'Tools', items: [
            { to: '/owner/barcodes', label: 'Barcodes', icon: 'clipboard' },
            { to: '/owner/export', label: 'Export Data', icon: 'trending-up' },
            { to: '/owner/receipts', label: 'Receipts', icon: 'ticket' },
        ]},
        { label: 'Finance', items: [
            { to: '/owner/finance/accounts', label: 'Chart of Accounts', icon: 'collection' },
            { to: '/owner/finance/journal', label: 'Journal Entries', icon: 'clipboard' },
            { to: '/owner/finance/invoices', label: 'Invoices', icon: 'credit-card' },
            { to: '/owner/finance/bills', label: 'Bills', icon: 'shopping-cart' },
            { to: '/owner/finance/bank-accounts', label: 'Bank Accounts', icon: 'banknotes' },
            { to: '/owner/finance/reports', label: 'Finance Reports', icon: 'chart-bar' },
            { to: '/owner/finance/budgets', label: 'Budgets', icon: 'currency-dollar' },
            { to: '/owner/finance/tax-settings', label: 'Tax Settings', icon: 'cog' },
            { to: '/owner/finance/general-ledger', label: 'General Ledger', icon: 'clipboard' },
            { to: '/owner/finance/cost-centers', label: 'Cost Centers', icon: 'collection' },
            { to: '/owner/finance/fixed-assets', label: 'Fixed Assets', icon: 'building' },
            { to: '/owner/finance/fiscal-periods', label: 'Fiscal Periods', icon: 'calendar' },
            { to: '/owner/finance/currencies', label: 'Currencies', icon: 'currency-dollar' },
        ]},
        { label: 'HR', items: [
            { to: '/owner/hr/employees', label: 'Employee Directory', icon: 'users' },
            { to: '/owner/hr/attendance', label: 'Attendance', icon: 'clipboard' },
            { to: '/owner/hr/leave', label: 'Leave Management', icon: 'calendar' },
            { to: '/owner/hr/payroll', label: 'Payroll', icon: 'banknotes' },
            { to: '/owner/hr/performance', label: 'Performance', icon: 'trending-up' },
            { to: '/owner/hr/recruitment', label: 'Recruitment', icon: 'user-group' },
            { to: '/owner/hr/training', label: 'Training', icon: 'clipboard' },
            { to: '/owner/hr/benefits', label: 'Benefits', icon: 'heart' },
        ]},
        { label: 'CRM & Sales', items: [
            { to: '/owner/crm', label: 'CRM', icon: 'users' },
        ]},
        { label: 'Purchases', items: [
            { to: '/owner/purchases/suppliers', label: 'Suppliers', icon: 'truck' },
            { to: '/owner/purchases/orders', label: 'Purchase Orders', icon: 'shopping-cart' },
            { to: '/owner/purchases/payments', label: 'Supplier Payments', icon: 'credit-card' },
        ]},
        { label: 'Operations', items: [
            { to: '/owner/warehouses', label: 'Warehouses', icon: 'building' },
            { to: '/owner/manufacturing', label: 'Manufacturing', icon: 'clipboard' },
        ]},
    ],
    employee: [
        { label: 'Work', items: [
            { to: '/employee/dashboard', label: 'Dashboard', icon: 'home' },
            { to: '/employee/customers', label: 'Customers', icon: 'users' },
            { to: '/employee/inventory', label: 'Inventory', icon: 'clipboard' },
            { to: '/employee/expenses', label: 'Expenses', icon: 'currency-dollar' },
            { to: '/employee/deliveries', label: 'Deliveries', icon: 'truck' },
        ]},
    ],
    customer: [
        { label: 'Shopping', items: [
            { to: '/customer/dashboard', label: 'Dashboard', icon: 'home' },
            { to: '/customer/shops', label: 'Shops', icon: 'store' },
            { to: '/customer/orders', label: 'Orders', icon: 'shopping-cart' },
            { to: '/customer/deliveries', label: 'Deliveries', icon: 'truck' },
            { to: '/customer/wishlist', label: 'Wishlist', icon: 'heart' },
        ]},
        { label: 'Account', items: [
            { to: '/customer/profile', label: 'Profile', icon: 'user' },
        ]},
    ],
    transporter: [
        { label: 'Work', items: [
            { to: '/transporter/dashboard', label: 'Dashboard', icon: 'home' },
            { to: '/transporter/deliveries', label: 'Deliveries', icon: 'truck' },
        ]},
    ],
};

function SidebarIcon({ icon, className = 'w-5 h-5 shrink-0' }) {
    const icons = {
        home: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
        ),
        store: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
        ),
        users: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        'credit-card': (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
        'chart-bar': (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        megaphone: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
            </svg>
        ),
        package: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
        ),
        'user-group': (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
        clipboard: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
        ),
        banknotes: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        'currency-dollar': (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        ),
        'trending-up': (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
        ),
        truck: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
            </svg>
        ),
        collection: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
        ),
        'shopping-cart': (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
            </svg>
        ),
        user: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
        ),
        ticket: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
            </svg>
        ),
        heart: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
        ),
        shield: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        cog: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
        calendar: (
            <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
    };

    return icons[icon] || icons.home;
}

export default function DashboardLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [collapsedGroups, setCollapsedGroups] = useState({});
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const toggleGroup = (gi) => {
        setCollapsedGroups(prev => ({ ...prev, [gi]: !prev[gi] }));
    };

    // Auto-expand group that contains active item
    useEffect(() => {
        groups.forEach((group, gi) => {
            if (group.items.some(item => isActive(item.to))) {
                setCollapsedGroups(prev => ({ ...prev, [gi]: false }));
            }
        });
    }, [location.pathname]);

    const role = user?.role || 'customer';
    const groups = navConfig[role] || navConfig.customer;

    const isActive = (path) => {
        return location.pathname === path || location.pathname.startsWith(path + '/');
    };

    const userInitials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const roleLabel = { business_owner: 'Business Owner', admin: 'Administrator', employee: 'Employee', customer: 'Customer', transporter: 'Transporter' }[role] || role;

    const settingsPath = `/${role === 'business_owner' ? 'owner' : role}/settings`;

    const sidebarContent = (
        <>
            {/* Logo */}
            <div className="p-5 pb-3 flex items-center justify-between">
                <Link to={`/${role === 'business_owner' ? 'owner' : role}/dashboard`} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                         style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        MT
                    </div>
                    <div>
                        <h1 className="text-white font-bold text-[15px] leading-tight">M-TAI</h1>
                        <p className="text-green-200/60 text-[11px]">Business Management</p>
                    </div>
                </Link>
                <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/60 hover:text-white">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 min-h-0 px-3 py-2 sidebar-scroll">
                <div className="space-y-1">
                    {groups.map((group, gi) => {
                        const collapsed = collapsedGroups[gi];
                        return (
                            <div key={gi}>
                                <button
                                    onClick={() => toggleGroup(gi)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-green-300 hover:text-white transition-colors rounded-lg group"
                                >
                                    <span>{group.label}</span>
                                    <svg
                                        className={`w-4 h-4 text-green-400/80 group-hover:text-white transition-all duration-200 ${collapsed ? '' : 'rotate-90'}`}
                                        fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                                <div className={`space-y-0.5 overflow-hidden transition-all duration-200 ${collapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                                    {group.items.map((item) => {
                                        const active = isActive(item.to);
                                        return (
                                            <Tooltip key={item.to} delayDuration={0}>
                                                <TooltipTrigger asChild>
                                                    <Link
                                                        to={item.to}
                                                        onClick={() => setSidebarOpen(false)}
                                                        className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                                            active
                                                                ? 'text-white'
                                                                : 'text-white/70 hover:text-white hover:bg-white/10'
                                                        }`}
                                                        style={active ? { background: 'linear-gradient(135deg, #00D4AA, #00c9a0)' } : undefined}
                                                    >
                                                        <SidebarIcon icon={item.icon} className="w-5 h-5 shrink-0" />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                </TooltipTrigger>
                                            </Tooltip>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </ScrollArea>

            {/* Settings + User */}
            <div className="px-3 pb-4 space-y-1 border-t border-white/10 pt-3">
                <Link
                    to={settingsPath}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all duration-200"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span>Settings</span>
                </Link>
                <Separator className="bg-white/10 my-2" />
                <div className="flex items-center gap-3 px-3 py-2.5">
                    <Avatar className="h-9 w-9 border-2 border-white/20">
                        <AvatarFallback className="text-white text-xs font-bold"
                                        style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            {userInitials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{user?.name || 'User'}</p>
                        <p className="text-[11px] text-white/50">{roleLabel}</p>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="fixed inset-0 flex">
            {/* Mobile sidebar using Sheet */}
            <div className="md:hidden">
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetContent side="left" className="w-[272px] p-0 border-0" style={{ background: 'linear-gradient(180deg, #0a2e26 0%, #0d3d33 50%, #071f1a 100%)' }}>
                        {sidebarContent}
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop sidebar */}
            <aside
                className="hidden md:flex w-[272px] flex-col shrink-0 h-full overflow-hidden"
                style={{ background: 'linear-gradient(180deg, #0a2e26 0%, #0d3d33 50%, #071f1a 100%)' }}
            >
                {sidebarContent}
            </aside>

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="bg-white border-b border-gray-200 h-14 px-4 md:px-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-500 hover:text-forest">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span className="font-medium text-gray-700">
                                {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </span>
                        </div>
                        <Separator orientation="vertical" className="h-5 hidden sm:block bg-gray-200" />
                        <div className="hidden sm:flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="font-medium text-gray-700">
                                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="relative w-9 h-9 rounded-full bg-primary-light flex items-center justify-center hover:bg-primary/20 transition-colors">
                                    <svg className="w-[18px] h-[18px] text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center text-[9px] text-white font-bold border-2 border-white">3</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-80">
                                <DropdownMenuLabel className="font-semibold">Notifications</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <div className="max-h-72 overflow-y-auto">
                                    {[
                                        { title: 'New order received', desc: 'Order #1234 from John Doe', time: '2 min ago', unread: true },
                                        { title: 'Payment confirmed', desc: 'TZS 150,000 received', time: '15 min ago', unread: true },
                                        { title: 'New user registered', desc: 'Jane Smith joined as Customer', time: '1 hour ago', unread: true },
                                        { title: 'System update', desc: 'Scheduled maintenance tonight', time: '3 hours ago', unread: false },
                                    ].map((n, i) => (
                                        <DropdownMenuItem key={i} className="flex items-start gap-3 py-3 cursor-pointer">
                                            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-primary' : 'bg-gray-300'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900">{n.title}</p>
                                                <p className="text-xs text-gray-500 truncate">{n.desc}</p>
                                            </div>
                                            <span className="text-[11px] text-gray-400 whitespace-nowrap">{n.time}</span>
                                        </DropdownMenuItem>
                                    ))}
                                </div>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-center justify-center text-sm font-medium text-primary cursor-pointer">
                                    View all notifications
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button className="flex items-center gap-2.5 pl-1 pr-3 py-1 rounded-full hover:bg-gray-100 transition-colors">
                                    <Avatar className="h-8 w-8 border-2 border-primary/30">
                                        <AvatarFallback className="text-white text-xs font-bold"
                                                        style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                                            {userInitials}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="hidden md:flex flex-col items-start">
                                        <span className="text-sm font-semibold text-gray-800 leading-tight">{user?.name || 'User'}</span>
                                    </div>
                                    <svg className="w-4 h-4 text-gray-400 hidden md:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <p className="font-semibold">{user?.name || 'User'}</p>
                                    <p className="text-xs font-normal text-gray-500">{user?.email || ''}</p>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => navigate(settingsPath)} className="cursor-pointer">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    Settings
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => navigate(settingsPath)} className="cursor-pointer">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    My Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={logout} className="text-red-600 cursor-pointer focus:text-red-600 focus:bg-red-50">
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Sign Out
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto bg-surface p-4 md:p-6 content-area">
                    {children}
                </div>
            </div>
        </div>
    );
}
