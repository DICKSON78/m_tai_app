import { test, expect } from '@playwright/test';
test.use({ storageState: './test-results/states/owner.json' });

test('crm, budgets, ledger pages clean on current deploy', async ({ page }) => {
    const errs = [];
    page.on('pageerror', (e) => errs.push(`PAGEERROR: ${e.message}`));
    page.on('console', (m) => { if (m.type() === 'error' && !/favicon|file:\/\/|PHANTOM|moz-extension/.test(m.text())) errs.push(m.text()); });

    for (const [path, heading] of [
        ['/owner/crm', 'CRM'],
        ['/owner/finance/budgets', 'Budgets'],
        ['/owner/finance/ledger', 'General Ledger'],
    ]) {
        errs.length = 0;
        await page.goto(path);
        await page.locator('header h1, h1').waitFor({ timeout: 25000 }).catch(() => {});
        await page.waitForTimeout(5000);
        const bad = errs.filter((e) => /404|500|status code|Failed to fetch/.test(e));
        console.log(`PAGE ${path}:`, bad.length ? bad.join(' | ') : 'CLEAN');
        expect(bad).toEqual([]);
    }
});
