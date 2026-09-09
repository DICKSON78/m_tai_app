import { test, expect } from '@playwright/test';

const ACCOUNTS = [
  { name: 'admin', login: 'admin@m-tai.com', password: 'password', dash: '/admin/dashboard' },
  { name: 'business_owner', login: 'juma@m-tai.com', password: 'password', dash: '/owner/dashboard' },
  { name: 'customer', login: 'amina@m-tai.com', password: 'password', dash: '/customer/dashboard' },
];

for (const acc of ACCOUNTS) {
  test(`login as ${acc.name} and reach ${acc.dash}`, async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[placeholder*="Email"], input[placeholder*="user code"]', acc.login);
    await page.locator('input[type="password"]').fill(acc.password);
    await page.getByRole('button', { name: /sign in/i }).click();

    await page.waitForURL('**' + acc.dash, { timeout: 45000 });
    expect(page.url()).toContain(acc.dash);
    console.log(`OK login ${acc.name} -> ${page.url()}`);
  });
}
