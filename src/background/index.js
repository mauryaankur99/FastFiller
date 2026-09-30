/**
 * FastFiller — Background Service Worker (Manifest V3)
 * Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com
 * Licensed under the MIT License.
 * Authors: Maurya Ankur (https://www.linkedin.com/in/ankur-maurya1/), Singh Sanjiv (https://www.linkedin.com/in/sanjiv-singh/)
 * Organization: Aeigs (https://aeigs.com)
 */

import {
  buildMessages,
  callAI,
  parseAIResponse,
  SYSTEM_PROMPT_PRESETS,
  DEFAULT_SYSTEM_PROMPT,
  resolveDynamicTemplateVariables,
  prioritizeInputs,
  chunkInputs,
  normalizeAIValuesToCanonicalFields,
  isNegativeDirectiveOrSkip,
  PROVIDERS_REGISTRY
} from '../popup/api-providers.js';
import { loadConfig, loadTemplates, loadDefaultView, WATERMARK } from '../popup/storage.js';
import { executeWebSessionPrompt, checkWebSessionStatus } from '../services/web-session-manager.js';

// ──────────────────────────────────────────
// 1. INSTALL & CONTEXT MENU SETUP
// ──────────────────────────────────────────

async function syncToolbarPopupSetting() {
  try {
    const view = await loadDefaultView();
    if (typeof chrome !== 'undefined') {
      if (chrome.sidePanel?.setPanelBehavior) {
        await chrome.sidePanel.setPanelBehavior({
          openPanelOnActionClick: view === 'sidepanel'
        });
      }
      if (chrome.action?.setPopup) {
        await chrome.action.setPopup({
          popup: view === 'sidepanel' ? '' : 'src/popup/index.html'
        });
      }
    }
  } catch (err) {
    console.warn('[Fastfiller: Background] View sync note:', err);
  }
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: chrome.runtime.getURL('src/help/index.html'), active: true });
  }

  syncToolbarPopupSetting();

  // Create Targeted Context Menus
  try {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'fastfiller-fill-active',
        title: 'Fastfiller: Autofill with Active Template',
        contexts: ['page', 'editable', 'selection']
      });

      chrome.contextMenus.create({
        id: 'fastfiller-paste-profile',
        title: 'Paste active template into field',
        contexts: ['editable']
      });

      chrome.contextMenus.create({
        id: 'fastfiller-paste-name',
        title: 'Paste Full Name',
        contexts: ['editable']
      });

      chrome.contextMenus.create({
        id: 'fastfiller-paste-email',
        title: 'Paste Email Address',
        contexts: ['editable']
      });

      chrome.contextMenus.create({
        id: 'fastfiller-paste-phone',
        title: 'Paste Phone Number',
        contexts: ['editable']
      });

      chrome.contextMenus.create({
        id: 'fastfiller-paste-summary',
        title: 'Paste Bio / Work Summary',
        contexts: ['editable']
      });
    });
  } catch (err) {
    console.warn('[Fastfiller: Background] Context menu creation note:', err);
  }
});

if (chrome.runtime.onStartup) {
  chrome.runtime.onStartup.addListener(syncToolbarPopupSetting);
}

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  const _legacyDefaultViewKey = 'fastfiller_v1_default_view';
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && (changes['fastfiller_default_view'] || changes[_legacyDefaultViewKey])) {
      syncToolbarPopupSetting();
    }
  });
}

// ──────────────────────────────────────────
// 2. DYNAMIC CONTENT SCRIPT INJECTION
// ──────────────────────────────────────────

async function ensureContentScriptActive(tabId) {
  if (!tabId) return false;

  const isAlive = await new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { type: 'PING' }, (resp) => {
        if (chrome.runtime.lastError || !resp?.pong) {
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
      await chrome.scripting.executeScript({
        target: { tabId, allFrames: true },
        files: ['src/content/index.js']
      });
      await new Promise((r) => setTimeout(r, 120));
      return true;
    } catch (err) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: ['src/content/index.js']
        });
        await new Promise((r) => setTimeout(r, 120));
        return true;
      } catch (err2) {
        console.warn('[FastFiller: Background] Script injection failed:', err2);
        return false;
      }
    }
  }

  return false;
}

