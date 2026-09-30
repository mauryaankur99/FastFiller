/**
 * FastFiller — Main Popup & Side Panel Controller
 * Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com
 * Licensed under the MIT License.
 * Authors: Maurya Ankur (https://www.linkedin.com/in/ankur-maurya1/), Singh Sanjiv (https://www.linkedin.com/in/sanjiv-singh/)
 * Organization: Aeigs (https://aeigs.com)
 */

import {
  loadConfig,
  saveConfig,
  loadTemplates,
  saveTemplates,
  setActiveTemplateId,
  exportTemplatesJSON,
  parseImportTemplates,
  DEFAULT_TEMPLATES,
  loadTheme,
  saveTheme,
  loadDefaultView,
  saveDefaultView,
  DEFAULT_CUSTOM_PROFILES,
  syncCustomProfile,
  WATERMARK
} from './storage.js';

import {
  PROVIDERS_REGISTRY,
  WEB_SESSION_SUB_ENGINES,
  CUSTOM_PROVIDER_PRESETS,
  DEFAULT_SYSTEM_PROMPT,
  SYSTEM_PROMPT_PRESETS,
  buildMessages,
  callAI,
  testConnection,
  parseAIResponse,
  resolveDynamicTemplateVariables,
  prioritizeInputs,
  chunkInputs,
  fetchProviderModels,
  FALLBACK_MODELS_BY_PROVIDER,
  isChatModel,
  normalizeAIValuesToCanonicalFields,
  isNegativeDirectiveOrSkip
} from './api-providers.js';

import {
  checkForUpdate,
  dismissUpdate,
  getCurrentVersion
} from '../services/update-checker.js';

// Clean Professional SVG Icons (Zero Emoji Slop)
const ICONS = {
  CHECK_CIRCLE: `<svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="16 10 11 15 8 12"/></svg>`,
  GEAR: `<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  BACK: `<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>`,
  EYE: `<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  EYE_OFF: `<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  ZAP: `<svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  HELP: `<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  CROSS: `<svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  CHECK: `<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  TARGET: `<svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>`,
  SEARCH: `<svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  REFRESH: `<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  SUN: `<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  MOON: `<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  SIDEBAR: `<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
  POPUP: `<svg class="icon-svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>`,
  RESET: `<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`,
  SHIELD: `<svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  FOLDER: `<svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>`,
  COPY: `<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  EDIT: `<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  DOWNLOAD: `<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  UPLOAD: `<svg class="icon-svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  MAXIMIZE: `<svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>`,
  MINIMIZE: `<svg class="icon-svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14h6m0 0v6m0-6L3 21m17-11h-6m0 0V4m0 6l7-7"/></svg>`
};

const isRunningInSidePanel = document.body.classList.contains('sidepanel-mode') || window.innerWidth > 400;

// Application State
let state = {
  view: 'main', // 'main' | 'settings'
  settingsTab: 'providers', // 'providers' | 'prompt'
  selectedSettingsProvider: 'chatgpt_web',
  theme: 'dark',
  defaultView: 'popup',
  config: null,
  templates: [],
  activeTemplateId: '',
  currentText: '',
  saveStatus: 'saved', // 'saved' | 'saving'
  detectedFields: [],
  isScanning: true,
  showInspector: false,
  showTemplateManager: false,
  dryRunMode: false,
  showDryRunDrawer: false,
  dryRunFullScreen: false,
  stagedFillValues: {},
  showSkippedDrawer: false,
  skippedFields: [],
  profileSearchQuery: '',
  profileCategoryFilter: 'All',
  modalDialog: null, // null | { type: 'create'|'rename', templateId?: string, nameValue: string, startOption?: 'blank'|'clone' }
  isFilling: false,
  fillStage: 0,
  fillStepText: '',
  fillFeedback: null,
  canUndo: false,
  pageDomain: '',
  pageTitle: '',
  testState: { loading: false, result: null },
  confirmDeleteId: null,
  showApiKey: false,
  modelFetchState: { loading: false, error: null, successMessage: null },
  filterFreeModels: false,
  updateInfo: null,
  checkingUpdate: false,
  updateCheckFeedback: null
};

let autoSaveTimer = null;

// DOM Helper
function el(tag, attrs = {}, ...children) {
  const BOOL_ATTRS = ['disabled', 'checked', 'selected', 'readonly', 'required', 'autofocus'];
  const element = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') element.className = value;
    else if (key === 'textContent') element.textContent = value;
    else if (key === 'innerHTML') element.innerHTML = value;
    else if (key === 'value') {
      element.value = value != null ? value : '';
      if (element.tagName === 'TEXTAREA') {
        element.textContent = value != null ? value : '';
      }
    }
    else if (key.startsWith('on') && typeof value === 'function') {
      element.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (BOOL_ATTRS.includes(key)) {
      if (key in element) element[key] = Boolean(value);
      if (value) element.setAttribute(key, '');
      else element.removeAttribute(key);
    } else if (value !== false && value != null) {
      element.setAttribute(key, value);
    }
  }

  for (const child of children.flat()) {
    if (child == null || child === false) continue;
    if (typeof child === 'string') element.appendChild(document.createTextNode(child));
    else if (child instanceof Node) element.appendChild(child);
  }

  return element;
}

// ──────────────────────────────────────────
// RESILIENT AUTO-SAVE & FLUSH SYSTEM
// ──────────────────────────────────────────

function updateSaveStatusUI() {
  const elStatus = document.getElementById('save-status-display');
  if (!elStatus) return;
  if (state.saveStatus === 'saving') {
    elStatus.className = 'save-status-pill saving';
    elStatus.innerHTML = `${ICONS.REFRESH} Saving...`;
  } else {
    elStatus.className = 'save-status-pill saved';
    elStatus.innerHTML = `${ICONS.CHECK} Saved`;
  }
}

function updateFillButtonState() {
  const fillBtn = document.getElementById('main-fill-btn');
  const canFill = !state.isFilling && (state.currentText || '').trim().length > 0;
  if (fillBtn) {
    fillBtn.disabled = !canFill;
  }
  const clearBtn = document.getElementById('clear-text-btn');
  if (clearBtn) {
    clearBtn.style.display = canFill ? 'inline' : 'none';
  }
}

function updateMainViewProfileSelect() {
  const sel = document.getElementById('main-tpl-select');
  if (!sel) return;
  sel.innerHTML = '';
  state.templates.forEach((t) => {
    const opt = el('option', { value: t.id, textContent: t.name });
    if (t.id === state.activeTemplateId) opt.selected = true;
    sel.appendChild(opt);
  });
  sel.value = state.activeTemplateId;
}

function handleTextChange(newText) {
  state.currentText = newText;
  state.saveStatus = 'saving';
  updateSaveStatusUI();
  updateFillButtonState();

  // Update in-memory template immediately
  state.templates = state.templates.map((t) =>
    t.id === state.activeTemplateId ? { ...t, content: newText, updatedAt: Date.now() } : t
  );

  // Debounced storage write (200ms)
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(async () => {
    await saveTemplates(state.templates, state.activeTemplateId);
    state.saveStatus = 'saved';
    updateSaveStatusUI();
  }, 200);
}

function flushPendingSave() {
  clearTimeout(autoSaveTimer);
  // Ensure the active template in state has the latest currentText
  state.templates = state.templates.map((t) =>
    t.id === state.activeTemplateId ? { ...t, content: state.currentText, updatedAt: Date.now() } : t
  );
  saveTemplates(state.templates, state.activeTemplateId);
  state.saveStatus = 'saved';
  updateSaveStatusUI();
}

window.addEventListener('beforeunload', flushPendingSave);
window.addEventListener('pagehide', flushPendingSave);

// ──────────────────────────────────────────
// CONTENT SCRIPT ON-DEMAND AUTO-INJECTION
// ──────────────────────────────────────────

async function ensureContentScriptActive(tabId) {
  if (!tabId || typeof chrome === 'undefined' || !chrome.tabs) return false;

  const isAlive = await new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { type: 'PING' }, (resp) => {
        if (chrome.runtime?.lastError || !resp?.pong) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    } catch {
      resolve(false);
    }
  });

  if (isAlive) return true;

  if (chrome.scripting?.executeScript) {
    try {
      console.log('[FastFiller] Content script not active on tab. Dynamically injecting...');
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['src/content/index.js']
      });
      await new Promise((r) => setTimeout(r, 120));
      return true;
    } catch (err) {
      console.warn('[FastFiller] Script injection with allFrames failed, retrying top frame:', err);
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['src/content/index.js']
        });
        await new Promise((r) => setTimeout(r, 120));
        return true;
      } catch (err2) {
        console.warn('[FastFiller] Script injection top frame failed:', err2);
      }
    }
  }

  return false;
}

// ──────────────────────────────────────────
// SCAN FORM FIELDS ON ACTIVE TAB
// ──────────────────────────────────────────

async function scanPageFields() {
  if (state.isFilling) return;
  state.isScanning = true;
  render();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://')) {
      state.detectedFields = [];
      state.isScanning = false;
      render();
      return;
    }

    await ensureContentScriptActive(tab.id);

    chrome.tabs.sendMessage(tab.id, { type: 'COLLECT_DATA' }, (response) => {
      state.isScanning = false;
      if (chrome.runtime?.lastError || !response?.success) {
        state.detectedFields = [];
        state.pageDomain = '';
        state.pageTitle = '';
      } else {
        state.detectedFields = response.inputs || [];
        state.pageDomain = response.domain || '';
        state.pageTitle = response.pageTitle || tab.title || '';
      }
      render();
    });
  } catch (err) {
    state.isScanning = false;
    state.detectedFields = [];
    render();
  }
}

// ──────────────────────────────────────────
// ──────────────────────────────────────────
// FORM FILL ORCHESTRATOR & ERROR RECOVERY
// ──────────────────────────────────────────

function buildActionableErrorFeedback(err, tab) {
  const errMsg = err?.message || 'An error occurred while filling the form.';
  const lower = errMsg.toLowerCase();
  const actions = [];

  // 1. Missing or Invalid API Key (HTTP 401 / 403 / unauthorized)
  if (lower.includes('401') || lower.includes('403') || lower.includes('unauthorized') || lower.includes('api key') || lower.includes('authentication')) {
    actions.push({
      label: 'Configure API Key',
      primary: true,
      onClick: () => {
        state.view = 'settings';
        state.settingsTab = 'providers';
        render();
      }
    });
    if (state.config?.activeProvider !== 'chatgpt_web') {
      actions.push({
        label: 'Switch to Free ChatGPT Web',
        onClick: async () => {
          state.config.activeProvider = 'chatgpt_web';
          await saveConfig(state.config);
          state.fillFeedback = { type: 'success', text: 'Switched to ChatGPT Web Session (zero API key required).' };
          render();
        }
      });
    }
  }

  // 2. Rate Limit or Quota Exceeded (HTTP 429)
  else if (lower.includes('429') || lower.includes('rate limit') || lower.includes('quota') || lower.includes('too many requests')) {
    if (state.config?.activeProvider !== 'chatgpt_web') {
      actions.push({
        label: 'Switch to Free ChatGPT Web',
        primary: true,
        onClick: async () => {
          state.config.activeProvider = 'chatgpt_web';
          await saveConfig(state.config);
          state.fillFeedback = { type: 'success', text: 'Switched to ChatGPT Web Session (free unlimited).' };
          render();
        }
      });
    }
    actions.push({
      label: 'Configure Model / API',
      onClick: () => {
        state.view = 'settings';
        state.settingsTab = 'providers';
        render();
      }
    });
  }

  // 3. ChatGPT Web Tab Disconnected / Missing
  else if (lower.includes('chatgpt') || lower.includes('chatgpt.com') || lower.includes('tab not found') || lower.includes('open chatgpt')) {
    actions.push({
      label: 'Open ChatGPT Tab',
      primary: true,
      onClick: () => {
        if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
          chrome.tabs.create({ url: 'https://chatgpt.com' });
        } else {
          window.open('https://chatgpt.com', '_blank');
        }
      }
    });
    actions.push({
      label: 'Switch to API Engine',
      onClick: async () => {
        state.config.activeProvider = 'custom';
        await saveConfig(state.config);
        state.view = 'settings';
        state.settingsTab = 'providers';
        state.selectedSettingsProvider = 'custom';
        render();
      }
    });
  }

  // 4. Page Permission / Script Connection Error (e.g. Chrome Web Store, chrome://, or extension reload)
  else if (
    lower.includes('cannot communicate with page') ||
    lower.includes('receiving end does not exist') ||
    lower.includes('permission') ||
    lower.includes('cannot access contents') ||
    lower.includes('request permission to access')
  ) {
    if (tab?.id) {
      actions.push({
        label: 'Reload Page 🔄',
        primary: true,
        onClick: () => {
          if (typeof chrome !== 'undefined' && chrome.tabs?.reload) {
            chrome.tabs.reload(tab.id);
            window.close();
          }
        }
      });
    }
    actions.push({
      label: 'Site Access Settings ⚙️',
      onClick: () => {
        if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
          chrome.tabs.create({ url: `chrome://extensions/?id=${chrome.runtime?.id || ''}` });
        }
      }
    });
  }

  // 5. No fillable fields found
  else if (lower.includes('no fillable form fields') || lower.includes('failed to detect form fields')) {
    actions.push({
      label: 'Re-scan Page',
      primary: true,
      onClick: () => {
        scanPageFields();
      }
    });
  }

  return {
    type: 'danger',
    text: errMsg,
    actions
  };
}

let activeFillRunId = null;
let activeFillAbortController = null;
let fillElapsedTimer = null;
let fillStartTime = 0;

function stopAutoFill() {
  if (!state.isFilling && !activeFillRunId) return;

  const stoppedRunId = activeFillRunId;
  activeFillRunId = null;

  if (activeFillAbortController) {
    try { activeFillAbortController.abort(); } catch {}
    activeFillAbortController = null;
  }

  if (fillElapsedTimer) {
    clearInterval(fillElapsedTimer);
    fillElapsedTimer = null;
  }

  state.isFilling = false;
  state.fillStage = 0;
  state.fillStepText = '';
  state.fillElapsedText = '';
  state.fillFeedback = {
    type: 'warning',
    text: 'Form auto-fill stopped by user.'
  };

  chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
    if (tab?.id) {
      if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'CANCEL_FILL_JOB', tabId: tab.id, runId: stoppedRunId }).catch(() => {});
      }
      chrome.tabs.sendMessage(tab.id, { type: 'STOP_FILL_RUN', runId: stoppedRunId }).catch(() => {});
    }
  });

  render();
}

