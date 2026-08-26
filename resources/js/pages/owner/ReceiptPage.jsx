import React, { useState } from 'react';
import api from '../../services/api';
import PageHeader from '../../components/casfeta/PageHeader';
import SectionHeader from '../../components/casfeta/SectionHeader';
import FormField from '../../components/casfeta/FormField';
import EmptyState from '../../components/casfeta/EmptyState';
import ActionBar from '../../components/casfeta/ActionBar';
import { ReceiptText, Hash, Printer, Loader2 } from 'lucide-react';

export default function ReceiptPage() {
    const [orderId, setOrderId] = useState('');
    const [receipt, setReceipt] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleGenerate = async () => {
        if (!orderId) return;
        setLoading(true); setError(''); setReceipt(null);
        try { const res = await api.get(`/orders/${orderId}/receipt`); setReceipt(res.data); }
        catch (error) { console.error('Failed to generate receipt:', error); setError('Failed to generate receipt. Please check the order number.'); }
        finally { setLoading(false); }
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        const content = document.getElementById('receipt-content');
        if (printWindow && content) {
            printWindow.document.write(`<html><head><title>Receipt</title><style>body{font-family:'Poppins',sans-serif;padding:20px;}table{width:100%;border-collapse:collapse;}td,th{padding:8px;border-bottom:1px solid #eee;text-align:left;}</style></head><body>${content.innerHTML}</body></html>`);
            printWindow.document.close();
            printWindow.print();
        }
    };

    return (
        <div className="space-y-6">
            <PageHeader title="Receipt Generator" subtitle="Generate and print receipts for your orders." icon={<ReceiptText size={20} />} />

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <SectionHeader icon={<Hash size={18} />} title="Order Details" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                    <div className="sm:col-span-2">
                        <FormField label="Order Number" icon={<Hash size={16} />}>
                            <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Enter order number"
                                className="w-full pl-10 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00D4AA] focus:border-[#00D4AA]" />
                        </FormField>
                    </div>
                    <button onClick={handleGenerate} disabled={!orderId || loading}
                        className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#00D4AA] text-white rounded-lg text-sm font-medium hover:bg-[#00B894] transition-all shadow-md disabled:opacity-50 h-[48px]">
                        {loading ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><ReceiptText size={16} /> Generate Receipt</>}
                    </button>
                </div>
            </div>

            {error && (
                <div className="bg-white rounded-xl border border-red-200 shadow-sm p-4 border-l-4 border-l-red-500">
                    <p className="text-sm text-red-700">{error}</p>
                </div>
            )}

            {receipt && !loading && (
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <SectionHeader icon={<ReceiptText size={18} />} title={`Receipt for Order #${orderId}`} />
                        <button onClick={handlePrint} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all">
                            <Printer size={16} /> Print
                        </button>
                    </div>
                    <div id="receipt-content">
                        {receipt.receipt_image || receipt.image ? (
                            <img src={receipt.receipt_image || receipt.image} alt="Receipt" className="mx-auto max-w-md" />
                        ) : receipt.html ? (
                            <div dangerouslySetInnerHTML={{ __html: receipt.html }} />
                        ) : receipt.items ? (
                            <div className="space-y-4 max-w-md mx-auto">
                                <div className="text-center border-b border-gray-200 pb-4">
                                    <h4 className="font-bold text-xl text-gray-900">M-TAI</h4>
                                    <p className="text-sm text-gray-500">Sales Receipt</p>
                                </div>
                                <div className="text-sm text-gray-600 space-y-1">
                                    <div className="flex justify-between"><span>Order #</span><span className="font-medium text-gray-900">{receipt.order_number || orderId}</span></div>
                                    <div className="flex justify-between"><span>Date</span><span className="font-medium text-gray-900">{receipt.date ? new Date(receipt.date).toLocaleDateString('en-US') : receipt.created_at ? new Date(receipt.created_at).toLocaleDateString('en-US') : '-'}</span></div>
                                    {receipt.customer && <div className="flex justify-between"><span>Customer</span><span className="font-medium text-gray-900">{receipt.customer}</span></div>}
                                </div>
                                <table className="w-full text-sm">
                                    <thead><tr className="border-b border-gray-200"><th className="text-left py-2 font-medium text-gray-500">Product</th><th className="text-center py-2 font-medium text-gray-500">Qty</th><th className="text-right py-2 font-medium text-gray-500">Price</th></tr></thead>
                                    <tbody>
                                        {receipt.items.map((item, i) => (
                                            <tr key={i} className="border-b border-gray-100">
                                                <td className="py-2 text-gray-800">{item.name || item.product_name}</td>
                                                <td className="py-2 text-center text-gray-600">{item.quantity}</td>
                                                <td className="py-2 text-right font-medium text-gray-800">TZS {Number(item.price || item.total || 0).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <div className="border-t border-gray-200 pt-3 flex justify-between font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-[#00D4AA]">TZS {Number(receipt.total || receipt.total_amount || 0).toLocaleString()}</span>
                                </div>
                                {receipt.payment_method && (
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Payment Method</span><span>{receipt.payment_method}</span>
                                    </div>
                                )}
                                <p className="text-center text-xs text-gray-400 mt-4">Thank you for your purchase!</p>
                            </div>
                        ) : (
                            <pre className="text-xs text-gray-600 bg-gray-50 p-4 rounded-xl overflow-auto">{JSON.stringify(receipt, null, 2)}</pre>
                        )}
                    </div>
                </div>
            )}

            {!receipt && !loading && !error && (
                <EmptyState title="Enter Order Number" description="Enter an order number above to view and print its receipt." />
            )}
        </div>
    );
}
