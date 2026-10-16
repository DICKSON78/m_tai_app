import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import CustomerPageHeader from '../../components/CustomerPageHeader';
import { CreditCard } from 'lucide-react';

const PAYMENT_METHODS = [
    {
        id: 'mobile_money',
        label: 'Mobile Money',
        description: 'Pay with M-Pesa, Tigo Pesa, Airtel Money',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: 'card',
        label: 'Bank Card',
        description: 'Visa, Mastercard, and others',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
        ),
    },
    {
        id: 'cash',
        label: 'Cash',
        description: 'Pay with cash on delivery',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
];

export default function CheckoutPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { user } = useAuth();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('mobile_money');
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [error, setError] = useState('');

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [deliveryAddress, setDeliveryAddress] = useState('');
    const [couponCode, setCouponCode] = useState('');
    const [couponDiscount, setCouponDiscount] = useState(0);
    const [couponMessage, setCouponMessage] = useState('');
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/cart');
            const data = res.data;
            setItems(data.items || data.data || data || []);
        } catch (error) { console.error('Failed to fetch cart:', error); setItems([]); } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    // Autopopulate customer details from the registered account
    useEffect(() => {
        if (user) {
            if (user.name) setCustomerName((prev) => prev || user.name);
            if (user.phone) setCustomerPhone((prev) => prev || user.phone);
        }
    }, [user]);

    useEffect(() => {
        api.get('/profile')
            .then((res) => {
                const p = res.data?.data || res.data;
                if (p?.name) setCustomerName((prev) => prev || p.name);
                if (p?.phone) setCustomerPhone((prev) => prev || p.phone);
            })
            .catch(() => {});
    }, []);

    const getSubtotal = () => {
        return items.reduce((sum, item) => {
            const price = parseFloat(item.selling_price || item.price || 0);
            const qty = parseInt(item.quantity || 1, 10);
            return sum + price * qty;
        }, 0);
    };

    const getTotal = () => {
        return Math.max(0, getSubtotal() - couponDiscount);
    };

    const formatPrice = (price) => `TZS ${Number(price || 0).toLocaleString()}`;

    const handleValidateCoupon = async () => {
        if (!couponCode.trim()) return;
        const businessId = items[0]?.business_id;
        if (!businessId) return;
        setValidatingCoupon(true);
        setCouponMessage('');
        setCouponDiscount(0);
        try {
            const res = await api.post('/coupons/validate', {
                code: couponCode.trim(),
                business_id: businessId,
                order_amount: getSubtotal(),
            });
            const data = res.data;
            if (data.valid) {
                setCouponDiscount(Number(data.discount || 0));
                setCouponMessage(`Coupon applied! You save ${formatPrice(data.discount)}`);
            } else {
                setCouponMessage(data.message || 'Invalid coupon code.');
            }
        } catch (err) {
            setCouponMessage(err.response?.data?.message || 'Failed to validate coupon.');
        } finally {
            setValidatingCoupon(false);
        }
    };

    const handleCheckout = async () => {
        setSubmitting(true);
        setError('');
        try {
            const payload = {
                customer_name: customerName,
                customer_phone: customerPhone,
                delivery_address: deliveryAddress.trim() || undefined,
                payment_method: paymentMethod,
            };
            if (couponCode.trim()) {
                payload.coupon_code = couponCode.trim();
            }
            const res = await api.post('/orders/checkout', payload);
            const data = res.data.data || res.data;
            setOrderSuccess((data.orders && data.orders[0]) || data);
        } catch (err) {
            const msg = err.response?.data?.message || 'An error occurred. Please try again.';
            setError(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    if (orderSuccess) {
        const orderNo = orderSuccess.transaction_code || orderSuccess.code || '';
        return (
            <div>
                <CustomerPageHeader title={t('checkout.order_confirmed')} onBack={() => navigate('/customer/orders')} />
                <div className="px-6 py-6 text-center" style={{ background: '#F8FAFC' }}>
                    <div className="w-[84px] h-[84px] rounded-full mx-auto flex items-center justify-center" style={{ background: 'rgba(0,212,170,0.12)' }}>
                        <svg className="w-9 h-9" fill="none" stroke="#00D4AA" strokeWidth={3} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-[20px] font-bold mt-4" style={{ color: '#0F172A' }}>
                        {t('checkout.order_confirmed')}
                    </h1>
                    {orderNo && (
                        <p className="text-[14px] font-bold mt-1" style={{ color: '#00A886' }}>{orderNo}</p>
                    )}
                    <p className="text-[14px] mt-2 leading-[22px] max-w-xs mx-auto" style={{ color: '#64748B' }}>
                        {t('checkout.thank_you')}
                    </p>
                    <div className="bg-white rounded-2xl shadow-sm p-2 mt-8 flex flex-col gap-2">
                        <button
                            onClick={() => navigate('/customer/orders')}
                            className="w-full h-12 rounded-xl text-[16px] font-semibold text-white"
                            style={{ background: '#00D4AA' }}
                        >
                            {t('checkout.view_orders')}
                        </button>
                        <button
                            onClick={() => navigate('/customer/dashboard')}
                            className="w-full h-12 rounded-xl text-[16px] font-semibold border"
                            style={{ borderColor: '#E2E8F0', color: '#00A886' }}
                        >
                            {t('checkout.back_home')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (items.length === 0) {
        return (
            <div>
                <div className="max-w-2xl mx-auto px-4 py-16 text-center">
                    <h2 className="text-xl font-bold text-gray-800 mb-2">Cart is empty</h2>
                    <p className="text-gray-500 mb-6">Add items before checkout.</p>
                    <Link
                        to="/customer/shops"
                        className="btn-primary inline-flex"
                    >
                        Browse Shop
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div>
            <CustomerPageHeader
                title={t('checkout.checkout')}
                subtitle={`${items.length} ${t('cart.items')} · ${formatPrice(getTotal())}`}
            />

            <div className="px-4 pb-8 flex flex-col gap-4" style={{ background: '#F8FAFC' }}>
                {error && (
                    <div className="text-[12px] px-4 py-3 rounded-lg" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                        {error}
                    </div>
                )}

                <div className="bg-white rounded-xl shadow-sm p-2 flex flex-col gap-4">
                    <div>
                        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#0F172A' }}>
                            {t('common.name')} *
                        </label>
                        <input
                            type="text"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            placeholder={t('common.name')}
                            required
                            className="w-full bg-white border rounded-lg px-4 min-h-[48px] text-[14px] outline-none focus:border-[#00D4AA] placeholder:text-[#94A3B8]"
                            style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#0F172A' }}>
                            {t('checkout.delivery_address')}
                        </label>
                        <textarea
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            placeholder={t('checkout.address_placeholder')}
                            rows={3}
                            className="w-full bg-white border rounded-lg px-4 py-3 min-h-[96px] text-[14px] outline-none focus:border-[#00D4AA] placeholder:text-[#94A3B8]"
                            style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
                        />
                    </div>
                    <div>
                        <label className="block text-[12px] font-semibold mb-1.5" style={{ color: '#0F172A' }}>
                            {t('common.phone_number')} *
                        </label>
                        <input
                            type="tel"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="+255 7XX XXX XXX"
                            required
                            className="w-full bg-white border rounded-lg px-4 min-h-[48px] text-[14px] outline-none focus:border-[#00D4AA] placeholder:text-[#94A3B8]"
                            style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
                        />
                    </div>
                </div>

                <h2 className="text-[16px] font-bold mt-2" style={{ color: '#0F172A' }}>
                    {t('checkout.payment_method')}
                </h2>
                <div className="flex flex-col gap-3">
                    {PAYMENT_METHODS.map((method) => {
                        const selected = paymentMethod === method.id;
                        return (
                            <label
                                key={method.id}
                                className="flex items-center gap-4 bg-white rounded-xl p-4 cursor-pointer border-[1.5px] transition-all"
                                style={selected
                                    ? { borderColor: '#00D4AA', boxShadow: '0 2px 8px rgba(15,23,42,0.08)' }
                                    : { borderColor: '#E2E8F0' }}
                            >
                                <input
                                    type="radio"
                                    name="payment_method"
                                    value={method.id}
                                    checked={selected}
                                    onChange={(e) => setPaymentMethod(e.target.value)}
                                    className="sr-only"
                                />
                                <span
                                    className="w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0"
                                    style={{ borderColor: selected ? '#00D4AA' : '#CBD5E1' }}
                                >
                                    {selected && <span className="w-3 h-3 rounded-full" style={{ background: '#00D4AA' }} />}
                                </span>
                                <span className="flex-1">
                                    <span className="block text-[14px] font-semibold" style={{ color: '#0F172A' }}>{method.label}</span>
                                    <span className="block text-[12px] mt-0.5" style={{ color: '#64748B' }}>{method.description}</span>
                                </span>
                            </label>
                        );
                    })}
                </div>

                <h2 className="text-[16px] font-bold mt-2" style={{ color: '#0F172A' }}>
                    {t('checkout.coupon_code')}
                </h2>
                <div className="bg-white rounded-xl shadow-sm p-2">
                    {couponDiscount > 0 ? (
                        <div className="flex items-center gap-4">
                            <svg className="w-[18px] h-[18px] shrink-0" fill="none" stroke="#00A886" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                            <div className="flex-1">
                                <p className="text-[14px] font-bold" style={{ color: '#00A886' }}>{couponCode.trim().toUpperCase()}</p>
                                <p className="text-[12px]" style={{ color: '#64748B' }}>
                                    {t('actions.save')} {formatPrice(couponDiscount)}
                                </p>
                            </div>
                            <button
                                onClick={() => { setCouponCode(''); setCouponDiscount(0); setCouponMessage(''); }}
                                className="text-[12px] font-semibold"
                                style={{ color: '#DC2626' }}
                            >
                                {t('checkout.remove')}
                            </button>
                        </div>
                    ) : (
                        <div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={couponCode}
                                    onChange={(e) => setCouponCode(e.target.value)}
                                    placeholder={t('checkout.enter_coupon')}
                                    className="flex-1 bg-white border rounded-lg px-4 min-h-[48px] text-[14px] outline-none focus:border-[#00D4AA] placeholder:text-[#94A3B8]"
                                    style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
                                />
                                <button
                                    onClick={handleValidateCoupon}
                                    disabled={validatingCoupon || !couponCode.trim()}
                                    className="h-12 px-5 rounded-xl text-[14px] font-semibold border disabled:opacity-50"
                                    style={{ borderColor: '#E2E8F0', color: '#00A886' }}
                                >
                                    {validatingCoupon ? '...' : t('checkout.apply')}
                                </button>
                            </div>
                            {couponMessage && (
                                <p className="text-[12px] mt-1.5" style={{ color: couponDiscount > 0 ? '#00A886' : '#DC2626' }}>
                                    {couponMessage}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                <h2 className="text-[16px] font-bold mt-2" style={{ color: '#0F172A' }}>
                    {t('checkout.order_summary')}
                </h2>
                <div className="bg-white rounded-xl shadow-sm p-2 flex flex-col gap-2.5">
                    {items.map((item, index) => {
                        const price = parseFloat(item.selling_price || item.price || 0);
                        const qty = parseInt(item.quantity || 1, 10);
                        return (
                            <div key={item.key || item.id || index} className="flex items-center gap-4">
                                <span className="flex-1 text-[14px] truncate" style={{ color: '#0F172A' }}>
                                    {item.name || item.product?.name} <span style={{ color: '#64748B' }}>× {qty}</span>
                                </span>
                                <span className="text-[14px] font-semibold shrink-0" style={{ color: '#0F172A' }}>
                                    {formatPrice(price * qty)}
                                </span>
                            </div>
                        );
                    })}
                    <div className="border-t my-1" style={{ borderColor: '#E2E8F0' }} />
                    <div className="flex items-center justify-between">
                        <span className="text-[14px] font-semibold" style={{ color: '#64748B' }}>{t('cart.subtotal')}</span>
                        <span className="text-[14px] font-semibold" style={{ color: '#0F172A' }}>{formatPrice(getSubtotal())}</span>
                    </div>
                    {couponDiscount > 0 && (
                        <div className="flex items-center justify-between">
                            <span className="text-[14px] font-semibold" style={{ color: '#64748B' }}>{t('actions.save')}</span>
                            <span className="text-[14px] font-semibold" style={{ color: '#00A886' }}>−{formatPrice(couponDiscount)}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between">
                        <span className="text-[16px] font-bold" style={{ color: '#0F172A' }}>{t('cart.total')}</span>
                        <span className="text-[16px] font-bold" style={{ color: '#0F172A' }}>{formatPrice(getTotal())}</span>
                    </div>
                </div>

                <div className="bg-white border-t px-4 pt-4 pb-6 -mx-4 mt-2" style={{ borderColor: '#E2E8F0' }}>
                    <button
                        onClick={handleCheckout}
                        disabled={submitting}
                        className="w-full h-12 rounded-xl text-[16px] font-semibold text-white disabled:opacity-50"
                        style={{ background: '#00D4AA' }}
                    >
                        {submitting ? '...' : `${t('checkout.place_order')} · ${formatPrice(getTotal())}`}
                    </button>
                </div>
            </div>
        </div>
    );
}
