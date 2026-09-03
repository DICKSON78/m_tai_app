import React from 'react';
import { useNavigate } from 'react-router-dom';

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

function formatPrice(amount) {
    return 'TZS ' + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function StockBadge({ quantity }) {
    if (quantity <= 0) return <span className="badge badge-red">Out of stock</span>;
    if (quantity <= 5) return <span className="badge badge-yellow">Low stock · {quantity}</span>;
    return <span className="badge badge-green">In stock</span>;
}

const VerifiedIcon = () => (
    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="#1D9BF0">
        <path d="M12 1.75l2.4 2.4 3.35-.45.9 3.25 3.25.9-.45 3.35L23.4 12l-2.4 2.4.45 3.35-3.25.9-.9 3.25-3.35-.45L12 22.25l-2.4-2.4-3.35.45-.9-3.25-3.25-.9.45-3.35L.6 12 3 9.6l-.45-3.35 3.25-.9.9-3.25 3.35.45L12 1.75zm-1.2 13.6l5.1-5.1-1.6-1.6-3.5 3.5-1.5-1.5-1.6 1.6 3.1 3.1z" />
    </svg>
);

const ShareIcon = () => (
    <svg className="w-[22px] h-[22px] text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
);

export default function ProductCard({ product }) {
    const navigate = useNavigate();

    const stock = stockOf(product);
    const price = priceOf(product);
    const compareAt = product.compare_at_price;
    const image = product.images?.[0]?.url || product.image_url || null;
    const sale = compareAt > price;
    const shopName = product.business?.business_name || product.business?.name || 'M-TAI Seller';
    const placeholderColor = PLACEHOLDER_COLORS[Math.abs(product.id) % PLACEHOLDER_COLORS.length];

    const open = () => {
        if (product.business?.id) navigate(`/customer/shops/${product.business.id}`);
    };

    const handleShare = (e) => {
        e.stopPropagation();
        const message = `${product.name} — ${formatPrice(price)} from ${shopName} on M-TAI.`;
        if (navigator.share) {
            navigator.share({ title: product.name, text: message }).catch(() => {});
        } else if (navigator.clipboard) {
            navigator.clipboard.writeText(message).catch(() => {});
        }
    };

    return (
        <div
            onClick={open}
            className="group bg-white rounded-2xl overflow-hidden cursor-pointer text-left transition-shadow hover:shadow-md"
            style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}
        >
            {/* Post header */}
            <div className="flex items-center px-2.5 py-2">
                <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mr-2 shrink-0"
                    style={{ background: '#d0f9f1', color: '#00b894' }}
                >
                    {shopName.charAt(0).toUpperCase()}
                </span>
                <div className="flex-1 min-w-0 mr-1">
                    <div className="flex items-center gap-1">
                        <span className="text-sm font-semibold text-primary-dark truncate">{shopName}</span>
                        <VerifiedIcon />
                    </div>
                    {product.category?.name ? (
                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{product.category.name}</p>
                    ) : null}
                </div>
                <button onClick={handleShare} className="p-1 shrink-0" aria-label="Share">
                    <ShareIcon />
                </button>
            </div>

            {/* Image */}
            <div
                className="relative w-full flex items-center justify-center overflow-hidden"
                style={{ height: 170, backgroundColor: image ? '#f3f4f6' : placeholderColor }}
            >
                {image ? (
                    <img src={image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                    <span className="text-white font-bold" style={{ fontSize: 26 }}>{product.name.charAt(0).toUpperCase()}</span>
                )}
                {sale ? (
                    <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-red-500 text-white text-[11px] font-bold tracking-wide">SALE</span>
                ) : null}
                {stock <= 0 ? (
                    <span className="absolute inset-0 bg-black/45 flex items-center justify-center">
                        <span className="px-3.5 py-1.5 rounded-full bg-white/95 text-gray-800 text-sm font-bold">Sold Out</span>
                    </span>
                ) : null}
            </div>

            {/* Body */}
            <div className="px-2.5 py-2.5 space-y-1">
                <p className="text-[15px] font-semibold text-gray-900 leading-snug line-clamp-2">{product.name}</p>
                <div className="flex items-center justify-between pt-0.5">
                    <div className="flex items-baseline gap-1 min-w-0">
                        <span className="text-[15px] font-bold text-primary-dark whitespace-nowrap">{formatPrice(price)}</span>
                        {compareAt > price ? (
                            <span className="text-[11px] text-gray-400 line-through whitespace-nowrap">{formatPrice(compareAt)}</span>
                        ) : null}
                    </div>
                    <StockBadge quantity={stock} />
                </div>
            </div>
        </div>
    );
}
