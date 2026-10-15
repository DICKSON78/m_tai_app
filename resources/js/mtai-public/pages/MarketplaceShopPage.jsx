import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function MarketplaceShopPage() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/public/shops/${id}`);
        setShop(res.data.data || res.data);
        const pres = await api.get(`/public/shops/${id}/products`, { params: { page: 1, per_page: 12 } });
        setProducts(pres.data.data || []);
      } catch (e) {
        console.error(e);
        setShop(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const handleBuy = useCallback(async (product) => {
    if (!user) {
      navigate('/register', { state: { from: `/marketplace/${id}`, message: t('navbar.create_account_to_buy') } });
      return;
    }
    try {
      await api.post('/cart', { product_id: product.id, quantity: 1 });
      setToast(t('shop.add_to_cart'));
      setTimeout(() => setToast(null), 2500);
    } catch (e) {
      navigate('/register');
    }
  }, [user, navigate, id, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4AA]"></div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="py-32 text-center">
        <p className="text-gray-500 mb-6">{t('table.no_data')}</p>
        <Link to="/marketplace" className="px-6 py-3 bg-[#0A140C] text-white rounded-full text-sm font-bold">{t('navbar.marketplace')}</Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-[60vh]">
      {toast && (
        <div className="fixed top-20 right-4 z-50 bg-[#0A140C] text-white px-6 py-3 rounded-xl shadow-lg text-sm">{toast}</div>
      )}
      <section className="bg-[#0A140C] py-16">
        <div className="max-w-7xl mx-auto px-6">
          <Link to="/marketplace" className="text-white/50 text-sm hover:text-white">← {t('navbar.marketplace')}</Link>
          <h1 className="text-3xl font-black text-white mt-2">{shop.business_name}</h1>
          <p className="text-white/50 text-sm mt-1">{shop.code} · {t('navbar.view_only')}</p>
          {!user && (
            <Link to="/register" className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-[#0A140C] text-sm font-bold rounded-full">
              {t('navbar.create_account_to_buy')}
            </Link>
          )}
        </div>
      </section>
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="aspect-square bg-gray-100">
                {p.image ? (
                  <img src={p.image_url || `/storage/${p.image}`} alt={p.name} className="w-full h-full object-cover" loading="lazy" />
                ) : null}
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800 line-clamp-1">{p.name}</h3>
                <p className="text-lg font-bold text-[#00B894] my-2">TZS {Number(p.selling_price || 0).toLocaleString()}</p>
                <button onClick={() => handleBuy(p)} className="w-full py-2.5 bg-[#0A140C] text-white text-sm font-bold rounded-full hover:bg-black transition">
                  {user ? t('shop.add_to_cart') : t('navbar.create_account_to_buy')}
                </button>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && <p className="text-center text-gray-500 py-16">{t('table.no_data')}</p>}
      </section>
    </div>
  );
}
