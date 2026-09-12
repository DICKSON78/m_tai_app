import { test, expect } from '@playwright/test';
import { watchApi, expectNoApiErrors } from './helpers.js';

// Serial journey: shop -> product -> customer purchase -> order -> delivery.
// Data is carried between steps via module-level variables (the deployed DB
// persists, and IDs/codes are surfaced through the UI as we go).
const BASE = 'https://mtai-app-903291264005.africa-south1.run.app';
const stamp = Date.now();

export const journey = {
    shopName: `E2E Shop ${stamp}`,
    productName: `E2E Journey Product ${stamp}`,
    buyerName: `E2E Buyer ${stamp}`,
    buyerPhone: `07${String(stamp).slice(-9)}`,
    txnCode: null,
    transporterId: null,
    transporterEmail: `transporter${stamp}@m-tai-e2e.com`,
};

test.describe.serial('Full journey: shop -> product -> purchase -> delivery', () => {

    // ─── 1. OWNER creates a shop ────────────────────────────────────────────
    test.describe('Shop creation', () => {
        test.use({ storageState: 'test-results/states/owner.json' });

        test('owner creates a shop (starts pending)', async ({ page }) => {
            const apiErrors = watchApi(page);
            await page.goto('/owner/businesses/new', { waitUntil: 'domcontentloaded' });
            await expect(page.getByRole('heading', { name: /business information/i })).toBeVisible({ timeout: 30000 });

            await page.fill('input[name="business_name"]', journey.shopName);
            // business_type select
            const typeSelect = page.locator('select[name="business_type"]');
            await typeSelect.selectOption({ index: 1 });
            await page.fill('input[name="business_category"]', 'Jumla (Retail)');
            // LocationFields renders region/district/ward as unnamed selects in
            // order; select by position and wait for cascading options.
            const selects = page.locator('select');
            const selectCount = await selects.count();
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
            // Street is a datalist-backed combobox.
            const streetField = page.getByPlaceholder('e.g. Market Street');
            await streetField.fill('Market Street');

            await page.getByRole('button', { name: /save|create|submit/i }).first().click();
            await page.waitForURL(/\/owner\/businesses$/, { timeout: 60000 });

            const card = page.locator('.grid > div').filter({
                has: page.getByRole('heading', { name: journey.shopName, exact: true }),
            }).first();
            await expect(card).toBeVisible({ timeout: 30000 });
            await expect(card.getByText('Pending', { exact: true })).toBeVisible({ timeout: 15000 });
            await page.waitForTimeout(1000);
            expectNoApiErrors(apiErrors);
        });
    });

    // ─── 2. OWNER creates + publishes a product in the active shop ──────────
    test.describe('Product creation', () => {
        test.use({ storageState: 'test-results/states/owner.json' });

        test('owner creates and publishes a product in the active shop', async ({ page }) => {
            const apiErrors = watchApi(page);
            await page.goto('/owner/products/new', { waitUntil: 'domcontentloaded' });
            await expect(page.getByRole('heading', { name: 'Add New Product' })).toBeVisible({ timeout: 30000 });

            // Deterministic: owner businesses are returned in id order, so the
            // first real option (index 1) is the seeded active shop.
            const bizSelect = page.locator('select').first();
            await expect(bizSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
            await bizSelect.selectOption({ index: 1 });
            journey.businessId = await bizSelect.inputValue();
            expect(journey.businessId).toBeTruthy();

            await page.fill('input[name="name"]', journey.productName);
            await page.fill('input[name="buying_price"]', '3000');
            await page.fill('input[name="selling_price"]', '3500');
            await page.fill('input[name="quantity"]', '20');
            await page.fill('input[name="sku"]', `JR-${stamp}`);

            const catSelect = page.locator('select[name="category_id"]');
            await expect(catSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
            await catSelect.selectOption({ index: 1 });

            await page.getByRole('button', { name: 'Publish' }).click();
            await page.waitForURL('**/owner/products', { timeout: 60000 });

            // Product list is scoped by business; select the same shop used to
            // create the product (by captured id), then filter by name so
            // pagination can't hide the fresh product.
            const listBizSelect = page.locator('select').first();
            await expect(listBizSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
            await listBizSelect.selectOption(journey.businessId);
            await expect(listBizSelect).toHaveValue(journey.businessId, { timeout: 10000 });
            await page.getByPlaceholder('Search products...').fill(journey.productName);
            await expect(page.getByText(journey.productName)).toBeVisible({ timeout: 30000 });

            // The form's Publish action stores the product as published
            // directly, so the row must already be live.
            const prodRow = page.locator('tr').filter({ hasText: journey.productName }).first();
            await expect(prodRow.getByText('Published')).toBeVisible({ timeout: 30000 });
            await page.waitForTimeout(1500);
            expectNoApiErrors(apiErrors);
        });
    });

    // ─── 3. CUSTOMER finds the shop, buys the product ──────────────────────
    test.describe('Customer purchase', () => {
        test.use({ storageState: 'test-results/states/customer.json' });

        test('customer opens the active shop and sees the new product', async ({ page }) => {
            const apiErrors = watchApi(page);
            await page.goto('/customer/shops?q=Juma', { waitUntil: 'domcontentloaded' });
            await expect(page.getByText('Juma Supermarket').first()).toBeVisible({ timeout: 30000 });
            await page.getByText('Juma Supermarket').first().click();
            await expect(page).toHaveURL(/\/customer\/shops\/\d+/, { timeout: 30000 });

            // The product created in the previous step must be visible. Narrow
            // the shop's product search so pagination doesn't hide it.
            await page.getByPlaceholder('Search products in shop...').fill(journey.productName);
            await expect(page.getByRole('heading', { name: journey.productName })).toBeVisible({ timeout: 30000 });
            await page.waitForTimeout(1000);
            expectNoApiErrors(apiErrors);
        });

        test('customer adds the product to cart and checks out', async ({ page }) => {
            const apiErrors = watchApi(page);
            await page.goto('/customer/shops?q=Juma', { waitUntil: 'domcontentloaded' });
            await page.getByText('Juma Supermarket').first().click();
            await expect(page).toHaveURL(/\/customer\/shops\/\d+/, { timeout: 30000 });

            await page.getByPlaceholder('Search products in shop...').fill(journey.productName);
            const card = page.locator('.grid > div').filter({ has: page.getByRole('heading', { name: journey.productName }) }).first();
            await expect(card).toBeVisible({ timeout: 30000 });
            await card.getByRole('button', { name: 'Add to Cart' }).click();
            await expect(page.getByText(new RegExp(`"?${journey.productName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"?. added to cart`))).toBeVisible({ timeout: 15000 });

            // The cart and checkout run in this same session so the server-side
            // session cart is retained.
            await page.goto('/customer/cart', { waitUntil: 'domcontentloaded' });
            await expect(page.getByRole('heading', { name: /cart/i })).toBeVisible({ timeout: 30000 });

            await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
            await page.waitForURL(/\/customer\/checkout/, { timeout: 30000 });

            await page.getByPlaceholder('Enter your full name').fill(journey.buyerName);
            await page.getByPlaceholder(/e\.g\. 0712/i).fill(journey.buyerPhone);
            // Payment method defaults to mobile_money with its radio pre-selected.

            await page.getByRole('button', { name: 'Place Order' }).click();

            // Success screen shows the transaction code.
            const txn = page.getByText(/TXN-\d{9}/).first();
            await txn.waitFor({ state: 'visible', timeout: 60000 });
            journey.txnCode = (await txn.textContent()).trim();
            expect(journey.txnCode).toMatch(/TXN-\d{9}/);
            await page.waitForTimeout(1500);
            expectNoApiErrors(apiErrors);
        });
    });

    // ─── 4. OWNER processes the order ──────────────────────────────────────
    test.describe('Order fulfilment', () => {
        test.use({ storageState: 'test-results/states/owner.json' });

        test('owner sees the new order and verifies it', async ({ page }) => {
            const apiErrors = watchApi(page);
            await page.goto('/owner/orders', { waitUntil: 'domcontentloaded' });

            // Orders are scoped by business; pick the shop the purchase was
            // made from so the fresh order is listed.
            const ordBizSelect = page.locator('select').first();
            await ordBizSelect.selectOption(journey.businessId);
            await expect(ordBizSelect).toHaveValue(journey.businessId, { timeout: 10000 });

            await expect(page.getByText(journey.txnCode)).toBeVisible({ timeout: 60000 });

            const orderRow = page.locator('tr', { hasText: journey.txnCode }).first();
            await orderRow.locator('button[title="View"]').click();
            await expect(page).toHaveURL(/\/owner\/orders\/\d+/, { timeout: 30000 });

            // pending -> confirmed via the Verify modal.
            await page.getByRole('button', { name: 'Verify' }).click();
            await page.getByRole('button', { name: 'Yes, Verify' }).click();
            // verify() marks the order completed + paid.
            await expect(page.getByText('Completed')).toBeVisible({ timeout: 30000 });
            await page.waitForTimeout(1000);
            expectNoApiErrors(apiErrors);
        });

        test('owner creates a delivery for the order customer', async ({ page }) => {
            const apiErrors = watchApi(page);
            await page.goto('/owner/deliveries', { waitUntil: 'domcontentloaded' });
            await expect(page.getByText('Search Resources', { exact: true })).toBeVisible({ timeout: 30000 });

            // Deliveries are scoped by business; select the active shop from
            // the journey (its id was captured during product creation).
            const delBizSelect = page.locator('select').first();
            await expect(delBizSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
            await delBizSelect.selectOption(journey.businessId);
            await expect(delBizSelect).toHaveValue(journey.businessId, { timeout: 10000 });

            await page.getByRole('button', { name: 'Add New' }).click();
            const modal = page.getByRole('dialog');
            await expect(modal).toBeVisible({ timeout: 15000 });

            const customerSelect = modal.locator('select[name="customer_id"]');
            await expect(customerSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
            await customerSelect.selectOption({ index: 1 });
            const orderSelect = modal.locator('select[name="order_id"]');
            await expect(orderSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
            await orderSelect.selectOption({ index: 1 });
            await expect(orderSelect).not.toHaveValue('', { timeout: 10000 });
            await modal.locator('select[name="goods_category"]').selectOption({ index: 1 });
            await modal.getByPlaceholder('Describe the item').fill(journey.productName);
            await modal.getByPlaceholder('1').fill('1');
            await modal.getByPlaceholder('Pickup location').fill('Dar es Salaam, Ilala');
            await modal.getByPlaceholder('Destination').fill('Dar es Salaam, Kinondoni');
            await modal.getByPlaceholder('0').fill('2000');

            await modal.getByRole('button', { name: 'Submit Request' }).click();
            await expect(modal).toBeHidden({ timeout: 30000 });
            await expect(page.getByText(journey.productName).first()).toBeVisible({ timeout: 30000 });
            await page.waitForTimeout(1000);
            expectNoApiErrors(apiErrors);
        });

        test('owner assigns a transporter to the delivery', async ({ page }) => {
            // Register a transporter on the fly so the assignment has a valid id.
            const req = page.request;
            const reg = await req.post(`${BASE}/api/register/transporter`, {
                data: {
                    name: 'E2E Transporter',
                    email: journey.transporterEmail,
                    phone: `${journey.buyerPhone.slice(0, 10)}0`,
                    password: 'Password123!',
                    password_confirmation: 'Password123!',
                    vehicle_type: 'motorcycle',
                    plate_number: `TZ ${stamp}`,
                },
            });
            expect(reg.status()).toBe(201);
            const regBody = await reg.json();
            const transporterToken = regBody.token;

            // Resolve the Transporter record id via the transporter profile endpoint.
            const prof = await req.get(`${BASE}/api/transporter/profile`, {
                headers: { Authorization: `Bearer ${transporterToken}` },
            });
            expect(prof.status()).toBe(200);
            const profBody = await prof.json();
            const transporterRecordId = profBody.id ?? profBody.transporter?.id;
            expect(transporterRecordId).toBeTruthy();
            journey.transporterId = String(transporterRecordId);

            // Owner assigns via the UI.
            const apiErrors = watchApi(page);
            await page.goto('/owner/deliveries', { waitUntil: 'domcontentloaded' });
            const delBizSelect = page.locator('select').first();
            await expect(delBizSelect.locator('option')).not.toHaveCount(1, { timeout: 30000 });
            await delBizSelect.selectOption(journey.businessId);
            await expect(delBizSelect).toHaveValue(journey.businessId, { timeout: 10000 });
            const row = page.locator('tr', { hasText: journey.productName }).first();
            await expect(row).toBeVisible({ timeout: 30000 });
            await row.locator('button[title*="Assign" i]').first().click();

            const assignModal = page.getByRole('dialog');
            await expect(assignModal).toBeVisible({ timeout: 15000 });
            const assignSelect = assignModal.locator('select[name="transporter_id"]');
            await expect(assignSelect).toBeVisible({ timeout: 15000 });
            await expect(assignSelect.locator('option')).not.toHaveCount(1, { timeout: 15000 });
            await assignSelect.selectOption(journey.transporterId);
            await expect(assignSelect).toHaveValue(journey.transporterId, { timeout: 10000 });
            await assignModal.getByRole('button', { name: 'Assign' }).click();
            await expect(assignModal).toBeHidden({ timeout: 30000 });
            await page.waitForTimeout(1500);
            expectNoApiErrors(apiErrors);
        });
    });

    // ─── 5. TRANSPORTER picks up and completes the delivery ────────────────
    test.describe('Transporter delivery', () => {
        test('transporter starts and completes the delivery', async ({ browser }) => {
            // Build a transporter context by reusing credentials created above.
            const context = await browser.newContext({ baseURL: BASE });
            const page = await context.newPage();

            // Login via API to get a fresh token, then inject into localStorage.
            const login = await page.request.post(`${BASE}/api/login`, {
                data: { login: journey.transporterEmail, password: 'Password123!' },
            });
            expect(login.status()).toBe(200);
            const loginBody = await login.json();
            await page.goto('/login', { waitUntil: 'domcontentloaded' });
            await page.evaluate(({ token, userData }) => {
                localStorage.setItem('auth_token', token);
                localStorage.setItem('user', JSON.stringify(userData));
            }, { token: loginBody.token, userData: loginBody.user });

            const apiErrors = watchApi(page);
            await page.goto('/transporter/deliveries', { waitUntil: 'domcontentloaded' });
            await expect(page.getByRole('heading', { name: /my deliveries/i })).toBeVisible({ timeout: 30000 });

            const row = page.locator('tr', { hasText: journey.productName }).first();
            await expect(row).toBeVisible({ timeout: 60000 });

            // Status after assignment is 'accepted' -> Start, then Complete.
            const startBtn = row.getByRole('button', { name: 'Start' }).first();
            await startBtn.click({ timeout: 30000 });
            await page.getByRole('button', { name: 'Yes, Change' }).click({ timeout: 15000 });
            await page.waitForTimeout(2000);

            const rowInTransit = page.locator('tr', { hasText: journey.productName }).first();
            const completeBtn = rowInTransit.getByRole('button', { name: 'Complete' }).first();
            await completeBtn.click({ timeout: 30000 });
            await page.getByRole('button', { name: 'Yes, Change' }).click({ timeout: 15000 });
            await page.waitForTimeout(2000);

            await expect(rowInTransit.getByText('Completed')).toBeVisible({ timeout: 30000 });
            await page.waitForTimeout(1000);
            expectNoApiErrors(apiErrors);
            await context.close();
        });
    });
});