async function executeFormFill() {
  flushPendingSave();

  if (!WATERMARK || WATERMARK.organization !== 'aeigs.com' || !Array.isArray(WATERMARK.authors) || WATERMARK.authors.length < 2) {
    state.fillFeedback = {
      type: 'error',
      text: 'FastFiller core integrity check failed: missing author watermark.'
    };
    render();
    return;
  }

  const activeProvKey = state.config.activeProvider || 'chatgpt_web';
  const reg = PROVIDERS_REGISTRY[activeProvKey];
  const activeProvConfig = (state.config.providers && state.config.providers[activeProvKey]) || {
    endpoint: reg?.endpoint || '',
    model: reg?.defaultModel || ''
  };

  if (!reg) {
    state.fillFeedback = {
      type: 'warning',
      text: 'Configure your AI provider in Settings first.',
      actions: [{
        label: 'Open Settings ⚙️',
        primary: true,
        onClick: () => {
          state.view = 'settings';
          state.settingsTab = 'providers';
          render();
        }
      }]
    };
    render();
    return;
  }

  if (reg?.requiresKey && !activeProvConfig.apiKey?.trim()) {
    state.fillFeedback = {
      type: 'warning',
      text: `Missing API key for ${reg.name}. Configure in Settings.`,
      actions: [
        {
          label: 'Enter API Key ⚙️',
          primary: true,
          onClick: () => {
            state.view = 'settings';
            state.settingsTab = 'providers';
            state.selectedSettingsProvider = activeProvKey;
            render();
          }
        },
        {
          label: 'Switch to Free ChatGPT Web',
          onClick: async () => {
            state.config.activeProvider = 'chatgpt_web';
            await saveConfig(state.config);
            state.fillFeedback = { type: 'success', text: 'Switched to ChatGPT Web Session (no API key needed).' };
            render();
          }
        }
      ]
    };
    render();
    return;
  }

  if (activeProvKey === 'custom' && !activeProvConfig.endpoint) {
    state.fillFeedback = {
      type: 'error',
      text: 'Custom AI API configuration is incomplete. Please enter an Endpoint.',
      actions: [
        {
          label: 'Configure API',
          primary: true,
          onClick: () => {
            state.view = 'settings';
            state.settingsTab = 'providers';
            state.selectedSettingsProvider = 'custom';
            render();
          }
        },
        {
          label: 'Switch to Free ChatGPT Web',
          onClick: async () => {
            state.config.activeProvider = 'chatgpt_web';
            await saveConfig(state.config);
            state.fillFeedback = { type: 'success', text: 'Switched to ChatGPT Web Session (no API key needed).' };
            render();
          }
        }
      ]
    };
    render();
    return;
  }

  if (!state.currentText.trim()) {
    state.fillFeedback = { type: 'warning', text: 'Enter or select information to fill.' };
    render();
    return;
  }

  let currentActiveTab = null;

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentActiveTab = tab;
    if (!tab?.id) throw new Error('No active browser tab found.');
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:') || tab.url.startsWith('chrome-extension://') || tab.url.includes('chromewebstore.google.com')) {
      throw new Error('Cannot run on internal browser or web store pages. Please open a webpage with a form.');
    }

    const runId = 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    activeFillRunId = runId;

    state.isFilling = true;
    state.fillFeedback = null;
    state.fillStage = 1;
    state.fillStepText = 'Scanning form inputs...';
    state.fillElapsedText = '0.0s';
    fillStartTime = performance.now();

    if (fillElapsedTimer) clearInterval(fillElapsedTimer);
    fillElapsedTimer = setInterval(() => {
      if (!state.isFilling) {
        clearInterval(fillElapsedTimer);
        fillElapsedTimer = null;
        return;
      }
      const elapsed = ((performance.now() - fillStartTime) / 1000).toFixed(1);
      state.fillElapsedText = `${elapsed}s`;
      const badge = document.getElementById('fill-elapsed-badge');
      if (badge) {
        badge.textContent = `⏱ ${state.fillElapsedText}`;
      }
    }, 200);

    render();

    // Delegate execution to background service worker (keeps running independently if popup closes!)
    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'START_FILL_JOB',
        tabId: tab.id,
        text: state.currentText,
        config: state.config,
        dryRunMode: state.dryRunMode,
        initiatedFromUi: true
      }, (resp) => {
        if (chrome.runtime.lastError || (resp && !resp.success)) {
          const errText = resp?.error || chrome.runtime.lastError?.message || 'Could not start background fill.';
          state.isFilling = false;
          if (fillElapsedTimer) {
            clearInterval(fillElapsedTimer);
            fillElapsedTimer = null;
          }
          state.fillFeedback = buildActionableErrorFeedback(new Error(errText), tab);
          render();
        } else if (resp?.runId) {
          activeFillRunId = resp.runId;
        }
      });
    }
  } catch (err) {
    state.isFilling = false;
    if (fillElapsedTimer) {
      clearInterval(fillElapsedTimer);
      fillElapsedTimer = null;
    }
    state.fillFeedback = buildActionableErrorFeedback(err, currentActiveTab);
    render();
  }
}

function handleJobUpdateFromBackground(job) {
  if (!job) return;

  if (job.status === 'running') {
    const wasFilling = state.isFilling;
    const stageChanged = state.fillStage !== (job.stage || 1);
    state.isFilling = true;
    state.fillStage = job.stage || 1;
    state.fillStepText = job.stepText || '';
    if (job.elapsedText) {
      state.fillElapsedText = job.elapsedText;
    }
    if (Array.isArray(job.detectedFields) && job.detectedFields.length > 0) {
      state.detectedFields = job.detectedFields;
      if (job.pageDomain) state.pageDomain = job.pageDomain;
      if (job.pageTitle) state.pageTitle = job.pageTitle;
    }
    activeFillRunId = job.runId;

    const progressCard = document.querySelector('.fill-progress-card');
    if (!wasFilling || !progressCard || stageChanged) {
      render();
      return;
    }

    // Surgical in-place updates: NO full re-rendering, NO loader blinking
    const badge = document.getElementById('fill-elapsed-badge');
    if (badge && state.fillElapsedText) {
      badge.textContent = `⏱ ${state.fillElapsedText}`;
    }
    const titleText = document.querySelector('.fill-progress-title-text');
    if (titleText && state.fillStepText) {
      titleText.textContent = state.fillStepText;
    }
    const stageBar = document.querySelector('.fill-stage-bar');
    if (stageBar) {
      const stagePercent = state.fillStage === 1 ? '30%' : state.fillStage === 2 ? '65%' : '95%';
      stageBar.style.width = stagePercent;
    }
  } else if (job.status === 'staged') {
    if (fillElapsedTimer) {
      clearInterval(fillElapsedTimer);
      fillElapsedTimer = null;
    }
    state.isFilling = false;
    state.fillStage = 0;
    state.fillStepText = '';
    state.stagedFillValues = job.stagedFillValues || {};
    state.showDryRunDrawer = true;
    activeFillRunId = null;
    render();
  } else if (job.status === 'completed') {
    if (fillElapsedTimer) {
      clearInterval(fillElapsedTimer);
      fillElapsedTimer = null;
    }
    state.isFilling = false;
    state.fillStage = 0;
    state.fillStepText = '';
    state.skippedFields = job.skippedFields || [];
    state.canUndo = Boolean(job.canUndo);
    activeFillRunId = null;

    if (job.feedback) {
      if (job.feedback.failedCount > 0) {
        state.fillFeedback = {
          type: 'warning',
          text: job.feedback.text,
          actions: [
            {
              label: `View Skipped (${job.feedback.failedCount}) 📋`,
              primary: true,
              onClick: () => {
                state.showSkippedDrawer = true;
                render();
              }
            }
          ]
        };
      } else {
        state.fillFeedback = {
          type: 'success',
          text: job.feedback.text
        };
      }
    }
    render();
  } else if (job.status === 'error') {
    if (fillElapsedTimer) {
      clearInterval(fillElapsedTimer);
      fillElapsedTimer = null;
    }
    state.isFilling = false;
    state.fillStage = 0;
    state.fillStepText = '';
    activeFillRunId = null;
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      state.fillFeedback = buildActionableErrorFeedback(new Error(job.error || 'Form fill failed.'), tab);
      render();
    });
  } else if (job.status === 'cancelled') {
    if (fillElapsedTimer) {
      clearInterval(fillElapsedTimer);
      fillElapsedTimer = null;
    }
    state.isFilling = false;
    state.fillStage = 0;
    state.fillStepText = '';
    activeFillRunId = null;
    state.fillFeedback = {
      type: 'warning',
      text: 'Form auto-fill stopped by user.'
    };
    render();
  }
}

async function confirmAndDispatchStagedFill() {
  const runId = 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  activeFillRunId = runId;
  activeFillAbortController = new AbortController();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const finalValues = {};
    for (const [classKey, item] of Object.entries(state.stagedFillValues)) {
      if (item.checked) {
        finalValues[classKey] = item.value;
      }
    }

    document.body.classList.remove('dry-run-fullscreen-active');
    state.dryRunFullScreen = false;
    state.showDryRunDrawer = false;
    state.isFilling = true;
    state.fillStage = 3;
    state.fillStepText = 'Dispatching reviewed values...';
    render();

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'DISPATCH_STAGED_FILL',
        tabId: tab.id,
        finalValues,
        runId,
        fieldsMeta: state.detectedFields
      }, (resp) => {
        if (resp?.job) {
          handleJobUpdateFromBackground(resp.job);
        }
      });
    }
  } catch (err) {
    state.isFilling = false;
    state.fillFeedback = buildActionableErrorFeedback(err);
    render();
  }
}

async function executeUndoFill() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const resp = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { type: 'UNDO_FILL' }, (r) => resolve(r || {}));
    });

    if (resp?.success) {
      state.canUndo = false;
      state.fillFeedback = {
        type: 'info',
        text: `Restored ${resp.restoredCount || 0} fields to their prior values.`
      };
      render();
    } else {
      state.fillFeedback = {
        type: 'warning',
        text: resp?.message || 'No previous fill snapshot available to undo.'
      };
      render();
    }
  } catch (err) {
    state.fillFeedback = { type: 'danger', text: err.message || 'Failed to undo fill.' };
    render();
  }
}

async function retrySkippedFields() {
  if (!state.skippedFields || state.skippedFields.length === 0) return;

  const retryValues = {};
  for (const item of state.skippedFields) {
    if (item.value != null && String(item.value).trim() !== '') {
      retryValues[item.classKey] = item.value;
    }
  }

  if (Object.keys(retryValues).length === 0) {
    state.fillFeedback = { type: 'warning', text: 'Please enter values for the skipped fields to retry.' };
    state.showSkippedDrawer = false;
    render();
    return;
  }

  const runId = 'retry-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  activeFillRunId = runId;
  activeFillAbortController = new AbortController();

  state.showSkippedDrawer = false;
  state.isFilling = true;
  state.fillStage = 3;
  state.fillStepText = `Retrying ${Object.keys(retryValues).length} skipped fields...`;
  render();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    if (typeof chrome !== 'undefined' && chrome.runtime?.sendMessage) {
      chrome.runtime.sendMessage({
        type: 'DISPATCH_STAGED_FILL',
        tabId: tab.id,
        finalValues: retryValues,
        runId,
        fieldsMeta: state.detectedFields
      }, (resp) => {
        if (resp?.job) {
          handleJobUpdateFromBackground(resp.job);
        }
      });
    }
  } catch (err) {
    state.isFilling = false;
    state.fillFeedback = { type: 'danger', text: err.message || 'Retry failed.' };
    render();
  }
}

// ──────────────────────────────────────────
// THEME & SIDEBAR
// ──────────────────────────────────────────

function getIconSrc(theme) {
  const file = theme === 'light' ? 'assets/icon-light.webp' : 'assets/icon-dark.webp';
  return (typeof chrome !== 'undefined' && chrome.runtime?.getURL) ? chrome.runtime.getURL(file) : `/${file}`;
}

async function toggleTheme() {
  const newTheme = state.theme === 'dark' ? 'light' : 'dark';
  state.theme = newTheme;
  document.documentElement.dataset.theme = newTheme;
  const icon = document.getElementById('brand-header-icon');
  if (icon) {
    icon.src = getIconSrc(newTheme);
  }
  await saveTheme(newTheme);
  render();
}

async function openInSidebar() {
  if (typeof chrome === 'undefined' || !chrome.sidePanel?.open) {
    alert('Sidebar is only supported in Chromium browsers with Side Panel support.');
    return;
  }
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId) {
      await chrome.sidePanel.open({ windowId: tab.windowId });
      window.close();
    }
  } catch (err) {
    console.warn('[FastFiller] Error opening side panel:', err);
  }
}

function createAuthorAttributionRow() {
  const authorRow = el('div', { className: 'author-attribution-row' },
    el('span', { className: 'attr-text' }, 'Crafted with ❤️ by '),
    el('a', {
      href: 'https://www.linkedin.com/in/ankur-maurya1/',
      target: '_blank',
      rel: 'noopener noreferrer',
      className: 'attr-link',
      title: 'Maurya Ankur on LinkedIn',
      textContent: 'Maurya Ankur'
    }),
    el('span', { className: 'attr-sep' }, ' & '),
    el('a', {
      href: 'https://www.linkedin.com/in/sanjiv-singh/',
      target: '_blank',
      rel: 'noopener noreferrer',
      className: 'attr-link',
      title: 'Singh Sanjiv on LinkedIn',
      textContent: 'Singh Sanjiv'
    }),
    el('span', { className: 'attr-dot' }, ' • '),
    el('a', {
      href: 'https://aeigs.com',
      target: '_blank',
      rel: 'noopener noreferrer',
      className: 'attr-link attr-brand',
      title: 'Visit aeigs.com',
      textContent: 'aeigs.com'
    })
  );
  return authorRow;
}

// ──────────────────────────────────────────
// MAIN VIEW RENDERER
// ──────────────────────────────────────────

