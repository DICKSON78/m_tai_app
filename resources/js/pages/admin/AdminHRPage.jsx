import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import Pagination from '../../components/Pagination';
import { Users, Shield, Activity, Search } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';

const ROLE_COLORS = {
    admin: 'bg-purple-50 text-purple-700',
    business_owner: 'bg-blue-50 text-blue-700',
    employee: 'bg-green-50 text-green-700',
    customer: 'bg-gray-50 text-gray-700',
    transporter: 'bg-orange-50 text-orange-700',
};

export default function AdminHRPage() {
    const [activeTab, setActiveTab] = useState('staff');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [summary, setSummary] = useState({});
    const [auditLogs, setAuditLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (roleFilter) params.role = roleFilter;
            const res = await api.get('/admin/users', { params });
            setUsers(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
            if (res.data?.summary) setSummary(res.data.summary);
        } catch { setUsers([]); } finally { setLoading(false); }
    };

    const fetchLogs = async () => {
        setLogsLoading(true);
        try {
            const res = await api.get('/admin/audit-logs', { params: { per_page: 50 } });
            setAuditLogs(res.data?.data || res.data || []);
        } catch { setAuditLogs([]); } finally { setLogsLoading(false); }
    };

    useEffect(() => {
        if (activeTab === 'staff') fetchStaff();
        else if (activeTab === 'activity') fetchLogs();
    }, [activeTab, currentPage, search, roleFilter]);

    useEffect(() => { setCurrentPage(1); }, [search, roleFilter]);

    return (
        <div className="space-y-6">
            <PageHeader title="HR & Operations" subtitle="Staff management, roles, and activity tracking" icon={<Users size={20} />} />

            <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1 w-fit">
                {[
                    { value: 'staff', label: 'Staff Directory', icon: Users },
                    { value: 'roles', label: 'Roles & Permissions', icon: Shield },
                    { value: 'activity', label: 'Activity Log', icon: Activity },
                ].map((tab) => (
                    <button key={tab.value} onClick={() => setActiveTab(tab.value)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.value ? 'bg-[#00D4AA] text-white shadow-md' : 'text-gray-600 hover:text-gray-900 hover:bg-white'}`}>
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'staff' && (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[
                            { label: 'TOTAL USERS', value: summary.total || 0, icon: Users, color: '#00D4AA' },
                            { label: 'ADMINS', value: summary.admins || 0, icon: Shield, color: '#8b5cf6' },
                            { label: 'OWNERS', value: summary.owners || 0, icon: Users, color: '#0ea5e9' },
                            { label: 'EMPLOYEES', value: summary.employees || 0, icon: Users, color: '#10b981' },
                            { label: 'TRANSPORTERS', value: summary.transporters || 0, icon: Users, color: '#f97316' },
                        ].map((s) => (
                            <div key={s.label} className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-gray-500 mb-1">{s.label}</p>
                                        <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                                    </div>
                                    <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                                        <s.icon className="w-6 h-6" style={{ color: s.color }} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                    <input type="text" placeholder="Search staff..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all" />
                                </div>
                                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/30 focus:border-[#00D4AA] transition-all">
                                    <option value="">All Roles</option>
                                    <option value="admin">Admin</option>
                                    <option value="business_owner">Business Owner</option>
                                    <option value="employee">Employee</option>
                                    <option value="customer">Customer</option>
                                    <option value="transporter">Transporter</option>
                                </select>
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                        ) : users.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 text-sm">No users found. Try adjusting your filters.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead><tr className="border-b border-gray-100">
                                        <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">User</th>
                                        <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Role</th>
                                        <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Phone</th>
                                        <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Joined</th>
                                    </tr></thead>
                                    <tbody>
                                        {users.map((u) => (
                                            <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-[#00D4AA]/10 flex items-center justify-center text-[#00D4AA] text-sm font-bold">{(u.name || '?')[0].toUpperCase()}</div>
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                                                            <p className="text-xs text-gray-500">{u.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${ROLE_COLORS[u.role] || 'bg-gray-50 text-gray-700'}`}>{u.role?.replace('_', ' ')}</span></td>
                                                <td className="px-6 py-3 text-sm text-gray-600">{u.phone || '-'}</td>
                                                <td className="px-6 py-3 text-sm text-gray-500">{new Date(u.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {lastPage > 1 && <div className="px-6 py-4 border-t border-gray-100"><Pagination currentPage={currentPage} lastPage={lastPage} onPageChange={setCurrentPage} /></div>}
                    </div>
                </>
            )}

            {activeTab === 'roles' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[
                        { role: 'Admin', desc: 'Full platform access. Manage all businesses, users, orders, subscriptions, and settings.', color: '#8b5cf6', count: summary.admins || 0 },
                        { role: 'Business Owner', desc: 'Manage their own business: products, orders, employees, customers, expenses, reports.', color: '#0ea5e9', count: summary.owners || 0 },
                        { role: 'Employee', desc: 'Assist in daily operations: view inventory, customers, deliveries, and record expenses.', color: '#10b981', count: summary.employees || 0 },
                        { role: 'Customer', desc: 'Browse shops, place orders, manage wishlist, track deliveries, and leave reviews.', color: '#6b7280', count: summary.customers || 0 },
                        { role: 'Transporter', desc: 'Accept and deliver orders, update delivery status, manage profile.', color: '#f97316', count: summary.transporters || 0 },
                    ].map((r) => (
                        <div key={r.role} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${r.color}15` }}><Shield size={16} style={{ color: r.color }} /></div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-900">{r.role}</h3>
                                        <p className="text-xs text-gray-500">{r.count} users</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6"><p className="text-sm text-gray-600">{r.desc}</p></div>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'activity' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><Activity size={16} className="text-[#00D4AA]" /></div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Activity Log</h3>
                                <p className="text-xs text-gray-500">Recent system activity</p>
                            </div>
                        </div>
                    </div>
                    {logsLoading ? (
                        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                    ) : auditLogs.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 text-sm">No activity logs yet.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead><tr className="border-b border-gray-100">
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Timestamp</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">User</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Action</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Details</th>
                                </tr></thead>
                                <tbody>
                                    {auditLogs.map((log, i) => (
                                        <tr key={log.id || i} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3 text-sm text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                                            <td className="px-6 py-3 text-sm font-medium text-gray-900">{log.user?.name || log.user_name || '-'}</td>
                                            <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">{log.action}</span></td>
                                            <td className="px-6 py-3 text-sm text-gray-600 max-w-xs truncate">{log.description || log.details || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
