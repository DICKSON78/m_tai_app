import { test, expect } from '@playwright/test';

// Owner auth is created once by the setup project; reuse that authenticated
// state instead of logging in again (the /api/login endpoint is rate-limited).
test.use({ storageState: 'test-results/states/owner.json' });

test('owner creates a product through the live UI', async ({ page }) => {
  await page.goto('/owner/products/new', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Add New Product' })).toBeVisible({ timeout: 30000 });

  const stamp = Date.now();
  const name = `E2E Test Product ${stamp}`;

  const bizSelect = page.locator('select').first();
  await expect(bizSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
  await bizSelect.selectOption({ index: 1 });

  await page.fill('input[name="name"]', name);
  await page.fill('input[name="buying_price"]', '1500');
  await page.fill('input[name="selling_price"]', '2000');
  await page.fill('input[name="quantity"]', '50');
  await page.fill('input[name="sku"]', `E2E-${stamp}`);

  const catSelect = page.locator('select[name="category_id"]');
  await expect(catSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
  await catSelect.selectOption({ index: 1 });

  await page.getByRole('button', { name: 'Publish' }).click();

  await page.waitForURL('**/owner/products', { timeout: 60000 });
  expect(page.url()).toContain('/owner/products');

  await expect(page.getByText(name)).toBeVisible({ timeout: 30000 });
  console.log(`OK product created: ${name}`);
});
