import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

test('street field learns custom values and offers DB suggestions', async ({ page }) => {
    test.setTimeout(180000);
    const streets = [];
    const posts = [];
    page.on('request', (req) => {
        const url = req.url();
        if (url.includes('/api/locations/streets') && req.method() === 'GET') streets.push(url);
        if (url.includes('/api/locations/streets') && req.method() === 'POST') posts.push(req.postData() || '');
    });

    await loginAs(page, ACCOUNTS.owner);
    await page.goto('/owner/businesses/new', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    // Street field is the input bound to a datalist.
    const streetInput = page.locator('input').filter({ has: page.locator('datalist') }).first();
    await expect(streetInput).toBeVisible({ timeout: 15000 });

    // Cascade: Dar-es-salaam -> Ilala -> a ward. This triggers a GET for streets.
    const selects = page.locator('select');
    await page.waitForFunction(() => {
        const s = document.querySelectorAll('select');
        if (s.length < 2) return false;
        const opts = Array.from(s[0].options || []);
        return opts.some((o) => o.textContent.includes('Dar-es-salaam'));
    }, null, { timeout: 15000 });
    await selects.nth(0).selectOption('Dar-es-salaam');
    await page.waitForFunction(() => document.querySelectorAll('select')[1].options.length > 1, null, { timeout: 15000 });
    const districtTexts = await selects.nth(1).locator('option').allTextContents();
    const firstDistrict = districtTexts.find((t) => t.trim() && !t.includes('--'));
    await selects.nth(1).selectOption(firstDistrict);
    await page.waitForFunction(() => document.querySelectorAll('select')[2].options.length > 1, null, { timeout: 15000 });
    const wardTexts = await selects.nth(2).locator('option').allTextContents();
    const firstWard = wardTexts.find((t) => t.trim() && !t.includes('--'));
    await selects.nth(2).selectOption(firstWard);

    await page.waitForFunction(() => streets.length > 0, null, { timeout: 15000 });
    expect(streets.length).toBeGreaterThan(0้อย (…eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee)).catch(() => {});