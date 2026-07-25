import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import { Package, Clock, Truck, CheckCircle, Zap } from 'lucide-react';

export default function TransporterDashboard() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [deliveries, setDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        try {
            const [dashRes, deliveriesRes] = await Promise.all([
                api.get('/transporter/dashboard'),
                api.get('/transporter/deliveries?per_page=5')
            ]);
            setStats(dashRes.data.data);
            const deliveriesData = deliveriesRes.data;
            setDeliveries(deliveriesData.data || deliveriesData.data?.data || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-32 bg-white rounded-2xl animate-pulse" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                    {[1,2,3].map(i => <div key={i} className="h-28 bg-white rounded-2xl animate-pulse" />)}
                </div>
            </div>
        );
    }

    const DELIVERY_STATUS = {
        pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-700' },
        accepted: { label: 'Accepted', className: 'bg-blue-100 text-blue-700' },
        in_transit: { label: 'In Transit', className: 'bg-blue-100 text-blue-700' },
        delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-700' },
        cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-700' },
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA]">
                    <Package size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Transporter Dashboard</h1>
                    <p className="text-sm text-gray-500">Manage your deliveries with ease.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Pending</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{stats?.pending_deliveries || 0}</p>
                    </div>
                    <div className="stat-icon bg-yellow-500/10 text-yellow-600 shrink-0">
                        <Clock size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">In Transit</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{stats?.in_progress_deliveries || 0}</p>
                    </div>
                    <div className="stat-icon bg-blue-500/10 text-blue-600 shrink-0">
                        <Truck size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Completed</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{stats?.completed_deliveries || 0}</p>
                    </div>
                    <div className="stat-icon bg-emerald-500/10 text-emerald-600 shrink-0">
                        <CheckCircle size={24} />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                            <Truck size={18} className="text-blue-600" />
                        </div>
                        Active Deliveries
                    </h3>
                    <Link to="/transporter/deliveries" className="text-[#00D4AA] text-sm font-semibold hover:text-[#00b894] transition-colors">
                        View All →
                    </Link>
                </div>
                {deliveries.length === 0 ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Package size={32} className="text-gray-400" />
                        </div>
                        <p className="font-bold text-gray-900 mb-1">No Deliveries Yet</p>
                        <p className="text-gray-500 text-sm">Your assigned deliveries will appear here</p>
                    </div>
                ) : (
                    <div className="p-6 space-y-3">
                        {deliveries.map(delivery => {
                            const status = DELIVERY_STATUS[delivery.status] || { label: delivery.status, className: 'bg-gray-100 text-gray-700' };
                            return (
                                <div key={delivery.id} className="quick-action">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="font-bold text-gray-900 text-sm">#{delivery.delivery_code || delivery.id}</p>
                                            <p className="text-gray-500 text-xs mt-0.5">{delivery.pickup_location} → {delivery.destination}</p>
                                        </div>
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.className}`}>
                                            {status.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
