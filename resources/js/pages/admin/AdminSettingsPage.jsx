import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Cog, Save, Globe, Shield, Database } from 'lucide-react';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import ActionBar from '../../components/casfeta/ActionBar';
import DataItem from '../../components/casfeta/DataItem';

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        app_name: 'M-TAI',
        app_version: '1.0.0',
        currency: 'TZS',
        max_file_upload_size: 2048,
        max_businesses_per_user: 5,
        default_pagination: 20,
        maintenance_mode: false,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            setLoading(true);
            try {
                const res = await api.get('/admin/settings');
                setSettings(prev => ({ ...prev, ...res.data }));
            } catch (error) { console.error('Failed to fetch settings:', error); /* use defaults */ } finally { setLoading(false); }
        };
        fetchSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setMessage('');
        try {
            await api.put('/admin/settings', settings);
            setMessage('Settings saved successfully');
        } catch (error) { console.error('Failed to save settings:', error); setMessage('Failed to save settings'); } finally { setSaving(false); }
    };

    if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>;

    return (
        <div className="space-y-6">
            <PageHeader
                title="Platform Settings"
                subtitle="Configure system-wide settings for the platform"
                icon={<Cog size={20} />}
                actions={
                    <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00D4AA] hover:bg-[#00B894] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50">
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                }
            />

            {message && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium ${message.includes('success') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>{message}</div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <SectionHeader icon={<Globe size={18} />} title="General" subtitle="Basic platform configuration" iconColor="bg-blue-100" iconTextColor="text-blue-600" />
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">App Name</label>
                            <input type="text" value={settings.app_name} onChange={(e) => setSettings({ ...settings, app_name: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Currency</label>
                            <input type="text" value={settings.currency} onChange={(e) => setSettings({ ...settings, currency: e.target.value })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Default Pagination</label>
                            <input type="number" value={settings.default_pagination} onChange={(e) => setSettings({ ...settings, default_pagination: parseInt(e.target.value) || 20 })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <SectionHeader icon={<Shield size={18} />} title="Limits & Security" subtitle="User limits and file upload settings" iconColor="bg-purple-100" iconTextColor="text-purple-600" />
                    </div>
                    <div className="p-6 space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Max File Upload (KB)</label>
                            <input type="number" value={settings.max_file_upload_size} onChange={(e) => setSettings({ ...settings, max_file_upload_size: parseInt(e.target.value) || 2048 })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-900 mb-2">Max Businesses Per User</label>
                            <input type="number" value={settings.max_businesses_per_user} onChange={(e) => setSettings({ ...settings, max_businesses_per_user: parseInt(e.target.value) || 5 })} className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA] text-sm" />
                        </div>
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Maintenance Mode</p>
                                <p className="text-xs text-gray-500">Temporarily disable public access</p>
                            </div>
                            <button onClick={() => setSettings({ ...settings, maintenance_mode: !settings.maintenance_mode })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.maintenance_mode ? 'bg-[#00D4AA]' : 'bg-gray-200'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow ${settings.maintenance_mode ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden lg:col-span-2">
                    <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                        <SectionHeader icon={<Database size={18} />} title="System Info" subtitle="Platform version and system details" iconColor="bg-green-100" iconTextColor="text-green-600" />
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <DataItem label="Version" value={settings.app_version} icon={<Database size={14} />} mono />
                            <DataItem label="Currency" value={settings.currency} icon={<Globe size={14} />} />
                            <DataItem label="Max Upload" value={`${settings.max_file_upload_size} KB`} icon={<Shield size={14} />} />
                            <DataItem label="Max Businesses" value={settings.max_businesses_per_user} icon={<Cog size={14} />} />
                        </div>
                    </div>
                </div>
            </div>

            <ActionBar
                onCancel={() => window.location.reload()}
                onCancelLabel="Reset"
                onSubmit={handleSave}
                onSubmitLabel={saving ? 'Saving...' : 'Save Settings'}
                loading={saving}
                accent
            />
        </div>
    );
}
