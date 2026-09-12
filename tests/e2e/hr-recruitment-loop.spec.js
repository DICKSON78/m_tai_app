import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

test('recruitment page does not loop', async ({ page }) => {
    test.setTimeout(120000);
    await loginAs(page, ACCOUNTS.owner);

    let jobsRequests = 0;
    let errors = [];
    page.on('request', (req) => {
        if (req.url().includes('/owner/hr/jobs')) jobsRequests++;
    });
    page.on('pageerror', (e) => errors.push(String(e.message || e).slice(0, 200)));
    page.on('response', (res) => { if (res.status() >= 500) errors.push(`HTTP ${res.status()} ${res.url()}`); });

    await page.goto('/owner/hr/recruitment', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(9000);

    expect(errors).toEqual([]);
    expect(jobsRequests).toBeLessThanOrEqual(5);
});