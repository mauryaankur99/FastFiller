/**
 * FastFiller — Storage Management & Multi-Provider Config
 * Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com
 * Licensed under the MIT License.
 * Authors: Maurya Ankur (https://www.linkedin.com/in/ankur-maurya1/), Singh Sanjiv (https://www.linkedin.com/in/sanjiv-singh/)
 * Organization: Aeigs (https://aeigs.com)
 */

export const WATERMARK = Object.freeze({
  app: 'Fastfiller',
  license: 'MIT',
  copyright: 'Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com',
  organization: 'aeigs.com',
  url: 'https://aeigs.com',
  authors: Object.freeze([
    Object.freeze({
      name: 'Maurya Ankur',
      role: 'Co-Founder & Lead Engineer',
      linkedin: 'https://www.linkedin.com/in/ankur-maurya1/'
    }),
    Object.freeze({
      name: 'Singh Sanjiv',
      role: 'Co-Founder & Systems Architect',
      linkedin: 'https://www.linkedin.com/in/sanjiv-singh/'
    })
  ]),
  integrity: 'aeigs-mit-2026'
});

export const STORAGE_KEYS = {
  CONFIG_V2: 'fastfiller_api_config_v2',
  SETTINGS_V1_LEGACY: 'fastfiller_api_settings',
  TEMPLATES: 'fastfiller_templates',
  ACTIVE_TEMPLATE_ID: 'fastfiller_current_template',
  THEME: 'fastfiller_theme',
  DEFAULT_VIEW: 'fastfiller_default_view'
};

// Storage prefix for backward-compatibility with users upgrading from legacy versions
const LEGACY_STORAGE_PREFIX = 'fastfiller_v1_';
export const LEGACY_STORAGE_KEYS = {
  CONFIG_V2: LEGACY_STORAGE_PREFIX + 'api_config_v2',
  SETTINGS_V1_LEGACY: LEGACY_STORAGE_PREFIX + 'api_settings',
  TEMPLATES: LEGACY_STORAGE_PREFIX + 'templates',
  ACTIVE_TEMPLATE_ID: LEGACY_STORAGE_PREFIX + 'current_template',
  THEME: LEGACY_STORAGE_PREFIX + 'theme',
  DEFAULT_VIEW: LEGACY_STORAGE_PREFIX + 'default_view'
};


export const DEFAULT_TEMPLATES = [
  {
    id: "tpl-job-applicant",
    name: "Job Application Profile",
    category: "Career",
    updatedAt: 1790665398411,
    content: `Full Name: Alex Morgan
First Name: Alex
Last Name: Morgan
Email: alex.morgan@example.com
Phone: +1 (555) 234-5678
Address: 742 Evergreen Terrace
City: Springfield
State / Province: OR
Postal / ZIP Code: 97477
Country: United States
LinkedIn: https://linkedin.com/in/alexmorgan
GitHub: https://github.com/alexmorgan
Portfolio / Website: https://alexmorgan.dev
Current Title: Senior Software Engineer
Years of Experience: 6
Current Company: TechFlow Inc.
Work Authorization: US Citizen (Authorized to work with no sponsorship required)
Notice Period: 2 weeks
Preferred Salary: $145,000 / year
Summary: Product-focused software engineer with 6+ years of experience crafting high-performance web applications and delightful user interfaces.`
  },
  {
    id: "tpl-personal-info",
    name: "Personal & Contact Info",
    category: "Personal",
    updatedAt: 1790444824646,
    content: `First Name: Alex
Last Name: Morgan
Full Name: Alex Morgan
Email: alex.morgan@example.com
Phone: +1 (555) 234-5678
Date of Birth: 1994-06-15
Gender: Non-binary
Street Address: 742 Evergreen Terrace
Apartment / Suite: Apt 4B
City: Springfield
State: Oregon
Postal Code: 97477
Country: United States`
  },
  {
    id: "tpl-shipping-checkout",
    name: "Shipping & Checkout",
    category: "Orders",
    updatedAt: 1790665395757,
    content: `Recipient Name: Alex Morgan
Company: Morgan Creative Studio
Address Line 1: 742 Evergreen Terrace
Address Line 2: Suite 300
City: Springfield
State: OR
ZIP Code: 97477
Country: United States
Contact Phone: +1 (555) 234-5678
Delivery Instructions: Leave package at front door behind the pillar if nobody is home.`
  }
];

