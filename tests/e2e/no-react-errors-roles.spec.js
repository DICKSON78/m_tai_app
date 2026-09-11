import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

const ROLE_ROUTES = {
    admin: [
        '/admin/dashboard',
        '/admin/shops',
        '/admin/subscriptions',
        '/admin/customers',
        '/admin/finance',
        '/admin/orders',
        '/admin/hr',
        '/admin/announcements',
        '/admin/promotions',
        '/admin/reports',
        '/admin/settings',
    ],
    customer: [
        '/customer/dashboard',
        '/customer/profile',
        '/customer/orders',
    ],
    employee: [
        '/employee/dashboard',
        '/employee/customers',
    ],
    transporter: [
        '/transporter/dashboard',
    ],
};

for (const [role, routes] of Object.entries(ROLE_ROUTES)) {
    const account = ACCOUNTS[role];
    if (!account || (account.optional && !process.env[`E2E_${role.toUpperCase()}_LOGIN`])) continue;

    test(`no ${role} route throws an uncaught React error`, async ({ page }) => {
        test.setTimeout(300000);
        const failures = [];
        await loginAs(page, account);
        await page.waitForTimeout(1200);

        for (const route of routes) {
            const pageErrors = [];
            const onError = (e) => pageErrors.push(String(e.message || e).slice(0, 200));
            page.on('pageerror', onError);

            await page.goto(route, { waitUntil: 'domcontentloaded' });
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(1800);

            page.off('pageerror', onError);
            if (pageErrors.length > 0) failures.push({ route, errors: pageErrors });
        }

        console.log(`${role.toUpperCase()}_CRAWL_FAILURES`, JSON.stringify(failures, null, 2));
        expect(failures, `${role} crawl`).toEqual([]);
    });
}