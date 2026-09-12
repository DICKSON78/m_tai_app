import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

const OWNER_ROUTES = [
    '/owner/dashboard',
    '/owner/businesses',
    '/owner/products',
    '/owner/categories',
    '/owner/customers',
    '/owner/employees',
    '/owner/inventory',
    '/owner/orders',
    '/owner/notifications',
    '/owner/loans',
    '/owner/expenses',
    '/owner/credit-sales',
    '/owner/imports',
    '/owner/projects',
    '/owner/investments',
    '/owner/deliveries',
    '/owner/coupons',
    '/owner/reports',
    '/owner/barcodes',
    '/owner/export',
    '/owner/receipts',
    '/owner/finance/accounts',
    '/owner/finance/journal',
    '/owner/finance/invoices',
    '/owner/finance/bills',
    '/owner/finance/bank-accounts',
    '/owner/finance/reports',
    '/owner/hr/employees',
    '/owner/hr/recruitment',
    '/owner/purchases/suppliers',
    '/owner/purchases/orders',
    '/owner/purchases/receptions',
    '/owner/warehouses',
    '/owner/manufacturing',
];

test('no owner route throws an uncaught React error', async ({ page }) => {
    test.setTimeout(600000);
    const failures = [];
    await loginAs(page, ACCOUNTS.owner);
    await page.waitForTimeout(1500);

    for (const route of OWNER_ROUTES) {
        const pageErrors = [];
        const onError = (e) => pageErrors.push(String(e.message || e).slice(0, 200));
        page.on('pageerror', onError);

        await page.goto(route, { waitUntil: 'domcontentloaded' });
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(1800);

        page.off('pageerror', onError);

        // Some routes may never settle if their API 500s; only a crashing page
        // leaves the SPA blank. Treat an uncaught React error as a failure.
        if (pageErrors.length > 0) {
            failures.push({ route, errors: pageErrors });
        }
    }

    console.log('CRAWL_FAILURES', JSON.stringify(failures, null, 2));
    expect(failures).toEqual([]);
});