export const DEFAULT_CUSTOM_PROFILES = {
  groq: {
    id: 'groq',
    name: 'Groq',
    badge: 'Ultra Fast (~300ms)',
    endpoint: 'https://api.groq.com/openai/v1/chat/completions',
    defaultEndpoint: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'llama-3.3-70b-versatile',
    defaultModel: 'llama-3.3-70b-versatile',
    apiKey: '',
    keyUrl: 'https://console.groq.com/keys',
    format: 'openai',
    hasFreeModels: true
  },
  openrouter: {
    id: 'openrouter',
    name: 'OpenRouter',
    badge: '200+ Models',
    endpoint: 'https://openrouter.ai/api/v1/chat/completions',
    defaultEndpoint: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'meta-llama/llama-3.3-70b-instruct:free',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct:free',
    apiKey: '',
    keyUrl: 'https://openrouter.ai/keys',
    format: 'openai',
    hasFreeModels: true
  },
  gemini: {
    id: 'gemini',
    name: 'Google Gemini',
    badge: '3.5 Flash-Lite · Ultra Fast',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta',
    defaultEndpoint: 'https://generativelanguage.googleapis.com/v1beta',
    model: 'gemini-3.5-flash-lite',
    defaultModel: 'gemini-3.5-flash-lite',
    apiKey: '',
    keyUrl: 'https://aistudio.google.com/app/apikey',
    format: 'gemini',
    hasFreeModels: true
  },
  openai: {
    id: 'openai',
    name: 'OpenAI',
    badge: 'GPT-4o Mini',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    defaultEndpoint: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    defaultModel: 'gpt-4o-mini',
    apiKey: '',
    keyUrl: 'https://platform.openai.com/api-keys',
    format: 'openai',
    hasFreeModels: false
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    badge: 'Claude 3.5 Sonnet',
    endpoint: 'https://api.anthropic.com/v1/messages',
    defaultEndpoint: 'https://api.anthropic.com/v1/messages',
    model: 'claude-3-5-sonnet-latest',
    defaultModel: 'claude-3-5-sonnet-latest',
    apiKey: '',
    keyUrl: 'https://console.anthropic.com/',
    format: 'anthropic',
    hasFreeModels: false
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    badge: 'Lowest Cost',
    endpoint: 'https://api.deepseek.com/chat/completions',
    defaultEndpoint: 'https://api.deepseek.com/chat/completions',
    model: 'deepseek-chat',
    defaultModel: 'deepseek-chat',
    apiKey: '',
    keyUrl: 'https://platform.deepseek.com/api_keys',
    format: 'openai',
    hasFreeModels: false
  },
  nvidia: {
    id: 'nvidia',
    name: 'NVIDIA NIM',
    badge: 'Free Credits',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    defaultEndpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    model: 'meta/llama-3.3-70b-instruct',
    defaultModel: 'meta/llama-3.3-70b-instruct',
    apiKey: '',
    keyUrl: 'https://build.nvidia.com/',
    format: 'openai',
    hasFreeModels: false
  },
  meta: {
    id: 'meta',
    name: 'Meta (Together)',
    badge: 'Llama 3.3 70B',
    endpoint: 'https://api.together.xyz/v1/chat/completions',
    defaultEndpoint: 'https://api.together.xyz/v1/chat/completions',
    model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    defaultModel: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
    apiKey: '',
    keyUrl: 'https://api.together.xyz/settings/api-keys',
    format: 'openai',
    hasFreeModels: false
  },
  ollama: {
    id: 'ollama',
    name: 'Ollama (Local)',
    badge: '100% Free & Private',
    endpoint: 'http://localhost:11434/v1/chat/completions',
    defaultEndpoint: 'http://localhost:11434/v1/chat/completions',
    model: 'llama3.2',
    defaultModel: 'llama3.2',
    apiKey: '',
    keyUrl: 'https://ollama.com',
    format: 'openai',
    hasFreeModels: true
  },
  opencode: {
    id: 'opencode',
    name: 'OpenCode Free',
    badge: 'Space Bunny · Zero-Auth Free',
    endpoint: 'https://opencode.ai/zen/v1/chat/completions',
    defaultEndpoint: 'https://opencode.ai/zen/v1/chat/completions',
    model: 'space-bunny-free',
    defaultModel: 'space-bunny-free',
    apiKey: '',
    keyUrl: 'https://opencode.ai',
    format: 'openai',
    hasFreeModels: true,
    requiresKey: false
  },
  custom: {
    id: 'custom',
    name: 'Custom (BYOK)',
    badge: 'Custom Gateway',
    endpoint: '',
    defaultEndpoint: '',
    model: '',
    defaultModel: '',
    apiKey: '',
    keyUrl: '',
    format: 'openai',
    hasFreeModels: false
  }
};

