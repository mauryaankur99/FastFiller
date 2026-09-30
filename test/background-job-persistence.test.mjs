import assert from 'node:assert/strict';

console.log('--- Running Tests for Background Fill Job Persistence & Headless Execution ---');

const mockStorage = {};
const tabMessages = [];
const broadcastMessages = [];
let onMessageListener = null;

globalThis.localStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
};

globalThis.chrome = {
  storage: {
    local: {
      get: (keys, cb) => {
        const res = {};
        const keyList = Array.isArray(keys) ? keys : [keys];
        for (const k of keyList) {
          if (k in mockStorage) res[k] = mockStorage[k];
        }
        cb(res);
      },
      set: (items, cb) => {
        Object.assign(mockStorage, items);
        if (cb) cb();
      }
    },
    onChanged: {
      addListener: () => {}
    }
  },
  tabs: {
    query: async () => [{ id: 42, url: 'https://example.com/form', title: 'Example Form' }],
    sendMessage: (tabId, msg, cb) => {
      tabMessages.push({ tabId, msg });
      if (msg.type === 'PING') {
        if (cb) cb({ pong: true });
      } else if (msg.type === 'COLLECT_DATA') {
        if (cb) {
          cb({
            success: true,
            domain: 'example.com',
            pageTitle: 'Job Application Form',
            inputs: [
              { class: 'form-filler-0-0', id: 'full_name', name: 'fullName', labelText: 'Full Name', type: 'text', isVisible: true },
              { class: 'form-filler-0-1', id: 'user_email', name: 'email', labelText: 'Email Address', type: 'email', isVisible: true }
            ]
          });
        }
      } else if (msg.type === 'FILL_FORM') {
        if (cb) {
          cb({
            success: true,
            fillResults: {
              'form-filler-0-0': { success: true },
              'form-filler-0-1': { success: true }
            },
            summary: '2/2 fields filled'
          });
        }
      } else if (msg.type === 'STOP_FILL_RUN') {
        if (cb) cb({ success: true, stopped: true });
      } else {
        if (cb) cb({ success: true });
      }
    }
  },
  scripting: {
    executeScript: async () => [{ result: true }]
  },
  runtime: {
    id: 'test-ext-id',
    onInstalled: { addListener: () => {} },
    onStartup: { addListener: () => {} },
    onMessage: {
      addListener: (fn) => { onMessageListener = fn; }
    },
    sendMessage: async (msg) => {
      broadcastMessages.push(msg);
      return { success: true };
    }
  },
  declarativeNetRequest: {
    updateDynamicRules: async () => {}
  },
  commands: {
    onCommand: { addListener: () => {} }
  },
  contextMenus: {
    removeAll: (cb) => { if (cb) cb(); },
    create: () => {},
    onClicked: { addListener: () => {} }
  }
};

// Seed config and templates
mockStorage['fastfiller_v2_config'] = {
  activeProvider: 'custom',
  providers: {
    custom: {
      endpoint: 'https://mock.api/v1',
      model: 'mock-model',
      apiKey: 'test-key'
    }
  }
};
mockStorage['fastfiller_v2_templates'] = {
  activeId: 'tpl-1',
  templates: [
    { id: 'tpl-1', name: 'Profile', content: 'Full Name: Ankur Maurya\nEmail: ankur@example.com' }
  ]
};

// Import background service worker
await import('../src/background/index.js');

// Test 1: Message listener registered
assert.ok(typeof onMessageListener === 'function', 'Background onMessage listener must be registered');
console.log('✓ Test 1: Background message listener registered successfully');

