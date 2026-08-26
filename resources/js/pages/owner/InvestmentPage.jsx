import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import SummaryBox from '../../components/casfeta/SummaryBox';
import EmptyState from '../../components/casfeta/EmptyState';
import ActionBar from '../../components/casfeta/ActionBar';
import { TrendingUp, Plus, Trash2, DollarSign, Calendar, FileText, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TYPE_CONFIG = {
    investment_account: { label: 'Investment Account', color: 'bg-blue-100 text-blue-700', percent: 50 },
    life_insurance: { label: 'Life Insurance', color: 'bg-purple-100 text-purple-700', percent: 20 },
    normal_savings: { label: 'Normal Savings', color: 'bg-[#00D4AA]/10 text-[#00B894]', percent: 15 },
    wallet: { label: 'Wallet', color: 'bg-yellow-100 text-yellow-700', percent: 5 },
    bata_account: { label: 'BATA', color: 'bg-red-100 text-red-700', percent: 10 },
};

export default function InvestmentPage() {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [investments, setInvestments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [totals, setTotals] = useState({});
    const [grandTotal, setGrandTotal] = useState(0);

    const [allocModalOpen, setAllocModalOpen] = useState(false);
    const [allocAmount, setAllocAmount] = useState('');
    const [allocDate, setAllocDate] = useState('');
    const [allocDesc, setAllocDesc] = useState('');
    const [allocating, setAllocating] = useState(false);

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [form, setForm] = useState({ amount: '', type: 'investment_account', description: '', date: '' });
    const [submitting, setSubmitting] = useState(false);
    const [deleteId, setDeleteId] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    useEffect(() => {
        api.get('/owner/businesses').then(res => { const biz = res.data?.data || res.data || []; setBusinesses(biz); if (biz.length === 1) setSelectedBusiness(biz[0].id); }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); });
    }, []);

    const fetchData = useCallback(async () => {
        if (!selectedBusiness) { setInvestments([]); return; }
        setLoading(true);
        try { const res = await api.get(`/owner/businesses/${selectedBusiness}/investments`, { params: { page: currentPage, per_page: 15 } }); setInvestments(res.data?.data || []); setCurrentPage(res.data?.current_page || 1); setLastPage(res.data?.last_page || 1); setTotals(res.data?.totals || {}); setGrandTotal(res.data?.grand_total || 0); } catch (error) { console.error('Failed to fetch investments:', error); setInvestments([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => { setCurrentPage(1); }, [selectedBusiness]);

    const handleAllocate = async (e) => {
        e.preventDefault(); if (!allocAmount || Number(allocAmount) <= 0) return; setAllocating(true);
        try { await api.post(`/owner/businesses/${selectedBusiness}/investments/allocate`, { amount: Number(allocAmount), date: allocDate || undefined, description: allocDesc || undefined }); setAllocModalOpen(false); setAllocAmount(''); setAllocDate(''); setAllocDesc(''); fetchData(); } catch (error) { console.error('Failed to allocate income:', error); alert(error?.response?.data?.message || 'Failed to allocate income. Please try again.'); } finally { setAllocating(false); }
    };

    const handleAdd = async (e) => {
        e.preventDefault(); setSubmitting(true);
        try { await api.post(`/owner/businesses/${selectedBusiness}/investments`, { amount: Number(form.amount), type: form.type, description: form.description, date: form.date || undefined }); setAddModalOpen(false); setForm({ amount: '', type: 'investment_account', description: '', date: '' }); fetchData(); } catch (error) { console.error('Failed to add investment:', error); alert(error?.response?.data?.message || 'Failed to add investment. Please try again.'); } finally { setSubmitting(false); }
    };

    const handleDelete = async () => { if (!deleteId) return; try { await api.delete(`/owner/businesses/${selectedBusiness}/investments/${deleteId}`); fetchData(); } catch (error) { console.error('Failed to delete investment:', error); alert(error?.response?.data?.message || 'Failed to delete investment. Please try again.'); } finally { setDeleteId(null); setDeleteModalOpen(false); } };
    const formatCurrency = (val) => `TZS ${Number(val || 0).toLocaleString()}`;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Investments & Savings"
                subtitle="Manage your investment allocations and savings."
                icon={<TrendingUp size={20} />}
                actions={selectedBusiness && (
                    <div className="flex gap-2">
                        <button onClick={() => { setAllocAmount(''); setAllocDate(''); setAllocDesc(''); setAllocModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md">
                            <ArrowUpRight size={16} /> Allocate Income
                        </button>
                        <button onClick={() => { setForm({ amount: '', type: 'investment_account', description: '', date: '' }); setAddModalOpen(true); }} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-medium hover:bg-gray-300 transition-all">
                            <Plus size={16} /> Add Direct
                        </button>
                    </div>
                )}
            />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Business</label>
                <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                    <option value="">-- Select Business --</option>
                    {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name || biz.business_name}</option>))}
                </select>
            </div>

            {selectedBusiness && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                            <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <span className={`${cfg.color} px-2 py-0.5 rounded-full text-[10px] font-bold`}>{cfg.percent}%</span>
                                </div>
                                <p className="text-xl font-extrabold text-gray-900">{formatCurrency(totals[key] || 0)}</p>
                                <p className="text-xs text-gray-500 mt-1">{cfg.label}</p>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[2px]">TOTAL SAVINGS</p>
                                <p className="text-3xl font-extrabold text-gray-900">{formatCurrency(grandTotal)}</p>
                            </div>
                            <div className="w-16 h-16 rounded-2xl bg-[#00D4AA]/10 flex items-center justify-center">
                                <TrendingUp size={32} className="text-[#00D4AA]" />
                            </div>
                        </div>
                    </div>
                </>
            )}

            {!selectedBusiness ? (
                <EmptyState title="Select a business" description="Choose a business from the dropdown above to view investments." />
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : investments.length === 0 ? (
                <EmptyState title="No investments found" description="Start allocating income or adding direct investments." />
            ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50/50">
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Type</th>
                                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Amount</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Description</th>
                                    <th className="text-left px-6 py-3 font-semibold text-gray-600">Date</th>
                                    <th className="text-right px-6 py-3 font-semibold text-gray-600">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {investments.map((row) => {
                                    const cfg = TYPE_CONFIG[row.type] || TYPE_CONFIG.investment_account;
                                    return (
                                        <tr key={row.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span></td>
                                            <td className="px-6 py-4 text-right font-semibold text-gray-800">{formatCurrency(row.amount)}</td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">{row.description || '-'}</td>
                                            <td className="px-6 py-4 text-gray-600 text-sm">{row.date ? new Date(row.date).toLocaleDateString('sw-TZ', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button onClick={() => { setDeleteId(row.id); setDeleteModalOpen(true); }} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Delete"><Trash2 size={15} /></button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                </div>
            )}

            <Modal isOpen={allocModalOpen} onClose={() => setAllocModalOpen(false)} title="Allocate Income" size="md">
                <form onSubmit={handleAllocate} className="space-y-4">
                    <SectionHeader icon={<ArrowUpRight size={18} />} title="Allocation Breakdown" />
                    <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 gap-2">
                        {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                            <div key={key} className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">{cfg.label}</span>
                                <span className="font-semibold text-gray-800">{cfg.percent}%</span>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Amount to Allocate (TZS)" required icon={<DollarSign size={16} />}>
                            <input type="number" min="1" value={allocAmount} onChange={(e) => setAllocAmount(e.target.value)} required placeholder="Enter amount" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Date" icon={<Calendar size={16} />}>
                            <input type="date" value={allocDate} onChange={(e) => setAllocDate(e.target.value)} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Description" icon={<FileText size={16} />} full>
                            <input type="text" value={allocDesc} onChange={(e) => setAllocDesc(e.target.value)} placeholder="Description (optional)" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                    </div>
                    <ActionBar onCancel={() => setAllocModalOpen(false)} onCancelLabel="Cancel" onSubmit={handleAllocate} onSubmitLabel="Allocate" loading={allocating} accent />
                </form>
            </Modal>

            <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add Investment" size="md">
                <form onSubmit={handleAdd} className="space-y-4">
                    <SectionHeader icon={<TrendingUp size={18} />} title="Investment Details" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField label="Type" required icon={<TrendingUp size={16} />}>
                            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]">
                                {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (<option key={key} value={key}>{cfg.label} ({cfg.percent}%)</option>))}
                            </select>
                        </FormField>
                        <FormField label="Amount (TZS)" required icon={<DollarSign size={16} />}>
                            <input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Date" icon={<Calendar size={16} />}>
                            <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                        <FormField label="Description" icon={<FileText size={16} />}>
                            <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description (optional)" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                    </div>
                    <ActionBar onCancel={() => setAddModalOpen(false)} onCancelLabel="Cancel" onSubmit={handleAdd} onSubmitLabel="Save" loading={submitting} accent />
                </form>
            </Modal>

            <ConfirmDialog isOpen={deleteModalOpen} onClose={() => { setDeleteModalOpen(false); setDeleteId(null); }} onConfirm={handleDelete} title="Delete Investment" message="Are you sure you want to delete this investment?" confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
