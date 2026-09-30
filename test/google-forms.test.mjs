import assert from 'node:assert/strict';

console.log('--- Running Tests for Google Forms & ARIA Checkbox Handling ---');

// Mock a lightweight DOM tree for the Google Forms snippet
class MockNode {
  constructor(tagName, attrs = {}, textContent = '') {
    this.tagName = tagName.toUpperCase();
    this.attributes = { ...attrs };
    this.classList = {
      _classes: new Set((attrs.class || '').split(/\s+/).filter(Boolean)),
      contains: (c) => this.classList._classes.has(c),
      add: (c) => this.classList._classes.add(c),
      remove: (c) => this.classList._classes.delete(c),
      [Symbol.iterator]: function* () { yield* this._classes; }
    };
    this.children = [];
    this.parentElement = null;
    this._textContent = textContent;
    this.type = attrs.type || undefined;
    this.name = attrs.name || undefined;
    this.id = attrs.id || undefined;
    this.value = attrs.value || undefined;
    this.isConnected = true;
    this.eventsDispatched = [];
  }

  get textContent() {
    if (this._textContent) return this._textContent;
    return this.children.map(c => c.textContent).join(' ');
  }

  set textContent(val) {
    this._textContent = val;
  }

  getAttribute(k) {
    return this.attributes[k] !== undefined ? this.attributes[k] : null;
  }

  setAttribute(k, v) {
    this.attributes[k] = String(v);
  }

