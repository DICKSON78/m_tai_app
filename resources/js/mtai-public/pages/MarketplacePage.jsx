import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

export default function MarketplacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async (search = '') => {
    setLoading(true);
    try {
      const params = { page: 1, per_page: 12 };
      if (search) params.search = search;
      const [pres, sres] = await Promise.all([
        api.get('/public/products', { params }),
        api.get('/public/shops/search', { params: search ? { q: search, page: 1, per_page: 6 } : { page: 1, per_page: 6 } }),
      ]);
      setProducts(pres.data.data || []);
      setShops(sres.data.data || []);
    } catch (e) {
      console.error('Marketplace load failed:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(''); }, [fetchAll]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchAll(query.trim());
  };

  return (
    <>
      <section className="bg-[#0A140C] py-24 lg:py-28 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#00D4AA]/10 rounded-full blur-[120px]" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-4">{t('navbar.marketplace')}</h1>
          <p className="text-white/50 mb-8">{t('navbar.view_only')}</p>
          <form onSubmit={handleSearch} className="max-w-xl mx-auto">
            <div className="flex items-center bg-white rounded-full overflow-hidden shadow-xl">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t('common.search_products')}
                className="flex-1 px-5 py-3 text-gray-800 outline-none text-sm"
              />
              <button type="submit" className="bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] font-bold px-6 py-3 text-sm">
                {t('common.search')}
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="py-14 bg-gray-50 min-h-[50vh]">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4AA]"></div>
            </div>
          ) : products.length === 0 && shops.length === 0 ? (
            <p className="text-center text-gray-500 py-16">{t('table.no_data')}</p>
          ) : (
            <>
              {shops.length > 0 && (
                <>
                  <h2 className="text-lg font-bold text-gray-800 mb-4">{t('shop.shops')}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
                    {shops.map((shop) => (
                      <div
                        key={shop.id}
                        onClick={() => navigate(`/marketplace/${shop.id}`)}
                        className="bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer hover:shadow-lg transition"
                      >
                        <h3 className="font-bold text-gray-800 truncate">{shop.business_name}</h3>
                        <p className="text-sm text-gray-500 mb-2">{shop.code} · {shop.products_count ?? 0} products</p>
                        <span className="text-[#00B894] font-medium text-sm">{t('navbar.view_shop')} →</span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              <h2 className="text-lg font-bold text-gray-800 mb-4">{t('shop.products')}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
                {products.map((p) => (
                  <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition">
                    <div className="aspect-square bg-gray-100">
                      {p.image || p.image_url || p.images?.[0]?.url ? (
                        <img
                          src={p.image_url || (p.image ? `/storage/${p.image}` : p.images?.[0]?.url)}
                          alt={p.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : null}
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-gray-500 truncate">{p.business?.business_name || ''}</p>
                      <h3 className="font-semibold text-gray-800 line-clamp-1 text-sm">{p.name}</h3>
                      <p className="text-base font-bold text-[#00B894] my-2">TZS {Number(p.selling_price || 0).toLocaleString()}</p>
                      <Link
                        to="/register"
                        className="block text-center w-full py-2 bg-[#0A140C] text-white text-xs font-bold rounded-full hover:bg-black transition"
                      >
                        {t('navbar.create_account_to_buy')}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
