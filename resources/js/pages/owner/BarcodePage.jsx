import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import EmptyState from '../../components/casfeta/EmptyState';
import ActionBar from '../../components/casfeta/ActionBar';
import { ScanBarcode, Package, ShoppingCart, Download } from 'lucide-react';

export default function BarcodePage() {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState('');
    const [orderId, setOrderId] = useState('');
    const [barcode, setBarcode] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        api.get('/owner/businesses', { params: { per_page: 200 } })
            .then(res => setBusinesses(res.data?.data || res.data || []))
            .catch(() => setBusinesses([]));
    }, []);

    useEffect(() => {
        if (!selectedBusiness) return;
        api.get(`/owner/businesses/${selectedBusiness}/products`, { params: { per_page: 200 } })
            .then(res => setProducts(res.data?.data || res.data || []))
            .catch(() => setProducts([]));
    }, [selectedBusiness]);

    const handleGenerateProductBarcode = async () => {
        if (!selectedBusiness || !selectedProduct) return;
        setLoading(true); setError(''); setBarcode(null);
        try { const res = await api.get(`/owner/businesses/${selectedBusiness}/products/${selectedProduct}/barcode`); setBarcode(res.data); }
        catch { setError('Failed to generate barcode'); }
        finally { setLoading(false); }
    };

    const handleGenerateOrderBarcodes = async () => {
        if (!orderId) return;
        setLoading(true); setError(''); setBarcode(null);
        try { const res = await api.post('/owner/barcodes/order', { order_id: orderId }); setBarcode(res.data); }
        catch { setError('Failed to generate order barcodes'); }
        finally { setLoading(false); }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Barcode Generator" subtitle="Generate and print barcodes for products and orders." icon={<ScanBarcode size={20} />} />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Business</label>
                <select value={selectedBusiness} onChange={(e) => { setSelectedBusiness(e.target.value); setBarcode(null); setSelectedProduct(''); setOrderId(''); }}
                    className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                    <option value="">-- Select Business --</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.business_name || b.name}</option>)}
                </select>
            </div>

            {!selectedBusiness ? (
                <EmptyState title="Select a business" description="Choose a business to start generating barcodes." />
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <SectionHeader icon={<Package size={18} />} title="Product Barcode" />
                            <div className="space-y-4">
                                <FormField label="Select Product" icon={<Package size={16} />}>
                                    <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                        <option value="">-- Select Product --</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </FormField>
                                <button onClick={handleGenerateProductBarcode} disabled={!selectedProduct || loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md disabled:opacity-50">
                                    <ScanBarcode size={16} /> {loading ? 'Generating...' : 'Generate Barcode'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <SectionHeader icon={<ShoppingCart size={18} />} title="Order Barcodes" />
                            <div className="space-y-4">
                                <FormField label="Order Number" icon={<ShoppingCart size={16} />}>
                                    <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Enter order number" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                                </FormField>
                                <button onClick={handleGenerateOrderBarcodes} disabled={!orderId || loading} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md disabled:opacity-50">
                                    <ScanBarcode size={16} /> {loading ? 'Generating...' : 'Generate Order Barcodes'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 border-l-4 border-l-red-500">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {loading && (
                        <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
                        </div>
                    )}

                    {barcode && !loading && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 text-center">
                            <SectionHeader icon={<ScanBarcode size={18} />} title="Barcode Generated" />
                            {barcode.barcode_image || barcode.image ? (
                                <img src={barcode.barcode_image || barcode.image} alt="Barcode" className="mx-auto max-w-md mt-4" />
                            ) : barcode.barcodes ? (
                                <div className="space-y-3 mt-4">
                                    {barcode.barcodes.map((b, i) => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                            <span className="text-sm font-medium text-gray-700">{b.product_name || b.name || `Product ${i + 1}`}</span>
                                            {b.barcode_image || b.image ? <img src={b.barcode_image || b.image} alt="Barcode" className="h-12" /> : <span className="text-xs text-gray-500 font-mono">{b.code || b.barcode}</span>}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded-xl overflow-auto text-left mt-4">{JSON.stringify(barcode, null, 2)}</pre>
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