export const INITIAL_CONFIG_V2 = {
  activeProvider: 'chatgpt_web',
  systemPromptPreset: 'default',
  customSystemPrompt: '',
  providers: {
    chatgpt_web: {
      endpoint: 'https://chatgpt.com',
      model: 'chatgpt-web-session',
      lastTested: null
    },
    custom: {
      apiKey: '',
      endpoint: '',
      model: '',
      lastTested: null
    }
  },
  customProviderProfiles: {
    selectedProvider: 'groq',
    profiles: JSON.parse(JSON.stringify(DEFAULT_CUSTOM_PROFILES))
  }
};

/**
 * Synchronizes a specific custom provider profile and updates config.providers.custom for backwards compatibility.
 */
export function syncCustomProfile(config, providerId, updates = {}) {
  if (!config) return;
  if (!config.customProviderProfiles) {
    config.customProviderProfiles = {
      selectedProvider: providerId || 'groq',
      profiles: JSON.parse(JSON.stringify(DEFAULT_CUSTOM_PROFILES))
    };
  }
  const profiles = config.customProviderProfiles.profiles;
  if (!profiles[providerId]) {
    profiles[providerId] = {
      id: providerId,
      name: providerId,
      endpoint: '',
      defaultEndpoint: '',
      model: '',
      defaultModel: '',
      apiKey: '',
      format: 'openai',
      ...updates
    };
  } else {
    Object.assign(profiles[providerId], updates);
  }

  // Official native providers have immutable, locked official endpoints & formats
  const pDef = DEFAULT_CUSTOM_PROFILES[providerId];
  if (pDef && providerId !== 'custom' && providerId !== 'ollama') {
    profiles[providerId].endpoint = pDef.defaultEndpoint;
    profiles[providerId].format = pDef.format;
  }

  config.customProviderProfiles.selectedProvider = providerId;

  const prof = profiles[providerId];
  if (!config.providers) config.providers = {};
  config.providers.custom = {
    apiKey: prof.apiKey || '',
    endpoint: prof.endpoint || prof.defaultEndpoint || '',
    model: prof.model || (providerId === 'custom' ? '' : (prof.defaultModel || '')),
    format: prof.format || 'openai',
    lastTested: prof.lastTested || null
  };
}

/**
 * Loads the V2 multi-provider configuration.
 */
