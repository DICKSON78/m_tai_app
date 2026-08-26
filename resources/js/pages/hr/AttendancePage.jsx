import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import Pagination from '../../components/Pagination';
import { Clock, Search, CheckCircle, XCircle, AlertTriangle, Filter, RotateCcw, Calendar } from 'lucide-react';

const STATUS_OPTIONS = [
    { value: '', label: 'All Statuses' },
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'on_leave', label: 'On Leave' },
];

const STATUS_LABELS = {
    present: { label: 'Present', classes: 'bg-green-100 text-green-700', icon: <CheckCircle size={12} /> },
    absent: { label: 'Absent', classes: 'bg-red-100 text-red-700', icon: <XCircle size={12} /> },
    late: { label: 'Late', classes: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle size={12} /> },
    on_leave: { label: 'On Leave', classes: 'bg-blue-100 text-blue-700', icon: <Calendar size={12} /> },
    half_day: { label: 'Half Day', classes: 'bg-orange-100 text-orange-700', icon: <AlertTriangle size={12} /> },
};

const fullName = (emp) => emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : '';

export default function AttendancePage() {
    document.title = 'Attendance - M-TAI';
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            if (statusFilter) params.status = statusFilter;
            if (dateFrom) params.date_from = dateFrom;
            if (dateTo) params.date_to = dateTo;
            const res = await api.get('/owner/hr/attendance', { params });
            setRecords(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch (error) { console.error('Failed to fetch attendance:', error); setRecords([]); } finally { setLoading(false); }
    }, [currentPage, search, statusFilter, dateFrom, dateTo]);

    useEffect(() => { fetchAttendance(); }, [fetchAttendance]);
    useEffect(() => { setCurrentPage(1); }, [search, statusFilter, dateFrom, dateTo]);

    const stats = { present: 0, absent: 0, late: 0, on_leave: 0 };
    records.forEach(r => { if (stats[r.status] !== undefined) stats[r.status]++; });

    const handleReset = () => { setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo(''); };
    const inputClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm";

    return (
        <div className="space-y-0">
            <PageHeader title="Attendance" subtitle="Track employee attendance" icon={<Clock size={20} />} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Present</p><p className="text-2xl font-bold text-gray-900">{stats.present}</p></div>
                    <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0"><CheckCircle size={22} className="text-green-500" /></div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Absent</p><p className="text-2xl font-bold text-gray-900">{stats.absent}</p></div>
                    <div className="h-12 w-12 bg-red-50 rounded-xl flex items-center justify-center shrink-0"><XCircle size={22} className="text-red-500" /></div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Late</p><p className="text-2xl font-bold text-gray-900">{stats.late}</p></div>
                    <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0"><AlertTriangle size={22} className="text-yellow-500" /></div>
                </div>
                <div className="stat-card bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex items-center justify-between">
                    <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">On Leave</p><p className="text-2xl font-bold text-gray-900">{stats.on_leave}</p></div>
                    <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"><Calendar size={22} className="text-blue-500" /></div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center mb-4">
                    <Filter size={14} className="text-[#00D4AA] mr-2" /> Filters
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by employee name..." className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                    </div>
                    <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={`${inputClasses} w-auto`} />
                    <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={`${inputClasses} w-auto`} />
                    <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                        {STATUS_OPTIONS.map((o) => (<option key={o.value} value={o.value}>{o.label}</option>))}
                    </select>
                    <button onClick={handleReset} className="px-4 py-2.5 text-sm text-gray-500 hover:text-[#00D4AA] transition-colors flex items-center gap-1.5 border border-gray-200 rounded-lg hover:border-[#00D4AA]/30">
                        <RotateCcw size={12} /> Reset
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Attendance Records ({records.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Employee</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Date</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Clock In</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Clock Out</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Hours</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {records.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center"><Clock size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No attendance records found</p></td></tr>
                                ) : records.map((row) => {
                                    const st = STATUS_LABELS[row.status] || { label: row.status, classes: 'bg-gray-100 text-gray-700', icon: null };
                                    const empName = fullName(row.employee);
                                    const initial = empName ? empName[0] : (row.employee?.employee_number || '?')[0];
                                    return (
                                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] flex items-center justify-center text-xs font-bold uppercase">{initial?.toUpperCase()}</div>
                                                    <div>
                                                        <span className="font-medium text-gray-800">{empName || row.employee?.employee_number || '-'}</span>
                                                        {row.employee?.employee_number && <p className="text-xs text-gray-400">{row.employee.employee_number}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3 text-sm text-gray-600">{row.date || '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-700">{row.clock_in || '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-700">{row.clock_out || '-'}</td>
                                            <td className="px-6 py-3 text-sm text-gray-700">{row.hours_worked ? `${Number(row.hours_worked).toFixed(1)}h` : '-'}</td>
                                            <td className="px-6 py-3">
                                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${st.classes}`}>
                                                    {st.icon}{st.label}
                                                </span>
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
        </div>
    );
}
