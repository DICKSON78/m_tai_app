import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

const ROUTES = [
    '/owner/finance/bills',
    '/owner/finance/invoices',
    '/owner/finance/journal',
    '/owner/imports',
    '/owner/purchases/suppliers',
    '/owner/purchases/orders',
    '/owner/purchases/receptions',
    '/owner/purchases/returns',
    '/owner/purchases/supplier-invoices',
    '/owner/purchases/supplier-payments',
];

test('converted modal pages render without React errors', async ({ page }) => {
    test.setTimeout(600000);
    const failures = [];
    await loginAs(page, ACCOUNTS.owner);
    await page.waitForTimeout(1500);

    for (const route of ROUTES) {
        const pageErrors = [];
        const onError = (e) => pageErrors.push(String(e.message || e).slice(0, 200));
        page.on('pageerror', onError);
        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForTimeout(1500);
        page.off('pageerror', onError);
        if (pageErrors.length) failures.push(`${route}: ${pageErrors.join(' | ')}`);
    }
    console.log('FAILURES:', JSON.stringify(failures));
    expect(failures).toEqual([]);
});