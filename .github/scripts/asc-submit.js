#!/usr/bin/env node
/**
 * Submits the latest valid TestFlight build for App Store review.
 *
 * Required env vars (set as GitHub secrets):
 *   API_KEY_ID          — App Store Connect API key ID (e.g. ABC123DEF4)
 *   API_KEY_ISSUER_ID   — Issuer ID (UUID from App Store Connect)
 *   API_KEY_P8          — Contents of the .p8 private key file
 *   BUNDLE_ID           — App bundle identifier (e.g. com.slowcook.app)
 *
 * Optional:
 *   MARKETING_VERSION   — e.g. "1.0.1" — filters to a specific version's build
 *   REVIEWER_NOTES      — Notes attached to the App Store version for the reviewer
 */

'use strict';

const crypto = require('crypto');
const https = require('https');

const KEY_ID = required('API_KEY_ID');
const ISSUER_ID = required('API_KEY_ISSUER_ID');
const PRIVATE_KEY = required('API_KEY_P8');
const BUNDLE_ID = required('BUNDLE_ID');
const MARKETING_VERSION = process.env.MARKETING_VERSION || '';
const REVIEWER_NOTES = process.env.REVIEWER_NOTES || '';

function required(name) {
  const val = process.env[name];
  if (!val) throw new Error(`Missing required environment variable: ${name}`);
  return val;
}

// ── JWT ───────────────────────────────────────────────────────────────────────

function makeToken() {
  const b64url = (obj) =>
    Buffer.from(typeof obj === 'string' ? obj : JSON.stringify(obj))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');

  const header = b64url({ alg: 'ES256', kid: KEY_ID, typ: 'JWT' });
  const now = Math.floor(Date.now() / 1000);
  const payload = b64url({
    iss: ISSUER_ID,
    iat: now,
    exp: now + 1200,          // 20 min — well within the 20-min max Apple allows
    aud: 'appstoreconnect-v1',
  });

  const signing = `${header}.${payload}`;
  const sign = crypto.createSign('SHA256');
  sign.update(signing);
  // ieee-p1363 gives us the raw (r||s) encoding required by JWT ES256
  const sig = sign
    .sign({ key: PRIVATE_KEY, dsaEncoding: 'ieee-p1363' })
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');

  return `${signing}.${sig}`;
}

// ── HTTP ──────────────────────────────────────────────────────────────────────

function request(method, path, body) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : undefined;
    const token = makeToken();

    const req = https.request(
      {
        hostname: 'api.appstoreconnect.apple.com',
        path: `/v1${path}`,
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          if (res.statusCode === 204) return resolve(null); // No Content
          try {
            const json = JSON.parse(raw);
            if (res.statusCode >= 400) {
              const msgs = json.errors?.map((e) => `${e.title}: ${e.detail}`).join('\n') || raw;
              reject(new Error(`HTTP ${res.statusCode} ${method} ${path}\n${msgs}`));
            } else {
              resolve(json);
            }
          } catch {
            reject(new Error(`Could not parse response (${res.statusCode}): ${raw}`));
          }
        });
      },
    );

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

