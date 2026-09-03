import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import SummaryBox from '../../components/casfeta/SummaryBox';
import EmptyState from '../../components/casfeta/EmptyState';
import { BarChart3, DollarSign, ShoppingCart, TrendingUp, Package, Users, Calendar, Clock, Printer, FileDown } from 'lucide-react';

const REPORT_TABS = [
    { key: 'kpis', label: 'KPIs' },
    { key: 'sales', label: 'Sales' },
    { key: 'profit', label: 'Profit' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'inventory', label: 'Inventory' },
    { key: 'customers', label: 'Customers' },
];

export default function ReportPage() {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [activeTab, setActiveTab] = useState('sales');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [reportData, setReportData] = useState(null);

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch((error) => { console.error('Failed to fetch businesses:', error); setBusinesses([]); });
    }, []);

    const fetchReport = useCallback(async () => {
        if (!selectedBusiness) { setReportData(null); return; }
        setLoading(true); setReportData(null);
        try {
            const params = {};
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const res = await api.get(`/owner/businesses/${selectedBusiness}/reports/${activeTab}`, { params });
            setReportData(res.data?.data || res.data || null);
        } catch (error) { console.error('Failed to fetch report:', error); setReportData(null); } finally { setLoading(false); }
    }, [selectedBusiness, activeTab, dateFrom, dateTo]);

    useEffect(() => { fetchReport(); }, [fetchReport]);

    const formatCurrency = (val) => `TZS ${Number(val || 0).toLocaleString()}`;

    const exportCurrentReport = () => {
        const el = document.getElementById('report-results');
        if (!el) return;
        const win = window.open('', '_blank');
        if (!win) return;
        const tab = REPORT_TABS.find(t => t.key === activeTab)?.label || activeTab;
        win.document.write(`<html><head><title>${tab} Report</title><style>
            body{font-family:'Poppins',sans-serif;color:#333;padding:24px;}
            h1{font-size:20px;margin:0 0 4px;} .sub{color:#666;font-size:12px;margin-bottom:16px;}
            table{width:100%;border-collapse:collapse;margin-top:12px;} td,th{padding:8px;border-bottom:1px solid #eee;text-align:left;font-size:13px;}
            th{background:#f5f5f5;} .stat{display:inline-block;margin-right:16px;margin-bottom:12px;}
            .stat .lbl{font-size:11px;color:#999;} .stat .val{font-size:18px;font-weight:700;}
        </style></head><body>
            <h1>${tab} Report</h1>
            <div class="sub">${formatCurrency(reportData?.total_sales) !== 'TZS 0' || activeTab !== 'sales' ? '' : ''}Period: ${reportData?.date_from || 'N/A'} → ${reportData?.date_to || 'N/A'} · Generated: ${new Date().toLocaleString()}</div>
            <div id="report-copy"></div>
            <script>document.addEventListener('DOMContentLoaded',init);function init(){
                var src=opener.document.getElementById('report-results').cloneNode(true);
                src.querySelectorAll('input,select,button').forEach(function(b){b.remove()});
                document.getElementById('report-copy').appendChild(src);
                setTimeout(function(){window.print()},700); }
            <\/script>
        </body></html>`);
        win.document.close();
    };

    const renderBarChart = (items, valueKey, labelKey, color = 'bg-[#00D4AA]') => {
        if (!items || items.length === 0) return <p className="text-gray-400 text-sm">No data available.</p>;
        const max = Math.max(...items.map((item) => Number(item[valueKey] || 0)), 1);
        return (
            <div className="space-y-3">
                {items.map((item, i) => {
                    const val = Number(item[valueKey] || 0);
                    const pct = (val / max) * 100;
                    return (
                        <div key={i} className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600 w-32 text-right truncate">{item[labelKey] || '-'}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
                                <div className={`${color} h-full rounded-full transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }} />
                            </div>
                            <span className="text-sm font-semibold text-gray-700 w-24 text-right">{formatCurrency(val)}</span>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Reports" subtitle="Analyze your business performance with detailed reports." icon={<BarChart3 size={20} />} />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Business</label>
                <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                    <option value="">-- Select Business --</option>
                    {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name}</option>))}
                </select>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <SectionHeader icon={<Calendar size={18} />} title="Date Range" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Start Date</label>
                        <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">End Date</label>
                        <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                    </div>
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                {REPORT_TABS.map((tab) => (
                    <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.key ? 'bg-[#00D4AA] text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {!selectedBusiness ? (
                <EmptyState title="Select a business" description="Choose a business from the dropdown above to view reports." />
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : !reportData ? (
                <EmptyState title="No report data" description="No report data available for the selected period." />
            ) : (
                <>
                    <div className="flex items-center justify-end mb-2">
                        <button onClick={exportCurrentReport} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
                            <FileDown size={16} /> Print / Save as PDF
                        </button>
                    </div>
                    <div id="report-results">
                    {activeTab === 'kpis' && (() => {
                        const k = reportData?.kpis || reportData || {};
                        const kpiDefs = [
                            { key: 'opening_capital', label: 'Opening Capital', icon: <DollarSign size={18} />, color: 'text-[#00D4AA]' },
                            { key: 'initial_day_capital', label: 'Initial Day Capital', icon: <DollarSign size={18} />, color: 'text-blue-600' },
                            { key: 'grand_daily_sales', label: 'GDS (Grand Daily Sales)', icon: <TrendingUp size={18} />, color: 'text-[#00B894]' },
                            { key: 'grand_daily_expenditure', label: 'GDE (Grand Daily Expenditure)', icon: <TrendingUp size={18} />, color: 'text-red-600' },
                            { key: 'grand_total_profit', label: 'GTP (Grand Total Profit)', icon: <TrendingUp size={18} />, color: 'text-[#00D4AA]' },
                            { key: 'grand_daily_profit', label: 'GDP (Grand Daily Profit)', icon: <TrendingUp size={18} />, color: 'text-[#00B894]' },
                            { key: 'perfect_profit', label: 'Perfect Profit', icon: <TrendingUp size={18} />, color: 'text-[#00D4AA]' },
                        ];
                        return (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {kpiDefs.map((def) => (
                                        <SummaryBox key={def.key} icon={def.icon} label={def.label} value={formatCurrency(k[def.key])} color={def.color} />
                                    ))}
                                    <SummaryBox icon={<TrendingUp size={18} />} label="Profit Margin" value={`${Number(k.profit_margin || 0).toFixed(1)}%`} color="text-[#00D4AA]" />
                                </div>
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <SectionHeader icon={<BarChart3 size={18} />} title="KPI Formula (System)" />
                                    <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm space-y-2">
                                        <div className="text-gray-700">GDS - COGS = <span className="font-semibold text-[#00B894]">GTP (Grand Total Profit)</span></div>
                                        <div className="text-gray-700">GTP - GDE = <span className="font-semibold text-[#00D4AA]">GDP (Grand Daily Profit)</span></div>
                                        <div className="border-t pt-2 text-gray-700">GDP = <span className="font-semibold text-[#00D4AA]">Perfect Profit</span></div>
                                        <div className="text-gray-700">Profit Margin = <span className="font-semibold">{Number(k.profit_margin || 0).toFixed(1)}%</span> (GDP / GDS × 100)</div>
                                        <div className="border-t pt-2 text-xs text-gray-400">Period: {reportData.period} · {reportData.date_from} → {reportData.date_to}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {activeTab === 'sales' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <SummaryBox icon={<DollarSign size={18} />} label="Total Revenue" value={formatCurrency(reportData.total_sales)} color="text-[#00D4AA]" />
                                <SummaryBox icon={<ShoppingCart size={18} />} label="Order Count" value={reportData.total_orders || 0} color="text-blue-600" />
                                <SummaryBox icon={<TrendingUp size={18} />} label="Avg per Order" value={formatCurrency(reportData.average_order_value)} color="text-yellow-600" />
                            </div>
                            {reportData.breakdown && reportData.breakdown.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <SectionHeader icon={<BarChart3 size={18} />} title="Sales Breakdown" />
                                    {renderBarChart(reportData.breakdown, 'total', 'date', 'bg-[#00D4AA]')}
                                </div>
                            )}
                            {reportData.breakdown && reportData.breakdown.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead><tr className="border-b border-gray-200 bg-gray-50/50">
                                                <th className="text-left px-6 py-3 font-semibold text-gray-600">Date</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Total</th>
                                                <th className="text-right px-6 py-3 font-semibold text-gray-600">Count</th>
                                            </tr></thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {reportData.breakdown.map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                                                        <td className="px-6 py-4 text-gray-600">{row.date || '-'}</td>
                                                        <td className="px-6 py-4 text-right font-semibold text-gray-800">{formatCurrency(row.total)}</td>
                                                        <td className="px-6 py-4 text-right text-gray-600">{row.count || 0}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'profit' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                <SummaryBox icon={<DollarSign size={18} />} label="Revenue" value={formatCurrency(reportData.revenue)} color="text-[#00D4AA]" />
                                <SummaryBox icon={<Package size={18} />} label="Cost of Goods" value={formatCurrency(reportData.cost_of_goods)} color="text-red-600" />
                                <SummaryBox icon={<DollarSign size={18} />} label="Other Expenses" value={formatCurrency(reportData.expenses)} color="text-yellow-600" />
                                <SummaryBox icon={<TrendingUp size={18} />} label="Gross Profit" value={formatCurrency(reportData.gross_profit)} color="text-[#00B894]" />
                                <SummaryBox icon={<TrendingUp size={18} />} label="Net Profit" value={formatCurrency(reportData.net_profit)} color="text-[#00D4AA]" />
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                <SectionHeader icon={<BarChart3 size={18} />} title="Profit Formula" />
                                <div className="bg-gray-50 rounded-xl p-4 font-mono text-sm space-y-2">
                                    <div className="text-gray-700">Revenue: <span className="font-semibold">{formatCurrency(reportData.revenue)}</span></div>
                                    <div className="text-gray-700">- Cost of Goods: <span className="font-semibold">{formatCurrency(reportData.cost_of_goods)}</span></div>
                                    <div className="text-gray-700">= Gross Profit: <span className="font-semibold text-[#00D4AA]">{formatCurrency(reportData.gross_profit)}</span></div>
                                    <div className="border-t pt-2 text-gray-700">- Other Expenses: <span className="font-semibold">{formatCurrency(reportData.expenses)}</span></div>
                                    <div className="text-gray-700 font-bold">= Net Profit: <span className="text-[#00D4AA]">{formatCurrency(reportData.net_profit)}</span></div>
                                </div>
                                {reportData.profit_margin !== undefined && (
                                    <div className="mt-4">
                                        <p className="text-sm text-gray-500">Profit Margin</p>
                                        <p className="text-2xl font-bold text-gray-800">{Number(reportData.profit_margin || 0).toFixed(1)}%</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <SummaryBox icon={<DollarSign size={18} />} label="Total Expenses" value={formatCurrency(reportData.total_expenses)} color="text-red-600" />
                                <SummaryBox icon={<Clock size={18} />} label="Daily" value={formatCurrency(reportData.daily_expenses)} color="text-yellow-600" />
                                <SummaryBox icon={<Calendar size={18} />} label="Monthly" value={formatCurrency(reportData.monthly_expenses)} color="text-[#00D4AA]" />
                            </div>
                            {reportData.by_category && reportData.by_category.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <SectionHeader icon={<BarChart3 size={18} />} title="Expenses by Category" />
                                    {renderBarChart(reportData.by_category, 'total', 'category', 'bg-red-500')}
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <SummaryBox icon={<Package size={18} />} label="Total Products" value={reportData.total_products || 0} color="text-[#00D4AA]" />
                                <SummaryBox icon={<DollarSign size={18} />} label="Stock Value" value={formatCurrency(reportData.total_stock_value)} color="text-yellow-600" />
                                <SummaryBox icon={<TrendingUp size={18} />} label="Fast Moving" value={reportData.fast_moving_count || 0} color="text-[#00B894]" />
                            </div>
                            {reportData.by_stock_level && (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <SectionHeader icon={<Package size={18} />} title="Products by Stock Level" />
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                        {[
                                            { key: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-700' },
                                            { key: 'low', label: 'Low', color: 'bg-orange-100 text-orange-700' },
                                            { key: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
                                            { key: 'healthy', label: 'Good', color: 'bg-[#00D4AA]/10 text-[#00B894]' },
                                        ].map(({ key, label, color }) => (
                                            <div key={key} className={`rounded-xl p-4 text-center ${color}`}>
                                                <p className="text-2xl font-bold">{reportData.by_stock_level[key] || 0}</p>
                                                <p className="text-sm mt-1">{label}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'customers' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SummaryBox icon={<Users size={18} />} label="Total Customers" value={reportData.total_customers || 0} color="text-[#00D4AA]" />
                                <SummaryBox icon={<Users size={18} />} label="Returning" value={reportData.returning_customers || 0} color="text-[#00B894]" />
                            </div>
                            {reportData.top_customers && reportData.top_customers.length > 0 && (
                                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                                    <SectionHeader icon={<BarChart3 size={18} />} title="Top Customers by Spending" />
                                    {renderBarChart(reportData.top_customers, 'total_spent', 'name', 'bg-[#00D4AA]')}
                                </div>
                            )}
                        </div>
                    )}
                    </div>
                </>
            )}
        </div>
    );
}