function renderMainView() {
  const container = el('div', { className: 'main-view-container', style: 'display: flex; flex-direction: column; flex: 1; min-height: 0;' });

  // 1. Header with [Icon] Fast Filler
  const iconSrc = getIconSrc(state.theme);
  const header = el('div', { className: 'header-row' },
    el('div', { className: 'brand-group' },
      el('img', {
        id: 'brand-header-icon',
        src: iconSrc,
        alt: 'Fast Filler Icon',
        className: 'brand-icon'
      }),
      el('div', { className: 'brand-title' },
        el('span', { className: 'brand-wordmark' },
          el('span', { className: 'brand-text-fast', textContent: 'Fast' }),
          el('span', { className: 'brand-text-filler', textContent: 'Filler' })
        ),
        el('span', { className: 'brand-badge', textContent: isRunningInSidePanel ? 'SIDEBAR' : 'POPUP' })
      )
    ),
    el('div', { className: 'header-actions' },
      el('button', {
        type: 'button',
        className: 'icon-btn',
        title: state.theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        innerHTML: state.theme === 'dark' ? ICONS.SUN : ICONS.MOON,
        onClick: toggleTheme
      }),
      el('button', {
        type: 'button',
        className: `icon-btn ${isRunningInSidePanel ? 'active' : ''}`,
        title: isRunningInSidePanel
          ? 'Switch default view to Popup Window'
          : 'Switch default view to Side Panel',
        innerHTML: isRunningInSidePanel ? ICONS.POPUP : ICONS.SIDEBAR,
        onClick: async () => {
          if (isRunningInSidePanel) {
            await saveDefaultView('popup');
            state.defaultView = 'popup';
            state.fillFeedback = {
              type: 'success',
              text: 'Default view changed to Popup Window. Click the Fastfiller icon in your toolbar to open as popup.'
            };
            render();
          } else {
            await saveDefaultView('sidepanel');
            state.defaultView = 'sidepanel';
            await openInSidebar();
          }
        }
      }),
      el('button', {
        type: 'button',
        className: 'icon-btn',
        title: 'User Guide & Architecture',
        innerHTML: ICONS.HELP,
        onClick: () => {
          chrome.tabs.create({ url: chrome.runtime.getURL('src/help/index.html') });
        }
      }),
      el('button', {
        type: 'button',
        className: 'icon-btn',
        title: 'Settings & AI Engine',
        innerHTML: ICONS.GEAR,
        onClick: () => {
          flushPendingSave();
          state.view = 'settings';
          state.selectedSettingsProvider = state.config.activeProvider || 'chatgpt_web';
          state.testState = { loading: false, result: null };
          render();
        }
      })
    )
  );
  container.appendChild(header);

  // 1b. In-App Update Notification Banner (if newer version available)
  if (state.updateInfo && state.updateInfo.updateAvailable) {
    const banner = el('div', { className: 'update-alert-banner' },
      el('div', { className: 'update-alert-content' },
        el('span', { className: 'update-alert-icon', textContent: '🚀' }),
        el('div', { className: 'update-alert-text' },
          el('strong', { textContent: `Update Available: v${state.updateInfo.latestVersion}` }),
          el('span', { textContent: `New version ready (Current: v${state.updateInfo.currentVersion})` })
        )
      ),
      el('div', { className: 'update-alert-actions' },
        el('button', {
          type: 'button',
          className: 'btn-update-download',
          textContent: 'Download',
          onClick: (e) => {
            e.stopPropagation();
            if (state.updateInfo.releaseUrl && typeof chrome !== 'undefined' && chrome.tabs?.create) {
              chrome.tabs.create({ url: state.updateInfo.releaseUrl });
            }
          }
        }),
        el('button', {
          type: 'button',
          className: 'btn-update-dismiss',
          title: 'Dismiss update notice',
          innerHTML: ICONS.CROSS,
          onClick: async (e) => {
            e.stopPropagation();
            await dismissUpdate(state.updateInfo.latestVersion);
            state.updateInfo.updateAvailable = false;
            render();
          }
        })
      )
    );
    container.appendChild(banner);
  }

  // 2. Active Provider Status Bar
  const activeProvKey = state.config.activeProvider || 'chatgpt_web';
  const activeProvConfig = (state.config.providers && state.config.providers[activeProvKey]) || {};
  const activeReg = PROVIDERS_REGISTRY[activeProvKey] || PROVIDERS_REGISTRY.chatgpt_web || Object.values(PROVIDERS_REGISTRY)[0];
  const isKeyReady = activeReg.format === 'web_session'
    ? Boolean(activeProvConfig.lastTestedSuccess)
    : Boolean(activeProvConfig.apiKey?.trim());

  let activeEngineTitle = activeReg.name;
  let activeModelSubtitle = `· ${activeProvConfig.model || activeReg.defaultModel}`;

  if (activeReg.format === 'web_session') {
    const curEngId = activeProvConfig.engine || (activeProvConfig.model && activeProvConfig.model !== 'chatgpt-web-session' ? activeProvConfig.model : 'chatgpt');
    const curEngMeta = (typeof WEB_SESSION_SUB_ENGINES !== 'undefined' ? WEB_SESSION_SUB_ENGINES.find(e => e.id === curEngId) : null) || { name: 'ChatGPT Web', shortName: 'ChatGPT' };
    activeEngineTitle = 'Web Session AI';
    activeModelSubtitle = `· ${curEngMeta.name}`;
  }

  const providerBar = el('div', {
    className: 'provider-status-bar',
    title: 'Active AI Engine — Click to switch or configure',
    onClick: () => {
      flushPendingSave();
      state.view = 'settings';
      state.selectedSettingsProvider = activeProvKey;
      render();
    }
  },
    el('div', { className: 'provider-status-left' },
      el('span', { className: `status-dot ${isKeyReady ? 'ready' : 'untested'}` }),
      el('span', { className: 'provider-name-text', textContent: activeEngineTitle }),
      el('span', { className: 'provider-model-text', textContent: activeModelSubtitle })
    ),
    el('span', { className: 'provider-switch-hint' }, 'Switch ▾')
  );
  container.appendChild(providerBar);

  // 3. Page Field Scanner & Re-scan Trigger
  const fillableFields = state.detectedFields.filter((f) => f.isVisible !== false && !f.isRadioGroupSecondary);
  const count = fillableFields.length;
  let badgeEl;

  if (state.isScanning) {
    badgeEl = el('span', {
      className: 'scanner-badge scanning',
      title: 'Detecting form inputs on active tab...',
      innerHTML: `${ICONS.SEARCH} Scanning page...`
    });
  } else if (count > 0) {
    badgeEl = el('span', {
      className: 'scanner-badge ready',
      title: 'Click to inspect detected form fields',
      innerHTML: `${ICONS.TARGET} ${count} ${count === 1 ? 'field' : 'fields'} detected · Inspect`,
      onClick: () => {
        state.showInspector = true;
        render();
      }
    });
  } else {
    badgeEl = el('span', {
      className: 'scanner-badge empty',
      title: 'Click to re-scan page',
      innerHTML: `${ICONS.TARGET} No fields detected`,
      onClick: () => scanPageFields()
    });
  }

  const rescanBtn = el('button', {
    type: 'button',
    className: 'rescan-action-btn',
    title: 'Re-scan page for dynamic forms (SPA)',
    innerHTML: `${ICONS.REFRESH} Re-scan`,
    onClick: () => scanPageFields()
  });

  container.appendChild(el('div', { className: 'scanner-badge-container' }, badgeEl, rescanBtn));

  // 4. Template / Profile Bar
  const tplSelect = el('select', {
    id: 'main-tpl-select',
    className: 'template-select',
    value: state.activeTemplateId,
    onChange: (e) => {
      flushPendingSave();
      state.activeTemplateId = e.target.value;
      const tpl = state.templates.find((t) => t.id === state.activeTemplateId);
      state.currentText = tpl?.content || '';
      state.confirmDeleteId = null;
      state.fillFeedback = null;
      setActiveTemplateId(state.activeTemplateId);
      render();
    }
  });

  state.templates.forEach((t) => {
    const opt = el('option', { value: t.id, textContent: t.name });
    if (t.id === state.activeTemplateId) opt.selected = true;
    tplSelect.appendChild(opt);
  });

  const tplBar = el('div', { className: 'template-bar' },
    tplSelect,
    el('button', {
      type: 'button',
      className: 'template-action-btn',
      title: 'Manage profiles (Create, Duplicate, Rename, Import, Export)',
      innerHTML: `${ICONS.FOLDER} Manage Profiles`,
      onClick: () => {
        flushPendingSave();
        state.showTemplateManager = true;
        render();
      }
    })
  );
  container.appendChild(tplBar);

  // 5. Information Textarea Box
  const charCount = state.currentText.length;
  const estimatedTokens = Math.round(charCount / 4);

  const textareaBox = el('div', { className: 'textarea-wrapper' },
    el('textarea', {
      className: 'info-textarea',
      placeholder: 'Paste your information in any format (resume, bio, shipping details, or raw text)...\n\nExample:\nName: Alex Morgan\nEmail: alex@example.com\nPhone: +1 555 234 5678\nAddress: 742 Evergreen Terrace, Springfield, OR',
      value: state.currentText,
      disabled: state.isFilling,
      onInput: (e) => {
        handleTextChange(e.target.value);
        const pill = document.getElementById('token-pill-display');
        if (pill) {
          pill.textContent = `~${Math.round(state.currentText.length / 4)} tokens (${state.currentText.length} chars)`;
        }
      },
      onBlur: () => {
        flushPendingSave();
      }
    }),
    el('div', { className: 'textarea-footer' },
      el('div', { style: 'display: flex; align-items: center; gap: 8px;' },
        el('span', {
          id: 'token-pill-display',
          className: 'token-pill',
          textContent: `~${estimatedTokens} tokens (${charCount} chars)`
        }),
        el('span', {
          id: 'save-status-display',
          className: `save-status-pill ${state.saveStatus}`,
          innerHTML: state.saveStatus === 'saved' ? `${ICONS.CHECK} Saved` : `${ICONS.REFRESH} Saving...`
        })
      ),
      el('span', {
        id: 'clear-text-btn',
        className: 'clear-text-btn',
        style: state.currentText.trim() ? '' : 'display: none;',
        textContent: 'Clear',
        onClick: () => {
          handleTextChange('');
          const ta = document.querySelector('.info-textarea');
          if (ta) {
            ta.value = '';
            ta.focus();
          }
          const pill = document.getElementById('token-pill-display');
          if (pill) {
            pill.textContent = '~0 tokens (0 chars)';
          }
        }
      })
    )
  );
  container.appendChild(textareaBox);

  // 6. Multi-Stage Informative Loader (Clean real-time telemetry, zero duplicate buttons)
  if (state.isFilling) {
    const stageNum = state.fillStage || 1;
    const stagePercent = stageNum === 1 ? '30%' : stageNum === 2 ? '68%' : '96%';
    const activeProvKey = state.config.activeProvider || 'chatgpt_web';
    const regName = PROVIDERS_REGISTRY[activeProvKey]?.name || 'AI Engine';

    const progressCard = el('div', { className: 'fill-progress-card' },
      // Header: Stage Title & Live Elapsed Counter Badge
      el('div', { className: 'fill-progress-header' },
        el('div', { className: 'fill-progress-title' },
          el('div', { className: 'fill-progress-spinner' }),
          el('span', {
            className: 'fill-progress-title-text',
            textContent: state.fillStepText || 'Processing form fields...'
          })
        ),
        el('span', {
          id: 'fill-elapsed-badge',
          className: 'fill-progress-badge',
          textContent: `⏱ ${state.fillElapsedText || '0.0s'}`
        })
      ),
      // Progress Bar
      el('div', { className: 'fill-stage-track' },
        el('div', { className: 'fill-stage-bar', style: `width: ${stagePercent};` })
      ),
      // Stage Stepper Checklist
      el('div', { className: 'fill-stage-steps' },
        el('div', { className: `fill-stage-step ${stageNum > 1 ? 'completed' : stageNum === 1 ? 'active' : ''}` },
          el('span', { className: 'fill-stage-step-dot' }),
          el('span', { textContent: '1. Scan' })
        ),
        el('div', { className: `fill-stage-step ${stageNum > 2 ? 'completed' : stageNum === 2 ? 'active' : ''}` },
          el('span', { className: 'fill-stage-step-dot' }),
          el('span', { textContent: `2. AI (${regName})` })
        ),
        el('div', { className: `fill-stage-step ${stageNum === 3 ? 'active' : ''}` },
          el('span', { className: 'fill-stage-step-dot' }),
          el('span', { textContent: '3. Inject' })
        )
      )
    );
    container.appendChild(progressCard);
  }

  // 7. Alert / Feedback Card with Actionable Recovery Chips
  if (state.fillFeedback && !state.isFilling) {
    const feedbackCard = el('div', {
      className: `alert-card ${state.fillFeedback.type}`,
      style: 'display: flex; flex-direction: column; align-items: stretch; gap: 8px;'
    },
      el('div', { style: 'display: flex; align-items: flex-start; justify-content: space-between; gap: 8px;' },
        el('span', { style: 'flex: 1; font-size: 11.5px; line-height: 1.4;', textContent: state.fillFeedback.text }),
        el('button', {
          type: 'button',
          className: 'alert-dismiss',
          innerHTML: ICONS.CROSS,
          onClick: () => { state.fillFeedback = null; render(); }
        })
      )
    );

    if (state.fillFeedback.actions && state.fillFeedback.actions.length > 0) {
      const chipsContainer = el('div', { className: 'alert-action-chips' },
        ...state.fillFeedback.actions.map((act) => el('button', {
          type: 'button',
          className: `alert-action-chip ${act.primary ? 'primary' : ''}`,
          textContent: act.label,
          onClick: async () => {
            if (act.onClick) await act.onClick();
          }
        }))
      );
      feedbackCard.appendChild(chipsContainer);
    }

    container.appendChild(feedbackCard);
  }

  // 8. Primary Fill & Stop Action Row
  if (state.isFilling) {
    // Single Prominent Stop Button - directly under user's cursor!
    const stopBtn = el('button', {
      type: 'button',
      className: 'fill-btn stop-action',
      style: 'width: 100%;',
      title: 'Stop auto-fill immediately (or press Esc)',
      onClick: stopAutoFill
    },
      el('span', { style: 'font-size: 13px; line-height: 1;' }, '⏹'),
      el('span', { textContent: 'Stop Auto-fill' })
    );
    container.appendChild(stopBtn);
  } else {
    const canFill = state.currentText.trim().length > 0;

    const dryRunToggle = el('label', {
      style: 'display: inline-flex; align-items: center; gap: 8px; font-size: 11px; color: var(--text-secondary); cursor: pointer; margin-bottom: 8px; user-select: none;'
    },
      el('input', {
        type: 'checkbox',
        checked: state.dryRunMode,
        style: 'accent-color: #d900ff; width: 14px; height: 14px; cursor: pointer;',
        onChange: (e) => {
          state.dryRunMode = e.target.checked;
        }
      }),
      el('span', { textContent: 'Review mapped values before injecting into webpage' })
    );
    container.appendChild(dryRunToggle);

    const fillBtn = el('button', {
      type: 'button',
      id: 'main-fill-btn',
      className: 'fill-btn',
      style: state.canUndo ? 'flex: 1;' : 'width: 100%;',
      disabled: !canFill,
      onClick: executeFormFill
    },
      el('span', { innerHTML: `${ICONS.ZAP} Auto-fill Web Form` })
    );

    if (state.canUndo) {
      const undoBtn = el('button', {
        type: 'button',
        className: 'undo-action-btn',
        title: 'Undo last form fill and restore original field values',
        innerHTML: '↺ Undo',
        onClick: executeUndoFill
      });
      container.appendChild(el('div', { style: 'display: flex; align-items: center; gap: 8px; width: 100%;' }, fillBtn, undoBtn));
    } else {
      container.appendChild(fillBtn);
    }
  }

  // 9. Footer Shortcuts
  const footer = el('div', { className: 'footer-row' },
    state.isFilling
      ? el('span', { className: 'shortcut-hint' },
          'Press ',
          el('span', { className: 'kbd', textContent: 'Esc' }),
          ' to stop immediately'
        )
      : el('span', { className: 'shortcut-hint' },
          'Press ',
          el('span', { className: 'kbd', textContent: 'Ctrl' }),
          ' + ',
          el('span', { className: 'kbd', textContent: 'Enter' }),
          ' to fill'
        ),
    el('span', {
      style: 'cursor: pointer; display: flex; align-items: center; gap: 4px;',
      innerHTML: `${ICONS.SHIELD} Local & Private`,
      title: 'Fastfiller runs strictly client-side. Your data never touches external servers.',
      onClick: () => {
        chrome.tabs.create({ url: chrome.runtime.getURL('src/help/index.html') });
      }
    })
  );
  container.appendChild(footer);
  container.appendChild(createAuthorAttributionRow());

  // 10. Drawers & Modals
  if (state.showDryRunDrawer) {
    container.appendChild(renderDryRunDrawer());
  } else {
    document.body.classList.remove('dry-run-fullscreen-active');
  }
  if (state.showSkippedDrawer) {
    container.appendChild(renderSkippedFieldsDrawer());
  }
  if (state.showInspector) {
    document.body.classList.add('field-inspector-open');
    container.appendChild(renderFieldInspectorDrawer());
  } else {
    document.body.classList.remove('field-inspector-open');
  }
  if (state.showTemplateManager) {
    container.appendChild(renderTemplateManagerDrawer());
  }
  if (state.modalDialog) {
    const dialogOverlay = renderModalDialog();
    dialogOverlay.id = 'profile-modal-dialog-overlay';
    container.appendChild(dialogOverlay);
  }

  return container;
}

