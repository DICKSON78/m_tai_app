import { test, expect } from '@playwright/test';
test.use({ storageState: './test-results/states/owner.json' });

test('business list + detail pages have no reduce/console errors', async ({ page }) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(`PAGEERROR: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(`CONSOLE: ${m.text()}`); });

    await page.goto('/owner/businesses');
    await page.waitForSelector('table tbody tr');
    await page.waitForTimeout(3000);

    const viewButtons = page.locator('a[title="View"]');
    expect(await viewButtons.count()).toBeGreaterThan(0);
    await viewButtons.first().click();
    await page.waitForURL('**/owner/businesses/**', { timeout: 20000 });

    await page.waitForTimeout(5000);

    const fatal = errors.filter(e => /reduce|TypeError|ReferenceError/.test(e));
    console.log('FATAL:', fatal.length ? fatal.join(' | ') : 'NONE');
    console.log('ALL ERRORS:', errors.length ? errors.join(' | ') : 'NONE');
    expect(fatal).toEqual([]);
});