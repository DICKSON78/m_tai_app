import { test, expect } from '@playwright/test';
test.use({ storageState: './test-results/states/owner.json' });

test('finance reports: all tabs render with data, no errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|file:\/\/|PHANTOM|moz-extension/.test(m.text())) errors.push(m.text()); });

    await page.goto('/owner/finance/reports');
    await page.getByRole('heading', { name: 'Financial Reports' }).waitFor({ timeout: 25000 });

    // Profit & Loss (default)
    await expect(page.getByText('Total Revenue', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Net Profit / (Loss)', { exact: true })).toBeVisible();
    console.log('OK: profit-loss renders');

    // Balance Sheet + Edit/Generate dates
    await page.getByRole('button', { name: 'Balance Sheet', exact: true }).click();
    await expect(page.getByText('Total Assets', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Total Liabilities & Equity', { exact: true })).toBeVisible();
    console.log('OK: balance-sheet renders');

    // Cash Flow with date range generate
    await page.getByRole('button', { name: 'Cash Flow', exact: true }).click();
    await expect(page.getByText('Net Cash Flow', { exact: true })).toBeVisible({ timeout: 15000 });
    const from = page.locator('input[type="date"]').first();
    await from.fill('2026-01-01');
    await page.getByRole('button', { name: 'Generate Report' }).click();
    await expect(page.getByText('Net Cash Flow', { exact: true })).toBeVisible({ timeout: 15000 });
    console.log('OK: cash-flow renders + date generate');

    // Trial Balance
    await page.getByRole('button', { name: 'Trial Balance', exact: true }).click();
    await expect(page.getByText('Total', { exact: true })).toBeVisible({ timeout: 15000 });
    console.log('OK: trial-balance renders');

    // Print / Save PDF button present + Refresh works
    await page.getByRole('button', { name: 'Profit & Loss', exact: true }).click();
    await expect(page.getByText('Total Revenue', { exact: true })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(page.getByText('Total Revenue', { exact: true })).toBeVisible({ timeout: 15000 });
    await expect(page.getByRole('button', { name: 'Print / Save as PDF' })).toBeVisible();
    console.log('OK: refresh + print buttons');

    expect(errors).toEqual([]);
    console.log('ERRORS:', errors.length ? errors.join(' | ') : 'NONE');
});
