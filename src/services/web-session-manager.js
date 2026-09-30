// ============================================================
// FastFiller — Web Session AI Manager
// Central Router for Zero-Key Browser Session AI Engines
// (ChatGPT Web · DeepSeek Web)
// ============================================================

import { queryChatGPTWebSession, checkSessionStatus as checkChatGPTSessionStatus } from './chatgpt-session.js';
import { queryDeepSeekWebSession, checkDeepSeekSessionStatus } from './deepseek-session.js';

export const WEB_SESSION_ENGINES = {
  chatgpt: {
    id: 'chatgpt',
    name: 'ChatGPT Web',
    shortName: 'ChatGPT',
    domain: 'chatgpt.com',
    loginUrl: 'https://chatgpt.com',
    description: 'FastFiller communicates directly with your logged-in ChatGPT session. No API keys, no subscriptions, and zero cloud intermediaries. Stay logged in to ChatGPT.com.',
    checkStatus: checkChatGPTSessionStatus,
    query: queryChatGPTWebSession
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek Web',
    shortName: 'DeepSeek',
    domain: 'chat.deepseek.com',
    loginUrl: 'https://chat.deepseek.com',
    description: 'FastFiller communicates directly with your logged-in DeepSeek session. No API keys, no subscriptions, and zero cloud intermediaries. Stay logged in to chat.deepseek.com.',
    checkStatus: checkDeepSeekSessionStatus,
    query: queryDeepSeekWebSession
  }
};

/**
 * Resolves the active Web Session AI engine ID from storage or defaults to 'chatgpt'.
 */
export function resolveWebEngineId(engineKey) {
  if (!engineKey) return 'chatgpt';
  const clean = engineKey.toLowerCase().replace('_web', '');
  return WEB_SESSION_ENGINES[clean] ? clean : 'chatgpt';
}

/**
 * Dispatches a prompt to the requested Web Session AI engine.
 */
export async function executeWebSessionPrompt(engineKey, promptText, timeoutMs = 60000) {
  const engineId = resolveWebEngineId(engineKey);
  const engine = WEB_SESSION_ENGINES[engineId];
  if (!engine || typeof engine.query !== 'function') {
    throw new Error(`Unsupported Web Session AI engine: "${engineKey}"`);
  }
  return await engine.query(promptText, timeoutMs);
}

/**
 * Checks authentication and readiness of a specific Web Session AI engine.
 * Always guarantees a normalized response structure with `success: true`.
 */
export async function checkWebSessionStatus(engineKey) {
  const engineId = resolveWebEngineId(engineKey);
  const engine = WEB_SESSION_ENGINES[engineId];
  if (!engine || typeof engine.checkStatus !== 'function') {
    return {
      success: false,
      authenticated: false,
      error: `Unknown engine: "${engineKey}"`,
      loginUrl: 'https://chatgpt.com'
    };
  }
  try {
    const res = await engine.checkStatus();
    return {
      success: true,
      authenticated: Boolean(res?.authenticated),
      engine: engineId,
      user: res?.user || null,
      loginUrl: res?.loginUrl || engine.loginUrl,
      error: res?.error || null,
      tabOpen: res?.tabOpen ?? true
    };
  } catch (err) {
    return {
      success: false,
      authenticated: false,
      engine: engineId,
      loginUrl: engine.loginUrl,
      error: err.message || 'Session status check failed'
    };
  }
}
