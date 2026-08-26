import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../services/api';
import Modal from '../../components/Modal';
import DataTable from '../../components/DataTable';
import PageHeader from '../../components/casfeta/PageHeader';
import HeroBanner from '../../components/casfeta/HeroBanner';
import DataItem from '../../components/casfeta/DataItem';
import EmptyState from '../../components/casfeta/EmptyState';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import { Store, Edit, Plus, Package, ShoppingCart, Users, DollarSign, MapPin, Clock, Calendar, Hash, CreditCard, Tag, CheckCircle } from 'lucide-react';

const statusConfig = {
    pending: { label: 'Pending', badge: 'badge badge-yellow' },
    active: { label: 'Active', badge: 'badge badge-green' },
    suspended: { label: 'Suspended', badge: 'badge badge-red' },
    closed: { label: 'Closed', badge: 'badge badge-gray' },
};

const CAPITAL_SOURCES = [
    { value: 'mtaji_binafsi', label: 'Personal Capital' },
    { value: 'mkopo_wa_benki', label: 'Bank Loan' },
    { value: 'mkopo_wa_vikoba', label: 'VIKOBA Loan' },
    { value: 'mkopo_wa_tujitoneshe', label: 'Tujitoneshe Loan' },
    { value: 'mkopo_wa_pamoja', label: 'Pamoja Loan' },
    { value: 'mkopo_wa_simu', label: 'Mobile Loan (M-Pesa, Tigo Pesa, etc.)' },
    { value: 'ufadhili', label: 'Sponsorship' },
    { value: 'uchumi_wa_jamii', label: 'Community Economy' },
    { value: 'nafasi_ya_kazi', label: 'Job Opportunity (SELF)' },
    { value: 'uwezeshaji', label: 'Empowerment' },
    { value: 'mchango_wa_wenzi', label: 'Friends Contribution' },
    { value: 'miradi', label: 'Projects' },
    { value: 'nafasi_za_kazi_miradi', label: 'Project Job Opportunities' },
    { value: 'mikopo_ya_wakulima', label: 'Farmers Loans' },
    { value: 'engine', label: 'Other' },
];

const initialCapitalForm = { capital_amount: '', source: '', designation: '', registration_date: '' };

