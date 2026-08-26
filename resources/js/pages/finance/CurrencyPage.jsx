import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { Currency as CurrencyIcon, Plus, X, ArrowRightLeft, Star } from 'lucide-react';

export default function CurrencyPage() {
    const [currencies, setCurrencies] = useState([]);
    const [rates, setRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showRateForm, setShowRateForm] = useState(false);
    const [showConvert, setShowConvert] = useState(false);
    const [form, setForm] = useState({ code: '', name: '', symbol: '', decimal_places: 2, is_base: false });
    const [rateForm, setRateForm] = useState({ from_currency: '', to_currency: '', rate: '', effective_date: new Date().toISOString().split('T')[0] });
    const [convertForm, setConvertForm] = useState({ amount: '', from: '', to: '' });
    const [convertResult, setConvertResult] = useState(null);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState('currencies');

    const fetchCurrencies = useCallback(async () => {
        setLoading(true);
        try { const res = await api.get('/owner/finance/currencies'); setCurrencies(res.data.data || res.data || []); } catch (error) { console.error('Failed to fetch currencies:', error); setCurrencies([]); } finally { setLoading(false); }
    }, []);

    const fetchRates = useCallback(async () => {
        try { const res = await api.get('/owner/finance/exchange-rates'); setRates(res.data.data || res.data || []); } catch (error) { console.error('Failed to fetch exchange rates:', error); setRates([]); }
    }, []);

    useEffect(() => { fetchCurrencies(); fetchRates(); }, [fetchCurrencies, fetchRates]);

    const handleCreateCurrency = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await api.post('/owner/finance/currencies', form);
            setShowForm(false); setForm({ code: '', name: '', symbol: '', decimal_places: 2, is_base: false }); fetchCurrencies();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
    };

    const handleCreateRate = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            await api.post('/owner/finance/exchange-rates', rateForm);
            setShowRateForm(false); setRateForm({ from_currency: '', to_currency: '', rate: '', effective_date: new Date().toISOString().split('T')[0] }); fetchRates();
        } catch (err) { alert(err.response?.data?.message || 'Failed to save'); } finally { setSaving(false); }
    };

    const handleConvert = async (e) => {
        e.preventDefault();
        try {
            const res = await api.post('/owner/finance/convert', convertForm);
            setConvertResult(res.data);
        } catch (err) { alert(err.response?.data?.message || 'Conversion failed'); setConvertResult(null); }
    };

    const baseCurrency = currencies.find(c => c.is_base);

    return (
        <div className="space-y-6">
            <PageHeader title="Currencies & Exchange Rates" subtitle="Manage currencies and conversion rates" icon={<CurrencyIcon size={20} />}
                actions={<div className="flex gap-2">
                    <button onClick={() => setShowConvert(true)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:border-[#00D4AA]"><ArrowRightLeft size={16} /> Convert</button>
                    <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}><Plus size={16} /> New Currency</button>
                </div>} />

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
                <button onClick={() => setActiveTab('currencies')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'currencies' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Currencies</button>
                <button onClick={() => setActiveTab('rates')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'rates' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>Exchange Rates</button>
            </div>

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">New Currency</h3>
                        <button onClick={() => setShowForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleCreateCurrency}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Currency Code *</label>
                                <input type="text" required maxLength={3} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. USD, EUR, TZS" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20 uppercase" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Name *</label>
                                <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. US Dollar" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Symbol *</label>
                                <input type="text" required maxLength={10} value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })} placeholder="e.g. $, €, TSh" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Decimal Places</label>
                                <input type="number" min={0} max={4} value={form.decimal_places} onChange={(e) => setForm({ ...form, decimal_places: parseInt(e.target.value) || 0 })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                                    <input type="checkbox" checked={form.is_base} onChange={(e) => setForm({ ...form, is_base: e.target.checked })} className="rounded border-gray-300 text-[#00D4AA] focus:ring-[#00D4AA]" />
                                    <span className="text-sm text-gray-700">Set as base currency</span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {showRateForm && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">New Exchange Rate</h3>
                        <button onClick={() => setShowRateForm(false)} className="p-1 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                    </div>
                    <form onSubmit={handleCreateRate}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">From Currency *</label>
                                <select required value={rateForm.from_currency} onChange={(e) => setRateForm({ ...rateForm, from_currency: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">
                                    <option value="">Select...</option>
                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">To Currency *</label>
                                <select required value={rateForm.to_currency} onChange={(e) => setRateForm({ ...rateForm, to_currency: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">
                                    <option value="">Select...</option>
                                    {currencies.map(c => <option key={c.code} value={c.code}>{c.code} - {c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Rate *</label>
                                <input type="number" step="any" min="0" required value={rateForm.rate} onChange={(e) => setRateForm({ ...rateForm, rate: e.target.value })} placeholder="e.g. 2500" className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Effective Date *</label>
                                <input type="date" required value={rateForm.effective_date} onChange={(e) => setRateForm({ ...rateForm, effective_date: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-5">
                            <button type="button" onClick={() => setShowRateForm(false)} className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg">Cancel</button>
                            <button type="submit" disabled={saving} className="px-5 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>{saving ? 'Saving...' : 'Create'}</button>
                        </div>
                    </form>
                </div>
            )}

            {showConvert && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center pt-16" onClick={() => { setShowConvert(false); setConvertResult(null); }}>
                    <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between p-6 border-b">
                            <h2 className="text-lg font-bold text-gray-900">Currency Converter</h2>
                            <button onClick={() => { setShowConvert(false); setConvertResult(null); }} className="p-2 text-gray-400 hover:text-gray-600"><X size={18} /></button>
                        </div>
                        <form onSubmit={handleConvert} className="p-6 space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 mb-1 block">Amount *</label>
                                <input type="number" step="any" min="0" required value={convertForm.amount} onChange={(e) => setConvertForm({ ...convertForm, amount: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">From *</label>
                                    <select required value={convertForm.from} onChange={(e) => setConvertForm({ ...convertForm, from: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">
                                        <option value="">Select...</option>
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700 mb-1 block">To *</label>
                                    <select required value={convertForm.to} onChange={(e) => setConvertForm({ ...convertForm, to: e.target.value })} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00D4AA]/20">
                                        <option value="">Select...</option>
                                        {currencies.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="w-full px-5 py-2.5 text-sm font-medium text-white rounded-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>Convert</button>
                        </form>
                        {convertResult && (
                            <div className="px-6 pb-6">
                                <div className="bg-[#00D4AA]/10 rounded-lg p-4 text-center">
                                    <p className="text-sm text-gray-600">Result</p>
                                    <p className="text-2xl font-bold text-gray-900 mt-1">{convertForm.to} {Number(convertResult.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                                    <p className="text-xs text-gray-500 mt-1">Rate: 1 {convertResult.from} = {convertResult.rate} {convertResult.to}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00D4AA]"></div></div>
            ) : activeTab === 'currencies' ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead><tr className="border-b border-gray-100">
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Code</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Name</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Symbol</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Decimals</th>
                            <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Base</th>
                        </tr></thead>
                        <tbody>
                            {currencies.map(c => (
                                <tr key={c.code} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-3"><span className="text-sm font-bold text-gray-900">{c.code}</span></td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{c.name}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{c.symbol}</td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{c.decimal_places}</td>
                                    <td className="px-6 py-3">{c.is_base ? <Star size={16} className="text-yellow-500 fill-yellow-500" /> : null}</td>
                                </tr>
                            ))}
                            {currencies.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500 text-sm">No currencies configured. Add your first currency above.</td></tr>}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div>
                    <div className="flex justify-end mb-3">
                        <button onClick={() => setShowRateForm(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:border-[#00D4AA]"><Plus size={16} /> Add Rate</button>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <table className="w-full">
                            <thead><tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">From</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">To</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Rate</th>
                                <th className="text-left px-6 py-3 font-medium text-gray-500 text-xs uppercase">Effective Date</th>
                            </tr></thead>
                            <tbody>
                                {rates.map(r => (
                                    <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">{r.from_currency}</td>
                                        <td className="px-6 py-3 text-sm font-semibold text-gray-900">{r.to_currency}</td>
                                        <td className="px-6 py-3"><span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#00D4AA]/10 text-[#00b894]">{Number(r.rate).toLocaleString(undefined, { minimumFractionDigits: 4 })}</span></td>
                                        <td className="px-6 py-3 text-sm text-gray-600">{r.effective_date}</td>
                                    </tr>
                                ))}
                                {rates.length === 0 && <tr><td colSpan={4} className="px-6 py-12 text-center text-gray-500 text-sm">No exchange rates configured.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
