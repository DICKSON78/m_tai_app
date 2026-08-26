import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import { Megaphone, Edit, Trash2, Type, Users, Activity, Calendar, MessageSquare } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';
import HeroBanner from '../../components/casfeta/HeroBanner';
import InfoCard from '../../components/casfeta/InfoCard';
import DataItem from '../../components/casfeta/DataItem';

const TARGET_ROLE_BADGES = {
    all: { label: 'All Users', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700' },
    business_owner: { label: 'Owners', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700' },
    customer: { label: 'Customers', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700' },
    driver: { label: 'Drivers', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700' },
    employee: { label: 'Employees', className: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700' },
};

export default function AdminAnnouncementShowPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [item, setItem] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successModal, setSuccessModal] = useState(false);

    useEffect(() => {
        api.get(`/admin/announcements/${id}`).then(res => setItem(res.data)).catch((error) => { console.error('Failed to fetch announcement:', error); navigate('/admin/announcements'); }).finally(() => setLoading(false));
    }, [id, navigate]);

    const handleDelete = async () => {
        try {
            await api.delete(`/admin/announcements/${id}`);
            setSuccessModal(true);
            setTimeout(() => navigate('/admin/announcements'), 1500);
        } catch (error) { console.error('Failed to delete announcement:', error); setConfirmOpen(false); alert(error?.response?.data?.message || 'Failed to delete announcement. Please try again.'); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;
    if (!item) return null;

    const target = TARGET_ROLE_BADGES[item.target_role] || TARGET_ROLE_BADGES.all;

    return (
        <div className="space-y-6">
            <PageHeader
                title={item.title}
                subtitle="Announcement Details"
                backTo="/admin/announcements"
                icon={<Megaphone size={20} />}
                actions={
                    <div className="flex gap-2">
                        <Link to={`/admin/announcements/${id}/edit`} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#00D4AA] hover:bg-[#00B894] text-white rounded-lg text-sm font-medium transition-all"><Edit size={15} /> Edit</Link>
                        <button onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"><Trash2 size={15} /> Delete</button>
                    </div>
                }
            />

            <HeroBanner
                icon={<Megaphone size={36} />}
                name={item.title}
                subtitle={item.message?.substring(0, 100)}
                status={item.is_active ? 'Active' : 'Inactive'}
                statusColor={item.is_active ? 'bg-green-500' : 'bg-gray-400'}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <InfoCard icon={<Type size={18} />} title="Content" subtitle="Announcement content details">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DataItem label="Title" value={item.title} icon={<Type size={14} />} />
                            <DataItem label="Target Audience" value={target.label} icon={<Users size={14} />} />
                            <DataItem label="Status" value={item.is_active ? 'Active' : 'Inactive'} icon={<Activity size={14} />} />
                            <DataItem label="Created" value={item.created_at ? new Date(item.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'} icon={<Calendar size={14} />} />
                        </div>
                        <div className="mt-6">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2"><MessageSquare size={14} /> Message</h4>
                            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap">{item.message}</div>
                        </div>
                    </InfoCard>
                </div>
                <div />
            </div>

            <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete Announcement" message={`Are you sure you want to delete "${item.title}"? This action cannot be undone.`} confirmText="Delete" cancelText="Cancel" variant="danger" />
            <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Success" size="sm">
                <div className="text-center py-4"><div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-3"><svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div><p className="text-gray-700 font-medium">Announcement deleted successfully</p></div>
            </Modal>
        </div>
    );
}
