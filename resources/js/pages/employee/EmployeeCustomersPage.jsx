import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, SlidersHorizontal, X } from 'lucide-react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import PageHeader from '../../components/casfeta/PageHeader';

export default function EmployeeCustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [total, setTotal] = useState(0);

    const fetchCustomers = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            const res = await api.get('/employee/customers', { params });
            const data = res.data?.data || [];
            setCustomers(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            setTotal(res.data?.total || data.length);
        } catch (error) { console.error('Failed to fetch customers:', error); setCustomers([]); setTotal(0); } finally {
            setLoading(false);
        }
    }, [currentPage, search]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    useEffect(() => {
        setCurrentPage(1);
    }, [search]);

    const columns = [
        {
            header: 'Name',
            render: (row) => (
                <span className="font-medium text-gray-800">{row.name}</span>
            ),
        },
        {
            header: 'Phone',
            render: (row) => (
                <span className="text-gray-600">{row.phone || '-'}</span>
            ),
        },
        {
            header: 'Email',
            render: (row) => (
                <span className="text-gray-600">{row.email || '-'}</span>
            ),
        },
        {
            header: 'Orders',
            render: (row) => (
                <span className="badge badge-green">
                    {row.orders_count ?? row.orders?.length ?? 0}
                </span>
            ),
        },
        {
            header: 'Total Spending',
            render: (row) => (
                <span className="font-semibold text-gray-800">
                    TZS {Number(row.total_spent || row.total_amount || 0).toLocaleString()}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader title="Customers" subtitle="View and manage customer data" icon={<Users size={20} />} />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                    <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search customers..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
                </div>
            ) : customers.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-12 text-center">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500 font-medium">No customers found</p>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Customers</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Phone</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Email</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Orders</th>
                                    <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Total Spending</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map((row) => (
                                    <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA] font-bold text-sm">{(row.name || '?')[0]?.toUpperCase()}</div>
                                                <span className="font-semibold text-gray-900">{row.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{row.phone || '-'}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{row.email || '-'}</td>
                                        <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#00D4AA]/10 text-[#00D4AA]">{row.orders_count ?? row.orders?.length ?? 0}</span></td>
                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">TZS {Number(row.total_spent || row.total_amount || 0).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}
        </div>
    );
}
