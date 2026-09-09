import { expect } from '@playwright/test';

// A listener that watches every /api/ request made by the app and records any
// that fail to reach the server or come back with an HTTP error (>=400). This
// is the backbone of the "the system must not return 404/500/503" guarantee:
// every page we visit must round-trip its API calls cleanly.
export function watchApi(page, log = false) {
    const errors = [];
    page.on('response', (res) => {
        const url = res.url();
        if (!url.includes('/api/')) return;
        const status = res.status();
        if (status >= 400) {
            const entry = { method: res.request().method(), url, status };
            if (log) console.log(`API ${status} ${entry.method} ${url}`);
            errors.push(entry);
        }
    });
    page.on('requestfailed', (req) => {
        const url = req.url();
        if (!url.includes('/api/')) return;
        const entry = { method: req.method(), url, status: 'FAILED' };
        if (log) console.log(`API FAILED ${entry.method} ${url}`);
        errors.push(entry);
    });
    return errors;
}

// Assert that no API errors were recorded during the flow.
export function expectNoApiErrors(errors) {
    expect(errors, `API errors detected: ${JSON.stringify(errors)}`).toEqual([]);
}

// Shared fixture of login accounts per role.
// Prefer environment variables so credentials are not hard-coded in the repo,
// but fall back to the seeded M-TAI accounts used by other specs.
export const ACCOUNTS = {
    admin: {
        name: 'admin',
        login: process.env.E2E_ADMIN_LOGIN || 'admin@m-tai.com',
        password: process.env.E2E_ADMIN_PASSWORD || 'password',
        dash: '/admin/dashboard',
    },
    owner: {
        name: 'business_owner',
        login: process.env.E2E_OWNER_LOGIN || 'juma@m-tai.com',
        password: process.env.E2E_OWNER_PASSWORD || 'password',
        dash: '/owner/dashboard',
    },
    customer: {
        name: 'customer',
        login: process.env.E2E_CUSTOMER_LOGIN || 'amina@m-tai.com',
        password: process.env.E2E_CUSTOMER_PASSWORD || 'password',
        dash: '/customer/dashboard',
    },
    employee: {
        name: 'employee',
        login: process.env.E2E_EMPLOYEE_LOGIN || 'esther@m-tai.com',
        password: process.env.E2E_EMPLOYEE_PASSWORD || 'password',
        dash: '/employee/dashboard',
        // Employee accounts are created by owners, so they may not exist on
        // every environment. Skip tests that depend on them unless explicitly
        // enabled.
        optional: true,
    },
    transporter: {
        name: 'transporter',
        login: process.env.E2E_TRANSPORTER_LOGIN || '',
        password: process.env.E2E_TRANSPORTER_PASSWORD || 'password',
        dash: '/transporter/dashboard',
        optional: true,
    },
};

/**
 * Log a user in through the live UI.
 */
export async function loginAs(page, account) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.fill('input[placeholder*="Email"], input[placeholder*="user code"]', account.login);
    await page.locator('input[type="password"]').fill(account.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**' + account.dash, { timeout: 45000 });
}

/**
 * Open a protected route for a logged-in user and assert it is reachable and
 * actually rendered (rather than being bounced to /login because the user is
 * unauthorised). The app's ProtectedRoute redirects unauthorised users back to
 * /login, so landing anywhere other than /login proves the role may access it.
 */
export async function assertReachable(page, path) {
    const apiErrors = watchApi(page);
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    // Wait for a settled state, then confirm we were NOT bounced to login.
    await page.waitForLoadState('domcontentloaded');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
    // Give in-flight API calls a moment to settle, then assert none failed.
    await page.waitForTimeout(1500);
    expectNoApiErrors(apiErrors);
}