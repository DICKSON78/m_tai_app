import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { CreditCard, Save, Store, Tag, DollarSign, Activity } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import ActionBar from '../../components/casfeta/ActionBar';

export default function AdminSubscriptionFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [form, setForm] = useState({ business_id: '', plan: 'monthly', amount: '', status: 'active' });
    const [businesses, setBusinesses] = useState([]);
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(isEdit);
    const [successModal, setSuccessModal] = useState(false);

    useEffect(() => {
        api.get('/admin/businesses', { params: { per_page: 200 } }).then(res => setBusinesses(res.data?.data || res.data || [])).catch((error) => { console.error('Failed to fetch businesses:', error); });
    }, []);

    useEffect(() => {
        if (isEdit) {
            api.get(`/admin/subscriptions/${id}`).then(res => {
                const s = res.data;
                setForm({ business_id: s.business_id || '', plan: s.plan || 'monthly', amount: s.amount || '', status: s.status || 'active' });
            }).catch((error) => { console.error('Failed to fetch subscription:', error); navigate('/admin/subscriptions'); }).finally(() => setLoading(false));
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
            if (isEdit) { await api.put(`/admin/subscriptions/${id}`, { status: form.status }); }
            else { await api.post('/admin/subscriptions', { ...form, amount: Number(form.amount), business_id: Number(form.business_id) }); }
            setSuccessModal(true);
            setTimeout(() => navigate('/admin/subscriptions'), 1500);
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data?.errors || {});
        } finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;

    return (
        <div className="space-y-6 pb-24">
            <PageHeader
                title={isEdit ? 'Edit Subscription' : 'New Subscription'}
                subtitle={isEdit ? 'Update subscription details' : 'Create a new business subscription'}
                backTo="/admin/subscriptions"
                icon={<CreditCard size={20} />}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <SectionHeader icon={<CreditCard size={18} />} title={isEdit ? 'Subscription Details' : 'New Subscription'} subtitle={isEdit ? 'Update the subscription status' : 'Fill in the subscription details'} />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {!isEdit && (
                                <FormField label="Business" required icon={<Store size={16} />} full>
                                    <select name="business_id" value={form.business_id} onChange={handleChange} required className={`w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm ${errors.business_id ? 'border-red-500' : ''}`}>
                                        <option value="">-- Select Business --</option>
                                        {businesses.map(b => <option key={b.id} value={b.id}>{b.business_name || b.name}</option>)}
                                    </select>
                                    {errors.business_id && <p className="mt-1.5 text-sm text-red-600">{errors.business_id[0]}</p>}
                                </FormField>
                            )}

                            {!isEdit && (
                                <FormField label="Plan" required icon={<Tag size={16} />}>
                                    <select name="plan" value={form.plan} onChange={handleChange} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                                        <option value="daily">Daily</option>
                                        <option value="monthly">Monthly</option>
                                        <option value="quarterly">Quarterly</option>
                                        <option value="yearly">Yearly</option>
                                    </select>
                                </FormField>
                            )}

                            {!isEdit && (
                                <FormField label="Amount (TZS)" required icon={<DollarSign size={16} />}>
                                    <input type="number" min="0" name="amount" value={form.amount} onChange={handleChange} required className={`w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm ${errors.amount ? 'border-red-500' : ''}`} placeholder="e.g. 50000" />
                                    {errors.amount && <p className="mt-1.5 text-sm text-red-600">{errors.amount[0]}</p>}
                                </FormField>
                            )}

                            {isEdit && (
                                <FormField label="Status" required icon={<Activity size={16} />} full>
                                    <select name="status" value={form.status} onChange={handleChange} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                                        <option value="active">Active</option>
                                        <option value="pending">Pending</option>
                                        <option value="expired">Expired</option>
                                    </select>
                                </FormField>
                            )}
                        </div>
                    </div>

                    <ActionBar
                        onCancel={() => navigate('/admin/subscriptions')}
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
                    <p className="text-gray-700 font-medium">Subscription {isEdit ? 'updated' : 'created'} successfully</p>
                </div>
            </Modal>
        </div>
    );
}