export async function loadConfig() {
  return new Promise((resolve) => {
    chrome.storage.local.get([
      STORAGE_KEYS.CONFIG_V2,
      STORAGE_KEYS.SETTINGS_V1_LEGACY,
      LEGACY_STORAGE_KEYS.CONFIG_V2,
      LEGACY_STORAGE_KEYS.SETTINGS_V1_LEGACY
    ], (res) => {
      let config = res[STORAGE_KEYS.CONFIG_V2] || res[LEGACY_STORAGE_KEYS.CONFIG_V2];

      if (!config) {
        config = JSON.parse(JSON.stringify(INITIAL_CONFIG_V2));

        const legacy = res[STORAGE_KEYS.SETTINGS_V1_LEGACY] || res[LEGACY_STORAGE_KEYS.SETTINGS_V1_LEGACY];
        if (legacy && legacy.provider) {
          if (legacy.apiKey || legacy.apiEndpoint) {
            config.activeProvider = 'custom';
            config.providers.custom.apiKey = legacy.apiKey || '';
            if (legacy.apiEndpoint) config.providers.custom.endpoint = legacy.apiEndpoint;
            if (legacy.model) config.providers.custom.model = legacy.model;
          }
          if (legacy.systemPrompt) {
            config.customSystemPrompt = legacy.systemPrompt;
          }
        }

        // Migrate initial custom into matching profile
        if (config.providers?.custom) {
          const ep = (config.providers.custom.endpoint || '').toLowerCase();
          let target = 'groq';
          if (ep.includes('openrouter.ai')) target = 'openrouter';
          else if (ep.includes('generativelanguage.googleapis.com')) target = 'gemini';
          else if (ep.includes('openai.com')) target = 'openai';
          else if (ep.includes('anthropic.com')) target = 'anthropic';
          else if (ep.includes('deepseek.com')) target = 'deepseek';
          else if (ep.includes('nvidia.com')) target = 'nvidia';
          else if (ep.includes('together.xyz')) target = 'meta';
          else if (ep.includes('11434')) target = 'ollama';
          else if (config.providers.custom.apiKey || (config.providers.custom.endpoint && !ep.includes('groq.com'))) target = 'custom';

          syncCustomProfile(config, target, {
            apiKey: config.providers.custom.apiKey || '',
            endpoint: config.providers.custom.endpoint,
            model: config.providers.custom.model
          });
        }

        chrome.storage.local.set({ [STORAGE_KEYS.CONFIG_V2]: config }, () => {
          resolve(config);
        });
        return;
      }

      const merged = JSON.parse(JSON.stringify(INITIAL_CONFIG_V2));
      merged.activeProvider = config.activeProvider || merged.activeProvider;
      merged.customSystemPrompt = config.customSystemPrompt || '';

      // Auto-migrate if stored customSystemPrompt was the previous baseline default prompt
      if (merged.customSystemPrompt && (
        merged.customSystemPrompt.includes('DIVERSITY REQUIREMENT: Never use generic repetitive placeholders') ||
        merged.customSystemPrompt.includes('supply a polite, natural context-appropriate sentence') ||
        merged.customSystemPrompt.includes('Operating Modes:') ||
        merged.customSystemPrompt.includes('Fill form fields with realistic, coherent fake data')
      )) {
        merged.customSystemPrompt = '';
        if (chrome?.storage?.local?.set) {
          chrome.storage.local.set({ [STORAGE_KEYS.CONFIG_V2]: merged });
        }
      }

      if (config.providers) {
        for (const [key, provData] of Object.entries(config.providers)) {
          if (merged.providers[key]) {
            merged.providers[key] = { ...merged.providers[key], ...provData };
          } else {
            merged.providers[key] = provData;
          }
        }
      }

      // Smoothly migrate any legacy provider (groq, openai, deepseek, etc.) to custom
      if (merged.activeProvider !== 'chatgpt_web' && merged.activeProvider !== 'custom') {
        const legacyKey = merged.activeProvider;
        const legacyData = merged.providers[legacyKey] || config.providers?.[legacyKey];
        if (legacyData && (legacyData.apiKey || legacyData.endpoint)) {
          merged.providers.custom.apiKey = legacyData.apiKey || merged.providers.custom.apiKey;
          merged.providers.custom.endpoint = legacyData.endpoint || merged.providers.custom.endpoint;
          merged.providers.custom.model = legacyData.model || merged.providers.custom.model;
          merged.activeProvider = 'custom';
        } else {
          merged.activeProvider = 'chatgpt_web';
        }
      }

      // Merge or migrate customProviderProfiles
      if (!config.customProviderProfiles) {
        merged.customProviderProfiles = {
          selectedProvider: 'groq',
          profiles: JSON.parse(JSON.stringify(DEFAULT_CUSTOM_PROFILES))
        };
        const ep = (merged.providers?.custom?.endpoint || '').toLowerCase();
        let target = 'groq';
        if (ep.includes('openrouter.ai')) target = 'openrouter';
        else if (ep.includes('generativelanguage.googleapis.com')) target = 'gemini';
        else if (ep.includes('openai.com')) target = 'openai';
        else if (ep.includes('anthropic.com')) target = 'anthropic';
        else if (ep.includes('deepseek.com')) target = 'deepseek';
        else if (ep.includes('nvidia.com')) target = 'nvidia';
        else if (ep.includes('together.xyz')) target = 'meta';
        else if (ep.includes('11434')) target = 'ollama';
        else if (merged.providers?.custom?.apiKey) target = 'custom';

        syncCustomProfile(merged, target, {
          apiKey: merged.providers.custom.apiKey || '',
          endpoint: merged.providers.custom.endpoint,
          model: merged.providers.custom.model
        });
      } else {
        const loadedProfiles = config.customProviderProfiles.profiles || {};
        const freshProfiles = JSON.parse(JSON.stringify(DEFAULT_CUSTOM_PROFILES));
        for (const [pId, pDef] of Object.entries(freshProfiles)) {
          if (!loadedProfiles[pId]) {
            loadedProfiles[pId] = pDef;
          } else {
            loadedProfiles[pId] = {
              ...pDef,
              ...loadedProfiles[pId],
              badge: pDef.badge,
              name: pDef.name,
              defaultEndpoint: pDef.defaultEndpoint,
              defaultModel: pDef.defaultModel
            };
            // For all official native presets, lock and enforce the official endpoint and format
            if (pId !== 'custom' && pId !== 'ollama') {
              loadedProfiles[pId].endpoint = pDef.defaultEndpoint;
              loadedProfiles[pId].format = pDef.format;
            }
            // User requested: isolate OpenCode strictly to the only verified zero-auth model
            if (pId === 'opencode') {
              loadedProfiles[pId].model = 'space-bunny-free';
              loadedProfiles[pId].defaultModel = 'space-bunny-free';
              delete loadedProfiles[pId].cachedModels;
            }
            // User requested: upgrade and sanitize Gemini model strictly to Gemini 3.5 Flash-Lite
            if (pId === 'gemini') {
              if (!loadedProfiles[pId].model || loadedProfiles[pId].model.includes('2.0') || loadedProfiles[pId].model.includes('2.5') || loadedProfiles[pId].model.includes('1.5')) {
                loadedProfiles[pId].model = 'gemini-3.5-flash-lite';
              }
              loadedProfiles[pId].defaultModel = 'gemini-3.5-flash-lite';
              loadedProfiles[pId].badge = '3.5 Flash-Lite · Ultra Fast';
            }
            // User requested: in Custom (BYOK) mode, do not show any predefined/default model IDs.
            // Model field must remain empty initially until user enters an endpoint and clicks Fetch Models.
            if (pId === 'custom') {
              loadedProfiles[pId].defaultModel = '';
              loadedProfiles[pId].defaultEndpoint = '';
              if (!loadedProfiles[pId].endpoint || loadedProfiles[pId].model === 'llama-3.3-70b-versatile') {
                loadedProfiles[pId].model = '';
                delete loadedProfiles[pId].cachedModels;
              }
            }
          }
        }
        delete loadedProfiles.omniroute;
        if (config.customProviderProfiles?.selectedProvider === 'omniroute') {
          config.customProviderProfiles.selectedProvider = 'custom';
        }
        merged.customProviderProfiles = {
          selectedProvider: (config.customProviderProfiles.selectedProvider === 'omniroute' ? 'custom' : config.customProviderProfiles.selectedProvider) || 'groq',
          profiles: loadedProfiles
        };
        // Keep providers.custom in sync
        const activeId = merged.customProviderProfiles.selectedProvider;
        const activeProf = merged.customProviderProfiles.profiles[activeId] || merged.customProviderProfiles.profiles.groq;
        if (activeProf) {
          if (activeId === 'gemini' && (!activeProf.model || activeProf.model.includes('2.0') || activeProf.model.includes('2.5') || activeProf.model.includes('1.5'))) {
            activeProf.model = 'gemini-3.5-flash-lite';
          }
          merged.providers.custom = {
            ...merged.providers.custom,
            apiKey: activeProf.apiKey || '',
            endpoint: activeProf.endpoint || activeProf.defaultEndpoint,
            model: activeProf.model || activeProf.defaultModel,
            format: activeProf.format || 'openai'
          };
        }
      }

      resolve(merged);
    });
  });
}

