import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import Pagination from '../../components/Pagination';
import Modal from '../../components/Modal';
import ConfirmDialog from '../../components/ConfirmDialog';
import { Calendar, Plus, Search, CheckCircle, XCircle } from 'lucide-react';

const REQUEST_STATUS_LABELS = {
    pending: { label: 'Pending', classes: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Approved', classes: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', classes: 'bg-red-100 text-red-700' },
};

const emptyLeaveType = { name: '', days_per_year: '', is_paid: true };
const emptyLeaveRequest = { employee_id: '', leave_type_id: '', start_date: '', end_date: '', reason: '' };
const fullName = (emp) => emp ? `${emp.first_name || ''} ${emp.last_name || ''}`.trim() : '';

export default function LeaveManagementPage() {
    document.title = 'Leave Management - M-TAI';
    const [activeTab, setActiveTab] = useState('requests');
    const [leaveTypes, setLeaveTypes] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);

    const [typeModalOpen, setTypeModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [typeForm, setTypeForm] = useState(emptyLeaveType);
    const [typeSubmitting, setTypeSubmitting] = useState(false);
    const [typeErrors, setTypeErrors] = useState({});

    const [requestModalOpen, setRequestModalOpen] = useState(false);
    const [requestForm, setRequestForm] = useState(emptyLeaveRequest);
    const [requestSubmitting, setRequestSubmitting] = useState(false);
    const [requestErrors, setRequestErrors] = useState({});

    const [deleteId, setDeleteId] = useState(null);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const fetchEmployees = useCallback(async () => {
        try { const res = await api.get('/owner/hr/employees', { params: { per_page: 200, status: 'active' } }); setEmployees(res.data?.data || []); } catch { setEmployees([]); }
    }, []);

    const fetchLeaveTypes = useCallback(async () => {
        try { const res = await api.get('/owner/hr/leave-types'); setLeaveTypes(res.data?.data || res.data || []); } catch { setLeaveTypes([]); }
    }, []);

    const fetchLeaveRequests = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page: currentPage, per_page: 15 };
            if (search) params.search = search;
            const res = await api.get('/owner/hr/leave-requests', { params });
            setLeaveRequests(res.data?.data || []);
            setCurrentPage(res.data?.current_page || 1);
            setLastPage(res.data?.last_page || 1);
        } catch { setLeaveRequests([]); } finally { setLoading(false); }
    }, [currentPage, search]);

    useEffect(() => { fetchEmployees(); fetchLeaveTypes(); }, [fetchEmployees, fetchLeaveTypes]);
    useEffect(() => { fetchLeaveRequests(); }, [fetchLeaveRequests]);
    useEffect(() => { setCurrentPage(1); }, [search]);

    const openCreateType = () => { setEditingType(null); setTypeForm(emptyLeaveType); setTypeErrors({}); setTypeModalOpen(true); };
    const openEditType = (lt) => { setEditingType(lt); setTypeForm({ name: lt.name || '', days_per_year: lt.days_per_year || '', is_paid: lt.is_paid !== false }); setTypeErrors({}); setTypeModalOpen(true); };
    const closeTypeModal = () => { setTypeModalOpen(false); setEditingType(null); setTypeForm(emptyLeaveType); setTypeErrors({}); };

    const handleTypeSubmit = async (e) => {
        e.preventDefault(); setTypeSubmitting(true); setTypeErrors({});
        try {
            if (editingType) { await api.put(`/owner/hr/leave-types/${editingType.id}`, typeForm); }
            else { await api.post('/owner/hr/leave-types', typeForm); }
            closeTypeModal(); fetchLeaveTypes();
        } catch (err) { if (err.response?.status === 422) setTypeErrors(err.response.data?.errors || {}); else alert(err.response?.data?.message || 'Failed'); } finally { setTypeSubmitting(false); }
    };

    const handleDeleteType = async () => {
        if (!deleteId) return;
        try { await api.delete(`/owner/hr/leave-types/${deleteId}`); setConfirmOpen(false); setDeleteId(null); fetchLeaveTypes(); } catch {}
    };

    const openRequestModal = () => { setRequestForm(emptyLeaveRequest); setRequestErrors({}); setRequestModalOpen(true); };
    const closeRequestModal = () => { setRequestModalOpen(false); setRequestForm(emptyLeaveRequest); setRequestErrors({}); };

    const handleRequestSubmit = async (e) => {
        e.preventDefault(); setRequestSubmitting(true); setRequestErrors({});
        try { await api.post('/owner/hr/leave-requests', requestForm); closeRequestModal(); fetchLeaveRequests(); }
        catch (err) { if (err.response?.status === 422) setRequestErrors(err.response.data?.errors || {}); else alert(err.response?.data?.message || 'Failed'); } finally { setRequestSubmitting(false); }
    };

    const handleApprove = async (id) => { try { await api.post(`/owner/hr/leave-requests/${id}/approve`); fetchLeaveRequests(); } catch {} };
    const handleReject = async (id) => { try { await api.post(`/owner/hr/leave-requests/${id}/reject`); fetchLeaveRequests(); } catch {} };

    const inputClasses = "w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm";

    return (
        <div className="space-y-0">
            <PageHeader title="Leave Management" subtitle="Manage time off requests" icon={<Calendar size={20} />}
                actions={
                    <div className="flex gap-2">
                        {activeTab === 'requests' && <button onClick={openRequestModal} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} />New Request</button>}
                        {activeTab === 'types' && <button onClick={openCreateType} className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-medium rounded-xl transition-all duration-200 shadow-md hover:shadow-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} />New Leave Type</button>}
                    </div>
                } />

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-6">
                <div className="flex gap-2">
                    <button onClick={() => setActiveTab('requests')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'requests' ? 'bg-[#00D4AA] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Leave Requests</button>
                    <button onClick={() => setActiveTab('types')} className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'types' ? 'bg-[#00D4AA] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>Leave Types</button>
                </div>
            </div>

            {activeTab === 'types' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                    <div className="px-6 py-4 border-b border-gray-100">
                        <h3 className="text-sm font-semibold text-gray-900">Leave Types ({leaveTypes.length})</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Name</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Days/Year</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Paid</th>
                                    <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaveTypes.length === 0 ? (
                                    <tr><td colSpan={4} className="px-6 py-12 text-center"><Calendar size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No leave types found</p></td></tr>
                                ) : leaveTypes.map((lt) => (
                                    <tr key={lt.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-800">{lt.name}</td>
                                        <td className="px-6 py-3 text-sm text-gray-700">{lt.days_per_year || '-'}</td>
                                        <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lt.is_paid ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{lt.is_paid ? 'Paid' : 'Unpaid'}</span></td>
                                        <td className="px-6 py-3">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => openEditType(lt)} className="h-8 w-8 bg-[#00D4AA]/10 text-[#00D4AA] rounded-lg flex items-center justify-center hover:bg-[#00D4AA]/20 transition-all" title="Edit"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                                                <button onClick={() => { setDeleteId(lt.id); setConfirmOpen(true); }} className="h-8 w-8 bg-red-100 text-red-600 rounded-lg flex items-center justify-center hover:bg-red-200 transition-all" title="Delete"><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <>
                    {loading ? (
                        <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-6">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <h3 className="text-sm font-semibold text-gray-900">Leave Requests ({leaveRequests.length})</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Employee</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Type</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Start</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">End</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Days</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Status</th>
                                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaveRequests.length === 0 ? (
                                            <tr><td colSpan={7} className="px-6 py-12 text-center"><Calendar size={40} className="mx-auto text-gray-300 mb-3" /><p className="text-sm text-gray-500">No leave requests found</p></td></tr>
                                        ) : leaveRequests.map((req) => {
                                            const st = REQUEST_STATUS_LABELS[req.status] || { label: req.status, classes: 'bg-gray-100 text-gray-700' };
                                            return (
                                                <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-[#00D4AA]/10 text-[#00D4AA] flex items-center justify-center text-xs font-bold uppercase">{(fullName(req.employee) || '?')[0]?.toUpperCase()}</div>
                                                            <span className="font-medium text-gray-800">{fullName(req.employee) || '-'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">{req.leave_type?.name || '-'}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">{req.start_date || '-'}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-600">{req.end_date || '-'}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-700">{req.days || '-'}</td>
                                                    <td className="px-6 py-3"><span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${st.classes}`}>{st.label}</span></td>
                                                    <td className="px-6 py-3">
                                                        {req.status === 'pending' ? (
                                                            <div className="flex items-center gap-2">
                                                                <button onClick={() => handleApprove(req.id)} className="h-8 px-3 bg-green-100 text-green-700 rounded-lg flex items-center gap-1 text-xs font-medium hover:bg-green-200 transition-all"><CheckCircle size={12} />Approve</button>
                                                                <button onClick={() => handleReject(req.id)} className="h-8 px-3 bg-red-100 text-red-700 rounded-lg flex items-center gap-1 text-xs font-medium hover:bg-red-200 transition-all"><XCircle size={12} />Reject</button>
                                                            </div>
                                                        ) : <span className="text-xs text-gray-400">-</span>}
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
                </>
            )}

            <Modal isOpen={typeModalOpen} onClose={closeTypeModal} title={editingType ? 'Edit Leave Type' : 'New Leave Type'} size="md">
                <form onSubmit={handleTypeSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Name <span className="text-red-500">*</span></label>
                        <input type="text" name="name" value={typeForm.name} onChange={(e) => setTypeForm(prev => ({ ...prev, name: e.target.value }))} required className={`${inputClasses} ${typeErrors.name ? 'border-red-500' : ''}`} placeholder="e.g. Annual Leave" />
                        {typeErrors.name && <p className="mt-1.5 text-sm text-red-600">{typeErrors.name[0]}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Days Per Year <span className="text-red-500">*</span></label>
                        <input type="number" name="days_per_year" value={typeForm.days_per_year} onChange={(e) => setTypeForm(prev => ({ ...prev, days_per_year: e.target.value }))} min="1" required className={`${inputClasses} ${typeErrors.days_per_year ? 'border-red-500' : ''}`} placeholder="e.g. 30" />
                        {typeErrors.days_per_year && <p className="mt-1.5 text-sm text-red-600">{typeErrors.days_per_year[0]}</p>}
                    </div>
                    <div className="flex items-center gap-3">
                        <label className="text-sm font-semibold text-gray-900">Paid:</label>
                        <button type="button" onClick={() => setTypeForm(prev => ({ ...prev, is_paid: !prev.is_paid }))} className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ${typeForm.is_paid ? 'bg-[#00D4AA]' : 'bg-gray-200'}`}>
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${typeForm.is_paid ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                        <span className="text-sm text-gray-600">{typeForm.is_paid ? 'Paid' : 'Unpaid'}</span>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={closeTypeModal} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
                        <button type="submit" disabled={typeSubmitting} className="px-6 py-2.5 font-bold text-white rounded-lg disabled:opacity-50 text-sm" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            {typeSubmitting ? 'Processing...' : editingType ? 'Save Changes' : 'Create'}
                        </button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={requestModalOpen} onClose={closeRequestModal} title="New Leave Request" size="md">
                <form onSubmit={handleRequestSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Employee <span className="text-red-500">*</span></label>
                        <select name="employee_id" value={requestForm.employee_id} onChange={(e) => setRequestForm(prev => ({ ...prev, employee_id: e.target.value }))} required className={`${inputClasses} ${requestErrors.employee_id ? 'border-red-500' : ''}`}>
                            <option value="">Select employee</option>
                            {employees.map(e => <option key={e.id} value={e.id}>{e.first_name} {e.last_name}</option>)}
                        </select>
                        {requestErrors.employee_id && <p className="mt-1.5 text-sm text-red-600">{requestErrors.employee_id[0]}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Leave Type <span className="text-red-500">*</span></label>
                        <select name="leave_type_id" value={requestForm.leave_type_id} onChange={(e) => setRequestForm(prev => ({ ...prev, leave_type_id: e.target.value }))} required className={`${inputClasses} ${requestErrors.leave_type_id ? 'border-red-500' : ''}`}>
                            <option value="">Select type</option>
                            {leaveTypes.map((lt) => (<option key={lt.id} value={lt.id}>{lt.name}</option>))}
                        </select>
                        {requestErrors.leave_type_id && <p className="mt-1.5 text-sm text-red-600">{requestErrors.leave_type_id[0]}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Start Date <span className="text-red-500">*</span></label>
                            <input type="date" name="start_date" value={requestForm.start_date} onChange={(e) => setRequestForm(prev => ({ ...prev, start_date: e.target.value }))} required className={`${inputClasses} ${requestErrors.start_date ? 'border-red-500' : ''}`} />
                            {requestErrors.start_date && <p className="mt-1.5 text-sm text-red-600">{requestErrors.start_date[0]}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">End Date <span className="text-red-500">*</span></label>
                            <input type="date" name="end_date" value={requestForm.end_date} onChange={(e) => setRequestForm(prev => ({ ...prev, end_date: e.target.value }))} required className={`${inputClasses} ${requestErrors.end_date ? 'border-red-500' : ''}`} />
                            {requestErrors.end_date && <p className="mt-1.5 text-sm text-red-600">{requestErrors.end_date[0]}</p>}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-900 mb-2">Reason</label>
                        <textarea name="reason" value={requestForm.reason} onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))} rows={3} className={inputClasses} placeholder="Reason for leave..." />
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={closeRequestModal} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 text-sm">Cancel</button>
                        <button type="submit" disabled={requestSubmitting} className="px-6 py-2.5 font-bold text-white rounded-lg disabled:opacity-50 text-sm" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                            {requestSubmitting ? 'Processing...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </Modal>

            <ConfirmDialog isOpen={confirmOpen} onClose={() => { setConfirmOpen(false); setDeleteId(null); }} onConfirm={handleDeleteType} title="Delete Leave Type" message="Are you sure you want to delete this leave type?" confirmText="Delete" cancelText="Cancel" variant="danger" />
        </div>
    );
}
