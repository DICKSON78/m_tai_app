import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

test('purchases supplier form opens in designed modal', async ({ page }) => {
    test.setTimeout(120000);
    await loginAs(page, ACCOUNTS.owner);
    await page.goto('/owner/purchases/suppliers', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const addBtn = page.getByRole('button', { name: /new supplier|add supplier/i }).first();
    await addBtn.click();
    await page.waitForTimeout(1000);

    const heading = page.getByText(/new supplier/i).first();
    expect(await heading.isVisible()).toBeTruthy();

    const overlay = page.locator('[role="dialog"]');
    expect(await overlay.count()).toBeGreaterThan(0);
});