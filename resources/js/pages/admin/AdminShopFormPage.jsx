import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import ActionBar from '../../components/casfeta/ActionBar';
import LocationFields from '../../components/casfeta/LocationFields';
import { Store, Tag, Phone, MapPin, FileText, Save, User } from 'lucide-react';

export default function AdminShopFormPage() {
    const { id } = useParams();
    const isNew = id === 'new' || id === undefined;
    const navigate = useNavigate();
    const [form, setForm] = useState({ name: '', business_type: '', description: '', phone: '', location: '', user_id: '', region: '', district: '', ward: '' });
    const [owners, setOwners] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(!isNew);
    const [successModal, setSuccessModal] = useState(false);

    useEffect(() => {
        api.get('/admin/users', { params: { role: 'business_owner', per_page: 100 } })
            .then(res => setOwners(res.data?.data || []))
            .catch((error) => console.error('Failed to fetch owners:', error));
    }, []);

    useEffect(() => {
        if (isNew) { setLoading(false); return; }
        api.get(`/admin/businesses/${id}`).then(res => {
            const s = res.data;
            setForm({ name: s.name || s.business_name || '', business_type: s.business_type || s.type || '', description: s.description || '', phone: s.phone || '', location: s.location || '', user_id: s.user_id || '', region: s.region || '', district: s.district || '', ward: s.ward || '' });
        }).catch((error) => { console.error('Failed to fetch shop:', error); navigate('/admin/shops'); }).finally(() => setLoading(false));
    }, [id, isNew, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        try {
            const payload = {
                business_name: form.name,
                business_type: form.business_type,
                business_category: form.business_type,
                region: form.region,
                district: form.district,
                user_id: form.user_id,
            };
            if (isNew) {
                await api.post('/admin/businesses', payload);
            } else {
                await api.put(`/admin/businesses/${id}`, payload);
            }
            setSuccessModal(true);
            setTimeout(() => navigate('/admin/shops'), 1500);
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data?.errors || {});
        } finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;

    return (
        <div className="pb-24">
            <PageHeader
                title={isNew ? 'Add Shop' : 'Edit Shop'}
                subtitle={isNew ? 'Register a new business' : 'Update business information'}
                backTo="/admin/shops"
                icon={<Store className="w-5 h-5" />}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader
                    icon={<Store className="w-5 h-5" />}
                    title="Business Details"
                    subtitle={isNew ? 'Enter the shop information below' : 'Update the shop information below'}
                />

                <form onSubmit={handleSubmit}>
                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {isNew && (
                                <FormField label="Owner" required icon={<User className="w-4 h-4" />} error={errors.user_id?.[0]} full>
                                    <select name="user_id" value={form.user_id} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                                        <option value="">-- Select Owner --</option>
                                        {owners.map(owner => (
                                            <option key={owner.id} value={owner.id}>{owner.name || owner.email} ({owner.phone || owner.email})</option>
                                        ))}
                                    </select>
                                </FormField>
                            )}

                            <FormField label="Business Name" required icon={<Store className="w-4 h-4" />} error={errors.business_name?.[0]} full>
                                <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" placeholder="e.g. M-TAI Shop" />
                            </FormField>

                            <FormField label="Type" icon={<Tag className="w-4 h-4" />} error={errors.business_type?.[0]}>
                                <select name="business_type" value={form.business_type} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                                    <option value="">-- Select Type --</option>
                                    <option value="shop">Shop</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="pharmacy">Pharmacy</option>
                                    <option value="supermarket">Supermarket</option>
                                </select>
                            </FormField>

                            <FormField label="Phone" icon={<Phone className="w-4 h-4" />}>
                                <input type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" placeholder="e.g. +255 712 345 678" />
                            </FormField>

                            <div className="md:col-span-2">
                                <LocationFields
                                    value={{ region: form.region, district: form.district, ward: form.ward }}
                                    onChange={(loc) => setForm(prev => ({ ...prev, ...loc, location: loc.region ? `${loc.region}${loc.district ? ', ' + loc.district : ''}` : prev.location }))}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all"
                                />
                            </div>

                            <FormField label="Location / Street" icon={<MapPin className="w-4 h-4" />}>
                                <input type="text" name="location" value={form.location || form.region} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" placeholder="e.g. Market Street, Dar es Salaam" />
                            </FormField>

                            <FormField label="Description" icon={<FileText className="w-4 h-4" />} full>
                                <textarea name="description" value={form.description} onChange={handleChange} rows={3} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all resize-none" placeholder="Brief description of the business" />
                            </FormField>
                        </div>
                    </div>

                    <ActionBar
                        onCancel={() => navigate('/admin/shops')}
                        onCancelLabel="Cancel"
                        onSubmit={handleSubmit}
                        onSubmitLabel={isNew ? 'Create Shop' : 'Update Shop'}
                        loading={submitting}
                        accent
                    />
                </form>
            </div>

            <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Success" size="sm">
                <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-gray-700 font-medium">{isNew ? 'Shop created successfully' : 'Shop updated successfully'}</p>
                </div>
            </Modal>
        </div>
    );
}