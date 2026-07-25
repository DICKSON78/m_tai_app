import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import Layout from '../../components/Layout';
import Pagination from '../../components/Pagination';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/casfeta/PageHeader';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [removing, setRemoving] = useState(null);

    const fetchWishlist = useCallback(async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/wishlist', { params: { page, per_page: 12 } });
            const data = res.data;
            setItems(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotalItems(data.total || 0);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchWishlist(1);
    }, [fetchWishlist]);

    const handlePageChange = (page) => {
        fetchWishlist(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const confirmRemove = (item) => {
        setRemoving(item);
        setConfirmOpen(true);
    };

    const handleRemove = async () => {
        if (!removing) return;
        try {
            await api.delete(`/wishlist/${removing.id}`);
            setConfirmOpen(false);
            setRemoving(null);
            fetchWishlist(currentPage);
        } catch {
            // silent
        }
    };

    const formatPrice = (price) => `TZS ${Number(price || 0).toLocaleString()}`;

    return (
        <Layout>
            <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-2">
                <PageHeader title="Wishlist" subtitle="Your saved products" icon={<Heart size={20} />} />
            </div>
            <div style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }} className="rounded-2xl p-8 overflow-hidden mx-4 mt-4">
                <div className="py-2">
                    <h1 className="text-2xl font-bold text-white mb-1">My Wishlist</h1>
                    {totalItems > 0 && (
                        <p className="text-sm text-white/70">{totalItems} products in wishlist</p>
                    )}
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-8">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse">
                                <div className="aspect-square bg-gray-200" />
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                                    <div className="h-8 bg-gray-200 rounded w-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : items.length === 0 ? (
                    <div className="card empty-state">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">No products in your wishlist</h2>
                        <p className="text-gray-500 mb-6">Add your favorite products to your wishlist.</p>
                        <Link
                            to="/customer/shops"
                            className="btn-primary inline-flex"
                        >
                        Shop Products
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {items.map((item) => {
                                const product = item.product || item;
                                return (
                                    <div
                                        key={item.id}
                                        className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-primary/30 transition-all flex flex-col"
                                    >
                                        <Link to={`/customer/shops/${product.shop_id || ''}/products/${product.id}`}>
                                            <div className="aspect-square bg-gray-100 overflow-hidden">
                                                {product.image || product.image_url ? (
                                                    <img
                                                        src={product.image || product.image_url}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center">
                                                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                        </Link>

                                        <div className="p-4 flex flex-col flex-1">
                                            <Link
                                                to={`/customer/shops/${product.shop_id || ''}/products/${product.id}`}
                                                className="font-semibold text-gray-800 hover:text-primary transition line-clamp-2 mb-2"
                                            >
                                                {product.name}
                                            </Link>

                                            {product.shop_name && (
                                                <p className="text-xs text-gray-400 mb-2">{product.shop_name}</p>
                                            )}

                                            <div className="mt-auto">
                                                <p className="text-lg font-bold text-primary mb-3">
                                                    {formatPrice(product.price)}
                                                </p>
                                                <button
                                                    onClick={() => confirmRemove(item)}
                                                    className="w-full btn-danger justify-center"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setRemoving(null); }}
                onConfirm={handleRemove}
                title="Remove Product"
                message={`Are you sure you want to remove "${removing?.product?.name || removing?.name || 'this product'}" from your wishlist?`}
                confirmText="Remove"
                cancelText="Cancel"
                variant="danger"
            />
        </Layout>
    );
}