// ──────────────────────────────────────────
// PRE-FILL DRY-RUN REVIEW DRAWER
// ──────────────────────────────────────────

function renderDryRunDrawer() {
  const closeDryRun = () => {
    state.showDryRunDrawer = false;
    state.dryRunFullScreen = false;
    document.body.classList.remove('dry-run-fullscreen-active');
    render();
  };

  const backdrop = el('div', {
    className: 'drawer-backdrop',
    onClick: closeDryRun
  });

  const listContainer = el('div', {
    className: 'drawer-list',
    style: state.dryRunFullScreen
      ? 'flex: 1 1 0%; min-height: 0; max-height: none; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;'
      : 'max-height: 290px; display: flex; flex-direction: column; gap: 8px;'
  });

  const entries = Object.entries(state.stagedFillValues);
  const rowBindings = [];

  const getCheckedCount = () => Object.values(state.stagedFillValues).filter((i) => i.checked).length;
  const initialCheckedCount = getCheckedCount();

  const countSpan = el('span', {
    style: 'font-size: 11px; font-weight: 500; color: var(--text-muted);',
    textContent: `(${initialCheckedCount} of ${entries.length} selected)`
  });

  const selectAllBtn = el('button', {
    type: 'button',
    className: 'card-action-btn',
    style: 'padding: 2px 8px; font-size: 10.5px;',
    textContent: (initialCheckedCount === entries.length && entries.length > 0) ? 'Deselect All' : 'Select All',
    onClick: () => {
      const curCount = getCheckedCount();
      const targetState = curCount !== entries.length;
      rowBindings.forEach(({ item, checkboxEl, textInputEl, itemRow }) => {
        item.checked = targetState;
        checkboxEl.checked = targetState;
        textInputEl.disabled = !targetState;
        itemRow.style.opacity = targetState ? '1' : '0.6';
      });
      updateCountsAndButtons();
    }
  });

  const selectAllBar = el('div', {
    className: 'dryrun-select-all-bar',
    style: 'display: flex; align-items: center; justify-content: space-between; padding: 4px 2px 8px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 8px; font-size: 11px;'
  },
    el('span', { style: 'color: var(--text-muted);', textContent: 'Uncheck any fields you wish to skip.' }),
    selectAllBtn
  );

  const confirmBtn = el('button', {
    type: 'button',
    className: 'fill-btn',
    style: 'width: auto; padding: 0 16px; height: 34px; font-size: 12px;',
    disabled: initialCheckedCount === 0,
    innerHTML: `${ICONS.CHECK} Confirm & Inject (${initialCheckedCount})`,
    onClick: () => {
      document.body.classList.remove('dry-run-fullscreen-active');
      state.dryRunFullScreen = false;
      confirmAndDispatchStagedFill();
    }
  });

  const footer = el('div', {
    className: 'dryrun-footer',
    style: 'display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-subtle); gap: 8px;'
  },
    el('button', {
      type: 'button',
      className: 'template-action-btn',
      textContent: 'Cancel',
      onClick: closeDryRun
    }),
    confirmBtn
  );

  const updateCountsAndButtons = () => {
    const curCount = getCheckedCount();
    countSpan.textContent = `(${curCount} of ${entries.length} selected)`;
    selectAllBtn.textContent = (curCount === entries.length && entries.length > 0) ? 'Deselect All' : 'Select All';
    confirmBtn.disabled = curCount === 0;
    confirmBtn.innerHTML = `${ICONS.CHECK} Confirm & Inject (${curCount})`;
  };

  if (entries.length === 0) {
    listContainer.appendChild(el('div', {
      style: 'text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 12px;',
      textContent: 'No fillable fields staged.'
    }));
  } else {
    entries.forEach(([classKey, item]) => {
      const isChecked = Boolean(item.checked);

      const checkboxEl = el('input', {
        type: 'checkbox',
        checked: isChecked,
        onChange: (e) => {
          item.checked = e.target.checked;
          textInputEl.disabled = !item.checked;
          itemRow.style.opacity = item.checked ? '1' : '0.6';
          updateCountsAndButtons();
        }
      });

      const textInputEl = el('input', {
        type: 'text',
        className: 'form-input',
        style: 'font-size: 11.5px; padding: 4px 8px;',
        value: item.value,
        disabled: !isChecked,
        onInput: (e) => {
          item.value = e.target.value;
        }
      });

      const itemRow = el('div', {
        className: 'drawer-item',
        style: `display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: var(--radius-md); background: var(--bg-surface); border: 1px solid var(--border-subtle); opacity: ${isChecked ? '1' : '0.6'}; transition: opacity 120ms ease;`
      },
        el('div', { style: 'display: flex; align-items: center; justify-content: space-between; gap: 8px;' },
          el('label', { style: 'display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1; min-width: 0;' },
            checkboxEl,
            el('span', {
              style: 'font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
              title: item.label,
              textContent: item.label
            })
          ),
          el('span', { className: 'drawer-item-type', textContent: item.type })
        ),
        textInputEl
      );

      rowBindings.push({ item, checkboxEl, textInputEl, itemRow });
      listContainer.appendChild(itemRow);
    });
  }

  const fullscreenBtn = el('button', {
    id: 'dryrun-fullscreen-btn',
    type: 'button',
    className: `icon-btn ${state.dryRunFullScreen ? 'active' : ''}`,
    title: state.dryRunFullScreen ? 'Exit Full Screen (Esc)' : 'Full Screen',
    innerHTML: state.dryRunFullScreen ? ICONS.MINIMIZE : ICONS.MAXIMIZE,
    onClick: () => {
      state.dryRunFullScreen = !state.dryRunFullScreen;
      applyFullScreenState();
    }
  });

  const drawer = el('div', {
    id: 'dryrun-drawer-panel',
    className: `drawer-panel ${state.dryRunFullScreen ? 'dryrun-fullscreen' : ''}`,
    style: state.dryRunFullScreen ? 'height: 100%; max-height: 100%;' : 'max-height: 90%;'
  },
    el('div', { className: 'drawer-header' },
      el('div', {
        className: 'drawer-title',
        style: 'display: flex; align-items: center; gap: 6px;',
        innerHTML: `${ICONS.CHECK} Pre-Fill Field Review `
      }, countSpan),
      el('div', { style: 'display: flex; align-items: center; gap: 4px;' },
        fullscreenBtn,
        el('button', {
          type: 'button',
          className: 'icon-btn',
          title: 'Close (Esc)',
          innerHTML: ICONS.CROSS,
          onClick: closeDryRun
        })
      )
    ),
    selectAllBar,
    listContainer,
    footer
  );

  const applyFullScreenState = () => {
    document.body.classList.toggle('dry-run-fullscreen-active', state.dryRunFullScreen);
    drawer.classList.toggle('dryrun-fullscreen', state.dryRunFullScreen);
    fullscreenBtn.innerHTML = state.dryRunFullScreen ? ICONS.MINIMIZE : ICONS.MAXIMIZE;
    fullscreenBtn.title = state.dryRunFullScreen ? 'Exit Full Screen (Esc)' : 'Full Screen';
    fullscreenBtn.classList.toggle('active', state.dryRunFullScreen);

    if (state.dryRunFullScreen) {
      drawer.style.height = '100%';
      drawer.style.maxHeight = '100%';
      listContainer.style.maxHeight = 'none';
      listContainer.style.flex = '1 1 0%';
    } else {
      drawer.style.height = '';
      drawer.style.maxHeight = '90%';
      listContainer.style.maxHeight = '290px';
      listContainer.style.flex = '';
    }
  };

  if (state.dryRunFullScreen) {
    document.body.classList.add('dry-run-fullscreen-active');
  } else {
    document.body.classList.remove('dry-run-fullscreen-active');
  }

  const wrapper = el('div', {});
  wrapper.appendChild(backdrop);
  wrapper.appendChild(drawer);
  return wrapper;
}

// ──────────────────────────────────────────
// SKIPPED & PENDING FIELDS DRAWER
// ──────────────────────────────────────────

function renderSkippedFieldsDrawer() {
  const closeSkipped = () => {
    state.showSkippedDrawer = false;
    render();
  };

  const backdrop = el('div', {
    className: 'drawer-backdrop',
    onClick: closeSkipped
  });

  const listContainer = el('div', {
    className: 'drawer-list',
    style: 'max-height: 320px; overflow-y: auto; display: flex; flex-direction: column; gap: 8px;'
  });

  if (!state.skippedFields || state.skippedFields.length === 0) {
    listContainer.appendChild(el('div', {
      style: 'text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 12px;',
      textContent: 'No skipped or pending fields.'
    }));
  } else {
    state.skippedFields.forEach((item) => {
      const textInputEl = el('input', {
        type: 'text',
        className: 'form-input',
        style: 'font-size: 11.5px; padding: 4px 8px;',
        value: item.value || '',
        placeholder: 'Enter or adjust value to inject...',
        onInput: (e) => {
          item.value = e.target.value;
        }
      });

      const locateBtn = el('button', {
        type: 'button',
        className: 'card-action-btn',
        style: 'padding: 2px 7px; font-size: 10px; display: inline-flex; align-items: center; gap: 4px;',
        title: 'Highlight and scroll to this field on the active webpage',
        innerHTML: `${ICONS.TARGET} Locate`,
        onClick: async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, {
              type: 'HIGHLIGHT_FIELD',
              classKey: item.classKey,
              fieldMeta: item.fieldMeta
            });
          }
        }
      });

      const card = el('div', {
        className: 'drawer-item',
        style: 'display: flex; flex-direction: column; gap: 6px; padding: 10px; border-radius: var(--radius-md); background: var(--bg-surface); border: 1px solid var(--border-subtle);'
      },
        el('div', { style: 'display: flex; align-items: center; justify-content: space-between; gap: 8px;' },
          el('div', { style: 'display: flex; align-items: center; gap: 6px; flex: 1; min-width: 0;' },
            el('span', {
              style: 'font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;',
              title: item.label,
              textContent: item.label
            }),
            el('span', { className: 'drawer-item-type', textContent: item.type })
          ),
          locateBtn
        ),
        el('div', {
          style: 'font-size: 10.5px; color: var(--accent-orange, #f59e0b); display: flex; align-items: center; gap: 4px;'
        },
          el('span', { textContent: `⚠️ ${item.reason}` })
        ),
        textInputEl
      );

      listContainer.appendChild(card);
    });
  }

  const footer = el('div', {
    className: 'dryrun-footer',
    style: 'display: flex; align-items: center; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 1px solid var(--border-subtle); gap: 8px;'
  },
    el('button', {
      type: 'button',
      className: 'template-action-btn',
      textContent: 'Close',
      onClick: closeSkipped
    }),
    el('button', {
      type: 'button',
      className: 'fill-btn',
      style: 'width: auto; padding: 0 16px; height: 34px; font-size: 12px;',
      disabled: !state.skippedFields || state.skippedFields.length === 0,
      innerHTML: `${ICONS.ZAP} Retry Skipped Fields (${state.skippedFields?.length || 0})`,
      onClick: retrySkippedFields
    })
  );

  const drawer = el('div', {
    className: 'drawer-panel',
    style: 'max-height: 85%; display: flex; flex-direction: column;'
  },
    el('div', { className: 'drawer-header' },
      el('div', {
        className: 'drawer-title',
        style: 'display: flex; align-items: center; gap: 6px;',
        textContent: `Skipped & Pending Fields (${state.skippedFields?.length || 0})`
      }),
      el('button', {
        type: 'button',
        className: 'icon-btn',
        title: 'Close (Esc)',
        innerHTML: ICONS.CROSS,
        onClick: closeSkipped
      })
    ),
    el('div', {
      style: 'padding: 4px 2px 8px; border-bottom: 1px solid var(--border-subtle); margin-bottom: 8px; font-size: 11px; color: var(--text-muted);'
    },
      el('span', { textContent: 'Fields that were skipped, unselected, or waiting on dependent options. Adjust values or retry below.' })
    ),
    listContainer,
    footer
  );

  const wrapper = el('div', {});
  wrapper.appendChild(backdrop);
  wrapper.appendChild(drawer);
  return wrapper;
}

// ──────────────────────────────────────────
// TEMPLATE MANAGER DRAWER (Complete CRUD & Search)
// ──────────────────────────────────────────

function closeTemplateManagerDrawer() {
  state.showTemplateManager = false;
  state.confirmDeleteId = null;
  render();
}

function openProfileModalDialog(modalData) {
  state.modalDialog = modalData;
  const existing = document.getElementById('profile-modal-dialog-overlay');
  if (existing) existing.remove();
  const overlay = renderModalDialog();
  overlay.id = 'profile-modal-dialog-overlay';
  const root = document.getElementById('app');
  if (root) {
    root.appendChild(overlay);
  }
}

function closeProfileModalDialog() {
  state.modalDialog = null;
  const existing = document.getElementById('profile-modal-dialog-overlay');
  if (existing) existing.remove();
}

function updateProfileManagerUI() {
  const modal = document.getElementById('profile-manager-modal');
  if (!modal) {
    render();
    return;
  }
  const titleEl = document.getElementById('profile-manager-title');
  if (titleEl) {
    titleEl.innerHTML = `${ICONS.FOLDER} Manage Fill Profiles (${state.templates.length})`;
  }
  const listContainer = document.getElementById('profile-list-container');
  if (listContainer) {
    renderProfileCards(listContainer);
  }
  updateMainViewProfileSelect();
}

