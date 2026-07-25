import React from 'react';
import { Link } from 'react-router-dom';

export default function RegisterTypePage() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 auth-page">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 bg-[#00D4AA] rounded-xl flex items-center justify-center">
                            <span className="text-[#0A140C] font-black text-xl">M</span>
                        </div>
                        <span className="text-gray-600 font-black text-3xl">M-TAI</span>
                    </div>
                    <p className="text-[10px] font-bold text-[#00D4AA] uppercase tracking-[3px] mb-3">Choose Type</p>
                    <h1 className="text-4xl font-black text-gray-600 mb-3">What Would You Like To Be?</h1>
                    <p className="text-gray-500 text-lg">Select the platform that best suits your needs</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <Link
                        to="/register/seller"
                        className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#00D4AA] hover:shadow-lg hover:shadow-[#00D4AA]/10 transition-all duration-500"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 bg-[#00D4AA]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00D4AA]/20 transition-all duration-300">
                                <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-600 mb-2">Business Owner</h3>
                            <p className="text-gray-500 text-sm mb-6">Manage your business, products, customers, and sales all in one place.</p>
                            <div className="flex items-center gap-2 text-[#00D4AA] font-semibold text-sm">
                                <span>Get Started</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/register/customer"
                        className="group relative bg-white border border-gray-200 rounded-2xl p-8 hover:border-[#00D4AA] hover:shadow-lg hover:shadow-[#00D4AA]/10 transition-all duration-500"
                    >
                        <div className="relative">
                            <div className="w-16 h-16 bg-[#00D4AA]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00D4AA]/20 transition-all duration-300">
                                <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-600 mb-2">Customer</h3>
                            <p className="text-gray-500 text-sm mb-6">Shop for products from your favorite businesses with ease.</p>
                            <div className="flex items-center gap-2 text-[#00D4AA] font-semibold text-sm">
                                <span>Sign Up</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-gray-500 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#00D4AA] font-semibold hover:text-[#00B894] transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
