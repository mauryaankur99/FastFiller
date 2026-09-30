import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('--- Running Tests for Authors, License & Watermark Integrity ---');

// Test 1: Verify LICENSE file exists and contains correct copyright
{
  const licensePath = path.join(rootDir, 'LICENSE');
  assert.ok(fs.existsSync(licensePath), 'LICENSE file must exist');
  const licenseContent = fs.readFileSync(licensePath, 'utf8');
  assert.match(licenseContent, /MIT License/, 'Must be MIT License');
  assert.match(licenseContent, /Copyright \(c\) 2026 Maurya Ankur, Singh Sanjiv, aeigs\.com/, 'Copyright line must match');
  console.log('✓ Test 1: LICENSE file exists with verified MIT License & copyright statement');
}

// Test 2: Verify AUTHORS.md exists and contains founders and LinkedIn links
{
  const authorsPath = path.join(rootDir, 'AUTHORS.md');
  assert.ok(fs.existsSync(authorsPath), 'AUTHORS.md file must exist');
  const authorsContent = fs.readFileSync(authorsPath, 'utf8');
  assert.match(authorsContent, /Maurya Ankur/, 'Must mention Maurya Ankur');
  assert.match(authorsContent, /https:\/\/www\.linkedin\.com\/in\/ankur-maurya1\//, 'Must include Ankur LinkedIn');
  assert.match(authorsContent, /Singh Sanjiv/, 'Must mention Singh Sanjiv');
  assert.match(authorsContent, /https:\/\/www\.linkedin\.com\/in\/sanjiv-singh\//, 'Must include Sanjiv LinkedIn');
  assert.match(authorsContent, /aeigs\.com/, 'Must include aeigs.com');
  console.log('✓ Test 2: AUTHORS.md contains verified founder credentials & links');
}

// Test 3: Verify package.json and manifest.json metadata
{
  const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  assert.equal(pkg.license, 'MIT');
  assert.equal(pkg.author, 'Maurya Ankur, Singh Sanjiv (aeigs.com)');
  assert.equal(pkg.homepage, 'https://aeigs.com');

  const manifest = JSON.parse(fs.readFileSync(path.join(rootDir, 'manifest.json'), 'utf8'));
  assert.equal(manifest.author, 'Maurya Ankur, Singh Sanjiv (aeigs.com)');
  assert.equal(manifest.homepage_url, 'https://aeigs.com');
  console.log('✓ Test 3: package.json and manifest.json contain author & homepage metadata');
}

// Test 4: Verify storage WATERMARK export and exportTemplatesJSON integration
{
  // Mock chrome and localStorage for storage.js import
  globalThis.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
  globalThis.chrome = {
    runtime: { getManifest: () => ({ version: '1.0.0' }) },
    storage: { local: { get: (k, cb) => cb({}), set: (k, cb) => cb?.() } }
  };

  const { WATERMARK, exportTemplatesJSON } = await import('../src/popup/storage.js');
  assert.ok(WATERMARK, 'WATERMARK constant must exist');
  assert.equal(WATERMARK.license, 'MIT');
  assert.equal(WATERMARK.organization, 'aeigs.com');
  assert.equal(WATERMARK.copyright, 'Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com');
  assert.equal(WATERMARK.authors.length, 2);
  assert.equal(WATERMARK.authors[0].name, 'Maurya Ankur');
  assert.equal(WATERMARK.authors[1].name, 'Singh Sanjiv');

  const jsonStr = exportTemplatesJSON([{ id: '1', name: 'Test' }]);
  const parsed = JSON.parse(jsonStr);
  assert.equal(parsed.license, 'MIT');
  assert.equal(parsed.organization, 'aeigs.com');
  assert.equal(parsed.copyright, 'Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com');
  assert.equal(parsed.authors.length, 2);
  console.log('✓ Test 4: WATERMARK constant verified and embedded in exported backup payloads');
}

// Test 5: Verify Help page renders authors section and LinkedIn links
{
  const helpPath = path.join(rootDir, 'src/help/index.js');
  const helpContent = fs.readFileSync(helpPath, 'utf8');
  assert.match(helpContent, /Maurya Ankur/, 'Help must include Maurya Ankur');
  assert.match(helpContent, /Singh Sanjiv/, 'Help must include Singh Sanjiv');
  assert.match(helpContent, /aeigs\.com/, 'Help must include aeigs.com');
  assert.match(helpContent, /https:\/\/www\.linkedin\.com\/in\/ankur-maurya1\//, 'Help must link Ankur LinkedIn');
  assert.match(helpContent, /https:\/\/www\.linkedin\.com\/in\/sanjiv-singh\//, 'Help must link Sanjiv LinkedIn');
  console.log('✓ Test 5: Help & Reference documentation includes rich verified author cards');
}

console.log('\nAll 5 Authors & Watermark Integrity tests passed successfully!\n');
