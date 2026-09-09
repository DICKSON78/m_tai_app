import fs from 'node:fs';

// Ensure the directory used for per-role storage states exists before the
// setup project runs. Reusing a saved storage state across tests avoids
// hammering the /api/login endpoint (which is rate-limited via
// `throttle:login`) once per test.
export default function globalSetup() {
    fs.mkdirSync('test-results/states', { recursive: true });
}