// ──────────────────────────────────────────
// 3. IN-PAGE HUD TOAST NOTIFIER
// ──────────────────────────────────────────

async function showInPageToast(tabId, message, type = 'success', canUndo = false) {
  if (!tabId || !chrome.scripting?.executeScript) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (msgText, msgType, isUndoable) => {
        const existing = document.getElementById('fastfiller-floating-hud');
        if (existing) existing.remove();

        const hud = document.createElement('div');
        hud.id = 'fastfiller-floating-hud';
        hud.style.cssText = `
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 2147483647;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 16px;
          background: ${msgType === 'error' ? '#1c1917' : '#09090b'};
          color: #fafafa;
          border: 1px solid ${msgType === 'error' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(255, 255, 255, 0.15)'};
          border-radius: 9999px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          font-size: 13px;
          font-weight: 500;
          line-height: 1;
          pointer-events: auto;
          transition: opacity 0.25s ease, transform 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
          transform: translateY(10px);
          opacity: 0;
        `;

        const iconSpan = document.createElement('span');
        iconSpan.style.cssText = 'color: #f97316; font-size: 14px;';
        iconSpan.textContent = '⚡';

        const textSpan = document.createElement('span');
        textSpan.textContent = msgText;

        hud.appendChild(iconSpan);
        hud.appendChild(textSpan);

        if (isUndoable) {
          const undoBtn = document.createElement('button');
          undoBtn.textContent = 'Undo';
          undoBtn.style.cssText = `
            background: rgba(255, 255, 255, 0.12);
            border: 1px solid rgba(255, 255, 255, 0.18);
            color: #fff;
            padding: 4px 10px;
            border-radius: 9999px;
            font-size: 11.5px;
            font-weight: 600;
            cursor: pointer;
            outline: none;
            transition: background 0.15s ease;
          `;
          undoBtn.onmouseenter = () => { undoBtn.style.background = 'rgba(255, 255, 255, 0.25)'; };
          undoBtn.onmouseleave = () => { undoBtn.style.background = 'rgba(255, 255, 255, 0.12)'; };
          undoBtn.onclick = () => {
            chrome.runtime.sendMessage({ type: 'EXECUTE_PAGE_UNDO', tabId: null });
            hud.style.opacity = '0';
            setTimeout(() => hud.remove(), 250);
          };
          hud.appendChild(undoBtn);
        }

        document.body.appendChild(hud);

        // Animate in
        requestAnimationFrame(() => {
          hud.style.transform = 'translateY(0)';
          hud.style.opacity = '1';
        });

        // Auto-dismiss after 4.2 seconds
        setTimeout(() => {
          if (hud.parentElement) {
            hud.style.transform = 'translateY(10px)';
            hud.style.opacity = '0';
            setTimeout(() => hud.remove(), 250);
          }
        }, 4200);
      },
      args: [message, type, canUndo]
    });
  } catch (err) {
    console.warn('[FastFiller: Background] Could not show in-page HUD:', err);
  }
}

// ──────────────────────────────────────────
// 4. CORE BACKGROUND FILL PIPELINE & STATE MANAGER
// ──────────────────────────────────────────

const activeFillJobs = new Map(); // tabId -> jobState

function sanitizeJobForBroadcast(job) {
  if (!job) return null;
  return {
    tabId: job.tabId,
    runId: job.runId,
    status: job.status,
    stage: job.stage,
    stepText: job.stepText,
    elapsedText: job.elapsedText,
    dryRunMode: job.dryRunMode,
    stagedFillValues: job.stagedFillValues,
    skippedFields: job.skippedFields,
    canUndo: job.canUndo,
    feedback: job.feedback,
    error: job.error,
    detectedFields: job.detectedFields,
    pageDomain: job.pageDomain,
    pageTitle: job.pageTitle
  };
}

function broadcastJobUpdate(job) {
  if (!job) return;
  const payload = sanitizeJobForBroadcast(job);
  try {
    chrome.runtime.sendMessage({ type: 'FILL_JOB_UPDATE', job: payload }).catch(() => {});
  } catch {}
}

