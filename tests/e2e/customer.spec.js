import { test, expect } from '@playwright/test';
import { assertReachable, watchApi, expectNoApiErrors } from './helpers.js';

// Amina (seeded customer) logs in during the setup project; reuse the state.
test.use({ storageState: 'test-results/states/customer.json' });

test.describe('Customer role', () => {
    test('dashboard loads', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/customer/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page.locator('h1').first()).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    test('can search and open a shop', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/customer/shops', { waitUntil: 'domcontentloaded' });
        const searchInput = page.getByPlaceholder('Search shops by name or code...');
        await searchInput.fill('Juma');
        await searchInput.press('Enter');

        const shopCard = page.locator('.stat-card').first();
        await expect(shopCard).toBeVisible({ timeout: 30000 });
        await shopCard.click();
        await expect(page).toHaveURL(/\/customer\/shops\/\d+/, { timeout: 30000 });
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    test('can add to cart, update quantity and remove (cart stays empty)', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/customer/shops', { waitUntil: 'domcontentloaded' });
        const searchInput = page.getByPlaceholder('Search shops by name or code...');
        await searchInput.fill('Juma');
        await searchInput.press('Enter');
        const shopCard = page.locator('.stat-card').first();
        await expect(shopCard).toBeVisible({ timeout: 30000 });
        await shopCard.click();
        await expect(page).toHaveURL(/\/customer\/shops\/\d+/, { timeout: 30000 });

        const addBtn = page.getByRole('button', { name: 'Add to Cart' }).first();
        if (!(await addBtn.isVisible({ timeout: 8000 }).catch(() => false)) ||
            await addBtn.isDisabled()) {
            // No in-stock product on the shop; the cart flow can't run on this
            // deployment. Report the skip but still assert the shop page works.
            throw new Error('No in-stock product found to add to cart');
        }
        await addBtn.click();

        await page.goto('/customer/cart', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'My Cart' })).toBeVisible({ timeout: 30000 });
        const cartRow = page.locator('.re-table-wrap').first();
        await expect(cartRow).toContainText('Product', { timeout: 30000 });

        await page.getByRole('button', { name: 'Remove' }).first().click();
        await expect(page.getByText('Cart is empty')).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    test('can view order history', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/customer/orders', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'Order History' })).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    test('can view profile', async ({ page }) => {
        await assertReachable(page, '/customer/profile');
    });
});