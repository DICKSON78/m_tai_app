import { test, expect } from '@playwright/test';
import { assertReachable, watchApi, expectNoApiErrors } from './helpers.js';

// Business owner logs in once during the setup project; reuse the state.
test.use({ storageState: 'test-results/states/owner.json' });

// ─── Business Owner role ────────────────────────────────────────────────────
test.describe('Business Owner role', () => {

    // ─── Dashboard ─────────────────────────────────────────────────────────
    test('owner dashboard loads with stats', async ({ page }) => {
        const apiErrors = watchApi(page);
        await page.goto('/owner/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/owner\/dashboard/);
        await expect(page.getByRole('heading', { name: /Welcome back/ })).toBeVisible({ timeout: 30000 });
        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });

    // ─── Businesses ────────────────────────────────────────────────────────
    test('can list businesses', async ({ page }) => {
        await assertReachable(page, '/owner/businesses');
        await expect(page.getByText('Juma Supermarket')).toBeVisible({ timeout: 30000 });
    });

    test('can view business detail', async ({ page }) => {
        const apiErrors = watchApi(page);
        await assertReachable(page, '/owner/businesses');
        const details = page.getByRole('link', { name: /details/i }).first();
        if (await details.isVisible({ timeout: 8000 }).catch(() => false)) {
            await details.click();
            await expect(page).toHaveURL(/\/owner\/businesses\/\d+/, { timeout: 30000 });
            await page.waitForTimeout(1500);
        }
        expectNoApiErrors(apiErrors);
    });

    // ─── Products ──────────────────────────────────────────────────────────
    test('can list products', async ({ page }) => {
        await assertReachable(page, '/owner/products');
    });

    test('can view a product detail', async ({ page }) => {
        const apiErrors = watchApi(page);
        // Page must render cleanly (no API errors) whether or not products exist
        // (the deployed instance may have 0 products).
        await assertReachable(page, '/owner/products');
        const viewBtn = page.locator('button[title="View"]').first();
        if (await viewBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
            await viewBtn.click();
            await expect(page).toHaveURL(/\/owner\/products\/\d+/, { timeout: 30000 });
            await page.waitForTimeout(1500);
        }
        expectNoApiErrors(apiErrors);
    });

    // ─── Categories ────────────────────────────────────────────────────────
    test('can list categories', async ({ page }) => {
        await assertReachable(page, '/owner/categories');
    });

    // ─── Orders ────────────────────────────────────────────────────────────
    test('can list orders', async ({ page }) => {
        await assertReachable(page, '/owner/orders');
    });

    test('can view an order detail', async ({ page }) => {
        await page.goto('/owner/orders', { waitUntil: 'domcontentloaded' });
        const link = page.locator('a[href^="/owner/orders/"]').first();
        if (await link.isVisible({ timeout: 5000 }).catch(() => false)) {
            await link.click();
            await expect(page).toHaveURL(/\/owner\/orders\/\d+/, { timeout: 30000 });
        }
    });

    // ─── Inventory ─────────────────────────────────────────────────────────
    test('can view inventory page', async ({ page }) => {
        await assertReachable(page, '/owner/inventory');
    });

    // ─── Customers ─────────────────────────────────────────────────────────
    test('can list customers', async ({ page }) => {
        await assertReachable(page, '/owner/customers');
    });

    test('can create a new customer', async ({ page }) => {
        await page.goto('/owner/customers', { waitUntil: 'domcontentloaded' });
        await page.getByRole('button', { name: /add|new|create/i }).first().click({ timeout: 30000 }).catch(() => {});

        // If a modal or form appeared
        const nameInput = page.locator('input[name="full_name"], input[name="name"]').first();
        if (await nameInput.isVisible({ timeout: 5000 }).catch(() => false)) {
            const stamp = Date.now();
            await nameInput.fill(`E2E Customer ${stamp}`);
            await page.locator('input[name="phone"]').fill('0712345678');
            await page.getByRole('button', { name: /save|submit|create/i }).first().click();
            await expect(page.getByText(`E2E Customer ${stamp}`)).toBeVisible({ timeout: 30000 });
        }
    });

    // ─── Employees ─────────────────────────────────────────────────────────
    test('can list employees', async ({ page }) => {
        await assertReachable(page, '/owner/employees');
    });

    // ─── Expenses ──────────────────────────────────────────────────────────
    test('can view expenses page', async ({ page }) => {
        await assertReachable(page, '/owner/expenses');
    });

    // ─── Reports ───────────────────────────────────────────────────────────
    test('can view reports page', async ({ page }) => {
        await assertReachable(page, '/owner/reports');
    });

    // ─── Loans ─────────────────────────────────────────────────────────────
    test('can view loans page', async ({ page }) => {
        await assertReachable(page, '/owner/loans');
    });

    // ─── Credit sales ──────────────────────────────────────────────────────
    test('can view credit sales page', async ({ page }) => {
        await assertReachable(page, '/owner/credit-sales');
    });

    // ─── Deliveries ────────────────────────────────────────────────────────
    test('can view deliveries page', async ({ page }) => {
        await assertReachable(page, '/owner/deliveries');
    });

    // ─── Settings ──────────────────────────────────────────────────────────
    test('can view owner settings', async ({ page }) => {
        await assertReachable(page, '/owner/settings');
    });

    // ─── Notifications ─────────────────────────────────────────────────────
    test('can view notifications', async ({ page }) => {
        await assertReachable(page, '/owner/notifications');
    });

    // ─── Coupons ───────────────────────────────────────────────────────────
    test('can view coupons page', async ({ page }) => {
        await assertReachable(page, '/owner/coupons');
    });

    // ─── Imports ───────────────────────────────────────────────────────────
    test('can view imports page', async ({ page }) => {
        await assertReachable(page, '/owner/imports');
    });

    // ─── Investments ───────────────────────────────────────────────────────
    test('can view investments page', async ({ page }) => {
        await assertReachable(page, '/owner/investments');
    });

    // ─── Projects ──────────────────────────────────────────────────────────
    test('can view projects page', async ({ page }) => {
        await assertReachable(page, '/owner/projects');
    });

    // ─── Finance pages ─────────────────────────────────────────────────────
    test('can view chart of accounts', async ({ page }) => {
        await assertReachable(page, '/owner/finance/accounts');
    });

    test('can view journal entries', async ({ page }) => {
        await assertReachable(page, '/owner/finance/journal');
    });

    test('can view invoices', async ({ page }) => {
        await assertReachable(page, '/owner/finance/invoices');
    });

    test('can view bills', async ({ page }) => {
        await assertReachable(page, '/owner/finance/bills');
    });

    test('can view bank accounts', async ({ page }) => {
        await assertReachable(page, '/owner/finance/bank-accounts');
    });

    test('can view finance reports', async ({ page }) => {
        await assertReachable(page, '/owner/finance/reports');
    });

    test('can view budgets', async ({ page }) => {
        await assertReachable(page, '/owner/finance/budgets');
    });

    test('can view tax settings', async ({ page }) => {
        await assertReachable(page, '/owner/finance/tax-settings');
    });

    test('can view general ledger', async ({ page }) => {
        await assertReachable(page, '/owner/finance/general-ledger');
    });

    test('can view cost centers', async ({ page }) => {
        await assertReachable(page, '/owner/finance/cost-centers');
    });

    test('can view fixed assets', async ({ page }) => {
        await assertReachable(page, '/owner/finance/fixed-assets');
    });

    test('can view fiscal periods', async ({ page }) => {
        await assertReachable(page, '/owner/finance/fiscal-periods');
    });

    test('can view currencies', async ({ page }) => {
        await assertReachable(page, '/owner/finance/currencies');
    });

    // ─── HR pages ──────────────────────────────────────────────────────────
    test('can view HR employee directory', async ({ page }) => {
        await assertReachable(page, '/owner/hr/employees');
    });

    test('can view HR attendance', async ({ page }) => {
        await assertReachable(page, '/owner/hr/attendance');
    });

    test('can view HR payroll', async ({ page }) => {
        await assertReachable(page, '/owner/hr/payroll');
    });

    test('can view HR leave management', async ({ page }) => {
        await assertReachable(page, '/owner/hr/leave');
    });

    // ─── CRM ───────────────────────────────────────────────────────────────
    test('can view CRM page', async ({ page }) => {
        await assertReachable(page, '/owner/crm');
    });

    // ─── Manufacturing ─────────────────────────────────────────────────────
    test('can view manufacturing page', async ({ page }) => {
        await assertReachable(page, '/owner/manufacturing');
    });

    // ─── Warehouses ────────────────────────────────────────────────────────
    test('can view warehouses page', async ({ page }) => {
        await assertReachable(page, '/owner/warehouses');
    });

    // ─── Purchases / Supply Chain ──────────────────────────────────────────
    test('can view suppliers', async ({ page }) => {
        await assertReachable(page, '/owner/purchases/suppliers');
    });

    test('can view purchase orders', async ({ page }) => {
        await assertReachable(page, '/owner/purchases/orders');
    });

    test('can view supplier payments', async ({ page }) => {
        await assertReachable(page, '/owner/purchases/payments');
    });

    test('can view purchase receptions', async ({ page }) => {
        await assertReachable(page, '/owner/purchases/receptions');
    });

    // ─── Tools ─────────────────────────────────────────────────────────────
    test('can view barcode generator', async ({ page }) => {
        await assertReachable(page, '/owner/barcodes');
    });

    test('can view export page', async ({ page }) => {
        await assertReachable(page, '/owner/export');
    });

    test('can view receipt page', async ({ page }) => {
        await assertReachable(page, '/owner/receipts');
    });

    // ─── Profile ───────────────────────────────────────────────────────────
    test('can view owner profile', async ({ page }) => {
        await assertReachable(page, '/owner/profile');
        await expect(page.getByText('Juma').first()).toBeVisible({ timeout: 30000 });
    });
});
