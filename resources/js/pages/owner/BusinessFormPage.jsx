import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import ActionBar from '../../components/casfeta/ActionBar';
import { Store, Tag, MapPin, Clock, CreditCard } from 'lucide-react';

const TANZANIAN_REGIONS = [
    'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa',
    'Kagera', 'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi',
    'Manyara', 'Mara', 'Mbeya', 'Misungwi', 'Morogoro',
    'Mtwara', 'Mwanza', 'Njombe', 'Pwani', 'Rukwa',
    'Ruvuma', 'Shinyanga', 'Simiyu', 'Songwe', 'Tabora', 'Tanga',
];

const BUSINESS_TYPES = [
    { value: 'Duka', label: 'Shop' },
    { value: 'Hoteli', label: 'Restaurant' },
    { value: 'Pharmacy', label: 'Pharmacy' },
    { value: 'Vitolani', label: 'Salon' },
    { value: 'Engineering', label: 'Engineering' },
    { value: 'Service', label: 'Services' },
    { value: 'Other', label: 'Other' },
];

const WORKING_DAYS = [
    { value: 'Monday', label: 'Mon' },
    { value: 'Tuesday', label: 'Tue' },
    { value: 'Wednesday', label: 'Wed' },
    { value: 'Thursday', label: 'Thu' },
    { value: 'Friday', label: 'Fri' },
    { value: 'Saturday', label: 'Sat' },
    { value: 'Sunday', label: 'Sun' },
];

const initialForm = {
    business_name: '',
    business_type: '',
    business_category: '',
    region: '',
    district: '',
    ward: '',
    street: '',
    road: '',
    working_days: [],
    working_hours_start: '08:00',
    working_hours_end: '17:00',
    payment_code: '',
    bank_account_number: '',
};

const inputClasses = "w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm text-gray-900 placeholder-gray-400";