function renderProfileCards(container) {
  if (!container) return;
  const prevScroll = container.scrollTop;
  container.innerHTML = '';

  const q = (state.profileSearchQuery || '').toLowerCase().trim();
  const filteredTemplates = state.templates.filter((tpl) => {
    if (!q) return true;
    return (tpl.name || '').toLowerCase().includes(q) ||
           (tpl.category || '').toLowerCase().includes(q) ||
           (tpl.content || '').toLowerCase().includes(q);
  });

  if (filteredTemplates.length === 0) {
    container.appendChild(el('div', {
      style: 'text-align: center; padding: 24px 16px; color: var(--text-muted); font-size: 12px;',
      textContent: 'No profiles match your filter.'
    }));
  } else {
    filteredTemplates.forEach((tpl) => {
      const isActive = tpl.id === state.activeTemplateId;
      const charLen = (tpl.content || '').length;
      const words = (tpl.content || '').trim().split(/\s+/).filter(Boolean).length;
      const preview = (tpl.content || '').trim().slice(0, 100) || '(Empty profile)';

      const card = el('div', {
        className: `template-card ${isActive ? 'active-profile' : ''}`
      },
        el('div', { className: 'template-card-top' },
          el('div', { className: 'template-card-title' },
            tpl.name,
            isActive ? el('span', { className: 'brand-badge', textContent: 'ACTIVE' }) : null
          ),
          el('span', { className: 'template-card-tag', textContent: tpl.category || 'General' })
        ),
        el('div', { className: 'template-card-preview', textContent: preview }),
        el('div', { className: 'template-card-footer' },
          el('span', { className: 'template-card-meta', textContent: `${charLen} chars · ${words} words` }),
          el('div', { className: 'template-card-actions' },
            !isActive ? el('button', {
              type: 'button',
              className: 'card-action-btn primary',
              textContent: 'Use',
              onClick: () => {
                flushPendingSave();
                state.activeTemplateId = tpl.id;
                state.currentText = tpl.content || '';
                setActiveTemplateId(tpl.id);
                closeTemplateManagerDrawer();
                render();
                updateFillButtonState();
              }
            }) : null,
            el('button', {
              type: 'button',
              className: 'card-action-btn',
              title: 'Rename profile',
              innerHTML: `${ICONS.EDIT} Rename`,
              onClick: () => {
                openProfileModalDialog({ type: 'rename', templateId: tpl.id, nameValue: tpl.name });
              }
            }),
            el('button', {
              type: 'button',
              className: 'card-action-btn',
              title: 'Duplicate profile',
              innerHTML: `${ICONS.COPY} Clone`,
              onClick: async () => {
                flushPendingSave();
                const cloneTpl = {
                  id: `tpl-${Date.now()}`,
                  name: `${tpl.name} (Copy)`,
                  category: tpl.category || 'General',
                  content: tpl.content || '',
                  updatedAt: Date.now()
                };
                state.templates.push(cloneTpl);
                await saveTemplates(state.templates, state.activeTemplateId);
                updateProfileManagerUI();
              }
            }),
            state.confirmDeleteId === tpl.id ? el('div', { style: 'display: inline-flex; align-items: center; gap: 4px;' },
              el('button', {
                type: 'button',
                className: 'card-action-btn danger',
                style: 'background: var(--danger-color, #dc2626); color: #fff; border-color: var(--danger-border, #ef4444); font-weight: 600;',
                title: 'Confirm deletion',
                textContent: 'Sure?',
                onClick: async () => {
                  if (state.templates.length <= 1) return;
                  state.templates = state.templates.filter((t) => t.id !== tpl.id);
                  if (state.activeTemplateId === tpl.id) {
                    state.activeTemplateId = state.templates[0].id;
                    state.currentText = state.templates[0].content || '';
                    setActiveTemplateId(state.activeTemplateId);
                    const ta = document.querySelector('.info-textarea');
                    if (ta) ta.value = state.currentText;
                    updateFillButtonState();
                  }
                  state.confirmDeleteId = null;
                  await saveTemplates(state.templates, state.activeTemplateId);
                  updateProfileManagerUI();
                }
              }),
              el('button', {
                type: 'button',
                className: 'card-action-btn',
                textContent: 'Cancel',
                onClick: () => {
                  state.confirmDeleteId = null;
                  updateProfileManagerUI();
                }
              })
            ) : el('button', {
              type: 'button',
              className: 'card-action-btn danger',
              title: 'Delete profile',
              textContent: 'Delete',
              disabled: state.templates.length <= 1,
              onClick: () => {
                if (state.templates.length <= 1) return;
                state.confirmDeleteId = tpl.id;
                updateProfileManagerUI();
              }
            })
          )
        )
      );
      container.appendChild(card);
    });
  }

  container.scrollTop = prevScroll;
}

function renderTemplateManagerDrawer() {
  const backdrop = el('div', {
    id: 'profile-manager-backdrop',
    className: 'drawer-backdrop',
    onClick: closeTemplateManagerDrawer
  });

  const searchInput = el('input', {
    type: 'text',
    className: 'form-input profile-search-input',
    placeholder: '🔍 Search profiles by name, tag, or content...',
    value: state.profileSearchQuery || '',
    onInput: (e) => {
      state.profileSearchQuery = e.target.value;
      const listContainer = document.getElementById('profile-list-container');
      if (listContainer) {
        renderProfileCards(listContainer);
      }
    }
  });

  const listContainer = el('div', {
    id: 'profile-list-container',
    className: 'profile-list-container'
  });
  renderProfileCards(listContainer);

  // Hidden File Input for JSON Backup Import
  const fileInput = el('input', {
    type: 'file',
    accept: '.json',
    style: 'display: none;',
    onChange: async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const imported = parseImportTemplates(text);
        state.templates.push(...imported);
        await saveTemplates(state.templates, state.activeTemplateId);
        state.fillFeedback = { type: 'success', text: `Imported ${imported.length} profiles successfully.` };
        updateProfileManagerUI();
      } catch (err) {
        state.fillFeedback = { type: 'danger', text: err.message || 'Failed to import JSON file.' };
        render();
      }
    }
  });

  const bottomActions = el('div', { className: 'profile-bottom-actions' },
    el('div', { style: 'display: flex; gap: 4px;' },
      el('button', {
        type: 'button',
        className: 'template-action-btn',
        title: 'Export backup JSON',
        innerHTML: `${ICONS.DOWNLOAD} Export`,
        onClick: () => {
          flushPendingSave();
          const jsonStr = exportTemplatesJSON(state.templates);
          const blob = new Blob([jsonStr], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `fastfiller-profiles-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }),
      el('button', {
        type: 'button',
        className: 'template-action-btn',
        title: 'Import backup JSON',
        innerHTML: `${ICONS.UPLOAD} Import`,
        onClick: () => {
          fileInput.click();
        }
      }),
      el('button', {
        type: 'button',
        className: 'template-action-btn',
        title: 'Reset to default starter templates',
        textContent: 'Reset Defaults',
        onClick: () => {
          openProfileModalDialog({ type: 'confirm_reset' });
        }
      })
    ),
    el('button', {
      type: 'button',
      className: 'fill-btn',
      style: 'height: 30px; font-size: 11.5px; width: auto; padding: 0 14px;',
      textContent: '+ New Profile',
      onClick: () => {
        openProfileModalDialog({ type: 'create', nameValue: '', startOption: 'blank' });
      }
    })
  );

  const modal = el('div', { id: 'profile-manager-modal', className: 'profile-manager-modal' },
    el('div', { className: 'drawer-header' },
      el('div', {
        id: 'profile-manager-title',
        className: 'drawer-title',
        innerHTML: `${ICONS.FOLDER} Manage Fill Profiles (${state.templates.length})`
      }),
      el('button', {
        type: 'button',
        className: 'icon-btn',
        title: 'Close (Esc)',
        innerHTML: ICONS.CROSS,
        onClick: closeTemplateManagerDrawer
      })
    ),
    searchInput,
    listContainer,
    bottomActions,
    fileInput
  );

  const wrapper = el('div', {});
  wrapper.appendChild(backdrop);
  wrapper.appendChild(modal);
  return wrapper;
}

// ──────────────────────────────────────────
// MODAL DIALOGS (Create & Rename)
// ──────────────────────────────────────────

function renderModalDialog() {
  const modalData = state.modalDialog;
  if (!modalData) return el('div');

  const overlay = el('div', { className: 'modal-overlay' });

  if (modalData.type === 'create') {
    const docFileInput = el('input', {
      type: 'file',
      accept: '.txt,.md,.json,.csv,.text',
      style: 'display: none;',
      onChange: async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const text = await file.text();
          modalData.importedContent = text;
          modalData.importedFileName = file.name;
          modalData.startOption = 'file';
          if (!modalData.nameValue.trim()) {
            modalData.nameValue = file.name.replace(/\.[^/.]+$/, '');
          }
          openProfileModalDialog(modalData);
        }
      }
    });

    const dialog = el('div', { className: 'modal-dialog' },
      el('h3', { className: 'modal-title', textContent: 'Create New Profile' }),
      el('p', { className: 'modal-desc', textContent: 'Give your profile a clear name (e.g. Work Resume, Freelance Bio).' }),
      el('input', {
        type: 'text',
        className: 'form-input',
        placeholder: 'Profile name...',
        value: modalData.nameValue,
        autofocus: true,
        onInput: (e) => { modalData.nameValue = e.target.value; },
        onKeyDown: (e) => {
          if (e.key === 'Enter') handleCreateProfile();
          if (e.key === 'Escape') { closeProfileModalDialog(); }
        }
      }),
      el('div', { style: 'margin-top: 10px; display: flex; flex-direction: column; gap: 6px; font-size: 11.5px; color: var(--text-secondary);' },
        el('label', { style: 'display: flex; align-items: center; gap: 6px; cursor: pointer;' },
          el('input', {
            type: 'radio',
            name: 'createOption',
            checked: modalData.startOption === 'blank',
            onChange: () => { modalData.startOption = 'blank'; openProfileModalDialog(modalData); }
          }),
          'Start with empty profile'
        ),
        el('label', { style: 'display: flex; align-items: center; gap: 6px; cursor: pointer;' },
          el('input', {
            type: 'radio',
            name: 'createOption',
            checked: modalData.startOption === 'clone',
            onChange: () => { modalData.startOption = 'clone'; openProfileModalDialog(modalData); }
          }),
          'Copy content from current active profile'
        ),
        el('label', { style: 'display: flex; align-items: center; gap: 6px; cursor: pointer;' },
          el('input', {
            type: 'radio',
            name: 'createOption',
            checked: modalData.startOption === 'file',
            onChange: () => { modalData.startOption = 'file'; docFileInput.click(); }
          }),
          modalData.importedFileName ? `File: ${modalData.importedFileName}` : 'Import from resume / text file (.txt, .md, .json)'
        )
      ),
      docFileInput,
      el('div', { className: 'modal-btn-row' },
        el('button', {
          type: 'button',
          className: 'template-action-btn',
          textContent: 'Cancel',
          onClick: closeProfileModalDialog
        }),
        el('button', {
          type: 'button',
          className: 'fill-btn',
          style: 'height: 32px; width: auto; padding: 0 16px; font-size: 12px;',
          textContent: 'Create Profile',
          onClick: handleCreateProfile
        })
      )
    );
    overlay.appendChild(dialog);
  } else if (modalData.type === 'rename') {
    const dialog = el('div', { className: 'modal-dialog' },
      el('h3', { className: 'modal-title', textContent: 'Rename Profile' }),
      el('input', {
        type: 'text',
        className: 'form-input',
        value: modalData.nameValue,
        autofocus: true,
        onInput: (e) => { modalData.nameValue = e.target.value; },
        onKeyDown: (e) => {
          if (e.key === 'Enter') handleRenameProfile();
          if (e.key === 'Escape') { closeProfileModalDialog(); }
        }
      }),
      el('div', { className: 'modal-btn-row' },
        el('button', {
          type: 'button',
          className: 'template-action-btn',
          textContent: 'Cancel',
          onClick: closeProfileModalDialog
        }),
        el('button', {
          type: 'button',
          className: 'fill-btn',
          style: 'height: 32px; width: auto; padding: 0 16px; font-size: 12px;',
          textContent: 'Save Name',
          onClick: handleRenameProfile
        })
      )
    );
    overlay.appendChild(dialog);
  } else if (modalData.type === 'confirm_reset') {
    const dialog = el('div', { className: 'modal-dialog' },
      el('h3', { className: 'modal-title', textContent: 'Reset to Default Profiles?' }),
      el('p', {
        className: 'modal-desc',
        textContent: 'This will replace your custom profiles with the 3 default starter profiles. A safety backup will be saved automatically.'
      }),
      el('div', { className: 'modal-btn-row' },
        el('button', {
          type: 'button',
          className: 'template-action-btn',
          textContent: 'Cancel',
          onClick: closeProfileModalDialog
        }),
        el('button', {
          type: 'button',
          className: 'fill-btn danger',
          style: 'height: 32px; width: auto; padding: 0 16px; font-size: 12px;',
          textContent: 'Reset Everything',
          onClick: handleConfirmReset
        })
      )
    );
    overlay.appendChild(dialog);
  }

  return overlay;
}

async function handleCreateProfile() {
  const modalData = state.modalDialog;
  if (!modalData) return;
  const name = modalData.nameValue.trim() || 'Untitled Profile';
  let initialContent = '';
  if (modalData.startOption === 'clone') initialContent = state.currentText;
  else if (modalData.startOption === 'file') initialContent = modalData.importedContent || '';

  flushPendingSave();

  const newTpl = {
    id: `tpl-${Date.now()}`,
    name,
    category: modalData.startOption === 'file' ? 'Imported' : 'Custom',
    content: initialContent,
    updatedAt: Date.now()
  };

  state.templates.push(newTpl);
  state.activeTemplateId = newTpl.id;
  state.currentText = newTpl.content;
  state.showTemplateManager = false;
  closeProfileModalDialog();

  await saveTemplates(state.templates, state.activeTemplateId);
  render();
  updateFillButtonState();

  const ta = document.querySelector('.info-textarea');
  if (ta) {
    ta.focus();
  }
}

async function handleRenameProfile() {
  const modalData = state.modalDialog;
  if (!modalData || !modalData.templateId) return;
  const newName = modalData.nameValue.trim();
  if (newName) {
    state.templates = state.templates.map((t) =>
      t.id === modalData.templateId ? { ...t, name: newName } : t
    );
    await saveTemplates(state.templates, state.activeTemplateId);
    updateProfileManagerUI();
  }
  closeProfileModalDialog();
}

async function handleConfirmReset() {
  try {
    localStorage.setItem('fastfiller_backup_before_reset', JSON.stringify(state.templates));
  } catch {}

  state.templates = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
  state.activeTemplateId = state.templates[0].id;
  state.currentText = state.templates[0].content;
  state.confirmDeleteId = null;
  state.showTemplateManager = false;
  closeProfileModalDialog();

  await saveTemplates(state.templates, state.activeTemplateId);
  state.fillFeedback = { type: 'success', text: 'Profiles restored to defaults. Safety backup saved.' };
  render();
  updateFillButtonState();
}

// ──────────────────────────────────────────
// FIELD INSPECTOR DRAWER
// ──────────────────────────────────────────

function renderFieldInspectorDrawer() {
  const closeInspector = () => {
    state.showInspector = false;
    document.body.classList.remove('field-inspector-open');
    render();
  };

  const backdrop = el('div', {
    className: 'drawer-backdrop',
    onClick: closeInspector
  });

  const listContainer = el('div', { className: 'drawer-list' });
  const fillableFields = state.detectedFields.filter((f) => f.isVisible !== false && !f.isRadioGroupSecondary);

  if (fillableFields.length === 0) {
    listContainer.appendChild(el('div', {
      style: 'padding: 24px 16px; text-align: center; color: var(--text-muted); font-size: 13px;',
      textContent: 'No input fields detected on this tab.'
    }));
  } else {
    fillableFields.forEach((field, i) => {
      const name = field.labelText || field.placeholder || field.name || field.id || `Field #${i + 1}`;
      const type = field.type || 'text';
      listContainer.appendChild(el('div', {
        className: 'drawer-item',
        style: 'cursor: pointer;',
        title: `${name} (${type})\nHover or click to highlight on webpage`,
        onClick: async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id && field.class) {
            chrome.tabs.sendMessage(tab.id, { type: 'HIGHLIGHT_FIELD', classKey: field.class });
          }
        },
        onMouseEnter: async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id && field.class) {
            chrome.tabs.sendMessage(tab.id, { type: 'HIGHLIGHT_FIELD', classKey: field.class });
          }
        },
        onMouseLeave: async () => {
          const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { type: 'HIGHLIGHT_FIELD', classKey: null });
          }
        }
      },
        el('span', { className: 'drawer-item-index', textContent: `${i + 1}.` }),
        el('span', { className: 'drawer-item-label', title: name, textContent: name }),
        el('span', { className: 'drawer-item-type', textContent: type })
      ));
    });
  }

  const drawer = el('div', { className: 'drawer-panel field-inspector-drawer' },
    el('div', { className: 'drawer-header' },
      el('div', {
        className: 'drawer-title',
        innerHTML: `${ICONS.TARGET} Detected Fields (${fillableFields.length})`
      }),
      el('button', {
        type: 'button',
        className: 'icon-btn',
        title: 'Close',
        innerHTML: ICONS.CROSS,
        onClick: closeInspector
      })
    ),
    listContainer
  );

  const wrapper = el('div', {});
  wrapper.appendChild(backdrop);
  wrapper.appendChild(drawer);
  return wrapper;
}

