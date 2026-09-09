import { test, expect } from '@playwright/test';

// Cross-role access control: a user with role X must NOT be able to open the
// protected pages of role Y. When a protected route is hit with the wrong
// role, the app's ProtectedRoute redirects the user away (often to "/").
const HIGHER_ROLES = [
    {
        name: 'business_owner',
        state: 'test-results/states/owner.json',
        forbidden: ['/admin/dashboard', '/admin/shops', '/employee/dashboard', '/transporter/dashboard'],
    },
    {
        name: 'admin',
        state: 'test-results/states/admin.json',
        forbidden: ['/owner/dashboard', '/customer/dashboard', '/employee/dashboard', '/transporter/dashboard'],
    },
    {
        name: 'customer',
        state: 'test-results/states/customer.json',
        forbidden: ['/admin/dashboard', '/owner/dashboard', '/employee/dashboard', '/transporter/dashboard'],
    },
];

for (const role of HIGHER_ROLES) {
    test.describe(`${role.name} isolation`, () => {
        test.use({ storageState: role.state });

        test(`cannot access other roles' pages`, async ({ page }) => {
            for (const path of role.forbidden) {
                await page.goto(path, { waitUntil: 'domcontentloaded' });
                // Wrong-role access must bounce away from the protected page.
                await expect(page).not.toHaveURL(path, { timeout: 30000 });
                await page.waitForLoadState('domcontentloaded');
            }
        });
    });
}

test.describe('Guest access', () => {
    // No stored login -> the app routes guests to /login on protected pages.
    test.use({ storageState: { cookies: [], origins: [] } });

    test('guest is redirected to login on all protected routes', async ({ page }) => {
        const paths = [
            '/admin/dashboard',
            '/admin/shops',
            '/owner/dashboard',
            '/owner/products',
            '/employee/dashboard',
            '/customer/dashboard',
            '/transporter/dashboard',
        ];
        for (const path of paths) {
            await page.goto(path, { waitUntil: 'domcontentloaded' });
            await expect(page).toHaveURL(/\/login/, { timeout: 30000 });
        }
    });
});
