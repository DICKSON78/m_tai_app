import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';

export default function CartPage() {
    const navigate = useNavigate();

    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingKey, setUpdatingKey] = useState(null);

    const fetchCart = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/cart');
            const data = res.data;
            setItems(data.items || data.data || data || []);
        } catch {
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
        } catch {
        } finally {
            setUpdatingKey(null);
        }
    };

    const handleRemoveItem = async (key) => {
        setUpdatingKey(key);
        try {
            await api.delete(`/cart/${key}`);
            setItems((prev) => prev.filter((item) => (item.key || item.id) !== key));
        } catch {
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

    const formatPrice = (price) => `TZS ${Number(price || 0).toLocaleString()}`;

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }} className="rounded-2xl p-8 overflow-hidden mx-4 mt-4">
                <div className="py-2">
                    <h1 className="text-2xl font-bold text-white">My Cart</h1>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-8">
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
                    <div className="flex flex-col lg:flex-row gap-8">
                        <div className="flex-1">
                            <div className="re-table-wrap">
                                <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
                                    <div className="col-span-5">Product</div>
                                    <div className="col-span-2 text-center">Price</div>
                                    <div className="col-span-2 text-center">Quantity</div>
                                    <div className="col-span-2 text-right">Total</div>
                                    <div className="col-span-1"></div>
                                </div>

                                {items.map((item) => {
                                    const itemKey = item.key || item.id;
                                    const price = parseFloat(item.selling_price || item.price || 0);
                                    const qty = parseInt(item.quantity || 1, 10);
                                    const itemTotal = price * qty;
                                    const isUpdating = updatingKey === itemKey;

                                    return (
                                        <div
                                            key={itemKey}
                                            className={`grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 items-center transition ${
                                                isUpdating ? 'opacity-50' : ''
                                            }`}
                                        >
                                            <div className="col-span-5 flex items-center space-x-4">
                                                <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                    {item.image || item.product?.image ? (
                                                        <img
                                                            src={item.image_url || item.product?.image_url || `/storage/${item.image || item.product?.image}`}
                                                            alt={item.name || item.product?.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center">
                                                            <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="font-semibold text-gray-800 text-sm truncate">
                                                        {item.name || item.product?.name}
                                                    </h3>
                                                    {item.shop_name && (
                                                        <p className="text-xs text-gray-500 mt-0.5">{item.shop_name}</p>
                                                    )}
                                                    <p className="text-sm text-primary font-semibold md:hidden mt-1">
                                                        {formatPrice(price)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="hidden md:block col-span-2 text-center text-sm text-gray-700">
                                                {formatPrice(price)}
                                            </div>

                                            <div className="col-span-2 flex items-center justify-center">
                                                <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                                                    <button
                                                        onClick={() => handleUpdateQuantity(itemKey, qty - 1)}
                                                        disabled={qty <= 1 || isUpdating}
                                                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition text-sm font-bold disabled:opacity-50"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="w-10 text-center text-sm py-1.5 border-l border-r border-gray-300">
                                                        {qty}
                                                    </span>
                                                    <button
                                                        onClick={() => handleUpdateQuantity(itemKey, qty + 1)}
                                                        disabled={isUpdating}
                                                        className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 transition text-sm font-bold disabled:opacity-50"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="col-span-2 text-right font-semibold text-gray-800 text-sm">
                                                {formatPrice(itemTotal)}
                                            </div>

                                            <div className="col-span-1 text-right">
                                                <button
                                                    onClick={() => handleRemoveItem(itemKey)}
                                                    disabled={isUpdating}
                                                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition disabled:opacity-50"
                                                    title="Remove"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="lg:w-80 shrink-0">
                            <div className="card sticky top-24">
                                <h3 className="font-semibold text-gray-800 mb-4">Summary</h3>

                                <div className="space-y-3 mb-6">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Product ({items.length})</span>
                                        <span className="text-gray-800">{formatPrice(getSubtotal())}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500">Shipping</span>
                                        <span className="text-gray-400 text-xs">From shop</span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-gray-800">Total</span>
                                            <span className="text-xl font-bold text-primary">
                                                {formatPrice(getSubtotal())}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/customer/checkout')}
                                    className="w-full btn-accent justify-center"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                                    </svg>
                                    <span>Proceed to Checkout</span>
                                </button>

                                <Link
                                    to="/customer/shops"
                                    className="block text-center text-sm text-primary hover:underline mt-3"
                                >
                                    ← Continue Shopping
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
}
