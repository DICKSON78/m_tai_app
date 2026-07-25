import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { Shield, Search, User, Activity, FileText, Globe, Calendar, Clock, TrendingUp, CalendarDays, SlidersHorizontal, X } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';

const ACTION_BADGES = {
    created: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700',
    updated: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700',
    deleted: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700',
    login: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700',
    logout: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700',
    exported: 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700',
};

export default function AdminAuditLogsPage() {
    document.title = 'Audit Logs - M-Tai Admin';
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [action, setAction] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState({ total: 0, today: 0, this_week: 0 });

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 20 };
            if (search) params.search = search;
            if (action) params.action = action;
            const res = await api.get('/admin/audit-logs', { params });
            setLogs(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch { setLogs([]); } finally { setLoading(false); }
    }, [currentPage, search, action]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);
    useEffect(() => { setCurrentPage(1); }, [search, action]);

    return (
        <div className="space-y-6">
                <PageHeader
                    title="Audit Logs"
                    subtitle="Track all system activities and changes"
                    icon={<Shield size={20} />}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Total Logs</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-[#00D4AA]/10 flex items-center justify-center">
                                <Shield className="w-6 h-6 text-[#00D4AA]" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">Today</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.today}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                                <TrendingUp className="w-6 h-6 text-green-500" />
                            </div>
                        </div>
                    </div>
                    <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 mb-1">This Week</p>
                                <p className="text-2xl font-bold text-gray-900">{summary.this_week}</p>
                            </div>
                            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                                <CalendarDays className="w-6 h-6 text-blue-500" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                    <div className="flex items-center gap-3 mb-4">
                        <SlidersHorizontal className="w-5 h-5 text-gray-400" />
                        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search logs..." className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                        </div>
                        <div>
                            <select value={action} onChange={(e) => setAction(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                                <option value="">All Actions</option>
                                <option value="created">Created</option>
                                <option value="updated">Updated</option>
                                <option value="deleted">Deleted</option>
                                <option value="login">Login</option>
                                <option value="logout">Logout</option>
                            </select>
                        </div>
                        {(search || action) && (
                            <button onClick={() => { setSearch(''); setAction(''); }} className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all">
                                <X className="w-4 h-4" /> Reset
                            </button>
                        )}
                    </div>
                </div>

                <div className="card overflow-hidden bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-lg font-semibold text-gray-900">All Logs</h3>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                    ) : logs.length === 0 ? (
                        <div className="px-6 py-12 text-center">
                            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500 font-medium">No data available</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100">
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">User</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Action</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Description</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">IP Address</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {logs.map((row, i) => {
                                            const badge = ACTION_BADGES[row.action?.toLowerCase()] || 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700';
                                            return (
                                                <tr key={row.id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-3 text-sm font-medium text-gray-900">{row.user?.name || row.user_name || 'System'}</td>
                                                    <td className="px-6 py-3"><span className={badge}>{row.action || '-'}</span></td>
                                                    <td className="px-6 py-3 text-sm text-gray-600 max-w-[300px] truncate">{row.description || row.message || '-'}</td>
                                                    <td className="px-6 py-3"><span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{row.ip_address || row.ip || '-'}</span></td>
                                                    <td className="px-6 py-3 text-sm text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-500">{row.created_at ? new Date(row.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100">
                                <Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} />
                            </div>
                        </>
                    )}
                </div>
        </div>
    );
}