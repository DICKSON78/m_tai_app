import { test, expect } from '@playwright/test';

// Employee accounts are created by owners, so they may not exist in every
// deployed environment. Skip unless a login is supplied via env vars (the
// setup project then saves the corresponding storage state).
test.skip(({ }) => !process.env.E2E_EMPLOYEE_LOGIN, 'No employee test account configured (set E2E_EMPLOYEE_LOGIN)');
test.use({ storageState: 'test-results/states/employee.json' });

test.describe('Employee role', () => {

    test('employee dashboard loads', async ({ page }) => {
        await page.goto('/employee/dashboard', { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(/\/employee\/dashboard/);
        await expect(page.getByText('Employee Dashboard')).toBeVisible({ timeout: 30000 });
    });

    test('can view customers page', async ({ page }) => {
        await page.goto('/employee/customers', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/customer/i).first()).toBeVisible({ timeout: 30000 });
    });

    test('can view inventory page', async ({ page }) => {
        await page.goto('/employee/inventory', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/inventory|stock/i).first()).toBeVisible({ timeout: 30000 });
    });

    test('can view expenses page', async ({ page }) => {
        await page.goto('/employee/expenses', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/expense/i).first()).toBeVisible({ timeout: 30000 });
    });

    test('can view deliveries page', async ({ page }) => {
        await page.goto('/employee/deliveries', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/deliver/i).first()).toBeVisible({ timeout: 30000 });
    });

    test('can view profile', async ({ page }) => {
        await page.goto('/employee/profile', { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/, { timeout: 30000 });
        await expect(page.getByText(/profile/i).first()).toBeVisible({ timeout: 30000 });
    });
});
