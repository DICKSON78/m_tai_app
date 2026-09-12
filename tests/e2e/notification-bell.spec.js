import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

test('owner notifications page shows new-order notifications', async ({ page }) => {
    test.setTimeout(120000);
    await loginAs(page, ACCOUNTS.owner);
    await page.goto('/owner/notifications', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    await expect(page.getByText(/New order received/i).first()).toBeVisible({ timeout: 15000 });
});