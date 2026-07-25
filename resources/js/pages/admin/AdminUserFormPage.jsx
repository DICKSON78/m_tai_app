import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import ActionBar from '../../components/casfeta/ActionBar';
import { UserPlus, User, Mail, Phone, Shield, Lock } from 'lucide-react';

const ROLES = [
    { value: 'customer', label: 'Customer' },
    { value: 'business_owner', label: 'Business Owner' },
    { value: 'driver', label: 'Driver' },
    { value: 'employee', label: 'Employee' },
    { value: 'admin', label: 'Admin' },
];

export default function AdminUserFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState({ name: '', email: '', phone: '', role: 'customer', password: '' });
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [successModal, setSuccessModal] = useState(false);

    useEffect(() => {
        if (isEdit) {
            api.get(`/admin/users/${id}`).then(res => {
                const u = res.data;
                setForm({ name: u.name || '', email: u.email || '', phone: u.phone || '', role: u.role || 'customer', password: '' });
            }).catch(() => navigate('/admin/customers')).finally(() => setLoading(false));
        }
    }, [id, isEdit, navigate]);

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
            const payload = { ...form };
            if (isEdit && !payload.password) delete payload.password;
            if (isEdit) { await api.put(`/admin/users/${id}`, payload); }
            else { await api.post('/admin/users', payload); }
            setSuccessModal(true);
            setTimeout(() => navigate('/admin/customers'), 1500);
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data?.errors || {});
        } finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;

    return (
        <div className="pb-24">
            <PageHeader
                title={isEdit ? 'Edit User' : 'Create User'}
                subtitle={isEdit ? 'Update user information' : 'Add a new user to the platform'}
                backTo="/admin/customers"
                icon={<UserPlus className="w-5 h-5" />}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <SectionHeader
                    icon={<User className="w-5 h-5" />}
                    title="User Information"
                    subtitle="Fill in the user details below"
                />

                <form onSubmit={handleSubmit}>
                    <div className="px-6 pb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Full Name" required icon={<User className="w-4 h-4" />} error={errors.name?.[0]} full>
                                <input type="text" name="name" value={form.name} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" placeholder="e.g. John Doe" />
                            </FormField>

                            <FormField label="Email" required icon={<Mail className="w-4 h-4" />} error={errors.email?.[0]}>
                                <input type="email" name="email" value={form.email} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" placeholder="e.g. john@example.com" />
                            </FormField>

                            <FormField label="Phone" icon={<Phone className="w-4 h-4" />}>
                                <input type="text" name="phone" value={form.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" placeholder="e.g. +255 712 345 678" />
                            </FormField>

                            <FormField label="Role" required icon={<Shield className="w-4 h-4" />} error={errors.role?.[0]}>
                                <select name="role" value={form.role} onChange={handleChange} required className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                                    {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                </select>
                            </FormField>

                            <FormField label={isEdit ? 'New Password (leave blank to keep current)' : 'Password'} required={!isEdit} icon={<Lock className="w-4 h-4" />} error={errors.password?.[0]} full>
                                <input type="password" name="password" value={form.password} onChange={handleChange} required={!isEdit} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" placeholder={isEdit ? '••••••••' : 'Enter password'} />
                            </FormField>
                        </div>
                    </div>

                    <ActionBar
                        onCancel={() => navigate('/admin/customers')}
                        onCancelLabel="Cancel"
                        onSubmit={handleSubmit}
                        onSubmitLabel={isEdit ? 'Update User' : 'Create User'}
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
                    <p className="text-gray-700 font-medium">User {isEdit ? 'updated' : 'created'} successfully</p>
                </div>
            </Modal>
        </div>
    );
}
