/**
 * FastFiller — Architecture, Security & User Reference (v1.0.0)
 * Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com
 * Licensed under the MIT License.
 * Authors: Maurya Ankur (https://www.linkedin.com/in/ankur-maurya1/), Singh Sanjiv (https://www.linkedin.com/in/sanjiv-singh/)
 * Organization: Aeigs (https://aeigs.com)
 */

document.addEventListener('DOMContentLoaded', async () => {
  const app = document.getElementById('app');
  if (!app) return;

  // Retrieve existing theme preference or default to dark
  let currentTheme = 'dark';
  try {
    const _legacyThemeKey = 'fastfiller_v1_theme';
    const res = await chrome.storage.local.get(['fastfiller_theme', _legacyThemeKey]);
    if (res && (res.fastfiller_theme || res[_legacyThemeKey])) {
      currentTheme = res.fastfiller_theme || res[_legacyThemeKey];
    }
  } catch (err) {
    // fallback
  }

  function applyTheme(theme) {
    currentTheme = theme;
    document.documentElement.dataset.theme = theme;
    const isDark = theme === 'dark';

    document.documentElement.style.setProperty('--bg-page', isDark ? '#060913' : '#f4f6fa');
    document.documentElement.style.setProperty('--bg-card', isDark ? '#0b1224' : '#ffffff');
    document.documentElement.style.setProperty('--bg-subtle', isDark ? '#101a35' : '#e9eef6');
    document.documentElement.style.setProperty('--text-primary', isDark ? '#f8fafc' : '#0f172a');
    document.documentElement.style.setProperty('--text-secondary', isDark ? '#94a3b8' : '#475569');
    document.documentElement.style.setProperty('--text-muted', isDark ? '#64748b' : '#94a3b8');
    document.documentElement.style.setProperty('--border-color', isDark ? 'rgba(56, 189, 248, 0.12)' : '#e2e8f0');
    document.documentElement.style.setProperty('--border-medium', isDark ? 'rgba(56, 189, 248, 0.24)' : '#cbd5e1');
    document.documentElement.style.setProperty('--accent-primary', 'linear-gradient(90deg, #ff8a00 0%, #ff3b69 45%, #d900ff 85%, #9d00ff 100%)');
    document.documentElement.style.setProperty('--accent-light', isDark ? 'rgba(217, 0, 255, 0.12)' : 'rgba(217, 0, 255, 0.08)');
    document.documentElement.style.setProperty('--accent-text', isDark ? '#f43f5e' : '#e11d48');
  }

  applyTheme(currentTheme);

  function getIconSrc(theme) {
    const file = theme === 'light' ? 'assets/icon-light.webp' : 'assets/icon-dark.webp';
    return (typeof chrome !== 'undefined' && chrome.runtime?.getURL) ? chrome.runtime.getURL(file) : `/${file}`;
  }

  function render() {
    const extVersion = (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) ? ('v' + (chrome.runtime.getManifest()?.version || '1.0.0')) : 'v1.0.0';
    const isDark = currentTheme === 'dark';
    const iconSrc = getIconSrc(currentTheme);

    app.innerHTML = `
      <div style="min-height: 100vh; background: var(--bg-page); color: var(--text-primary); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Inter', sans-serif; padding: 40px 20px; transition: background 0.15s ease, color 0.15s ease;">
        <div style="max-width: 820px; margin: 0 auto; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; padding: 36px 40px; box-shadow: 0 16px 40px rgba(0,0,0,0.12);">
          
          <!-- Header Bar -->
          <div class="help-header-bar" style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid var(--border-color); padding-bottom: 24px; margin-bottom: 24px; gap: 16px; flex-wrap: wrap;">
            <div style="display: flex; flex-direction: column; gap: 6px; min-width: 0;">
              <div class="brand-group" style="display: inline-flex; align-items: center; gap: 3px; min-width: 0;">
                <img
                  id="brand-header-icon"
                  src="${iconSrc}"
                  alt="FastFiller Icon"
                  class="brand-icon"
                  style="width: 38px; height: 38px; object-fit: contain; flex-shrink: 0; display: block; border-radius: 4px; filter: ${isDark ? 'drop-shadow(0 2px 10px rgba(56, 189, 248, 0.45)) drop-shadow(0 0 14px rgba(255, 122, 0, 0.25))' : 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.12))'};"
                />
                <div class="brand-title" style="display: flex; align-items: center; gap: 6px; min-width: 0;">
                  <span class="brand-wordmark" style="display: inline-flex; align-items: baseline; gap: 1.5px; font-size: 22px; font-weight: 850; font-style: italic; letter-spacing: -0.5px; line-height: 1; user-select: none;">
                    <span class="brand-text-fast" style="color: ${isDark ? '#ffffff' : '#0f172a'}; ${isDark ? 'text-shadow: 0 0 14px rgba(56, 189, 248, 0.35);' : ''}">Fast</span><span class="brand-text-filler" style="background: linear-gradient(95deg, #ff8a00 0%, #ff3b69 45%, #d900ff 85%, #9d00ff 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; filter: ${isDark ? 'drop-shadow(0 0 10px rgba(217, 0, 255, 0.45))' : 'drop-shadow(0 1px 2px rgba(217, 0, 255, 0.2))'};">Filler</span>
                  </span>
                </div>
              </div>
              <p style="font-size: 13px; color: var(--text-secondary); margin: 0; line-height: 1.4;">Architecture, Privacy & Complete Operational Reference</p>
            </div>
            <div style="display: flex; align-items: center; gap: 10px; flex-shrink: 0;">
              <button id="theme-toggle-btn" type="button" style="background: var(--bg-subtle); border: 1px solid var(--border-color); color: var(--text-primary); font-size: 12px; font-weight: 600; padding: 6px 14px; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 6px;">
                ${isDark ? '☀️ Light Theme' : '🌙 Dark Theme'}
              </button>
              <span style="font-size: 11px; font-weight: 700; color: var(--accent-text); background: var(--accent-light); border: 1px solid var(--border-color); border-radius: 9999px; padding: 4px 10px; font-family: monospace;">
                ${extVersion}
              </span>
            </div>
          </div>

          <!-- Quick Navigation Jump Bar -->
          <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 32px; padding: 10px 14px; background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 10px;">
            <a href="#security" class="nav-chip">🛡️ Security & Privacy</a>
            <a href="#engines" class="nav-chip">⚡ AI Engines & BYOK</a>
            <a href="#profiles" class="nav-chip">📁 Profiles & Backups</a>
            <a href="#form-engine" class="nav-chip">🎯 Detection & 1-Click Undo</a>
            <a href="#settings" class="nav-chip">⚙️ System Prompts & Modes</a>
            <a href="#shortcuts" class="nav-chip">⌨️ Shortcuts</a>
            <a href="#authors" class="nav-chip">👥 Authors & License</a>
          </div>

          <!-- Section 1: Privacy Architecture & Endpoint Trust -->
          <section id="security" style="margin-bottom: 36px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text);">Security Guarantee</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0;">Zero-Cloud Client Isolation</h2>
            <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">
              FastFiller is engineered as a strictly client-only browser extension. There are no intermediate cloud proxies, centralized databases, telemetry collection services, or external trackers.
            </p>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">Local Credential Storage</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  API keys, endpoints, and custom fill profiles are stored strictly in your browser’s sandboxed <code style="font-family: monospace; font-size: 11px;">chrome.storage.local</code> area. They never touch any third-party sync server.
                </p>
              </div>
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">Automated Sensitive Field Shield</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Inputs classified as passwords, payment cards, CVVs, or Social Security numbers are automatically detected and omitted from payloads, ensuring sensitive credentials are never forwarded to any AI model.
                </p>
              </div>
            </div>

            <!-- Endpoint Privacy Notice Callout -->
            <div style="margin-top: 14px; background: var(--bg-subtle); border: 1px solid var(--border-color); border-left: 3px solid #f59e0b; border-radius: 8px; padding: 14px 16px;">
              <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
                <span>⚠️ Endpoint Privacy & Provider Trust</span>
              </div>
              <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.55; margin: 0;">
                While FastFiller operates strictly client-side with zero intermediate proxies, cloud databases, or tracking scripts, your ultimate data privacy depends directly on the AI endpoint you configure. When connecting to third-party cloud APIs (such as OpenAI, DeepSeek, Groq, or external custom endpoints) or utilizing web sessions, non-sensitive prompt payloads are transmitted directly to that provider under their data policies. If you require absolute, air-gapped privacy where no form data ever leaves your machine, you can connect FastFiller to a local offline LLM (such as Llama via Ollama, LM Studio, or LocalAI) running entirely on your local workstation.
              </p>
            </div>
          </section>

          <!-- Section 2: AI Engines & Connection Modes -->
          <section id="engines" style="margin-bottom: 36px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text);">Inference Pipeline</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0;">Supported AI Engine Providers & Modes</h2>
            <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
              FastFiller supports two flexible modes of intelligence, giving you complete autonomy over privacy, cost, speed, and model choice:
            </p>

            <div style="display: flex; flex-direction: column; gap: 14px;">
              <!-- Option A: Zero-Key Web Sessions -->
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                  <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Mode A: Zero-Key Web Sessions (100% Free)</span>
                  <span style="font-size: 10px; font-weight: 700; color: #10b981; background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 4px; padding: 2px 8px;">No API Keys Needed</span>
                </div>
                <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.55; margin: 0 0 10px 0;">
                  Connects directly to your active browser tab sessions via local background messaging bridges without requiring API subscriptions, developer tokens, or billing setup.
                </p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                  <div style="background: var(--bg-card); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="font-weight: 700; font-size: 12.5px; color: var(--text-primary); margin-bottom: 4px;">ChatGPT Web Session</div>
                    <p style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4; margin: 0;">
                      Communicates with an open <code style="font-family: monospace;">chatgpt.com</code> tab using client-side Sentinel PoW proof solver. Keeps conversations ephemeral and isolated.
                    </p>
                  </div>
                  <div style="background: var(--bg-card); padding: 10px 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="font-weight: 700; font-size: 12.5px; color: var(--text-primary); margin-bottom: 4px;">DeepSeek Web Session</div>
                    <p style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4; margin: 0;">
                      Bridges with an active authenticated tab at <code style="font-family: monospace;">chat.deepseek.com</code> using our embedded WASM proof-of-work solver for zero-token inference.
                    </p>
                  </div>
                </div>
                <div style="font-size: 11.5px; color: var(--text-muted); margin-top: 8px;">
                  💡 Requirement: Keep your active ChatGPT or DeepSeek tab open and signed in in your browser while filling.
                </div>
              </div>

              <!-- Option B: Universal Custom AI API (BYOK) -->
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; flex-wrap: wrap; gap: 6px;">
                  <span style="font-weight: 700; font-size: 14px; color: var(--text-primary);">Mode B: Universal Custom AI API (BYOK & Local LLM)</span>
                  <span style="font-size: 10px; font-weight: 700; color: var(--accent-text); background: var(--accent-light); border: 1px solid var(--border-color); border-radius: 4px; padding: 2px 8px;">Direct HTTPS / Localhost</span>
                </div>
                <p style="font-size: 12.5px; color: var(--text-secondary); line-height: 1.55; margin: 0 0 12px 0;">
                  Connect directly with any frontier AI provider or local inference runtime via OpenAI-compatible endpoints with custom models, live model fetching, and isolated credential profiles.
                </p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; font-size: 11.5px;">
                  <div style="background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <strong style="color: var(--text-primary);">Groq:</strong> ~300ms ultra-fast inference with free dev tier models (Llama 3.3 70B, Llama 3.1 8B).
                  </div>
                  <div style="background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <strong style="color: var(--text-primary);">DeepSeek API:</strong> DeepSeek V4 Flash & DeepSeek V4 Pro for ultra-fast structured JSON form filling.
                  </div>
                  <div style="background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <strong style="color: var(--text-primary);">Google Gemini:</strong> Gemini 3.5 Flash Lite & Gemini 3.5 Flash via generous Google AI Studio free tier.
                  </div>
                  <div style="background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <strong style="color: var(--text-primary);">Anthropic:</strong> Claude 3.5 Sonnet for nuanced, multi-layered complex application forms.
                  </div>
                  <div style="background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <strong style="color: var(--text-primary);">OpenRouter:</strong> Single gateway to 200+ models with 1-click <code>Free Only</code> filter checkbox.
                  </div>
                  <div style="background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <strong style="color: var(--text-primary);">Ollama (Local):</strong> 100% on-device private execution at <code style="font-family: monospace;">localhost:11434</code> with zero network traffic.
                  </div>
                  <div style="background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <strong style="color: var(--text-primary);">NVIDIA NIM:</strong> Free trial credits with Llama 3.3 70B Instruct.
                  </div>
                  <div style="background: var(--bg-card); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--border-color);">
                    <strong style="color: var(--text-primary);">Custom / LM Studio:</strong> Any local or private endpoint (e.g. <code style="font-family: monospace;">localhost:1234/v1</code>, vLLM, LocalAI).
                  </div>
                </div>
                
                <div style="margin-top: 10px; padding: 8px 12px; background: var(--bg-card); border-radius: 6px; border: 1px solid var(--border-color); font-size: 11.5px; color: var(--text-secondary); line-height: 1.5;">
                  <strong>⚡ Dynamic Model Fetching & Isolated Profiles:</strong> Click <strong>"Fetch Models"</strong> in the settings to automatically query the provider’s live model list. Your API keys, model selections, and custom endpoints are remembered independently per provider so switching providers never overwrites your credentials.
                </div>
              </div>
            </div>
          </section>

          <!-- Section 3: Profile & Data Management -->
          <section id="profiles" style="margin-bottom: 36px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text);">Data Orchestration</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0;">Profile Management & Prompt Control</h2>
            <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">
              Manage multiple identities, resumes, and data templates for one-click switching across diverse application workflows.
            </p>
            
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Multi-Identity Personas & Live Telemetry</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Maintain separate profiles for Job Applications, Education Forms, Client Billing, or Testing. The prompt textarea provides real-time character counters and estimated token counts (<code style="font-family: monospace;">~tokens</code>) to help keep payloads optimal for any model's context window.
                </p>
              </div>

              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">Full-Screen Profile Manager</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Click <strong>"Manage Profiles"</strong> to open the full modal manager where you can search profiles in real-time, create new profiles from scratch, 1-click duplicate existing profiles for quick edits, and rename or delete profiles with confirmation protection.
                </p>
              </div>

              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">JSON Export / Import & Safe Defaults Restore</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Easily backup or migrate your profiles across machines using the <strong>Export All (JSON)</strong> and <strong>Import Profiles</strong> tools. If you ever restore default starter templates, FastFiller automatically saves an emergency backup in <code style="font-family: monospace;">localStorage</code> so you never lose personal data.
                </p>
              </div>
            </div>
          </section>

          <!-- Section 4: Form Detection, Inspection & Injection Engine -->
          <section id="form-engine" style="margin-bottom: 36px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text);">Core Technology</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0;">Intelligent Detection, Inspection & 1-Click Undo</h2>
            <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">
              FastFiller combines deep DOM tree parsing with native JavaScript event simulation to ensure compatibility across modern single-page applications.
            </p>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 12px;">
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">🎯 Bloat-Free Field Detection</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Automatically filters out non-fillable UI elements, submit buttons, header search boxes, and live chat widgets (Intercom, Zendesk). Penetrates Shadow DOM boundaries and accurately checks ancestor visibility across inactive tabs and accordions.
                </p>
              </div>

              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">🔍 Detected Fields Inspector</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Click the <strong>Detected Fields</strong> badge to expand a comfortable inspector drawer (up to 70% viewport height). Hovering over any item instantly highlights and scrolls directly to that field on the active webpage in real time.
                </p>
              </div>

              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">📋 Pre-Fill Dry-Run Review</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Enable <strong>"Review mapped values before injecting"</strong> to inspect every field value before it touches the page. Modify any value directly in-place, use Select All / Deselect All, or toggle full-screen view for large multi-page forms.
                </p>
              </div>

              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">⚡ Native Synthetic Injection</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Uses native property descriptor setters to bypass React, Vue, and Angular internal value blockers. Dispatches complete validation event lifecycles (<code style="font-family: monospace;">focus</code> → <code style="font-family: monospace;">InputEvent</code> → <code style="font-family: monospace;">change</code> → <code style="font-family: monospace;">blur</code>), normalizes ISO dates (<code style="font-family: monospace;">YYYY-MM-DD</code>), and strips phone masks.
                </p>
              </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">↩️ 1-Click Form Undo Engine</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Made a mistake or testing a form? FastFiller records an exact pre-fill snapshot and restores all text, selects, radio buttons, and ARIA checkboxes in reverse topological order, cleanly resetting cascading dropdowns without needing a page refresh.
                </p>
              </div>

              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 14px;">
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px;">🎭 Synthetic Mock / Fake Data Filling</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 0;">
                  Prompting FastFiller with instructions like <em>"fill with fake details"</em>, <em>"dummy data"</em>, or <em>"test values"</em> automatically activates our synthetic fallback engine, generating realistic names, addresses, emails, and dates without exposing personal data.
                </p>
              </div>
            </div>
          </section>

          <!-- Section 5: Customization, Settings & System Prompts -->
          <section id="settings" style="margin-bottom: 36px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text);">Preferences & Tuning</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0;">Settings, System Prompts & Recovery</h2>
            <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;">
              Fine-tune the extension's behavior, layout, and instructions to match your personal workflow.
            </p>

            <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 12px;">
              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Popup Window vs. Docked Side Panel Multi-Mode</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 2px 0 0;">
                  Click the layout toggle button in the header at any time to switch between a lightweight popup and a docked, persistent Side Panel. FastFiller remembers your preference as your default startup view.
                </p>
              </div>

              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Custom System Prompt Tuning</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 2px 0 0;">
                  Access the <strong>System Prompt</strong> tab in Settings to inspect or customize the baseline system instructions delivered to the AI model. Add specialized rules (e.g. default country codes, preferred tone) with live character tracking, or click <strong>"Reset to Default"</strong> at any time.
                </p>
              </div>

              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Actionable 1-Click Error Recovery Chips</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 2px 0 0;">
                  If an API error occurs (such as 401 Unauthorized, 429 Rate Limits, or Disconnected Web Tabs), FastFiller renders contextual recovery chips (e.g., <em>"Switch to Free ChatGPT Web"</em>, <em>"Configure API Key"</em>, <em>"Open ChatGPT Tab"</em>) to resolve issues with a single click.
                </p>
              </div>

              <div>
                <div style="font-size: 13px; font-weight: 700; color: var(--text-primary);">Dynamic Script Injection (No Tab Reload Needed)</div>
                <p style="font-size: 12px; color: var(--text-secondary); line-height: 1.5; margin: 2px 0 0;">
                  FastFiller dynamically injects content scripts into active tabs on demand. You never need to manually refresh webpages that were already open before installing or updating the extension.
                </p>
              </div>
            </div>
          </section>

          <!-- Section 6: Keyboard Accelerators & Quick Reference -->
          <section id="shortcuts" style="margin-bottom: 32px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text);">Efficiency</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0;">Keyboard Accelerators & Shortcuts</h2>
            
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-top: 10px;">
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
                <div style="font-family: monospace; font-size: 12px; font-weight: 700; color: var(--accent-text); margin-bottom: 4px;">Ctrl + Enter</div>
                <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">Trigger form fill directly from the popup or side panel prompt textarea.</div>
              </div>

              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
                <div style="font-family: monospace; font-size: 12px; font-weight: 700; color: var(--accent-text); margin-bottom: 4px;">Alt + Shift + F</div>
                <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">Global browser shortcut to auto-fill the active tab with your selected profile instantly.</div>
              </div>

              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 8px; padding: 12px;">
                <div style="font-family: monospace; font-size: 12px; font-weight: 700; color: var(--accent-text); margin-bottom: 4px;">Escape</div>
                <div style="font-size: 11.5px; color: var(--text-secondary); line-height: 1.4;">Dismiss any open drawer, detected fields inspector, dry-run review, or modal dialog.</div>
              </div>
            </div>
          </section>

          <!-- Section 7: Engineering Leadership, Authors & Open Source Governance -->
          <section id="authors" style="margin-bottom: 36px;">
            <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
              <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: var(--accent-text);">Project Governance & Authors</span>
            </div>
            <h2 style="font-size: 19px; font-weight: 700; color: var(--text-primary); margin: 0 0 12px 0;">Engineering Leadership & Open Source License</h2>
            <p style="font-size: 13.5px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 16px;">
              FastFiller is an open-source, client-first browser automation engine engineered and maintained by the founding architects at <strong>Aeigs</strong>:
            </p>

            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 14px; margin-bottom: 18px;">
              <!-- Maurya Ankur Card -->
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Maurya Ankur</div>
                    <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">Co-Founder</span>
                  </div>
                  <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.45;">
                    Co-Founder & Lead Engineer · System Architecture, AI Session Adapters, Dropdown Engine & Core DOM Ingestion.
                  </div>
                </div>
                <a
                  href="https://www.linkedin.com/in/ankur-maurya1/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; color: #38bdf8; text-decoration: none; padding: 7px 14px; border-radius: 6px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); align-self: flex-start; transition: all 150ms ease;"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.85 6.27a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>
                  Connect on LinkedIn
                </a>
              </div>

              <!-- Singh Sanjiv Card -->
              <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 18px; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                  <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                    <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Singh Sanjiv</div>
                    <span style="font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 9999px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3);">Co-Founder</span>
                  </div>
                  <div style="font-size: 12px; color: var(--text-secondary); margin-bottom: 14px; line-height: 1.45;">
                    Co-Founder & Systems Architect · Infrastructure Reliability, Zero-Cloud Security Shield & Browser Extension Platform.
                  </div>
                </div>
                <a
                  href="https://www.linkedin.com/in/sanjiv-singh/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style="display: inline-flex; align-items: center; gap: 7px; font-size: 12px; font-weight: 600; color: #38bdf8; text-decoration: none; padding: 7px 14px; border-radius: 6px; background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.25); align-self: flex-start; transition: all 150ms ease;"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.77v8.37H6.46v-8.37M7.85 6.27a1.62 1.62 0 1 0 0 3.24 1.62 1.62 0 0 0 0-3.24z"/></svg>
                  Connect on LinkedIn
                </a>
              </div>
            </div>

            <!-- Organization & License Card -->
            <div style="background: var(--bg-subtle); border: 1px solid var(--border-color); border-radius: 10px; padding: 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px;">
              <div>
                <div style="font-size: 14px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                  <span>🌐 Aeigs (aeigs.com)</span>
                  <span style="font-size: 10.5px; padding: 2px 7px; border-radius: 4px; background: rgba(16, 185, 129, 0.15); color: #10b981; font-weight: 700;">Official Lab</span>
                </div>
                <div style="font-size: 12px; color: var(--text-secondary); line-height: 1.45;">
                  Released under the <strong>MIT License</strong>. Copyright &copy; 2026 Maurya Ankur, Singh Sanjiv, aeigs.com. All rights reserved. Original author attributions and watermarks are embedded across core modules.
                </div>
              </div>
              <a
                href="https://aeigs.com"
                target="_blank"
                rel="noopener noreferrer"
                style="display: inline-flex; align-items: center; gap: 6px; font-size: 12px; font-weight: 700; color: #ffffff; text-decoration: none; padding: 8px 18px; border-radius: 6px; background: var(--accent-gradient); box-shadow: 0 2px 8px rgba(217, 0, 255, 0.25);"
              >
                Visit aeigs.com ↗
              </a>
            </div>
          </section>

          <!-- Footer Actions -->
          <div style="border-top: 1px solid var(--border-color); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;">
            <span style="font-size: 12px; color: var(--text-muted);">
              FastFiller is strictly client-first & open source. Your credentials and data stay on your workstation.
            </span>
            <button
              type="button"
              id="close-window-btn"
              style="background: linear-gradient(90deg, #ff8a00 0%, #ff3b69 45%, #d900ff 85%, #9d00ff 100%); color: #ffffff; border: 1px solid rgba(255, 255, 255, 0.18); box-shadow: 0 4px 16px rgba(217, 0, 255, 0.35); font-size: 13px; font-weight: 700; padding: 8px 22px; border-radius: 6px; cursor: pointer; transition: transform 0.12s ease;"
            >
              Close Guide
            </button>
          </div>

        </div>
      </div>
    `;

    document.getElementById('theme-toggle-btn')?.addEventListener('click', async () => {
      const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      try {
        await chrome.storage.local.set({ fastfiller_theme: nextTheme });
      } catch (e) {
        // ignore
      }
      render();
    });

    document.getElementById('close-window-btn')?.addEventListener('click', () => {
      window.close();
    });
  }

  render();
});