function cancelFillJob(tabId, runId) {
  const job = activeFillJobs.get(tabId);
  if (!job) return;
  if (!runId || job.runId === runId) {
    if (job.abortController) {
      try { job.abortController.abort(); } catch {}
    }
    if (job.timerId) {
      clearInterval(job.timerId);
      job.timerId = null;
    }
    job.status = 'cancelled';
    job.stage = 0;
    job.stepText = '';
    try {
      const p = chrome.tabs.sendMessage(tabId, { type: 'STOP_FILL_RUN', runId: job.runId }, () => {});
      if (p && typeof p.catch === 'function') p.catch(() => {});
    } catch {}
    broadcastJobUpdate(job);
  }
}

async function startFillJob(options = {}) {
  const tabId = options.tabId;
  if (!tabId) throw new Error('Missing tabId for fill job.');

  // Cancel any prior job on this tab
  cancelFillJob(tabId);

  const runId = 'run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
  const abortController = new AbortController();
  const startTime = performance.now();

  const job = {
    runId,
    tabId,
    status: 'running',
    stage: 1,
    stepText: 'Scanning form inputs...',
    elapsedText: '0.0s',
    startTime,
    dryRunMode: Boolean(options.dryRunMode),
    initiatedFromUi: Boolean(options.initiatedFromUi),
    detectedFields: Array.isArray(options.detectedFields) && options.detectedFields.length > 0 ? options.detectedFields : null,
    stagedFillValues: null,
    skippedFields: [],
    canUndo: false,
    feedback: null,
    error: null,
    abortController,
    timerId: null
  };

  activeFillJobs.set(tabId, job);

  // Background elapsed timer (survives popup closure)
  job.timerId = setInterval(() => {
    if (job.status !== 'running') {
      clearInterval(job.timerId);
      job.timerId = null;
      return;
    }
    const elapsed = ((performance.now() - job.startTime) / 1000).toFixed(1);
    job.elapsedText = `${elapsed}s`;
    broadcastJobUpdate(job);
  }, 200);

  broadcastJobUpdate(job);

  // Run execution independently in background
  (async () => {
    try {
      const isReady = await ensureContentScriptActive(tabId);
      if (job.status !== 'running') return;
      if (!isReady) {
        throw new Error('Cannot communicate with page. Please check tab permissions or reload page.');
      }

      // 1. Resolve text to fill
      let userText = options.text;
      if (!userText || !userText.trim()) {
        const tplData = await loadTemplates();
        const activeTpl = tplData.templates.find((t) => t.id === tplData.activeId) || tplData.templates[0];
        userText = activeTpl ? activeTpl.content : '';
      }
      if (!userText || !userText.trim()) {
        throw new Error('Enter or select information to fill.');
      }

      // 2. Query form inputs on target tab (always fetch fresh to detect new website immediately)
      showInPageToast(tabId, 'Fastfiller: Scanning form...', 'info', false);
      let pageData = null;
      try {
        pageData = await new Promise((resolve, reject) => {
          chrome.tabs.sendMessage(tabId, { type: 'COLLECT_DATA' }, (resp) => {
            if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
            else resolve(resp);
          });
        });
      } catch (err) {
        if (!job.detectedFields || job.detectedFields.length === 0) throw err;
      }

      if (job.status !== 'running') return;
      if (pageData?.success && Array.isArray(pageData.inputs) && pageData.inputs.length > 0) {
        job.detectedFields = pageData.inputs;
        job.pageDomain = pageData.domain || '';
        job.pageTitle = pageData.pageTitle || '';
      } else if (!job.detectedFields || job.detectedFields.length === 0) {
        throw new Error(pageData?.error || 'No fillable form fields detected on this page.');
      }

      const inputs = job.detectedFields || [];
      const visibleInputs = inputs.filter((inp) => inp.isVisible !== false && !inp.readonly && (!inp.disabled || inp.isDependent) && !inp.isRadioGroupSecondary);
      const eligibleCount = visibleInputs.length || inputs.length;

      // 3. Resolve AI provider config
      const config = options.config || await loadConfig();
      const activeProvKey = config.activeProvider || 'chatgpt_web';
      const reg = PROVIDERS_REGISTRY[activeProvKey];
      const activeProvConfig = (config.providers && config.providers[activeProvKey]) || {
        endpoint: reg?.endpoint || '',
        model: reg?.defaultModel || ''
      };

      if (!reg) {
        throw new Error('Configure your AI provider in Settings first.');
      }
      if (reg.requiresKey && !activeProvConfig.apiKey?.trim()) {
        throw new Error(`Missing API key for ${reg.name}. Configure in Settings.`);
      }
      if (activeProvKey === 'custom' && !activeProvConfig.endpoint) {
        throw new Error('Custom AI API configuration is incomplete. Please enter an Endpoint.');
      }

      // 4. Update Stage 2: Mapping fields with AI
      job.stage = 2;
      job.stepText = `Mapping ${eligibleCount} fields with ${reg.name}...`;
      broadcastJobUpdate(job);
      showInPageToast(tabId, `Fastfiller: Mapping ${eligibleCount} fields with ${reg.name}...`, 'info', false);

      let sysPrompt = DEFAULT_SYSTEM_PROMPT;
      if (config.customSystemPrompt && config.customSystemPrompt.trim()) {
        sysPrompt = config.customSystemPrompt.trim();
      } else if (config.systemPromptPreset && SYSTEM_PROMPT_PRESETS[config.systemPromptPreset]) {
        sysPrompt = SYSTEM_PROMPT_PRESETS[config.systemPromptPreset];
      }

      const pageContext = {
        domain: job.pageDomain || '',
        pageTitle: job.pageTitle || ''
      };

      const resolvedText = resolveDynamicTemplateVariables(userText);
      const targetInputs = prioritizeInputs(visibleInputs.length > 0 ? visibleInputs : inputs);
      const chunks = chunkInputs(targetInputs, 45);
      const values = {};

      for (let i = 0; i < chunks.length; i++) {
        if (job.status !== 'running') return;
        const chunk = chunks[i];
        if (chunks.length > 1) {
          job.stepText = `Mapping fields (Batch ${i + 1} of ${chunks.length}: ${chunk.length} fields)...`;
          broadcastJobUpdate(job);
          showInPageToast(tabId, `Fastfiller: Mapping batch ${i + 1}/${chunks.length} (${chunk.length} fields)...`, 'info', false);
        }

        const messages = buildMessages(sysPrompt, resolvedText, chunk, pageContext);
        const maxTokens = Math.min(Math.max(chunk.length * 80, 1024), 4096);
        const provConfigWithExecutor = {
          ...activeProvConfig,
          webSessionExecutor: executeWebSessionPrompt
        };
        const rawAiOutput = await callAI(activeProvKey, provConfigWithExecutor, messages, maxTokens);
        if (job.status !== 'running') return;
        const batchValues = parseAIResponse(rawAiOutput);
        Object.assign(values, batchValues);
      }

      if (job.status !== 'running') return;

      // 5. Canonical Field Normalizer
      const normalizedValues = normalizeAIValuesToCanonicalFields(values, job.detectedFields, resolvedText);

      // 6. Handle Dry Run Mode
      if (job.dryRunMode) {
        const staged = {};
        const seenRadioGroups = new Set();

        for (const [classKey, val] of Object.entries(normalizedValues)) {
          const fieldMeta = job.detectedFields?.find((f) => f.class === classKey);
          if (!fieldMeta) continue;

          const fieldIdent = `${fieldMeta.id || ''} ${fieldMeta.name || ''} ${fieldMeta.labelText || ''}`.toLowerCase();
          if (
            fieldIdent.includes('captcha') ||
            fieldIdent.includes('cpatcha') ||
            fieldIdent.includes('recaptcha') ||
            fieldIdent.includes('turnstile') ||
            fieldIdent.includes('hcaptcha') ||
            /\b\d{4,6}_txt\b/.test(fieldIdent) ||
            /\btemp\b/i.test(fieldIdent) ||
            /temp$/i.test(fieldMeta.id || '') ||
            /temp$/i.test(fieldMeta.name || '')
          ) {
            continue;
          }

          const cleanVal = typeof val === 'object' && val !== null && !Array.isArray(val)
            ? (val.value ?? val.label ?? val.text ?? '')
            : val;
          const strVal = String(cleanVal != null ? cleanVal : '').trim();

          if (!strVal || isNegativeDirectiveOrSkip(strVal)) continue;

          const lowerVal = strVal.toLowerCase();
          if (fieldMeta.type === 'select' || fieldMeta.role === 'listbox' || fieldMeta.role === 'combobox') {
            if (lowerVal === 'select' || lowerVal === '-- select --' || lowerVal === '- select -' || lowerVal === 'please select' || lowerVal === '-- choose --') {
              continue;
            }
          }

          if (fieldMeta.type === 'checkbox' || fieldMeta.role === 'checkbox') {
            if (cleanVal === false || strVal === 'false' || strVal === '0') continue;
          }

          if (fieldMeta.type === 'radio' || fieldMeta.role === 'radio') {
            if (cleanVal === false || strVal === 'false' || strVal === '0') continue;
            const groupName = fieldMeta.radioGroupName || fieldMeta.name;
            if (groupName) {
              if (seenRadioGroups.has(groupName)) continue;
              seenRadioGroups.add(groupName);
            }
          }

          const label = fieldMeta?.labelText || fieldMeta?.placeholder || fieldMeta?.name || classKey;
          staged[classKey] = {
            value: strVal,
            checked: true,
            label,
            type: fieldMeta?.type || 'text'
          };
        }

        job.stagedFillValues = staged;
        job.status = 'staged';
        job.stage = 0;
        job.stepText = '';
        if (job.timerId) {
          clearInterval(job.timerId);
          job.timerId = null;
        }
        broadcastJobUpdate(job);
        showInPageToast(tabId, `Fastfiller: ${Object.keys(staged).length} fields mapped for review.`, 'info', false);
        return;
      }

      // 7. Standard Direct Fill: Sanitize values
      const sanitizedValues = {};
      const seenDirectRadioGroups = new Set();
      for (const [k, v] of Object.entries(normalizedValues)) {
        if (v == null) continue;
        const fieldMeta = job.detectedFields?.find((f) => f.class === k);
        if (!fieldMeta) continue;

        const fieldIdent = `${fieldMeta.id || ''} ${fieldMeta.name || ''} ${fieldMeta.labelText || ''}`.toLowerCase();
        if (
          fieldIdent.includes('captcha') ||
          fieldIdent.includes('cpatcha') ||
          fieldIdent.includes('recaptcha') ||
          fieldIdent.includes('turnstile') ||
          fieldIdent.includes('hcaptcha') ||
          /\b\d{4,6}_txt\b/.test(fieldIdent) ||
          /\btemp\b/i.test(fieldIdent) ||
          /temp$/i.test(fieldMeta.id || '') ||
          /temp$/i.test(fieldMeta.name || '')
        ) {
          continue;
        }

        const clean = typeof v === 'object' && !Array.isArray(v) ? (v.value ?? v.label ?? v.text ?? '') : v;
        const strClean = String(clean != null ? clean : '').trim();
        if (!strClean || isNegativeDirectiveOrSkip(strClean)) continue;

        const lowerClean = strClean.toLowerCase();
        if (fieldMeta.type === 'select' || fieldMeta.role === 'listbox' || fieldMeta.role === 'combobox') {
          if (lowerClean === 'select' || lowerClean === '-- select --' || lowerClean === '- select -' || lowerClean === 'please select' || lowerClean === '-- choose --') {
            continue;
          }
        }

        if (fieldMeta.type === 'checkbox' || fieldMeta.role === 'checkbox') {
          if (clean === false || strClean === 'false' || strClean === '0') continue;
        }

        if (fieldMeta.type === 'radio' || fieldMeta.role === 'radio') {
          if (clean === false || strClean === 'false' || strClean === '0') continue;
          const groupName = fieldMeta.radioGroupName || fieldMeta.name;
          if (groupName) {
            if (seenDirectRadioGroups.has(groupName)) continue;
            seenDirectRadioGroups.add(groupName);
          }
        }

        sanitizedValues[k] = typeof clean === 'boolean' ? clean : strClean;
      }

      job.stage = 3;
      job.stepText = `Applying ${Object.keys(sanitizedValues).length} values to page...`;
      broadcastJobUpdate(job);
      showInPageToast(tabId, `Fastfiller: Applying ${Object.keys(sanitizedValues).length} values to page...`, 'info', false);

      if (job.status !== 'running') return;

      const fillResult = await new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, {
          type: 'FILL_FORM',
          data: sanitizedValues,
          runId: job.runId,
          fieldsMeta: job.detectedFields
        }, (resp) => {
          resolve(resp || {});
        });
      });

      if (job.status !== 'running') return;

      const elapsed = ((performance.now() - job.startTime) / 1000).toFixed(1);
      const resultsMap = fillResult?.fillResults || {};
      const filledCount = fillResult?.fillResults
        ? Object.values(resultsMap).filter((r) => r.success).length
        : Object.keys(sanitizedValues).length;
      const totalCount = fillResult?.fillResults
        ? Object.keys(resultsMap).length
        : Object.keys(sanitizedValues).length;
      const failedCount = totalCount - filledCount;

      const skipped = [];
      for (const [classKey, res] of Object.entries(resultsMap)) {
        if (!res.success) {
          const fieldMeta = job.detectedFields?.find?.((f) => f.class === classKey || f.id === classKey || f.name === classKey);
          const label = fieldMeta?.labelText || fieldMeta?.placeholder || fieldMeta?.name || classKey;
          skipped.push({
            classKey,
            label,
            type: fieldMeta?.type || 'input',
            value: sanitizedValues[classKey] ?? '',
            reason: res.reason || res.error || (res.skipped ? 'Empty value' : 'Option not matched or pending'),
            fieldMeta
          });
        }
      }

      job.skippedFields = skipped;
      job.canUndo = true;
      job.status = 'completed';
      job.stage = 0;
      job.stepText = '';
      job.elapsedText = `${elapsed}s`;

      if (failedCount > 0) {
        job.feedback = {
          type: 'warning',
          text: `Filled ${filledCount} of ${totalCount} fields (${failedCount} pending/skipped) in ${elapsed}s via ${reg.name}`,
          failedCount,
          filledCount,
          totalCount
        };
      } else {
        job.feedback = {
          type: 'success',
          text: `Filled ${filledCount} ${filledCount === 1 ? 'field' : 'fields'} in ${elapsed}s via ${reg.name}`,
          failedCount: 0,
          filledCount,
          totalCount
        };
      }

      const summary = fillResult?.summary || `${filledCount}/${totalCount} fields filled`;
      showInPageToast(tabId, `Filled: ${summary} in ${elapsed}s`, 'success', true);
      broadcastJobUpdate(job);
    } catch (err) {
      if (job.status !== 'running') return;
      console.error('[Fastfiller: Background Fill Error]:', err);
      job.status = 'error';
      job.stage = 0;
      job.stepText = '';
      job.error = err.message || String(err);
      showInPageToast(tabId, `Fill failed: ${job.error}`, 'error');
      broadcastJobUpdate(job);
    } finally {
      if (job.timerId) {
        clearInterval(job.timerId);
        job.timerId = null;
      }
    }
  })();

  return { success: true, runId };
}

