# FastFiller 🚀 — 1-Click AI Auto Form Filler

[![Website](https://img.shields.io/badge/Website-fastfiller.aeigs.com-blue?logo=googlechrome&logoColor=white)](https://fastfiller.aeigs.com/)
[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/mauryaankur99/FastFiller/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-success.svg)](manifest.json)
[![Platform](https://img.shields.io/badge/Platform-Chrome%20%7C%20Brave%20%7C%20Edge%20%7C%20Opera-purple.svg)](#-quick-installation-guide)
[![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local--First-brightgreen.svg)](#-privacy--security-guarantee)

> **FastFiller** is an open-source, client-first, privacy-respecting browser extension that instantly maps and fills complex web forms using AI. Works on Google Forms, job application portals (Workday, Greenhouse, Lever, Ashby, LinkedIn), government forms, university admission portals, and custom corporate workflows.
>
> 🌐 **Live Website & Interactive Demo:** [https://fastfiller.aeigs.com/](https://fastfiller.aeigs.com/)  
> 📦 **Latest Release:** [FastFiller v1.0.0 (ZIP & Source)](https://github.com/mauryaankur99/FastFiller/releases/tag/v1.0.0)

---

## 🌟 Key Highlights & AI Architecture

FastFiller features an intelligent, multi-tier engine architecture designed to give you 100% flexibility—from zero-cost browser sessions to ultra-fast cloud APIs and air-gapped local privacy:

```text
FastFiller AI Model Architecture
├── 1. Web Session AI (100% Free · Zero API Keys Needed)
│   ├── ChatGPT Web
│   │   └── Direct browser session authentication (uses active free ChatGPT login)
│   └── DeepSeek Web
│       └── Native web session integration (free web interface)
│
├── 2. Google AI Studio (Free-Tier API)
│   ├── Gemini 3.5 Flash Lite (Ultra-fast, lowest latency, generous free tier)
│   └── Gemini 3.5 Flash (Balanced reasoning & form-mapping capability)
│
├── 3. Direct Fast Cloud APIs
│   ├── DeepSeek V4 Flash (High-speed direct API, optimized for structured JSON)
│   └── DeepSeek V4 Pro (Deep reasoning for complex multi-page applications)
│
├── 4. Zero-Auth Relay
│   └── Space Bunny (OpenCode Zero-Auth relay)
│
├── 5. Offline & Air-Gapped (100% Free & Local Privacy)
│   └── Local Ollama
│       └── Runs local open weights (Llama 3, Mistral, Qwen, DeepSeek-Coder)
│
└── 6. Custom Provider (Universal Gateway)
    └── Any OpenAI-compatible endpoint
        ├── Free endpoints / self-hosted relays
        └── Paid commercial APIs (OpenAI, Anthropic Claude, OpenRouter, Groq)
```

- **🧠 Intelligent Field Understanding**:
  - Handles text, email, phone, textareas, native `<select>`, **React-Select**, custom ARIA comboboxes, radio buttons, and multi-select checkboxes.
  - Robust fuzzy, bilingual (e.g. English/Hindi), and canonical option matching.
- **🔄 Headless Background Worker**: Form filling continues seamlessly in the Chrome Service Worker even if you close the popup or switch tabs.
- **↩️ 1-Click Instant Undo**: Snapshots initial DOM state before filling, allowing you to instantly revert any fill action with zero page reload.
- **📋 Profile & Template Manager**: Save multiple profiles (Job Applications, College Applications, Government ID, Shipping Addresses) with dynamic variable expansion.
- **🌐 16 Built-in Languages**: Full internationalization support (`_locales/`) for English, Hindi, Spanish, French, German, Japanese, and more.
- **🔄 In-App Automatic Update Checker**: Notifies users cleanly when a new release is available on GitHub with 1-click update download.

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
| `Ctrl + Enter` | Start auto-fill when popup is focused |
| `Esc` | Stop active auto-fill immediately |

---

## 🛡️ Privacy & Security Guarantee

FastFiller was built from day one with a strict privacy-first architecture:

- **100% Client-Side**: No telemetry, no intermediate proxies, and no external tracking servers.
- **Zero Data Harvesting**: Your data, prompts, profiles, and form contents are never collected or stored anywhere outside your own local browser storage.
- **Sensitive Field Guard**: FastFiller automatically detects and ignores credit card numbers, CVV codes, passwords, and CAPTCHAs.

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
├── _locales/                  # 16-language internationalization
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