  appendChild(child) {
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  getBoundingClientRect() {
    return { width: 24, height: 24, top: 100, left: 100 };
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const checkMatch = (el) => {
      if (matchesSimpleSelector(el, selector)) results.push(el);
      for (const child of el.children) checkMatch(child);
    };
    for (const child of this.children) checkMatch(child);
    return results;
  }

  closest(selector) {
    let curr = this;
    while (curr) {
      if (matchesSimpleSelector(curr, selector)) return curr;
      curr = curr.parentElement;
    }
    return null;
  }

  dispatchEvent(evt) {
    this.eventsDispatched.push(evt.type || evt);
    if (evt.type === 'click' && this.getAttribute('role') === 'checkbox') {
      const current = this.getAttribute('aria-checked') === 'true';
      this.setAttribute('aria-checked', current ? 'false' : 'true');
    }
    return true;
  }

  focus() {
    this.eventsDispatched.push('focus');
  }

  click() {
    this.dispatchEvent({ type: 'click' });
  }

  cloneNode(deep = true) {
    const clone = new MockNode(this.tagName.toLowerCase(), { ...this.attributes }, this._textContent);
    if (deep) {
      for (const c of this.children) {
        clone.appendChild(c.cloneNode(true));
      }
    }
    return clone;
  }
}

function matchesSimpleSelector(el, selector) {
  const parts = selector.split(',').map(s => s.trim());
  for (const part of parts) {
    if (part === '*') return true;
    if (part === el.tagName.toLowerCase() || part === el.tagName) return true;
    if (part.startsWith('.') && el.classList.contains(part.slice(1))) return true;
    if (part.startsWith('#') && el.id === part.slice(1)) return true;
    if (part.startsWith('[') && part.endsWith(']')) {
      const inner = part.slice(1, -1);
      if (inner.includes('=')) {
        const [attr, val] = inner.split('=').map(s => s.replace(/["']/g, '').trim());
        if (el.getAttribute(attr) === val) return true;
      } else {
        if (el.getAttribute(inner) !== null) return true;
      }
    }
    if (part === 'input:not([type="hidden"])' && el.tagName === 'INPUT' && el.getAttribute('type') !== 'hidden') return true;
    if (part.includes('[role="checkbox"]') && el.getAttribute('role') === 'checkbox') return true;
    if (part.includes('[role="heading"]') && el.getAttribute('role') === 'heading') return true;
  }
  return false;
}

// Build the Google Forms sample DOM tree from user snippet
const root = new MockNode('div', { class: 'doc-root' });
const geS5n = root.appendChild(new MockNode('div', { class: 'geS5n' }));

// Question Title Block
const z12JJ = geS5n.appendChild(new MockNode('div', { class: 'z12JJ' }));
const m4dnq = z12JJ.appendChild(new MockNode('div', { class: 'M4DNQ' }));
const heading = m4dnq.appendChild(new MockNode('div', { id: 'i16', role: 'heading', class: 'HoXoMd' }));
heading.appendChild(new MockNode('span', { class: 'M7eMe' }, 'What days will you attend?'));
heading.appendChild(new MockNode('span', { class: 'vnumgf', 'aria-label': 'Required question' }, ' *'));

// Options list
const y6Myld = geS5n.appendChild(new MockNode('div', { class: 'Y6Myld' }));
const hiddenSentinel = y6Myld.appendChild(new MockNode('input', { type: 'hidden', name: 'entry.sentinel' }));
const list = y6Myld.appendChild(new MockNode('div', { role: 'list' }));

// Day 1
const item1 = list.appendChild(new MockNode('div', { class: 'eBFwI', role: 'listitem' }));
const label1 = item1.appendChild(new MockNode('label', { for: 'i22' }));
const cb1 = label1.appendChild(new MockNode('div', {
  id: 'i22',
  role: 'checkbox',
  'aria-label': 'Day 1',
  'data-answer-value': 'Day 1',
  'aria-checked': 'false'
}));
label1.appendChild(new MockNode('span', { class: 'aDTYNe' }, 'Day 1'));

// Day 2
const item2 = list.appendChild(new MockNode('div', { class: 'eBFwI', role: 'listitem' }));
const label2 = item2.appendChild(new MockNode('label', { for: 'i25' }));
const cb2 = label2.appendChild(new MockNode('div', {
  id: 'i25',
  role: 'checkbox',
  'aria-label': 'Day 2',
  'data-answer-value': 'Day 2',
  'aria-checked': 'false'
}));
label2.appendChild(new MockNode('span', { class: 'aDTYNe' }, 'Day 2'));

// Day 3
const item3 = list.appendChild(new MockNode('div', { class: 'eBFwI', role: 'listitem' }));
const label3 = item3.appendChild(new MockNode('label', { for: 'i28' }));
const cb3 = label3.appendChild(new MockNode('div', {
  id: 'i28',
  role: 'checkbox',
  'aria-label': 'Day 3',
  'data-answer-value': 'Day 3',
  'aria-checked': 'false'
}));
label3.appendChild(new MockNode('span', { class: 'aDTYNe' }, 'Day 3'));

// Test 1: Querying eligible inputs must capture all 3 checkboxes and ignore the hidden sentinel
function queryEligibleInputsTest(container) {
  const selector = 'input:not([type="hidden"]):not([type="file"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [role="checkbox"]:not([aria-disabled="true"]), [role="radio"]:not([aria-disabled="true"])';
  return container.querySelectorAll(selector).filter(el => {
    // Avoid double counting if native input is inside ARIA wrapper
    if (el.getAttribute('role') === 'checkbox') {
      const inner = el.querySelector('input[type="checkbox"]');
      if (inner) return false;
    }
    return true;
  });
}

const discovered = queryEligibleInputsTest(root);
assert.equal(discovered.length, 3, 'Should discover exactly 3 checkboxes');
assert.equal(discovered[0].id, 'i22');
assert.equal(discovered[1].id, 'i25');
assert.equal(discovered[2].id, 'i28');
console.log('✓ Test 1: Successfully discovered all 3 Google Forms [role="checkbox"] elements');

// Test 2: Section / Question Heading resolution
function resolveSectionHeaderTest(element) {
  const headingSelector = 'h1, h2, h3, h4, h5, h6, [role="heading"], .section-title, .form-title, .heading, [class*="section-header"], .M7eMe';
  let current = element;
  while (current) {
    const parent = current.parentElement;
    if (!parent) break;

    const siblings = parent.children;
    const selfIdx = siblings.indexOf(current);
    for (let i = 0; i < selfIdx; i++) {
      const sib = siblings[i];
      const match = matchesSimpleSelector(sib, headingSelector) ? sib : sib.querySelector(headingSelector);
      if (match) {
        const clone = match.cloneNode(true);
        // remove asterisk / required tags
        clone.children = clone.children.filter(c => !c.classList.contains('vnumgf'));
        return clone.textContent.trim();
      }
    }
    current = parent;
  }
  return undefined;
}

const qTitle1 = resolveSectionHeaderTest(cb1);
assert.equal(qTitle1, 'What days will you attend?', 'Should resolve Google Forms question heading');
console.log('✓ Test 2: Successfully resolved question title "What days will you attend?" for checkbox');

// Test 3: Synthetic user click toggles Google Forms aria-checked
function toggleAriaCheckboxTest(element, shouldCheck) {
  const isChecked = element.getAttribute('aria-checked') === 'true';
  if (isChecked !== shouldCheck) {
    element.focus();
    element.dispatchEvent({ type: 'mousedown' });
    element.dispatchEvent({ type: 'mouseup' });
    element.click();
  }
}

assert.equal(cb1.getAttribute('aria-checked'), 'false');
toggleAriaCheckboxTest(cb1, true);
assert.equal(cb1.getAttribute('aria-checked'), 'true');
assert.ok(cb1.eventsDispatched.includes('click'));
console.log('✓ Test 3: Successfully toggled Day 1 checkbox to aria-checked="true" via click simulation');

toggleAriaCheckboxTest(cb1, false);
assert.equal(cb1.getAttribute('aria-checked'), 'false');
console.log('✓ Test 4: Successfully toggled Day 1 checkbox back to aria-checked="false" for 1-Click Undo');

console.log('\nAll Google Forms & ARIA Checkbox tests passed successfully!');
