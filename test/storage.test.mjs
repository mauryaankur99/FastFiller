import assert from 'node:assert/strict';

// Mock chrome.storage.local and localStorage for Node environment
const mockStorage = {};
const mockLocalStorage = {};

globalThis.localStorage = {
  getItem: (k) => mockLocalStorage[k] || null,
  setItem: (k, v) => { mockLocalStorage[k] = String(v); },
  removeItem: (k) => { delete mockLocalStorage[k]; }
};

globalThis.chrome = {
  storage: {
    local: {
      get: (keys, callback) => {
        const res = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const k of keyList) {
          if (k in mockStorage) res[k] = mockStorage[k];
        }
        callback(res);
      },
      set: (items, callback) => {
        Object.assign(mockStorage, items);
        if (callback) callback();
      }
    }
  }
};

const {
  loadConfig,
  saveConfig,
  loadTemplates,
  saveTemplates,
  DEFAULT_CUSTOM_PROFILES,
  syncCustomProfile,
  STORAGE_KEYS,
  LEGACY_STORAGE_KEYS,
  loadTheme,
  loadDefaultView
} = await import('../src/popup/storage.js');

console.log('--- Running Tests for storage.js ---');

// Test 1: Fresh initial config load
{
  const config = await loadConfig();
  assert.equal(config.activeProvider, 'chatgpt_web');
  assert.ok(config.providers.chatgpt_web);
  assert.ok(config.providers.custom);
  console.log('✓ loadConfig: initializes default streamlined provider structure');
}

// Test 2: Migration from legacy v1 settings
{
  // Reset storage
  for (const k in mockStorage) delete mockStorage[k];
  // Seed legacy settings
  mockStorage[STORAGE_KEYS.SETTINGS_V1_LEGACY] = {
    provider: 'anthropic',
    apiKey: 'sk-ant-test-12345',
    apiEndpoint: 'https://custom.anthropic.endpoint',
    model: 'claude-3-5-sonnet-latest',
    systemPrompt: 'Custom prompt test'
  };

  const migrated = await loadConfig();
  assert.equal(migrated.activeProvider, 'custom');
  assert.equal(migrated.providers.custom.apiKey, 'sk-ant-test-12345');
  assert.equal(migrated.providers.custom.endpoint, 'https://custom.anthropic.endpoint');
  assert.equal(migrated.customSystemPrompt, 'Custom prompt test');
  console.log('✓ loadConfig: successfully migrates legacy v1 settings into custom provider without data loss');
}

// Test 3: Template loading and migration from localStorage
{
  // Reset storage and localStorage
  for (const k in mockStorage) delete mockStorage[k];
  for (const k in mockLocalStorage) delete mockLocalStorage[k];

  // Seed legacy template in localStorage
  mockLocalStorage[STORAGE_KEYS.TEMPLATES] = JSON.stringify([
    { id: 'custom-tpl-1', name: 'My Custom Template', content: 'Name: Jane Doe' }
  ]);
  mockLocalStorage[STORAGE_KEYS.ACTIVE_TEMPLATE_ID] = 'custom-tpl-1';

  const { templates, activeId } = await loadTemplates();
  assert.equal(templates.length, 1);
  assert.equal(templates[0].id, 'custom-tpl-1');
  assert.equal(activeId, 'custom-tpl-1');
  console.log('✓ loadTemplates: migrates templates from localStorage into chrome.storage.local');
}

// Test 4: Default templates when empty
{
  for (const k in mockStorage) delete mockStorage[k];
  for (const k in mockLocalStorage) delete mockLocalStorage[k];

  const { templates, activeId } = await loadTemplates();
  assert.ok(templates.length >= 3);
  assert.ok(templates.some((t) => t.name.includes('Job Application')));
  assert.ok(activeId);
  console.log('✓ loadTemplates: seeds rich starter templates when storage is fresh');
}

// Test 5: customProviderProfiles initialized with all 10 providers
{
  const config = await loadConfig();
  assert.ok(config.customProviderProfiles);
  assert.equal(config.customProviderProfiles.selectedProvider, 'groq');
  const profs = config.customProviderProfiles.profiles;
  const expected = ['groq', 'openrouter', 'gemini', 'openai', 'anthropic', 'deepseek', 'nvidia', 'meta', 'ollama', 'custom'];
  for (const id of expected) {
    assert.ok(profs[id], `Missing profile for ${id}`);
    assert.equal(profs[id].id, id);
  }
  console.log('✓ loadConfig: customProviderProfiles contains all 10 isolated provider profiles');
}

