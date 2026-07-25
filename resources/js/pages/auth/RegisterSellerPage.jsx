import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const COUNTRIES = [
    { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
    { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
    { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
    { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
];

const INDUSTRIES = [
    { value: '', label: 'Select industry' },
    { value: 'logistics', label: 'Logistics & Transport' },
    { value: 'agriculture', label: 'Agriculture' },
    { value: 'technology', label: 'Technology' },
    { value: 'retail', label: 'Retail' },
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'services', label: 'Services' },
    { value: 'other', label: 'Other' },
];

const BUSINESS_TYPES = [
    { value: '', label: 'Select business type' },
    { value: 'sole_proprietor', label: 'Sole Proprietor' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'limited_company', label: 'Limited Company' },
    { value: 'corporation', label: 'Corporation' },
    { value: 'other', label: 'Other' },
];

export default function RegisterSellerPage() {
    const [step, setStep] = useState(1);
    const [stepDir, setStepDir] = useState('left');
    const [userType, setUserType] = useState('');
    const [animKey, setAnimKey] = useState(0);
    const [formData, setFormData] = useState({
        firstName: '',
        middleName: '',
        lastName: '',
        email: '',
        phone: '',
        countryCode: '+255',
        password: '',
        confirmPassword: '',
        businessName: '',
        businessRegNo: '',
        industry: '',
        businessType: '',
        businessAddress: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const goStep = (s, dir) => {
        setStepDir(dir);
        setStep(s);
        setAnimKey(k => k + 1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            setLoading(false);
            return;
        }

        try {
            const result = await register({
                ...formData,
                role: 'business_owner',
                business_type: userType,
                phone: `${formData.countryCode}${formData.phone}`,
            });

            if (result.success) {
                window.location.href = '/login';
            } else {
                setError(result.message || 'Registration failed');
            }
        } catch (err) {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const inputClasses = "w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]";

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
                    <p className="text-[10px] font-bold text-[#00D4AA] uppercase tracking-[3px] mb-3">Seller Registration</p>
                    <h1 className="text-4xl font-black text-gray-600 mb-3">Start Selling</h1>
                    {step === 1 && <p className="text-gray-500 text-lg">Choose your seller type to get started</p>}
                    {step > 1 && (
                        <div className="flex items-center justify-center gap-3 mt-4">
                            {[1,2,3].map(s => (
                                <React.Fragment key={s}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= s ? 'bg-[#00D4AA] text-[#0A140C]' : 'bg-gray-200 text-gray-400'}`}>{s}</div>
                                    {s < 3 && <div className={`w-8 h-0.5 ${step > s ? 'bg-[#00D4AA]' : 'bg-gray-200'}`}></div>}
                                </React.Fragment>
                            ))}
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6">
                        <p className="text-red-600 text-sm font-medium">{error}</p>
                    </div>
                )}

                {!userType && step === 1 && (
                    <div className="grid md:grid-cols-2 gap-6 mb-10">
                        <button
                            onClick={() => { setUserType('individual'); goStep(2, 'left'); }}
                            className="group relative bg-white border border-gray-200 rounded-2xl p-8 text-left hover:border-[#00D4AA] hover:shadow-lg hover:shadow-[#00D4AA]/10 transition-all duration-500"
                        >
                            <div className="w-16 h-16 bg-[#00D4AA]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00D4AA]/20 transition-all duration-300">
                                <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-600 mb-2">Individual Seller</h3>
                            <p className="text-gray-500 text-sm mb-6">Sell as a person without a registered business entity.</p>
                            <div className="flex items-center gap-2 text-[#00D4AA] font-semibold text-sm">
                                <span>Get Started</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </button>

                        <button
                            onClick={() => { setUserType('business'); goStep(2, 'left'); }}
                            className="group relative bg-white border border-gray-200 rounded-2xl p-8 text-left hover:border-[#00D4AA] hover:shadow-lg hover:shadow-[#00D4AA]/10 transition-all duration-500"
                        >
                            <div className="w-16 h-16 bg-[#00D4AA]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00D4AA]/20 transition-all duration-300">
                                <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-600 mb-2">Business Seller</h3>
                            <p className="text-gray-500 text-sm mb-6">Sell under a registered business entity.</p>
                            <div className="flex items-center gap-2 text-[#00D4AA] font-semibold text-sm">
                                <span>Get Started</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </button>
                    </div>
                )}

                {userType && step === 2 && (
                    <form key={`step2-${animKey}`} onSubmit={(e) => { e.preventDefault(); goStep(3, 'left'); }} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">First Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClasses} placeholder="First name" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Middle Name</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    </div>
                                    <input type="text" name="middleName" value={formData.middleName} onChange={handleChange} className={inputClasses} placeholder="Middle name (optional)" />
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Last Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClasses} placeholder="Last name" required />
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClasses} placeholder="email@example.com" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Phone Number</label>
                                <div className="flex gap-2">
                                    <select name="countryCode" value={formData.countryCode} onChange={handleChange} className="w-32 px-3 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white">
                                        {COUNTRIES.map(c => (
                                            <option key={c.code} value={c.dial}>{c.flag} {c.dial}</option>
                                        ))}
                                    </select>
                                    <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" placeholder="712 345 678" required />
                                </div>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className={`${inputClasses} pr-11`} placeholder="Min. 8 characters" required />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 transition-colors">
                                        {showPassword ? (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242M21 21l-6.879-6.879" /></svg>
                                        ) : (
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                        </svg>
                                    </div>
                                    <input type={showPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className={inputClasses} placeholder="Re-enter password" required />
                                </div>
                            </div>
                        </div>
                        <button type="submit" className="w-full py-3 bg-[#00D4AA] hover:bg-[#00B894] text-[#0A140C] rounded-xl font-bold text-sm transition-all duration-200 shadow-md hover:shadow-lg">
                            Continue →
                        </button>
                    </form>
                )}

                {userType && step === 3 && (
                    <form key={`step3-${animKey}`} onSubmit={handleSubmit} className={`space-y-5 ${stepDir === 'left' ? 'step-enter-left' : 'step-enter-right'}`}>
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Industry</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                        </svg>
                                    </div>
                                    <select name="industry" value={formData.industry} onChange={handleChange} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none">
                                        {INDUSTRIES.map(ind => (
                                            <option key={ind.value} value={ind.value}>{ind.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            {userType === 'business' && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Business Type</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <select name="businessType" value={formData.businessType} onChange={handleChange} className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-900 outline-none bg-white appearance-none">
                                            {BUSINESS_TYPES.map(bt => (
                                                <option key={bt.value} value={bt.value}>{bt.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                        {userType === 'business' && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Business Name</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                            </svg>
                                        </div>
                                        <input type="text" name="businessName" value={formData.businessName} onChange={handleChange} className={inputClasses} placeholder="Business name" required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Business Registration No.</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        </div>
                                        <input type="text" name="businessRegNo" value={formData.businessRegNo} onChange={handleChange} className={inputClasses} placeholder="e.g. REG-12345" />
                                    </div>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Business Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <input type="text" name="businessAddress" value={formData.businessAddress} onChange={handleChange} className={inputClasses} placeholder="City, Region" />
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={() => goStep(2, 'right')} className="flex-1 py-3 border border-gray-200 rounded-xl text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all">
                                ← Back
                            </button>
                            <button type="submit" disabled={loading} className="flex-1 py-3 bg-[#00D4AA] hover:bg-[#00B894] text-[#0A140C] rounded-xl font-bold text-sm transition-all duration-200 disabled:opacity-50 shadow-md hover:shadow-lg">
                                {loading ? 'Creating...' : 'CREATE ACCOUNT'}
                            </button>
                        </div>
                    </form>
                )}

                <div className="mt-10 text-center">
                    <p className="text-gray-500 text-sm">
                        Already have an account?{' '}
                        <Link to="/login" className="text-[#00D4AA] font-semibold hover:text-[#00B894] transition-colors">Sign In</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
