import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { BarChart3, TrendingUp, TrendingDown, Wallet, Scale, FileText, Download, RefreshCw, Printer } from 'lucide-react';
import { printElementAsPdf } from '../../lib/utils';

const TABS = [
    { key: 'profit-loss', label: 'Profit & Loss', icon: TrendingUp },
    { key: 'balance-sheet', label: 'Balance Sheet', icon: Scale },
    { key: 'cash-flow', label: 'Cash Flow', icon: Wallet },
    { key: 'trial-balance', label: 'Trial Balance', icon: BarChart3 },
];

function fmt(n) { return Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

function ReportRow({ label, amount, indent, bold, color }) {
    return (
        <tr className={`border-b border-gray-50 hover:bg-gray-50 ${bold ? 'bg-gray-50' : ''}`}>
            <td className={`px-6 py-2.5 text-sm ${bold ? 'font-bold' : 'font-medium'} text-gray-900`} style={{ paddingLeft: indent ? `${(indent * 24) + 24}px` : '24px' }}>{label}</td>
            <td className={`px-6 py-2.5 text-sm text-right font-semibold ${color || 'text-gray-900'}`}>{amount !== undefined ? `TZS ${fmt(amount)}` : '-'}</td>
        </tr>
    );
}

function ReportSection({ title, items, totalLabel, indent = 0 }) {
    return (
        <>
            <tr className="border-b border-gray-100 bg-gray-50/50">
                <td colSpan={2} className="px-6 py-2.5 text-xs font-bold uppercase text-gray-500 tracking-wider" style={{ paddingLeft: `${(indent * 24) + 24}px` }}>{title}</td>
            </tr>
            {items?.map((item, i) => (
                <ReportRow key={i} label={item.name || item.label} amount={item.amount} indent={indent + 1} color={item.color} />
            ))}
            {totalLabel && (
                <ReportRow label={totalLabel} amount={items?.reduce((s, i) => s + Number(i.amount || 0), 0)} bold />
            )}
        </>
    );
}

export default function FinanceReportsPage() {
    const [activeTab, setActiveTab] = useState('profit-loss');
    const [loading, setLoading] = useState(false);
    const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0]);
    const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState(null);

    const fetchReport = useCallback(async () => {
        setLoading(true); setReportData(null);
        try {
            let res;
            if (activeTab === 'profit-loss') {
                res = await api.get('/owner/finance/reports/profit-loss', { params: { date_from: dateFrom, date_to: dateTo } });
            } else if (activeTab === 'balance-sheet') {
                res = await api.get('/owner/finance/reports/balance-sheet');
            } else if (activeTab === 'cash-flow') {
                res = await api.get('/owner/finance/reports/cash-flow', { params: { date_from: dateFrom, date_to: dateTo } });
            } else if (activeTab === 'trial-balance') {
                res = await api.get('/owner/finance/reports/trial-balance');
            }
            setReportData(res?.data || {});
        } catch (error) { console.error('Failed to fetch finance report:', error); setReportData(null); } finally { setLoading(false); }
    }, [activeTab, dateFrom, dateTo]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const renderProfitLoss = () => {
        if (!reportData) return <EmptyState />;
        const { revenue = [], expenses = [], total_revenue, total_expenses, net_profit } = reportData;
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Account</th>
                        <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Amount (TZS)</th>
                    </tr></thead>
                    <tbody>
                        <ReportSection title="Revenue / Income" items={revenue} totalLabel="Total Revenue" />
                        <ReportSection title="Expenses" items={expenses} totalLabel="Total Expenses" />
                        <tr className="border-t-2 border-gray-200 bg-gray-100">
                            <td className="px-6 py-3 text-sm font-bold text-gray-900">Net Profit / (Loss)</td>
                            <td className={`px-6 py-3 text-sm text-right font-bold ${Number(net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>TZS {fmt(net_profit)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const renderBalanceSheet = () => {
        if (!reportData) return <EmptyState />;
        const { assets = [], liabilities = [], equity = [], total_assets, total_liabilities, total_equity } = reportData;
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Account</th>
                        <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Amount (TZS)</th>
                    </tr></thead>
                    <tbody>
                        <ReportSection title="Assets" items={assets} totalLabel="Total Assets" />
                        <ReportSection title="Liabilities" items={liabilities} totalLabel="Total Liabilities" />
                        <ReportSection title="Equity" items={equity} totalLabel="Total Equity" />
                        <tr className="border-t-2 border-gray-200 bg-gray-100">
                            <td className="px-6 py-3 text-sm font-bold text-gray-900">Total Liabilities & Equity</td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">TZS {fmt((Number(total_liabilities) || 0) + (Number(total_equity) || 0))}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const renderCashFlow = () => {
        if (!reportData) return <EmptyState />;
        const { operating = [], investing = [], financing = [], opening_balance, closing_balance } = reportData;
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Account</th>
                        <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Amount (TZS)</th>
                    </tr></thead>
                    <tbody>
                        <ReportSection title="Operating Activities" items={operating} totalLabel="Net Operating Cash Flow" />
                        <ReportSection title="Investing Activities" items={investing} totalLabel="Net Investing Cash Flow" />
                        <ReportSection title="Financing Activities" items={financing} totalLabel="Net Financing Cash Flow" />
                        <tr className="border-t-2 border-gray-200 bg-gray-100">
                            <td className="px-6 py-3 text-sm font-bold text-gray-900">Opening Cash Balance</td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">TZS {fmt(opening_balance)}</td>
                        </tr>
                        <tr className="border-b border-gray-100 bg-gray-100">
                            <td className="px-6 py-3 text-sm font-bold text-gray-900">Closing Cash Balance</td>
                            <td className="px-6 py-3 text-sm text-right font-bold text-gray-900">TZS {fmt(closing_balance)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const renderTrialBalance = () => {
        if (!reportData) return <EmptyState />;
        const { accounts = [], total_debit, total_credit } = reportData;
        return (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead><tr className="border-b border-gray-100">
                        <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Code</th>
                        <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Account Name</th>
                        <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Debit (TZS)</th>
                        <th className="text-right px-6 py-3 font-medium text-gray-500 text-xs uppercase">Credit (TZS)</th>
                    </tr></thead>
                    <tbody>
                        {accounts.length === 0 ? <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">No accounts found</td></tr> : accounts.map((acc, i) => (
                            <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                                <td className="px-6 py-2.5 text-sm font-mono text-gray-600">{acc.code}</td>
                                <td className="px-6 py-2.5 text-sm font-medium text-gray-900">{acc.name}</td>
                                <td className="px-6 py-2.5 text-sm text-right font-semibold text-red-600">{Number(acc.debit) > 0 ? fmt(acc.debit) : '-'}</td>
                                <td className="px-6 py-2.5 text-sm text-right font-semibold text-green-600">{Number(acc.credit) > 0 ? fmt(acc.credit) : '-'}</td>
                            </tr>
                        ))}
                        <tr className="border-t-2 border-gray-200 bg-gray-100 font-bold">
                            <td colSpan={2} className="px-6 py-3 text-sm text-gray-900">Total</td>
                            <td className="px-6 py-3 text-sm text-right text-red-600">TZS {fmt(total_debit)}</td>
                            <td className="px-6 py-3 text-sm text-right text-green-600">TZS {fmt(total_credit)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const EmptyState = () => (
        <div className="text-center py-12 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-sm">No report data available</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <PageHeader title="Financial Reports" subtitle="View detailed financial statements and reports" icon={<BarChart3 size={20} />}
                actions={<div className="flex items-center gap-2"><button onClick={() => printElementAsPdf('report-results-root', `${activeTab.replace('-', ' ')} Report`)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-gray-700 border border-gray-200 bg-white hover:bg-gray-50"><Printer size={16} /> Print / Save as PDF</button><button onClick={fetchReport} disabled={loading} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh</button></div>} />

            <div className="flex flex-wrap gap-2">
                {TABS.map(tab => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                        className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        style={activeTab === tab.key ? { background: 'linear-gradient(135deg, #00D4AA, #00b894)' } : {}}>
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {(activeTab === 'profit-loss' || activeTab === 'cash-flow') && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex flex-wrap items-end gap-4">
                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">From</label>
                            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                        </div>
                        <div><label className="text-sm font-medium text-gray-700 mb-1 block">To</label>
                            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                        </div>
                        <button onClick={fetchReport} disabled={loading} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            {loading ? 'Loading...' : 'Generate Report'}
                        </button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center h-64 items-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4AA]"></div>
                </div>
            ) : (
                <div id="report-results-root">
                    {activeTab === 'profit-loss' && renderProfitLoss()}
                    {activeTab === 'balance-sheet' && renderBalanceSheet()}
                    {activeTab === 'cash-flow' && renderCashFlow()}
                    {activeTab === 'trial-balance' && renderTrialBalance()}
                </div>
            )}
        </div>
    );
}
