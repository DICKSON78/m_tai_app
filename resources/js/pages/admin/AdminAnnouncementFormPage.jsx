import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { Megaphone, Save, Type, MessageSquare, Users } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import ActionBar from '../../components/casfeta/ActionBar';

const TARGET_ROLE_OPTIONS = [
    { value: 'all', label: 'All Users' },
    { value: 'business_owner', label: 'Owners' },
    { value: 'customer', label: 'Customers' },
    { value: 'driver', label: 'Drivers' },
    { value: 'employee', label: 'Employees' },
];

const emptyForm = { title: '', message: '', target_role: 'all', is_active: true };

export default function AdminAnnouncementFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [successModal, setSuccessModal] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api.get(`/admin/announcements/${id}`).then(res => {
                const a = res.data;
                setForm({ title: a.title || '', message: a.message || '', target_role: a.target_role || 'all', is_active: a.is_active ?? true });
            }).catch((error) => { console.error('Failed to fetch announcement:', error); navigate('/admin/announcements'); }).finally(() => setLoading(false));
        }
    }, [id, isEdit, navigate]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        try {
            if (isEdit) { await api.put(`/admin/announcements/${id}`, form); }
            else { await api.post('/admin/announcements', form); }
            setSuccessModal(true);
            setTimeout(() => navigate('/admin/announcements'), 1500);
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data?.errors || {});
        } finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;

    return (
        <div className="space-y-6 pb-24">
            <PageHeader
                title={isEdit ? 'Edit Announcement' : 'New Announcement'}
                subtitle={isEdit ? 'Update announcement details' : 'Create a platform-wide announcement'}
                backTo="/admin/announcements"
                icon={<Megaphone size={20} />}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <SectionHeader icon={<Megaphone size={18} />} title="Announcement Content" subtitle={isEdit ? 'Update the announcement details' : 'Write your announcement'} />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Title" required icon={<Type size={16} />} full>
                                <input type="text" name="title" value={form.title} onChange={handleChange} required className={`w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm ${errors.title ? 'border-red-500' : ''}`} placeholder="e.g. New Platform Update" />
                                {errors.title && <p className="mt-1.5 text-sm text-red-600">{errors.title[0]}</p>}
                            </FormField>

                            <FormField label="Message" required icon={<MessageSquare size={16} />} full>
                                <textarea name="message" value={form.message} onChange={handleChange} rows={5} required className={`w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm resize-none ${errors.message ? 'border-red-500' : ''}`} placeholder="Write the announcement message..." />
                                {errors.message && <p className="mt-1.5 text-sm text-red-600">{errors.message[0]}</p>}
                            </FormField>

                            <FormField label="Target Audience" icon={<Users size={16} />}>
                                <select name="target_role" value={form.target_role} onChange={handleChange} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                                    {TARGET_ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </FormField>

                            <FormField label="Status">
                                <div className="flex items-center h-[48px] px-4 border border-gray-300 rounded-lg bg-white">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" name="is_active" checked={form.is_active} onChange={handleChange} className="sr-only peer" />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#00D4AA] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00D4AA]"></div>
                                        <span className="ml-3 text-sm font-medium text-gray-700">{form.is_active ? 'Active' : 'Inactive'}</span>
                                    </label>
                                </div>
                            </FormField>
                        </div>
                    </div>

                    <ActionBar
                        onCancel={() => navigate('/admin/announcements')}
                        onCancelLabel="Cancel"
                        onSubmit={() => {}}
                        onSubmitLabel={isEdit ? 'Update' : 'Create'}
                        loading={submitting}
                        accent
                    />
                </form>
            </div>

            <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Success" size="sm">
                <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-gray-700 font-medium">Announcement {isEdit ? 'updated' : 'created'} successfully</p>
                </div>
            </Modal>
        </div>
    );
}