// ──────────────────────────────────────────
// SETTINGS VIEW RENDERER
// ──────────────────────────────────────────

function renderSettingsView() {
  const container = el('div', {
    className: 'settings-view-container',
    style: 'display: flex; flex-direction: column; flex: 1; min-height: 0; height: 100%;'
  });

  const extVersion = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) ? ('v' + (chrome.runtime.getManifest()?.version || '1.0.0')) : 'v1.0.0';
  const header = el('div', { className: 'settings-header' },
    el('button', {
      type: 'button',
      className: 'icon-btn',
      title: 'Back to main view',
      innerHTML: ICONS.BACK,
      onClick: () => {
        state.view = 'main';
        state.testState = { loading: false, result: null };
        render();
      }
    }),
    el('h1', { className: 'settings-title', textContent: 'Settings & AI Engine' }),
    el('span', { style: 'font-size: 11px; color: var(--text-muted); font-family: var(--font-mono);', textContent: extVersion })
  );
  container.appendChild(header);

  const tabs = el('div', { className: 'settings-tabs' },
    el('button', {
      type: 'button',
      className: `tab-btn ${state.settingsTab === 'providers' ? 'active' : ''}`,
      textContent: 'AI Engine',
      onClick: () => { state.settingsTab = 'providers'; render(); }
    }),
    el('button', {
      type: 'button',
      className: `tab-btn ${state.settingsTab === 'prompt' ? 'active' : ''}`,
      textContent: 'System Prompt',
      onClick: () => { state.settingsTab = 'prompt'; render(); }
    })
  );
  container.appendChild(tabs);

  if (state.settingsTab === 'prompt') {
    container.appendChild(renderPromptTab());
  } else {
    container.appendChild(renderProvidersTab());
  }

  // Version & Updates Card
  container.appendChild(renderUpdateSettingsSection());

  container.appendChild(createAuthorAttributionRow());

  return container;
}

// ── Update Settings Card Renderer ──
function renderUpdateSettingsSection() {
  const currentVer = getCurrentVersion();
  const isChecking = state.checkingUpdate;
  const updateAvailable = state.updateInfo?.updateAvailable;
  const latestVer = state.updateInfo?.latestVersion || currentVer;

  let statusText = `FastFiller v${currentVer} (Latest: v${latestVer})`;
  if (state.updateCheckFeedback) {
    statusText = state.updateCheckFeedback;
  } else if (isChecking) {
    statusText = 'Checking for updates...';
  } else if (updateAvailable) {
    statusText = `Update available: v${latestVer}`;
  }

  const card = el('div', { className: 'update-settings-card' },
    el('div', { className: 'update-settings-info' },
      el('div', { className: 'update-settings-title' },
        el('span', { innerHTML: ICONS.REFRESH }),
        el('span', { textContent: 'Software Updates' })
      ),
      el('div', {
        className: 'update-settings-status',
        textContent: statusText,
        style: updateAvailable ? 'color: #38bdf8; font-weight: 500;' : ''
      })
    ),
    el('div', { style: 'display: flex; align-items: center; gap: 6px;' },
      updateAvailable ? el('button', {
        type: 'button',
        className: 'btn-update-download',
        textContent: 'Download',
        onClick: () => {
          if (state.updateInfo?.releaseUrl && typeof chrome !== 'undefined' && chrome.tabs?.create) {
            chrome.tabs.create({ url: state.updateInfo.releaseUrl });
          }
        }
      }) : null,
      el('button', {
        type: 'button',
        className: 'btn-check-updates',
        disabled: isChecking,
        textContent: isChecking ? 'Checking...' : 'Check Now',
        onClick: async () => {
          state.checkingUpdate = true;
          state.updateCheckFeedback = null;
          render();
          try {
            const result = await checkForUpdate(true);
            state.checkingUpdate = false;
            state.updateInfo = result;
            if (result.updateAvailable) {
              state.updateCheckFeedback = `New update v${result.latestVersion} found!`;
            } else {
              state.updateCheckFeedback = 'FastFiller is up to date!';
            }
          } catch {
            state.checkingUpdate = false;
            state.updateCheckFeedback = 'Unable to check updates right now.';
          }
          render();
        }
      })
    )
  );

  return card;
}