export default function BusinessDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [business, setBusiness] = useState(null);
    const [capitals, setCapitals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');
    const [capitalModalOpen, setCapitalModalOpen] = useState(false);
    const [capitalForm, setCapitalForm] = useState(initialCapitalForm);
    const [capitalErrors, setCapitalErrors] = useState({});
    const [capitalLoading, setCapitalLoading] = useState(false);

    useEffect(() => { fetchBusiness(); fetchCapitals(); }, [id]);

    const fetchBusiness = async () => {
        try { const res = await api.get(`/owner/businesses/${id}`); setBusiness(res.data.data || res.data); }
        catch (err) { console.error('Failed to fetch business details:', err); alert('Failed to fetch business details.'); navigate('/owner/businesses'); }
    };

    const fetchCapitals = async () => {
        try { const res = await api.get(`/owner/businesses/${id}/capitals`); setCapitals(res.data.data || res.data || []); }
        catch (error) { console.error('Failed to fetch capitals:', error); setCapitals([]); } finally { setLoading(false); }
    };

    const handleCapitalChange = (e) => {
        const { name, value } = e.target;
        setCapitalForm(prev => ({ ...prev, [name]: value }));
        if (capitalErrors[name]) setCapitalErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleCapitalSubmit = async (e) => {
        e.preventDefault(); setCapitalLoading(true); setCapitalErrors({});
        try { await api.post(`/owner/businesses/${id}/capitals`, capitalForm); setCapitalModalOpen(false); setCapitalForm(initialCapitalForm); fetchCapitals(); }
        catch (err) { console.error('Failed to save capital:', err); if (err.response?.status === 422) setCapitalErrors(err.response.data.errors || {}); else alert('An error occurred. Please try again.'); }
        finally { setCapitalLoading(false); }
    };

    const openCapitalModal = () => { setCapitalForm(initialCapitalForm); setCapitalErrors({}); setCapitalModalOpen(true); };
    const totalCapital = capitals.reduce((sum, c) => sum + (parseFloat(c.capital_amount) || 0), 0);
    const inputClasses = "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm text-gray-900 placeholder-gray-400";

    const capitalColumns = [
        { header: '#', render: (row, index) => index + 1 },
        { header: 'Source', render: (row) => { const src = CAPITAL_SOURCES.find(s => s.value === row.source); return src ? src.label : row.source || '-'; } },
        { header: 'Amount (TZS)', render: (row) => <span className="font-semibold text-[#00D4AA]">{(parseFloat(row.capital_amount) || 0).toLocaleString()}</span> },
        { header: 'Designation', render: (row) => row.designation || '-' },
        { header: 'Registration Date', render: (row) => row.registration_date || '-' },
    ];

    if (loading && !business) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4AA]"></div></div>;
    }

    if (!business) return null;

    const status = statusConfig[business.status] || statusConfig.pending;
    const statusColor = business.status === 'active' ? 'bg-green-500'
        : business.status === 'suspended' ? 'bg-red-500'
        : business.status === 'closed' ? 'bg-gray-500'
        : 'bg-yellow-500';

    return (
        <div className="space-y-6">
            <PageHeader
                title="Business Details"
                subtitle={business.business_name}
                icon={<Store size={22} />}
                backTo="/owner/businesses"
                actions={
                    <Link to={`/owner/businesses/${id}/edit`} className="inline-flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">
                        <Edit size={16} /> Edit Business
                    </Link>
                }
            />

            <HeroBanner
                icon={<Store size={36} />}
                name={business.business_name}
                subtitle={business.code}
                status={status.label}
                statusColor={statusColor}
            />

            <div className="flex items-center space-x-2 bg-white rounded-xl border border-gray-200 shadow-sm p-1.5">
                <button onClick={() => setActiveTab('overview')} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'overview' ? 'bg-[#00D4AA] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                    Overview
                </button>
                <button onClick={() => setActiveTab('capital')} className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'capital' ? 'bg-[#00D4AA] text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                    Capital
                </button>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-12 w-12 bg-[#00D4AA]/10 rounded-xl flex items-center justify-center shrink-0"><Package size={22} className="text-[#00D4AA]" /></div>
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Products</p><p className="text-2xl font-bold text-gray-900">{business.products_count ?? 0}</p></div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"><ShoppingCart size={22} className="text-blue-500" /></div>
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Orders</p><p className="text-2xl font-bold text-gray-900">{business.orders_count ?? 0}</p></div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-12 w-12 bg-purple-50 rounded-xl flex items-center justify-center shrink-0"><Users size={22} className="text-purple-500" /></div>
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Employees</p><p className="text-2xl font-bold text-gray-900">{business.employees_count ?? 0}</p></div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex items-center gap-4">
                        <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center shrink-0"><DollarSign size={22} className="text-yellow-500" /></div>
                        <div><p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Capital</p><p className="text-2xl font-bold text-gray-900">TZS {(business.opening_capital || totalCapital || 0).toLocaleString()}</p></div>
                    </div>
                </div>
            )}

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-[#00D4AA]/10 flex items-center justify-center"><Store size={16} className="text-[#00D4AA]" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Business Information</h3>
                                    <p className="text-xs text-gray-500">Core business details</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DataItem label="Name" value={business.business_name} icon={<Store size={14} />} />
                                <DataItem label="Code" value={business.code} icon={<Hash size={14} />} mono />
                                <DataItem label="Type" value={business.business_type} icon={<Tag size={14} />} />
                                <DataItem label="Category" value={business.business_category || '-'} icon={<Tag size={14} />} />
                                <DataItem label="Status" value={status.label} icon={<CheckCircle size={14} />} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><MapPin size={16} className="text-blue-600" /></div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">Location & Schedule</h3>
                                    <p className="text-xs text-gray-500">Where and when you operate</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <DataItem label="Region" value={business.region || '-'} icon={<MapPin size={14} />} />
                                <DataItem label="District" value={business.district || '-'} icon={<MapPin size={14} />} />
                                <DataItem label="Ward" value={business.ward || '-'} icon={<MapPin size={14} />} />
                                <DataItem label="Working Days" value={business.working_days?.length > 0 ? business.working_days.join(', ') : '-'} icon={<Calendar size={14} />} />
                                <DataItem label="Working Hours" value={business.working_hours_start && business.working_hours_end ? `${business.working_hours_start} - ${business.working_hours_end}` : '-'} icon={<Clock size={14} />} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'capital' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-bold text-gray-900">Capital Records</h3>
                        <button onClick={openCapitalModal} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] text-white font-medium rounded-lg hover:bg-[#00B894] transition-all duration-200 text-sm shadow-md hover:shadow-lg">
                            <Plus size={16} /> Add Capital
                        </button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <DataTable columns={capitalColumns} data={capitals} emptyMessage="No capital records yet. Add your first capital entry." />
                    </div>

                    {capitals.length > 0 && (
                        <div className="bg-[#00D4AA]/5 border-2 border-[#00D4AA]/20 rounded-xl p-5 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <DollarSign size={18} className="text-[#00D4AA]" />
                                <span className="font-semibold text-gray-900">Total Capital</span>
                            </div>
                            <span className="text-xl font-bold text-[#00D4AA]">TZS {totalCapital.toLocaleString()}</span>
                        </div>
                    )}
                </div>
            )}

            <Modal isOpen={capitalModalOpen} onClose={() => setCapitalModalOpen(false)} title="Add Capital" size="lg">
                <form onSubmit={handleCapitalSubmit} className="space-y-5">
                    <FormField label="Capital Amount (TZS)" required icon={<DollarSign size={16} />} error={capitalErrors.capital_amount?.[0]}>
                        <input type="number" name="capital_amount" value={capitalForm.capital_amount} onChange={handleCapitalChange} className={inputClasses} placeholder="Enter amount" min="0" />
                    </FormField>
                    <FormField label="Capital Source" required icon={<CreditCard size={16} />} error={capitalErrors.source?.[0]}>
                        <select name="source" value={capitalForm.source} onChange={handleCapitalChange} className={inputClasses}>
                            <option value="">Select source</option>
                            {CAPITAL_SOURCES.map(src => (<option key={src.value} value={src.value}>{src.label}</option>))}
                        </select>
                    </FormField>
                    <FormField label="Designation" icon={<Users size={16} />}>
                        <input type="text" name="designation" value={capitalForm.designation} onChange={handleCapitalChange} className={inputClasses} placeholder="e.g. Business Owner, Investor, etc." />
                    </FormField>
                    <FormField label="Registration Date" icon={<Calendar size={16} />}>
                        <input type="date" name="registration_date" value={capitalForm.registration_date} onChange={handleCapitalChange} className={inputClasses} />
                    </FormField>
                    <div className="flex justify-end space-x-3 pt-2">
                        <button type="button" onClick={() => setCapitalModalOpen(false)} className="px-5 py-2.5 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-all duration-200 text-sm">Cancel</button>
                        <button type="submit" disabled={capitalLoading} className="px-6 py-2.5 font-bold text-white rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md hover:shadow-lg disabled:opacity-50 bg-[#00D4AA] hover:bg-[#00B894]">
                            {capitalLoading && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>}
                            <span>Save</span>
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
