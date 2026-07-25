import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import EmptyState from '../../components/casfeta/EmptyState';
import { Download, Package, ClipboardList, Receipt, Loader2 } from 'lucide-react';

const EXPORT_TYPES = [
    { key: 'products', title: 'Products', desc: 'List of all products, prices, and stock levels.', icon: Package, color: 'bg-[#00D4AA]/10 text-[#00B894]' },
    { key: 'orders', title: 'Orders', desc: 'History of all orders with details and amounts.', icon: ClipboardList, color: 'bg-blue-100 text-blue-700' },
    { key: 'expenses', title: 'Expenses', desc: 'List of all expenses by category with totals.', icon: Receipt, color: 'bg-purple-100 text-purple-700' },
];

export default function ExportPage() {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [loading, setLoading] = useState('');

    useEffect(() => {
        api.get('/owner/businesses', { params: { per_page: 200 } })
            .then(res => setBusinesses(res.data?.data || res.data || []))
            .catch(() => setBusinesses([]));
    }, []);

    const handleExport = async (type) => {
        if (!selectedBusiness) return;
        setLoading(type);
        try {
            const res = await api.get(`/owner/businesses/${selectedBusiness}/export/${type}`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `${type}_${selectedBusiness}_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch {
            alert('Failed to export data');
        } finally {
            setLoading('');
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Export Data" subtitle="Download your business data as CSV files." icon={<Download size={20} />} />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Business</label>
                <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)}
                    className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                    <option value="">-- Select Business --</option>
                    {businesses.map(b => <option key={b.id} value={b.id}>{b.business_name || b.name}</option>)}
                </select>
            </div>

            {!selectedBusiness ? (
                <EmptyState title="Select a business" description="Choose a business to export data from." />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {EXPORT_TYPES.map(exp => {
                        const Icon = exp.icon;
                        return (
                            <div key={exp.key} className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${exp.color}`}>
                                    <Icon size={24} />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-1">{exp.title}</h3>
                                <p className="text-sm text-gray-500 mb-6 flex-1">{exp.desc}</p>
                                <button onClick={() => handleExport(exp.key)} disabled={loading === exp.key}
                                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md disabled:opacity-50">
                                    {loading === exp.key ? (
                                        <><Loader2 size={16} className="animate-spin" /> Downloading...</>
                                    ) : (
                                        <><Download size={16} /> Download CSV</>
                                    )}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
