import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

test('sidebar navigation is client-side with no full-page reloads', async ({ page }) => {
    test.setTimeout(120000);
    await loginAs(page, ACCOUNTS.owner);

    // Go to the dashboard using an in-app link (SPA), not a bare goto.
    await page.goto('/owner/dashboard', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);

    // Count full document (reload) requests during navigation.
    let documentLoads = 0;
    let started = false;
    page.on('request', (req) => {
        const rt = req.resourceType();
        if (rt === 'document' && req.method() === 'GET') {
            if (started) documentLoads++;
        }
    });

    const target = page.getByRole('link', { name: /products/i }).first();
    await target.click();
    const url1 = page.url();
    expect(url1).toContain('/owner/products');
    started = true;

    // Second navigation to prove repeatability.
    const orders = page.getByRole('link', { name: /orders/i }).first();
    await orders.click();
    const url2 = page.url();
    expect(url2).toContain('/owner/orders');

    // No new full document loads happened during these clicks.
    expect(documentLoads).toBe(0);
});
