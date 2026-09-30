import crypto from 'node:crypto';
import { sha3_512 } from '../src/services/sha3.js';

console.log('--- Running Tests for sha3.js (SHA3-512) ---');

const testCases = [
  '',
  'abc',
  'The quick brown fox jumps over the lazy dog',
  '0.123456789eyJyZWFjdExpc3RlbmluZyI6dHJ1ZX0=',
  'FastFiller Chrome Extension Manifest V3 zero-key web session testing vector 2026',
  'A'.repeat(500)
];

let allPassed = true;

for (const input of testCases) {
  const expected = crypto.createHash('sha3-512').update(input).digest('hex');
  const actual = sha3_512(input);

  if (actual === expected) {
    console.log(`✓ Match for "${input.slice(0, 30)}${input.length > 30 ? '...' : ''}"`);
  } else {
    console.error(`✗ Mismatch for input: "${input}"`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual:   ${actual}`);
    allPassed = false;
  }
}

if (allPassed) {
  console.log('\nAll SHA3-512 tests passed successfully!');
  process.exit(0);
} else {
  console.error('\nSHA3-512 tests failed.');
  process.exit(1);
}
