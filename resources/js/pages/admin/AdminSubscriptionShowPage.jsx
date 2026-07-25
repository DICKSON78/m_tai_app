import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import { CreditCard, Edit, Trash2, Store, Tag, DollarSign, Activity, Calendar, Clock, User } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';
import HeroBanner from '../../components/casfeta/HeroBanner';
import InfoCard from '../../components/casfeta/InfoCard';
import DataItem from '../../components/casfeta/DataItem';

const STATUS_MAP = {
    active: { label: 'Active' },
    expired: { label: 'Expired' },
    pending: { label: 'Pending' },
};
const PLAN_MAP = {
    daily: { label: 'Daily' },
    monthly: { label: 'Monthly' },
    quarterly: { label: 'Quarterly' },
    yearly: { label: 'Yearly' },
};

export default function AdminSubscriptionShowPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [sub, setSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    useEffect(() => {
        api.get(`/admin/subscriptions/${id}`).then(res => setSub(res.data)).catch(() => navigate('/admin/subscriptions')).finally(() => setLoading(false));
    }, [id, navigate]);

    const handleDelete = async () => {
        try {
            await api.delete(`/admin/subscriptions/${id}`);
            setSuccessModal(true);
            setTimeout(() => navigate('/admin/subscriptions'), 1500);
        } catch { setConfirmOpen(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;
    if (!sub) return null;

    const status = STATUS_MAP[sub.status] || STATUS_MAP.pending;
    const plan = PLAN_MAP[sub.plan] || PLAN_MAP.monthly;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Subscription Details"
                subtitle={sub.business?.business_name || sub.business?.name || 'Unknown business'}
                backTo="/admin/subscriptions"
                icon={<CreditCard size={20} />}
                actions={
                    <div className="flex gap-2">
                        <Link to={`/admin/subscriptions/${id}/edit`} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#00D4AA] hover:bg-[#00B894] text-white rounded-lg text-sm font-medium transition-all"><Edit size={15} /> Edit</Link>
                        <button onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"><Trash2 size={15} /> Delete</button>
                    </div>
                }
            />

            <HeroBanner
                icon={<CreditCard size={36} />}
                name={sub.business?.business_name || sub.business?.name || 'Subscription'}
                subtitle={`${plan.label} plan - TZS ${Number(sub.amount || 0).toLocaleString()}`}
                status={status.label}
                statusColor={sub.status === 'active' ? 'bg-green-500' : sub.status === 'expired' ? 'bg-red-500' : 'bg-yellow-500'}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <InfoCard icon={<Store size={18} />} title="Subscription Information" subtitle="Basic subscription details">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DataItem label="Business" value={sub.business?.business_name || sub.business?.name || '-'} icon={<Store size={14} />} />
                            <DataItem label="Plan" value={plan.label} icon={<Tag size={14} />} />
                            <DataItem label="Amount" value={`TZS ${Number(sub.amount || 0).toLocaleString()}`} icon={<DollarSign size={14} />} />
                            <DataItem label="Status" value={status.label} icon={<Activity size={14} />} />
                        </div>
                    </InfoCard>
                </div>

                <div className="space-y-6">
                    <InfoCard icon={<Calendar size={18} />} title="Dates" subtitle="Subscription timeline">
                        <div className="space-y-4">
                            <DataItem label="Start Date" value={sub.start_date ? new Date(sub.start_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} icon={<Calendar size={14} />} />
                            <DataItem label="End Date" value={sub.end_date ? new Date(sub.end_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} icon={<Clock size={14} />} />
                            <DataItem label="Created" value={sub.created_at ? new Date(sub.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} icon={<Calendar size={14} />} />
                        </div>
                        {sub.user && (
                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Created By</h4>
                                <div className="space-y-4">
                                    <DataItem label="Name" value={sub.user.name || '-'} icon={<User size={14} />} />
                                    <DataItem label="Email" value={sub.user.email || '-'} icon={<User size={14} />} />
                                </div>
                            </div>
                        )}
                    </InfoCard>
                </div>
            </div>

            <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Subscription" message="Are you sure you want to delete this subscription? This action cannot be undone." confirmText="Delete" cancelText="Cancel" variant="danger" />
            <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Success" size="sm">
                <div className="text-center py-4"><div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3"><svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><p className="text-gray-700 font-medium">Subscription deleted successfully</p></div>
            </Modal>
        </div>
    );
}