// Test 2: START_FILL_JOB initializes and executes headlessly
{
  const startResponse = await new Promise((resolve) => {
    onMessageListener(
      {
        type: 'START_FILL_JOB',
        tabId: 42,
        text: 'Full Name: Ankur Maurya\nEmail: ankur@example.com',
        dryRunMode: false,
        initiatedFromUi: true
      },
      {},
      resolve
    );
  });

  assert.ok(startResponse?.success, 'START_FILL_JOB must acknowledge success immediately');
  assert.ok(startResponse?.runId, 'START_FILL_JOB must return runId');
  console.log('✓ Test 2: START_FILL_JOB initiated and returned runId:', startResponse.runId);

  // Test 3: GET_FILL_JOB_STATE returns active/recent job state
  const stateResponse = await new Promise((resolve) => {
    onMessageListener(
      { type: 'GET_FILL_JOB_STATE', tabId: 42 },
      {},
      resolve
    );
  });

  assert.ok(stateResponse?.success, 'GET_FILL_JOB_STATE must succeed');
  assert.equal(stateResponse.job.tabId, 42);
  assert.ok(['running', 'completed'].includes(stateResponse.job.status));
  console.log('✓ Test 3: GET_FILL_JOB_STATE successfully recovered active job state');
}

// Test 4: CANCEL_FILL_JOB aborts ongoing run
{
  let cancelResponse = null;
  onMessageListener(
    { type: 'CANCEL_FILL_JOB', tabId: 42 },
    {},
    (res) => { cancelResponse = res; }
  );

  assert.ok(cancelResponse?.success);

  let stateResponse = null;
  onMessageListener(
    { type: 'GET_FILL_JOB_STATE', tabId: 42 },
    {},
    (res) => { stateResponse = res; }
  );
  assert.equal(stateResponse.job.status, 'cancelled');
  console.log('✓ Test 4: CANCEL_FILL_JOB successfully marked job as cancelled');
}

// Test 5: DISPATCH_STAGED_FILL executes injection and broadcasts completion
{
  const stagedResp = await new Promise((resolve) => {
    onMessageListener(
      {
        type: 'DISPATCH_STAGED_FILL',
        tabId: 42,
        finalValues: { 'form-filler-0-0': 'Ankur Maurya', 'form-filler-0-1': 'ankur@example.com' },
        fieldsMeta: [
          { class: 'form-filler-0-0', labelText: 'Full Name' },
          { class: 'form-filler-0-1', labelText: 'Email Address' }
        ]
      },
      {},
      resolve
    );
  });

  assert.ok(stagedResp?.success, 'DISPATCH_STAGED_FILL must succeed');
  assert.equal(stagedResp.job.status, 'completed');
  assert.equal(stagedResp.job.canUndo, true);
  console.log('✓ Test 5: DISPATCH_STAGED_FILL executed injection and verified completed status');
}

// Test 6: Web Session AI (chatgpt_web) executes in background without port closure error
{
  mockStorage['fastfiller_v2_config'] = {
    activeProvider: 'chatgpt_web',
    providers: {
      chatgpt_web: {
        engine: 'chatgpt',
        model: 'auto'
      }
    }
  };

  const startResponse = await new Promise((resolve) => {
    onMessageListener(
      {
        type: 'START_FILL_JOB',
        tabId: 42,
        text: 'Full Name: Ankur Maurya\nEmail: ankur@example.com',
        dryRunMode: false,
        initiatedFromUi: true,
        detectedFields: [
          { class: 'form-filler-0-0', id: 'full_name', name: 'fullName', labelText: 'Full Name', type: 'text', isVisible: true },
          { class: 'form-filler-0-1', id: 'user_email', name: 'email', labelText: 'Email Address', type: 'email', isVisible: true }
        ]
      },
      {},
      resolve
    );
  });

  assert.ok(startResponse?.success, 'START_FILL_JOB with chatgpt_web must acknowledge success immediately');
  assert.ok(startResponse?.runId, 'START_FILL_JOB must return runId');
  console.log('✓ Test 6: Web Session AI (chatgpt_web) executes in background without message port errors');
}

console.log('\nAll Background Fill Job Persistence & Headless Execution tests passed successfully!\n');
