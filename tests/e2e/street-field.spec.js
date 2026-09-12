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

    // Street field is the single input bound to a datalist.
    const streetInput = page.locator('input[list]');
    await expect(streetInput).toBeVisible({ timeout: 15000 });

    // LocationFields renders region/district/ward as the last three selects in
    // order; select by position and wait for cascading options.
    const selects = page.locator('select');
    const selectCount = await selects.count();
    expect(selectCount).toBeGreaterThanOrEqual(3);
    const regionSelect = selects.nth(selectCount - 3);
    const districtSelect = selects.nth(selectCount - 2);
    const wardSelect = selects.nth(selectCount - 1);
    await expect(regionSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
    await regionSelect.selectOption({ index: 1 });
    await expect(districtSelect).toBeEnabled({ timeout: 30000 });
    await expect(districtSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
    await districtSelect.selectOption({ index: 1 });
    await expect(wardSelect).toBeEnabled({ timeout: 30000 });
    await expect(wardSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
    await wardSelect.selectOption({ index: 1 });

    await page.waitForFunction(() => document.querySelectorAll('datalist option').length > 0, null, { timeout: 15000 });

    // Type a custom street value and blur; the component persists it to the
    // backend via POST /api/locations/streets so other users see suggestions.
    const customStreet = `Custom Street ${Date.now()}`;
    await streetInput.fill(customStreet);
    await streetInput.blur();
    const postRes = page.waitForResponse((r) => r.url().includes('/api/locations/streets') && r.request().method() === 'POST' && (r.request().postData() || '').includes(customStreet), { timeout: 15000 });
    await postRes;

    // The datalist shows the DB-suggested streets loaded for the ward.
    const optionCount = await page.locator('datalist option').count();
    expect(optionCount).toBeGreaterThan(0);
});