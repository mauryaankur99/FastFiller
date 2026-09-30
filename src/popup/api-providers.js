/**
 * FastFiller — AI Provider Registry & Multi-Engine Client
 * Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com
 * Licensed under the MIT License.
 * Authors: Maurya Ankur (https://www.linkedin.com/in/ankur-maurya1/), Singh Sanjiv (https://www.linkedin.com/in/sanjiv-singh/)
 * Organization: Aeigs (https://aeigs.com)
 */

import { executeWebSessionPrompt, checkWebSessionStatus } from '../services/web-session-manager.js';

export const WEB_SESSION_SUB_ENGINES = [
  {
    id: 'chatgpt',
    name: 'ChatGPT Web',
    shortName: 'ChatGPT',
    badge: 'chatgpt.com',
    domain: 'chatgpt.com',
    loginUrl: 'https://chatgpt.com',
    title: 'ChatGPT Web Session',
    description: 'FastFiller connects directly to your active browser login at chatgpt.com. No API key, token, or paid subscription required.',
    instruction: 'Keep ChatGPT open and signed in in a browser tab. Form filling runs locally through your existing session.',
    noticeText: 'FastFiller connects directly to your active browser login at chatgpt.com. No API key or paid subscription needed. Simply keep ChatGPT open and signed in in your browser.'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek Web',
    shortName: 'DeepSeek',
    badge: 'chat.deepseek.com',
    domain: 'chat.deepseek.com',
    loginUrl: 'https://chat.deepseek.com',
    title: 'DeepSeek Web Session',
    description: 'FastFiller connects directly to your active browser login at chat.deepseek.com. No API key, token, or paid subscription required.',
    instruction: 'Keep DeepSeek open and signed in in a browser tab. Form filling runs locally through your existing session.',
    noticeText: 'FastFiller connects directly to your active browser login at chat.deepseek.com. No API key or paid subscription needed. Simply keep chat.deepseek.com open and signed in in your browser.'
  }
];

export const PROVIDERS_REGISTRY = {
  chatgpt_web: {
    id: 'chatgpt_web',
    name: 'Web Session AI',
    badge: 'Zero-Key (Free)',
    badgeColor: '#10a37f',
    format: 'web_session',
    requiresKey: false,
    endpoint: 'https://chatgpt.com',
    defaultModel: 'chatgpt',
    models: [
      { id: 'chatgpt', label: 'ChatGPT Web', tag: 'chatgpt.com' },
      { id: 'deepseek', label: 'DeepSeek Web', tag: 'chat.deepseek.com' }
    ],
    keyUrl: 'https://chatgpt.com',
    hint: 'Uses your existing logged-in browser session (ChatGPT or DeepSeek). 100% free with zero API keys.'
  },
  custom: {
    id: 'custom',
    name: 'Custom AI API',
    badge: 'Universal BYOK',
    badgeColor: '#38bdf8',
    format: 'openai',
    requiresKey: false,
    endpoint: '',
    defaultModel: '',
    models: [],
    keyUrl: '',
    hint: 'Universal OpenAI-compatible gateway (Groq, OpenAI, DeepSeek, OpenRouter, Ollama, LM Studio, etc.).'
  }
};

export const CUSTOM_PROVIDER_PRESETS = [
  {
    id: 'groq',
    name: 'Groq',
    badge: 'Ultra Fast (~300ms)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultModel: 'llama-3.3-70b-versatile',
    model: 'llama-3.3-70b-versatile',
    keyUrl: 'https://console.groq.com/keys',
    format: 'openai'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    badge: 'GPT-4o Mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultModel: 'gpt-4o-mini',
    model: 'gpt-4o-mini',
    keyUrl: 'https://platform.openai.com/api-keys',
    format: 'openai'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    badge: '3.5 Flash-Lite · Ultra Fast',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    defaultModel: 'gemini-3.5-flash-lite',
    model: 'gemini-3.5-flash-lite',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    format: 'gemini'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    badge: 'Claude 3.5 Sonnet',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultModel: 'claude-3-5-sonnet-latest',
    model: 'claude-3-5-sonnet-latest',
    keyUrl: 'https://console.anthropic.com/',
    format: 'anthropic'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'Lowest Cost',
    endpoint: 'https://api.deepseek.com/chat/completions',
    defaultModel: 'deepseek-chat',
    model: 'deepseek-chat',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    format: 'openai'
  },
  {
    id: 'nvidia',
    name: 'NVIDIA',
    badge: 'NIM (Free Credits)',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    model: 'meta/llama-3.3-70b-instruct',
    keyUrl: 'https://build.nvidia.com/',
    format: 'openai'
  },
  {
    id: 'meta',
    name: 'Meta',
    badge: 'Llama 3.3 70B',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    keyUrl: 'https://api.together.xyz/settings/api-keys',
    format: 'openai'
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: '200+ Models',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    model: 'meta-llama/llama-3.3-70b-instruct',
    keyUrl: 'https://openrouter.ai/keys',
    format: 'openai'
  },
  {
    id: 'ollama',
    name: 'Ollama',
    badge: '100% Private (Local)',
    endpoint: 'http://localhost:11434/v1/chat/completions',
    defaultModel: 'llama3.2',
    model: 'llama3.2',
    keyUrl: 'https://ollama.com',
    format: 'openai'
  },
  {
    id: 'opencode',
    name: 'OpenCode Free',
    badge: 'Zero-Auth Free Tier',
    endpoint: 'https://opencode.ai/zen/v1/chat/completions',
    defaultModel: 'space-bunny-free',
    model: 'space-bunny-free',
    requiresKey: false,
    keyUrl: 'https://opencode.ai',
    format: 'openai'
  }
];