async function dispatchStagedFill({ tabId, finalValues, runId, fieldsMeta }) {
  if (!tabId || !finalValues) return { success: false, error: 'Invalid parameters' };

  const currentRun = runId || ('run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6));
  const startTime = performance.now();

  const job = {
    runId: currentRun,
    tabId,
    status: 'running',
    stage: 3,
    stepText: 'Dispatching reviewed values...',
    elapsedText: '0.0s',
    startTime,
    dryRunMode: false,
    stagedFillValues: null,
    skippedFields: [],
    canUndo: false,
    feedback: null,
    error: null
  };
  activeFillJobs.set(tabId, job);
  broadcastJobUpdate(job);
  showInPageToast(tabId, 'Fastfiller: Applying reviewed values...', 'info', false);

  try {
    const fillResult = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tabId, {
        type: 'FILL_FORM',
        data: finalValues,
        runId: currentRun,
        fieldsMeta
      }, (resp) => resolve(resp || {}));
    });

    const elapsed = ((performance.now() - startTime) / 1000).toFixed(1);
    const resultsMap = fillResult?.fillResults || {};
    const totalCount = fillResult?.fillResults
      ? Object.keys(resultsMap).length
      : Object.keys(finalValues).length;
    const filledCount = fillResult?.fillResults
      ? Object.values(resultsMap).filter((r) => r.success).length
      : Object.keys(finalValues).length;
    const failedCount = totalCount - filledCount;

    const skipped = [];
    for (const [classKey, res] of Object.entries(resultsMap)) {
      if (!res.success) {
        const fieldMeta = fieldsMeta?.find?.((f) => f.class === classKey || f.id === classKey || f.name === classKey);
        const label = fieldMeta?.labelText || fieldMeta?.placeholder || fieldMeta?.name || classKey;
        skipped.push({
          classKey,
          label,
          type: fieldMeta?.type || 'input',
          value: finalValues[classKey] ?? '',
          reason: res.reason || res.error || (res.skipped ? 'Empty value' : 'Option not matched or pending'),
          fieldMeta
        });
      }
    }

    job.skippedFields = skipped;
    job.canUndo = true;
    job.status = 'completed';
    job.stage = 0;
    job.stepText = '';
    job.elapsedText = `${elapsed}s`;

    if (failedCount > 0) {
      job.feedback = {
        type: 'warning',
        text: `Injected ${filledCount} of ${totalCount} reviewed fields (${failedCount} pending/skipped).`,
        failedCount,
        filledCount,
        totalCount
      };
    } else {
      job.feedback = {
        type: 'success',
        text: `Injected ${filledCount} reviewed ${filledCount === 1 ? 'field' : 'fields'} successfully.`,
        failedCount: 0,
        filledCount,
        totalCount
      };
    }

    showInPageToast(tabId, `Injected: ${filledCount}/${totalCount} fields in ${elapsed}s`, 'success', true);
    broadcastJobUpdate(job);
    return { success: true, job: sanitizeJobForBroadcast(job) };
  } catch (err) {
    job.status = 'error';
    job.stage = 0;
    job.error = err.message || String(err);
    showInPageToast(tabId, `Injection failed: ${job.error}`, 'error');
    broadcastJobUpdate(job);
    return { success: false, error: job.error };
  }
}