// Test 6: Switching providers does NOT overwrite or lose keys and endpoints
{
  const config = await loadConfig();

  // User enters Groq key and custom endpoint
  syncCustomProfile(config, 'groq', {
    apiKey: 'gsk-test-groq-key-1234',
    endpoint: 'https://my-proxy.groq.internal/v1/chat/completions',
    model: 'llama-3.3-70b-versatile'
  });
  await saveConfig(config);

  // User switches to OpenAI and enters OpenAI key and model
  syncCustomProfile(config, 'openai', {
    apiKey: 'sk-proj-openai-key-5678',
    model: 'gpt-4o'
  });
  await saveConfig(config);

  // User switches to Ollama and enters custom port
  syncCustomProfile(config, 'ollama', {
    endpoint: 'http://localhost:11435/v1/chat/completions',
    model: 'mistral'
  });
  await saveConfig(config);

  // User switches to Gemini and enters key
  syncCustomProfile(config, 'gemini', {
    apiKey: 'AIzaSy-test-gemini-key',
    model: 'gemini-3.5-flash-lite'
  });
  await saveConfig(config);

  // Reload config from storage and verify that ALL entries remained intact without cross-talk
  const reloaded = await loadConfig();
  const profiles = reloaded.customProviderProfiles.profiles;

  // Official Groq: key and model preserved, but endpoint locked to official default
  assert.equal(profiles.groq.apiKey, 'gsk-test-groq-key-1234');
  assert.equal(profiles.groq.endpoint, 'https://api.groq.com/openai/v1/chat/completions');
  assert.equal(profiles.groq.model, 'llama-3.3-70b-versatile');

  // Official OpenAI: key and model preserved, endpoint locked to official default
  assert.equal(profiles.openai.apiKey, 'sk-proj-openai-key-5678');
  assert.equal(profiles.openai.endpoint, 'https://api.openai.com/v1/chat/completions');
  assert.equal(profiles.openai.model, 'gpt-4o');

  // Ollama: allows custom endpoint and model
  assert.equal(profiles.ollama.endpoint, 'http://localhost:11435/v1/chat/completions');
  assert.equal(profiles.ollama.model, 'mistral');

  // Gemini: native endpoint and format
  assert.equal(profiles.gemini.apiKey, 'AIzaSy-test-gemini-key');
  assert.equal(profiles.gemini.endpoint, 'https://generativelanguage.googleapis.com/v1beta');
  assert.equal(profiles.gemini.format, 'gemini');

  // Verify that providers.custom reflects the currently selected provider (gemini)
  assert.equal(reloaded.providers.custom.apiKey, 'AIzaSy-test-gemini-key');
  assert.equal(reloaded.providers.custom.endpoint, 'https://generativelanguage.googleapis.com/v1beta');
  assert.equal(reloaded.providers.custom.format, 'gemini');

  console.log('✓ syncCustomProfile: switching providers preserves credentials, locks official endpoints, and allows custom/local endpoints');
}

// Test 7: Custom BYOK profile has no hardcoded default models or endpoints
{
  for (const k in mockStorage) delete mockStorage[k];
  const freshConfig = await loadConfig();
  const customProf = freshConfig.customProviderProfiles.profiles.custom;
  assert.equal(customProf.model, '', 'Custom mode model should be empty initially');
  assert.equal(customProf.defaultModel, '', 'Custom mode defaultModel should be empty');
  assert.equal(customProf.endpoint, '', 'Custom mode endpoint should be empty initially');
  assert.equal(customProf.defaultEndpoint, '', 'Custom mode defaultEndpoint should be empty');
  assert.equal(customProf.cachedModels, undefined, 'Custom mode should not have initial cachedModels');

  // Verify legacy sanitize: if storage had old llama-3.3-70b-versatile in custom profile, loadConfig cleans it
  mockStorage[STORAGE_KEYS.CONFIG_V2] = {
    activeProvider: 'custom',
    customProviderProfiles: {
      selectedProvider: 'custom',
      profiles: {
        custom: {
          endpoint: '',
          model: 'llama-3.3-70b-versatile',
          cachedModels: [{ id: 'llama-3.3-70b-versatile' }]
        }
      }
    }
  };
  const sanitizedConfig = await loadConfig();
  const sanitizedCustom = sanitizedConfig.customProviderProfiles.profiles.custom;
  assert.equal(sanitizedCustom.model, '', 'Legacy llama-3.3-70b-versatile should be sanitized to empty');
  assert.equal(sanitizedCustom.cachedModels, undefined, 'Stale cached models without endpoint should be cleared');
  console.log('✓ Custom BYOK: verifies completely empty initial model/endpoint and legacy sanitization');
}

// Test 8: Seamless backward compatibility with legacy storage keys
{
  for (const k in mockStorage) delete mockStorage[k];
  for (const k in mockLocalStorage) delete mockLocalStorage[k];

  mockStorage[LEGACY_STORAGE_KEYS.CONFIG_V2] = {
    activeProvider: 'custom',
    providers: {
      custom: {
        apiKey: 'legacy-key-999',
        endpoint: 'https://legacy.example.com',
        model: 'legacy-model'
      }
    }
  };
  mockStorage[LEGACY_STORAGE_KEYS.THEME] = 'light';
  mockStorage[LEGACY_STORAGE_KEYS.DEFAULT_VIEW] = 'sidepanel';
  mockLocalStorage[LEGACY_STORAGE_KEYS.TEMPLATES] = JSON.stringify([
    { id: 'legacy-tpl', name: 'Legacy Tpl', content: 'Legacy Content' }
  ]);
  mockLocalStorage[LEGACY_STORAGE_KEYS.ACTIVE_TEMPLATE_ID] = 'legacy-tpl';

  const config = await loadConfig();
  assert.equal(config.providers.custom.apiKey, 'legacy-key-999');

  const { templates, activeId } = await loadTemplates();
  assert.equal(templates.length, 1);
  assert.equal(templates[0].id, 'legacy-tpl');
  assert.equal(activeId, 'legacy-tpl');

  const theme = await loadTheme();
  assert.equal(theme, 'light');

  const defaultView = await loadDefaultView();
  assert.equal(defaultView, 'sidepanel');

  console.log('✓ Legacy Storage Migration: 100% seamlessly recovers legacy data keys');
}

console.log('\nAll 8 storage tests passed successfully!');
