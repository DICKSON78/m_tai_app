import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

export interface PdfReceipt {
  business?: { name?: string; code?: string; address?: string; phone?: string };
  order?: {
    transaction_code?: string;
    date?: string;
    status?: string;
    payment_method?: string;
  };
  items?: { name: string; quantity: number; price: string; total: string }[];
  subtotal?: string;
  discount?: string;
  tax?: string;
  total?: string;
  amount_paid?: string;
  change?: string;
  footer?: string;
}

export interface PdfInvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

function esc(v?: string | number | null): string {
  return String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function receiptHtml(rc: PdfReceipt): string {
  const business = rc.business ?? {};
  const orderMeta = rc.order ?? {};
  const items = rc.items ?? [];

  const itemRows = items
    .map(
      (it) =>
        `<tr><td>${esc(it.name)}</td><td style="text-align:right">${esc(it.quantity)}</td><td style="text-align:right">${esc(it.price)}</td><td style="text-align:right">${esc(it.total)}</td></tr>`
    )
    .join('');

  const discountRow =
    rc.discount && Number(rc.discount) > 0
      ? `<tr><td style="text-align:left">Discount</td><td style="text-align:right">-${esc(rc.discount)}</td><td></td><td></td></tr>`
      : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Roboto, sans-serif; color: #111; padding: 8px; }
    .center { text-align: center; }
    .bold { font-weight: 700; }
    .mono { font-family: monospace; }
    .biz { font-size: 15px; }
    .meta { font-size: 11px; margin-top: 6px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    td, th { padding: 3px 2px; }
    .border { border-top: 1px dashed #999; margin: 8px 0; }
    .total { font-weight: 800; font-size: 14px; }
  </style></head><body>
    <div class="center bold biz">${esc(business.name)}</div>
    <div class="center mono">${esc(business.code)}</div>
    <div class="center mono">${esc(business.phone)}</div>
    <div class="border"></div>
    <div class="meta mono">
      <div><b>Transaction:</b> ${esc(orderMeta.transaction_code)}</div>
      <div><b>Date:</b> ${esc(orderMeta.date)}</div>
      <div><b>Payment:</b> ${esc(orderMeta.payment_method)}</div>
    </div>
    <div class="border"></div>
    <table>
      <tr><td><b>Item</b></td><td style="text-align:right"><b>Qty</b></td><td style="text-align:right"><b>Price</b></td><td style="text-align:right"><b>Total</b></td></tr>
      ${itemRows}
    </table>
    <div class="border"></div>
    <table>
      <tr><td>Subtotal</td><td style="text-align:right">${esc(rc.subtotal)}</td><td></td><td></td></tr>
      ${discountRow}
      <tr><td>Tax</td><td style="text-align:right">${esc(rc.tax)}</td><td></td><td></td></tr>
      <tr class="total"><td>TOTAL</td><td style="text-align:right">${esc(rc.total)}</td><td></td><td></td></tr>
      <tr><td>Paid</td><td style="text-align:right">${esc(rc.amount_paid)}</td><td></td><td></td></tr>
      <tr><td>Change</td><td style="text-align:right">${esc(rc.change)}</td><td></td><td></td></tr>
    </table>
    <div class="border"></div>
    <div class="center mono">${esc(rc.footer)}</div>
  </body></html>`;
}

export function invoiceHtml(params: {
  businessName: string;
  businessCode: string;
  businessAddress: string;
  businessPhone: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  status: string;
  customerName: string;
  notes: string;
  items: PdfInvoiceItem[];
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  total: string;
  amountPaid: string;
  balance: string;
}): string {
  const rows = params.items
    .map(
      (it) =>
        `<tr><td>${esc(it.description)}</td><td style="text-align:right">${esc(it.quantity)}</td><td style="text-align:right">${it.unit_price.toLocaleString()}</td><td style="text-align:right">${esc(it.tax_rate)}%</td><td style="text-align:right">${Number(it.amount).toLocaleString()}</td></tr>`
    )
    .join('');
  const discountRow =
    Number(params.discountAmount) > 0
      ? `<tr><td colspan="4">Discount</td><td style="text-align:right">-${params.discountAmount}</td></tr>`
      : '';
  const notesBlock = params.notes ? `<div style="margin-top:18px;border-top:1px solid #eee;padding-top:10px;font-size:11px;color:#777;"><b>Notes:</b> ${esc(params.notes)}</div>` : '';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body { font-family: -apple-system, Roboto, sans-serif; color: #333; padding: 16px; font-size: 13px; }
    .hdr { display: flex; justify-content: space-between; margin-bottom: 18px; }
    .hdr h1 { margin: 0 0 4px; font-size: 18px; color: #2563eb; }
    .hdr p { margin: 1px 0; font-size: 11px; color: #666; }
    .inv-label { font-size: 26px; font-weight: 800; color: #2563eb; text-transform: uppercase; }
    .info { display: flex; justify-content: space-between; background: #f9fafb; padding: 12px; margin-bottom: 12px; }
    .info h3 { margin: 0 0 4px; font-size: 10px; text-transform: uppercase; color: #999; }
    .info p { margin: 1px 0; font-size: 12px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
    th { background: #2563eb; color: #fff; padding: 8px; text-align: left; font-size: 11px; }
    th:last-child { text-align: right; }
    td { padding: 6px; border-bottom: 1px solid #eee; }
    .totals { margin-left: auto; width: 260px; }
    .totals td { padding: 4px 6px; }
    .totals .g total-row td { font-weight: 800; font-size: 15px; color: #2563eb; }
    .badge { display: inline-block; padding: 3px 8px; border-radius: 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: #dbeafe; color: #1e40af; }
  </style></head><body>
    <div class="hdr">
      <div><h1>${esc(params.businessName)}</h1><p>${esc(params.businessCode)}</p><p>${esc(params.businessAddress)}</p><p>${esc(params.businessPhone)}</p></div>
      <div style="text-align:right"><div class="inv-label">Invoice</div><p><b>#${esc(params.invoiceNumber)}</b></p></div>
    </div>
    <div class="info">
      <div><h3>Bill To</h3><p><b>${esc(params.customerName)}</b></p></div>
      <div><h3>Invoice Date</h3><p>${esc(params.date)}</p></div>
      <div><h3>Due Date</h3><p>${esc(params.dueDate)}</p></div>
      <div><h3>Status</h3><p><span class="badge">${esc(params.status)}</span></p></div>
    </div>
    <table>
      <tr><th>Description</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Tax</th><th style="text-align:right">Amount</th></tr>
      ${rows}
    </table>
    <div class="totals">
      <table>
        <tr><td>Subtotal</td><td style="text-align:right">${esc(params.subtotal)}</td></tr>
        ${discountRow}
        <tr><td>Tax</td><td style="text-align:right">${esc(params.taxAmount)}</td></tr>
        <tr class="total-row"><td>Total</td><td style="text-align:right">${esc(params.total)}</td></tr>
        <tr><td>Paid</td><td style="text-align:right">${esc(params.amountPaid)}</td></tr>
        <tr><td><b>Balance Due</b></td><td style="text-align:right"><b>${esc(params.balance)}</b></td></tr>
      </table>
    </div>
    ${notesBlock}
  </body></html>`;
}

export async function sharePdf(html: string, filename: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: filename, UTI: 'com.adobe.pdf' });
  } else {
    await Print.printAsync({ html });
  }
}

export async function saveReceiptPdf(rc: PdfReceipt): Promise<void> {
  await sharePdf(receiptHtml(rc), 'receipt.pdf');
}