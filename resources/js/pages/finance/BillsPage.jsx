import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Receipt, Plus, Search, Eye, DollarSign, X } from 'lucide-react';
import Pagination from '../../components/Pagination';

const STATUS_CLASSES = { draft: 'bg-gray-100 text-gray-700', received: 'bg-blue-100 text-blue-700', paid: 'bg-green-100 text-green-700', partial: 'bg-yellow-100 text-yellow-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-gray-100 text-gray-500' };

export default function BillsPage() {
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ vendor_name: '', bill_number: '', date: new Date().toISOString().split('T')[0], due_date: '', notes: '', discount_amount: 0, items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }] });
    const [saving, setSaving] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [showPayModal, setShowPayModal] = useState(null);
    const [payAmount, setPayAmount] = useState('');

    const fetchBills = useCallback(async () => {
        setLoading(true);
        try {
            const params = { per_page: 20 };
            if (statusFilter) params.status = statusFilter;
            if (search) params.search = search;
            const res = await api.get('/owner/finance/bills', { params });
            setBills(res.data.data || []);
            setCurrentPage(res.data.current_page || 1);
            setLastPage(res.data.last_page || 1);
        } catch (error) { console.error('Failed to fetch bills:', error); setBills([]); } finally { setLoading(false); }
    }, [statusFilter, search]);

    useEffect(() => { fetchBills(); }, [fetchBills]);

    const addItem = () => setForm({...form, items: [...form.items, { description: '', quantity: 1, unit_price: 0, tax_rate: 0 }]});
    const removeItem = (i) => setForm({...form, items: form.items.filter((_, idx) => idx !== i)});
    const updateItem = (i, field, value) => { const items = [...form.items]; items[i][field] = value; setForm({...form, items}); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/owner/finance/bills', form);
            setShowForm(false); setForm({ vendor_name: '', bill_number: '', date: new Date().toISOString().split('T')[0], due_date: '', notes: '', discount_amount: 0, items: [{ description: '', quantity: 1, unit_price: 0, tax_rate: 0 }] });
            fetchBills();
        } catch (err) { console.error('Failed to create bill:', err); alert(err.response?.data?.message || 'Failed'); } finally { setSaving(false); }
    };

    const handlePay = async () => {
        if (!payAmount || Number(payAmount) <= 0) return;
        try { await api.post(`/owner/finance/bills/${showPayModal.id}/pay`, { amount: Number(payAmount) }); setShowPayModal(null); setPayAmount(''); fetchBills(); } catch (err) { console.error('Failed to pay bill:', err); alert(err.response?.data?.message || 'Failed'); }
    };

    const totalOutstanding = bills.filter(b => b.status !== 'paid' && b.status !== 'cancelled').reduce((s, b) => s + Number(b.total || 0) - Number(b.amount_paid || 0), 0);

    return (
        <div className="space-y-6">
            <PageHeader title="Bills" subtitle="Accounts payable management" icon={<Receipt size={20} />}
                actions={<button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Bill</button>} />

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500 mb-1">Total Outstanding</p><p className="text-2xl font-bold text-gray-900">TZS {Number(totalOutstanding).toLocaleString()}</p></div><div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center"><DollarSign className="w-6 h-6 text-yellow-500" /></div></div></div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500 mb-1">Total Bills</p><p className="text-2xl font-bold text-gray-900">{bills.length}</p></div><div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center"><Receipt className="w-6 h-6 text-[#00D4AA]" /></div></div></div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5"><div className="flex items-center justify-between"><div><p className="text-sm font-medium text-gray-500 mb-1">Paid</p><p className="text-2xl font-bold text-gray-900">{bills.filter(b => b.status === 'paid').length}</p></div><div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center"><DollarSign className="w-6 h-6 text-green-500" /></div></div></div>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4"><h3 className="text-lg font-semibold text-gray-900">New Bill</h3><button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button></div>
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Vendor Name *</label><input type="text" required value={form.vendor_name} onChange={(e) => setForm({...form, vendor_name: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="Vendor name" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Bill # *</label><input type="text" required value={form.bill_number} onChange={(e) => setForm({...form, bill_number: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="BILL-001" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Date *</label><input type="date" required value={form.date} onChange={(e) => setForm({...form, date: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                            <div><label className="text-sm font-medium text-gray-700 mb-1 block">Due Date *</label><input type="date" required value={form.due_date} onChange={(e) => setForm({...form, due_date: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" /></div>
                        </div>
                        <div className="mb-4"><label className="text-sm font-medium text-gray-700 mb-1 block">Notes</label><input type="text" value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" placeholder="Optional notes" /></div>
                        <div className="space-y-3 mb-4">
                            <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 uppercase"><div className="col-span-4">Description</div><div className="col-span-2">Qty</div><div className="col-span-2">Unit Price</div><div className="col-span-2">Tax %</div><div className="col-span-1">Amount</div><div className="col-span-1"></div></div>
                            {form.items.map((item, i) => (
                                <div key={i} className="grid grid-cols-12 gap-2 items-center">
                                    <div className="col-span-4"><input type="text" required value={item.description} onChange={(e) => updateItem(i, 'description', e.target.value)} className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg" placeholder="Item description" /></div>
                                    <div className="col-span-2"><input type="number" min="0.01" step="0.01" required value={item.quantity} onChange={(e) => updateItem(i, 'quantity', e.target.value)} className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                                    <div className="col-span-2"><input type="number" min="0" step="0.01" required value={item.unit_price} onChange={(e) => updateItem(i, 'unit_price', e.target.value)} className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                                    <div className="col-span-2"><input type="number" min="0" max="100" step="0.01" value={item.tax_rate} onChange={(e) => updateItem(i, 'tax_rate', e.target.value)} className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg" /></div>
                                    <div className="col-span-1 text-sm font-semibold text-gray-900 text-right">TZS {Number(item.quantity * item.unit_price).toLocaleString()}</div>
                                    <div className="col-span-1">{form.items.length > 1 && <button type="button" onClick={() => removeItem(i)} className="p-1 text-gray-400 hover:text-red-500"><X size={14} /></button>}</div>
                                </div>
                            ))}
                        </div>
                        <button type="button" onClick={addItem} className="text-sm text-[#00D4AA] font-medium mb-4"><Plus size={14} className="inline" /> Add Item</button>
                        <div className="flex justify-end gap-3 mt-2">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : 'Create Bill'}</button>
                        </div>
                    </form>
                </div>
            )}

            {showPayModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
                        <p className="text-sm text-gray-600 mb-4">Bill: {showPayModal.bill_number} | Vendor: {showPayModal.vendor_name} | Balance: TZS {(Number(showPayModal.total) - Number(showPayModal.amount_paid)).toLocaleString()}</p>
                        <input type="number" min="0.01" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 mb-4" placeholder="Amount" />
                        <div className="flex justify-end gap-3"><button onClick={() => setShowPayModal(null)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button><button onClick={handlePay} className="px-5 py-2 text-sm font-medium text-white rounded-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>Pay</button></div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {[{v:'',l:'All'},{v:'draft',l:'Draft'},{v:'received',l:'Received'},{v:'paid',l:'Paid'},{v:'partial',l:'Partial'},{v:'overdue',l:'Overdue'}].map(s => <button key={s.v} onClick={() => setStatusFilter(s.v)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${statusFilter===s.v ? 'bg-[#00D4AA] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}>{s.l}</button>)}
            </div>

            {loading ? <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div> : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Bill #</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Vendor</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Date</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Due Date</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Total</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Paid</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Balance</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Status</th>
                                <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Actions</th>
                            </tr></thead>
                            <tbody>
                                {bills.length === 0 ? <tr><td colSpan={9} className="px-6 py-12 text-center text-gray-500 text-sm">No bills found</td></tr> : bills.map(bill => (
                                    <tr key={bill.id} className="border-b border-gray-50 hover:bg-gray-50">
                                        <td className="px-6 py-3 text-sm font-mono font-semibold text-[#00D4AA]">{bill.bill_number}</td>
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{bill.vendor_name}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{new Date(bill.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{new Date(bill.due_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">TZS {Number(bill.total).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-sm text-gray-600 text-right">TZS {Number(bill.amount_paid).toLocaleString()}</td>
                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900 text-right">TZS {Number(bill.total - bill.amount_paid).toLocaleString()}</td>
                                        <td className="px-6 py-3"><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_CLASSES[bill.status] || ''}`}>{bill.status}</span></td>
                                        <td className="px-6 py-3 text-right">{bill.status !== 'paid' && bill.status !== 'cancelled' && <button onClick={() => { setShowPayModal(bill); setPayAmount(String(Number(bill.total) - Number(bill.amount_paid))); }} className="px-3 py-1.5 text-xs font-medium text-white bg-[#00D4AA] rounded-lg hover:bg-[#00b894]">Pay</button>}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {lastPage > 1 && <div className="px-6 py-4 border-t border-gray-100"><Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} /></div>}
                </div>
            )}
        </div>
    );
}
