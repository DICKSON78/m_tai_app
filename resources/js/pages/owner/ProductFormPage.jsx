import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import ActionBar from '../../components/casfeta/ActionBar';
import { Package, FileText, Image as ImageIcon, DollarSign, Hash, Tag, Video, Building2, Upload, AlertTriangle, RotateCcw, ScanLine, MapPin } from 'lucide-react';

export default function ProductFormPage() {
    const navigate = useNavigate();
    const { businessId, id } = useParams();
    const isEdit = Boolean(id);

    const [loading, setLoading] = useState(isEdit);
    const [submitting, setSubmitting] = useState(false);
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState(businessId || '');
    const [categories, setCategories] = useState([]);

    const [form, setForm] = useState({
        name: '',
        description: '',
        category_id: '',
        image: null,
        video_url: '',
        buying_price: '',
        selling_price: '',
        wholesale_price: '',
        retail_price: '',
        quantity: '',
        unit: 'pcs',
        sku: '',
        barcode: '',
        low_stock_threshold: '5',
        reorder_quantity: '10',
        is_track_stock: true,
        location: '',
    });

    const [imagePreview, setImagePreview] = useState(null);
    const [errors, setErrors] = useState({});

    const units = [
        { value: 'pcs', label: 'Pieces' },
        { value: 'kg', label: 'Kilograms' },
        { value: 'litre', label: 'Liters' },
        { value: 'metre', label: 'Meters' },
        { value: 'box', label: 'Boxes' },
        { value: 'packet', label: 'Packs' },
    ];

    const inputClasses = "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 outline-none transition-all duration-200 focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]";

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (!selectedBusiness && biz.length === 1) {
                setSelectedBusiness(biz[0].id);
            }
        }).catch(() => setBusinesses([]));
    }, []);

    useEffect(() => {
        if (selectedBusiness) {
            api.get(`/owner/businesses/${selectedBusiness}/categories`).then(res => {
                setCategories(res.data?.data || res.data || []);
            }).catch(() => setCategories([]));
        }
    }, [selectedBusiness]);

    useEffect(() => {
        if (isEdit && id) {
            api.get(`/owner/products/${id}`).then(res => {
                const p = res.data?.data || res.data;
                if (p) {
                    setForm({
                        name: p.name || '',
                        description: p.description || '',
                        category_id: p.category_id || '',
                        image: null,
                        video_url: p.video_url || '',
                        buying_price: p.buying_price || '',
                        selling_price: p.selling_price || '',
                        wholesale_price: p.wholesale_price || '',
                        retail_price: p.retail_price || '',
                        quantity: p.quantity || '',
                        unit: p.unit || 'pcs',
                        sku: p.sku || '',
                        barcode: p.barcode || '',
                        low_stock_threshold: p.low_stock_threshold || '5',
                        reorder_quantity: p.reorder_quantity || '10',
                        is_track_stock: p.is_track_stock !== false,
                        location: p.location || '',
                    });
                    if (p.image_url || p.image) {
                        setImagePreview(p.image_url || `/storage/${p.image}`);
                    }
                    if (p.business_id) {
                        setSelectedBusiness(String(p.business_id));
                    }
                }
            }).catch(() => {
            }).finally(() => setLoading(false));
        }
    }, [isEdit, id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(prev => ({ ...prev, image: file }));
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setForm(prev => ({ ...prev, image: null }));
        setImagePreview(null);
    };

    const buildFormData = (status) => {
        const fd = new FormData();
        fd.append('name', form.name);
        fd.append('description', form.description);
        fd.append('category_id', form.category_id);
        fd.append('video_url', form.video_url);
        fd.append('buying_price', form.buying_price);
        fd.append('selling_price', form.selling_price);
        fd.append('wholesale_price', form.wholesale_price);
        fd.append('retail_price', form.retail_price);
        fd.append('quantity', form.quantity);
        fd.append('unit', form.unit);
        fd.append('sku', form.sku);
        fd.append('barcode', form.barcode);
        fd.append('low_stock_threshold', form.low_stock_threshold);
        fd.append('reorder_quantity', form.reorder_quantity);
        fd.append('is_track_stock', form.is_track_stock ? '1' : '0');
        fd.append('location', form.location);
        fd.append('status', status);
        if (form.image) {
            fd.append('image', form.image);
        }
        fd.append('_method', isEdit ? 'PUT' : 'POST');
        return fd;
    };

    const handleSubmit = async (status) => {
        setSubmitting(true);
        setErrors({});
        try {
            const fd = buildFormData(status);
            if (isEdit) {
                await api.post(`/owner/products/${id}`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            } else {
                await api.post(`/owner/businesses/${selectedBusiness}/products`, fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
            }
            navigate('/owner/products');
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data?.errors || {});
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
            </div>
        );
    }

    return (
        <div className="pb-24">
            <PageHeader
                title={isEdit ? 'Edit Product' : 'Add New Product'}
                subtitle={isEdit ? 'Update product information' : 'Fill in the details to create or update your product.'}
                icon={<Package size={22} />}
                backTo="/owner/products"
            />

            <form onSubmit={(e) => e.preventDefault()}>
                {!isEdit && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <SectionHeader
                                icon={<Building2 size={18} />}
                                title="Business"
                                subtitle="Select the business for this product"
                            />
                        </div>
                        <div className="px-6 pb-6">
                            <FormField
                                label="Business"
                                required
                                icon={<Building2 size={16} />}
                                error={errors.business_id?.[0]}
                            >
                                <select
                                    value={selectedBusiness}
                                    onChange={(e) => setSelectedBusiness(e.target.value)}
                                    className={`${inputClasses} ${errors.business_id ? 'border-red-500' : ''}`}
                                >
                                    <option value="">-- Select Business --</option>
                                    {businesses.map((biz) => (
                                        <option key={biz.id} value={biz.id}>{biz.name}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>
                    </div>
                )}

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <SectionHeader
                            icon={<FileText size={18} />}
                            title="Product Information"
                            subtitle="Basic details about the product"
                        />
                    </div>
                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                label="Product Name"
                                required
                                icon={<Package size={16} />}
                                error={errors.name?.[0]}
                                full
                            >
                                <input
                                    type="text"
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="Enter product name"
                                    className={`${inputClasses} ${errors.name ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Description"
                                icon={<FileText size={16} />}
                                error={errors.description?.[0]}
                                full
                            >
                                <textarea
                                    name="description"
                                    value={form.description}
                                    onChange={handleChange}
                                    rows={3}
                                    placeholder="Product description..."
                                    className={`${inputClasses} resize-none ${errors.description ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Category"
                                required
                                icon={<Tag size={16} />}
                                error={errors.category_id?.[0]}
                                full
                            >
                                <select
                                    name="category_id"
                                    value={form.category_id}
                                    onChange={handleChange}
                                    className={`${inputClasses} ${errors.category_id ? 'border-red-500' : ''}`}
                                >
                                    <option value="">-- Select Category --</option>
                                    {categories.map((cat) => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))}
                                </select>
                            </FormField>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <SectionHeader
                            icon={<ImageIcon size={18} />}
                            title="Image / Video"
                            subtitle="Upload product image or add video link"
                        />
                    </div>
                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                label="Product Image"
                                icon={<ImageIcon size={16} />}
                                error={errors.image?.[0]}
                                full
                            >
                                {imagePreview ? (
                                    <div className="relative inline-block">
                                        <img
                                            src={imagePreview}
                                            alt="Preview"
                                            className="w-40 h-40 object-cover rounded-lg border border-gray-200"
                                        />
                                        <button
                                            type="button"
                                            onClick={removeImage}
                                            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-40 h-40 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#00D4AA] hover:bg-[#00D4AA]/5 transition">
                                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                        <span className="text-xs text-gray-500">Click to upload</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </FormField>

                            <FormField
                                label="Video URL"
                                icon={<Video size={16} />}
                                error={errors.video_url?.[0]}
                                full
                            >
                                <input
                                    type="url"
                                    name="video_url"
                                    value={form.video_url}
                                    onChange={handleChange}
                                    placeholder="https://youtube.com/watch?v=..."
                                    className={`${inputClasses} ${errors.video_url ? 'border-red-500' : ''}`}
                                />
                            </FormField>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <SectionHeader
                            icon={<DollarSign size={18} />}
                            title="Pricing"
                            subtitle="Set buying and selling prices"
                        />
                    </div>
                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                label="Buying Price"
                                required
                                icon={<DollarSign size={16} />}
                                error={errors.buying_price?.[0]}
                            >
                                <input
                                    type="number"
                                    name="buying_price"
                                    value={form.buying_price}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className={`${inputClasses} ${errors.buying_price ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Selling Price"
                                required
                                icon={<DollarSign size={16} />}
                                error={errors.selling_price?.[0]}
                            >
                                <input
                                    type="number"
                                    name="selling_price"
                                    value={form.selling_price}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className={`${inputClasses} ${errors.selling_price ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Wholesale Price"
                                icon={<DollarSign size={16} />}
                                error={errors.wholesale_price?.[0]}
                            >
                                <input
                                    type="number"
                                    name="wholesale_price"
                                    value={form.wholesale_price}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className={`${inputClasses} ${errors.wholesale_price ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Retail Price"
                                icon={<DollarSign size={16} />}
                                error={errors.retail_price?.[0]}
                            >
                                <input
                                    type="number"
                                    name="retail_price"
                                    value={form.retail_price}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className={`${inputClasses} ${errors.retail_price ? 'border-red-500' : ''}`}
                                />
                            </FormField>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <SectionHeader
                            icon={<Hash size={18} />}
                            title="Stock & Inventory"
                            subtitle="Manage inventory quantity, reorder levels and tracking"
                        />
                    </div>
                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                                label="Quantity"
                                required
                                icon={<Hash size={16} />}
                                error={errors.quantity?.[0]}
                            >
                                <input
                                    type="number"
                                    name="quantity"
                                    value={form.quantity}
                                    onChange={handleChange}
                                    placeholder="0"
                                    min="0"
                                    className={`${inputClasses} ${errors.quantity ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Unit"
                                required
                                icon={<Package size={16} />}
                                error={errors.unit?.[0]}
                            >
                                <select
                                    name="unit"
                                    value={form.unit}
                                    onChange={handleChange}
                                    className={`${inputClasses} ${errors.unit ? 'border-red-500' : ''}`}
                                >
                                    {units.map((u) => (
                                        <option key={u.value} value={u.value}>{u.label}</option>
                                    ))}
                                </select>
                            </FormField>

                            <FormField
                                label="Low Stock Threshold"
                                icon={<AlertTriangle size={16} />}
                                error={errors.low_stock_threshold?.[0]}
                            >
                                <input
                                    type="number"
                                    name="low_stock_threshold"
                                    value={form.low_stock_threshold}
                                    onChange={handleChange}
                                    placeholder="5"
                                    min="0"
                                    className={`${inputClasses} ${errors.low_stock_threshold ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Reorder Quantity"
                                icon={<RotateCcw size={16} />}
                                error={errors.reorder_quantity?.[0]}
                            >
                                <input
                                    type="number"
                                    name="reorder_quantity"
                                    value={form.reorder_quantity}
                                    onChange={handleChange}
                                    placeholder="10"
                                    min="0"
                                    className={`${inputClasses} ${errors.reorder_quantity ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="SKU"
                                icon={<Hash size={16} />}
                                error={errors.sku?.[0]}
                            >
                                <input
                                    type="text"
                                    name="sku"
                                    value={form.sku}
                                    onChange={handleChange}
                                    placeholder="e.g. SKU-ABC123"
                                    className={`${inputClasses} ${errors.sku ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Barcode"
                                icon={<ScanLine size={16} />}
                                error={errors.barcode?.[0]}
                            >
                                <input
                                    type="text"
                                    name="barcode"
                                    value={form.barcode}
                                    onChange={handleChange}
                                    placeholder="e.g. 6000000000000"
                                    className={`${inputClasses} ${errors.barcode ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Storage Location"
                                icon={<MapPin size={16} />}
                                error={errors.location?.[0]}
                            >
                                <input
                                    type="text"
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="e.g. Warehouse A"
                                    className={`${inputClasses} ${errors.location ? 'border-red-500' : ''}`}
                                />
                            </FormField>

                            <FormField
                                label="Track Stock"
                                icon={<Package size={16} />}
                                error={errors.is_track_stock?.[0]}
                            >
                                <select
                                    name="is_track_stock"
                                    value={form.is_track_stock}
                                    onChange={(e) => setForm({ ...form, is_track_stock: e.target.value === 'true' })}
                                    className={inputClasses}
                                >
                                    <option value="true">Yes — track inventory</option>
                                    <option value="false">No — service / non-stock</option>
                                </select>
                            </FormField>
                        </div>
                    </div>
                </div>

                <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                    <Link
                        to="/owner/products"
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 text-sm"
                    >
                        Cancel
                    </Link>
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => handleSubmit('draft')}
                            disabled={submitting}
                            className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {submitting && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
                            )}
                            <span>Save as Draft</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSubmit('published')}
                            disabled={submitting}
                            className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-gradient-to-r from-[#00D4AA] to-[#00B894] hover:from-[#00B894] hover:to-[#009e80]"
                        >
                            {submitting && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            <span>{isEdit ? 'Update' : 'Publish'}</span>
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
