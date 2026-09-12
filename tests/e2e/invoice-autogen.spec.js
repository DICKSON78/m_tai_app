import { test, expect } from '@playwright/test';
test.use({ storageState: './test-results/states/owner.json' });

const BASE = 'https://mtai-app-903291264005.africa-south1.run.app';
const cleanupNums = (val) => [val, 'SINV-2026-00001', 'SINV-2026-00002'];

test('supplier invoice auto-generated number', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|file:\/\/|PHANTOM|moz-extension/.test(m.text())) errors.push(m.text()); });

    await page.goto('/owner/purchases/invoices');
    await page.getByRole('heading', { name: 'Supplier Invoices' }).waitFor({ timeout: 25000 });
    await page.waitForTimeout(3000);
    expect(errors.filter((e) => /fetchSummary is not defined/.test(e))).toEqual([]);

    await page.getByRole('button', { name: 'New Invoice', exact: true }).click();
    const dialog = page.getByRole('dialog');
    const numInput = dialog.locator('input[placeholder="Auto-generated"]');
    await numInput.waitFor({ timeout: 10000 });
    await expect(async () => {
        expect(await numInput.inputValue()).toMatch(/^SINV-\d{4}-\d{5}$/);
    }).toPass({ timeout: 10000 });
    const val = await numInput.inputValue();
    console.log('AUTOGEN NUMBER:', val);
    expect(await numInput.getAttribute('required')).toBeNull();
    await expect(dialog.getByText('Auto', { exact: true })).toBeVisible();

    const supplier = dialog.locator('select').first();
    const supplierCount = await supplier.locator('option').count();
    console.log('SUPPLIER OPTIONS:', supplierCount);
    if (supplierCount < 2) { console.log('SKIP-CREATE: no suppliers'); return; }
    await supplier.selectOption({ index: 1 });

    await dialog.locator('input[type="text"]').nth(1).fill('E2E auto-number test');
    await dialog.getByRole('button', { name: 'Create Invoice' }).click();
    await expect(dialog).toBeHidden({ timeout: 20000 });

    const row = page.locator('tbody tr', { hasText: val });
    console.log('ROW FOUND:', await row.count());
    await expect(row).toHaveCount(1, { timeout: 15000 });

    expect(errors).toEqual([]);
    console.log('ERRORS: NONE');

    // cleanup via API
    const token = await page.evaluate(() => localStorage.getItem('auth_token') || '');
    const hdrs = { Authorization: `Bearer ${token}` };
    const list = await page.request.get(`${BASE}/api/owner/purchases/invoices?per_page=100`, { headers: hdrs });
    const items = (await list.json()).data || [];
    console.log('CLEANUP TARGETS:');
    for (const num of cleanupNums(val)) {
        const targets = items.filter((i) => i.invoice_number === num);
        for (const t of targets) {
            const res = await page.request.delete(`${BASE}/api/owner/purchases/invoices/${t.id}`, { headers: hdrs });
            console.log(`  ${num} id=${t.id} -> ${res.status()}`);
        }
    }
    await page.reload();
    for (const num of cleanupNums(val)) {
        await expect(page.locator('tbody tr', { hasText: num })).toHaveCount(0, { timeout: 10000 });
    }
    console.log('CLEANED UP');
});
