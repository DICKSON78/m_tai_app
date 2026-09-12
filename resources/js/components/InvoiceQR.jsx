import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export function buildInvoicePayload({ number, total, date, status, customer }) {
    return [
        number ? `INV ${number}` : '',
        `TZS ${Number(total || 0).toLocaleString()}`,
        date || '',
        (status || '').toUpperCase(),
        customer ? `Billed to: ${customer}` : '',
    ].filter(Boolean).join(' | ');
}

export default function InvoiceQR({ number, total, date, status, customer, size = 96 }) {
    return (
        <div className="inline-flex flex-col items-center gap-1.5 p-2.5 border border-gray-200 rounded-xl bg-white">
            <QRCodeSVG value={buildInvoicePayload({ number, total, date, status, customer })} size={size} level="M" includeMargin={false} />
            <span className="text-[9px] uppercase tracking-wider text-gray-400 font-medium">Scan to verify</span>
        </div>
    );
}