async function triggerDirectFill(tab) {
  if (!tab || !tab.id) return;
  return startFillJob({ tabId: tab.id, initiatedFromUi: false });
}

// ──────────────────────────────────────────
// 5. EVENT LISTENERS: SHORTCUTS & CONTEXT MENUS
// ──────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'fill-active-form') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) triggerDirectFill(tab);
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  const itemId = String(info.menuItemId);

  if (itemId === 'fastfiller-fill-active') {
    triggerDirectFill(tab);
    return;
  }

  // Targeted Context Menu Pasting
  if (itemId.startsWith('fastfiller-paste-')) {
    try {
      const tplData = await loadTemplates();
      const activeTpl = tplData.templates.find((t) => t.id === tplData.activeId) || tplData.templates[0];
      const text = activeTpl ? activeTpl.content : '';
      let valueToPaste = text;

      if (itemId.endsWith('paste-name')) {
        const match = text.match(/(?:Full Name|Name)\s*:\s*([^\r\n]+)/i);
        valueToPaste = match ? match[1].trim() : text.split('\n')[0];
      } else if (itemId.endsWith('paste-email')) {
        const match = text.match(/(?:Email|E-mail)\s*:\s*([^\r\n]+)/i) || text.match(/[\w.-]+@[\w.-]+\.\w+/);
        valueToPaste = match ? (match[1] || match[0]).trim() : '';
      } else if (itemId.endsWith('paste-phone')) {
        const match = text.match(/(?:Phone|Tel|Mobile)\s*:\s*([^\r\n]+)/i) || text.match(/[+\d()\s-]{7,}/);
        valueToPaste = match ? (match[1] || match[0]).trim() : '';
      } else if (itemId.endsWith('paste-summary')) {
        const match = text.match(/(?:Summary|Bio|About|Cover Letter)\s*:\s*([\s\S]+)/i);
        valueToPaste = match ? match[1].trim() : text;
      }

      if (valueToPaste) {
        const resolved = resolveDynamicTemplateVariables(valueToPaste);
        await ensureContentScriptActive(tab.id);
        chrome.tabs.sendMessage(tab.id, { type: 'PASTE_INTO_TARGET', text: resolved });
      }
    } catch (err) {
      console.warn('[Fastfiller: Context Menu Paste Failed]:', err);
    }
  }
});

