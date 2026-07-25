import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout({ children }) {
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const dashboardPath = user ? `/${user.role === 'business_owner' ? 'owner' : user.role}/dashboard` : null;

    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-md sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center space-x-2">
                                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                    <span className="text-white font-bold text-xl">M</span>
                                </div>
                                <span className="text-xl font-bold text-gray-800">M-TAI</span>
                            </Link>
                        </div>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center space-x-4">
                            <Link to="/" className="text-gray-600 hover:text-primary transition font-medium">
                                Nyumbani
                            </Link>
                            {user ? (
                                <>
                                    <Link to={dashboardPath} className="text-gray-600 hover:text-primary transition font-medium">
                                        Dashibodi
                                    </Link>
                                    <div className="flex items-center space-x-3 ml-4 border-l pl-4">
                                        <span className="text-sm text-gray-500">
                                            Karibu,{' '}
                                            <span className="font-semibold text-gray-800">{user.name}</span>
                                        </span>
                                        <button
                                            onClick={logout}
                                            className="text-sm text-red-500 hover:text-red-700 transition font-medium cursor-pointer"
                                        >
                                            Ondoka
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="text-gray-600 hover:text-primary transition font-medium"
                                    >
                                        Ingia
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition font-medium"
                                    >
                                        Jiandikishe
                                    </Link>
                                </>
                            )}
                        </div>

                        {/* Mobile menu button */}
                        <div className="md:hidden flex items-center">
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="text-gray-600 hover:text-primary"
                            >
                                {mobileMenuOpen ? (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t bg-white">
                        <div className="px-4 py-3 space-y-2">
                            <Link
                                to="/"
                                className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                Nyumbani
                            </Link>
                            {user ? (
                                <>
                                    <Link
                                        to={dashboardPath}
                                        className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Dashibodi
                                    </Link>
                                    <div className="border-t pt-2 mt-2">
                                        <span className="block px-3 py-1 text-sm text-gray-500">
                                            Karibu, {user.name}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setMobileMenuOpen(false);
                                                logout();
                                            }}
                                            className="w-full text-left px-3 py-2 rounded-lg text-red-500 hover:bg-red-50"
                                        >
                                            Ondoka
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="block px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Ingia
                                    </Link>
                                    <Link
                                        to="/register"
                                        className="block px-3 py-2 rounded-lg bg-primary text-white text-center hover:bg-primary-dark"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        Jiandikishe
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </nav>

            {/* Main Content */}
            <main className="flex-1">{children}</main>

            {/* Footer */}
            <footer className="bg-gray-800 text-gray-300 mt-auto">
                <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm">
                    &copy; {new Date().getFullYear()} M-TAI. Haki zote zimehifadhiwa.
                </div>
            </footer>
        </div>
    );
}
