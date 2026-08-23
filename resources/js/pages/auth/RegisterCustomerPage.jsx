import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const COUNTRIES = [
    { code: 'TZ', name: 'Tanzania', dial: '+255', flag: '🇹🇿' },
    { code: 'KE', name: 'Kenya', dial: '+254', flag: '🇰🇪' },
    { code: 'UG', name: 'Uganda', dial: '+256', flag: '🇺🇬' },
    { code: 'RW', name: 'Rwanda', dial: '+250', flag: '🇷🇼' },
];

export default function RegisterCustomerPage() {
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
        location: '',
        district: '',
        ward: '',
        street: '',
        businessName: '',
        businessCategory: '',
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

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters');
            setLoading(false);
            return;
        }

        const fullName = [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(' ');

        try {
            const result = await register({
                name: fullName,
                email: formData.email,
                phone: `${formData.countryCode}${formData.phone}`.replace(/\s/g, ''),
                password: formData.password,
                password_confirmation: formData.confirmPassword,
                location: formData.location || null,
                street: formData.street || null,
            }, 'customer');

            if (result && result.id) {
                window.location.href = '/login';
            } else if (result && result.message) {
                setError(result.message);
            } else {
                window.location.href = '/login';
            }
        } catch (err) {
            const msg = err?.response?.data?.message || err?.response?.data?.errors?.name?.[0] || 'Registration failed. Please try again.';
            setError(msg);
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
                    <p className="text-[10px] font-bold text-[#00D4AA] uppercase tracking-[3px] mb-3">Customer Registration</p>
                    <h1 className="text-4xl font-black text-gray-600 mb-3">Join M-TAI</h1>
                    {step === 1 && <p className="text-gray-500 text-lg">Choose your customer type to get started</p>}
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

                {step === 1 && !userType && (
                    <div className="grid md:grid-cols-2 gap-6">
                        <button
                            onClick={() => { setUserType('individual'); goStep(2, 'left'); }}
                            className="group relative bg-white border border-gray-200 rounded-2xl p-8 text-left hover:border-[#00D4AA] hover:shadow-lg hover:shadow-[#00D4AA]/10 transition-all duration-500"
                        >
                            <div className="w-16 h-16 bg-[#00D4AA]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00D4AA]/20 transition-all duration-300">
                                <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-600 mb-2">Personal</h3>
                            <p className="text-gray-500 text-sm mb-6">Shop for yourself as an individual.</p>
                            <div className="flex items-center gap-2 text-[#00D4AA] font-semibold text-sm">
                                <span>Get Started</span>
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                </svg>
                            </div>
                        </button>

                        <button
                            onClick={() => { setUserType('location'); goStep(2, 'left'); }}
                            className="group relative bg-white border border-gray-200 rounded-2xl p-8 text-left hover:border-[#00D4AA] hover:shadow-lg hover:shadow-[#00D4AA]/10 transition-all duration-500"
                        >
                            <div className="w-16 h-16 bg-[#00D4AA]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#00D4AA]/20 transition-all duration-300">
                                <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <h3 className="text-xl font-bold text-gray-600 mb-2">Business</h3>
                            <p className="text-gray-500 text-sm mb-6">Shop for your business or organization.</p>
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
                                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className={`${inputClasses} pr-11`} placeholder="Min. 6 characters" required />
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
                        {userType === 'location' && (
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
                                    <label className="block text-sm font-semibold text-gray-600 mb-1.5">Business Category</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                            </svg>
                                        </div>
                                        <input type="text" name="businessCategory" value={formData.businessCategory} onChange={handleChange} className={inputClasses} placeholder="e.g. Retail, Restaurant, etc." />
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Location</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <input type="text" name="location" value={formData.location} onChange={handleChange} className={inputClasses} placeholder="City / Region" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">District</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                    </div>
                                    <input type="text" name="district" value={formData.district} onChange={handleChange} className={inputClasses} placeholder="District" />
                                </div>
                            </div>
                        </div>
                        <div className="grid md:grid-cols-2 gap-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Ward</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                    </div>
                                    <input type="text" name="ward" value={formData.ward} onChange={handleChange} className={inputClasses} placeholder="Ward" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Street Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <input type="text" name="street" value={formData.street} onChange={handleChange} className={inputClasses} placeholder="Street address" />
                                </div>
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
