import { test as setup } from '@playwright/test';
import { loginAs, ACCOUNTS } from './helpers.js';

// The mandatory platform roles — these accounts always exist (seeded).
const MANDATORY = ['admin', 'owner', 'customer'];

// Optional roles — employee/transporter accounts are created by owners and may
// not exist on every deployed environment, so they only produce a state file
// when credentials are supplied via environment variables.
const OPTIONAL = ['employee', 'transporter'];

for (const key of MANDATORY) {
    setup(`save storage state for ${key}`, async ({ page }) => {
        await loginAs(page, ACCOUNTS[key]);
        await page.context().storageState({ path: `test-results/states/${key}.json` });
    });
}

for (const key of OPTIONAL) {
    const hasLogin = process.env[`E2E_${key.toUpperCase()}_LOGIN`];
    if (!hasLogin) {
        // Do not register the test at all when no credentials are configured.
        continue;
    }
    setup(`save storage state for ${key}`, async ({ page }) => {
        await loginAs(page, ACCOUNTS[key]);
        await page.context().storageState({ path: `test-results/states/${key}.json` });
    });
}