/**
 * Persists the V2 configuration.
 */
export async function saveConfig(config) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.CONFIG_V2]: config }, () => {
      resolve();
    });
  });
}

/**
 * Robust Template Loader:
 * Merges templates from both chrome.storage.local and localStorage
 * to ensure custom user templates are never lost or overwritten.
 */
export async function loadTemplates() {
  return new Promise((resolve) => {
    chrome.storage.local.get([
      STORAGE_KEYS.TEMPLATES,
      STORAGE_KEYS.ACTIVE_TEMPLATE_ID,
      LEGACY_STORAGE_KEYS.TEMPLATES,
      LEGACY_STORAGE_KEYS.ACTIVE_TEMPLATE_ID
    ], (res) => {
      let chromeTemplates = res[STORAGE_KEYS.TEMPLATES] || res[LEGACY_STORAGE_KEYS.TEMPLATES];
      let localTemplates = [];

      try {
        const raw = localStorage.getItem(STORAGE_KEYS.TEMPLATES) || localStorage.getItem(LEGACY_STORAGE_KEYS.TEMPLATES);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            localTemplates = parsed;
          }
        }
      } catch (err) {
        console.warn('[FastFiller] Error reading localStorage templates:', err);
      }

      // Gather candidate list
      let candidateList = [];

      if (Array.isArray(chromeTemplates) && chromeTemplates.length > 0) {
        candidateList = chromeTemplates;
        // Merge any user templates from localStorage that aren't already in chrome storage
        for (const lt of localTemplates) {
          if (lt && lt.id && !candidateList.some((ct) => ct.id === lt.id || (ct.name && ct.name === lt.name))) {
            candidateList.push(lt);
          }
        }
      } else if (localTemplates.length > 0) {
        candidateList = localTemplates;
      } else {
        candidateList = JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));
      }

      // Sanitize templates (ensure clean ID, name, string content)
      const sanitized = candidateList
        .filter((t) => t && typeof t === 'object')
        .map((t, idx) => {
          const rawName = String(t.name || `Profile ${idx + 1}`);
          const cleanName = rawName.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
          return {
            id: String(t.id || `tpl-${Date.now()}-${idx}`),
            name: cleanName || `Profile ${idx + 1}`,
            category: t.category || 'General',
            content: typeof t.content === 'string' ? t.content : '',
            updatedAt: t.updatedAt || Date.now()
          };
        });

      const finalTemplates = sanitized.length > 0 ? sanitized : JSON.parse(JSON.stringify(DEFAULT_TEMPLATES));

      // Resolve active ID
      let activeId = res[STORAGE_KEYS.ACTIVE_TEMPLATE_ID] || res[LEGACY_STORAGE_KEYS.ACTIVE_TEMPLATE_ID];
      if (!activeId) {
        try {
          activeId = localStorage.getItem(STORAGE_KEYS.ACTIVE_TEMPLATE_ID) || localStorage.getItem(LEGACY_STORAGE_KEYS.ACTIVE_TEMPLATE_ID) || '';
        } catch {}
      }

      if (!activeId || !finalTemplates.some((t) => t.id === activeId)) {
        activeId = finalTemplates[0].id;
      }

      // Dual-write to ensure both storages are synchronized
      try {
        localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(finalTemplates));
        localStorage.setItem(STORAGE_KEYS.ACTIVE_TEMPLATE_ID, activeId);
      } catch {}

      chrome.storage.local.set({
        [STORAGE_KEYS.TEMPLATES]: finalTemplates,
        [STORAGE_KEYS.ACTIVE_TEMPLATE_ID]: activeId
      }, () => {
        resolve({ templates: finalTemplates, activeId });
      });
    });
  });
}

