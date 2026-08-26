import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import { ShoppingCart, Save, CheckCircle, CreditCard } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import ActionBar from '../../components/casfeta/ActionBar';

export default function AdminOrderFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form, setForm] = useState({ status: '', payment_status: '' });
    const [orderCode, setOrderCode] = useState('');
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [successModal, setSuccessModal] = useState(false);

    useEffect(() => {
        api.get(`/admin/orders/${id}`).then(res => {
            const o = res.data;
            setForm({ status: o.status || 'pending', payment_status: o.payment_status || 'pending' });
            setOrderCode(o.transaction_code || o.code || '');
        }).catch((error) => { console.error('Failed to fetch order:', error); navigate('/admin/orders'); }).finally(() => setLoading(false));
    }, [id, navigate]);

    const handleChange = (e) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setErrors({});
        try {
            await api.put(`/admin/orders/${id}`, form);
            setSuccessModal(true);
            setTimeout(() => navigate('/admin/orders'), 1500);
        } catch (err) {
            if (err.response?.status === 422) setErrors(err.response.data?.errors || {});
        } finally { setSubmitting(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;

    return (
        <div className="space-y-6 pb-24">
            <PageHeader
                title="Edit Order"
                subtitle={orderCode}
                backTo="/admin/orders"
                icon={<ShoppingCart size={20} />}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                    <SectionHeader icon={<ShoppingCart size={18} />} title="Order Status" subtitle="Update order and payment status" />
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Order Status" required icon={<CheckCircle size={16} />} full>
                                <select name="status" value={form.status} onChange={handleChange} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                                    <option value="pending">Pending</option>
                                    <option value="confirmed">Confirmed</option>
                                    <option value="completed">Completed</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                                {errors.status && <p className="mt-1.5 text-sm text-red-600">{errors.status[0]}</p>}
                            </FormField>

                            <FormField label="Payment Status" required icon={<CreditCard size={16} />} full>
                                <select name="payment_status" value={form.payment_status} onChange={handleChange} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                                    <option value="pending">Pending</option>
                                    <option value="paid">Paid</option>
                                    <option value="partial">Partial</option>
                                    <option value="failed">Failed</option>
                                    <option value="refunded">Refunded</option>
                                </select>
                                {errors.payment_status && <p className="mt-1.5 text-sm text-red-600">{errors.payment_status[0]}</p>}
                            </FormField>
                        </div>
                    </div>

                    <ActionBar
                        onCancel={() => navigate('/admin/orders')}
                        onCancelLabel="Cancel"
                        onSubmit={() => {}}
                        onSubmitLabel="Update Order"
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
                    <p className="text-gray-700 font-medium">Order updated successfully</p>
                </div>
            </Modal>
        </div>
    );
}