// ──────────────────────────────────────────
// 6. DECLARATIVENETREQUEST: ORIGIN / REFERER MASKING FOR ZERO-TAB WEB SESSION
// ──────────────────────────────────────────

async function setupDeclarativeNetRules() {
  if (typeof chrome === 'undefined' || !chrome.declarativeNetRequest?.updateDynamicRules) return;

  const extId = chrome.runtime?.id;
  const initiatorCondition = extId ? { initiatorDomains: [extId] } : {};

  const rules = [
    {
      id: 9001,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'Origin', operation: 'set', value: 'https://chatgpt.com' },
          { header: 'Referer', operation: 'set', value: 'https://chatgpt.com/' },
          { header: 'Sec-Fetch-Site', operation: 'set', value: 'same-origin' }
        ]
      },
      condition: {
        urlFilter: '||chatgpt.com/*',
        resourceTypes: ['xmlhttprequest'],
        ...initiatorCondition
      }
    },
    {
      id: 9002,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'Origin', operation: 'set', value: 'https://gemini.google.com' },
          { header: 'Referer', operation: 'set', value: 'https://gemini.google.com/app' },
          { header: 'Sec-Fetch-Site', operation: 'set', value: 'same-origin' }
        ]
      },
      condition: {
        urlFilter: '||gemini.google.com/*',
        resourceTypes: ['xmlhttprequest'],
        ...initiatorCondition
      }
    },
    {
      id: 9003,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [
          { header: 'Origin', operation: 'set', value: 'https://chat.deepseek.com' },
          { header: 'Referer', operation: 'set', value: 'https://chat.deepseek.com/' },
          { header: 'Sec-Fetch-Site', operation: 'set', value: 'same-origin' }
        ]
      },
      condition: {
        urlFilter: '||chat.deepseek.com/*',
        resourceTypes: ['xmlhttprequest'],
        ...initiatorCondition
      }
    }
  ];

  try {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [9001, 9002, 9003],
      addRules: rules
    });
  } catch (err) {
    console.warn('[Fastfiller: Background] DeclarativeNetRequest note:', err);
  }
}

