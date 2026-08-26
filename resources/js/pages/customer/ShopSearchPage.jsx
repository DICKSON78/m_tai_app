import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/casfeta/PageHeader';
import { Store } from 'lucide-react';

export default function ShopSearchPage() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [shops, setShops] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totalResults, setTotalResults] = useState(0);
    const [hasSearched, setHasSearched] = useState(false);

    const fetchShops = useCallback(async (page = 1, searchQuery = '') => {
        setLoading(true);
        try {
            const params = { page, per_page: 12 };
            if (searchQuery) params.q = searchQuery;

            const res = await api.get('/shops/search', { params });
            const data = res.data;
            setShops(data.data || []);
            setCurrentPage(data.current_page || 1);
            setLastPage(data.last_page || 1);
            setTotalResults(data.total || 0);
        } catch (error) { console.error('Failed to search shops:', error); setShops([]); setLastPage(1); } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const q = searchParams.get('q');
        if (q) {
            setQuery(q);
            setHasSearched(true);
            fetchShops(1, q);
        }
    }, [searchParams, fetchShops]);

    const handleSearch = (e) => {
        e.preventDefault();
        const trimmed = query.trim();
        setHasSearched(true);
        setCurrentPage(1);
        if (trimmed) {
            setSearchParams({ q: trimmed });
        } else {
            setSearchParams({});
        }
        fetchShops(1, trimmed);
    };

    const handlePageChange = (page) => {
        setCurrentPage(page);
        const q = searchParams.get('q') || '';
        fetchShops(page, q);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const formatLocation = (shop) => {
        const parts = [shop.district, shop.region].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : shop.location || 'Unknown';
    };

    return (
        <div>
            <div className="px-4 sm:px-6 lg:px-8 pt-8 pb-2">
                <PageHeader title="Shops" subtitle="Browse and search available shops" icon={<Store size={20} />} />
            </div>
            <div style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }} className="rounded-2xl p-8 overflow-hidden mx-4 mt-4">
                <div className="py-4 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Search Shops</h1>
                    <p className="text-white/70 text-lg mb-8">
                        Search shops by name or code
                    </p>

                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
                        <div className="flex items-center bg-white rounded-2xl overflow-hidden shadow-lg">
                            <div className="pl-4 text-gray-400">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Enter shop name or code..."
                                className="flex-1 px-4 py-4 text-gray-800 text-lg outline-none"
                            />
                            <button
                                type="submit"
                                className="btn-primary rounded-none rounded-r-2xl"
                            >
                                Search
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="px-4 sm:px-6 lg:px-8 py-8">
                {hasSearched && !loading && (
                    <p className="text-sm text-gray-500 mb-6">
                        {totalResults > 0
                            ? `Found ${totalResults} shop${totalResults !== 1 ? 's' : ''}`
                            : 'No shops found'}
                    </p>
                )}

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                    </div>
                ) : !hasSearched ? (
                    <div className="card empty-state">
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">Start Searching</h2>
                        <p className="text-gray-500">
                            Enter a shop name or code in the search box above to find the shop you want.
                        </p>
                    </div>
                ) : shops.length === 0 ? (
                    <div className="card empty-state">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-800 mb-2">No shops found</h2>
                        <p className="text-gray-500 mb-6">
                            Try again with a different name or code.
                        </p>
                        <button
                            onClick={() => { setQuery(''); setHasSearched(false); setSearchParams({}); }}
                            className="btn-primary"
                        >
                            Clear Search
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {shops.map((shop) => (
                                <div
                                    key={shop.id}
                                    onClick={() => navigate(`/customer/shops/${shop.id}`)}
                                    className="stat-card cursor-pointer group"
                                >
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition">
                                                {shop.logo ? (
                                                    <img
                                                        src={shop.logo_url || `/storage/${shop.logo}`}
                                                        alt={shop.business_name}
                                                        className="w-12 h-12 rounded-xl object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-primary font-bold text-lg">
                                                        {shop.business_name?.charAt(0)?.toUpperCase()}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="font-bold text-gray-800 truncate group-hover:text-primary transition">
                                                    {shop.business_name}
                                                </h3>
                                                <p className="text-sm text-gray-500">{shop.code}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <span className="badge badge-green">
                                            {shop.business_category || shop.business_type || 'Business'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-lg font-bold text-gray-800">{shop.products_count ?? 0}</p>
                                            <p className="text-xs text-gray-500">Products</p>
                                        </div>
                                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                                            <p className="text-sm font-semibold text-gray-700 mt-1">
                                                {formatLocation(shop)}
                                            </p>
                                            <p className="text-xs text-gray-500">Location</p>
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-gray-100 flex items-center justify-center">
                                        <span className="text-primary font-medium text-sm group-hover:underline">
                                            View Shop →
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            lastPage={lastPage}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
}
