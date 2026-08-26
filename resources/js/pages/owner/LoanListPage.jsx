import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import { Wallet, Plus, DollarSign, User, Calendar, FileText, Search, Clock, CheckCircle, TrendingDown, Filter, RotateCcw } from 'lucide-react';

const LOAN_TABS = [
    { key: '', label: 'All' },
    { key: 'pending', label: 'Pending' },
    { key: 'paid', label: 'Paid' },
    { key: 'overdue', label: 'Overdue' },
];

const LOAN_STATUS_MAP = {
    pending: { label: 'Pending', badge: 'bg-yellow-100 text-yellow-700' },
    paid: { label: 'Paid', badge: 'bg-[#00D4AA]/10 text-[#00B894]' },
    overdue: { label: 'Overdue', badge: 'bg-red-100 text-red-600' },
};

export default function LoanListPage() {
    document.title = 'Loans - M-TAI';
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [loans, setLoans] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, outstanding_balance: 0 });

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [loanForm, setLoanForm] = useState({ customer_id: '', amount: '', due_date: '', notes: '' });
    const [loanSubmitting, setLoanSubmitting] = useState(false);
    const [loanErrors, setLoanErrors] = useState({});

    const [payModalOpen, setPayModalOpen] = useState(false);
    const [payLoan, setPayLoan] = useState(null);
    const [payAmount, setPayAmount] = useState('');
    const [paySubmitting, setPaySubmitting] = useState(false);
    const [payError, setPayError] = useState('');

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); });
    }, []);

    const fetchLoans = useCallback(async () => {
        if (!selectedBusiness) { setLoans([]); setStats({ total: 0, paid: 0, pending: 0, outstanding_balance: 0 }); return; }
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/loans`, { params });
            const data = res.data?.data || [];
            setLoans(data);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.stats) setStats(res.data.stats);
            else {
                const total = res.data?.total || data.length;
                const paid = data.filter(l => l.status === 'paid').length;
                const pending = data.filter(l => l.status === 'pending').length;
                const outstanding_balance = data.reduce((sum, l) => sum + Number(l.balance || l.remaining || 0), 0);
                setStats({ total, paid, pending, outstanding_balance });
            }
        } catch (error) { console.error('Failed to fetch loans:', error); setLoans([]); } finally { setLoading(false); }
    }, [selectedBusiness, currentPage, search, statusFilter]);

    useEffect(() => { fetchLoans(); }, [fetchLoans]);
    useEffect(() => { setCurrentPage(1); }, [selectedBusiness, search, statusFilter]);

    useEffect(() => {
        if (selectedBusiness && addModalOpen) {
            api.get(`/owner/businesses/${selectedBusiness}/customers`, { params: { per_page: 200 } }).then(res => setCustomers(res.data?.data || res.data || [])).catch((error) => { console.error('Failed to fetch customers:', error); setCustomers([]); });
        }
    }, [selectedBusiness, addModalOpen]);

    const handleAddLoan = async (e) => {
        e.preventDefault();
        setLoanSubmitting(true); setLoanErrors({});
        try {
            await api.post(`/owner/businesses/${selectedBusiness}/loans`, { customer_id: loanForm.customer_id, amount: Number(loanForm.amount), due_date: loanForm.due_date || null, notes: loanForm.notes });
            setAddModalOpen(false); setLoanForm({ customer_id: '', amount: '', due_date: '', notes: '' }); fetchLoans();
        } catch (error) { if (error.response?.status === 422) setLoanErrors(error.response.data?.errors || {}); else { console.error('Failed to create loan:', error); alert(error?.response?.data?.message || 'Failed to create loan. Please try again.'); } } finally { setLoanSubmitting(false); }
    };

    const openPayModal = (loan) => { setPayLoan(loan); setPayAmount(''); setPayError(''); setPayModalOpen(true); };

    const handlePayLoan = async (e) => {
        e.preventDefault();
        if (!payLoan) return;
        const amount = Number(payAmount);
        const remaining = Number(payLoan.balance || payLoan.remaining || 0);
        if (!amount || amount <= 0) { setPayError('Enter a valid amount.'); return; }
        if (amount > remaining) { setPayError(`Amount cannot exceed outstanding balance of TZS ${remaining.toLocaleString()}.`); return; }
        setPaySubmitting(true); setPayError('');
        try { await api.post(`/owner/loans/${payLoan.id}/pay`, { amount }); setPayModalOpen(false); setPayLoan(null); setPayAmount(''); fetchLoans(); } catch (err) { console.error('Failed to process loan payment:', err); setPayError(err.response?.data?.message || 'Failed to process payment.'); } finally { setPaySubmitting(false); }
    };

    const handleLoanChange = (e) => {
        const { name, value } = e.target;
        setLoanForm(prev => ({ ...prev, [name]: value }));
        if (loanErrors[name]) setLoanErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleReset = () => { setSearch(''); setStatusFilter(''); };

    const formatCurrency = (val) => `TZS ${Number(val || 0).toLocaleString()}`;

    return (
        <div className="space-y-0">
            {selectedBusiness && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Loans</p><p className="text-2xl font-bold text-gray-900">{stats.total}</p></div>
                        <div className="h-12 w-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0"><Wallet size={22} className="text-[#00D4AA]" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Paid</p><p className="text-2xl font-bold text-gray-900">{stats.paid}</p></div>
                        <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={22} className="text-green-500" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending</p><p className="text-2xl font-bold text-gray-900">{stats.pending}</p></div>
                        <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0"><Clock size={22} className="text-yellow-500" /></div>
                    </div>
                    <div className="stat-card flex items-center justify-between p-5 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Outstanding</p><p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.outstanding_balance)}</p></div>
                        <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0"><TrendingDown size={22} className="text-red-500" /></div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-end mb-6">
                {selectedBusiness && (
                    <button onClick={() => { setLoanForm({ customer_id: '', amount: '', due_date: '', notes: '' }); setLoanErrors({}); setAddModalOpen(true); }} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        <Plus size={16} /> <span className="hidden sm:inline">Add New</span>
                    </button>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4">
                    <Filter size={14} className="text-[#00D4AA] mr-2" /> Search Resources
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search loans..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                    </div>
                    <div className="flex items-center gap-3">
                        <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                            <option value="">All Businesses</option>
                            {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name || biz.business_name}</option>))}
                        </select>
                        <div className="flex gap-2 flex-wrap">
                            {LOAN_TABS.map((tab) => (
                                <button key={tab.key} onClick={() => setStatusFilter(tab.key)} className={`px-3 py-2 rounded-lg text-sm font-medium transition ${statusFilter === tab.key ? 'bg-[#00D4AA] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleReset} className="px-4 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30">
                            <RotateCcw size={12} /> Reset
                        </button>
                    </div>
                </div>
            </div>

            {!selectedBusiness ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center"><Wallet size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">Select a business to view loans</p></div>
                </div>
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : loans.length === 0 ? (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm">
                    <div className="px-6 py-12 text-center"><Wallet size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No data available</p></div>
                </div>
            ) : (
                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Loans ({loans.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Customer</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Amount</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Paid</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-right">Balance</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider text-center">Status</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Due Date</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loans.map((row) => {
                                    const cfg = LOAN_STATUS_MAP[row.status] || LOAN_STATUS_MAP.pending;
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 font-medium text-gray-800">{row.customer?.name || row.customer_name || '-'}</td>
                                            <td className="px-6 py-3 text-right font-semibold text-gray-800">{formatCurrency(row.amount)}</td>
                                            <td className="px-6 py-3 text-right text-[#00B894] font-medium">{formatCurrency(row.paid_amount || row.paid)}</td>
                                            <td className="px-6 py-3 text-right font-semibold text-red-600">{formatCurrency(row.balance || row.remaining)}</td>
                                            <td className="px-6 py-3 text-center"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.badge}`}>{cfg.label}</span></td>
                                            <td className="px-6 py-3 text-gray-600 text-sm">{row.due_date ? new Date(row.due_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-2">
                                                    {row.status !== 'paid' && (
                                                        <button onClick={() => openPayModal(row)} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Pay">
                                                            <DollarSign size={14} />
                                                        </button>
                                                    )}
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

            <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Add New Loan" size="md">
                <form onSubmit={handleAddLoan} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Customer <span className="text-red-500">*</span></label>
                            <select name="customer_id" value={loanForm.customer_id} onChange={handleLoanChange} required className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]">
                                <option value="">-- Select Customer --</option>
                                {customers.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                            </select>
                            {loanErrors.customer_id && <p className="mt-1 text-sm text-red-600">{loanErrors.customer_id[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Amount (TZS) <span className="text-red-500">*</span></label>
                            <input type="number" name="amount" value={loanForm.amount} onChange={handleLoanChange} min="1" required placeholder="Enter loan amount" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                            {loanErrors.amount && <p className="mt-1 text-sm text-red-600">{loanErrors.amount[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Due Date</label>
                            <input type="date" name="due_date" value={loanForm.due_date} onChange={handleLoanChange} className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Description</label>
                            <textarea name="notes" value={loanForm.notes} onChange={handleLoanChange} rows={3} placeholder="Loan description (optional)" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] resize-none" />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setAddModalOpen(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={loanSubmitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">
                            {loanSubmitting ? 'Creating...' : 'Create Loan'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={payModalOpen} onClose={() => { setPayModalOpen(false); setPayLoan(null); setPayAmount(''); setPayError(''); }} title="Pay Loan" size="sm">
                {payLoan && (
                    <form onSubmit={handlePayLoan} className="space-y-4">
                        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Customer</span><span className="text-sm font-medium text-gray-800">{payLoan.customer?.name || payLoan.customer_name || '-'}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Loan Amount</span><span className="text-sm font-semibold text-gray-800">{formatCurrency(payLoan.amount)}</span></div>
                            <div className="flex justify-between"><span className="text-sm text-gray-500">Paid</span><span className="text-sm font-medium text-[#00B894]">{formatCurrency(payLoan.paid_amount || payLoan.paid)}</span></div>
                            <div className="flex justify-between border-t border-gray-200 pt-3"><span className="text-sm font-medium text-gray-700">Balance</span><span className="text-sm font-bold text-red-600">{formatCurrency(payLoan.balance || payLoan.remaining)}</span></div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Payment Amount (TZS) <span className="text-red-500">*</span></label>
                            <input type="number" value={payAmount} onChange={(e) => { setPayAmount(e.target.value); setPayError(''); }} min="1" max={Number(payLoan.balance || payLoan.remaining || 0)} required placeholder="Enter payment amount" className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA]" />
                        </div>
                        {payError && <p className="text-sm text-red-600">{payError}</p>}
                        <div className="flex justify-end space-x-3 pt-2">
                            <button type="button" onClick={() => { setPayModalOpen(false); setPayLoan(null); setPayAmount(''); setPayError(''); }} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                            <button type="submit" disabled={paySubmitting} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">
                                {paySubmitting ? 'Processing...' : 'Pay Now'}
                            </button>
                        </div>
                    </form>
                )}
            </Modal>
        </div>
    );
}