// Initialize header masking rules
setupDeclarativeNetRules();

// Listener for HUD in-page Undo trigger, badge direct fill, and web session orchestration
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'START_FILL_JOB') {
    startFillJob(msg)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  } else if (msg.type === 'GET_FILL_JOB_STATE') {
    const job = activeFillJobs.get(msg.tabId);
    sendResponse({ success: true, job: sanitizeJobForBroadcast(job) });
  } else if (msg.type === 'CANCEL_FILL_JOB') {
    cancelFillJob(msg.tabId, msg.runId);
    sendResponse({ success: true });
  } else if (msg.type === 'DISPATCH_STAGED_FILL') {
    dispatchStagedFill(msg)
      .then((res) => sendResponse(res))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  } else if (msg.type === 'EXECUTE_PAGE_UNDO') {
    const targetTabId = msg.tabId || sender?.tab?.id;
    if (targetTabId) {
      chrome.tabs.sendMessage(targetTabId, { type: 'UNDO_FILL' }, (resp) => {
        if (resp?.success) {
          showInPageToast(targetTabId, `Restored ${resp.restoredCount || 0} fields to prior state.`, 'info', false);
        }
      });
    }
  } else if (msg.type === 'TRIGGER_DIRECT_FILL') {
    const targetTab = sender?.tab;
    if (targetTab) {
      triggerDirectFill(targetTab);
    }
  } else if (msg.type === 'EXECUTE_WEB_SESSION_PROMPT') {
    executeWebSessionPrompt(msg.engine || 'chatgpt', msg.prompt, msg.timeout || 60000)
      .then((text) => sendResponse({ success: true, text }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async response
  } else if (msg.type === 'CHECK_WEB_SESSION_STATUS') {
    checkWebSessionStatus(msg.engine || 'chatgpt')
      .then((status) => sendResponse(status))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});



