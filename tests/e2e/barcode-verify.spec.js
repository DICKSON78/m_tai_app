import { test, expect } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers';

test('barcode page renders a real EAN-13 svg', async ({ page }) => {
    test.setTimeout(180000);
    await loginAs(page, ACCOUNTS.owner);
    await page.waitForTimeout(800);
    await page.goto('/owner/barcodes', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1200);

    const bizSel = page.locator('select').first();
    const bizOptions = bizSel.locator('option');
    const bizCount = await bizOptions.count();
    expect(bizCount).toBeGreaterThan(0);

    let found = false;
    const prodSel = page.locator('select').nth(1);
    for (let i = 0; i < bizCount; i++) {
        const value = await bizOptions.nth(i).getAttribute('value');
        if (!value) continue;
        await bizSel.selectOption(value);
        // Poll until products load (the first option is a placeholder).
        let texts = [];
        for (let tries = 0; tries < 12; tries++) {
            texts = await prodSel.locator('option').allTextContents();
            if (texts.length > 1) break;
            await page.waitForTimeout(500);
        }
        const target = texts.findIndex((t) => t.includes('E2E Journey Product'));
        if (target >= 0) {
            await prodSel.selectOption({ index: target });
            found = true;
            break;
        }
    }
    expect(found, 'E2E Journey product found in a business').toBe(true);

    await page.getByRole('button', { name: 'Generate Barcode' }).click();
    const svg = page.locator('svg[aria-label^="EAN-13"]');
    await expect(svg.first()).toBeVisible({ timeout: 15000 });
    const inner = await svg.first().innerHTML();
    expect(inner).toContain('rect');
    await expect(svg.first()).toHaveAttribute('aria-label', /EAN-13 6200/);
});