/**
 * Saves templates list and active template ID.
 * Writes to localStorage synchronously FIRST to survive immediate popup closing.
 */
export async function saveTemplates(templates, activeId = null) {
  if (!Array.isArray(templates) || templates.length === 0) return;

  // 1. Synchronous localStorage write (survives instant popup closure)
  try {
    localStorage.setItem(STORAGE_KEYS.TEMPLATES, JSON.stringify(templates));
    if (activeId) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TEMPLATE_ID, activeId);
    }
  } catch (err) {
    console.warn('[FastFiller] localStorage write warning:', err);
  }

  // 2. Persistent chrome.storage.local write
  return new Promise((resolve) => {
    const update = { [STORAGE_KEYS.TEMPLATES]: templates };
    if (activeId) update[STORAGE_KEYS.ACTIVE_TEMPLATE_ID] = activeId;
    chrome.storage.local.set(update, () => {
      resolve();
    });
  });
}

/**
 * Sets active template ID in both localStorage and chrome.storage.local.
 */
export async function setActiveTemplateId(id) {
  if (!id) return;
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TEMPLATE_ID, id);
  } catch {}
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_TEMPLATE_ID]: id }, resolve);
  });
}

/**
 * Exports templates to a downloadable JSON backup object.
 */
export function exportTemplatesJSON(templates) {
  const version = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) ? (chrome.runtime.getManifest()?.version || '1.0.0') : '1.0.0';
  return JSON.stringify({
    app: 'Fastfiller',
    version: version,
    license: WATERMARK.license,
    copyright: WATERMARK.copyright,
    authors: WATERMARK.authors,
    organization: WATERMARK.organization,
    exportedAt: new Date().toISOString(),
    templates: templates || []
  }, null, 2);
}

