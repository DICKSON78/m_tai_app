import { test } from '@playwright/test';
import { assertReachable } from './helpers.js';

// Juma (seeded owner) logs in during the setup project; reuse that state.
test.use({ storageState: 'test-results/states/owner.json' });

// View-only smoke coverage across the owner module. assertReachable proves each
// page is not bounced back to /login (the role may access it) and that all its
// /api/ requests round-trip without 4xx/5xx. These pages never mutate data, so
// the suite stays zero-junk against the live deployment.
const PAGES = [
    '/owner/dashboard',
    '/owner/orders',
    '/owner/customers',
    '/owner/categories',
    '/owner/coupons',
    '/owner/expenses',
    '/owner/inventory',
    '/owner/investments',
    '/owner/projects',
    '/owner/purchases/invoices',
    '/owner/finance/accounts',
    '/owner/finance/bills',
    '/owner/finance/journal',
    '/owner/finance/reports',
    '/owner/hr/employees',
    '/owner/hr/attendance',
    '/owner/hr/payroll',
    '/owner/notifications',
    '/owner/profile',
];

test.describe('Owner role', () => {
    for (const path of PAGES) {
        test(`page loads: ${path}`, async ({ page }) => {
            await assertReachable(page, path);
        });
    }
});