// ── Providers Tab ──
function renderProvidersTab() {
  const wrapper = el('div', { style: 'display: flex; flex-direction: column;' });

  const grid = el('div', { className: 'provider-cards-grid' });
  const activeKey = state.config.activeProvider;

  Object.entries(PROVIDERS_REGISTRY).forEach(([key, prov]) => {
    const provConfig = state.config.providers[key] || {};
    const isActive = activeKey === key;
    const isSelected = state.selectedSettingsProvider === key;
    let statusText = 'Needs key';
    let statusClass = 'untested';

    if (prov.format === 'web_session') {
      const curEng = provConfig.engine || 'chatgpt';
      const engStatus = provConfig.engineStatus?.[curEng];
      const isCardSelected = state.selectedSettingsProvider === key;
      const testRes = (isCardSelected && state.testState?.result) ? state.testState.result : null;
      if (testRes) {
        statusText = testRes.success ? 'Verified' : 'Disconnected';
        statusClass = testRes.success ? 'ready' : 'untested';
      } else if (engStatus?.verified) {
        statusText = 'Verified';
        statusClass = 'ready';
      } else {
        statusText = 'Direct Session';
        statusClass = 'untested';
      }
    } else {
      const hasKey = Boolean(provConfig.apiKey?.trim());
      statusText = hasKey ? 'Ready' : 'Needs key';
      statusClass = hasKey ? 'ready' : 'untested';
    }

    const card = el('div', {
      className: `provider-card ${isSelected ? 'active' : ''}`,
      onClick: () => {
        state.selectedSettingsProvider = key;
        state.testState = { loading: false, result: null };
        render();
      }
    },
      el('div', { className: 'provider-card-top' },
        el('span', { className: 'provider-card-name', textContent: prov.name }),
        isActive ? el('span', {
          className: 'active-engine-badge',
          textContent: 'ACTIVE'
        }) : null
      ),
      el('div', { style: 'display: flex; align-items: center; justify-content: space-between;' },
        el('span', { className: 'provider-card-badge', textContent: prov.badge }),
        el('span', { className: 'provider-card-status' },
          el('span', { className: `status-dot ${statusClass}` }),
          statusText
        )
      )
    );
    grid.appendChild(card);
  });
  wrapper.appendChild(grid);

  const selKey = state.selectedSettingsProvider;
  const selReg = PROVIDERS_REGISTRY[selKey];
  const selConfig = state.config.providers[selKey] || {};
  const isCurrentActive = activeKey === selKey;

  const detailBox = el('div', { className: 'provider-detail-box' });

  const boxHeader = el('div', {
    style: 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid var(--border-subtle); gap: 12px;'
  },
    el('div', { style: 'flex: 1; min-width: 0;' },
      el('div', { style: 'font-size: 13px; font-weight: 700; color: var(--text-primary);', textContent: selReg.name }),
      el('div', { style: 'font-size: 10.5px; color: var(--text-muted); line-height: 1.35; margin-top: 1px;', textContent: selReg.hint })
    ),
    el('button', {
      type: 'button',
      className: `select-engine-btn ${isCurrentActive ? 'is-active' : ''}`,
      title: isCurrentActive ? `${selReg.name} is active` : `Activate ${selReg.name}`,
      disabled: isCurrentActive,
      onClick: async () => {
        state.config.activeProvider = selKey;
        await saveConfig(state.config);
        render();
      }
    },
      isCurrentActive
        ? el('span', { className: 'select-engine-btn-content' },
            el('span', { className: 'select-engine-btn-icon', innerHTML: ICONS.CHECK }),
            el('span', { textContent: 'Active Engine' })
          )
        : el('span', { className: 'select-engine-btn-content', textContent: 'Use This Engine' })
    )
  );
  detailBox.appendChild(boxHeader);

  if (selReg.format === 'web_session') {
    const curEngId = selConfig.engine || (selConfig.model && selConfig.model !== 'chatgpt-web-session' ? selConfig.model : 'chatgpt');
    const curEngMeta = (typeof WEB_SESSION_SUB_ENGINES !== 'undefined' ? WEB_SESSION_SUB_ENGINES.find(e => e.id === curEngId) : null) || {
      id: 'chatgpt',
      name: 'ChatGPT Web',
      shortName: 'ChatGPT',
      domain: 'chatgpt.com',
      loginUrl: 'https://chatgpt.com',
      title: 'ChatGPT Web Session',
      description: 'FastFiller connects directly to your active browser login at chatgpt.com. No API key, token, or paid subscription required.',
      instruction: 'Keep ChatGPT open and signed in in a browser tab. Form filling runs locally through your existing session.',
      noticeText: 'FastFiller connects directly to your active browser login at chatgpt.com. No API key or paid subscription needed. Simply keep ChatGPT open and signed in in your browser.'
    };

    // Sub-engine selector: ChatGPT Web | DeepSeek Web
    const engineSelectGroup = el('div', { className: 'form-group', style: 'margin-bottom: 10px;' },
      el('div', { className: 'form-label-row' },
        el('label', { className: 'form-label', textContent: 'Select Web Session AI Engine' }),
        el('a', {
          className: 'form-link',
          href: curEngMeta.loginUrl,
          target: '_blank',
          textContent: `Open ${curEngMeta.shortName} ↗`
        })
      ),
      el('div', { className: 'web-engine-chips' },
        ...(typeof WEB_SESSION_SUB_ENGINES !== 'undefined' ? WEB_SESSION_SUB_ENGINES : []).map((eng) => {
          const isSelected = curEngId === eng.id;
          return el('button', {
            type: 'button',
            className: `web-engine-chip ${isSelected ? 'selected' : ''}`,
            title: `Use ${eng.name} (${eng.domain})`,
            onClick: async () => {
              selConfig.engine = eng.id;
              selConfig.model = eng.id;
              selConfig.endpoint = eng.loginUrl;
              state.testState = { loading: false, result: null };
              await saveConfig(state.config);
              render();
            }
          },
            el('div', { className: 'web-engine-chip-header' },
              el('span', { className: 'web-engine-chip-radio' }),
              el('span', { className: 'web-engine-chip-name', textContent: eng.name }),
              el('span', { className: 'web-engine-chip-badge', textContent: 'Free' })
            ),
            el('span', { className: 'web-engine-chip-domain', textContent: eng.domain })
          );
        })
      )
    );
    detailBox.appendChild(engineSelectGroup);

    // Dedicated Web Session Info Card (Zero-Key Direct Browser Connection)
    const webNotice = el('div', { className: 'web-session-info-card' },
      el('div', { className: 'web-session-info-header' },
        el('div', { className: 'web-session-info-title' },
          el('span', { innerHTML: ICONS.CHECK_CIRCLE, style: 'display: inline-flex; align-items: center; color: #10a37f;' }),
          el('span', { textContent: curEngMeta.title || `${curEngMeta.name} Session` })
        ),
        el('span', { className: 'web-session-info-badge', textContent: 'Zero-Key (Free)' })
      ),
      el('p', {
        className: 'web-session-info-desc',
        textContent: curEngMeta.description || curEngMeta.noticeText
      }),
      el('div', { className: 'web-session-info-instruction' },
        el('span', { style: 'color: #38bdf8; font-weight: 600;' }, 'How to use:'),
        el('span', { textContent: curEngMeta.instruction || `Keep ${curEngMeta.domain} open and signed in in your browser.` })
      ),
      el('div', { className: 'web-session-info-footer' },
        el('span', { className: 'web-session-pill' },
          el('span', { className: 'web-session-pill-dot' }),
          el('span', { textContent: curEngMeta.domain })
        ),
        el('span', { className: 'web-session-pill-divider', textContent: '·' }),
        el('span', { className: 'web-session-pill', textContent: '✓ No API Key' }),
        el('span', { className: 'web-session-pill-divider', textContent: '·' }),
        el('span', { className: 'web-session-pill', textContent: '✓ 100% Private & Local' })
      )
    );
    detailBox.appendChild(webNotice);
  }

  if (selKey === 'custom') {
    const customProfiles = state.config.customProviderProfiles || {
      selectedProvider: 'groq',
      profiles: DEFAULT_CUSTOM_PROFILES
    };
    const selectedSubProvider = customProfiles.selectedProvider || 'groq';
    const curProfile = (customProfiles.profiles && customProfiles.profiles[selectedSubProvider])
      || DEFAULT_CUSTOM_PROFILES[selectedSubProvider]
      || DEFAULT_CUSTOM_PROFILES.groq;

    // 1. Unified Provider Selector Dropdown + Badge
    const providerOptions = [
      { id: 'groq', name: 'Groq', badge: 'Ultra Fast · Free Dev Tier' },
      { id: 'openrouter', name: 'OpenRouter', badge: '200+ Models · Free Available' },
      { id: 'gemini', name: 'Google Gemini', badge: '3.5 Flash-Lite · Ultra Fast' },
      { id: 'openai', name: 'OpenAI', badge: 'GPT-4o Mini / o3-mini' },
      { id: 'anthropic', name: 'Anthropic', badge: 'Claude 3.5 / 3.7 Sonnet' },
      { id: 'deepseek', name: 'DeepSeek', badge: 'DeepSeek V3 / R1' },
      { id: 'nvidia', name: 'NVIDIA NIM', badge: 'Llama 3.3 / Free Credits' },
      { id: 'meta', name: 'Meta (Together AI)', badge: 'Llama 3.3 70B' },
      { id: 'ollama', name: 'Ollama (Local)', badge: '100% Free & Private' },
      { id: 'opencode', name: 'OpenCode Free', badge: 'Space Bunny · 100% Zero-Auth Free' },
      { id: 'custom', name: 'Custom (BYOK)', badge: 'Any OpenAI Gateway / Proxy' }
    ];

    const providerSelectGroup = el('div', { className: 'form-group', style: 'margin-bottom: 12px;' },
      el('div', { className: 'form-label-row' },
        el('label', { className: 'form-label', textContent: 'Select API Provider' }),
        el('span', { className: 'provider-badge-pill', textContent: curProfile.badge || 'API' })
      ),
      el('select', {
        className: 'form-select custom-provider-select',
        onChange: async (e) => {
          const newId = e.target.value;
          syncCustomProfile(state.config, newId);
          state.modelFetchState = { loading: false, error: null, successMessage: null };
          state.testState = { loading: false, result: null };
          await saveConfig(state.config);
          render();
        }
      },
        ...providerOptions.map((opt) => {
          const optEl = el('option', {
            value: opt.id,
            textContent: `${opt.name} — ${opt.badge}`
          });
          if (opt.id === selectedSubProvider) optEl.selected = true;
          return optEl;
        })
      )
    );
    detailBox.appendChild(providerSelectGroup);

    // 2. API Endpoint Input (Only shown for Custom BYOK and Ollama local server; locked/hardcoded for official providers)
    const isCustomOrOllama = selectedSubProvider === 'custom' || selectedSubProvider === 'ollama';
    if (isCustomOrOllama) {
      const isEndpointModified = curProfile.defaultEndpoint && curProfile.endpoint && curProfile.endpoint !== curProfile.defaultEndpoint;
      const endpointGroup = el('div', { className: 'form-group' },
        el('div', { className: 'form-label-row' },
          el('label', { className: 'form-label', textContent: selectedSubProvider === 'ollama' ? 'Ollama Server URL' : 'API Endpoint' }),
          isEndpointModified ? el('button', {
            type: 'button',
            className: 'reset-endpoint-btn',
            title: `Reset to default (${curProfile.defaultEndpoint})`,
            textContent: '↺ Reset Default',
            onClick: async () => {
              curProfile.endpoint = curProfile.defaultEndpoint;
              syncCustomProfile(state.config, selectedSubProvider, { endpoint: curProfile.defaultEndpoint });
              await saveConfig(state.config);
              render();
            }
          }) : null
        ),
        el('input', {
          id: 'cfg-api-endpoint',
          type: 'text',
          className: 'form-input',
          placeholder: selectedSubProvider === 'ollama'
            ? 'http://localhost:11434/v1/chat/completions'
            : (selectedSubProvider === 'custom' ? 'https://api.your-provider.com/v1/chat/completions' : (curProfile.defaultEndpoint || 'https://...')),
          value: curProfile.endpoint != null ? curProfile.endpoint : (curProfile.defaultEndpoint || ''),
          onInput: async (e) => {
            const val = e.target.value;
            const changed = val !== curProfile.endpoint;
            curProfile.endpoint = val;
            if (selectedSubProvider === 'custom' && changed) {
              curProfile.cachedModels = [];
            }
            syncCustomProfile(state.config, selectedSubProvider, {
              endpoint: val,
              ...(selectedSubProvider === 'custom' && changed ? { cachedModels: [] } : {})
            });
            await saveConfig(state.config);
          }
        })
      );
      detailBox.appendChild(endpointGroup);
    }

    // 3. API Key Input (With link to get key, show/hide toggle)
    const isZeroAuth = selectedSubProvider === 'opencode';
    const isKeyOptional = isZeroAuth || selectedSubProvider === 'ollama' || (curProfile.endpoint && (curProfile.endpoint.includes('localhost') || curProfile.endpoint.includes('11434') || curProfile.endpoint.includes('20128') || curProfile.endpoint.includes('opencode.ai')));
    const keyLabelText = isZeroAuth
      ? 'API Key (Not Required · Zero-Auth)'
      : (isKeyOptional ? 'API Key (Optional for Free / Local)' : 'API Key (Required)');
    const keyPlaceholderText = isZeroAuth
      ? 'No API key needed (Zero-Auth Free Tier)'
      : (isKeyOptional ? 'Optional (Free models require no key)' : 'sk-...');

    const keyGroup = el('div', { className: 'form-group' },
      el('div', { className: 'form-label-row' },
        el('label', {
          className: 'form-label',
          textContent: keyLabelText
        }),
        isZeroAuth && curProfile.apiKey ? el('button', {
          type: 'button',
          className: 'reset-endpoint-btn',
          title: 'Clear key to ensure zero-auth authentication',
          textContent: '✕ Clear Key',
          onClick: async () => {
            curProfile.apiKey = '';
            syncCustomProfile(state.config, selectedSubProvider, { apiKey: '' });
            await saveConfig(state.config);
            render();
          }
        }) : (curProfile.keyUrl ? el('a', {
          className: 'form-link',
          href: curProfile.keyUrl,
          target: '_blank',
          textContent: 'Get API Key ↗'
        }) : null)
      ),
      el('div', { style: 'display: flex; gap: 6px;' },
        el('input', {
          id: 'cfg-api-key',
          type: state.showApiKey ? 'text' : 'password',
          className: 'form-input',
          style: 'flex: 1;',
          placeholder: keyPlaceholderText,
          value: curProfile.apiKey || '',
          onInput: async (e) => {
            curProfile.apiKey = e.target.value;
            syncCustomProfile(state.config, selectedSubProvider, { apiKey: e.target.value });
            await saveConfig(state.config);
          }
        }),
        el('button', {
          type: 'button',
          className: 'icon-btn',
          style: 'height: 32px; width: 32px; flex-shrink: 0;',
          title: state.showApiKey ? 'Hide Key' : 'Show Key',
          innerHTML: state.showApiKey ? ICONS.EYE_OFF : ICONS.EYE,
          onClick: () => {
            state.showApiKey = !state.showApiKey;
            render();
          }
        })
      ),
      isZeroAuth ? el('div', {
        style: 'font-size: 11px; color: var(--text-muted); margin-top: 4px; line-height: 1.35;'
      }, '💡 OpenCode Free runs without an API key. Leave empty for zero-auth access to space-bunny-free.') : null
    );
    detailBox.appendChild(keyGroup);

    // 4. Model ID Section (Dynamic Fetching, Free Filter, Dropdown, Custom ID entry)
    const isCustomBYOK = selectedSubProvider === 'custom';
    const rawAvailableModels = (Array.isArray(curProfile.cachedModels) && curProfile.cachedModels.length > 0)
      ? curProfile.cachedModels
      : (isCustomBYOK ? [] : (FALLBACK_MODELS_BY_PROVIDER[selectedSubProvider] || []));

    const availableModels = rawAvailableModels.filter((m) => isChatModel(m.id, m.label || ''));

    // If active model is a filtered-out non-chat model (like TTS or nano-banana), auto-fallback to first valid model
    if (!isCustomBYOK && curProfile.model && !isChatModel(curProfile.model) && availableModels.length > 0) {
      curProfile.model = availableModels[0].id;
      syncCustomProfile(state.config, selectedSubProvider, { model: availableModels[0].id });
    }

    const freeModelsList = availableModels.filter((m) => m.isFree);
    const freeCount = freeModelsList.length;
    const hasFreeModels = freeCount > 0;
    const displayedModels = (state.filterFreeModels && hasFreeModels)
      ? freeModelsList
      : availableModels;

    const modelGroup = el('div', { className: 'form-group' },
      el('div', { className: 'form-label-row' },
        el('label', { className: 'form-label', textContent: 'Model ID' }),
        el('div', { style: 'display: flex; align-items: center; gap: 8px;' },
          hasFreeModels ? el('label', { className: 'free-filter-label', title: 'Filter for 100% free models' },
            el('input', {
              type: 'checkbox',
              checked: state.filterFreeModels,
              onChange: async (e) => {
                state.filterFreeModels = e.target.checked;
                if (state.filterFreeModels && freeModelsList.length > 0) {
                  if (!freeModelsList.some((m) => m.id === curProfile.model)) {
                    curProfile.model = freeModelsList[0].id;
                    syncCustomProfile(state.config, selectedSubProvider, { model: freeModelsList[0].id });
                    await saveConfig(state.config);
                  }
                }
                render();
              }
            }),
            el('span', { textContent: `Free Only (${freeCount})` })
          ) : null,
          el('button', {
            type: 'button',
            className: 'fetch-models-btn',
            disabled: state.modelFetchState?.loading,
            title: 'Fetch latest models dynamically from provider API',
            onClick: async () => {
              if (isCustomBYOK && !curProfile.endpoint?.trim()) {
                state.modelFetchState = {
                  loading: false,
                  error: 'Please enter an API Endpoint URL before fetching models.',
                  successMessage: null
                };
                render();
                return;
              }
              state.modelFetchState = { loading: true, error: null, successMessage: null };
              render();
              try {
                const fetched = await fetchProviderModels(selectedSubProvider, curProfile, true);
                curProfile.cachedModels = fetched;
                syncCustomProfile(state.config, selectedSubProvider, { cachedModels: fetched });
                await saveConfig(state.config);
                state.modelFetchState = {
                  loading: false,
                  error: null,
                  successMessage: `Fetched ${fetched.length} models!`
                };
              } catch (err) {
                state.modelFetchState = {
                  loading: false,
                  error: err.message || 'Model discovery failed',
                  successMessage: null
                };
              }
              render();
            }
          },
            el('span', { innerHTML: ICONS.REFRESH, style: state.modelFetchState?.loading ? 'animation: spin 1s linear infinite; display: inline-flex;' : 'display: inline-flex;' }),
            el('span', { textContent: state.modelFetchState?.loading ? 'Fetching...' : 'Fetch Models' })
          )
        )
      ),

      // Notification notices (error or success from fetch)
      state.modelFetchState?.error ? el('div', {
        className: 'model-fetch-notice error',
        textContent: `⚠️ ${state.modelFetchState.error}`
      }) : null,
      state.modelFetchState?.successMessage ? el('div', {
        className: 'model-fetch-notice success',
        textContent: `✓ ${state.modelFetchState.successMessage}`
      }) : null
    );

    // If available models exist, render a clean dropdown selector
    if (displayedModels.length > 0) {
      const selectModel = el('select', {
        className: 'form-select model-select-dropdown',
        style: 'margin-bottom: 6px;',
        onChange: async (e) => {
          const val = e.target.value;
          if (val) {
            curProfile.model = val;
            syncCustomProfile(state.config, selectedSubProvider, { model: val });
            await saveConfig(state.config);
            render();
          }
        }
      },
        el('option', { value: '', textContent: state.filterFreeModels && hasFreeModels ? `Choose from ${displayedModels.length} free models...` : `Choose from ${displayedModels.length} models...` }),
        ...displayedModels.map((m) => {
          const opt = el('option', {
            value: m.id,
            textContent: `${m.isFree ? '[FREE] ' : ''}${m.label || m.id}${m.tag && !m.isFree ? ` (${m.tag})` : ''}`
          });
          if (curProfile.model === m.id) opt.selected = true;
          return opt;
        })
      );
      modelGroup.appendChild(selectModel);
    }

    // Editable text input for direct custom model entry
    const modelTextInput = el('input', {
      id: 'cfg-api-model',
      type: 'text',
      className: 'form-input',
      placeholder: isCustomBYOK
        ? 'Enter model ID (or click Fetch Models)'
        : (curProfile.defaultModel || 'Enter model ID (e.g. llama-3.3-70b-versatile)'),
      value: curProfile.model != null ? curProfile.model : (isCustomBYOK ? '' : (curProfile.defaultModel || '')),
      onInput: async (e) => {
        curProfile.model = e.target.value;
        syncCustomProfile(state.config, selectedSubProvider, { model: e.target.value });
        await saveConfig(state.config);
      }
    });
    modelGroup.appendChild(modelTextInput);

    detailBox.appendChild(modelGroup);
  }

  const curWebMeta = (selReg.format === 'web_session' && typeof WEB_SESSION_SUB_ENGINES !== 'undefined')
    ? (WEB_SESSION_SUB_ENGINES.find(e => e.id === (selConfig.engine || (selConfig.model !== 'chatgpt-web-session' ? selConfig.model : 'chatgpt'))) || WEB_SESSION_SUB_ENGINES[0])
    : null;

  const testBtnLabel = selReg.format === 'web_session'
    ? (state.testState.loading ? `Verifying ${curWebMeta?.name || 'Web Session'}...` : `Check ${curWebMeta?.name || 'Web Session'} Status`)
    : (state.testState.loading ? 'Measuring Roundtrip Latency...' : 'Ping API & Check Latency');

  const testBtn = el('button', {
    id: 'btn-test-connection',
    type: 'button',
    className: 'test-btn',
    disabled: state.testState.loading,
    textContent: testBtnLabel,
    onClick: async () => {
      let targetConfig = selConfig;
      // Pre-validation for custom providers to avoid blank requests
      if (selKey === 'custom') {
        const customProfiles = state.config.customProviderProfiles || {};
        const subId = customProfiles.selectedProvider || 'groq';
        const curProf = (customProfiles.profiles && customProfiles.profiles[subId])
          || DEFAULT_CUSTOM_PROFILES[subId]
          || DEFAULT_CUSTOM_PROFILES.groq;
        targetConfig = curProf;

        if (subId === 'custom') {
          if (!curProf.endpoint?.trim()) {
            state.testState = {
              loading: false,
              result: { success: false, message: 'API Endpoint URL is required for Custom BYOK gateway. Please enter your endpoint URL.' }
            };
            render();
            return;
          }
          if (!curProf.model?.trim()) {
            state.testState = {
              loading: false,
              result: { success: false, message: 'Model ID is required for Custom BYOK gateway. Please enter your model ID (e.g. gpt-4o-mini).' }
            };
            render();
            return;
          }
        } else if (subId === 'ollama') {
          if (!curProf.endpoint?.trim()) {
            state.testState = {
              loading: false,
              result: { success: false, message: 'Ollama Server URL is required. Ensure Ollama is running at http://localhost:11434/v1/chat/completions.' }
            };
            render();
            return;
          }
        } else if (subId !== 'opencode') {
          if (!curProf.apiKey?.trim()) {
            state.testState = {
              loading: false,
              result: { success: false, message: `API Key is required for ${curProf.name || subId}. Please enter your API key to test connection.` }
            };
            render();
            return;
          }
        }
      }

      state.testState = { loading: true, result: null };
      render();
      try {
        const res = await testConnection(selKey, targetConfig);
        const isOk = res.success !== false;
        if (selReg.format === 'web_session') {
          const curEng = selConfig.engine || 'chatgpt';
          if (!selConfig.engineStatus) selConfig.engineStatus = {};
          selConfig.engineStatus[curEng] = {
            verified: isOk,
            lastChecked: Date.now(),
            user: res.user || null
          };
          delete selConfig.lastTestedSuccess;
          await saveConfig(state.config);
        }
        state.testState = {
          loading: false,
          result: {
            success: isOk,
            message: res.message || (res.latencyMs != null ? `Connected in ${res.latencyMs}ms ✓` : 'Connected successfully')
          }
        };
      } catch (err) {
        if (selReg.format === 'web_session') {
          const curEng = selConfig.engine || 'chatgpt';
          if (!selConfig.engineStatus) selConfig.engineStatus = {};
          selConfig.engineStatus[curEng] = {
            verified: false,
            lastChecked: Date.now(),
            user: null
          };
          delete selConfig.lastTestedSuccess;
          await saveConfig(state.config);
        }
        state.testState = {
          loading: false,
          result: { success: false, message: err.message || 'Connection failed' }
        };
      }
      render();
    }
  });
  detailBox.appendChild(testBtn);

  if (state.testState.result) {
    const isOk = state.testState.result.success;
    const testActions = [];

    if (!isOk) {
      if (selReg.format === 'web_session') {
        const engUrl = curWebMeta?.loginUrl || 'https://chatgpt.com';
        const engLabel = curWebMeta?.name || 'ChatGPT Web';
        testActions.push(el('button', {
          type: 'button',
          className: 'alert-action-chip primary',
          textContent: `Open ${engLabel} Tab`,
          onClick: () => {
            if (typeof chrome !== 'undefined' && chrome.tabs?.create) {
              chrome.tabs.create({ url: engUrl });
            } else {
              window.open(engUrl, '_blank');
            }
          }
        }));
      } else if (selKey === 'custom') {
        const customProfiles = state.config.customProviderProfiles || {};
        const subId = customProfiles.selectedProvider || 'groq';
        const curProf = (customProfiles.profiles && customProfiles.profiles[subId])
          || DEFAULT_CUSTOM_PROFILES[subId]
          || DEFAULT_CUSTOM_PROFILES.groq;
        const isZeroAuth = subId === 'opencode';
        const isLocal = subId === 'ollama';
        const isCustomBYOK = subId === 'custom';

        const errMsg = String(state.testState.result?.message || '');
        const isOverloaded = errMsg.includes('503') || errMsg.includes('overloaded') || errMsg.includes('busy');
        const isEndpointError = errMsg.includes('Endpoint') || (isCustomBYOK && !curProf.endpoint?.trim());
        const isModelError = errMsg.includes('Model') || (isCustomBYOK && !curProf.model?.trim());
        const isAuthError = !isZeroAuth && !isLocal && (
          errMsg.includes('401') || errMsg.includes('403') || errMsg.includes('API key') || errMsg.includes('API Key') || errMsg.includes('Unauthorized') || !curProf.apiKey?.trim()
        );

        if (isEndpointError) {
          testActions.push(el('button', {
            type: 'button',
            className: 'alert-action-chip primary',
            textContent: 'Enter Endpoint',
            onClick: () => {
              const input = document.getElementById('cfg-api-endpoint');
              if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }));
        }

        if (isOverloaded) {
          testActions.push(el('button', {
            type: 'button',
            className: 'alert-action-chip primary',
            textContent: 'Retry Ping',
            onClick: () => {
              const pingBtn = document.getElementById('btn-test-connection');
              if (pingBtn) pingBtn.click();
            }
          }));

          const altModel = (curProf.cachedModels || (subId === 'custom' ? [] : (FALLBACK_MODELS_BY_PROVIDER[subId] || [])))
            .find((m) => m.id !== curProf.model && isChatModel(m.id, m.label || ''));
          if (altModel) {
            testActions.push(el('button', {
              type: 'button',
              className: 'alert-action-chip',
              textContent: `Try ${altModel.label || altModel.id}`,
              onClick: async () => {
                curProf.model = altModel.id;
                syncCustomProfile(state.config, subId, { model: altModel.id });
                state.testState = { loading: false, result: null };
                await saveConfig(state.config);
                render();
              }
            }));
          }
        } else if (isAuthError) {
          testActions.push(el('button', {
            type: 'button',
            className: 'alert-action-chip',
            textContent: 'Enter API Key',
            onClick: () => {
              const input = document.getElementById('cfg-api-key') || detailBox.querySelector('input[type="password"], input[type="text"]');
              if (input) {
                input.focus();
                input.select();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }));
        } else if (isModelError && isCustomBYOK) {
          testActions.push(el('button', {
            type: 'button',
            className: 'alert-action-chip',
            textContent: 'Enter Model ID',
            onClick: () => {
              const input = document.getElementById('cfg-api-model');
              if (input) {
                input.focus();
                input.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
          }));
        } else if (subId === 'opencode') {
          if (curProf.model !== 'space-bunny-free') {
            testActions.push(el('button', {
              type: 'button',
              className: 'alert-action-chip primary',
              textContent: 'Switch to Space Bunny (Free)',
              onClick: async () => {
                curProf.model = 'space-bunny-free';
                syncCustomProfile(state.config, 'opencode', { model: 'space-bunny-free' });
                state.testState = { loading: false, result: null };
                await saveConfig(state.config);
                render();
              }
            }));
          }
          if (curProf.apiKey) {
            testActions.push(el('button', {
              type: 'button',
              className: 'alert-action-chip',
              textContent: 'Clear Key (Use Zero-Auth)',
              onClick: async () => {
                curProf.apiKey = '';
                syncCustomProfile(state.config, 'opencode', { apiKey: '' });
                state.testState = { loading: false, result: null };
                await saveConfig(state.config);
                render();
              }
            }));
          }
        }
      } else if (selReg.requiresKey) {
        testActions.push(el('button', {
          type: 'button',
          className: 'alert-action-chip',
          textContent: 'Focus Key Input',
          onClick: () => {
            const input = document.getElementById('cfg-api-key');
            if (input) {
              input.focus();
              input.select();
            }
          }
        }));
      }
    }

    detailBox.appendChild(el('div', {
      className: `alert-card ${isOk ? 'success' : 'danger'}`,
      style: 'margin-top: 8px; display: flex; flex-direction: column; gap: 6px;'
    },
      el('span', { textContent: state.testState.result.message }),
      testActions.length > 0 ? el('div', { className: 'alert-action-chips' }, ...testActions) : null
    ));
  }

  wrapper.appendChild(detailBox);
  return wrapper;
}

// ── System Prompt Tab ──
function renderPromptTab() {
  const wrapper = el('div', {
    className: 'prompt-tab-wrapper',
    style: 'display: flex; flex-direction: column; gap: 8px; flex: 1; min-height: 0; height: 100%;'
  });

  const currentPrompt = (state.config.customSystemPrompt && state.config.customSystemPrompt.trim())
    ? state.config.customSystemPrompt
    : DEFAULT_SYSTEM_PROMPT;

  const isCustomized = currentPrompt.trim() !== DEFAULT_SYSTEM_PROMPT.trim();

  const badge = el('span', {
    style: `font-size: 10px; padding: 1px 7px; border-radius: var(--radius-full); font-weight: 600; border: 1px solid ${isCustomized ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)'}; background: ${isCustomized ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-card)'}; color: ${isCustomized ? '#f59e0b' : 'var(--text-muted)'};`,
    textContent: isCustomized ? 'Customized' : 'Default'
  });

  const charCounter = el('span', {
    style: 'font-size: 10px; color: var(--text-muted); font-family: var(--font-mono);',
    textContent: `${currentPrompt.length} chars`
  });

  let textarea;

  const resetBtn = el('button', {
    type: 'button',
    className: `model-chip ${isCustomized ? 'selected' : ''}`,
    style: 'font-size: 10.5px; padding: 2px 8px; font-weight: 600;',
    disabled: !isCustomized,
    textContent: 'Reset to Default',
    title: isCustomized ? 'Revert to Fastfiller standard default prompt' : 'Already using default prompt',
    onClick: async () => {
      const currentVal = textarea ? textarea.value : (state.config.customSystemPrompt || '');
      const isCurrentlyCustomized = Boolean(state.config.customSystemPrompt || (currentVal && currentVal.trim() !== DEFAULT_SYSTEM_PROMPT.trim()));
      if (!isCurrentlyCustomized) return;

      state.config.customSystemPrompt = '';
      await saveConfig(state.config);

      if (textarea) {
        textarea.value = DEFAULT_SYSTEM_PROMPT;
      }
      badge.textContent = 'Default';
      badge.style.color = 'var(--text-muted)';
      badge.style.borderColor = 'var(--border-subtle)';
      badge.style.background = 'var(--bg-card)';

      charCounter.textContent = `${DEFAULT_SYSTEM_PROMPT.length} chars`;

      resetBtn.disabled = true;
      resetBtn.classList.remove('selected');
      resetBtn.title = 'Already using default prompt';

      render();
    }
  });

  const headerRow = el('div', {
    className: 'prompt-tab-header',
    style: 'display: flex; align-items: center; justify-content: space-between; flex-shrink: 0;'
  },
    el('div', { style: 'display: flex; align-items: center; gap: 6px;' },
      el('label', {
        className: 'form-label',
        style: 'margin-bottom: 0;',
        textContent: 'System Instructions'
      }),
      badge
    ),
    el('div', { style: 'display: flex; align-items: center; gap: 8px;' },
      charCounter,
      resetBtn
    )
  );

  const subText = el('p', {
    className: 'prompt-tab-subtext',
    style: 'margin: 0; font-size: 11px; line-height: 1.4; color: var(--text-muted); flex-shrink: 0;',
    textContent: 'Fastfiller\'s system prompt is populated below. You can view, customize, or tweak rules directly. Click Reset to revert to default.'
  });

  const textareaWrapper = el('div', {
    className: 'textarea-wrapper prompt-tab-textarea-wrapper',
    style: 'margin-bottom: 0; background: var(--bg-card); flex: 1; display: flex; flex-direction: column; min-height: 280px;'
  },
    (textarea = el('textarea', {
      className: 'info-textarea prompt-tab-textarea',
      style: 'flex: 1; width: 100%; height: 100%; min-height: 240px; max-height: none; resize: none; font-family: var(--font-mono); font-size: 11px; line-height: 1.5; color: var(--text-primary); padding: 12px; border: none; outline: none; box-shadow: none; background: transparent;',
      placeholder: 'Enter system prompt instructions...',
      value: currentPrompt,
      onInput: async (e) => {
        const val = e.target.value;
        const customizedNow = Boolean(val && val.trim() !== DEFAULT_SYSTEM_PROMPT.trim());
        state.config.customSystemPrompt = customizedNow ? val : '';
        await saveConfig(state.config);

        badge.textContent = customizedNow ? 'Customized' : 'Default';
        badge.style.color = customizedNow ? '#f59e0b' : 'var(--text-muted)';
        badge.style.borderColor = customizedNow ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)';
        badge.style.background = customizedNow ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-card)';

        charCounter.textContent = `${val.length} chars`;

        resetBtn.disabled = !customizedNow;
        resetBtn.title = customizedNow ? 'Revert to Fastfiller standard default prompt' : 'Already using default prompt';
        if (customizedNow) {
          resetBtn.classList.add('selected');
        } else {
          resetBtn.classList.remove('selected');
        }
      }
    }))
  );

  wrapper.appendChild(headerRow);
  wrapper.appendChild(subText);
  wrapper.appendChild(textareaWrapper);

  return wrapper;
}

// ──────────────────────────────────────────
// KEYBOARD SHORTCUTS
// ──────────────────────────────────────────

window.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    if (state.view === 'main' && !state.isFilling && !state.modalDialog && !state.showTemplateManager) {
      executeFormFill();
    }
  }
  if (e.key === 'Escape') {
    if (state.isFilling) {
      stopAutoFill();
      return;
    }
    if (state.modalDialog) {
      closeProfileModalDialog();
      return;
    }
    if (state.showDryRunDrawer) {
      if (state.dryRunFullScreen) {
        state.dryRunFullScreen = false;
        document.body.classList.remove('dry-run-fullscreen-active');
        const fsBtn = document.getElementById('dryrun-fullscreen-btn');
        if (fsBtn) {
          fsBtn.innerHTML = ICONS.MAXIMIZE;
          fsBtn.title = 'Enter Full Screen';
          fsBtn.classList.remove('active');
        }
        const drawer = document.getElementById('dryrun-drawer-panel');
        if (drawer) {
          drawer.classList.remove('dryrun-fullscreen');
          drawer.style.height = '';
          drawer.style.maxHeight = '90%';
          const list = drawer.querySelector('.drawer-list');
          if (list) {
            list.style.maxHeight = '290px';
            list.style.flex = '';
          }
        }
        return;
      }
      state.showDryRunDrawer = false;
      document.body.classList.remove('dry-run-fullscreen-active');
      render();
      return;
    }
    if (state.showTemplateManager) {
      closeTemplateManagerDrawer();
      return;
    } else if (state.showInspector) {
      state.showInspector = false;
      render();
    } else if (state.view === 'settings') {
      state.view = 'main';
      render();
    }
  }
});

