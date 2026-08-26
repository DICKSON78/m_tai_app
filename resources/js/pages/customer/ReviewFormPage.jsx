import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function ReviewFormPage() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [rating, setRating] = useState(0);
    const [hoveredStar, setHoveredStar] = useState(0);
    const [comment, setComment] = useState('');
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get(`/products/${productId}`)
            .then(res => {
                setProduct(res.data?.data || res.data);
            })
            .catch((error) => { console.error('Failed to fetch product:', error); setProduct(null); })
            .finally(() => setLoading(false));
    }, [productId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setSubmitting(true);
        try {
            await api.post(`/products/${productId}/reviews`, {
                rating,
                comment,
            });
            setSuccess(true);
            setTimeout(() => {
                navigate('/customer/orders');
            }, 2500);
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data?.errors || {});
            }
        } finally {
            setSubmitting(false);
        }
    };

    const formatPrice = (price) => `TZS ${Number(price || 0).toLocaleString()}`;

    if (loading) {
        return (
            <div>
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="animate-pulse space-y-6">
                        <div className="h-8 bg-gray-200 rounded w-1/3" />
                        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                                <div className="space-y-2">
                                    <div className="h-4 bg-gray-200 rounded w-48" />
                                    <div className="h-4 bg-gray-200 rounded w-24" />
                                </div>
                            </div>
                            <div className="h-12 bg-gray-200 rounded" />
                            <div className="h-24 bg-gray-200 rounded" />
                            <div className="h-10 bg-gray-200 rounded" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div>
                <div className="max-w-2xl mx-auto px-4 py-8">
                    <div className="card empty-state">
                        <div className="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-primary-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Review Saved!</h2>
                        <p className="text-gray-500">Thank you for your review. Redirecting to order history...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }} className="rounded-2xl p-8 overflow-hidden mx-4 mt-4">
                <div className="max-w-2xl mx-auto py-2">
                    <h1 className="text-2xl font-bold text-white">Write Review</h1>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 py-8">
                {product ? (
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center space-x-4">
                                <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {product.image || product.image_url ? (
                                        <img
                                            src={product.image || product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                    <p className="text-sm text-primary font-medium">{formatPrice(product.price)}</p>
                                    {product.shop_name && (
                                        <p className="text-xs text-gray-400 mt-1">{product.shop_name}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            <div>
                                <label className="form-label">
                                    Rating <span className="text-red-500">*</span>
                                </label>
                                <div className="flex items-center space-x-1">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoveredStar(star)}
                                            onMouseLeave={() => setHoveredStar(0)}
                                            className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                        >
                                            <svg
                                                className={`w-10 h-10 transition-colors ${
                                                    star <= (hoveredStar || rating)
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                                fill="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                            </svg>
                                        </button>
                                    ))}
                                    {rating > 0 && (
                                        <span className="ml-3 text-sm text-gray-500">
                                            {rating === 1 && 'Poor'}
                                            {rating === 2 && 'Below Average'}
                                            {rating === 3 && 'Average'}
                                            {rating === 4 && 'Good'}
                                            {rating === 5 && 'Excellent'}
                                        </span>
                                    )}
                                </div>
                                {errors.rating && (
                                    <p className="mt-2 text-xs text-red-500">{errors.rating[0]}</p>
                                )}
                            </div>

                            <div>
                                <label className="form-label">
                                    Review <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={comment}
                                    onChange={(e) => {
                                        setComment(e.target.value);
                                        if (errors.comment) setErrors(prev => ({ ...prev, comment: null }));
                                    }}
                                    rows={5}
                                    required
                                    className={`form-input resize-none ${
                                        errors.comment ? 'border-red-500 focus:ring-red-500' : ''
                                    }`}
                                    placeholder="Write your review about this product..."
                                />
                                {errors.comment && (
                                    <p className="mt-1 text-xs text-red-500">{errors.comment[0]}</p>
                                )}
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => navigate(-1)}
                                    className="btn-outline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || rating === 0}
                                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <span className="flex items-center">
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                            </svg>
                                            Processing...
                                        </span>
                                    ) : (
                                        'Submit Review'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                ) : (
                    <div className="card empty-state">
                        <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Product Not Found</h2>
                        <p className="text-gray-500 mb-6">The product you want to review could not be found.</p>
                        <button
                            onClick={() => navigate('/customer/orders')}
                            className="btn-primary"
                        >
                            Back to Orders
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
