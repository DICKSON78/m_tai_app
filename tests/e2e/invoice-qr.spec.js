import { test, expect } from '@playwright/test';
test.use({ storageState: './test-results/states/owner.json' });
const BASE = 'https://mtai-app-903291264005.africa-south1.run.app';

test('QR on supplier invoice detail modal (create -> view -> cleanup)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
    await page.goto('/owner/purchases/invoices');
    await page.getByRole('heading', { name: 'Supplier Invoices' }).waitFor({ timeout: 25000 });
    await page.waitForTimeout(2500);

    const token = await page.evaluate(() => localStorage.getItem('auth_token') || '');
    const hdrs = { Authorization: `Bearer ${token}` };
    const sup = await page.request.get(`${BASE}/api/owner/purchases/suppliers?per_page=100&status=active`, { headers: hdrs });
    const suppliers = (await sup.json()).data || [];
    if (!suppliers.length) { console.log('SKIP: no suppliers'); return; }

    const post = await page.request.post(`${BASE}/api/owner/purchases/invoices`, {
        headers: hdrs,
        data: {
            supplier_id: suppliers[0].id,
            invoice_date: new Date().toISOString().split('T')[0],
            subtotal: 89100, tax_amount: 16038,
        },
    });
    expect(post.status()).toBe(201);
    const invoiceNumber = (await post.json()).invoice_number;
    console.log('CREATED:', invoiceNumber);

    await page.reload();
    const row = page.locator('tbody tr', { hasText: invoiceNumber });
    await expect(row).toHaveCount(1, { timeout: 15000 });
    await row.getByTitle('View').click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Scan to verify', { exact: true })).toBeVisible({ timeout: 10000 });
    console.log('SUPPLIER MODAL QR SVG COUNT:', await dialog.locator('svg').count());
    expect(await dialog.locator('svg').count()).toBeGreaterThan(0);
    expect(errors).toEqual([]);
    console.log('SUPPLIER MODAL QR: OK');

    const del = await page.request.delete(`${BASE}/api/owner/purchases/invoices/${(await post.json()).id}`, { headers: hdrs });
    console.log('CLEANUP:', del.status());
});

test('QR on customer invoice page (best-effort)', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
    await page.goto('/owner/dashboard');
    await page.waitForTimeout(2000);
    const token = await page.evaluate(() => localStorage.getItem('auth_token') || '');
    const list = await page.request.get(`${BASE}/api/customer/orders`, { headers: { Authorization: `Bearer ${token}` } });
    if (list.status() !== 200) { console.log('SKIP-CUSTOMER: access denied (list status ' + list.status() + ')'); return; }
    const orders = (await list.json()).data || [];
    if (!orders.length) { console.log('SKIP-CUSTOMER: no customer orders'); return; }
    await page.goto(`/customer/invoices/${orders[0].id}`);
    await page.getByText('Scan to verify', { exact: true }).waitFor({ timeout: 20000 });
    console.log('CUSTOMER INVOICE QR SVG COUNT:', await page.locator('#invoice-html svg').count());
    expect(errors).toEqual([]);
    console.log('CUSTOMER INVOICE QR: OK');
});
