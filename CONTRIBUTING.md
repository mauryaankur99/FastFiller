# Contributing to FastFiller

Thank you for your interest in contributing to **FastFiller**! FastFiller is an open-source, client-first, zero-cloud browser extension. We welcome bug fixes, documentation improvements, and thoughtful feature contributions.

---

## 📜 Code of Conduct & Principles

1. **Zero-Cloud Guarantee:** Any PR that introduces cloud telemetry, external logging servers, or intermediate proxies will be rejected immediately.
2. **Quality & Test Coverage:** All PRs must pass all 12 automated unit test suites (`npm test`). If you introduce a new feature or fix a bug, please include an accompanying test.
3. **Respect Watermarks & License:** Original copyright notices, licenses, and author watermarks must remain intact across all modules.

---

## 🛠️ Local Development Setup

1. **Fork & Clone:**
   ```bash
   git clone https://github.com/mauryaankur99/FastFiller.git
   cd FastFiller/extension
   ```

2. **Install Dependencies:**
   ```bash
   npm install
   ```

3. **Run Unit Tests:**
   ```bash
   npm test
   ```
   All 12 test suites must pass.

4. **Load into Chrome / Brave / Edge:**
   - Open `chrome://extensions` (or `edge://extensions`, `brave://extensions`).
   - Enable **Developer mode** (top-right toggle).
   - Click **Load unpacked**.
   - Select the `fastfiller/extension` directory.

---

## 🌿 Contribution Workflow

1. Create a descriptive feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```
2. Make your edits following existing code style (Native Vanilla ESM, clean comments, zero unnecessary npm bloat).
3. Verify all tests pass:
   ```bash
   npm test
   ```
4. Commit with clear, conventional messages:
   ```bash
   git commit -m "feat: add support for custom phone dial code dropdowns"
   ```
5. Push to your fork and submit a **Pull Request (PR)** against the `main` branch.
6. The maintainers (**Maurya Ankur** and **Singh Sanjiv**) will review your PR and merge upon approval.

---

## 🐛 Reporting Bugs & Feature Requests

- Please use the official [GitHub Issues](https://github.com/mauryaankur99/FastFiller/issues) tab.
- Provide clear steps to reproduce, the website URL where the form failed, and the browser version you are using.