/**
 * Validates and imports templates from a JSON string.
 */
export function parseImportTemplates(jsonStr) {
  if (!jsonStr || typeof jsonStr !== 'string') throw new Error('Invalid file content.');
  const parsed = JSON.parse(jsonStr);
  const items = Array.isArray(parsed) ? parsed : parsed.templates;
  if (!Array.isArray(items) || items.length === 0) {
    throw new Error('No valid templates found in imported file.');
  }

  return items.map((t, i) => ({
    id: `tpl-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
    name: String(t.name || `Imported Profile ${i + 1}`).trim(),
    category: t.category || 'Imported',
    content: typeof t.content === 'string' ? t.content : '',
    updatedAt: Date.now()
  }));
}

/**
 * Theme & View Preferences
 */
export async function loadTheme() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.THEME, LEGACY_STORAGE_KEYS.THEME], (res) => {
      resolve(res[STORAGE_KEYS.THEME] || res[LEGACY_STORAGE_KEYS.THEME] || 'dark');
    });
  });
}

export async function saveTheme(theme) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.THEME]: theme }, resolve);
  });
}

export async function loadDefaultView() {
  return new Promise((resolve) => {
    chrome.storage.local.get([STORAGE_KEYS.DEFAULT_VIEW, LEGACY_STORAGE_KEYS.DEFAULT_VIEW], (res) => {
      resolve(res[STORAGE_KEYS.DEFAULT_VIEW] || res[LEGACY_STORAGE_KEYS.DEFAULT_VIEW] || 'popup');
    });
  });
}

export async function saveDefaultView(view) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [STORAGE_KEYS.DEFAULT_VIEW]: view }, async () => {
      if (typeof chrome !== 'undefined') {
        if (chrome.sidePanel?.setPanelBehavior) {
          try {
            await chrome.sidePanel.setPanelBehavior({
              openPanelOnActionClick: view === 'sidepanel'
            });
          } catch (err) {
            console.warn('[FastFiller] Could not set panel behavior:', err);
          }
        }
        if (chrome.action?.setPopup) {
          try {
            await chrome.action.setPopup({
              popup: view === 'sidepanel' ? '' : 'src/popup/index.html'
            });
          } catch (err) {
            console.warn('[FastFiller] Could not set action popup:', err);
          }
        }
      }
      resolve();
    });
  });
}
