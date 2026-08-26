import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { Wallet, Plus, Filter, Eye, PlayCircle, CreditCard, DollarSign, CheckCircle, Clock } from 'lucide-react';

const STATUS_LABELS = {
    draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-700' },
    processing: { label: 'Processing', classes: 'bg-yellow-100 text-yellow-700' },
    processed: { label: 'Processed', classes: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Paid', classes: 'bg-green-100 text-green-700' },
};

const emptyGenerateForm = { name: '', period_start: '', period_end: '', payment_date: '' };

export default function PayrollPage() {
    document.title = 'Payroll - M-TAI';
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [generateForm, setGenerateForm] = useState(emptyGenerateForm);
    const [generating, setGenerating] = useState(false);
    const [generateErrors, setGenerateErrors] = useState({});
    const [detailModal, setDetailModal] = useState({ open: false, data: null });

    const fetchPayrolls = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (filter !== 'all') params.status = filter;
            const res = await api.get('/owner/hr/payrolls', { params });
            setPayrolls(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch (error) { console.error('Failed to fetch payrolls:', error); setPayrolls([]); } finally { setLoading(false); }
    }, [currentPage, filter]);

    useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);
    useEffect(() => { setCurrentPage(1); }, [filter]);

    const handleGenerate = async (e) => {
        e.preventDefault(); setGenerating(true); setGenerateErrors({});
        try { await api.post('/owner/hr/payrolls/generate', generateForm); setGenerateModalOpen(false); setGenerateForm(emptyGenerateForm); fetchPayrolls(); }
        catch (err) { console.error('Failed to generate payroll:', err); if (err.response?.status === 422) setGenerateErrors(err.response.data?.errors || {}); else alert(err.response?.data?.message || 'Failed'); } finally { setGenerating(false); }
    };

    const handleProcess = async (id) => { try { await api.post(`/owner/hr/payrolls/${id}/process`); fetchPayrolls(); } catch (error) { console.error('Failed to process payroll:', error); alert(error?.response?.data?.message || 'Failed to process payroll. Please try again.'); } };
    const handlePay = async (id) => { try { await api.post(`/owner/hr/payrolls/${id}/pay`); fetchPayrolls(); } catch (error) { console.error('Failed to pay payroll:', error); alert(error?.response?.data?.message || 'Failed to mark payroll as paid. Please try again.'); } };
    const openDetail = async (p) => {
        try { const res = await api.get(`/owner/hr/payrolls/${p.id}`); setDetailModal({ open: true, data: res.data }); }
        catch (error) { console.error('Failed to fetch payroll detail:', error); setDetailModal({ open: true, data: p }); }
    };

    const totalStats = payrolls.reduce((acc, p) => ({ gross: acc.gross + Number(p.total_gross || 0), net: acc.net + Number(p.total_net || 0) }), { gross: 0, net: 0 });
    const inputClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm";

    return (
        <div className="space-y-0">
            <PageHeader title="Payroll" subtitle="Manage employee compensation" icon={<Wallet size={20} />}
                actions={<button onClick={() => { setGenerateForm(emptyGenerateForm); setGenerateErrors({}); setGenerateModalOpen(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} />Generate Payroll</button>} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Gross</p><p className="text-2xl font-bold text-gray-900">TZS {Number(totalStats.gross).toLocaleString()}</p></div>
                    <div className="h-12 w-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0"><DollarSign size={22} className="text-[#00D4AA]" /></div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Net</p><p className="text-2xl font-bold text-gray-900">TZS {Number(totalStats.net).toLocaleString()}</p></div>
                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"><Wallet size={22} className="text-blue-500" /></div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid</p><p className="text-2xl font-bold text-gray-900">{payrolls.filter(p => p.status === 'paid').length}</p></div>
                    <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={22} className="text-green-500" /></div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</p><p className="text-2xl font-bold text-gray-900">{payrolls.filter(p => p.status === 'draft' || p.status === 'processing').length}</p></div>
                    <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0"><Clock size={22} className="text-yellow-500" /></div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <div className="flex gap-2">
                    {['all', 'draft', 'processed', 'paid'].map((tab) => (
                        <button key={tab} onClick={() => setFilter(tab)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === tab ? 'bg-[#00D4AA] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                            {tab === 'all' ? 'All' : STATUS_LABELS[tab]?.label || tab}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Payroll Records ({payrolls.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Period</th>
                                    <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Gross</th>
                                    <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Net</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {payrolls.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center"><Wallet size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No payroll records found</p></td></tr>
                                ) : payrolls.map((p) => {
                                    const st = STATUS_LABELS[p.status] || { label: p.status, classes: 'bg-gray-100 text-gray-700' };
                                    return (
                                        <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-800">{p.name || '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{p.period_start && p.period_end ? `${p.period_start} - ${p.period_end}` : '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-700 text-right">TZS {Number(p.total_gross || 0).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-sm text-gray-700 text-right">TZS {Number(p.total_net || 0).toLocaleString()}</td>
                                            <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.classes}`}>{st.label}</span></td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => openDetail(p)} className="h-8 w-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center hover:bg-blue-200 transition-all" title="View"><Eye size={14} /></button>
                                                    {p.status === 'draft' && <button onClick={() => handleProcess(p.id)} className="h-8 px-3 bg-yellow-100 text-yellow-700 rounded-lg flex items-center gap-1 text-xs font-medium hover:bg-yellow-200 transition-all"><PlayCircle size={12} />Process</button>}
                                                    {p.status === 'processed' && <button onClick={() => handlePay(p.id)} className="h-8 px-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-1 text-xs font-medium hover:bg-green-200 transition-all"><CreditCard size={12} />Pay</button>}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 border-t border-gray-100">
                        <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                    </div>
                </div>
            )}

            <Modal isOpen={generateModalOpen} onClose={() => setGenerateModalOpen(false)} title="Generate Payroll" size="md">
                <form onSubmit={handleGenerate} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Payroll Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={generateForm.name} onChange={(e) => setGenerateForm(prev => ({ ...prev, name: e.target.value }))} required className={`${inputClasses} ${generateErrors.name ? 'border-red-500' : ''}`} placeholder="e.g. July 2026 Payroll" />
                        {generateErrors.name && <p className="mt-1.5 text-sm text-red-600">{generateErrors.name[0]}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Period Start <span className="text-red-500">*</span></label>
                            <input type="date" name="period_start" value={generateForm.period_start} onChange={(e) => setGenerateForm(prev => ({ ...prev, period_start: e.target.value }))} required className={`${inputClasses} ${generateErrors.period_start ? 'border-red-500' : ''}`} />
                            {generateErrors.period_start && <p className="mt-1.5 text-sm text-red-600">{generateErrors.period_start[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Period End <span className="text-red-500">*</span></label>
                            <input type="date" name="period_end" value={generateForm.period_end} onChange={(e) => setGenerateForm(prev => ({ ...prev, period_end: e.target.value }))} required className={`${inputClasses} ${generateErrors.period_end ? 'border-red-500' : ''}`} />
                            {generateErrors.period_end && <p className="mt-1.5 text-sm text-red-600">{generateErrors.period_end[0]}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Payment Date <span className="text-red-500">*</span></label>
                        <input type="date" name="payment_date" value={generateForm.payment_date} onChange={(e) => setGenerateForm(prev => ({ ...prev, payment_date: e.target.value }))} required className={`${inputClasses} ${generateErrors.payment_date ? 'border-red-500' : ''}`} />
                        {generateErrors.payment_date && <p className="mt-1.5 text-sm text-red-600">{generateErrors.payment_date[0]}</p>}
                    </div>
                    <p className="text-xs text-gray-500">This will generate payroll for all active employees.</p>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setGenerateModalOpen(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={generating} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            {generating ? 'Generating...' : 'Generate'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={detailModal.open} onClose={() => setDetailModal({ open: false, data: null })} title="Payroll Details" size="lg">
                {detailModal.data && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Name</p><p className="text-sm font-medium text-gray-900">{detailModal.data.name || '-'}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Period</p><p className="text-sm font-medium text-gray-900">{detailModal.data.period_start} - {detailModal.data.period_end}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Payment Date</p><p className="text-sm font-medium text-gray-900">{detailModal.data.payment_date || '-'}</p></div>
                            <div><p className="text-xs font-semibold text-gray-400 uppercase">Status</p><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(STATUS_LABELS[detailModal.data.status] || { classes: 'bg-gray-100 text-gray-700' }).classes}`}>{(STATUS_LABELS[detailModal.data.status] || { label: detailModal.data.status }).label}</span></div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Total Gross</p><p className="text-lg font-bold text-gray-900">TZS {Number(detailModal.data.total_gross || 0).toLocaleString()}</p></div>
                            <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Total Deductions</p><p className="text-lg font-bold text-red-600">TZS {Number(detailModal.data.total_deductions || 0).toLocaleString()}</p></div>
                            <div className="bg-gray-50 rounded-xl p-4"><p className="text-xs font-semibold text-gray-400 uppercase mb-1">Total Net</p><p className="text-lg font-bold text-green-600">TZS {Number(detailModal.data.total_net || 0).toLocaleString()}</p></div>
                        </div>
                        {detailModal.data.items && detailModal.data.items.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase mb-2">Employee Items ({detailModal.data.items.length})</p>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead><tr className="border-b border-gray-200">
                                            <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Employee</th>
                                            <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Base</th>
                                            <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Allow.</th>
                                            <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Bonus</th>
                                            <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Tax</th>
                                            <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Other</th>
                                            <th className="text-right px-3 py-2 font-medium text-gray-500 text-xs">Net Pay</th>
                                            <th className="text-left px-3 py-2 font-medium text-gray-500 text-xs">Status</th>
                                        </tr></thead>
                                        <tbody>
                                            {detailModal.data.items.map((item) => (
                                                <tr key={item.id} className="border-b border-gray-50">
                                                    <td className="px-3 py-2">{item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : '-'}</td>
                                                    <td className="px-3 py-2 text-right">TZS {Number(item.base_salary || 0).toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right">TZS {Number(item.allowances || 0).toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right">TZS {Number(item.bonuses || 0).toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right text-red-600">TZS {Number(item.tax_deduction || 0).toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right text-red-600">TZS {Number(item.other_deductions || 0).toLocaleString()}</td>
                                                    <td className="px-3 py-2 text-right font-semibold">TZS {Number(item.net_pay || 0).toLocaleString()}</td>
                                                    <td className="px-3 py-2"><span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.status}</span></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
}