// ──────────────────────────────────────────
// INITIALIZATION
// ──────────────────────────────────────────

function render() {
  const root = document.getElementById('app');
  if (!root) return;
  try {
    root.innerHTML = '';
    if (state.view === 'main') {
      root.appendChild(renderMainView());
    } else {
      root.appendChild(renderSettingsView());
    }
  } catch (err) {
    console.error('[FastFiller] UI Render Error:', err);
    root.innerHTML = '';
    const errBox = document.createElement('div');
    errBox.style.cssText = 'padding: 24px; color: #f87171; background: #0f172a; min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; flex-direction: column; gap: 12px;';
    errBox.innerHTML = `
      <div style="font-weight: 700; font-size: 14px; color: #ef4444; display: flex; align-items: center; gap: 8px;">
        <span>⚠️</span> Interface Error
      </div>
      <div id="err-boundary-msg" style="font-size: 12px; color: #cbd5e1; background: rgba(0,0,0,0.4); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); font-family: monospace; word-break: break-all;"></div>
      <button id="btn-emergency-recover" style="padding: 8px 16px; background: #38bdf8; color: #020617; font-weight: 700; border: none; border-radius: 6px; cursor: pointer; align-self: flex-start; margin-top: 4px;">
        ↺ Return to Main View
      </button>
    `;
    const errMsgDiv = errBox.querySelector('#err-boundary-msg');
    if (errMsgDiv) errMsgDiv.textContent = String(err?.message || err || 'Unknown UI render error');
    root.appendChild(errBox);
    document.getElementById('btn-emergency-recover')?.addEventListener('click', () => {
      state.view = 'main';
      state.testState = { loading: false, result: null };
      render();
    });
  }
}

async function init() {
  const [config, tplData, theme, defaultView] = await Promise.all([
    loadConfig(),
    loadTemplates(),
    loadTheme(),
    loadDefaultView()
  ]);

  state.config = config;
  state.templates = tplData.templates;
  state.activeTemplateId = tplData.activeId;
  state.theme = theme;
  state.defaultView = defaultView;

  document.documentElement.dataset.theme = theme;

  const activeTpl = state.templates.find((t) => t.id === state.activeTemplateId);
  state.currentText = activeTpl ? activeTpl.content : '';

  render();
  scanPageFields();

  // Asynchronous background check for updates (silent, non-blocking)
  checkForUpdate(false).then((updateInfo) => {
    if (updateInfo && updateInfo.updateAvailable) {
      state.updateInfo = updateInfo;
      render();
    }
  }).catch(() => {});

  // Restore running or recently completed fill job state from background service worker
  if (typeof chrome !== 'undefined' && chrome.tabs?.query && chrome.runtime?.sendMessage) {
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        chrome.runtime.sendMessage({ type: 'GET_FILL_JOB_STATE', tabId: tab.id }, (resp) => {
          if (resp?.job && (resp.job.status === 'running' || resp.job.status === 'staged' || (resp.job.status === 'completed' && resp.job.feedback))) {
            // Only restore completed feedback if the job matches the current page domain
            if (resp.job.status === 'completed' && resp.job.pageDomain && tab.url) {
              try {
                const currentDomain = new URL(tab.url).hostname;
                if (currentDomain && !currentDomain.includes(resp.job.pageDomain) && !resp.job.pageDomain.includes(currentDomain)) {
                  return;
                }
              } catch {}
            }
            handleJobUpdateFromBackground(resp.job);
          }
        });
      }
    });
  }
}

// Global runtime listener for background fill progress updates
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'FILL_JOB_UPDATE' && msg.job) {
      chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
        if (tab?.id && msg.job.tabId === tab.id) {
          handleJobUpdateFromBackground(msg.job);
        }
      });
    }
  });
}

// Auto-detect new website when user switches tabs or navigates
if (typeof chrome !== 'undefined' && chrome.tabs) {
  if (chrome.tabs.onActivated) {
    chrome.tabs.onActivated.addListener(async () => {
      if (state.isFilling) return;
      state.fillFeedback = null;
      state.inspectingIndex = -1;
      await scanPageFields();
    });
  }
  if (chrome.tabs.onUpdated) {
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
      if (state.isFilling || changeInfo.status !== 'complete') return;
      const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (currentTab?.id === tabId) {
        await scanPageFields();
      }
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
