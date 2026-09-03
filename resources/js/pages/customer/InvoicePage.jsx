import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import { FileText, Printer, ArrowLeft, Download } from 'lucide-react';

export default function InvoicePage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        api.get(`/orders/${id}/receipt`)
            .then(res => setInvoice(res.data?.receipt || res.data))
            .catch(err => setError(err.response?.data?.message || 'Failed to load invoice'))
            .finally(() => setLoading(false));
    }, [id]);

    const openPrint = () => {
        if (!invoice) return;
        const w = window.open('', '_blank');
        if (w) {
            w.document.write(`<html><head><title>Invoice ${invoice.order?.transaction_code || ''}</title></head><body>${document.getElementById('invoice-html')?.innerHTML || ''}</body></html>`);
            w.document.close();
            w.print();
        }
    };

    const fmt = (v) => {
        const n = Number(v ?? 0);
        return 'TZS ' + n.toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error || !invoice) {
        return (
            <div className="card empty-state">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <FileText className="w-10 h-10 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">Invoice not found</h2>
                <p className="text-gray-500 mb-6">{error || 'This order has no invoice.'}</p>
                <Link to="/customer/orders" className="btn-primary inline-flex">
                    Back to Orders
                </Link>
            </div>
        );
    }

    const biz = invoice.business || {};
    const ord = invoice.order || {};
    const items = invoice.items || [];

    return (
        <div>
            <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
                <PageHeader
                    title="Invoice"
                    subtitle={`${ord.transaction_code || `Order #${id}`} · ${ord.date || ''}`}
                    icon={<FileText size={20} />}
                />
                <div className="flex items-center gap-2">
                    <button onClick={() => navigate(`/customer/orders/${id}`)} className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <ArrowLeft size={16} /> Back
                    </button>
                    <button onClick={openPrint} className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-white rounded-lg" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                        <Printer size={16} /> Print
                    </button>
                </div>
            </div>

            <div id="invoice-html" className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Brand header */}
                <div className="px-6 py-5 text-white" style={{ background: 'linear-gradient(135deg, #00D4AA, #00b894)' }}>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                        <div>
                            <p className="text-2xl font-black tracking-tight">M-TAI INVOICE</p>
                            <p className="text-sm text-white/80 mt-0.5">{biz.name || 'M-TAI Marketplace'}</p>
                            <p className="text-xs text-white/70">{biz.code || ''}</p>
                            {biz.address ? <p className="text-xs text-white/70 mt-0.5">{biz.address}</p> : null}
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-white/80 uppercase tracking-widest">Invoice No.</p>
                            <p className="text-base font-bold">{ord.transaction_code || '—'}</p>
                            <p className="text-xs text-white/80 mt-1">Date: {ord.date || '—'}</p>
                            <p className="text-xs text-white/80">Payment: {ord.payment_method || '—'}</p>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="px-6 py-3 flex items-center gap-2 border-b border-gray-100 bg-gray-50">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${ord.status === 'completed' ? 'bg-[#d0f9f1] text-[#006b53]' : 'bg-amber-100 text-amber-700'}`}>
                        {(ord.status || 'Pending').toUpperCase()}
                    </span>
                    <span className="text-xs text-gray-500">Billed to: {invoice.customer_name || 'Customer'}</span>
                    <span className="ml-auto text-xs text-gray-400">{biz.phone || ''}</span>
                </div>

                {/* Items */}
                <div className="px-6 py-5">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-gray-400 uppercase border-b border-gray-200">
                                <th className="py-2 pr-3 font-semibold">Item</th>
                                <th className="py-2 pr-3 font-semibold text-right">Qty</th>
                                <th className="py-2 pr-3 font-semibold text-right">Price</th>
                                <th className="py-2 font-semibold text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((item, i) => (
                                <tr key={i} className="border-b border-gray-50">
                                    <td className="py-3 pr-3 text-gray-800 font-medium">{item.name}</td>
                                    <td className="py-3 pr-3 text-right text-gray-600">{item.quantity}</td>
                                    <td className="py-3 pr-3 text-right text-gray-600">{fmt(item.price)}</td>
                                    <td className="py-3 text-right text-gray-900 font-semibold">{fmt(item.total)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Totals */}
                    <div className="flex justify-end mt-4">
                        <div className="w-full max-w-xs space-y-1.5 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-medium text-gray-800">{fmt(invoice.subtotal)}</span>
                            </div>
                            {Number(invoice.discount) > 0 && (
                                <div className="flex justify-between text-gray-600">
                                    <span>Discount</span>
                                    <span className="font-medium text-red-500">-{fmt(invoice.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-gray-600">
                                <span>Tax</span>
                                <span className="font-medium text-gray-800">{fmt(invoice.tax)}</span>
                            </div>
                            <div className="flex justify-between border-t border-gray-200 pt-2 text-base font-black">
                                <span className="text-gray-900">TOTAL</span>
                                <span style={{ color: '#00b894' }}>{fmt(invoice.total)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Paid</span>
                                <span className="font-medium text-gray-800">{fmt(invoice.amount_paid)}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>Change</span>
                                <span className="font-medium text-gray-800">{fmt(invoice.change)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 text-center text-sm text-gray-500 border-t border-dashed border-gray-200">
                    {invoice.footer || 'Asante kwa kununua!'}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-center">
                <button onClick={openPrint} className="flex items-center gap-1.5 text-sm font-bold text-primary-dark hover:opacity-80 transition-opacity">
                    <Download size={16} /> Download / Print Invoice
                </button>
            </div>
        </div>
    );
}