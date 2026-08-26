import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/casfeta/PageHeader';
import HeroBanner from '../../components/casfeta/HeroBanner';
import DataItem from '../../components/casfeta/DataItem';
import SummaryBox from '../../components/casfeta/SummaryBox';
import EmptyState from '../../components/casfeta/EmptyState';
import { Package, Edit, Trash2, EyeOff, DollarSign, Tag, Hash, Calendar, Clock } from 'lucide-react';

export default function ProductDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [toggling, setToggling] = useState(false);

    const [stockAction, setStockAction] = useState('add');
    const [stockQty, setStockQty] = useState('');
    const [stockLoading, setStockLoading] = useState(false);

    const fetchProduct = async () => {
        try {
            const res = await api.get(`/owner/products/${id}`);
            setProduct(res.data?.data || res.data);
        } catch (error) { console.error('Failed to fetch product:', error); } finally {
        }
    };

    useEffect(() => {
        fetchProduct();
    }, [id]);

    const handleDelete = async () => {
        try {
            await api.delete(`/owner/products/${id}`);
            navigate('/owner/products');
        } catch (error) { console.error('Failed to delete product:', error); alert(error?.response?.data?.message || 'Failed to delete product. Please try again.'); }

    const handleTogglePublish = async () => {
        if (toggling) return;
        setToggling(true);
        try {
            await api.post(`/owner/products/${id}/toggle-publish`);
            fetchProduct();
        } catch (error) { console.error('Failed to toggle publish:', error); alert(error?.response?.data?.message || 'Failed to update product. Please try again.'); } finally {
        }
    };

    const handleStockAdjust = async () => {
        const qty = parseInt(stockQty, 10);
        if (!qty || qty <= 0) return;
        setStockLoading(true);
        try {
            await api.post(`/owner/products/${id}/stock`, {
                quantity: stockAction === 'add' ? qty : -qty,
            });
            setStockQty('');
            fetchProduct();
        } catch (error) { console.error('Failed to adjust stock:', error); alert(error?.response?.data?.message || 'Failed to adjust stock. Please try again.'); } finally {
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
            </div>
        );
    }

    if (!product) {
        return (
            <EmptyState
                title="Product not found"
                description="The product you're looking for doesn't exist or has been removed."
                actionTo="/owner/products"
                actionLabel="Back to Products"
            />
        );
    }

    const qty = Number(product.quantity || 0);
    const threshold = Number(product.low_stock_threshold || 5);
    let stockBadgeColor = 'text-[#00D4AA]';
    if (qty <= 0) stockBadgeColor = 'text-red-500';
    else if (qty <= threshold) stockBadgeColor = 'text-orange-500';
    else if (qty <= threshold * 3) stockBadgeColor = 'text-yellow-500';

    const isPublished = product.status === 'published';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Product Details"
                subtitle={product.name}
                icon={<Package size={22} />}
                backTo="/owner/products"
                actions={
                    <>
                        <button
                            onClick={() => navigate(`/owner/products/${id}/edit`)}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm"
                        >
                            <Edit size={16} />
                            Edit
                        </button>
                    </>
                }
            />

            <HeroBanner
                icon={<Package size={36} />}
                name={product.name}
                subtitle={product.description || 'No description available.'}
                status={isPublished ? 'Published' : 'Draft'}
                statusColor={isPublished ? 'bg-green-500' : 'bg-yellow-500'}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><Package size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Product Overview</h3>
                                    <p className="text-xs text-gray-500">Basic product information</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row gap-6">
                                <div className="w-full sm:w-48 h-48 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {product.image ? (
                                        <img
                                            src={product.image_url || `/storage/${product.image}`}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                                            <Package size={48} />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <DataItem
                                            label="Category"
                                            value={product.category?.name || '-'}
                                            icon={<Tag size={14} />}
                                        />
                                        <DataItem
                                            label="Status"
                                            value={isPublished ? 'Published' : 'Draft'}
                                            icon={<EyeOff size={14} />}
                                        />
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <p className="text-xs text-gray-500 mb-1">Description</p>
                                        <p className="text-sm text-gray-700">
                                            {product.description || 'No description available.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><DollarSign size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Pricing</h3>
                                    <p className="text-xs text-gray-500">Product price information</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <DataItem
                                    label="Buying Price"
                                    value={`TZS ${Number(product.buying_price || 0).toLocaleString()}`}
                                    icon={<DollarSign size={14} />}
                                />
                                <DataItem
                                    label="Selling Price"
                                    value={`TZS ${Number(product.selling_price || 0).toLocaleString()}`}
                                    icon={<DollarSign size={14} />}
                                    mono
                                />
                                <DataItem
                                    label="Wholesale Price"
                                    value={product.wholesale_price ? `TZS ${Number(product.wholesale_price).toLocaleString()}` : '-'}
                                    icon={<DollarSign size={14} />}
                                />
                                <DataItem
                                    label="Retail Price"
                                    value={product.retail_price ? `TZS ${Number(product.retail_price).toLocaleString()}` : '-'}
                                    icon={<DollarSign size={14} />}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-[#00D4AA]/10 rounded-lg flex items-center justify-center shrink-0">
                                    <span className="text-[#00D4AA]"><Hash size={18} /></span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Stock</h3>
                                    <p className="text-xs text-gray-500">Inventory management</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <SummaryBox
                                icon={<Hash size={16} />}
                                label="Current Stock"
                                value={`${qty} ${product.unit || 'pcs'}`}
                                color={stockBadgeColor}
                            />

                            <div className="mt-4 grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Low Stock Threshold</p>
                                    <p className="text-sm font-semibold text-gray-900">{threshold}</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3">
                                    <p className="text-xs text-gray-500">Reorder Qty</p>
                                    <p className="text-sm font-semibold text-gray-900">{product.reorder_quantity || 0}</p>
                                </div>
                                {product.sku && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">SKU</p>
                                        <p className="text-sm font-semibold text-gray-900 font-mono">{product.sku}</p>
                                    </div>
                                )}
                                {product.barcode && (
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <p className="text-xs text-gray-500">Barcode</p>
                                        <p className="text-sm font-semibold text-gray-900 font-mono">{product.barcode}</p>
                                    </div>
                                )}
                                {product.location && (
                                    <div className="bg-gray-50 rounded-lg p-3 col-span-2">
                                        <p className="text-xs text-gray-500">Location</p>
                                        <p className="text-sm font-semibold text-gray-900">{product.location}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4 space-y-3">
                                <div className="flex rounded-lg border border-gray-200 overflow-hidden">
                                    <button
                                        onClick={() => setStockAction('add')}
                                        className={`flex-1 px-3 py-2.5 text-sm font-medium transition ${
                                            stockAction === 'add'
                                                ? 'bg-[#00D4AA] text-white'
                                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        Add
                                    </button>
                                    <button
                                        onClick={() => setStockAction('remove')}
                                        className={`flex-1 px-3 py-2.5 text-sm font-medium transition ${
                                            stockAction === 'remove'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-white text-gray-600 hover:bg-gray-50'
                                        }`}
                                    >
                                        Subtract
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <input
                                        type="number"
                                        value={stockQty}
                                        onChange={(e) => setStockQty(e.target.value)}
                                        placeholder="Quantity"
                                        min="1"
                                        className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]"
                                    />
                                    <button
                                        onClick={handleStockAdjust}
                                        disabled={stockLoading || !stockQty || parseInt(stockQty, 10) <= 0}
                                        className={`px-4 py-2.5 rounded-lg text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg ${
                                            stockAction === 'add'
                                                ? 'bg-[#00D4AA] hover:bg-[#00B894]'
                                                : 'bg-red-500 hover:bg-red-600'
                                        }`}
                                    >
                                        {stockLoading ? (
                                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                            </svg>
                                        ) : 'Update'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-[#00D4AA]/10 rounded-lg flex items-center justify-center shrink-0">
                                    <span className="text-[#00D4AA]"><Edit size={18} /></span>
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Actions</h3>
                                    <p className="text-xs text-gray-500">Manage this product</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            <button
                                onClick={() => navigate(`/owner/products/${id}/edit`)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm"
                            >
                                <Edit size={16} />
                                Edit Product
                            </button>
                            <button
                                onClick={handleTogglePublish}
                                disabled={toggling}
                                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-50 shadow-md hover:shadow-lg ${
                                    isPublished
                                        ? 'bg-yellow-500 text-white hover:bg-yellow-600'
                                        : 'bg-gradient-to-r from-[#00D4AA] to-[#00B894] text-white hover:from-[#00B894] hover:to-[#009e80]'
                                }`}
                            >
                                {toggling ? (
                                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                ) : (
                                    <EyeOff size={16} />
                                )}
                                {isPublished ? 'Unpublish' : 'Publish'}
                            </button>
                            <button
                                onClick={() => setDeleteModalOpen(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 font-bold rounded-lg hover:bg-red-100 transition-all duration-200 text-sm border border-red-200"
                            >
                                <Trash2 size={16} />
                                Delete Product
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><Clock size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Additional Details</h3>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                {product.unit && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Package size={14} className="text-gray-400" />
                                            <span className="text-sm text-gray-500">Unit</span>
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900">{product.unit}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="text-gray-400" />
                                        <span className="text-sm text-gray-500">Created</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{product.created_at ? new Date(product.created_at).toLocaleDateString('en-US') : '-'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Clock size={14} className="text-gray-400" />
                                        <span className="text-sm text-gray-500">Last Updated</span>
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900">{product.updated_at ? new Date(product.updated_at).toLocaleDateString('en-US') : '-'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="Delete Product"
                message="Are you sure you want to delete this product? This action cannot be undone."
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
