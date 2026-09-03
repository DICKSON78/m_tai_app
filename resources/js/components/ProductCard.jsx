import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

const PLACEHOLDER_COLORS = ['#0FAE8C', '#2F80ED', '#F2994A', '#EB5757', '#9B51E0', '#27AE60'];

function priceOf(product) {
    const p = Number(product.price ?? 0);
    if (p > 0) return p;
    const s = Number(product.selling_price ?? 0);
    return s > 0 ? s : Number(product.retail_price ?? 0);
}

function stockOf(product) {
    const v = Number(product.quantity ?? product.stock_quantity ?? 0);
    return Number.isNaN(v) ? 0 : v;
}

function StockBadge({ quantity }) {
    if (quantity <= 0) return <span className="badge badge-red">Out of stock</span>;
    if (quantity <= 5) return <span className="badge badge-yellow">Low stock · {quantity}</span>;
    return <span className="badge badge-green">In stock</span>;
}

function formatPrice(amount) {
    return 'TZS ' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export default function ProductCard({ product }) {
    const navigate = useNavigate();
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

    const stock = stockOf(product);
    const image = product.images?.[0]?.url || product.image_url || null;
    const sale = (product.compare_at_price ?? 0) > priceOf(product);
    const shopName = product.business?.business_name || product.business?.name || 'M-TAI Seller';
    const placeholderColor = PLACEHOLDER_COLORS[Math.abs(product.id) % PLACEHOLDER_COLORS.length];

    const openShop = () => {
        if (product.business?.id) navigate(`/customer/shops/${product.business.id}`);
    };

    const handleAddToCart = async (e) => {
        e.stopPropagation();
        if (adding) return;
        setAdding(true);
        try {
            await api.post('/cart', { product_id: product.id, quantity: 1 });
            setAdded(true);
            window.dispatchEvent(new CustomEvent('mtai-cart-updated'));
            setTimeout(() => setAdded(false), 1400);
        } catch (err) {
            console.error('Add to cart failed', err);
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Post header: shop avatar + name + share */}
            <div className="flex items-center gap-3 px-3.5 py-3">
                <button onClick={openShop} className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold text-white shrink-0" style={{ background: placeholderColor }}>
                    {shopName.charAt(0).toUpperCase()}
                </button>
                <div className="min-w-0 flex-1">
                    <button onClick={openShop} className="flex items-center gap-1 text-sm font-semibold text-gray-900 hover:text-primary transition-colors">
                        <span className="truncate max-w-[220px]">{shopName}</span>
                        <svg className="w-4 h-4 text-blue-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                    </button>
                    {product.category?.name && (
                        <p className="text-xs text-gray-400 truncate">{product.category.name}</p>
                    )}
                </div>
            </div>

            {/* Image */}
            <button
                onClick={openShop}
                className="relative w-full flex items-center justify-center overflow-hidden block"
                style={{ height: 280, backgroundColor: image ? '#f3f4f6' : placeholderColor }}
            >
                {image ? (
                    <img src={image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-white text-4xl font-bold">{product.name.charAt(0).toUpperCase()}</span>
                )}
                {sale && (
                    <span className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[11px] font-bold">SALE</span>
                )}
                {stock <= 0 && (
                    <span className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <span className="px-4 py-1.5 rounded-full bg-white/90 text-gray-800 text-sm font-bold">Sold Out</span>
                    </span>
                )}
            </button>

            {/* Body */}
            <div className="p-3.5 space-y-2.5">
                <p className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</p>
                <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                        <span className="text-xl font-bold text-gray-900">{formatPrice(priceOf(product))}</span>
                        {(product.compare_at_price ?? 0) > priceOf(product) && (
                            <span className="text-sm text-gray-400 line-through">{formatPrice(product.compare_at_price)}</span>
                        )}
                    </div>
                    <StockBadge quantity={stock} />
                </div>
                <button
                    onClick={handleAddToCart}
                    disabled={adding || stock <= 0}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
                        added ? 'bg-green-600 text-white' : 'text-white hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0'
                    }`}
                    style={added ? undefined : { background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}
                >
                    {added ? '✓ Added to Cart' : adding ? 'Adding...' : stock <= 0 ? 'Sold Out' : 'Add to Cart'}
                </button>
            </div>
        </div>
    );
}
