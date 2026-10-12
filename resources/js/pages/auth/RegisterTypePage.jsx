import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function RegisterTypePage() {
    const { t } = useTranslation();
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6 py-12 auth-page">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-3 mb-8">
                        <div className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border border-gray-100 shadow-sm">
                            <img src="/icons/icon-96x96.png?v=2" alt="M-TAI" className="w-10 h-10 rounded-full object-cover" />
                        </div>
                        <span className="text-gray-600 font-black text-3xl">M-TAI</span>
                    </div>
                    <p className="text-[10px] font-bold text-[#00D4AA] uppercase tracking-[3px] mb-3">{t("auth.choose_type")}</p>
                    <h1 className="text-4xl font-black text-gray-600 mb-3">{t("auth.what_would_you_like")}</h1>
                    <p className="text-gray-500 text-lg">{t("auth.select_platform")}</p>
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
                            <h3 className="text-xl font-bold text-gray-600 mb-2">{t("auth.business_owner")}</h3>
                            <p className="text-gray-500 text-sm mb-6">{t("auth.owner_desc")}</p>
                            <div className="flex items-center gap-2 text-[#00D4AA] font-semibold text-sm">
                                <span>{t("auth.get_started")}</span>
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
                            <h3 className="text-xl font-bold text-gray-600 mb-2">{t("auth.customer")}</h3>
                            <p className="text-gray-500 text-sm mb-6">{t("auth.customer_desc")}</p>
                            <div className="flex items-center gap-2 text-[#00D4AA] font-semibold text-sm">
                                <span>{t("auth.sign_up")}</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </div>
                    </Link>
                </div>

                <div className="mt-10 text-center">
                    <p className="text-gray-500 text-sm">
                        {t("auth.already_have_account")}{' '}
                        <Link to="/login" className="text-[#00D4AA] font-semibold hover:text-[#00B894] transition-colors">
                            {t("common.login")}
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
