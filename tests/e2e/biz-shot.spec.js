import { test } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

test('rebusiness page screenshot', async ({ page }) => {
    test.setTimeout(120000);
    await loginAs(page, ACCOUNTS.owner);
    await page.goto('/owner/businesses', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);
    await page.screenshot({ path: '/tmp/opencode/businesses.png', fullPage: true });
});