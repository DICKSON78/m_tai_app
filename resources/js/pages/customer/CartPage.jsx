import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import CustomerPageHeader from '../../components/CustomerPageHeader';
import { ShoppingCart } from 'lucide-react';

export default function CartPage() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingKey, setUpdatingKey] = useState(null);

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/cart');
            const data = res.data;
            setItems(data.items || data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch cart:', error);
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCart();
    }, [fetchCart]);

    const handleUpdateQuantity = async (key, newQty) => {
        if (newQty < 1) return;
        setUpdatingKey(key);
        try {
            await api.put(`/cart/${key}`, { quantity: newQty });
            setItems((prev) =>
                prev.map((item) =>
                    (item.key || item.id) === key
                        ? { ...item, quantity: newQty }
                        : item
                )
            );
        } catch (error) {
            console.error('Failed to update cart quantity:', error);
            alert(error?.response?.data?.message || 'Failed to update quantity. Please try again.');
        } finally {
            setUpdatingKey(null);
        }
    };

    const handleRemoveItem = async (key) => {
        setUpdatingKey(key);
        try {
            await api.delete(`/cart/${key}`);
            setItems((prev) => prev.filter((item) => (item.key || item.id) !== key));
        } catch (error) {
            console.error('Failed to remove cart item:', error);
            alert(error?.response?.data?.message || 'Failed to remove item. Please try again.');
        } finally {
            setUpdatingKey(null);
        }
    };

    const getSubtotal = () => {
        return items.reduce((sum, item) => {
            const price = parseFloat(item.selling_price || item.price || 0);
            const qty = parseInt(item.quantity || 1, 10);
            return sum + price * qty;
        }, 0);
    };

    const handleClear = async () => {
        if (items.length === 0) return;
        try {
            await api.delete('/cart');
            setItems([]);
            window.dispatchEvent(new Event('mtai-cart-updated'));
        } catch (error) {
            console.error('Failed to clear cart:', error);
        }
    };

    const formatPrice = (price) => `TZS ${Number(price || 0).toLocaleString()}`;

    if (loading) {
        return (
            <div>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <CustomerPageHeader
                title={t('cart.my_cart')}
                subtitle={items.length > 0 ? `${items.length} ${t('cart.items')}` : ''}
                rightAction={items.length > 0 ? (
                    <button onClick={handleClear} className="text-[12px] font-semibold" style={{ color: '#DC2626' }}>
                        {t('cart.clear')}
                    </button>
                ) : null}
            />

            <div className="pb-6">
                {items.length === 0 ? (
                    <div className="card empty-state">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Cart is empty</h2>
                        <p className="text-gray-500 mb-6">
                            Add products to your cart to start shopping.
                        </p>
                        <Link
                            to="/customer/shops"
                            className="btn-primary inline-flex"
                        >
                            Browse Shop
                        </Link>
                    </div>
                ) : (
                    <div className="px-4 pb-8">
                        <div className="flex flex-col gap-4 mb-6">
                            {items.map((item) => {
                                const itemKey = item.key || item.id;
                                const price = parseFloat(item.selling_price || item.price || 0);
                                const qty = parseInt(item.quantity || 1, 10);
                                const itemTotal = price * qty;
                                const isUpdating = updatingKey === itemKey;
                                const img = item.image_url || item.product?.image_url || (item.image || item.product?.image ? `/storage/${item.image || item.product?.image}` : null);

                                return (
                                    <div
                                        key={itemKey}
                                        className={`bg-white rounded-xl shadow-sm p-2 flex gap-4 transition ${isUpdating ? 'opacity-50' : ''}`}
                                    >
                                        <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 flex items-center justify-center" style={{ background: '#F1F5F9' }}>
                                            {img ? (
                                                <img src={img} alt={item.name || item.product?.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-[26px] font-bold text-white">
                                                    {(item.name || item.product?.name || '?').charAt(0).toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                                            <div className="flex items-start gap-2">
                                                <h3 className="flex-1 text-[14px] font-semibold leading-5 line-clamp-2" style={{ color: '#0F172A' }}>
                                                    {item.name || item.product?.name}
                                                </h3>
                                                <button
                                                    onClick={() => handleRemoveItem(itemKey)}
                                                    disabled={isUpdating}
                                                    className="w-6 h-6 flex items-center justify-center shrink-0 disabled:opacity-50"
                                                    style={{ color: '#94A3B8' }}
                                                    title="Remove"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <p className="text-[12px] font-bold" style={{ color: '#00A886' }}>
                                                {formatPrice(price)}
                                            </p>
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex items-center gap-1.5 rounded-xl border p-1" style={{ borderColor: '#E2E8F0', background: '#FFFFFF' }}>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(itemKey, qty - 1)}
                                                        disabled={qty <= 1 || isUpdating}
                                                        className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40"
                                                        style={{ background: '#E6FBF6' }}
                                                    >
                                                        <span className="w-3 h-[2.5px] rounded" style={{ background: '#00A886' }} />
                                                    </button>
                                                    <span className="min-w-[26px] text-center text-[14px] font-semibold" style={{ color: '#0F172A' }}>
                                                        {qty}
                                                    </span>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(itemKey, qty + 1)}
                                                        disabled={isUpdating}
                                                        className="w-7 h-7 rounded-full flex items-center justify-center disabled:opacity-40"
                                                        style={{ background: '#E6FBF6' }}
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="#00A886" strokeWidth={3} viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                                                        </svg>
                                                    </button>
                                                </div>
                                                <span className="text-[14px] font-bold" style={{ color: '#0F172A' }}>
                                                    {formatPrice(itemTotal)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="bg-white border-t px-4 pt-4 pb-6 -mx-4" style={{ borderColor: '#E2E8F0' }}>
                            <div className="flex items-center justify-between">
                                <span className="text-[14px]" style={{ color: '#64748B' }}>
                                    Subtotal ({items.length} {items.length === 1 ? 'item' : 'items'})
                                </span>
                                <span className="text-[20px] font-bold" style={{ color: '#0F172A' }}>
                                    {formatPrice(getSubtotal())}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                                <svg className="w-3.5 h-3.5" fill="none" stroke="#00A886" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
                                </svg>
                                <span className="text-[12px]" style={{ color: '#64748B' }}>Delivery calculated at checkout</span>
                            </div>
                            <button
                                onClick={() => navigate('/customer/checkout')}
                                className="w-full h-12 rounded-xl text-[16px] font-semibold text-white mt-4 transition-opacity hover:opacity-90"
                                style={{ background: '#00D4AA' }}
                            >
                                Checkout · {formatPrice(getSubtotal())}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
