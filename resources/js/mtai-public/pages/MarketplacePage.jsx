import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { Store } from 'lucide-react';

export default function MarketplacePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const fetchShops = useCallback(async (searchQuery = '') => {
    setLoading(true);
    try {
      const params = { page: 1, per_page: 12 };
      if (searchQuery) params.q = searchQuery;
      const res = await api.get('/public/shops/search', { params });
      const data = res.data;
      setShops(data.data || []);
      setTotalResults(data.total || 0);
    } catch (e) {
      console.error('Failed to search shops:', e);
      setShops([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setHasSearched(true);
    fetchShops(query.trim());
  };

  React.useEffect(() => { fetchShops(''); setHasSearched(true); }, [fetchShops]);

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

      <section className="py-14 bg-gray-50 min-h-[40vh]">
        <div className="max-w-7xl mx-auto px-6">
          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4AA]"></div>
            </div>
          ) : shops.length === 0 ? (
            <div className="text-center py-16">
              <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">{t('table.no_data')}</p>
            </div>
          ) : (
            <>
              {hasSearched && totalResults > 0 && (
                <p className="text-sm text-gray-500 mb-6">{totalResults} shops</p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop) => (
                  <div
                    key={shop.id}
                    onClick={() => navigate(`/marketplace/${shop.id}`)}
                    className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:shadow-lg transition group"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0 font-bold text-[#00B894] text-lg">
                        {shop.logo ? (
                          <img src={shop.logo_url || `/storage/${shop.logo}`} alt={shop.business_name} className="w-12 h-12 rounded-xl object-cover" />
                        ) : (shop.business_name?.charAt(0)?.toUpperCase())}
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-800 truncate group-hover:text-[#00B894]">{shop.business_name}</h3>
                        <p className="text-sm text-gray-500">{shop.code}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                      <span className="text-[#00B894] font-medium text-sm">{t('navbar.view_shop')} →</span>
                      <Link to="/register" onClick={(e) => e.stopPropagation()} className="text-xs text-gray-500 hover:text-gray-800 underline">
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
