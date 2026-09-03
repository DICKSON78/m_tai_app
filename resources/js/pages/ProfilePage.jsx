import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import PageHeader from '../components/casfeta/PageHeader';
import { User, MapPin, Truck, CreditCard, Plus, Check } from 'lucide-react';

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });
    const [savingProfile, setSavingProfile] = useState(false);

    const [address, setAddress] = useState({ region: '', district: '', street_or_area: '' });
    const [delivery, setDelivery] = useState({ name: '', phone: '', area: '', notes: '' });

    const [passwordForm, setPasswordForm] = useState({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });
    const [savingPassword, setSavingPassword] = useState(false);

    const [toast, setToast] = useState(null);
    const [error, setError] = useState(null);

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        api.get('/profile').then(res => {
            const data = res.data?.data || res.data || user;
            setProfile(data);
            setEditForm({
                name: data.name || '',
                phone: data.phone || '',
                email: data.email || '',
            });
            setAddress({
                region: data.region || '',
                district: data.district || '',
                street_or_area: data.street_or_area || data.address || '',
            });
            setDelivery({
                name: data.name || '',
                phone: data.phone || '',
                area: data.delivery_area || '',
                notes: data.delivery_notes || '',
            });
        }).catch((error) => { console.error('Failed to fetch profile:', error);
            if (user) {
                setProfile(user);
                setEditForm({ name: user.name || '', phone: user.phone || '', email: user.email || '' });
            }
        }).finally(() => setLoading(false));
    }, [user]);

    const handleEditChange = (field) => (e) => {
        setEditForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSaveProfile = async () => {
        setSavingProfile(true);
        setError(null);
        try {
            const res = await api.put('/profile', editForm);
            const updated = res.data?.data || res.data;
            setProfile(updated);
            showToast('Profaili imesasishwa');
        } catch (err) { console.error('Failed to update profile:', err);
            setError(err.response?.data?.message || 'Imeshindwa kusasisha profaili');
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = (field) => (e) => {
        setPasswordForm(prev => ({ ...prev, [field]: e.target.value }));
    };

    const handleSavePassword = async () => {
        if (passwordForm.new_password !== passwordForm.new_password_confirmation) {
            setError('Nyuzi mpya hazilingani');
            return;
        }
        setSavingPassword(true);
        setError(null);
        try {
            await api.put('/profile/password', passwordForm);
            setPasswordForm({ current_password: '', new_password: '', new_password_confirmation: '' });
            showToast('Nyuzi imebadilishwa');
        } catch (err) { console.error('Failed to change password:', err);
            setError(err.response?.data?.message || 'Imeshindwa kubadilisha nyuzi');
        } finally {
            setSavingPassword(false);
        }
    };

    const roleLabels = {
        admin: 'Msimamizi',
        business_owner: 'Mmiliki Biashara',
        employee: 'Mfanyakazi',
        customer: 'Mteja',
        transporter: 'Mwendeshaji',
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    const initials = profile?.name
        ? profile.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    const SectionIcon = ({ icon }) => (
        <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: '#d0f9f1' }}>
            {icon}
        </span>
    );

    const SectionCard = ({ icon, title, subtitle, children, action }) => (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <SectionIcon icon={icon} />
                    <div>
                        <h3 className="text-base font-bold text-gray-900">{title}</h3>
                        {subtitle ? <p className="text-xs text-gray-500">{subtitle}</p> : null}
                    </div>
                </div>
                {action}
            </div>
            {children}
        </div>
    );

    const Field = ({ label, children }) => (
        <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
            {children}
        </div>
    );

    const inputClass = "w-full px-3 py-2.5 text-sm text-gray-800 bg-white border border-gray-300 rounded-lg outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

    const InfoRow = ({ label, value }) => (
        <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
            <span className="text-sm text-gray-500">{label}</span>
            <span className="text-sm font-medium text-gray-900 text-right">{value || '-'}</span>
        </div>
    );

    return (
        <div>
            {toast && (
                <div className="fixed top-20 right-4 z-50 bg-primary text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2 animate-fade-in">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-sm font-medium">{toast}</span>
                </div>
            )}

            <PageHeader title="Profaili Yako" subtitle="Simamia taarifa zako za kibinafsi" icon={<User size={20} />} />

            {error && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            {/* Profile identity */}
            <div className="card mb-4">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-xl font-bold shrink-0" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-xl font-bold text-gray-800 truncate">{profile?.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{profile?.email}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1" style={{ background: '#d0f9f1', color: '#00b894' }}>
                            {roleLabels[profile?.role] || profile?.role}
                        </span>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                    <InfoRow label="Simu" value={profile?.phone} />
                    <InfoRow label="Msimbo" value={profile?.code} />
                    <InfoRow label="Wadhifa" value={roleLabels[profile?.role] || profile?.role} />
                </div>
            </div>

            {/* Location */}
            <SectionCard
                icon={<MapPin size={20} className="text-primary-dark" />}
                title="Anwani / Mahali"
                subtitle="Ambapo maagizo yako yatapelekwa"
            >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Field label="Mkoa">
                        <input type="text" value={address.region} onChange={(e) => setAddress(prev => ({ ...prev, region: e.target.value }))} placeholder="e.g. Dar es Salaam" className={inputClass} />
                    </Field>
                    <Field label="Wilaya">
                        <input type="text" value={address.district} onChange={(e) => setAddress(prev => ({ ...prev, district: e.target.value }))} placeholder="e.g. Kinondoni" className={inputClass} />
                    </Field>
                    <Field label="Mtaa / Eneo">
                        <input type="text" value={address.street_or_area} onChange={(e) => setAddress(prev => ({ ...prev, street_or_area: e.target.value }))} placeholder="e.g. Mbezi Beach" className={inputClass} />
                    </Field>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={() => showToast('Taarifa zimehifadhiwa')} className="btn-primary">
                        Hifadhi Anwani
                    </button>
                </div>
            </SectionCard>

            {/* Delivery */}
            <SectionCard
                icon={<Truck size={20} className="text-primary-dark" />}
                title="Usafirishaji"
                subtitle="Chagua namna ya kupokea bidhaa"
            >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                    <Field label="Jina la Mpokeaji">
                        <input type="text" value={delivery.name} onChange={(e) => setDelivery(prev => ({ ...prev, name: e.target.value }))} placeholder="Jina kamili" className={inputClass} />
                    </Field>
                    <Field label="Namba ya Simu">
                        <input type="tel" value={delivery.phone} onChange={(e) => setDelivery(prev => ({ ...prev, phone: e.target.value }))} placeholder="+255..." className={inputClass} />
                    </Field>
                    <Field label="Eneo la Kufikishia">
                        <input type="text" value={delivery.area} onChange={(e) => setDelivery(prev => ({ ...prev, area: e.target.value }))} placeholder="e.g. Mbezi Beach, Kinondoni" className={inputClass} />
                    </Field>
                    <Field label="Maelezo (hiari)">
                        <input type="text" value={delivery.notes} onChange={(e) => setDelivery(prev => ({ ...prev, notes: e.target.value }))} placeholder="Maelezo ya ziada..." className={inputClass} />
                    </Field>
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={() => showToast('Taarifa za usafirishaji zimehifadhiwa')} className="btn-primary">
                        Hifadhi Usafirishaji
                    </button>
                </div>
            </SectionCard>

            {/* Payment cards */}
            <SectionCard
                icon={<CreditCard size={20} className="text-primary-dark" />}
                title="Kadi za Malipo"
                subtitle="Weza kadi zako za malipo"
                action={
                    <button onClick={() => showToast('Ongeza kadi')} className="flex items-center gap-1 text-sm font-bold text-primary-dark hover:opacity-80 transition-opacity">
                        <Plus size={16} /> Ongeza
                    </button>
                }
            >
                <div className="relative overflow-hidden rounded-2xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #0FAE8C, #00D4AA)' }}>
                    <p className="text-[11px] font-semibold tracking-widest mb-1 opacity-90">M-TAI WALLET</p>
                    <p className="text-lg font-mono tracking-widest mb-3">•••• •••• •••• 4242</p>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-[10px] uppercase opacity-80">Mwenye Kadi</p>
                            <p className="text-sm font-semibold">{profile?.name || 'Customer'}</p>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] font-semibold">
                            <Check size={12} /> Imehakikiwa
                        </div>
                    </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                    <CreditCard size={16} />
                    Malipo yanafanyika kwa usalama na M-TAI.
                </div>
            </SectionCard>

            {/* Edit profile */}
            <div className="card mb-4">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Hariri Profaili</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="form-label">Jina</label>
                        <input
                            type="text"
                            value={editForm.name}
                            onChange={handleEditChange('name')}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className="form-label">Simu</label>
                        <input
                            type="tel"
                            value={editForm.phone}
                            onChange={handleEditChange('phone')}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className="form-label">Barua Pepe</label>
                        <input
                            type="email"
                            value={editForm.email}
                            onChange={handleEditChange('email')}
                            className="form-input"
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleSaveProfile}
                        disabled={savingProfile}
                        className="btn-primary disabled:opacity-50"
                    >
                        {savingProfile ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Inahifadhi...
                            </span>
                        ) : 'Hifadhi'}
                    </button>
                </div>
            </div>

            {/* Change password */}
            <div className="card">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Badilisha Nyuzi</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                        <label className="form-label">Nyuzi ya Sasa</label>
                        <input
                            type="password"
                            value={passwordForm.current_password}
                            onChange={handlePasswordChange('current_password')}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className="form-label">Nyuzi Mpya</label>
                        <input
                            type="password"
                            value={passwordForm.new_password}
                            onChange={handlePasswordChange('new_password')}
                            className="form-input"
                        />
                    </div>
                    <div>
                        <label className="form-label">Thibitisha Nyuzi Mpya</label>
                        <input
                            type="password"
                            value={passwordForm.new_password_confirmation}
                            onChange={handlePasswordChange('new_password_confirmation')}
                            className="form-input"
                        />
                    </div>
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={handleSavePassword}
                        disabled={savingPassword}
                        className="btn-primary disabled:opacity-50"
                    >
                        {savingPassword ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Inabadilisha...
                            </span>
                        ) : 'Badilisha Nyuzi'}
                    </button>
                </div>
            </div>
        </div>
    );
}