import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

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
        id: 'bank_card',
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
        label: 'M-Pesa',
        description: 'Pay with cash',
        icon: (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
        ),
    },
];

export default function CheckoutPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('mobile_money');
    const [orderSuccess, setOrderSuccess] = useState(null);
    const [error, setError] = useState('');

    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
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
                payment_method: paymentMethod,
            };
            if (couponCode.trim()) {
                payload.coupon_code = couponCode.trim();
            }
            const res = await api.post('/orders/checkout', payload);
            setOrderSuccess(res.data.data || res.data);
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
        return (
            <div>
                <div className="max-w-2xl mx-auto px-4 py-12">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-8 text-center" style={{ background: 'linear-gradient(135deg, #d0f4dd 0%, #b8f0cc 100%)' }}>
                            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-800 mb-2">Your Order is Complete!</h1>
                            <p className="text-gray-600">Thank you for your purchase. Your order has been placed.</p>
                        </div>

                        <div className="p-8">
                            <div className="text-center mb-6">
                                <p className="text-sm text-gray-500 mb-1">Transaction Code</p>
                                <p className="text-2xl font-bold text-primary">
                                    {orderSuccess.transaction_code || orderSuccess.code || 'TXN-XXXXXXXXX'}
                                </p>
                            </div>

                            {orderSuccess.items && orderSuccess.items.length > 0 && (
                                <div className="border border-gray-200 rounded-2xl overflow-hidden mb-6">
                                    <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                                        <h3 className="text-sm font-semibold text-gray-700">Purchased Items</h3>
                                    </div>
                                    {orderSuccess.items.map((item, index) => (
                                        <div
                                            key={item.id || index}
                                            className="px-4 py-3 border-b border-gray-100 last:border-0 flex items-center justify-between"
                                        >
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{item.name || item.product?.name}</p>
                                                <p className="text-xs text-gray-500">
                                                    {item.quantity} x {formatPrice(item.selling_price || item.price)}
                                                </p>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-800">
                                                {formatPrice((item.selling_price || item.price || 0) * (item.quantity || 1))}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-primary/5 rounded-2xl p-4 mb-6">
                                <div className="flex items-center justify-between">
                                    <span className="text-gray-600">Total Amount</span>
                                    <span className="text-xl font-bold text-primary">
                                        {formatPrice(orderSuccess.total || orderSuccess.total_amount || getSubtotal())}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <Link
                                    to={`/customer/orders/${orderSuccess.id}`}
                                    className="flex-1 btn-primary justify-center text-center"
                                >
                                    View Your Order
                                </Link>
                                <Link
                                    to="/customer/shops"
                                    className="flex-1 btn-outline justify-center text-center"
                                >
                                    Continue Shopping
                                </Link>
                            </div>
                        </div>
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
            <div style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }} className="rounded-2xl p-8 overflow-hidden mx-4 mt-4">
                <div className="py-2">
                    <div className="flex items-center space-x-2 text-sm text-white/70 mb-2">
                        <Link to="/customer/cart" className="hover:text-white transition">Cart</Link>
                        <span>/</span>
                        <span className="text-white font-medium">Payment</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white">Payment</h1>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl mb-6">
                        {error}
                    </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="flex-1 space-y-6">
                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="form-label">Full Name *</label>
                                    <input
                                        type="text"
                                        value={customerName}
                                        onChange={(e) => setCustomerName(e.target.value)}
                                        placeholder="Enter your full name"
                                        className="form-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="form-label">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={customerPhone}
                                        onChange={(e) => setCustomerPhone(e.target.value)}
                                        placeholder="e.g. 0712 345 678"
                                        className="form-input"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Method</h2>
                            <div className="space-y-3">
                                {PAYMENT_METHODS.map((method) => (
                                    <label
                                        key={method.id}
                                        className={`flex items-center p-4 rounded-2xl border-2 cursor-pointer transition ${
                                            paymentMethod === method.id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="payment_method"
                                            value={method.id}
                                            checked={paymentMethod === method.id}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            className="sr-only"
                                        />
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mr-4 shrink-0 ${
                                            paymentMethod === method.id
                                                ? 'border-primary'
                                                : 'border-gray-300'
                                        }`}>
                                            {paymentMethod === method.id && (
                                                <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                                            )}
                                        </div>
                                        <div className={`mr-4 ${paymentMethod === method.id ? 'text-primary' : 'text-gray-400'}`}>
                                            {method.icon}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">{method.label}</p>
                                            <p className="text-sm text-gray-500">{method.description}</p>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="lg:w-96 shrink-0">
                        <div className="card sticky top-24">
                            <h3 className="font-semibold text-gray-800 mb-4">Order Summary</h3>

                            <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                                {items.map((item, index) => {
                                    const price = parseFloat(item.selling_price || item.price || 0);
                                    const qty = parseInt(item.quantity || 1, 10);
                                    return (
                                        <div key={item.key || item.id || index} className="flex items-center space-x-3">
                                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                {item.image || item.product?.image ? (
                                                    <img
                                                        src={item.image_url || item.product?.image_url || `/storage/${item.image || item.product?.image}`}
                                                        alt={item.name || item.product?.name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-800 truncate">
                                                    {item.name || item.product?.name}
                                                </p>
                                                <p className="text-xs text-gray-500">x{qty}</p>
                                            </div>
                                            <span className="text-sm font-semibold text-gray-800 shrink-0">
                                                {formatPrice(price * qty)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="border-t border-gray-200 pt-4 space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Product ({items.length})</span>
                                    <span className="text-gray-800">{formatPrice(getSubtotal())}</span>
                                </div>

                                <div className="pt-2">
                                    <label className="form-label text-xs">Coupon Code</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={couponCode}
                                            onChange={(e) => setCouponCode(e.target.value)}
                                            placeholder="Enter coupon"
                                            className="form-input text-sm flex-1"
                                        />
                                        <button
                                            onClick={handleValidateCoupon}
                                            disabled={validatingCoupon || !couponCode.trim()}
                                            className="btn-outline text-sm px-3 py-1.5"
                                        >
                                            {validatingCoupon ? '...' : 'Apply'}
                                        </button>
                                    </div>
                                    {couponMessage && (
                                        <p className={`text-xs mt-1 ${couponDiscount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {couponMessage}
                                        </p>
                                    )}
                                </div>

                                {couponDiscount > 0 && (
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-green-600">Discount</span>
                                        <span className="text-green-600">-{formatPrice(couponDiscount)}</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-500">Shipping</span>
                                    <span className="text-gray-400 text-xs">From shop</span>
                                </div>
                                <div className="border-t border-gray-200 pt-3">
                                    <div className="flex items-center justify-between">
                                        <span className="font-semibold text-gray-800">Total</span>
                                        <span className="text-xl font-bold text-primary">
                                            {formatPrice(getTotal())}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckout}
                                disabled={submitting}
                                className="w-full btn-accent justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-6"
                            >
                                {submitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span>Place Order</span>
                                    </>
                                )}
                            </button>

                            <Link
                                to="/customer/cart"
                                className="block text-center text-sm text-primary hover:underline mt-3"
                            >
                                ← Back to Cart
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
