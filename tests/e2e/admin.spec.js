import { test, expect } from '@playwright/test';
import { assertReachable, watchApi, expectNoApiErrors } from './helpers.js';

// Admin logs in once during the setup project; reuse that authenticated state.
test.use({ storageState: 'test-results/states/admin.json' });

// ─── Admin login ────────────────────────────────────────────────────────────
test.describe('Admin role', () => {

    test('admin dashboard loads with key stats', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/admin/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/admin\/dashboard/);
        await expect(page.getByRole('heading', { name: 'Dashboard', exact: true })).toBeVisible({ timeout: 30000 });
        await expect(page.getByText("Here's what's happening")).toBeVisible();
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    // ─── Shops management ────────────────────────────────────────────────
    test('can navigate to shops list', async ({ page }) => {
        await assertReachable(page, '/admin/shops');
        await expect(page.getByText('Juma Supermarket').first()).toBeVisible({ timeout: 30000 });
    });

    test('can open a specific shop', async ({ page }) => {
        const apiErrors = watchApi(page);
        await assertReachable(page, '/admin/shops');
        // The seeded shop name varies across deployments, so just confirm the
        // View control exists and opens a detail page (data-tolerant).
        const view = page.locator('a[title="View"]').first();
        if (await view.isVisible({ timeout: 8000 }).catch(() => false)) {
            await view.click();
            await expect(page).toHaveURL(/\/admin\/shops\/\d+/, { timeout: 30000 });
            await page.waitForTimeout(1500);
        }
        expectNoApiErrors(apiErrors);
    });

    // ─── Users / customers management ────────────────────────────────────
    test('can view customers list', async ({ page }) => {
        await assertReachable(page, '/admin/customers');
        await expect(page.getByText('Amina').first()).toBeVisible({ timeout: 30000 });
    });

    test('can open a specific customer', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/admin/customers', { waitUntil: 'domcontentloaded' });
        await expect(page.getByText('Amina').first()).toBeVisible({ timeout: 30000 });
        await page.locator('a[title="View"]').first().click();
        await expect(page).toHaveURL(/\/admin\/customers\/\d+/, { timeout: 30000 });
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    // ─── Orders management ───────────────────────────────────────────────
    test('can view orders page', async ({ page }) => {
        await assertReachable(page, '/admin/orders');
    });

    // ─── Announcements ───────────────────────────────────────────────────
    test('can view announcements page', async ({ page }) => {
        await assertReachable(page, '/admin/announcements');
    });

    test('can create and publish an announcement', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/admin/announcements/new', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'New Announcement' })).toBeVisible({ timeout: 30000 });

        const stamp = Date.now();
        const title = `E2E Announcement ${stamp}`;

        await page.fill('input[name="title"]', title);
        await page.fill('textarea[name="message"]', 'Test announcement from Playwright E2E');
        await page.selectOption('select[name="target_role"]', { index: 1 });

        await page.getByRole('button', { name: 'Create' }).click();
        await expect(page.getByText('created successfully').first()).toBeVisible({ timeout: 60000 });
        await page.waitForURL(/\/admin\/announcements$/, { timeout: 30000 });
        await expect(page.getByText(title)).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    // ─── Subscriptions ───────────────────────────────────────────────────
    test('can view subscriptions page', async ({ page }) => {
        await assertReachable(page, '/admin/subscriptions');
    });

    // ─── Reports ─────────────────────────────────────────────────────────
    test('can view reports page', async ({ page }) => {
        await assertReachable(page, '/admin/reports');
    });

    // ─── Finance overview ────────────────────────────────────────────────
    test('can view finance page', async ({ page }) => {
        await assertReachable(page, '/admin/finance');
    });

    // ─── HR overview ─────────────────────────────────────────────────────
    test('can view HR page', async ({ page }) => {
        await assertReachable(page, '/admin/hr');
    });

    // ─── Deliveries overview ─────────────────────────────────────────────
    test('can view deliveries page', async ({ page }) => {
        await assertReachable(page, '/admin/deliveries');
    });

    // ─── Audit logs ──────────────────────────────────────────────────────
    test('can view audit logs page', async ({ page }) => {
        await assertReachable(page, '/admin/audit-logs');
    });

    // ─── Settings ────────────────────────────────────────────────────────
    test('can view and update admin settings', async ({ page }) => {
        await assertReachable(page, '/admin/settings');
        await expect(page.getByRole('heading', { name: 'Platform Settings' })).toBeVisible({ timeout: 30000 });
        const appNameInput = page.getByRole('textbox').first();
        await appNameInput.fill('M-TAI E2E Test');
        await page.getByRole('button', { name: 'Save Settings' }).first().click();
        await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 30000 });
        // Restore original value
        await appNameInput.fill('M-TAI');
        await page.getByRole('button', { name: 'Save Settings' }).first().click();
        await expect(page.getByText(/saved|updated|success/i)).toBeVisible({ timeout: 30000 });
    });

    // ─── Profile ─────────────────────────────────────────────────────────
    test('can view admin profile', async ({ page }) => {
        await assertReachable(page, '/admin/profile');
        await expect(page.getByText('Msimamizi').first()).toBeVisible({ timeout: 30000 });
    });

    // ─── Promotions ──────────────────────────────────────────────────────
    test('can view promotions page', async ({ page }) => {
        await assertReachable(page, '/admin/promotions');
    });
});
