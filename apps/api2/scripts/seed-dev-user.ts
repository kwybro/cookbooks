/**
 * Seeds a dev user into the local D1 database.
 *
 * Usage:
 *   cd apps/api2 && bun run scripts/seed-dev-user.ts
 *
 * Requires wrangler to be configured with local D1.
 */

import { execSync } from 'node:child_process';

const sql = `INSERT OR IGNORE INTO users (id, email, password_hash, created_at, updated_at) VALUES ('dev-user', 'dev@cookbooks.local', 'not-a-real-hash', strftime('%s', 'now'), strftime('%s', 'now'));`;

console.log('Seeding dev user into local D1...');
execSync(`wrangler d1 execute cookbooks-db --remote --command="${sql}"`, { stdio: 'inherit' });
console.log('Done!');
