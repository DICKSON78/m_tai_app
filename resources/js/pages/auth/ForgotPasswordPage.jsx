import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { Mail, ArrowLeft, CheckCircle, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [token, setToken] = useState('');
    const { t } = useTranslation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        try {
            const res = await api.post('/forgot-password', { email });
            setMessage(res.data.message || '{t("auth.reset_sent")}');
            if (res.data.token) {
                setToken(res.data.token);
            }
        } catch (err) { console.error('Forgot password failed:', err);
            setError(err.response?.data?.message || 'Failed to process request. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <Link to="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-4">
                        <ArrowLeft className="w-4 h-4" />
                        {t("auth.back_to_login")}
                    </Link>
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                        <KeyRound className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">{t("auth.forgot_password")}</h1>
                    <p className="text-gray-500 mt-2">{t("auth.enter_email_reset")}</p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8">
                    {message && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                            <div className="flex items-center gap-2 text-green-700 text-sm">
                                <CheckCircle className="w-5 h-5" />
                                {message}
                            </div>
                            {token && (
                                <div className="mt-3 p-3 bg-white rounded-lg border border-green-200">
                                    <p className="text-xs text-gray-500 mb-1">{t("auth.reset_token_demo")}</p>
                                    <code className="text-sm font-mono text-gray-900 break-all">{token}</code>
                                </div>
                            )}
                            <Link to={token ? `/reset-password?token=${token}` : '/login'} className="mt-3 inline-block text-sm font-medium text-primary hover:underline">
                                {token ? '{t("auth.reset_now")}' : '{t("auth.go_to_login")}'}
                            </Link>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t("common.email")}</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t("auth.enter_email")}
                                    required
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-all"
                        >
                            {loading ? '{t("common.sending")}' : '{t("auth.send_reset_token")}'}
                        </button>
                    </form>

                    <p className="text-center text-sm text-gray-500 mt-6">
                        {t("auth.remember_password")}{' '}
                        <Link to="/login" className="font-medium text-primary hover:underline">{t("common.login")}</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
