import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import ConfirmDialog from '../../components/ConfirmDialog';
import Modal from '../../components/Modal';
import PageHeader from '../../components/casfeta/PageHeader';
import HeroBanner from '../../components/casfeta/HeroBanner';
import InfoCard from '../../components/casfeta/InfoCard';
import DataItem from '../../components/casfeta/DataItem';
import StatBox from '../../components/casfeta/StatBox';
import { Users, Pencil, Trash2, Phone, Hash, Shield, Calendar, Mail, Building, ShoppingCart, User } from 'lucide-react';

const ROLE_BADGES = {
    admin: { label: 'Admin', className: 'badge badge-red' },
    business_owner: { label: 'Owner', className: 'badge badge-green' },
    customer: { label: 'Customer', className: 'badge badge-blue' },
    driver: { label: 'Driver', className: 'badge badge-purple' },
    employee: { label: 'Employee', className: 'badge badge-yellow' },
};

export default function AdminUserShowPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [successModal, setSuccessModal] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    useEffect(() => {
        api.get(`/admin/users/${id}`).then(res => setUser(res.data)).catch((error) => { console.error('Failed to fetch user:', error); navigate('/admin/customers'); }).finally(() => setLoading(false));
    }, [id]);

    const handleDelete = async () => {
        try {
            await api.delete(`/admin/users/${id}`);
            setSuccessMsg('User deleted successfully');
            setSuccessModal(true);
            setTimeout(() => navigate('/admin/customers'), 1500);
        } catch (error) { console.error('Failed to delete user:', error); setConfirmOpen(false); alert(error?.response?.data?.message || 'Failed to delete user. Please try again.'); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;
    if (!user) return null;

    const role = ROLE_BADGES[user.role] || ROLE_BADGES.customer;

    return (
        <div>
            <PageHeader
                title="User Details"
                subtitle={user.name}
                backTo="/admin/customers"
                icon={<Users className="w-5 h-5" />}
                actions={
                    <div className="flex gap-2">
                        <Link to={`/admin/customers/${id}/edit`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm">
                            <Pencil className="w-4 h-4" /> Edit
                        </Link>
                        <button onClick={() => setConfirmOpen(true)} className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 font-medium rounded-lg hover:bg-red-100 transition-all duration-200 text-sm">
                            <Trash2 className="w-4 h-4" /> Delete
                        </button>
                    </div>
                }
            />

            <HeroBanner
                icon={<User className="w-10 h-10" />}
                name={user.name}
                subtitle={user.email}
                status={role.label}
                statusColor="bg-white/20"
            />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
                <StatBox label="Orders" value={user.orders_count ?? 0} icon={<ShoppingCart className="w-4 h-4" />} color="text-blue-600" />
                <StatBox label="Businesses" value={user.businesses_count ?? 0} icon={<Building className="w-4 h-4" />} color="text-[#00D4AA]" />
                <StatBox label="Role" value={role.label} icon={<Shield className="w-4 h-4" />} color="text-purple-600" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <InfoCard icon={<Users className="w-5 h-5" />} title="User Information" subtitle="Personal and account details">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DataItem icon={<Mail className="w-4 h-4" />} label="Email" value={user.email || '-'} />
                            <DataItem icon={<Phone className="w-4 h-4" />} label="Phone" value={user.phone || '-'} />
                            <DataItem icon={<Hash className="w-4 h-4" />} label="Code" value={user.code || '-'} mono />
                            <DataItem icon={<Shield className="w-4 h-4" />} label="Role" value={role.label} />
                            <DataItem icon={<Calendar className="w-4 h-4" />} label="Created" value={user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} />
                        </div>
                    </InfoCard>
                </div>

                <div>
                    <InfoCard icon={<Shield className="w-5 h-5" />} title="Quick Stats" subtitle="Account metrics" accent>
                        <div className="space-y-3">
                            <StatBox label="Total Orders" value={user.orders_count ?? 0} icon={<ShoppingCart className="w-4 h-4" />} color="text-blue-600" />
                            <StatBox label="Businesses" value={user.businesses_count ?? 0} icon={<Building className="w-4 h-4" />} color="text-[#00D4AA]" />
                            <StatBox label="Account Role" value={role.label} icon={<Shield className="w-4 h-4" />} color="text-purple-600" />
                        </div>
                    </InfoCard>
                </div>
            </div>

            <ConfirmDialog isOpen={confirmOpen} onClose={() => setConfirmOpen(false)} onConfirm={handleDelete} title="Delete User" message="Are you sure you want to delete this user? This action cannot be undone." confirmText="Delete" cancelText="Cancel" variant="danger" />
            <Modal isOpen={successModal} onClose={() => setSuccessModal(false)} title="Success" size="sm">
                <div className="text-center py-4">
                    <div className="w-16 h-16 rounded-full bg-[#00D4AA]/10 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-8 h-8 text-[#00D4AA]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <p className="text-gray-700 font-medium">{successMsg}</p>
                </div>
            </Modal>
        </div>
    );
}
