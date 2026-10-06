# FastFiller 🚀 — 1-Click AI Auto Form Filler

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/mauryaankur99/FastFiller/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](manifest.json)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Brave%20%7C%20Edge%20%7C%20Opera-purple.svg)](#quick-installation-guide)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local--First-brightgreen.svg)](#privacy--security-guarantee)

> **FastFiller** is an open-source, client-first, privacy-respecting browser extension that instantly maps and fills complex web forms using AI. Works on Google Forms, job application portals (Workday, Greenhouse, Lever, Ashby, LinkedIn), government forms, university admission portals, and custom corporate workflows.

---

## 🌟 Key Highlights & AI Architecture

FastFiller features an intelligent, multi-tier engine architecture designed to give you 100% flexibility—from zero-cost browser sessions to ultra-fast cloud APIs and air-gapped local privacy:

```text
FastFiller AI Model Architecture
├── 1. Web Session AI (100% Free · Zero API Keys Needed)
│   ├── ChatGPT Web (Direct active browser tab session)
│   └── DeepSeek Web (Direct web session bridge)
│
├── 2. Google AI Studio (Free-Tier API Available)
│   ├── Gemini 3.5 Flash Lite (Ultra-fast, lowest latency, generous daily free tier)
│   └── Gemini 3.5 Flash (Advanced reasoning & multi-step form mapping)
│
├── 3. Ultra-Fast Cloud & Developer Free Tiers
│   ├── Groq (Free Dev Tier · ~300ms ultra-fast Llama 3.3 70B & 8B)
│   ├── OpenRouter (19+ Free models tagged :free · Llama 3.3, Mistral, DeepSeek)
│   └── DeepSeek API (Direct high-speed deepseek-chat & deepseek-reasoner)
│
├── 4. Zero-Auth Free Model
│   └── Space Bunny via OpenCode (Zero setup, no API key or account required)
│
├── 5. 100% Offline, Air-Gapped & Secure (Zero Internet Required)
│   └── Local Ollama (Runs on localhost:11434 · Llama 3, Mistral, Qwen, DeepSeek)
│       └── 100% private & secure for confidential enterprise or personal data
│
└── 6. Custom BYOK Gateway (Universal OpenAI-Compatible)
    └── Any custom endpoint (LM Studio, vLLM, private servers, Claude, OpenAI)
```

* **🧠 Intelligent Field Understanding:** Handles text, email, phone, textareas, native `<select>`, **React-Select**, custom ARIA comboboxes, radio buttons, and multi-select checkboxes with robust fuzzy and multilingual option matching.
* **🔄 Headless Background Worker:** Form filling continues seamlessly in the Chrome Service Worker even if you close the popup or switch tabs.
* **↩️ 1-Click Instant Undo:** Snapshots initial DOM state before filling, allowing you to instantly revert any fill action with zero page reload.
* **📋 Profile & Template Manager:** Save multiple profiles (Job Applications, College Applications, Government ID, Shipping Addresses) with dynamic variable expansion.
* **🌐 Global Internationalization:** 15 built-in browser language packs (`_locales/`) with intelligent multilingual label matching.
* **🔄 In-App Automatic Update Checker:** Notifies users cleanly when a new release is available on GitHub with 1-click update download.

---

## ⚡ Comprehensive Feature Breakdown (A to Z)

### 1. 🎯 Core Form Autofill Engine
* **One-Click Auto-Fill:** Single primary action (`Auto-fill Web Form`) triggers the entire form discovery, AI mapping, and injection pipeline.
* **AI-Powered Semantic Mapping:** Analyzes detected form fields and semantically maps user profile information without requiring matching field names or hardcoded regex rules.
* **Profile-Based Autofill:** Select any saved user profile/template (e.g., *Job Application*, *Contact Info*, *Checkout*) to automatically populate matching form fields.
* **Manual Information Input:** Directly type or paste arbitrary raw text, resumes, bios, or custom instructions into the main extension editor for instant on-the-fly fills.
* **Direct DOM Value Injection:** Automatically sets native values, toggles choices, and updates input fields directly in the active webpage DOM.
* **Submission Safety (No Auto-Submit):** Strictly automates field population; never clicks "Submit", triggers purchase buttons, or attempts to bypass security checks.

### 2. 🔍 Form Field Detection & DOM Compatibility
* **Universal Element Scanner:** Automatically scans and indexes all eligible input controls across the webpage.
* **Supported Field Types:**
  * Standard text inputs (`text`, `email`, `tel`, `url`, `number`, `search`)
  * Multi-line textareas
  * Native dropdowns (`<select>`)
  * Radio buttons & Radio groups
  * Checkboxes & Multi-checkbox groups
  * ARIA custom checkboxes (`[role="checkbox"]`)
  * ARIA custom radio buttons (`[role="radio"]`)
  * ARIA custom listboxes (`[role="listbox"]`)
  * ARIA custom comboboxes (`[role="combobox"]`)
  * React-Select controls (single-select and multi-select chip controls)
  * Contenteditable elements (`[contenteditable="true"]`)
  * Date pickers & HTML5 date inputs
* **Semantic Label Resolution:** Resolves field labels through multi-tier heuristics: `aria-labelledby`, `aria-label`, `<label for>`, wrapping `<label>`, nearest form-group headers, `<legend>` text, and data attributes.
* **Surrounding Section Detection:** Identifies parent section headers (e.g., *Personal Information*, *Billing Address*, *Work Experience*) to provide semantic context to the AI model.
* **Required-Field Detection:** Identifies required inputs via HTML `required`, `aria-required="true"`, and common CSS indicator patterns (e.g., `.required-asterisk`).
* **Deep Shadow DOM Traversal:** Recursively traverses open Shadow Roots to discover and interact with custom web components and encapsulated form fields.
* **Multi-Tier Resilient Field Lookup:** Locates target DOM elements during injection using 7 fallback tiers (Internal tracking class, Element ID, Element `name`, Normalized class, Hierarchical DOM coordinates, Label/Placeholder text, and Shadow Root lookup).
* **Live Field Count Indicator:** Displays detected field count in real-time (e.g., `12 fields detected · Inspect`).
* **Interactive Detected Fields Drawer:** Inspect all detected form fields with field indices, resolved names, and element types.
* **Two-Way Element Highlighting:** Hovering or clicking any field in the Inspector highlights the physical element on the active webpage.
* **Visual Fill Confirmation:** Filled fields receive a temporary green pulse highlight on the page confirming successful injection.
* **Manual & Auto Re-Scan:** Manual `Re-scan` button for dynamic forms, plus automatic re-scans on active tab switching and page navigation.

### 3. 🎛️ Advanced Form Controls & Synthetic Events
* **React-Select Single-Select:** Interacts with React-Select containers, opens the menu, searches options, and selects matching items.
* **React-Select Multi-Select:** Sequentially searches and commits multiple selection tags/chips into multi-select controls.
* **ARIA Custom Dropdowns & Menus:** Interacts with custom ARIA comboboxes and listbox options.
* **Cascading / Dependent Dropdowns:** Recognizes parent-child dropdown relationships (e.g., *Country → State → City*) and preserves user intent.
* **Date Normalization:** Recognizes and formats dates to match the required input format (`YYYY-MM-DD`, `MM/DD/YYYY`, or verbal formats).
* **Synthetic Framework Event Dispatching:** Dispatches full event sequences (`mousedown`, `mouseup`, `input`, `change`, `blur`, `keydown`) ensuring modern reactive frameworks (React, Vue, Angular, Svelte) register the input state changes.

### 4. 🛡️ Sensitive Field & Peripheral Protection
* **Automatic Sensitive Field Exclusion:** Automatically detects and skips sensitive fields:
  * Passwords & password confirmation inputs
  * Credit card numbers
  * CVV / CVC security codes
  * Social Security Numbers (SSN)
  * Banking / Payment PIN codes
* **CAPTCHA & Anti-Bot Protection:** Detects and skips CAPTCHA, reCAPTCHA, Cloudflare Turnstile, hCaptcha, and math verification challenges.
* **Peripheral Widget Filtering:** Ignores non-form inputs, including customer support & chat widgets, header search bars, and footer newsletter inputs.

### 5. 🤖 Dual AI Engine Architecture & Provider Options
* **Web Session AI (Zero-Key & 100% Free):**
  * **ChatGPT Web Session:** Bridges directly with an active, logged-in `chatgpt.com` browser tab. Requires zero API keys and zero paid subscriptions.
  * **DeepSeek Web Session:** Bridges directly with an active, logged-in `chat.deepseek.com` browser tab with zero API configuration.
  * **Direct Session Verification:** One-click status checker (`Check Web Status`) confirming whether the session tab is active and authenticated.
* **Custom AI API Gateway (Universal BYOK):**
  1. **Groq (Free Tier Available):** Ultra-fast cloud inference (~300ms) with a generous free developer tier (`llama-3.3-70b-versatile`, `llama-3.1-8b-instant`).
  2. **Google Gemini (Free Tier Available):** Google AI Studio integration (`gemini-3.5-flash-lite`, `gemini-3.5-flash`, etc.) with daily free quota limits and zero subscription fees.
  3. **OpenRouter (Free Models Available):** Unified gateway with 200+ models, including 19+ permanently free models tagged `:free` (e.g., Llama 3.3 70B, DeepSeek R1, Mistral 7B).
  4. **Local Ollama (100% Offline, Air-Gapped & Secure):** Runs local open weights (`http://localhost:11434/v1`) with zero internet required. 100% private and secure on your local machine—ideal for confidential enterprise workflows, sensitive personal data, or government portals where data cannot leave the computer.
  5. **OpenCode Free (Zero-Auth / No API Key Needed):** Ready out of the box with zero setup, zero authentication, and zero API keys required for the `space-bunny-free` model.
  6. **OpenAI:** Official OpenAI API integration (`gpt-4o-mini`, `gpt-4o`).
  7. **Anthropic:** Claude API integration (`claude-3-5-sonnet-latest`).
  8. **DeepSeek API:** Ultra low-cost direct developer API (`deepseek-chat`).
  9. **NVIDIA NIM:** NVIDIA cloud microservices with free trial developer credits (`meta/llama-3.3-70b-instruct`).
  10. **Meta / Together AI:** Together AI inference gateway (`Llama-3.3-70B-Instruct-Turbo`).
  11. **Custom BYOK Gateway:** Add any custom OpenAI-compatible endpoint URL, API key, and custom model ID (connect local LM Studio, vLLM, private self-hosted servers, or corporate proxies).

### 6. 📊 Model Management & Connection Diagnostics
* **Dynamic Model Fetching:** `Fetch Models` button queries the provider's `/models` endpoint to retrieve live model catalogs.
* **Free-Only Model Filter:** One-click toggle (`Free Only`) filtering the dropdown to display only free models.
* **Chat-Model Filtering:** Automatically filters out non-chat models (embeddings, TTS, image generation, moderation models).
* **Fallback Model Registry:** Offline fallback model presets ensure the extension functions even if a provider's model listing API is temporarily unreachable.
* **Live Latency & Ping Diagnostic:** `Ping API & Check Latency` utility sends a test handshake and reports round-trip network response time in milliseconds.
* **Active Engine Status Pill:** Main extension header displays the active provider, model name, and connection status indicator.

### 7. 👤 Profile & Template Management System
* **Multi-Profile Storage:** Create and maintain multiple distinct profiles (e.g., *Job Applications*, *Personal Info*, *Checkout Address*).
* **Instant Profile Switching:** Switch between profiles directly from the primary dropdown selector.
* **Full-Text Profile Search:** Filter profiles in the Profile Manager by name, category tag, or contained text.
* **Create New Profile Options:**
  * Start with an empty blank profile
  * Clone and duplicate the currently active profile
  * Import from resume or text file (`.txt`, `.md`, `.json`)
* **Profile Management Actions:** Rename, clone, and delete profiles (with safety guard preventing deletion of the last remaining profile).
* **Backup & Migration:**
  * **JSON Export:** Download all saved profiles and configurations as a date-stamped JSON backup file.
  * **JSON Import:** Restore profiles from an existing JSON backup.
  * **Reset to Defaults:** Restore original starter profiles with an automated safety backup created before resetting.
* **Profile Text Editor:** Direct multiline editing with auto-save, live character count, and live token count estimation (`~X tokens`).

### 8. 👁️ Pre-Fill Review & Dry-Run Inspector
* **Pre-Fill Dry-Run Mode:** Optional review toggle (`Review mapped values before injecting into webpage`) that intercepts the autofill pipeline before page injection.
* **Visual Value Preview:** Displays all mapped values alongside field labels in a staged review drawer.
* **Granular Field Checkboxes:** Include or exclude specific fields before applying changes to the page.
* **In-Place Value Editing:** Modify any AI-suggested value directly inside the review drawer prior to injection.
* **Select All / Deselect All:** Bulk toggle all staged fields with a single click.
* **Confirm & Inject:** Commits only verified, selected values to the webpage DOM.

### 9. ↩️ Reversible Fills & Safety Controls
* **1-Click Undo:** Reverts all filled fields back to their exact pre-fill values without requiring a page refresh.
* **Complete DOM State Snapshot:** Captures a comprehensive snapshot of field states (values, checked states, selection indexes) immediately prior to injection.
* **Stop / Cancel In-Flight Fills:** The primary button transforms to `Stop Auto-fill` during execution, allowing immediate abortion of active jobs.
* **Skipped Fields Tracking:** Tracks any fields that could not be mapped or filled, providing clear status reporting.

### 10. 🎯 AI Mapping Intelligence & Semantic Handling
* **Strict Data Fidelity:** Default system instructions enforce preserving user-provided information without unauthorized fabrication.
* **First & Last Name Splitting:** Intelligently splits full names when distinct *First Name* and *Last Name* fields are present.
* **Phone Number Normalization:** Strips irregular formatting characters and standardizes phone digits.
* **Dropdown Closest Option Matching:** Maps user profile values to the most semantically relevant dropdown option.
* **Placeholder Value Avoidance:** Instructs AI to avoid generic placeholder choices (e.g., *Select*, *Choose...*, *-- Select --*).
* **Multilingual Label & Subpart Matching:** Handles dual-language and compound field labels (e.g., forms using slash/pipe separators like `Region / District`).
* **Negative & Skip Directives:** Intelligently leaves targeted fields intentionally blank when profile notes specify not to fill them (e.g., `skip`, `ignore`, `blank`, `leave blank`, `do not fill`), preventing literal placeholder words from being typed into form inputs.
* **Dynamic Template Variables:** Automatically resolves dynamic template variables inside profiles at runtime:
  * `{{today}}` (ISO Date: `YYYY-MM-DD`)
  * `{{today_us}}` (`MM/DD/YYYY`)
  * `{{today_formatted}}` (e.g., `October 6, 2026`)
  * `{{in_2_weeks}}` (Date offset by +14 days)
* **Synthetic / Demo Data Mode:** Capable of generating realistic synthetic test data (e.g., sample names, `@example.com` emails) when prompted for dummy or mock testing.

### 11. 🚀 Large Form Optimization & Background Execution
* **Field Prioritization:** Prioritizes active/focused inputs, visible viewport elements, and required fields before processing off-screen DOM nodes.
* **Chunked Batch Processing:** Automatically splits massive forms into manageable AI batches (~45 fields per request) to prevent token exhaustion and timeouts.
* **Multi-Stage Fill Progress:** Reports granular status states (`Scanning...`, `Mapping Batch X of Y...`, `Injecting...`).
* **Manifest V3 Background Service Worker:** Fill execution runs in a persistent background worker, allowing jobs to continue even if the popup is closed.
* **Job State Restoration:** Re-opening the extension popup restores the progress state of any running background fill job.

### 12. 🖥️ User Interface, Accessibility & Productivity
* **Flexible Interface Modes:** Switch seamlessly between **Popup Window** (compact dropdown from toolbar) and **Chrome Side Panel** (persistent sidebar interface via `chrome.sidePanel` that stays visible while scrolling).
* **Default View Setting:** Set either Popup or Side Panel as the default launch view.
* **Dark & Light Mode:** Built-in theme switcher with theme persistence and dynamic icon asset updates.
* **Keyboard Shortcuts:**
  * `Alt + Shift + F`: Global shortcut to autofill the active webpage form with the active profile.
  * `Ctrl + Enter` / `Cmd + Enter`: Trigger autofill from within the extension interface.
  * `Esc`: Immediately abort running autofill or close open modal drawers.
* **Context Menu Integration:** Right-click context menus for rapid access:
  * *Fastfiller: Autofill with Active Template*
  * *Paste active template into field*
  * *Paste Full Name*
  * *Paste Email Address*
  * *Paste Phone Number*
  * *Paste Bio / Work Summary*
* **Custom System Prompt Editor:** View, customize, and reset the internal AI system instructions, complete with live character counting.
* **Built-in Offline User Guide:** Offline documentation and quickstart instructions accessible via the `?` button.
* **Automated Software Update Checker:** Checks for new extension releases in the background, displaying an update banner with direct release notes.
* **Chrome Web Store Multi-Language Support (i18n):** Includes 15 localized translation packages (`_locales/`: Arabic, German, English, Spanish, Filipino, French, Indonesian, Italian, Japanese, Dutch, Portuguese, Russian, Swedish, Turkish, Vietnamese) so the extension title, short description, and Web Store metadata automatically adapt to international users' native browser language.

### 13. 🔒 Privacy, Security & Technical Architecture
* **Zero-Server Architecture:** FastFiller operates entirely client-side. There are no central proxy servers, no cloud databases, and no telemetry tracking user data.
* **Local Data Storage:** All profiles, custom prompts, and settings are stored locally in `chrome.storage.local`.
* **Direct Encrypted Transport:** AI requests route directly from the user's browser to the chosen AI provider or local localhost endpoint.
* **SHA3-512 Cryptographic Hashing:** Uses `js-sha3` for internal data integrity and configuration verification.
* **Automated Test Suite:** 13 automated test suites covering API providers, Google Forms, dropdown matching, session managers, dry-run staging, storage, and background worker persistence.

---

## 🚀 Quick Installation Guide

### Option A: Install from GitHub Releases (Recommended for Users)

1. Download **`FastFiller-v1.0.0.zip`** from the [Latest Releases](https://github.com/mauryaankur99/FastFiller/releases/latest).
2. Right-click the `.zip` file and extract it to a folder on your computer.
3. Open your Chromium-based browser and navigate to the Extensions page:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
4. Toggle **Developer mode** to **ON** (top right corner).
5. Click **Load unpacked** (top left corner) and select the extracted `FastFiller` folder (the folder containing `manifest.json`).
6. Pin **FastFiller** 📌 to your browser toolbar for quick access!

---

### Option B: Clone from Source (For Developers)

```bash
# 1. Clone the repository
git clone https://github.com/mauryaankur99/FastFiller.git
cd FastFiller

# 2. Run test suites to verify integrity
npm test

# 3. Load unpacked in your browser
# Open chrome://extensions -> Developer Mode ON -> Load Unpacked -> select the FastFiller repo root.
```

---

## ⚡ How to Use

1. **Open Any Web Form**: Go to any online form (e.g., job application, Google Form, registration portal).
2. **Open FastFiller**: Click the FastFiller icon in your toolbar, or press `Alt + Shift + F` on your keyboard.
3. **Select Your AI Engine**:
   - In Settings (⚙️), choose **ChatGPT Web** or **DeepSeek Web** for zero-cost filling, or enter your API key for Gemini, Claude, OpenAI, or Ollama.
4. **Choose or Write Your Info**: Select a profile template or paste your details into the input box.
5. **Click "Auto-fill Web Form"** (or press `Ctrl + Enter`): FastFiller analyzes the form fields, requests the exact mapping from your selected AI engine, and populates the fields in sub-seconds.
6. **Review or Undo**: If you ever want to reset the form back to its original state, click the **Undo** button.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| `Alt + Shift + F` | Trigger autofill directly on the active webpage using your active profile |
| `Ctrl + Enter` / `Cmd + Enter` | Start auto-fill when popup is focused |
| `Esc` | Stop active auto-fill immediately or close open drawers |

---

## 🛡️ Privacy & Security Guarantee

FastFiller was built from day one with a strict privacy-first architecture:

- **100% Client-Side**: No telemetry, no intermediate proxies, and no external tracking servers.
- **Zero Data Harvesting**: Your data, prompts, profiles, and form contents are never collected or stored anywhere outside your own local browser storage.
- **Sensitive Field Guard**: FastFiller automatically detects and ignores credit card numbers, CVV codes, passwords, PIN codes, SSNs, and CAPTCHAs.

---

## 📂 Project Architecture

```
FastFiller/
├── manifest.json              # Chrome Extension Manifest V3 configuration
├── package.json               # Project metadata & test scripts
├── LICENSE                    # MIT License
├── AUTHORS.md                 # Core creators & leadership
├── CONTRIBUTING.md            # Guidelines for open-source contributors
├── SECURITY.md                # Security policy & disclosure protocols
├── README.md                  # Complete documentation & usage guide
├── _locales/                  # 15-language internationalization packages
├── assets/                    # Icons and branding stylesheets
├── src/
│   ├── background/            # Manifest V3 service worker & persistent job runner
│   ├── content/               # DOM form field scanner, injection engine & 1-click undo
│   ├── popup/                 # Main popup UI, settings view, templates & API providers
│   ├── services/              # Web-session managers (ChatGPT & DeepSeek), update checker
│   ├── sidepanel/             # Chrome side-panel persistent view
│   ├── help/                  # In-extension offline user guide
│   └── lib/                   # Cryptographic libraries (SHA3-512)
└── test/                      # 13 comprehensive unit & integration test suites
```

---

## 🧪 Testing

FastFiller includes 13 rigorous automated test suites covering DOM injection, dropdown matching, web session proof-of-work, background persistence, storage migrations, and update detection:

```bash
npm test
```

---

## 👥 Authors & Leadership

- **Maurya Ankur** — Co-Founder & Lead Engineer ([LinkedIn](https://www.linkedin.com/in/ankur-maurya1/))
- **Singh Sanjiv** — Co-Founder & Systems Architect ([LinkedIn](https://www.linkedin.com/in/sanjiv-singh/))
- **Organization**: [Aeigs](https://aeigs.com) — *AI Systems, Automation Engines & High-Craft Developer Tools*

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — see the LICENSE file for details.
