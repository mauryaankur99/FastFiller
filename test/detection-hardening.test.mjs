import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { buildMessages } from '../src/popup/api-providers.js';

console.log('--- Running Tests for Form Field Detection Hardening & Bloat Elimination ---');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contentScriptPath = path.resolve(__dirname, '../src/content/index.js');
const code = fs.readFileSync(contentScriptPath, 'utf8');

class MockClassList {
  constructor() {
    this._classes = new Set();
  }
  add(c) { this._classes.add(c); }
  remove(c) { this._classes.delete(c); }
  contains(c) { return this._classes.has(c); }
  [Symbol.iterator]() { return this._classes.values(); }
}

class MockElement {
  constructor(tagName = 'DIV', attributes = {}) {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attributes };
    this.children = [];
    this.parentElement = null;
    this.classList = new MockClassList();
    if (attributes.class) {
      attributes.class.split(/\s+/).forEach((c) => this.classList.add(c));
    }
    this.id = attributes.id || '';
    this.name = attributes.name || '';
    this.type = attributes.type || '';
    this.value = attributes.value || '';
    this.placeholder = attributes.placeholder || '';
    this.disabled = Boolean(attributes.disabled);
    this.readOnly = Boolean(attributes.readonly);
    this.checked = Boolean(attributes.checked);
    this.textContent = attributes.textContent || '';
    this.isConnected = true;
    this.nodeType = 1;
    this.className = attributes.class || '';
    this.style = {};
  }

  getAttribute(attr) {
    if (attr === 'role') return this.attributes.role || null;
    if (attr === 'aria-label') return this.attributes['aria-label'] || null;
    if (attr === 'aria-readonly') return this.attributes['aria-readonly'] || null;
    if (attr === 'aria-disabled') return this.attributes['aria-disabled'] || null;
    if (attr === 'aria-required') return this.attributes['aria-required'] || null;
    if (attr === 'aria-checked') return this.attributes['aria-checked'] || null;
    if (attr === 'aria-autocomplete') return this.attributes['aria-autocomplete'] || null;
    return this.attributes[attr] || null;
  }

  setAttribute(attr, val) {
    this.attributes[attr] = String(val);
    if (attr === 'id') this.id = String(val);
    if (attr === 'name') this.name = String(val);
    if (attr === 'type') this.type = String(val);
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  getBoundingClientRect() {
    return { width: 120, height: 32, top: 10, left: 10, right: 130, bottom: 42 };
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (matchesSimple(curr, selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const res = [];
    const walk = (node) => {
      for (const child of node.children) {
        if (matchesSimple(child, selector)) {
          res.push(child);
        }
        walk(child);
      }
    };
    walk(this);
    return res;
  }

  cloneNode(deep = true) {
    const clone = new MockElement(this.tagName, { ...this.attributes });
    clone.textContent = this.textContent;
    clone.id = this.id;
    clone.name = this.name;
    clone.type = this.type;
    clone.value = this.value;
    if (deep) {
      for (const child of this.children) {
        clone.appendChild(child.cloneNode(true));
      }
    }
    return clone;
  }
}

function matchesSimple(el, selector) {
  const parts = selector.split(',').map((s) => s.trim());
  for (const part of parts) {
    if (part === '*') return true;

    // Chained :not(...) selectors
    if (part.includes(':not(')) {
      const baseMatch = part.match(/^([^:]+)/);
      const base = baseMatch ? baseMatch[1] : '*';
      if (!matchesSimple(el, base)) continue;

      const notMatches = Array.from(part.matchAll(/:not\(([^)]+)\)/g));
      let rejected = false;
      for (const m of notMatches) {
        if (matchesSimple(el, m[1])) {
          rejected = true;
          break;
        }
      }
      if (!rejected) return true;
      continue;
    }

    if (part === el.tagName.toLowerCase() || part === el.tagName) return true;
    if (part.startsWith('.') && el.classList.contains(part.slice(1))) return true;
    if (part.startsWith('#') && el.id === part.slice(1)) return true;

    // Attribute matches
    if (part.startsWith('[') && part.endsWith(']')) {
      const inner = part.slice(1, -1);
      if (inner.includes('*=')) {
        const [attr, rawVal] = inner.split('*=');
        const val = rawVal.replace(/["']/g, '').replace(/\s+i$/i, '').trim();
        const attrVal = el.getAttribute(attr.trim()) || (attr.trim() === 'class' ? Array.from(el.classList).join(' ') : el[attr.trim()]) || '';
        if (attrVal.toLowerCase().includes(val.toLowerCase())) return true;
      } else if (inner.includes('=')) {
        const [attr, rawVal] = inner.split('=');
        const val = rawVal.replace(/["']/g, '').replace(/\s+i$/i, '').trim();
        const attrVal = el.getAttribute(attr.trim()) || el[attr.trim()] || '';
        if (attrVal.toLowerCase() === val.toLowerCase()) return true;
      } else {
        if (el.getAttribute(inner) !== null || Boolean(el[inner]) === true) return true;
      }
    }

    if (part === 'select' && el.tagName === 'SELECT') return true;
    if (part === 'textarea' && el.tagName === 'TEXTAREA') return true;
    if (part === 'input' && el.tagName === 'INPUT') return true;
  }
  return false;
}

// Build VM Context
const context = {
  console,
  setTimeout,
  clearTimeout,
  addEventListener: () => {},
  removeEventListener: () => {},
  CSS: { escape: (s) => String(s).replace(/([^\w-])/g, '\\$1') },
  HTMLElement: MockElement,
  HTMLInputElement: class extends MockElement { constructor() { super('INPUT'); } },
  HTMLTextAreaElement: class extends MockElement { constructor() { super('TEXTAREA'); } },
  HTMLSelectElement: class extends MockElement { constructor() { super('SELECT'); } },
  getComputedStyle: (el) => {
    return {
      display: el.style?.display || 'block',
      visibility: el.style?.visibility || 'visible',
      opacity: el.style?.opacity || '1'
    };
  },
  document: {
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => new MockElement('DIV'),
    head: { appendChild: () => {} },
    documentElement: { appendChild: () => {} }
  }
};
context.window = context;
context.top = context;
context.globalThis = context;
vm.createContext(context);
vm.runInContext(code, context);

const {
  queryEligibleInputs,
  collectFieldMetadata,
  isElementVisible
} = context.__fastFillerContentScript;

// =========================================================================
// TEST 1: Exclude non-input buttons (<input type="submit|button|reset|image">)
// =========================================================================
{
  const form = new MockElement('form');
  const txt = form.appendChild(new MockElement('input', { type: 'text', name: 'applicant_name' }));
  const sub = form.appendChild(new MockElement('input', { type: 'submit', value: 'Submit Form' }));
  const btn = form.appendChild(new MockElement('input', { type: 'button', value: 'Generate OTP' }));
  const rst = form.appendChild(new MockElement('input', { type: 'reset', value: 'Clear' }));
  const img = form.appendChild(new MockElement('input', { type: 'image', src: 'btn.png' }));

  const eligible = queryEligibleInputs(form);
  assert.equal(eligible.length, 1, 'Only the actual text input should be eligible');
  assert.equal(eligible[0], txt, 'Matched applicant_name input');
  console.log('✓ Test 1: Button, submit, reset, and image inputs are cleanly excluded');
}

// =========================================================================
// TEST 2: Exclude non-editable static readonly fields
// =========================================================================
{
  const form = new MockElement('form');
  const appNo = form.appendChild(new MockElement('input', { type: 'text', name: 'app_no', value: 'REG-98765', readonly: true }));
  const appDate = form.appendChild(new MockElement('input', { type: 'text', name: 'dob', placeholder: 'Select DOB', readonly: true, class: 'flatpickr-input' }));
  const normalInput = form.appendChild(new MockElement('input', { type: 'text', name: 'father_name' }));

  const eligible = queryEligibleInputs(form);
  assert.equal(eligible.length, 2, 'Static readonly app_no must be excluded; datepicker and father_name preserved');
  assert.ok(eligible.includes(appDate), 'Datepicker input preserved');
  assert.ok(eligible.includes(normalInput), 'Normal input preserved');
  console.log('✓ Test 2: Static readonly fields excluded while calendar datepickers are preserved');
}

// =========================================================================
// TEST 3: Deduplicate ARIA Combobox wrappers when inner input is present
// =========================================================================
{
  const form = new MockElement('form');
  const comboWrapper = form.appendChild(new MockElement('div', { role: 'combobox', class: 'custom-select-wrap' }));
  const innerInput = comboWrapper.appendChild(new MockElement('input', { type: 'text', name: 'district_search' }));

  const eligible = queryEligibleInputs(form);
  assert.equal(eligible.length, 1, 'Only 1 input should be collected for combobox, not 2');
  assert.equal(eligible[0], innerInput, 'Inner input collected, outer ARIA combobox skipped');
  console.log('✓ Test 3: Outer combobox/listbox wrapper deduplicated when inner input is present');
}

// =========================================================================
// TEST 4: Exclude peripheral chatbot widgets and header search
// =========================================================================
{
  const root = new MockElement('div');
  const header = root.appendChild(new MockElement('header'));
  const headerSearch = header.appendChild(new MockElement('input', { type: 'search', name: 'q', placeholder: 'Search portal...' }));

  const chatContainer = root.appendChild(new MockElement('div', { id: 'intercom-container', class: 'chat-widget' }));
  const chatInput = chatContainer.appendChild(new MockElement('input', { type: 'text', placeholder: 'Ask support...' }));

  const mainForm = root.appendChild(new MockElement('form', { id: 'main-application' }));
  const realField = mainForm.appendChild(new MockElement('input', { type: 'text', name: 'email', placeholder: 'Your email' }));

  const eligible = queryEligibleInputs(root);
  assert.equal(eligible.length, 1, 'Header search and chat widget inputs must be excluded');
  assert.equal(eligible[0], realField, 'Real form field captured');
  console.log('✓ Test 4: Peripheral chat widgets and header navigation search bars excluded');
}

// =========================================================================
// TEST 5: Ancestor visibility check rejects inactive tabs and collapsed panels
// =========================================================================
{
  const root = new MockElement('div');
  const activeTab = root.appendChild(new MockElement('div', { class: 'tab-pane active show' }));
  const visibleField = activeTab.appendChild(new MockElement('input', { type: 'text', name: 'active_input' }));

  const inactiveTab = root.appendChild(new MockElement('div', { class: 'tab-pane' }));
  const hiddenField = inactiveTab.appendChild(new MockElement('input', { type: 'text', name: 'inactive_input' }));

  // Simulate window.getComputedStyle returning display:none for inactiveTab
  inactiveTab.style.display = 'none';

  assert.equal(isElementVisible(visibleField), true, 'Field in active tab is visible');
  assert.equal(isElementVisible(hiddenField), false, 'Field in inactive tab is invisible');
  console.log('✓ Test 5: Inactive multi-step tabs and collapsed accordions correctly report isVisible: false');
}

// =========================================================================
// TEST 6: Radio group canonicalization (1 primary question field, others secondary)
// =========================================================================
{
  const form = new MockElement('form');
  const fieldset = form.appendChild(new MockElement('fieldset'));
  const legend = fieldset.appendChild(new MockElement('legend', { textContent: 'Gender / लिंग' }));

  const r1 = fieldset.appendChild(new MockElement('input', { type: 'radio', name: 'gender', value: 'Male', textContent: 'Male' }));
  const r2 = fieldset.appendChild(new MockElement('input', { type: 'radio', name: 'gender', value: 'Female', textContent: 'Female' }));
  const r3 = fieldset.appendChild(new MockElement('input', { type: 'radio', name: 'gender', value: 'Other', textContent: 'Other' }));

  // Tag inputs
  r1.classList.add('form-filler-0-0');
  r2.classList.add('form-filler-0-1');
  r3.classList.add('form-filler-0-2');

  const meta = collectFieldMetadata(form, 0);
  assert.equal(meta.length, 3, 'Metadata collected for all radios');
  assert.equal(meta[0].isRadioGroupSecondary, undefined, 'First radio is primary');
  assert.equal(meta[0].labelText, 'Gender / लिंग', 'Question heading resolved from legend');
  assert.equal(meta[1].isRadioGroupSecondary, true, 'Second radio marked secondary');
  assert.equal(meta[2].isRadioGroupSecondary, true, 'Third radio marked secondary');

  // Verify buildMessages excludes secondary radios
  const messages = buildMessages('You are a form filler', 'Fill form', meta);
  const promptText = messages[messages.length - 1].content;
  const occurrences = (promptText.match(/type=radio/g) || []).length;
  assert.equal(occurrences, 1, 'AI prompt contains exactly 1 canonical entry for Gender radio group, not 3');
  console.log('✓ Test 6: Radio button group canonicalized to 1 prompt field with question title');
}

console.log('\nAll 6 Detection Hardening tests passed successfully!');
