import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { User, ShoppingCart, DollarSign, Users, Package, Zap } from 'lucide-react';

export default function EmployeeDashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/employee/dashboard').then(res => {
            setData(res.data);
        }).catch(() => {
            setData({ todayOrders: 0, todaySales: 0 });
        }).finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA]">
                    <User size={20} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Employee Dashboard</h1>
                    <p className="text-sm text-gray-500">View your daily activities and tasks.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Today's Orders</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{data?.todayOrders || 0}</p>
                    </div>
                    <div className="stat-icon bg-[#00D4AA]/10 text-[#00D4AA] shrink-0">
                        <ShoppingCart size={24} />
                    </div>
                </div>

                <div className="stat-card flex items-center justify-between">
                    <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-500 truncate">Today's Sales</p>
                        <p className="mt-1.5 text-2xl md:text-3xl font-bold tracking-tight text-gray-900">TZS {(data?.todaySales || 0).toLocaleString()}</p>
                    </div>
                    <div className="stat-icon bg-emerald-500/10 text-emerald-600 shrink-0">
                        <DollarSign size={24} />
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-yellow-100 flex items-center justify-center">
                            <Zap size={18} className="text-yellow-600" />
                        </div>
                        Quick Actions
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link to="/employee/customers" className="quick-action">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center">
                                    <span className="text-blue-600"><Users size={20} /></span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Customers</p>
                                    <p className="text-xs text-gray-500">View customer list</p>
                                </div>
                            </div>
                        </Link>
                        <Link to="/employee/inventory" className="quick-action">
                            <div className="flex items-center gap-3">
                                <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center">
                                    <span className="text-purple-600"><Package size={20} /></span>
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900 text-sm">Inventory</p>
                                    <p className="text-xs text-gray-500">Check stock levels</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
