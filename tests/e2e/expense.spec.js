import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS, watchApi, expectNoApiErrors } from './helpers.js';

test.describe('Owner expenses', () => {
    test('creates, edits and deletes an expense', async ({ page }) => {
        const apiErrors = watchApi(page);
        await loginAs(page, ACCOUNTS.owner);

        await page.goto('/owner/expenses', { waitUntil: 'domcontentloaded' });
        await expect(page.getByText('Search Resources', { exact: true })).toBeVisible({ timeout: 30000 });

        const bizSelect = page.locator('select').first();
        await expect(bizSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
        await bizSelect.selectOption({ index: 1 });
        await expect(bizSelect).not.toHaveValue('', { timeout: 10000 });

        const desc = `E2E Expense ${Date.now()}`;
        const today = new Date().toISOString().slice(0, 10);

        // ─── Create ──────────────────────────────────────────────────────
        await page.getByRole('button', { name: 'Add New' }).click();
        const addModal = page.getByRole('dialog');
        await expect(addModal).toBeVisible({ timeout: 15000 });
        await addModal.locator('select').first().selectOption({ index: 1 });
        await addModal.getByPlaceholder('Enter amount').fill('45000');
        await addModal.locator('input[type="date"]').fill(today);
        await addModal.getByPlaceholder('Expense description...').fill(desc);
        await addModal.getByRole('button', { name: 'Add', exact: true }).click();
        await expect(addModal).toBeHidden({ timeout: 30000 });

        const row = page.locator('tr', { hasText: desc }).first();
        await expect(row).toBeVisible({ timeout: 30000 });
        await expect(row.getByText('TZS 45,000')).toBeVisible({ timeout: 10000 });

        // ─── Edit (amount + date must re-submit cleanly) ─────────────────
        await row.locator('button[title="Edit"]').click();
        const editModal = page.getByRole('dialog');
        await expect(editModal).toBeVisible({ timeout: 15000 });
        await expect(editModal.locator('input[type="date"]')).not.toHaveValue('', { timeout: 10000 });
        await editModal.getByPlaceholder('Enter amount').fill('94000');
        await editModal.getByRole('button', { name: 'Update', exact: true }).click();
        await expect(editModal).toBeHidden({ timeout: 30000 });
        await expect(page.locator('tr', { hasText: desc }).getByText('TZS 94,000')).toBeVisible({ timeout: 30000 });

        // ─── Delete ──────────────────────────────────────────────────────
        await page.locator('tr', { hasText: desc }).first().locator('button[title="Delete"]').click();
        const confirm = page.getByRole('dialog');
        await expect(confirm).toBeVisible({ timeout: 15000 });
        await confirm.getByRole('button', { name: 'Delete', exact: true }).click();
        await expect(page.getByText(desc)).toHaveCount(0, { timeout: 30000 });

        await page.waitForTimeout(1500);
        expectNoApiErrors(apiErrors);
    });
});