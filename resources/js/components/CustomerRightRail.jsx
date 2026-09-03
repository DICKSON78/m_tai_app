import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const PLACEHOLDER_COLORS = ['#0FAE8C', '#2F80ED', '#F2994A', '#EB5757', '#9B51E0', '#27AE60'];

const ADS = [
    { title: 'Shop the freshest', sub: 'Farm produce delivered', emoji: '🥗' },
    { title: 'Flash Sale Today', sub: 'Up to 50% off essentials', emoji: '⚡' },
];

export default function CustomerRightRail() {
    const [topShops, setTopShops] = useState([]);

    useEffect(() => {
        let active = true;
        (async () => {
            try {
                const res = await api.get('/shop/products', { params: { per_page: 30 } });
                const data = res.data?.data ?? res.data ?? [];
                const items = Array.isArray(data.data) ? data.data : data;
                const map = new Map();
                for (const p of items) {
                    const b = p.business;
                    if (!b?.id) continue;
                    if (!map.has(b.id)) map.set(b.id, { id: b.id, name: b.business_name || b.name || 'M-TAI Seller', count: 0 });
                    map.get(b.id).count += 1;
                }
                const sorted = Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 5);
                if (active) setTopShops(sorted);
            } catch (e) {
                if (active) setTopShops([]);
            }
        })();
        return () => { active = false; };
    }, []);

    return (
        <div className="space-y-4">
            {/* Ad banners */}
            {ADS.map((ad, i) => (
                <Link
                    key={i}
                    to="/customer/shops"
                    className="block rounded-xl overflow-hidden p-4 text-white"
                    style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-bold leading-tight">{ad.title}</p>
                            <p className="text-xs text-white/80 mt-0.5">{ad.sub}</p>
                        </div>
                        <span className="text-2xl">{ad.emoji}</span>
                    </div>
                </Link>
            ))}

            {/* Top shops */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
                <h3 className="text-sm font-bold text-gray-900 mb-3">Top Good Shops</h3>
                <div className="space-y-3">
                    {topShops.length === 0 ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="animate-pulse flex items-center gap-2.5">
                                    <div className="w-9 h-9 rounded-full bg-gray-200" />
                                    <div className="flex-1 space-y-1">
                                        <div className="h-3 w-3/4 bg-gray-200 rounded" />
                                        <div className="h-2.5 w-1/2 bg-gray-100 rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        topShops.map((shop, idx) => {
                            const color = PLACEHOLDER_COLORS[shop.id % PLACEHOLDER_COLORS.length];
                            return (
                                <Link
                                    key={shop.id}
                                    to={`/customer/shops/${shop.id}`}
                                    className="flex items-center gap-2.5 group"
                                >
                                    <span className="text-[10px] font-bold text-gray-400 w-3 shrink-0">{idx + 1}</span>
                                    <span
                                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shrink-0"
                                        style={{ background: color }}
                                    >
                                        {shop.name.charAt(0).toUpperCase()}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-primary transition-colors">{shop.name}</p>
                                        <p className="text-xs text-gray-500">{shop.count} products</p>
                                    </div>
                                </Link>
                            );
                        })
                    )}
                </div>
            </div>

            {/* M-TAI promo */}
            <div className="rounded-xl border border-gray-200 p-4 text-center" style={{ background: '#d0f9f1' }}>
                <p className="text-xs font-bold text-primary-dark uppercase tracking-wide">Powered by M-TAI</p>
                <p className="text-[11px] text-gray-600 mt-1">Tanzania's trusted marketplace</p>
            </div>
        </div>
    );
}
