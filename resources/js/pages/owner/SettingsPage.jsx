import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import EmptyState from '../../components/casfeta/EmptyState';
import ActionBar from '../../components/casfeta/ActionBar';
import { Settings, Save, Clock, DollarSign, FileText, Package, ToggleLeft, CheckCircle } from 'lucide-react';

export default function SettingsPage() {
    const [businesses, setBusinesses] = useState([]);
    const [selectedBusiness, setSelectedBusiness] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    const [form, setForm] = useState({
        currency: 'TZS', tax_rate: 0, business_hours_open: '08:00', business_hours_close: '17:00',
        receipt_header: '', receipt_footer: '', low_stock_threshold: 10,
        auto_accept_orders: false, enable_delivery: false, enable_loans: false,
    });

    useEffect(() => {
        api.get('/owner/businesses').then(res => {
            const biz = res.data?.data || res.data || [];
            setBusinesses(biz);
            if (biz.length === 1) setSelectedBusiness(biz[0].id);
        }).catch(() => setBusinesses([]));
    }, []);

    useEffect(() => {
        if (!selectedBusiness) return;
        setLoading(true);
        api.get(`/owner/businesses/${selectedBusiness}/settings`).then(res => {
            const settings = res.data?.data || res.data || {};
            setForm(prev => ({
                ...prev, currency: settings.currency || 'TZS', tax_rate: settings.tax_rate ?? 0,
                business_hours_open: settings.business_hours_open || '08:00', business_hours_close: settings.business_hours_close || '17:00',
                receipt_header: settings.receipt_header || '', receipt_footer: settings.receipt_footer || '',
                low_stock_threshold: settings.low_stock_threshold ?? 10, auto_accept_orders: !!settings.auto_accept_orders,
                enable_delivery: !!settings.enable_delivery, enable_loans: !!settings.enable_loans,
            }));
        }).catch(() => {}).finally(() => setLoading(false));
    }, [selectedBusiness]);

    const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(null), 3000); }, []);

    const handleChange = (field) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(prev => ({ ...prev, [field]: val }));
    };

    const handleSave = async () => {
        if (!selectedBusiness) return;
        setSaving(true);
        try { await api.put(`/owner/businesses/${selectedBusiness}/settings`, form); showToast('Settings saved successfully'); } catch { showToast('Failed to save settings'); } finally { setSaving(false); }
    };

    const Toggle = ({ label, field }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <button type="button" onClick={() => setForm(prev => ({ ...prev, [field]: !prev[field] }))} className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${form[field] ? 'bg-[#00D4AA]' : 'bg-gray-300'}`}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${form[field] ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    return (
        <div className="space-y-6">
            {toast && (
                <div className="fixed top-20 right-4 z-50 bg-[#00D4AA] text-white px-6 py-3 rounded-xl shadow-lg flex items-center space-x-2 animate-fade-in">
                    <CheckCircle size={18} /><span className="text-sm font-medium">{toast}</span>
                </div>
            )}

            <PageHeader title="Business Settings" subtitle="Manage your business settings and preferences." icon={<Settings size={20} />} />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                <label className="block text-sm font-semibold text-gray-900 mb-2">Select Business</label>
                <select value={selectedBusiness} onChange={(e) => setSelectedBusiness(e.target.value)} className="w-full sm:w-80 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm">
                    <option value="">-- Select Business --</option>
                    {businesses.map((biz) => (<option key={biz.id} value={biz.id}>{biz.name}</option>))}
                </select>
            </div>

            {!selectedBusiness ? (
                <EmptyState title="Select a business" description="Choose a business from the dropdown above to view settings." />
            ) : loading ? (
                <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : (
                <div className="space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <SectionHeader icon={<DollarSign size={18} />} title="Business Information" subtitle="General business settings" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Currency" icon={<DollarSign size={16} />}>
                                <input type="text" value={form.currency} onChange={handleChange('currency')} placeholder="TZS" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                            </FormField>
                            <FormField label="Tax Rate (%)" icon={<DollarSign size={16} />}>
                                <input type="number" value={form.tax_rate} onChange={handleChange('tax_rate')} min="0" max="100" step="0.01" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                            </FormField>
                            <FormField label="Opening Time" icon={<Clock size={16} />}>
                                <input type="time" value={form.business_hours_open} onChange={handleChange('business_hours_open')} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                            </FormField>
                            <FormField label="Closing Time" icon={<Clock size={16} />}>
                                <input type="time" value={form.business_hours_close} onChange={handleChange('business_hours_close')} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                            </FormField>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <SectionHeader icon={<FileText size={18} />} title="Receipt" subtitle="Customize your receipt" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField label="Receipt Header" icon={<FileText size={16} />}>
                                <input type="text" value={form.receipt_header} onChange={handleChange('receipt_header')} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                            </FormField>
                            <FormField label="Receipt Footer" icon={<FileText size={16} />}>
                                <input type="text" value={form.receipt_footer} onChange={handleChange('receipt_footer')} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                            </FormField>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <SectionHeader icon={<Package size={18} />} title="Inventory" subtitle="Stock management settings" />
                        <div className="max-w-xs">
                            <FormField label="Low Stock Threshold" icon={<Package size={16} />}>
                                <input type="number" value={form.low_stock_threshold} onChange={handleChange('low_stock_threshold')} min="0" className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                            </FormField>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <SectionHeader icon={<ToggleLeft size={18} />} title="Preferences" subtitle="Feature toggles" />
                        <div className="space-y-0">
                            <Toggle label="Auto-accept Orders" field="auto_accept_orders" />
                            <Toggle label="Enable Delivery" field="enable_delivery" />
                            <Toggle label="Enable Loans" field="enable_loans" />
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#00D4AA] text-white rounded-lg text-sm font-bold hover:bg-[#00B894] transition-all shadow-md disabled:opacity-50">
                            <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
