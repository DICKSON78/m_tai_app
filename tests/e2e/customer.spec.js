import { test, expect } from '@playwright/test';
import { watchApi, expectNoApiErrors } from './helpers.js';

// Customer logs in once during the setup project; reuse that authenticated state.
test.use({ storageState: 'test-results/states/customer.json' });

test.describe('Customer role', () => {

    test('customer dashboard loads', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/customer/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/customer\/dashboard/);
        // greeting with user's first name
        await expect(page.getByRole('heading', { name: 'Amina Juma' }).first()).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    // ─── Shop search ─────────────────────────────────────────────────────
    test('can search for shops', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/customer/shops', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'Shops', exact: true })).toBeVisible({ timeout: 30000 });

        const search = page.locator('input[placeholder*="earch"], input[placeholder*="shop"]').first();
        if (await search.isVisible({ timeout: 5000 }).catch(() => false)) {
            await search.fill('Juma');
        }
        await expect(page.getByText('Juma Supermarket').first()).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(1200);
        expectNoApiErrors(apiErrors);
    });

    test('can open a shop detail page', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/customer/shops', { waitUntil: 'domcontentloaded' });
        await expect(page.getByText('Juma Supermarket').first()).toBeVisible({ timeout: 30000 });
        await page.getByText('Juma Supermarket').first().click();
        await expect(page).toHaveURL(/\/customer\/shops\/\d+/, { timeout: 30000 });
        await expect(page.getByText('Juma Supermarket').first()).toBeVisible();
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    // ─── Cart ────────────────────────────────────────────────────────────
    test('can open cart page', async ({ page }) => {
        await page.goto('/customer/cart', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/cart/i).first()).toBeVisible({ timeout: 30000 });
    });

    // ─── Order history ───────────────────────────────────────────────────
    test('can view order history', async ({ page }) => {
        await page.goto('/customer/orders', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/order/i).first()).toBeVisible({ timeout: 30000 });
    });

    test('can view an order detail if present', async ({ page }) => {
        await page.goto('/customer/orders', { waitUntil: 'domcontentloaded' });
        const link = page.locator('a[href^="/customer/orders/"]').first();
        if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
            await link.click();
            await expect(page).toHaveURL(/\/customer\/orders\/\d+/, { timeout: 30000 });
            await expect(page.getByText(/order/i).first()).toBeVisible();
        }
    });

    // ─── Deliveries ──────────────────────────────────────────────────────
    test('can view deliveries', async ({ page }) => {
        await page.goto('/customer/deliveries', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/deliver/i).first()).toBeVisible({ timeout: 30000 });
    });

    // ─── Wishlist ────────────────────────────────────────────────────────
    test('can view wishlist', async ({ page }) => {
        await page.goto('/customer/wishlist', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/wishlist/i).first()).toBeVisible({ timeout: 30000 });
    });

    // ─── Profile ─────────────────────────────────────────────────────────
    test('can view profile', async ({ page }) => {
        await page.goto('/customer/profile', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText('Amina').first()).toBeVisible({ timeout: 30000 });
    });
});
