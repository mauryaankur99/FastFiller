// ============================================================
// FastFiller — DeepSeek Web Session Test Suite
// Verifies 23-round Keccak-f[1600] WASM vector parity, PoW solver,
// and session status detection.
// ============================================================

import assert from 'node:assert/strict';
import {
  deepSeekHashV1,
  solveDeepSeekPow,
  checkDeepSeekSessionStatus,
  queryDeepSeekWebSession
} from '../src/services/deepseek-session.js';

console.log('--- Running Tests for deepseek-session.js ---');

// 1. Official DeepSeek WASM Test Vectors
const officialVectors = [
  { in: '', want: 'e594808bc5b7151ac160c6d39a02e0a8e261ed588578403099e3561dc40c26b3' },
  { in: 'testsalt_1700000000_42', want: 'd4a2ea58c89e40887c933484868380c6f803eaa8dc53a3b9df8e431b921a4f09' },
  { in: 'testsalt_1700000000_100000', want: 'abea2f35796b65486e9be1b36f7878c66cab021e96faa473fdf4decd31f9ba30' },
  { in: 'abc123salt_1700000000_12345', want: '74b3b7452745b70e85eb32ee7f0a9ec0381d42dd5137b695da915e104fc390e1' },
  // Real browser HAR capture vector
  { in: 'a354761683c221f6aef9_1790255163820_62588', want: 'bfceb0fa02875113aee47ef2550a4a628d456fa818fd09e7101c91cb332bfc34' }
];

for (const vec of officialVectors) {
  const got = deepSeekHashV1(vec.in);
  assert.equal(got, vec.want, `Hash mismatch for input "${vec.in}"`);
}
console.log('✓ Test 1: All 5 official DeepSeek WASM hash test vectors passed');

// 2. PoW Solver Verification
const target42 = deepSeekHashV1('testsalt_1700000000_42');
const answer42 = solveDeepSeekPow(target42, 'testsalt', 1700000000, 1000);
assert.equal(answer42, 42, 'PoW solver failed to find answer 42');

const target123 = deepSeekHashV1('mysalt_1720000000_123');
const answer123 = solveDeepSeekPow(target123, 'mysalt', 1720000000, 1000);
assert.equal(answer123, 123, 'PoW solver failed to find answer 123');
console.log('✓ Test 2: PoW solver accurately finds nonces (42, 123)');

// 3. Status check when no browser tabs open
globalThis.chrome = {
  tabs: {
    query: async () => []
  }
};

const disconnectedStatus = await checkDeepSeekSessionStatus();
assert.equal(disconnectedStatus.authenticated, false);
assert.equal(disconnectedStatus.tabOpen, false);
assert.ok(disconnectedStatus.error.includes('Please open https://chat.deepseek.com'));
console.log('✓ Test 3: Reports disconnected when no tab is open');

// 4. Status check when tab is open and authenticated
globalThis.chrome = {
  tabs: {
    query: async () => [{ id: 101, url: 'https://chat.deepseek.com/', active: true }]
  },
  scripting: {
    executeScript: async () => [{
      result: {
        authenticated: true,
        user: {
          name: 'young_engineer',
          email: 'young_engineer@gmail.com',
          id: 'user-uuid-123'
        }
      }
    }]
  }
};

const authenticatedStatus = await checkDeepSeekSessionStatus();
assert.equal(authenticatedStatus.authenticated, true);
assert.equal(authenticatedStatus.tabOpen, true);
assert.equal(authenticatedStatus.user.name, 'young_engineer');
assert.equal(authenticatedStatus.user.email, 'young_engineer@gmail.com');
console.log('✓ Test 4: Verifies live authenticated tab session with user profile');

// 5. Status check when tab is open but user is logged out (anti false-positive)
globalThis.chrome = {
  tabs: {
    query: async () => [{ id: 102, url: 'https://chat.deepseek.com/', active: true }]
  },
  scripting: {
    executeScript: async () => [{
      result: {
        authenticated: false,
        isLoggedOutDom: true
      }
    }]
  }
};

const loggedOutStatus = await checkDeepSeekSessionStatus();
assert.equal(loggedOutStatus.authenticated, false);
assert.equal(loggedOutStatus.tabOpen, true);
assert.ok(loggedOutStatus.error.includes('not signed in'));
console.log('✓ Test 5: Rejects unauthenticated tab without false-positives');

// 6. Query execution through tab bridge
globalThis.chrome = {
  tabs: {
    query: async () => [{ id: 103, url: 'https://chat.deepseek.com/', active: true }]
  },
  scripting: {
    executeScript: async () => [{
      result: {
        success: true,
        text: '{"first_name": "John", "last_name": "Doe"}'
      }
    }]
  }
};

const queryResult = await queryDeepSeekWebSession('Fill form');
assert.equal(queryResult, '{"first_name": "John", "last_name": "Doe"}');
console.log('✓ Test 6: In-tab ephemeral query bridge executes and returns response');

console.log('\nAll 6 DeepSeek Web Session tests passed successfully!');
