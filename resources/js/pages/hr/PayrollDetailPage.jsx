import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import HeroBanner from '../../components/casfeta/HeroBanner';
import DataItem from '../../components/casfeta/DataItem';
import EmptyState from '../../components/casfeta/EmptyState';
import { Wallet, Users, Calendar, Clock, DollarSign, PlayCircle, CreditCard } from 'lucide-react';

const STATUS_LABELS = {
    draft: { label: 'Draft', classes: 'bg-gray-100 text-gray-700' },
    processing: { label: 'Processing', classes: 'bg-yellow-100 text-yellow-700' },
    processed: { label: 'Processed', classes: 'bg-blue-100 text-blue-700' },
    paid: { label: 'Paid', classes: 'bg-green-100 text-green-700' },
};

const STATUS_COLORS = {
    draft: 'bg-gray-500',
    processing: 'bg-yellow-500',
    processed: 'bg-blue-500',
    paid: 'bg-green-500',
};

export default function PayrollDetailPage() {
    const navigate = useNavigate();
    const { id } = useParams();

    const [payroll, setPayroll] = useState(null);
    const [loading, setLoading] = useState(true);
    const [acting, setActing] = useState(false);

    const fetchPayroll = async () => {
        try {
            const res = await api.get(`/owner/hr/payrolls/${id}`);
            setPayroll(res.data?.data || res.data);
        } catch (error) {
            console.error('Failed to fetch payroll:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, [id]);

    const handleProcess = async () => {
        setActing(true);
        try {
            await api.post(`/owner/hr/payrolls/${id}/process`);
            fetchPayroll();
        } catch (error) {
            console.error('Failed to process payroll:', error);
            alert(error?.response?.data?.message || 'Failed to process payroll. Please try again.');
        } finally {
            setActing(false);
        }
    };

    const handlePay = async () => {
        setActing(true);
        try {
            await api.post(`/owner/hr/payrolls/${id}/pay`);
            fetchPayroll();
        } catch (error) {
            console.error('Failed to mark payroll as paid:', error);
            alert(error?.response?.data?.message || 'Failed to mark payroll as paid. Please try again.');
        } finally {
            setActing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div>
            </div>
        );
    }

    if (!payroll) {
        return (
            <EmptyState
                title="Payroll not found"
                description="The payroll you're looking for doesn't exist or has been removed."
                actionTo="/owner/hr/payroll"
                actionLabel="Back to Payroll"
            />
        );
    }

    const st = STATUS_LABELS[payroll.status] || { label: payroll.status, classes: 'bg-gray-100 text-gray-700' };
    const items = payroll.items || [];
    const period = payroll.period_start && payroll.period_end
        ? `${payroll.period_start} - ${payroll.period_end}`
        : '-';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Payroll Details"
                subtitle={payroll.name || `#${payroll.id}`}
                icon={<Wallet size={22} />}
                backTo="/owner/hr/payroll"
                actions={
                    <>
                        {payroll.status === 'draft' && (
                            <button
                                onClick={handleProcess}
                                disabled={acting}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] text-white font-medium rounded-lg hover:bg-[#00B894] transition-all duration-200 text-sm shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                <PlayCircle size={16} />
                                {acting ? 'Processing...' : 'Process'}
                            </button>
                        )}
                        {payroll.status === 'processed' && (
                            <button
                                onClick={handlePay}
                                disabled={acting}
                                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] text-white font-medium rounded-lg hover:bg-[#00B894] transition-all duration-200 text-sm shadow-md hover:shadow-lg disabled:opacity-50"
                            >
                                <CreditCard size={16} />
                                {acting ? 'Paying...' : 'Mark as Paid'}
                            </button>
                        )}
                    </>
                }
            />

            <HeroBanner
                icon={<Wallet size={36} />}
                name={payroll.name || `Payroll #${payroll.id}`}
                subtitle={period}
                status={st.label}
                statusColor={STATUS_COLORS[payroll.status] || 'bg-gray-500'}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><Wallet size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Payroll Information</h3>
                                    <p className="text-xs text-gray-500">Payroll details for this period</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DataItem label="Payroll Name" value={payroll.name || '-'} icon={<Wallet size={14} />} />
                                <DataItem
                                    label="Status"
                                    value={st.label}
                                    icon={<Clock size={14} />}
                                />
                                <DataItem label="Period" value={period} icon={<Calendar size={14} />} />
                                <DataItem label="Payment Date" value={payroll.payment_date || '-'} icon={<Calendar size={14} />} />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><Users size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Employee Items</h3>
                                    <p className="text-xs text-gray-500">{items.length} employee(s) in this payroll</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            {items.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">No items listed.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="re-table">
                                        <thead>
                                            <tr>
                                                <th>Employee</th>
                                                <th className="text-right">Base</th>
                                                <th className="text-right">Allow.</th>
                                                <th className="text-right">Bonus</th>
                                                <th className="text-right">Tax</th>
                                                <th className="text-right">Other</th>
                                                <th className="text-right">Net Pay</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {items.map((item) => (
                                                <tr key={item.id}>
                                                    <td>
                                                        <span className="font-medium text-gray-800">
                                                            {item.employee ? `${item.employee.first_name} ${item.employee.last_name}` : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="text-right text-gray-700">TZS {Number(item.base_salary || 0).toLocaleString()}</td>
                                                    <td className="text-right text-gray-700">TZS {Number(item.allowances || 0).toLocaleString()}</td>
                                                    <td className="text-right text-gray-700">TZS {Number(item.bonuses || 0).toLocaleString()}</td>
                                                    <td className="text-right text-red-600">TZS {Number(item.tax_deduction || 0).toLocaleString()}</td>
                                                    <td className="text-right text-red-600">TZS {Number(item.other_deductions || 0).toLocaleString()}</td>
                                                    <td className="text-right font-semibold text-gray-800">TZS {Number(item.net_pay || 0).toLocaleString()}</td>
                                                    <td>
                                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${item.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><DollarSign size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Summary</h3>
                                    <p className="text-xs text-gray-500">Payroll totals</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Total Gross</span>
                                <span className="text-sm font-semibold text-gray-900">TZS {Number(payroll.total_gross || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Total Deductions</span>
                                <span className="text-sm font-semibold text-red-500">TZS {Number(payroll.total_deductions || 0).toLocaleString()}</span>
                            </div>
                            <div className="border-t border-gray-200 pt-3 flex justify-between items-center">
                                <span className="text-gray-800 font-semibold text-sm">Total Net</span>
                                <span className="text-lg font-bold text-[#00D4AA]">TZS {Number(payroll.total_net || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><Clock size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Additional Details</h3>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-500">Employees</span>
                                    <span className="text-sm font-semibold text-gray-900">{items.length}</span>
                                </div>
                                {payroll.created_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Created</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {new Date(payroll.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                                {payroll.updated_at && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-500">Last Updated</span>
                                        <span className="text-sm font-semibold text-gray-900">
                                            {new Date(payroll.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
