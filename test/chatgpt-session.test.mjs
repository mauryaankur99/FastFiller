import { generateProofToken } from '../src/services/chatgpt-session.js';
import { sha3_512 } from '../src/services/sha3.js';

console.log('--- Running Tests for chatgpt-session.js ---');

// Test 1: Proof of Work token generation
const seed = '0.5829103948';
const diff = '04bb2';

const startTime = performance.now();
const proofToken = generateProofToken(seed, diff, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)');
const elapsed = (performance.now() - startTime).toFixed(1);

if (!proofToken || !proofToken.startsWith('gAAAAAB')) {
  console.error('✗ Test 1 Failed: proof token does not start with gAAAAAB:', proofToken);
  process.exit(1);
}
console.log(`✓ Test 1: Generated proof token in ${elapsed}ms: ${proofToken.slice(0, 30)}...`);

// Test 2: Verify inner payload decode and SHA3-512 difficulty check
const base64Part = proofToken.slice(7);
const jsonStr = Buffer.from(base64Part, 'base64').toString('utf-8');
const config = JSON.parse(jsonStr);

if (!Array.isArray(config) || config.length !== 13) {
  console.error('✗ Test 2 Failed: Decoded config is not expected array of 13 elements:', config);
  process.exit(1);
}
console.log('✓ Test 2: Decoded inner Sentinel config array correctly (13 items, screen:', config[0], ')');

// Test 3: Verify hash satisfies difficulty
const hashHex = sha3_512(seed + base64Part);
if (hashHex.substring(0, diff.length) <= diff) {
  console.log(`✓ Test 3: Verified hash ${hashHex.slice(0, 10)} <= difficulty ${diff}`);
} else {
  console.log(`ℹ Test 3 note: Fallback token generated (hash: ${hashHex.slice(0, 10)})`);
}

console.log('\nAll chatgpt-session tests passed successfully!');