export default function BusinessFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditing = Boolean(id);

    const [form, setForm] = useState(initialForm);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(isEditing);

    useEffect(() => {
        if (isEditing) {
            api.get(`/owner/businesses/${id}`)
                .then(res => {
                    const biz = res.data.data || res.data;
                    setForm({
                        business_name: biz.business_name || '',
                        business_type: biz.business_type || '',
                        business_category: biz.business_category || '',
                        region: biz.region || '',
                        district: biz.district || '',
                        ward: biz.ward || '',
                        street: biz.street || '',
                        road: biz.road || '',
                        working_days: biz.working_days || [],
                        working_hours_start: biz.working_hours_start || '08:00',
                        working_hours_end: biz.working_hours_end || '17:00',
                        payment_code: biz.payment_code || '',
                        bank_account_number: biz.bank_account_number || '',
                    });
                })
                .catch((error) => { console.error('Failed to fetch business:', error); alert('Failed to load business information.'); navigate('/owner/businesses'); })
                .finally(() => setFetching(false));
        }
    }, [id, isEditing, navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleWorkingDaysChange = (day) => {
        setForm(prev => {
            const days = prev.working_days.includes(day) ? prev.working_days.filter(d => d !== day) : [...prev.working_days, day];
            return { ...prev, working_days: days };
        });
        if (errors.working_days) setErrors(prev => ({ ...prev, working_days: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setErrors({});
        try {
            if (isEditing) { await api.put(`/owner/businesses/${id}`, form); }
            else { await api.post('/owner/businesses', form); }
            navigate('/owner/businesses');
        } catch (err) { console.error('Failed to save business:', err);
            if (err.response?.status === 422) setErrors(err.response.data.errors || {});
            else alert('An error occurred. Please try again.');
        } finally { setLoading(false); }
    };

    if (fetching) {
        return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#00D4AA]"></div></div>;
    }

    return (
        <div className="pb-24 max-w-3xl mx-auto space-y-6">
            <PageHeader
                title="Business Information"
                subtitle="Fill in the details to create or update your business."
                icon={<Store size={22} />}
                backTo="/owner/businesses"
            />

            <form onSubmit={handleSubmit}>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <SectionHeader icon={<Store size={18} />} title="Basic Information" subtitle="Name and category of your business" />
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Business Name" required icon={<Store size={16} />} error={errors.business_name?.[0]} full>
                                <input type="text" name="business_name" value={form.business_name} onChange={handleChange} className={inputClasses} placeholder="e.g. M-TAI Shop" />
                            </FormField>
                            <FormField label="Business Type" required icon={<Tag size={16} />} error={errors.business_type?.[0]}>
                                <select name="business_type" value={form.business_type} onChange={handleChange} className={inputClasses}>
                                    <option value="">Select type</option>
                                    {BUSINESS_TYPES.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
                                </select>
                            </FormField>
                            <FormField label="Category" icon={<Tag size={16} />}>
                                <input type="text" name="business_category" value={form.business_category} onChange={handleChange} className={inputClasses} placeholder="e.g. Food, Medicine, etc." />
                            </FormField>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <SectionHeader icon={<MapPin size={18} />} title="Location" subtitle="Where is your business located?" iconColor="bg-blue-50" iconTextColor="text-blue-600" />
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Region" required icon={<MapPin size={16} />} error={errors.region?.[0]}>
                                <select name="region" value={form.region} onChange={handleChange} className={inputClasses}>
                                    <option value="">Select region</option>
                                    {TANZANIAN_REGIONS.map(region => (<option key={region} value={region}>{region}</option>))}
                                </select>
                            </FormField>
                            <FormField label="District" required icon={<MapPin size={16} />} error={errors.district?.[0]}>
                                <input type="text" name="district" value={form.district} onChange={handleChange} className={inputClasses} placeholder="e.g. Ilala" />
                            </FormField>
                            <FormField label="Ward" icon={<MapPin size={16} />}>
                                <input type="text" name="ward" value={form.ward} onChange={handleChange} className={inputClasses} placeholder="e.g. Kivukoni" />
                            </FormField>
                            <FormField label="Street" icon={<MapPin size={16} />}>
                                <input type="text" name="street" value={form.street} onChange={handleChange} className={inputClasses} placeholder="e.g. Market Street" />
                            </FormField>
                            <FormField label="Road" icon={<MapPin size={16} />} full>
                                <input type="text" name="road" value={form.road} onChange={handleChange} className={inputClasses} placeholder="e.g. Bagamoyo Road" />
                            </FormField>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <SectionHeader icon={<Clock size={18} />} title="Working Hours" subtitle="Set your business operating days and hours" iconColor="bg-amber-50" iconTextColor="text-amber-600" />
                    </div>
                    <div className="p-6">
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-900 mb-2">Working Days</label>
                                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
                                    {WORKING_DAYS.map(day => (
                                        <label key={day.value} className={`flex items-center justify-center px-3 py-2.5 rounded-lg border cursor-pointer transition text-sm font-medium ${form.working_days.includes(day.value) ? 'bg-[#00D4AA]/10 border-[#00D4AA] text-[#00D4AA]' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                                            <input type="checkbox" checked={form.working_days.includes(day.value)} onChange={() => handleWorkingDaysChange(day.value)} className="sr-only" />
                                            {day.label}
                                        </label>
                                    ))}
                                </div>
                                {errors.working_days && <p className="mt-1.5 text-sm text-red-600">{errors.working_days[0]}</p>}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <FormField label="Start Time" icon={<Clock size={16} />}>
                                    <input type="time" name="working_hours_start" value={form.working_hours_start} onChange={handleChange} className={inputClasses} />
                                </FormField>
                                <FormField label="End Time" icon={<Clock size={16} />}>
                                    <input type="time" name="working_hours_end" value={form.working_hours_end} onChange={handleChange} className={inputClasses} />
                                </FormField>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-5">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <SectionHeader icon={<CreditCard size={18} />} title="Payment" subtitle="Configure your payment and bank details" iconColor="bg-purple-50" iconTextColor="text-purple-600" />
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <FormField label="Payment Code (M-Pesa Code)" icon={<CreditCard size={16} />}>
                                <input type="text" name="payment_code" value={form.payment_code} onChange={handleChange} className={inputClasses} placeholder="e.g. QGH7X8Y9Z1" />
                            </FormField>
                            <FormField label="Bank Account Number" icon={<CreditCard size={16} />}>
                                <input type="text" name="bank_account_number" value={form.bank_account_number} onChange={handleChange} className={inputClasses} placeholder="e.g. 1234567890" />
                            </FormField>
                        </div>
                    </div>
                </div>

                <ActionBar
                    onCancel={() => navigate('/owner/businesses')}
                    onCancelLabel="Cancel"
                    onSubmit={() => document.querySelector('form').requestSubmit()}
                    onSubmitLabel={isEditing ? 'Save Changes' : 'Create Business'}
                    loading={loading}
                    accent
                />
            </form>
        </div>
    );
}