const get = (path) => request('GET', path);
const post = (path, body) => request('POST', path, body);
const patch = (path, body) => request('PATCH', path, body);

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // 1. Find the app
  log('Looking up app…');
  const appsRes = await get(
    `/apps?filter[bundleId]=${encodeURIComponent(BUNDLE_ID)}&fields[apps]=id,name`,
  );
  if (!appsRes.data?.length) {
    throw new Error(
      `No app found with bundleId "${BUNDLE_ID}". ` +
        'Make sure the app is registered in App Store Connect and the API key has access.',
    );
  }
  const appId = appsRes.data[0].id;
  const appName = appsRes.data[0].attributes.name;
  log(`Found app: ${appName} (id=${appId})`);

  // 2. Find the latest valid build
  log('Finding latest valid build…');
  let buildQuery =
    `filter[app]=${appId}` +
    `&filter[processingState]=VALID` +
    `&sort=-uploadedDate` +
    `&limit=1` +
    `&fields[builds]=version,uploadedDate,processingState`;
  if (MARKETING_VERSION) {
    buildQuery += `&filter[preReleaseVersion.version]=${encodeURIComponent(MARKETING_VERSION)}`;
  }
  const buildsRes = await get(`/builds?${buildQuery}`);
  if (!buildsRes.data?.length) {
    throw new Error(
      'No valid builds found in App Store Connect. ' +
        'The TestFlight upload may still be processing — wait a few minutes and try again.',
    );
  }
  const build = buildsRes.data[0];
  log(`Using build ${build.attributes.version} (uploaded ${build.attributes.uploadedDate})`);

  // 3. Find the App Store version that is ready to submit (or was previously rejected)
  log('Looking for App Store version…');
  const prepStates = [
    'PREPARE_FOR_SUBMISSION',
    'DEVELOPER_REJECTED',
    'REJECTED',
    'METADATA_REJECTED',
    'WAITING_FOR_REVIEW',  // allow re-trigger if somehow stuck
  ].join(',');
  const versionsRes = await get(
    `/appStoreVersions` +
      `?filter[app]=${appId}` +
      `&filter[appStoreState]=${prepStates}` +
      `&fields[appStoreVersions]=versionString,appStoreState` +
      `&limit=1`,
  );

  let versionId;
  if (versionsRes.data?.length) {
    versionId = versionsRes.data[0].id;
    const v = versionsRes.data[0].attributes;
    log(`Found existing version ${v.versionString} (state: ${v.appStoreState})`);
  } else {
    // Create a new App Store version
    const newVerString = MARKETING_VERSION || build.attributes.version;
    log(`Creating new App Store version ${newVerString}…`);
    const created = await post('/appStoreVersions', {
      data: {
        type: 'appStoreVersions',
        attributes: { versionString: newVerString, platform: 'IOS', releaseType: 'MANUAL' },
        relationships: { app: { data: { type: 'apps', id: appId } } },
      },
    });
    versionId = created.data.id;
    log(`Created version ${newVerString} (id=${versionId})`);
  }

  // 4. Associate the build with the App Store version
  log('Associating build with App Store version…');
  await patch(`/appStoreVersions/${versionId}/relationships/build`, {
    data: { type: 'builds', id: build.id },
  });
  log('Build associated');

  // 5. Attach reviewer notes if provided
  if (REVIEWER_NOTES) {
    log('Attaching reviewer notes…');
    // Reviewer notes go on the App Store Review Detail
    const reviewDetailRes = await get(
      `/appStoreVersions/${versionId}/appStoreReviewDetail` +
        `?fields[appStoreReviewDetails]=contactFirstName`,
    );
    if (reviewDetailRes?.data?.id) {
      await patch(`/appStoreReviewDetails/${reviewDetailRes.data.id}`, {
        data: {
          type: 'appStoreReviewDetails',
          id: reviewDetailRes.data.id,
          attributes: { notes: REVIEWER_NOTES },
        },
      });
    } else {
      await post('/appStoreReviewDetails', {
        data: {
          type: 'appStoreReviewDetails',
          attributes: { notes: REVIEWER_NOTES },
          relationships: {
            appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } },
          },
        },
      });
    }
    log('Reviewer notes saved');
  }

  // 6. Submit for review
  log('Submitting for App Store review…');
  await post('/appStoreVersionSubmissions', {
    data: {
      type: 'appStoreVersionSubmissions',
      relationships: {
        appStoreVersion: { data: { type: 'appStoreVersions', id: versionId } },
      },
    },
  });

  console.log('\n✅ Submitted! Apple typically reviews within 24 hours.');
  console.log('   Track status: https://appstoreconnect.apple.com');
}

function log(msg) {
  console.log(`  • ${msg}`);
}

main().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
