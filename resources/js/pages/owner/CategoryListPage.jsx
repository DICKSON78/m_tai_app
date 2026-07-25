import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Tags, Plus, ChevronRight, Pencil, Trash2, FolderTree, Search, Package, Filter, RotateCcw } from 'lucide-react';

const emptyForm = { name: '', description: '', parent_id: '' };

export default function CategoryListPage() {
    document.title = 'Categories - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [businessId, setBusinessId] = useState('');
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [businessesLoading, setBusinessesLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [expanded, setExpanded] = useState({});

    useEffect(() => {
        setBusinessesLoading(true);
        api.get('/owner/businesses')
            .then(res => {
                const list = res.data?.data || res.data || [];
                setBusinesses(list);
                if (list.length === 1) {
                    setBusinessId(String(list[0].id));
                }
            })
            .catch(() => setBusinesses([]))
            .finally(() => setBusinessesLoading(false));
    }, []);

    const fetchCategories = useCallback(() => {
        if (!businessId) {
            setCategories([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        api.get(`/owner/businesses/${businessId}/categories`)
            .then(res => {
                setCategories(res.data?.data || res.data || []);
            })
            .catch(() => setCategories([]))
            .finally(() => setLoading(false));
    }, [businessId]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const parentCategories = categories.filter(c => !c.parent_id);
    const childMap = categories.reduce((acc, c) => {
        if (c.parent_id) {
            if (!acc[c.parent_id]) acc[c.parent_id] = [];
            acc[c.parent_id].push(c);
        }
        return acc;
    }, {});

    const toggleExpand = (id) => {
        setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const availableParents = categories.filter(c => !c.parent_id && (!editing || c.id !== editing.id));

    const openCreate = () => {
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
        setModalOpen(true);
    };

    const openEdit = (cat) => {
        setEditing(cat);
        setForm({
            name: cat.name || '',
            description: cat.description || '',
            parent_id: cat.parent_id ? String(cat.parent_id) : '',
        });
        setErrors({});
        setModalOpen(true);
    };

    const closeModal = () => {
        setModalOpen(false);
        setEditing(null);
        setForm(emptyForm);
        setErrors({});
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        const payload = {
            name: form.name,
            description: form.description,
            parent_id: form.parent_id || null,
        };
        try {
            if (editing) {
                await api.put(`/owner/categories/${editing.id}`, payload);
            } else {
                await api.post(`/owner/businesses/${businessId}/categories`, payload);
            }
            closeModal();
            fetchCategories();
        } catch (err) {
            if (err.response?.status === 422) {
                setErrors(err.response.data?.errors || {});
            }
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = (cat) => {
        setDeleting(cat);
        setConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!deleting) return;
        try {
            await api.delete(`/owner/categories/${deleting.id}`);
            setConfirmOpen(false);
            setDeleting(null);
            fetchCategories();
        } catch {}
    };

    const productCount = (cat) => cat.products_count ?? cat.products?.length ?? 0;

    return (
        <div className="space-y-0">
            <div className="flex items-center justify-end mb-6">
                {businessId && (
                    <button
                        onClick={openCreate}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}
                    >
                        <Plus size={16} /> <span className="hidden sm:inline">Add New</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4">
                    <Filter size={14} className="text-[#00D4AA] mr-2" /> Search Resources
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <select
                            value={businessId}
                            onChange={(e) => setBusinessId(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm"
                        >
                            <option value="">Select Business</option>
                            {businesses.map(b => (
                                <option key={b.id} value={b.id}>{b.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setBusinessId('')}
                            className="px-4 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30"
                        >
                            <RotateCcw size={12} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {!businessId ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center">
                        <Tags size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">Select a business to view categories</p>
                    </div>
                </div>
            ) : loading ? (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 animate-pulse">
                            <div className="h-4 bg-gray-200 rounded w-8" />
                            <div className="h-4 bg-gray-200 rounded w-1/4" />
                            <div className="h-4 bg-gray-200 rounded w-1/3" />
                            <div className="h-4 bg-gray-200 rounded w-16 ml-auto" />
                        </div>
                    ))}
                </div>
            ) : categories.length === 0 ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center">
                        <Tags size={40} className="mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500">No data available</p>
                    </div>
                </div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Category List ({categories.length} total)</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider w-10"></th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Description</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-center">Products</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {parentCategories.map(cat => (
                                    <React.Fragment key={cat.id}>
                                        <tr className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <button
                                                    onClick={() => toggleExpand(cat.id)}
                                                    className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all"
                                                >
                                                    <ChevronRight
                                                        size={16}
                                                        className={`transition-transform ${expanded[cat.id] ? 'rotate-90' : ''}`}
                                                    />
                                                </button>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] flex items-center justify-center text-xs font-bold uppercase">
                                                        <Tags size={14} />
                                                    </div>
                                                    <span className="font-semibold text-gray-900">{cat.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="text-sm text-gray-500 line-clamp-1">{cat.description || '-'}</span>
                                            </td>
                                            <td className="px-6 py-3 text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00B894]">
                                                    {productCount(cat)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => openEdit(cat)}
                                                        className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all"
                                                        title="Edit"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete(cat)}
                                                        className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>

                                        {expanded[cat.id] && (childMap[cat.id] || []).map(child => (
                                            <tr
                                                key={child.id}
                                                className="border-b border-gray-50 bg-gray-50/30 hover:bg-gray-100/50 transition"
                                            >
                                                <td className="px-6 py-3 pl-14">
                                                    <ChevronRight size={14} className="text-gray-300 -rotate-45" />
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3 pl-4">
                                                        <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center text-xs font-bold uppercase">
                                                            <FolderTree size={12} />
                                                        </div>
                                                        <span className="text-sm font-medium text-gray-700">{child.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <span className="text-sm text-gray-500 line-clamp-1">{child.description || '-'}</span>
                                                </td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                        {productCount(child)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => openEdit(child)}
                                                            className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all"
                                                            title="Edit"
                                                        >
                                                            <Pencil size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => confirmDelete(child)}
                                                            className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all"
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}

                                        {expanded[cat.id] && (!childMap[cat.id] || childMap[cat.id].length === 0) && (
                                            <tr className="border-b border-gray-50 bg-gray-50/30">
                                                <td colSpan={5} className="px-6 py-3 pl-20">
                                                    <p className="text-sm text-gray-400 italic">No subcategories.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <Modal
                isOpen={modalOpen}
                onClose={closeModal}
                title={editing ? 'Edit Category' : 'Add New Category'}
            >
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Category Name <span className="text-red-500">*</span></label>
                        <input
                            type="text"
                            name="name"
                            value={form.name}
                            onChange={handleChange}
                            required
                            className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all ${errors.name ? 'border-red-500' : ''}`}
                            placeholder="Enter category name"
                        />
                        {errors.name && <p className="mt-1.5 text-sm text-red-600">{errors.name[0]}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Parent Category</label>
                        <select
                            name="parent_id"
                            value={form.parent_id}
                            onChange={handleChange}
                            className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all"
                        >
                            <option value="">No Parent (Top Level)</option>
                            {availableParents.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                        <textarea
                            name="description"
                            value={form.description}
                            onChange={handleChange}
                            rows={3}
                            className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all resize-none ${errors.description ? 'border-red-500' : ''}`}
                            placeholder="Enter category description (optional)"
                        />
                        {errors.description && <p className="mt-1.5 text-sm text-red-600">{errors.description[0]}</p>}
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={closeModal} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={submitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">
                            {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Category'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog
                isOpen={confirmOpen}
                onClose={() => { setConfirmOpen(false); setDeleting(null); }}
                onConfirm={handleDelete}
                title="Delete Category"
                message={`Are you sure you want to delete category "${deleting?.name}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                variant="danger"
            />
        </div>
    );
}
