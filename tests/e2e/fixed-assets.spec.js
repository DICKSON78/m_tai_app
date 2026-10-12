import { test, expect } from '@playwright/test';

test.use({ storageState: './test-results/states/owner.json' });

test('fixed assets page renders and creates an asset end-to-end', async ({ page }) => {
    const errs = [];
    page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|file:\/\/|PHANTOM|moz-extension/.test(m.text())) errs.push(m.text()); });

    const name = `E2E Asset ${Date.now()}`;

    await page.goto('/owner/finance/fixed-assets');
    await page.locator('header h1, h1').waitFor({ timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(2000);

    const loadBad = errs.filter((e) => /map is not a function|404|500|status code|Failed to fetch/.test(e));
    console.log('FixedAssets load errors:', loadBad.length ? loadBad.join(' | ') : 'CLEAN');
    expect(loadBad).toEqual([]);

    await page.getByRole('button', { name: 'New Asset' }).click();
    await page.waitForTimeout(400);

    await page.locator('label', { hasText: 'Name *' }).locator('..').locator('input').fill(name);
    await page.locator('label', { hasText: 'Purchase Date *' }).locator('..').locator('input').fill('2026-09-01');
    await page.locator('label', { hasText: /Purchase Cost/ }).locator('..').locator('input').fill('1250000');
    await page.locator('label', { hasText: /Useful Life/ }).locator('..').locator('input').fill('24');

    const accountSelects = page.locator('select[required]');
    for (let i = 0; i < await accountSelects.count(); i++) {
        const opts = await accountSelects.nth(i).locator('option').allTextContents();
        const pick = opts.find((o) => !/Select account/.test(o));
        if (pick) await accountSelects.nth(i).selectOption({ label: pick.trim() });
    }

    await page.getByRole('button', { name: 'Create', exact: true }).click();
    await page.locator('form').waitFor({ state: 'hidden', timeout: 15000 }).catch(() => {});
    await page.waitForTimeout(2500);

    await expect(page.locator('h4', { hasText: new RegExp(name) }).first()).toBeVisible({ timeout: 15000 });

    const postErr = errs.filter((e) => /map is not a function|500|Failed to fetch/.test(e));
    console.log('After create errors:', postErr.length ? postErr.join(' | ') : 'CLEAN');
    expect(postErr).toEqual([]);

    const createdId = await page.evaluate(async (n) => {
        const res = await fetch('/api/owner/finance/fixed-assets', {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth_token')}` },
        });
        const json = await res.json();
        const item = (json.data || []).find((a) => a.name === n);
        return item ? item.id : null;
    }, name);
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    console.log('Created asset id for cleanup:', createdId);
    if (createdId && token) {
        await page.request.delete(`/api/owner/finance/fixed-assets/${createdId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    }
});