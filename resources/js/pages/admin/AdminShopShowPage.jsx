import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import PageHeader from '../../components/casfeta/PageHeader';
import HeroBanner from '../../components/casfeta/HeroBanner';
import InfoCard from '../../components/casfeta/InfoCard';
import DataItem from '../../components/casfeta/DataItem';
import StatBox from '../../components/casfeta/StatBox';
import { Store, Edit, Pencil, User, Hash, Tag, Calendar, MapPin, Phone, Package } from 'lucide-react';

const TYPE_BADGES = { shop: 'badge badge-green', restaurant: 'badge badge-blue', pharmacy: 'badge badge-purple', supermarket: 'badge badge-yellow' };

export default function AdminShopShowPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/admin/businesses/${id}`).then(res => setShop(res.data)).catch((error) => { console.error('Failed to fetch shop:', error); navigate('/admin/shops'); }).finally(() => setLoading(false));
    }, [id, navigate]);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;
    if (!shop) return null;

    const type = shop.business_type || shop.type || '-';
    const typeBadge = TYPE_BADGES[type?.toLowerCase()] || 'badge badge-gray';

    return (
        <div>
            <PageHeader
                title="Shop Details"
                subtitle={shop.name || shop.business_name}
                backTo="/admin/shops"
                icon={<Store className="w-5 h-5" />}
                actions={
                    <Link to={`/admin/shops/${id}/edit`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-white font-medium rounded-lg hover:bg-[#00B894] transition-all duration-200 text-sm shadow-md">
                        <Pencil className="w-4 h-4" /> Edit Shop
                    </Link>
                }
            />

            <HeroBanner
                icon={<Store className="w-10 h-10" />}
                name={shop.name || shop.business_name}
                subtitle={shop.owner?.name || shop.owner_name || 'Unknown owner'}
                status={type}
                statusColor="bg-white/20"
            />

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 my-6">
                <StatBox label="Products" value={shop.products_count ?? 0} icon={<Package className="w-4 h-4" />} color="text-blue-600" />
                <StatBox label="Type" value={type} icon={<Tag className="w-4 h-4" />} color="text-[#00D4AA]" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <InfoCard icon={<Store className="w-5 h-5" />} title="Business Information" subtitle="Core business details">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DataItem icon={<User className="w-4 h-4" />} label="Owner" value={shop.owner?.name || shop.owner_name || '-'} />
                            <DataItem icon={<Hash className="w-4 h-4" />} label="Code" value={shop.code || shop.business_code || '-'} mono />
                            <DataItem icon={<Tag className="w-4 h-4" />} label="Type" value={type} />
                            <DataItem icon={<Phone className="w-4 h-4" />} label="Phone" value={shop.phone || '-'} />
                            <DataItem icon={<MapPin className="w-4 h-4" />} label="Location" value={shop.location || '-'} />
                            <DataItem icon={<Calendar className="w-4 h-4" />} label="Created" value={shop.created_at ? new Date(shop.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'} />
                        </div>
                    </InfoCard>
                </div>

                <div>
                    <InfoCard icon={<Package className="w-5 h-5" />} title="Quick Stats" subtitle="Business metrics" accent>
                        <div className="space-y-3">
                            <StatBox label="Total Products" value={shop.products_count ?? 0} icon={<Package className="w-4 h-4" />} color="text-blue-600" />
                            <StatBox label="Business Type" value={type} icon={<Tag className="w-4 h-4" />} color="text-[#00D4AA]" />
                            <StatBox label="Created" value={shop.created_at ? new Date(shop.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'} icon={<Calendar className="w-4 h-4" />} color="text-gray-600" />
                        </div>
                    </InfoCard>
                </div>
            </div>
        </div>
    );
}
