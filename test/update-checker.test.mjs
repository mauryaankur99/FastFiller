import assert from 'node:assert/strict';
import {
  isNewerVersion,
  getCurrentVersion,
  checkForUpdate,
  dismissUpdate,
  STORAGE_KEY,
  UPDATE_CONFIG
} from '../src/services/update-checker.js';

console.log('🧪 Testing Update Checker Service...');

// 1. Semantic Version Comparison Tests
console.log('  1. Testing isNewerVersion semver comparison logic');
assert.strictEqual(isNewerVersion('1.0.1', '1.0.0'), true, '1.0.1 should be newer than 1.0.0');
assert.strictEqual(isNewerVersion('1.1.0', '1.0.9'), true, '1.1.0 should be newer than 1.0.9');
assert.strictEqual(isNewerVersion('2.0.0', '1.9.9'), true, '2.0.0 should be newer than 1.9.9');
assert.strictEqual(isNewerVersion('v1.0.1', '1.0.0'), true, 'Prefix v should be handled');
assert.strictEqual(isNewerVersion('v1.0.1', 'v1.0.0'), true, 'Both prefix v should be handled');
assert.strictEqual(isNewerVersion('1.0.0', '1.0.0'), false, 'Identical versions should return false');
assert.strictEqual(isNewerVersion('0.9.9', '1.0.0'), false, 'Older versions should return false');
assert.strictEqual(isNewerVersion('1.0.0', '1.0.1'), false, 'Lower version should return false');
assert.strictEqual(isNewerVersion('', '1.0.0'), false, 'Empty string should return false');
assert.strictEqual(isNewerVersion(null, '1.0.0'), false, 'Null should return false');
console.log('    ✓ Semver comparison passed all assertions.');

// 2. Current Version detection
console.log('  2. Testing getCurrentVersion');
assert.strictEqual(getCurrentVersion(), '1.0.0', 'Should fallback to 1.0.0 in Node environment');
console.log('    ✓ getCurrentVersion returns safe fallback.');

// 3. Graceful offline/404 fetch behavior
console.log('  3. Testing checkForUpdate graceful fallback on network / 404');
const originalFetch = globalThis.fetch;
try {
  // Mock 404 response
  globalThis.fetch = async () => ({
    ok: false,
    status: 404,
    statusText: 'Not Found'
  });

  const res = await checkForUpdate(true);
  assert.strictEqual(res.updateAvailable, false, 'Should return updateAvailable: false when 404');
  assert.strictEqual(typeof res.currentVersion, 'string');
  assert.strictEqual(res.latestVersion, res.currentVersion);
  console.log('    ✓ 404 handled gracefully without exceptions.');

  // Mock network rejection
  globalThis.fetch = async () => {
    throw new Error('Network offline or DNS error');
  };

  const offlineRes = await checkForUpdate(true);
  assert.strictEqual(offlineRes.updateAvailable, false, 'Should return updateAvailable: false on error');
  console.log('    ✓ Network failure handled gracefully without uncaught rejection.');
} finally {
  globalThis.fetch = originalFetch;
}

// 4. Update Available scenario and dismissal with chrome.storage mock
console.log('  4. Testing Update Available detection and dismissal with chrome.storage');
const mockStorage = {};
globalThis.chrome = {
  runtime: {
    getManifest: () => ({ version: '1.0.0' })
  },
  storage: {
    local: {
      get: async (keys) => {
        const result = {};
        for (const k of keys) {
          if (k in mockStorage) result[k] = mockStorage[k];
        }
        return result;
      },
      set: async (obj) => {
        Object.assign(mockStorage, obj);
      }
    }
  }
};

try {
  globalThis.fetch = async () => ({
    ok: true,
    json: async () => ({ version: '1.0.5' })
  });

  const foundUpdate = await checkForUpdate(true);
  assert.strictEqual(foundUpdate.updateAvailable, true, 'Should detect 1.0.5 as newer than 1.0.0');
  assert.strictEqual(foundUpdate.latestVersion, '1.0.5');
  console.log('    ✓ Update detected successfully.');

  // Test dismissal
  await dismissUpdate('1.0.5');
  assert.strictEqual(mockStorage[STORAGE_KEY]?.dismissedVersion, '1.0.5');

  // Next check should respect dismissal
  const checkAfterDismiss = await checkForUpdate(false);
  assert.strictEqual(checkAfterDismiss.updateAvailable, false, 'Dismissed version should not trigger updateAvailable');
  console.log('    ✓ Dismissal properly silences notification.');
} finally {
  globalThis.fetch = originalFetch;
  delete globalThis.chrome;
}

console.log('✅ All update-checker tests passed successfully!\n');