export const FALLBACK_MODELS_BY_PROVIDER = {
  groq: [
    { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile', isFree: true, tag: 'Free Dev Tier' },
    { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant', isFree: true, tag: 'Free Dev Tier' },
    { id: 'mixtral-8x7b-32768', label: 'Mixtral 8x7B 32k', isFree: true, tag: 'Free Dev Tier' },
    { id: 'gemma2-9b-it', label: 'Gemma 2 9B IT', isFree: true, tag: 'Free Dev Tier' }
  ],
  openrouter: [
    { id: 'meta-llama/llama-3.3-70b-instruct:free', label: 'Meta: Llama 3.3 70B Instruct (free)', isFree: true, tag: 'Free' },
    { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek: DeepSeek R1 (free)', isFree: true, tag: 'Free' },
    { id: 'google/gemini-3.5-flash-lite:free', label: 'Google: Gemini 3.5 Flash-Lite (free)', isFree: true, tag: 'Free' },
    { id: 'mistralai/mistral-7b-instruct:free', label: 'Mistral: Mistral 7B Instruct (free)', isFree: true, tag: 'Free' },
    { id: 'meta-llama/llama-3.3-70b-instruct', label: 'Meta: Llama 3.3 70B Instruct', isFree: false, tag: 'Standard' }
  ],
  gemini: [
    { id: 'gemini-3.5-flash-lite', label: 'Gemini 3.5 Flash Lite (Ultra Fast · Free Tier)', isFree: true, tag: 'Ultra-Fast · Free' },
    { id: 'gemini-3.5-flash', label: 'Gemini 3.5 Flash (Balanced Reasoning · Free Tier)', isFree: true, tag: 'Balanced · Free' },
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', isFree: true, tag: 'Fast · Free' },
    { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash', isFree: true, tag: 'Free' }
  ],
  openai: [
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini', isFree: false, tag: 'Fast & Affordable' },
    { id: 'gpt-4o', label: 'GPT-4o', isFree: false, tag: 'Flagship' },
    { id: 'o3-mini', label: 'o3-mini', isFree: false, tag: 'Reasoning' }
  ],
  anthropic: [
    { id: 'claude-3-7-sonnet-latest', label: 'Claude 3.7 Sonnet', isFree: false, tag: 'Flagship' },
    { id: 'claude-3-5-sonnet-latest', label: 'Claude 3.5 Sonnet', isFree: false, tag: 'Standard' },
    { id: 'claude-3-5-haiku-latest', label: 'Claude 3.5 Haiku', isFree: false, tag: 'Fast' }
  ],
  deepseek: [
    { id: 'deepseek-chat', label: 'DeepSeek V4 Flash (Fast Structured API)', isFree: false, tag: 'High-Speed API' },
    { id: 'deepseek-reasoner', label: 'DeepSeek V4 Pro (Deep Reasoning)', isFree: false, tag: 'Pro Reasoning' }
  ],
  nvidia: [
    { id: 'meta/llama-3.3-70b-instruct', label: 'Meta Llama 3.3 70B', isFree: false, tag: 'NIM' },
    { id: 'deepseek-ai/deepseek-r1', label: 'DeepSeek R1', isFree: false, tag: 'NIM' }
  ],
  meta: [
    { id: 'meta-llama/Llama-3.3-70B-Instruct-Turbo', label: 'Llama 3.3 70B Turbo', isFree: false, tag: 'Together' },
    { id: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo', label: 'Llama 3.1 8B Turbo', isFree: false, tag: 'Together' }
  ],
  ollama: [
    { id: 'llama3.2', label: 'llama3.2', isFree: true, tag: 'Local & Free' },
    { id: 'llama3.1', label: 'llama3.1', isFree: true, tag: 'Local & Free' },
    { id: 'mistral', label: 'mistral', isFree: true, tag: 'Local & Free' },
    { id: 'deepseek-r1:8b', label: 'deepseek-r1:8b', isFree: true, tag: 'Local & Free' }
  ],
  opencode: [
    { id: 'space-bunny-free', label: 'Space Bunny (Verified Zero-Auth · Free)', isFree: true, tag: 'Zero-Auth' }
  ]
};

// Non-chat model patterns (Audio/TTS, Image/Video generation, Embeddings, Moderation, Nano toys)
export const NON_CHAT_MODEL_PATTERNS = [
  // Audio & Speech
  /\btts\b/i,
  /-tts\b/i,
  /\btts-/i,
  /\baudio\b/i,
  /whisper/i,
  /realtime/i,
  /transcription/i,
  /speech/i,

  // Image & Video generation
  /image-preview/i,
  /imagen/i,
  /dall-e/i,
  /\bimage\b/i,
  /\bvideo\b/i,
  /\bsora\b/i,
  /flux/i,
  /diffusion/i,

  // Embeddings, Moderation & Rerank
  /embed/i,
  /\bbge-/i,
  /moderation/i,
  /prompt-guard/i,
  /safeguard/i,
  /rerank/i,
  /reward/i,

  // Audio / TTS models with non-standard names
  /orpheus/i,

  // Nano, Banana & experimental non-text endpoints
  /banana/i,
  /\bnano\b/i,
  /nano-/i,
  /-nano\b/i
];

/**
 * Checks whether a model ID or display name represents a general text/chat completion model,
 * filtering out non-chat models (audio, TTS, embeddings, image-gen, nano toys).
 */
export function isChatModel(modelId = '', displayName = '') {
  if (!modelId && !displayName) return false;
  const str = `${modelId} ${displayName}`;
  for (const pattern of NON_CHAT_MODEL_PATTERNS) {
    if (pattern.test(str)) {
      return false;
    }
  }
  return true;
}

/**
 * Dynamically queries a provider's model API to discover available models.
 * Flags free models and handles local/remote fallback gracefully.
 */
export async function fetchProviderModels(providerId, profile = {}, throwOnError = false) {
  const apiKey = (profile.apiKey || '').trim();
  const endpoint = (profile.endpoint || profile.defaultEndpoint || '').trim();

  function norm(id, label, isFree = false, tag = '') {
    return {
      id: String(id),
      label: label || id,
      isFree: Boolean(isFree),
      tag: tag || (isFree ? 'Free' : '')
    };
  }

  try {
    switch (providerId) {
      case 'openrouter': {
        const headers = { 'HTTP-Referer': 'https://fastfiller.ai', 'X-Title': 'FastFiller' };
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const res = await fetch('https://openrouter.ai/api/v1/models', { headers });
        if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
        const json = await res.json();
        const rawList = Array.isArray(json.data) ? json.data : [];
        if (rawList.length === 0) throw new Error('No models returned from OpenRouter.');
        const models = rawList
          .filter((m) => isChatModel(m.id, m.name || ''))
          .map((m) => {
            const isFree = m.id.endsWith(':free') || (m.pricing?.prompt === '0' && m.pricing?.completion === '0');
            const ctx = m.context_length ? `${Math.round(m.context_length / 1024)}k` : '';
            return norm(m.id, m.name || m.id, isFree, isFree ? 'Free' : ctx);
          });
        return models.sort((a, b) => (b.isFree ? 1 : 0) - (a.isFree ? 1 : 0) || a.id.localeCompare(b.id));
      }

      case 'ollama': {
        const baseUrl = endpoint.replace(/\/v1\/chat\/completions\/?$/, '').replace(/\/+$/, '') || 'http://localhost:11434';
        try {
          const res = await fetch(`${baseUrl}/api/tags`);
          if (res.ok) {
            const json = await res.json();
            if (Array.isArray(json.models) && json.models.length > 0) {
              return json.models
                .filter((m) => isChatModel(m.name || m.model || ''))
                .map((m) => {
                  const name = m.name || m.model;
                  const sizeGb = m.size ? `${(m.size / (1024 * 1024 * 1024)).toFixed(1)}GB` : 'Local';
                  return norm(name, name, true, `Local · ${sizeGb}`);
                });
            }
          }
        } catch {}

        const res2 = await fetch(`${baseUrl}/v1/models`);
        if (res2.ok) {
          const json2 = await res2.json();
          const list = Array.isArray(json2.data) ? json2.data : [];
          if (list.length > 0) {
            return list
              .filter((m) => isChatModel(m.id))
              .map((m) => norm(m.id, m.id, true, 'Local · Free'));
          }
        }
        throw new Error(`Ollama not reachable at ${baseUrl}. Ensure Ollama is running.`);
      }

      case 'gemini': {
        if (!apiKey) throw new Error('API key required to fetch Google Gemini models.');
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) {
          const res2 = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/models', {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });
          if (!res2.ok) throw new Error(`Gemini HTTP ${res.status}`);
          const json2 = await res2.json();
          const list = Array.isArray(json2.data) ? json2.data : [];
          return list
            .filter((m) => {
              const id = (m.id || '').toLowerCase();
              return !id.includes('-1.') && !id.includes('-2.') && isChatModel(id);
            })
            .map((m) => {
              const isFree = m.id.includes('flash') || m.id.includes('lite');
              return norm(m.id, m.id, isFree, isFree ? 'Free Tier' : '');
            });
        }
        const json = await res.json();
        const rawList = Array.isArray(json.models) ? json.models : [];
        return rawList
          .filter((m) => {
            const cleanId = (m.name || '').replace(/^models\//, '').toLowerCase();
            const displayName = m.displayName || '';
            const isOld = cleanId.includes('1.0') || cleanId.includes('-001');
            const hasChatGen = (m.supportedGenerationMethods || []).includes('generateContent');
            return hasChatGen && !isOld && isChatModel(cleanId, displayName);
          })
          .map((m) => {
            const cleanId = (m.name || '').replace(/^models\//, '');
            const isFree = cleanId.includes('flash') || cleanId.includes('lite');
            return norm(cleanId, m.displayName || cleanId, isFree, isFree ? 'Free Tier' : '');
          })
          .sort((a, b) => (b.isFree ? 1 : 0) - (a.isFree ? 1 : 0));
      }

      case 'groq': {
        if (!apiKey) throw new Error('API key required to fetch Groq models.');
        const modelsUrl = endpoint.replace(/\/chat\/completions\/?$/, '/models') || 'https://api.groq.com/openai/v1/models';
        const res = await fetch(modelsUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        return list
          .filter((m) => m.active !== false && isChatModel(m.id))
          .map((m) => norm(m.id, m.id, true, 'Free Dev Tier'));
      }

      case 'openai': {
        if (!apiKey) throw new Error('API key required to fetch OpenAI models.');
        const modelsUrl = endpoint.replace(/\/chat\/completions\/?$/, '/models') || 'https://api.openai.com/v1/models';
        const res = await fetch(modelsUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        return list
          .filter((m) => {
            const id = m.id.toLowerCase();
            return (id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3') || id.startsWith('chatgpt-')) && isChatModel(id);
          })
          .map((m) => norm(m.id, m.id, false, 'Standard Tier'))
          .sort((a, b) => a.id.localeCompare(b.id));
      }

      case 'anthropic': {
        if (!apiKey) throw new Error('API key required to fetch Anthropic models.');
        try {
          const res = await fetch('https://api.anthropic.com/v1/models', {
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true'
            }
          });
          if (res.ok) {
            const json = await res.json();
            const list = Array.isArray(json.data) ? json.data : [];
            if (list.length > 0) {
              return list
                .filter((m) => isChatModel(m.id, m.display_name || ''))
                .map((m) => norm(m.id, m.display_name || m.id, false, 'Standard Tier'));
            }
          }
        } catch {}
        return FALLBACK_MODELS_BY_PROVIDER.anthropic;
      }

      case 'deepseek': {
        if (!apiKey) throw new Error('API key required to fetch DeepSeek models.');
        const res = await fetch('https://api.deepseek.com/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error(`DeepSeek HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        return list
          .filter((m) => isChatModel(m.id))
          .map((m) => norm(m.id, m.id, false, 'Pay-per-use'));
      }

      case 'nvidia': {
        if (!apiKey) throw new Error('API key required to fetch NVIDIA models.');
        const res = await fetch('https://integrate.api.nvidia.com/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error(`NVIDIA HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : [];
        return list
          .filter((m) => isChatModel(m.id))
          .map((m) => norm(m.id, m.id, false, 'NIM'));
      }

      case 'meta': {
        if (!apiKey) throw new Error('API key required to fetch Together models.');
        const res = await fetch('https://api.together.xyz/v1/models', {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!res.ok) throw new Error(`Together HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json) ? json : (json.data || []);
        return list
          .filter((m) => (!m.type || m.type === 'chat') && isChatModel(m.id))
          .map((m) => norm(m.id, m.id, false, 'Together AI'));
      }

      case 'opencode': {
        // User requested: isolate OpenCode strictly to the only verified zero-auth model
        return [
          norm('space-bunny-free', 'Space Bunny (Verified Zero-Auth · Free)', true, 'Zero-Auth')
        ];
      }

      case 'custom':
      default: {
        if (!endpoint) throw new Error('Endpoint URL is required for Custom provider.');
        let modelsUrl = endpoint.replace(/\/chat\/completions\/?$/, '/models');
        if (!modelsUrl.endsWith('/models')) {
          modelsUrl = modelsUrl.replace(/\/+$/, '') + '/models';
        }
        const headers = {};
        if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;
        const res = await fetch(modelsUrl, { headers });
        if (!res.ok) throw new Error(`Custom endpoint returned HTTP ${res.status}`);
        const json = await res.json();
        const list = Array.isArray(json.data) ? json.data : (Array.isArray(json.models) ? json.models : []);
        if (list.length === 0) throw new Error('No models returned from /models endpoint.');
        return list
          .filter((m) => isChatModel(m.id || m.name || ''))
          .map((m) => {
            const id = m.id || m.name;
            return norm(id, id, false, 'Custom Gateway');
          });
      }
    }
  } catch (err) {
    if (throwOnError || providerId === 'custom') {
      throw err;
    }
    const fallbacks = FALLBACK_MODELS_BY_PROVIDER[providerId];
    if (fallbacks && fallbacks.length > 0) {
      return fallbacks;
    }
    throw err;
  }
}

export const DEFAULT_SYSTEM_PROMPT = `You are a strict, precision form-filling engine. Map user-provided information to detected form fields.
Return ONLY a raw JSON object: {"<field_class>": "<value>"} with no markdown, backticks, or extra text.

CORE COMPLIANCE RULES:
1. STRICT DATA FIDELITY:
   - Use provided user data exactly as given. Do not alter, reformat, or guess facts.
   - Separate Names: Split cleanly into first and last name ONLY when separate first/last fields exist.
   - Formats: Follow standard formats (YYYY-MM-DD for dates, clean digits for phone, valid emails).

2. MISSING VALUES & PROFILES:
   - If a value is missing from user data, omit it or leave blank (""). NEVER invent random facts for factual profiles.
   - Dropdowns: Match closest option for user data. Never select placeholder options ("Select", "-- Select --").
   - Dependent/AJAX Dropdowns (marked dependent=true): Always output user's profile value even if options are not yet loaded.

3. FAKE / DEMO DATA DIRECTIVES:
   - When user explicitly requests fake, dummy, demo, mock, sample, or random data (e.g. "Fill form with fake details"):
     Generate realistic, coherent synthetic values for all detected fields (valid human names, @example.com emails, matching dropdown options, messages).
   - If partial data is provided, use real values for specified fields and synthetic data for the rest.

4. SELECTION & CONTROLS:
   - Radios: Return matching value/true ONLY for the single chosen option.
   - Checkboxes: Return true only for requested or required consent options.
   - Directives: Instructions like "dont fill", "leave blank", "skip", or "मत भरना" mean LEAVE BLANK (""). Never type them into fields. Legitimate values like "N/A" or "None" are valid entries.
   - Never invent or fill CAPTCHAs, OTPs, or security verification codes.
   - Keys in output JSON must strictly match the exact field class provided (e.g. "form-filler-0-0").`;

export const SYSTEM_PROMPT_PRESETS = {
  default: DEFAULT_SYSTEM_PROMPT
};

/**
 * Prioritizes inputs on massive forms (e.g. 80+ fields):
 * 1. Inputs inside the active focused <form>
 * 2. Inputs currently in the user's viewport
 * 3. Required fields (req=true)
 * 4. Remaining inputs in DOM order
 */
export function prioritizeInputs(inputs) {
  if (!Array.isArray(inputs)) return [];
  return [...inputs].sort((a, b) => {
    const aActive = a.inActiveForm ? 1 : 0;
    const bActive = b.inActiveForm ? 1 : 0;
    if (aActive !== bActive) return bActive - aActive;

    const aVp = a.inViewport ? 1 : 0;
    const bVp = b.inViewport ? 1 : 0;
    if (aVp !== bVp) return bVp - aVp;

    const aReq = a.required ? 1 : 0;
    const bReq = b.required ? 1 : 0;
    if (aReq !== bReq) return bReq - aReq;

    return 0;
  });
}

/**
 * Splits inputs into manageable chunks (default 45 fields per chunk)
 * to avoid exceeding token limits and prevent latency spikes on massive forms.
 */
export function chunkInputs(inputs, chunkSize = 45) {
  if (!Array.isArray(inputs) || inputs.length === 0) return [[]];
  const prioritized = prioritizeInputs(inputs);
  const chunks = [];
  for (let i = 0; i < prioritized.length; i += chunkSize) {
    chunks.push(prioritized.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Builds messages payload for the AI model from visible page inputs.
 * Uses compact declarative serialization to save 50%+ tokens while preserving
 * rich semantic labels, section context (e.g. Shipping vs Billing), and page intent.
 */
export function buildMessages(systemPrompt, userText, inputs, pageContext = {}) {
  const visibleInputs = (inputs || []).filter((inp) => {
    if (inp.isVisible === false || inp.readonly || inp.isRadioGroupSecondary) return false;
    if (inp.disabled && !inp.isDependent) return false;
    const ident = `${inp.id || ''} ${inp.name || ''} ${inp.labelText || ''}`.toLowerCase();
    if (
      ident.includes('captcha') ||
      ident.includes('cpatcha') ||
      ident.includes('recaptcha') ||
      ident.includes('turnstile') ||
      ident.includes('hcaptcha') ||
      /\b\d{4,6}_txt\b/.test(ident) ||
      /\btemp\b/i.test(ident) ||
      /temp$/i.test(inp.id || '') ||
      /temp$/i.test(inp.name || '')
    ) {
      return false;
    }
    return true;
  });

  const formattedLines = visibleInputs.map((inp) => {
    const parts = [`[${inp.class}] type=${inp.type || 'text'}`];
    const label = inp.labelText || inp['aria-label'] || inp.placeholder || inp.name;
    if (label) parts.push(`label="${String(label).replace(/"/g, "'")}"`);
    if (inp.placeholder && inp.placeholder !== label) {
      parts.push(`placeholder="${String(inp.placeholder).replace(/"/g, "'")}"`);
    }
    if (inp.name && inp.name !== label && inp.name !== inp.placeholder) {
      parts.push(`name="${String(inp.name).replace(/"/g, "'")}"`);
    }
    if (inp.sectionHeader) parts.push(`section="${String(inp.sectionHeader).replace(/"/g, "'")}"`);
    if (inp.required) parts.push('req=true');
    if (inp.isDependent) parts.push('dependent=true');
    if (inp.options && inp.options.length > 0) {
      const opts = inp.options.slice(0, 30).map((o) => `"${String(o).replace(/"/g, "'")}"`);
      parts.push(`options=[${opts.join(',')}]`);
    } else if (inp.radioOptions && inp.radioOptions.length > 0) {
      const opts = inp.radioOptions.slice(0, 10).map((o) => `"${String(o).replace(/"/g, "'")}"`);
      parts.push(`options=[${opts.join(',')}]`);
    }
    if (inp.maxLength && inp.maxLength > 0 && inp.maxLength < 500) {
      parts.push(`max=${inp.maxLength}`);
    }
    return parts.join(' | ');
  });

  let contextHeader = '';
  const metaParts = [];
  if (pageContext.domain) metaParts.push(`Domain: ${pageContext.domain}`);
  if (pageContext.pageTitle) metaParts.push(`Page: ${pageContext.pageTitle}`);
  const seed = `${Date.now().toString(36)}-${Math.floor(Math.random() * 10000)}`;
  metaParts.push(`Session-Seed: ${seed}`);

  contextHeader = `--- PAGE CONTEXT ---
${metaParts.join(' | ')}

`;

  const isFakeRequested = isFakeDataRequested(userText);
  const fakeDirectiveHeader = isFakeRequested
    ? `\n[DIRECTIVE: User explicitly requested fake/dummy/demo details. Please generate realistic synthetic values for all detected fields (valid human names, @example.com emails, matching options, messages). Do NOT return empty fields.]\n`
    : '';

  const userMessage = `${contextHeader}--- USER INFORMATION & INSTRUCTIONS ---
${userText}
${fakeDirectiveHeader}
--- FORM FIELDS ON ACTIVE PAGE ---
Reminder: For cascading/dependent dropdowns (District, Sub-Division, Block, Tehsil, Ward, Municipal Corporation, etc. marked dependent=true), output the user's exact value from their profile even if options are not yet loaded on page.
${formattedLines.join('\n')}`;

  const effectivePrompt = (systemPrompt && typeof systemPrompt === 'string' && systemPrompt.trim())
    ? systemPrompt.trim()
    : DEFAULT_SYSTEM_PROMPT;

  return [
    { role: 'system', content: effectivePrompt },
    { role: 'user', content: userMessage }
  ];
}

/**
 * Auto-repairs truncated or abruptly cut-off JSON outputs from the LLM.
 * Closes unclosed quotes, strips dangling incomplete keys, and balances braces.
 */
export function repairTruncatedJSON(str) {
  if (!str || typeof str !== 'string') return '{}';
  let candidate = str.trim();

  const start = candidate.indexOf('{');
  if (start === -1) return '{}';
  candidate = candidate.slice(start);

  // Fast path: already valid JSON
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {}

  const balanceBraces = (s) => {
    let balanced = s;
    const open = (balanced.match(/\{/g) || []).length;
    const close = (balanced.match(/\}/g) || []).length;
    for (let i = 0; i < open - close; i++) {
      balanced += '}';
    }
    return balanced;
  };

  // Attempt 1: Check if closing an unclosed string + balancing braces produces valid JSON
  let attempt1 = candidate;
  const cleanQuotes1 = attempt1.replace(/\\"/g, '');
  const quoteCount1 = (cleanQuotes1.match(/"/g) || []).length;
  if (quoteCount1 % 2 !== 0) {
    attempt1 += '"';
  }
  attempt1 = attempt1.replace(/,\s*$/, '');
  attempt1 = balanceBraces(attempt1);
  try {
    JSON.parse(attempt1);
    return attempt1;
  } catch {}

  // Attempt 2: Cut-off at key, trailing colon, or unclosed key without value
  let attempt2 = candidate;
  const cleanQuotes2 = attempt2.replace(/\\"/g, '');
  if ((cleanQuotes2.match(/"/g) || []).length % 2 !== 0) {
    attempt2 += '"';
  }

  // Strip trailing incomplete key with colon: , "key" : "incomplete" or , "key":
  attempt2 = attempt2.replace(/,\s*"[^"]*"\s*:\s*.*$/, '');
  // Strip trailing incomplete key without colon: , "key"
  attempt2 = attempt2.replace(/,\s*"[^"]*"\s*:?\s*$/, '');
  // Strip trailing unquoted dangling text after comma
  attempt2 = attempt2.replace(/,\s*[^,{}]+$/, '');
  // Strip trailing comma
  attempt2 = attempt2.replace(/,\s*$/, '');

  attempt2 = balanceBraces(attempt2);
  try {
    JSON.parse(attempt2);
    return attempt2;
  } catch {}

  // Attempt 3: Progressive fallback to the last valid comma
  const lastComma = candidate.lastIndexOf(',');
  if (lastComma !== -1) {
    let attempt3 = candidate.slice(0, lastComma);
    attempt3 = balanceBraces(attempt3);
    try {
      JSON.parse(attempt3);
      return attempt3;
    } catch {}
  }

  return '{}';
}

/**
 * Resolves dynamic template variables in user text:
 * {{today}}, {{today_formatted}}, {{today_us}}, {{in_2_weeks}}, {{tomorrow}}, {{year}}, {{month}}
 */
export function resolveDynamicTemplateVariables(text) {
  if (!text || typeof text !== 'string') return '';
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const todayISO = `${yyyy}-${mm}-${dd}`;

  const todayUS = `${mm}/${dd}/${yyyy}`;

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const todayFormatted = `${months[now.getMonth()]} ${now.getDate()}, ${yyyy}`;

  const twoWeeksLater = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in2WeeksISO = `${twoWeeksLater.getFullYear()}-${String(twoWeeksLater.getMonth() + 1).padStart(2, '0')}-${String(twoWeeksLater.getDate()).padStart(2, '0')}`;

  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const tomorrowISO = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;

  return text
    .replace(/\{\{\s*today\s*\}\}/gi, todayISO)
    .replace(/\{\{\s*today_formatted\s*\}\}/gi, todayFormatted)
    .replace(/\{\{\s*today_us\s*\}\}/gi, todayUS)
    .replace(/\{\{\s*in_2_weeks\s*\}\}/gi, in2WeeksISO)
    .replace(/\{\{\s*tomorrow\s*\}\}/gi, tomorrowISO)
    .replace(/\{\{\s*year\s*\}\}/gi, String(yyyy))
    .replace(/\{\{\s*month\s*\}\}/gi, mm);
}

/**
 * Robust JSON Parser for AI output:
 * Handles <think> reasoning tags (DeepSeek R1 / Qwen), markdown code blocks,
 * regex extraction of outermost braces, trailing commas, and truncated stream auto-repair.
 */
export function parseAIResponse(raw) {
  if (!raw || typeof raw !== 'string') {
    throw new Error('Empty response received from AI model.');
  }

  // 1. Remove reasoning / thought tags (DeepSeek R1, Qwen, etc.)
  let cleaned = raw.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Extract content from markdown code blocks anywhere in the text
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    cleaned = codeBlockMatch[1].trim();
  } else {
    cleaned = cleaned.replace(/^```(?:json)?\s*/im, '').replace(/\s*```$/m, '').trim();
  }

  // Helper to sanitize common LLM JSON flaws: strip comments and trailing commas
  const sanitizeJSONString = (str) => {
    return str
      // Remove single-line comments // ...
      .replace(/\/\/[^\n\r]*/g, '')
      // Remove multi-line comments /* ... */
      .replace(/\/\*[\s\S]*?\*\//g, '')
      // Remove trailing commas before } or ]
      .replace(/,\s*([}\]])/g, '$1')
      .trim();
  };

  // Direct parse attempt
  try {
    const parsed = JSON.parse(cleaned);
    return parsed.values || parsed;
  } catch {}

  try {
    const sanitized = sanitizeJSONString(cleaned);
    const parsed = JSON.parse(sanitized);
    return parsed.values || parsed;
  } catch {}

  // 3. Extract between first '{' and last '}'
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    const candidate = cleaned.substring(start, end + 1);
    try {
      const parsed = JSON.parse(candidate);
      return parsed.values || parsed;
    } catch {}

    try {
      const sanitized = sanitizeJSONString(candidate);
      const parsed = JSON.parse(sanitized);
      return parsed.values || parsed;
    } catch {}
  }

  // 4. Attempt auto-repair on truncated JSON
  try {
    const repaired = repairTruncatedJSON(sanitizeJSONString(cleaned));
    const parsed = JSON.parse(repaired);
    if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
      return parsed.values || parsed;
    }
  } catch {}

  // 5. Ultimate Fallback: Direct Regex Key-Value Extraction
  // Even if the JSON syntax was broken by conversational filler text, extract all "key": "value" pairs!
  const extracted = {};
  const kvRegex = /["']?([a-zA-Z0-9_\-\.]{1,80})["']?\s*:\s*["']([^"'\r\n]*)["']/g;
  let match;
  while ((match = kvRegex.exec(cleaned)) !== null) {
    const k = match[1].trim();
    const v = match[2].trim();
    if (k && k !== 'values') {
      extracted[k] = v;
    }
  }

  if (Object.keys(extracted).length > 0) {
    return extracted;
  }

  console.error('[FastFiller: AI Parse Failed] Raw output was:', raw);
  throw new Error('AI returned an invalid JSON structure. Check your model selection or system prompt.');
}

/**
 * Detects whether a string or value is an explicit instructional directive to the filler
 * to leave a field blank (e.g. "dont fill this", "do not fill", "leave blank", "skip", "मत भरना").
 * 
 * NOTE: Legitimate form data values like "N/A", "Not Applicable", "None", "No", or "लागू नहीं"
 * are NOT directives — they are valid entries that users may legitimately need to submit or select.
 */
export function isNegativeDirectiveOrSkip(val) {
  if (val == null) return true;
  if (typeof val === 'boolean') return false;
  const str = String(val).trim().toLowerCase();
  if (!str) return true;

  // Single word instructions to skip or leave blank
  const single = str.replace(/[*.:_\/\\-]/g, '').trim();
  if (['skip', 'ignore', 'blank'].includes(single)) {
    return true;
  }

  // Hindi instructional phrases
  if (
    str.includes('मत भरना') ||
    str.includes('खाली छोड़ें') ||
    str.includes('खाली रखो') ||
    str.includes('खाली छोड़ो') ||
    str.includes('छोड़ दें') ||
    str.includes('छोड़ दो')
  ) {
    return true;
  }

  // Phrase-level regex checks (e.g. "dont fill this", "do not fill", "leave blank", "leave this field empty")
  const phraseRegex = /\b(dont\s+fill|don't\s+fill|do\s+not\s+fill|leave\s+blank|leave\s+empty|keep\s+blank|keep\s+empty|skip\s+this|ignore\s+this|mat\s+bharna|chhod\s+do|khali\s+rakho|khali\s+chode|khali\s+chhode)\b/i;
  if (phraseRegex.test(str)) {
    return true;
  }

  return false;
}

/**
 * Detects whether the user's instruction or prompt explicitly requests fake, dummy, demo,
 * mock, sample, random, or synthetic data.
 */
export function isFakeDataRequested(text) {
  if (!text || typeof text !== 'string') return false;
  const str = text.trim().toLowerCase();
  if (!str) return false;

  const standaloneDirectives = ['fake', 'dummy', 'mock', 'sample', 'synthetic', 'test data'];
  if (standaloneDirectives.includes(str)) {
    return true;
  }

  const fakePatterns = [
    /\b(fake|dummy|mock|synthetic|random|nakli)\s+(data|detail|details|info|information|value|values|profile|form|input|inputs|content)\b/i,
    /\b(fill|generate|create|use|populate|put|enter)\s+.*?\b(fake|dummy|mock|synthetic|random|sample|test)\b/i,
    /\b(fake|dummy|mock|synthetic|random)\s+(fill|filling)\b/i,
    /\b(test|testing|sample)\s+(data|detail|details|profile|value|values)\b/i,
    /\b(fake|dummy|nakli|kuch\s*bhi)\b.*?\b(bhar\s*do|bhardo|daal\s*do|dal\s*do|fill\s*karo|fill\s*kar\s*do|bharo|daalo)\b/i,
    /\b(demo\s+details|demo\s+data)\b.*?\b(bhar\s*do|bhardo|daal\s*do|fill\s*karo|fill\s*kar\s*do|bharo)\b/i,
    /\bfill\s+(the\s+)?form\s+with\s+(fake|dummy|sample|mock|random|test)\b/i,
    /\b(generate|fill)\s+(fake|dummy|mock|sample|random)\b/i
  ];

  return fakePatterns.some((pattern) => pattern.test(str));
}

/**
 * Generates realistic, context-appropriate synthetic values for a given form field
 * when fake/dummy/demo filling is explicitly requested by the user.
 */
export function generateSyntheticFieldValue(field, index = 0) {
  if (!field) return '';
  const type = (field.type || 'text').toLowerCase();
  const role = (field.role || '').toLowerCase();
  const label = (field.labelText || '').toLowerCase().replace(/[*:]/g, '').trim();
  const name = (field.name || '').toLowerCase();
  const id = (field.id || '').toLowerCase();
  const placeholder = (field.placeholder || '').toLowerCase();
  const ident = `${label} ${name} ${id} ${placeholder}`;

  // 1. Dropdowns / Select / Combobox / Listbox
  if (type === 'select' || type === 'select-one' || role === 'combobox' || role === 'listbox') {
    if (Array.isArray(field.options) && field.options.length > 0) {
      const validOpts = field.options.filter((opt) => {
        const s = String(opt).trim().toLowerCase();
        if (!s) return false;
        if (
          s.startsWith('select') ||
          s.startsWith('-- select') ||
          s.startsWith('- select') ||
          s.startsWith('choose') ||
          s.startsWith('-- choose') ||
          s.startsWith('please select') ||
          s === 'none'
        ) {
          return false;
        }
        return true;
      });
      if (validOpts.length > 0) {
        return validOpts[0];
      }
    }
    return '';
  }

  // 2. Checkboxes
  if (type === 'checkbox' || role === 'checkbox') {
    return 'true';
  }

  // 3. Radio buttons
  if (type === 'radio' || role === 'radio') {
    return 'true';
  }

  // 4. Textareas & Multiline Messages / Inquiries (Check BEFORE number and name)
  if (type === 'textarea' || /\b(message|comment|comments|description|note|notes|feedback|inquiry|query)\b/i.test(ident)) {
    if (/\b(address|street)\b/i.test(ident)) {
      return '123 Innovation Way, Suite 400';
    }
    return 'This is a sample inquiry to verify the form submission. Looking forward to your response.';
  }

  // 5. Email
  if (type === 'email' || /\b(email|e-mail|mail)\b/i.test(ident)) {
    const seed = index > 0 ? index : Math.floor(Math.random() * 899 + 100);
    return `alex.morgan${seed}@example.com`;
  }

  // 6. Phone / Mobile / Tel
  if (type === 'tel' || /\b(phone|mobile|contact|cell|tel)\b/i.test(ident)) {
    const basePhone = 9876543210 + (index % 100);
    if (field.maxLength && field.maxLength === 10) return String(basePhone);
    return `+1-555-${String(200 + index).padStart(3, '0')}-${String(1000 + index).padStart(4, '0')}`;
  }

  // 7. Postal Code / Zip / Pincode
  if (/\b(zip|postal|pincode|pin\s*code)\b/i.test(ident)) {
    return '90210';
  }

  // 8. Date / DOB / Birth
  if (type === 'date' || /\b(dob|birth|date\s*of\s*birth)\b/i.test(ident)) {
    return '1995-05-15';
  }
  if (type === 'date' || /\bdate\b/i.test(ident)) {
    return new Date().toISOString().split('T')[0];
  }

  // 9. Number / Age / Quantity / Experience
  if (type === 'number' || /\b(age|quantity|exp|experience|years)\b/i.test(ident)) {
    if (/\bage\b/i.test(ident)) return '28';
    if (/\b(exp|experience)\b/i.test(ident)) return '5';
    return '1';
  }

  // 10. Website / URL
  if (type === 'url' || /\b(website|url|link|portfolio)\b/i.test(ident)) {
    return 'https://example.com';
  }

  // 11. Names
  if (/\b(first\s*name|firstname|fname)\b/i.test(ident)) {
    return 'Alex';
  }
  if (/\b(last\s*name|lastname|lname|surname)\b/i.test(ident)) {
    return 'Morgan';
  }
  if (/\b(middle\s*name|middlename)\b/i.test(ident)) {
    return 'J.';
  }
  if (/\b(full\s*name|fullname|name|applicant)\b/i.test(ident)) {
    return 'Alex Morgan';
  }

  // 12. Company / Organization
  if (/\b(company|organization|org|employer|firm)\b/i.test(ident)) {
    return 'Acme Global Solutions';
  }

  // 13. Designation / Title / Role
  if (/\b(title|role|designation|position|job)\b/i.test(ident)) {
    return 'Software Engineer';
  }

  // 14. City / State / Country / Address
  if (/\b(address|street)\b/i.test(ident)) {
    return '123 Innovation Way, Suite 400';
  }
  if (/\b(city|town)\b/i.test(ident)) {
    return 'San Francisco';
  }
  if (/\b(state|province)\b/i.test(ident)) {
    return 'California';
  }
  if (/\bcountry\b/i.test(ident)) {
    return 'United States';
  }

  // 15. Subject
  if (/\bsubject\b/i.test(ident)) {
    return 'General Inquiry & Partnership';
  }

  // Generic fallback
  return 'Sample Information';
}

/**
 * Normalizes AI output keys to the exact canonical field classes (e.g. "form-filler-0-0").
 * Handles cases where LLMs return:
 * - Brackets: "[form-filler-0-0]" -> "form-filler-0-0"
 * - Underscores: "form_filler_0_0" -> "form-filler-0-0"
 * - Element IDs: "name", "email", "service", "message"
 * - Element names: "name", "email", "service", "message"
 * - Label text: "Full Name *", "Email Address *", "Service Interested In"
 * - Labels without asterisks: "Full Name", "Email Address", "Message"
 * - Numeric indices: "0", "1", "2"
 * - Placeholders: "John Doe", "john@company.com"
 */
export function normalizeAIValuesToCanonicalFields(rawValues, detectedFields, userText = '') {
  if (!rawValues || typeof rawValues !== 'object') return {};
  const normalized = {};
  const fields = Array.isArray(detectedFields) ? detectedFields : [];

  for (const [rawKey, val] of Object.entries(rawValues)) {
    if (val == null || isNegativeDirectiveOrSkip(val)) continue;
    const cleanKey = String(rawKey).trim().replace(/^[\[\"\']+|[\]\"\']+$/g, '');
    const dashedKey = cleanKey.replace(/_/g, '-');

    // 1. Direct class match
    let matchedField = fields.find((f) => f.class === rawKey || f.class === cleanKey || f.class === dashedKey);

    // 2. Integer index match (e.g. "0", "1")
    if (!matchedField && /^\d+$/.test(cleanKey)) {
      const idx = parseInt(cleanKey, 10);
      if (fields[idx]) matchedField = fields[idx];
    }

    // 3. Match by name attribute
    if (!matchedField) {
      matchedField = fields.find((f) => f.name && f.name.toLowerCase() === cleanKey.toLowerCase());
    }

    // 4. Match by id attribute
    if (!matchedField) {
      matchedField = fields.find((f) => f.id && f.id.toLowerCase() === cleanKey.toLowerCase());
    }

    // 5. Match by labelText (stripping asterisks and colons)
    if (!matchedField) {
      const normKey = cleanKey.replace(/[*:]/g, '').trim().toLowerCase();
      matchedField = fields.find((f) => {
        const normLabel = (f.labelText || '').replace(/[*:]/g, '').trim().toLowerCase();
        return normLabel && (normLabel === normKey || normLabel.includes(normKey) || normKey.includes(normLabel));
      });
    }

    // 6. Match by placeholder
    if (!matchedField) {
      matchedField = fields.find((f) => f.placeholder && f.placeholder.toLowerCase() === cleanKey.toLowerCase());
    }

    // 7. Group / Section Header Fan-Out for Checkboxes (e.g. "Hobbies": "Sports, Music")
    if (!matchedField) {
      const normKey = cleanKey.replace(/[*:]/g, '').trim().toLowerCase();
      const groupCheckboxes = fields.filter((f) => {
        if (f.type !== 'checkbox') return false;
        const normSec = (f.sectionHeader || '').replace(/[*:]/g, '').trim().toLowerCase();
        return normSec && (normSec === normKey || normSec.includes(normKey) || normKey.includes(normSec));
      });

      if (groupCheckboxes.length > 0) {
        const valStr = String(val).toLowerCase();
        for (const cbField of groupCheckboxes) {
          const cbLabel = (cbField.labelText || cbField.name || cbField.id || '').toLowerCase().trim();
          const isSelected = cbLabel && (valStr.includes(cbLabel) || cbLabel.includes(valStr));
          normalized[cbField.class] = isSelected ? 'true' : 'false';
        }
        continue;
      }
    }

    const targetClass = matchedField ? matchedField.class : dashedKey;
    normalized[targetClass] = val;
  }

  // 8. Deterministic User Profile Safety-Net Fallback:
  // If the AI model omitted or left empty any field that explicitly exists in the user profile text,
  // extract it directly from the user's profile text and populate it.
  if (userText && typeof userText === 'string') {
    const lines = userText.split(/[\r\n]+/);
    const profilePairs = [];
    const explicitSkipKeys = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('**') || trimmed.startsWith('#')) continue;
      const separatorMatch = trimmed.match(/^([^:=]+)[:=]\s*(.+)$/);
      if (separatorMatch) {
        const k = separatorMatch[1].trim();
        const v = separatorMatch[2].trim();
        if (k && v && v !== '""' && v !== "''") {
          const normK = k.toLowerCase().replace(/[*:]/g, '').trim();
          if (isNegativeDirectiveOrSkip(v)) {
            explicitSkipKeys.push(normK);
          } else {
            profilePairs.push({
              key: k,
              value: v,
              normKey: normK
            });
          }
        }
      }
    }

    // Explicit Skip Protection: If user specified "dont fill this", "leave blank", "N/A", "None", etc.
    // ensure any matching field is completely purged from normalized so it remains untouched and empty!
    if (explicitSkipKeys.length > 0) {
      for (const field of fields) {
        const normLabel = (field.labelText || '').toLowerCase().replace(/[*:]/g, '').trim();
        const normName = (field.name || '').toLowerCase();
        const normId = (field.id || '').toLowerCase();
        const isExplicitSkip = explicitSkipKeys.some((sk) => {
          if (!sk || sk.length < 2) return false;
          if (normLabel === sk || normName === sk || normId === sk) return true;
          if (normLabel && (normLabel.includes(sk) || sk.includes(normLabel))) {
            const regex = new RegExp(`(^|[^a-z0-9])${sk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
            if (regex.test(normLabel)) return true;
          }
          return false;
        });
        if (isExplicitSkip) {
          delete normalized[field.class];
        }
      }
    }

    for (const field of fields) {
      const curVal = normalized[field.class];
      const isEmpty = curVal == null || String(curVal).trim() === '';
      if (!isEmpty) continue;

      const fieldIdent = `${field.id || ''} ${field.name || ''} ${field.labelText || ''}`.toLowerCase();
      if (
        fieldIdent.includes('captcha') ||
        fieldIdent.includes('cpatcha') ||
        fieldIdent.includes('recaptcha') ||
        fieldIdent.includes('turnstile') ||
        fieldIdent.includes('hcaptcha') ||
        /\b\d{4,6}_txt\b/.test(fieldIdent) ||
        /\btemp\b/i.test(fieldIdent) ||
        /temp$/i.test(field.id || '') ||
        /temp$/i.test(field.name || '')
      ) {
        continue;
      }

      const normLabel = (field.labelText || '').toLowerCase().replace(/[*:]/g, '').trim();
      const normName = (field.name || '').toLowerCase();
      const normId = (field.id || '').toLowerCase();
      const normPlaceholder = (field.placeholder || '').toLowerCase();

      const matchedPair = profilePairs.find((pair) => {
        const pk = pair.normKey;
        if (!pk || pk.length < 2) return false;

        // Never match reference/registration numbers/IDs with types/status/categories
        const isRefOrNo = /\b(ref|number|no|code|id|cpt|appl_no|ack)\b/i.test(normLabel);
        const isTypeOrStatus = /\b(type|status|mode|category)\b/i.test(pk);
        if (isRefOrNo && isTypeOrStatus) return false;

        // 1. Exact match on normalized label, name, id, or placeholder
        if (normLabel === pk || normName === pk || normId === pk || normPlaceholder === pk) return true;

        // 2. Subpart exact match for bilingual slash/pipe formats (e.g. "जिला / District *" -> parts: ["जिला", "district"])
        const subParts = normLabel.split(/[\/|]/).map((p) => p.replace(/[*:]/g, '').trim()).filter((p) => p.length > 1);
        if (subParts.includes(pk)) return true;

        // Also check if user profile key is bilingual and one of its subparts exactly matches
        const pkSubParts = pk.split(/[\/|]/).map((p) => p.replace(/[*:]/g, '').trim()).filter((p) => p.length > 1);
        if (pkSubParts.some((p) => subParts.includes(p) || normLabel === p || normName === p)) return true;

        // 3. Word-boundary containment (only when pk is a standalone phrase and label is not a reference/number)
        if (!isRefOrNo && normLabel.length >= pk.length && pk.length >= 4) {
          const regex = new RegExp(`(^|[^a-z0-9])${pk.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z0-9]|$)`, 'i');
          if (regex.test(normLabel)) return true;
        }

        return false;
      });

      if (matchedPair) {
        normalized[field.class] = matchedPair.value;
      }
    }
  }

  // 9. Synthetic Data Generation Fallback:
  // If user explicitly requested fake/dummy/demo data, ensure every fillable field that
  // remains empty is populated with realistic synthetic data.
  if (isFakeDataRequested(userText)) {
    const seenRadioGroups = new Set();
    let idx = 0;
    for (const field of fields) {
      const curVal = normalized[field.class];
      const isEmpty = curVal == null || String(curVal).trim() === '';
      if (!isEmpty) continue;

      const fieldIdent = `${field.id || ''} ${field.name || ''} ${field.labelText || ''}`.toLowerCase();
      if (
        fieldIdent.includes('captcha') ||
        fieldIdent.includes('cpatcha') ||
        fieldIdent.includes('recaptcha') ||
        fieldIdent.includes('turnstile') ||
        fieldIdent.includes('hcaptcha') ||
        /\b\d{4,6}_txt\b/.test(fieldIdent) ||
        /\btemp\b/i.test(fieldIdent) ||
        /temp$/i.test(field.id || '') ||
        /temp$/i.test(field.name || '')
      ) {
        continue;
      }

      // Radio group check: only pick one radio per group
      if (field.type === 'radio' || field.role === 'radio') {
        const group = field.radioGroupName || field.name;
        if (group) {
          if (seenRadioGroups.has(group)) continue;
          seenRadioGroups.add(group);
        }
      }

      const syntheticVal = generateSyntheticFieldValue(field, idx++);
      if (syntheticVal) {
        normalized[field.class] = syntheticVal;
      }
    }
  }

  return normalized;
}

export function extractErrorMessage(errBody, status, statusText = '') {
  let errMsg = `API Error ${status}${statusText ? ` (${statusText})` : ''}`;
  try {
    const parsed = JSON.parse(errBody);
    const item = Array.isArray(parsed) ? parsed[0] : parsed;
    if (typeof item === 'string') {
      errMsg = item;
    } else if (item && typeof item === 'object') {
      if (typeof item.error === 'string') {
        errMsg = item.error;
      } else if (item.error && typeof item.error.message === 'string') {
        errMsg = item.error.message;
      } else if (typeof item.message === 'string') {
        errMsg = item.message;
      }
    }
  } catch {}
  return errMsg;
}

async function callOpenAICompatible(providerKey, config, messages, maxTokens = null) {
  let endpoint = (config.endpoint || '').trim().replace(/\/+$/, '');
  if (!endpoint) throw new Error('API Endpoint is required.');

  if (!endpoint.endsWith('/chat/completions')) {
    endpoint = endpoint + '/chat/completions';
  }

  const headers = { 'Content-Type': 'application/json' };
  const isOpenCode = providerKey === 'opencode' || endpoint.includes('opencode.ai');
  const isOmniRoute = endpoint.includes('localhost:20128') || endpoint.includes('127.0.0.1:20128');

  if (config.apiKey && config.apiKey.trim()) {
    headers['Authorization'] = `Bearer ${config.apiKey.trim()}`;
  }

  // Zero-Auth safety: OpenCode free models & local OmniRoute do not use API keys.
  // Sending an empty or invalid Bearer token triggers 401 AuthError from OpenCode Zen.
  if ((isOpenCode || isOmniRoute) && (!config.apiKey || !config.apiKey.trim())) {
    delete headers['Authorization'];
  }

  if (providerKey === 'openrouter') {
    headers['HTTP-Referer'] = 'https://fastfiller.ai';
    headers['X-Title'] = 'FastFiller Form Filler';
  }

  if (isOpenCode) {
    headers['User-Agent'] = 'opencode/1.18.31';
    headers['x-opencode-client'] = 'desktop';
    headers['x-opencode-project'] = 'global';
    headers['x-opencode-request'] = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('req-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9));
    headers['x-opencode-session'] = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : ('ses-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9));
  }

  if (!config.model?.trim() && providerKey === 'custom') {
    throw new Error('Model ID is required for Custom AI provider. Please enter a Model ID or click Fetch Models.');
  }

  const body = {
    model: config.model || (isOpenCode ? 'space-bunny-free' : 'gpt-4o-mini'),
    messages,
    temperature: 0.1
  };

  if (maxTokens) body.max_tokens = maxTokens;
  // DeepSeek official API rejects requests with 400 if response_format is sent with deepseek-reasoner
  if (config.model !== 'deepseek-reasoner') {
    body.response_format = { type: 'json_object' };
  }

  let response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok && body.response_format && response.status === 400) {
    const fallbackBody = { ...body };
    delete fallbackBody.response_format;
    const retryResp = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(fallbackBody)
    });
    if (retryResp.ok) {
      response = retryResp;
    }
  }

  if (!response.ok) {
    // If Google's OpenAI compatibility endpoint returns 503 (Overloaded) or 404,
    // automatically try Google's native generateContent API
    if ((response.status === 503 || response.status === 404) && endpoint.includes('generativelanguage.googleapis.com') && config.apiKey) {
      try {
        return await callGemini(config, messages, maxTokens);
      } catch {}
    }

    const errBody = await response.text();
    let errMsg = extractErrorMessage(errBody, response.status, response.statusText);
    if (response.status === 503 && endpoint.includes('generativelanguage.googleapis.com')) {
      errMsg = `Google Gemini Model Overloaded (503): Google's server is temporarily busy on '${config.model || 'selected model'}'. Please retry or choose another model from the dropdown.`;
    } else if (isOpenCode && (response.status === 403 || errMsg.includes('only be used from within OpenCode') || errMsg.includes('FreeTierError'))) {
      errMsg = `OpenCode upstream restricted '${config.model}' to their official desktop app. Switch to 'space-bunny-free' (100% zero-auth free).`;
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const choice = data.choices?.[0];
  return choice?.message?.content ?? choice?.text ?? choice?.message?.reasoning_content ?? '';
}

async function callAnthropic(config, messages, maxTokens = 2048) {
  const endpoint = (config.endpoint || 'https://api.anthropic.com/v1/messages').trim();
  const systemMsg = messages.find((m) => m.role === 'system')?.content || '';
  const userMsgs = messages.filter((m) => m.role !== 'system');

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': config.apiKey ? config.apiKey.trim() : '',
    'anthropic-version': '2023-06-01',
    'anthropic-dangerous-direct-browser-access': 'true'
  };

  const body = {
    model: config.model || 'claude-3-5-sonnet-latest',
    max_tokens: maxTokens,
    system: systemMsg,
    messages: userMsgs,
    temperature: 0.1
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const errBody = await response.text();
    let errMsg = extractErrorMessage(errBody, response.status, response.statusText);
    throw new Error(errMsg);
  }

  const data = await response.json();
  return data.content?.[0]?.text || '';
}

async function callGemini(config, messages, maxTokens = null) {
  let baseUrl = (config.endpoint || 'https://generativelanguage.googleapis.com').trim();
  baseUrl = baseUrl.replace(/\/openai.*$/, '').replace(/\/chat.*$/, '').replace(/\/models.*$/, '').replace(/\/+$/, '');
  if (!baseUrl.endsWith('/v1beta')) {
    baseUrl = baseUrl.replace(/\/v\d+.*$/, '') + '/v1beta';
  }

  const apiKey = config.apiKey ? config.apiKey.trim() : '';
  const model = config.model || 'gemini-3.5-flash-lite';
  const url = `${baseUrl}/models/${model}:generateContent?key=${apiKey}`;

  const systemInstruction = messages.find((m) => m.role === 'system');
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

  const body = {
    contents,
    generationConfig: {
      temperature: 0.1,
      responseMimeType: 'application/json'
    }
  };

  // Ultra-Low Latency Optimization: Disable deep reasoning "thinking" overhead.
  // Google's official Gemini API parameter to disable thinking tokens is thinkingBudget: 0.
  // This turns 60-second reasoning cascades into 300ms-800ms instant JSON responses.
  const lowerModel = String(model).toLowerCase();
  if (!lowerModel.includes('1.5')) {
    body.generationConfig.thinkingConfig = { thinkingBudget: 0 };
  }

  if (maxTokens) body.generationConfig.maxOutputTokens = maxTokens;
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction.content }] };
  }

  let response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  // If thinkingConfig or responseMimeType is rejected with 400, retry with "LOW" or without it
  if (!response.ok && response.status === 400) {
    const errBodyText = await response.text();
    let retryNeeded = false;
    if (body.generationConfig.thinkingConfig) {
      if (body.generationConfig.thinkingConfig.thinkingBudget === 0) {
        body.generationConfig.thinkingConfig = { thinkingLevel: 'LOW' };
        retryNeeded = true;
      } else {
        delete body.generationConfig.thinkingConfig;
        retryNeeded = true;
      }
    }
    if (body.generationConfig.responseMimeType && errBodyText.includes('response_mime_type')) {
      delete body.generationConfig.responseMimeType;
      retryNeeded = true;
    }
    if (retryNeeded) {
      const retryResp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (retryResp.ok) {
        const data = await retryResp.json();
        const candidate = data.candidates?.[0];
        const parts = candidate?.content?.parts || [];
        const nonThoughtParts = parts.filter((p) => !p.thought && p.text != null);
        if (nonThoughtParts.length > 0) {
          return nonThoughtParts.map((p) => p.text).join('').trim();
        }
        return parts.map((p) => p.text || '').join('').trim();
      }
      if (body.generationConfig.thinkingConfig) {
        delete body.generationConfig.thinkingConfig;
        const retryResp2 = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (retryResp2.ok) {
          const data = await retryResp2.json();
          const candidate = data.candidates?.[0];
          const parts = candidate?.content?.parts || [];
          const nonThoughtParts = parts.filter((p) => !p.thought && p.text != null);
          if (nonThoughtParts.length > 0) {
            return nonThoughtParts.map((p) => p.text).join('').trim();
          }
          return parts.map((p) => p.text || '').join('').trim();
        }
      }
    }
    const errMsg = extractErrorMessage(errBodyText, response.status, response.statusText);
    throw new Error(errMsg);
  }

  if (!response.ok) {
    const errBody = await response.text();
    let errMsg = extractErrorMessage(errBody, response.status, response.statusText);
    if (response.status === 503) {
      errMsg = `Google Gemini Model Overloaded (503): Google's server is temporarily busy on '${model}'. Please retry in a moment.`;
    }
    throw new Error(errMsg);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  const nonThoughtParts = parts.filter((p) => !p.thought && p.text != null);
  if (nonThoughtParts.length > 0) {
    return nonThoughtParts.map((p) => p.text).join('').trim();
  }
  return parts.map((p) => p.text || '').join('').trim();
}

export async function callAI(providerKey, config, messages, maxTokens = null) {
  const reg = PROVIDERS_REGISTRY[providerKey];
  let format = config?.format || reg?.format || 'openai';
  if (config?.endpoint) {
    if (config.endpoint.includes('api.anthropic.com')) {
      format = 'anthropic';
    } else if (config.endpoint.includes('generativelanguage.googleapis.com')) {
      format = 'gemini';
    }
  }
  if (providerKey === 'gemini' || config?.id === 'gemini' || (config?.model?.includes('gemini') && !config?.endpoint?.includes('openrouter.ai'))) {
    format = 'gemini';
  } else if (providerKey === 'anthropic' || config?.id === 'anthropic') {
    format = 'anthropic';
  }

  if (format === 'web_session') {
    const sys = messages.find((m) => m.role === 'system')?.content || '';
    const usr = messages.filter((m) => m.role !== 'system').map((m) => m.content).join('\n\n');

    const prompt = `[CRITICAL DIRECTIVE: RETURN RAW JSON ONLY]
${sys}

${usr}

[MANDATORY FORMAT REQUIREMENT]
Output ONLY a single valid JSON object starting with '{' and ending with '}'.
No preamble, no conversational greetings, no markdown backticks, no explanations.`;

    const selectedEngine = config?.engine || (config?.model && config.model !== 'chatgpt-web-session' ? config.model : 'chatgpt');

    if (typeof config?.webSessionExecutor === 'function') {
      return await config.webSessionExecutor(selectedEngine, prompt, 60000);
    }

    if (typeof executeWebSessionPrompt === 'function') {
      return await executeWebSessionPrompt(selectedEngine, prompt, 60000);
    }

    return new Promise((resolve, reject) => {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        reject(new Error('Extension messaging runtime unavailable.'));
        return;
      }
      chrome.runtime.sendMessage(
        { type: 'EXECUTE_WEB_SESSION_PROMPT', prompt, engine: selectedEngine, timeout: 60000 },
        (resp) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (!resp?.success) {
            reject(new Error(resp?.error || 'Web session execution failed.'));
          } else {
            resolve(resp.text);
          }
        }
      );
    });
  }

  switch (format) {
    case 'anthropic':
      return callAnthropic(config, messages, maxTokens || 2048);
    case 'gemini':
      return callGemini(config, messages, maxTokens);
    default:
      return callOpenAICompatible(providerKey, config, messages, maxTokens);
  }
}

export async function testConnection(providerKey, config) {
  const reg = PROVIDERS_REGISTRY[providerKey];
  if (reg?.format === 'web_session') {
    const selectedEngine = config?.engine || (config?.model && config.model !== 'chatgpt-web-session' ? config.model : 'chatgpt');
    const engineMeta = WEB_SESSION_SUB_ENGINES.find((e) => e.id === selectedEngine) || WEB_SESSION_SUB_ENGINES[0];

    if (typeof checkWebSessionStatus === 'function') {
      try {
        const resp = await checkWebSessionStatus(selectedEngine);
        if (!resp?.success || !resp.authenticated) {
          return {
            success: false,
            message: resp?.error || `Not logged in. Please log in to ${engineMeta.loginUrl} in your browser once to enable Web Session mode.`
          };
        }
        const userStr = resp.user?.email || resp.user?.name ? ` (${resp.user.email || resp.user.name})` : '';
        return {
          success: true,
          latencyMs: 0,
          user: resp.user || null,
          message: `${engineMeta.name} session active & ready${userStr}!`
        };
      } catch (err) {
        return {
          success: false,
          message: err.message || `${engineMeta.name} session check failed.`
        };
      }
    }

    return new Promise((resolve) => {
      if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) {
        resolve({ success: false, message: 'Extension runtime unavailable' });
        return;
      }
      chrome.runtime.sendMessage({ type: 'CHECK_WEB_SESSION_STATUS', engine: selectedEngine }, (resp) => {
        if (chrome.runtime.lastError || !resp?.success) {
          resolve({
            success: false,
            message: resp?.error || chrome.runtime.lastError?.message || `${engineMeta.name} session check failed.`
          });
        } else if (!resp.authenticated) {
          resolve({
            success: false,
            message: resp.error || `Not logged in. Please log in to ${engineMeta.loginUrl} in your browser once to enable Web Session mode.`
          });
        } else {
          const userStr = resp.user?.email || resp.user?.name ? ` (${resp.user.email || resp.user.name})` : '';
          resolve({
            success: true,
            latencyMs: 0,
            user: resp.user || null,
            message: `${engineMeta.name} session active & ready${userStr}!`
          });
        }
      });
    });
  }


  const isLocalOrOpen = config.endpoint?.includes('localhost') || config.endpoint?.includes('11434') || config.endpoint?.includes('20128') || (config.endpoint?.includes('openrouter.ai') && config.model?.includes(':free')) || providerKey === 'opencode' || config.endpoint?.includes('opencode.ai');
  if (reg?.requiresKey && !isLocalOrOpen && !config.apiKey?.trim()) {
    throw new Error(`API key is required for ${reg.name}.`);
  }
  if (!config.endpoint?.trim()) {
    throw new Error(`Endpoint URL is required.`);
  }
  if (!config.model?.trim() && providerKey === 'custom') {
    throw new Error(`Model ID is required for Custom AI provider. Please enter a Model ID or click Fetch Models.`);
  }

  const messages = [
    { role: 'system', content: 'You are a test agent. Respond only with valid JSON.' },
    { role: 'user', content: 'Respond with exactly: {"status": "ok", "fastFiller": "connected"}' }
  ];

  const startTime = performance.now();
  const raw = await callAI(providerKey, config, messages, 64);
  const latencyMs = Math.round(performance.now() - startTime);

  parseAIResponse(raw);

  const modelName = config.model ? ` (${config.model})` : '';
  return {
    success: true,
    latencyMs,
    message: `Connected${modelName} in ${latencyMs}ms`
  };
}
