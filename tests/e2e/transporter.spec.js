import { test, expect } from '@playwright/test';

// Transporter accounts are created by owners, so may not exist in every
// deployed environment. Skip unless a login is supplied via env vars (the
// setup project then saves the corresponding storage state).
test.skip(({ }) => !process.env.E2E_TRANSPORTER_LOGIN, 'No transporter test account configured (set E2E_TRANSPORTER_LOGIN)');
test.use({ storageState: 'test-results/states/transporter.json' });

test.describe('Transporter role', () => {

    test('transporter dashboard loads', async ({ page }) => {
        await page.goto('/transporter/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/transporter\/dashboard/);
        await expect(page.getByText('Transporter Dashboard')).toBeVisible({ timeout: 30000 });
    });

    test('can view deliveries page', async ({ page }) => {
        await page.goto('/transporter/deliveries', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/deliver/i).first()).toBeVisible({ timeout: 30000 });
    });

    test('can view profile', async ({ page }) => {
        await page.goto('/transporter/profile', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/profile/i).first()).toBeVisible({ timeout: 30000 });
    });
});
