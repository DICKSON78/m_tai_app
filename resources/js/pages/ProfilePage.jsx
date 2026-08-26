import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function ProfilePage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });
    const [savingProfile, setSavingProfile] = useState(false);

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

            <div className="relative rounded-2xl p-8 overflow-hidden mb-8" style={{ background: 'linear-gradient(135deg, #12601f 0%, #133d29 50%, #0f2a1c 100%)' }}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative">
                    <p className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-1.5">Mtumiaji</p>
                    <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Profaili Yako</h1>
                    <p className="text-white/50 text-sm">Simamia taarifa zako za kibinafsi</p>
                </div>
            </div>

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                    {error}
                </div>
            )}

            <div className="card mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                        {initials}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-800">{profile?.name}</h3>
                        <p className="text-sm text-gray-500">{profile?.email}</p>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary mt-1">
                            {roleLabels[profile?.role] || profile?.role}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t">
                    <div>
                        <p className="text-xs text-gray-500">Simu</p>
                        <p className="text-sm font-medium text-gray-800">{profile?.phone || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Msimbo</p>
                        <p className="text-sm font-medium text-gray-800 font-mono">{profile?.code || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Wadhifa</p>
                        <p className="text-sm font-medium text-gray-800">{roleLabels[profile?.role] || profile?.role}</p>
                    </div>
                </div>
            </div>

            <div className="card mb-6">
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
