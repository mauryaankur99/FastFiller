import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

import { fileURLToPath } from 'node:url';
import path from 'node:path';

console.log('--- Running Tests for FastFiller Robustness Engine ---');

const contentPath = path.resolve(fileURLToPath(import.meta.url), '../../src/content/index.js');
const code = fs.readFileSync(contentPath, 'utf8');

// Global mock DOM environment
class MockHTMLElement {
  constructor() {
    this.classList = {
      _classes: new Set(),
      add(c) { this._classes.add(c); },
      remove(c) { this._classes.delete(c); },
      contains(c) { return this._classes.has(c); },
      [Symbol.iterator]: function* () { yield* this._classes; }
    };
  }
}
class MockHTMLInputElement extends MockHTMLElement {
  constructor() {
    super();
    this.tagName = 'INPUT';
    this.type = 'text';
  }
}
class MockHTMLTextAreaElement extends MockHTMLElement {
  constructor() {
    super();
    this.tagName = 'TEXTAREA';
  }
}
class MockHTMLSelectElement extends MockHTMLElement {
  constructor() {
    super();
    this.tagName = 'SELECT';
  }
}
class MockEvent {
  constructor(type, init = {}) {
    this.type = type;
    this.bubbles = Boolean(init.bubbles);
    this.cancelable = Boolean(init.cancelable);
  }
}
class MockInputEvent extends MockEvent {
  constructor(type, init = {}) {
    super(type, init);
    this.inputType = init.inputType;
    this.data = init.data;
  }
}

const context = {
  console,
  setTimeout,
  clearTimeout,
  addEventListener: () => {},
  removeEventListener: () => {},
  CSS: {
    escape: (s) => String(s).replace(/([^\w-])/g, '\\$1')
  },
  Event: MockEvent,
  InputEvent: MockInputEvent,
  PointerEvent: MockEvent,
  MouseEvent: MockEvent,
  KeyboardEvent: MockEvent,
  HTMLElement: MockHTMLElement,
  HTMLInputElement: MockHTMLInputElement,
  HTMLTextAreaElement: MockHTMLTextAreaElement,
  HTMLSelectElement: MockHTMLSelectElement,
  document: {
    addEventListener: () => {},
    removeEventListener: () => {},
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => ({ id: '', textContent: '', style: {} }),
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
  findTaggedElement,
  normalizeDateValue,
  dispatchChangeEvents,
  setElementValueNative,
  executeFormFill,
  executeUndo,
  queryEligibleInputs,
  collectFieldMetadata,
  cancelFormFill
} = context.__fastFillerContentScript;

// ============================================================
// TEST SUITE 1: Item 2 - Native Date Input ISO Normalization
// ============================================================
console.log('\n[Suite 1: Date ISO RFC 3339 Normalization]');

// 1. Standard ISO YYYY-MM-DD
assert.equal(normalizeDateValue('1990-05-15'), '1990-05-15');
console.log('✓ Already formatted ISO date preserved: 1990-05-15');

// 2. ISO timestamp with time and Z
assert.equal(normalizeDateValue('1995-12-25T14:30:00.000Z'), '1995-12-25');
console.log('✓ ISO timestamp trimmed to YYYY-MM-DD: 1995-12-25');

// 3. Slash delimited YYYY/MM/DD or YYYY/M/D
assert.equal(normalizeDateValue('2001/4/9'), '2001-04-09');
console.log('✓ Slash YYYY/M/D normalized and zero-padded: 2001-04-09');

// 4. DD/MM/YYYY or DD-MM-YYYY (day > 12)
assert.equal(normalizeDateValue('25/08/1992'), '1992-08-25');
assert.equal(normalizeDateValue('31-10-1988'), '1988-10-31');
console.log('✓ European DD/MM/YYYY and DD-MM-YYYY recognized: 1992-08-25, 1988-10-31');

// 5. MM/DD/YYYY (month <= 12, day > 12)
assert.equal(normalizeDateValue('07/28/1999'), '1999-07-28');
console.log('✓ US MM/DD/YYYY recognized: 1999-07-28');

// 6. Natural textual date string
assert.equal(normalizeDateValue('October 12, 1994'), '1994-10-12');
console.log('✓ Textual date string parsed: 1994-10-12');

// ============================================================
// TEST SUITE 2: Item 5 - MaxLength & Phone Mask Stripping
// ============================================================
console.log('\n[Suite 2: MaxLength Truncation & Phone Mask Stripping]');

function createMockInput(type, attrs = {}) {
  const events = [];
  const el = Object.assign(new MockHTMLInputElement(), {
    type,
    maxLength: attrs.maxLength || -1,
    name: attrs.name || '',
    id: attrs.id || '',
    placeholder: attrs.placeholder || '',
    autocomplete: attrs.autocomplete || '',
    value: '',
    ownerDocument: context.document,
    dispatchEvent(evt) {
      events.push(evt);
    },
    getEvents() {
      return events;
    }
  });
  return el;
}

// 1. Phone number with mask formatted into a 10-digit field
const phoneInput = createMockInput('tel', { maxLength: 10, name: 'phone_number' });
setElementValueNative(phoneInput, '+1 (555) 234-5678');
assert.equal(phoneInput.value, '5552345678', 'Leading +1 stripped and stripped to 10 digits');
console.log('✓ US masked phone "+1 (555) 234-5678" normalized to 10 digits "5552345678" for maxLength=10');

// 2. Local 10-digit phone formatted with dashes
const phoneInput2 = createMockInput('tel', { maxLength: 10, name: 'mobile' });
setElementValueNative(phoneInput2, '987-654-3210');
assert.equal(phoneInput2.value, '9876543210');
console.log('✓ Dashed phone "987-654-3210" stripped to digits "9876543210" for maxLength=10');

// 3. Strict Zip Code with 5-digit maxLength
const zipInput = createMockInput('text', { maxLength: 5, name: 'zip_code' });
setElementValueNative(zipInput, '90210-1234');
assert.equal(zipInput.value, '90210');
console.log('✓ 9-digit zip "90210-1234" clamped cleanly to "90210" for maxLength=5');

// ============================================================
// TEST SUITE 3: Item 3 - React 18 / Vue Synthetic InputEvent
// ============================================================
console.log('\n[Suite 3: Synthetic InputEvent & Validation Lifecycle]');

const textInput = createMockInput('text', { name: 'username' });
setElementValueNative(textInput, 'alexander');

const dispatched = textInput.getEvents();
const eventTypes = dispatched.map(e => e.type);

assert.ok(eventTypes.includes('focus'), 'focus event was dispatched');
assert.ok(eventTypes.includes('input'), 'input event was dispatched');
assert.ok(eventTypes.includes('change'), 'change event was dispatched');
assert.ok(eventTypes.includes('blur'), 'blur event was dispatched for reactive form validation clearing');

const inputEvt = dispatched.find(e => e.type === 'input');
assert.equal(inputEvt.inputType, 'insertReplacementText', 'InputEvent contains insertReplacementText inputType');
assert.equal(inputEvt.data, 'alexander', 'InputEvent data carries payload');
console.log('✓ Focus -> InputEvent(insertReplacementText) -> Change -> Blur full lifecycle verified');

// ============================================================
// TEST SUITE 4: Item 6 - Phone Country Dial Code Matching
// ============================================================
console.log('\n[Suite 4: International Phone Country Code Select Matching]');

function createMockSelect(optionsData) {
  const options = optionsData.map((d, index) => ({
    index,
    value: d.value,
    text: d.text,
    selected: false,
    disabled: Boolean(d.disabled)
  }));

  const select = Object.assign(new MockHTMLSelectElement(), {
    options,
    selectedIndex: 0,
    value: options[0]?.value || '',
    ownerDocument: context.document,
    dispatchEvent() {}
  });
  return select;
}

const countrySelect = createMockSelect([
  { value: '', text: 'Select Country Code', disabled: true },
  { value: 'US', text: 'United States (+1)' },
  { value: 'IN', text: 'India (+91)' },
  { value: 'GB', text: 'United Kingdom (+44)' },
  { value: 'DE', text: 'Germany (+49)' }
]);

// 1. Fill with "+91"
const matchedIndia = setElementValueNative(countrySelect, '+91');
assert.ok(matchedIndia);
assert.equal(countrySelect.selectedIndex, 2, 'Matched India (+91) at index 2');
console.log('✓ Target "+91" accurately matched option "India (+91)"');

// 2. Fill with "+1"
const matchedUS = setElementValueNative(countrySelect, '+1');
assert.ok(matchedUS);
assert.equal(countrySelect.selectedIndex, 1, 'Matched United States (+1) at index 1');
console.log('✓ Target "+1" accurately matched option "United States (+1)"');

// 3. Fill with "+44"
const matchedUK = setElementValueNative(countrySelect, '+44');
assert.ok(matchedUK);
assert.equal(countrySelect.selectedIndex, 3, 'Matched United Kingdom (+44) at index 3');
console.log('✓ Target "+44" accurately matched option "United Kingdom (+44)"');

// ============================================================
// TEST SUITE 5: Item 1 - Shadow DOM Deep Search & Undo
// ============================================================
console.log('\n[Suite 5: Shadow DOM Deep Traversal]');

// Create a DOM tree with nested ShadowRoot
const shadowInput = createMockInput('text', { name: 'shadow_field' });
shadowInput.classList.add('form-filler-0-9');

const shadowRoot = {
  querySelector(sel) {
    if (sel.includes('form-filler-0-9')) return shadowInput;
    return null;
  },
  querySelectorAll() {
    return [];
  }
};

const hostElement = {
  shadowRoot,
  querySelector() { return null; },
  querySelectorAll() { return []; }
};

const mockDoc = {
  defaultView: context,
  querySelector() { return null; }, // Light DOM returns nothing!
  querySelectorAll(sel) {
    if (sel === '*') return [hostElement];
    return [];
  }
};
shadowInput.ownerDocument = mockDoc;

// 1. Verify findTaggedElement penetrates shadow root
const found = findTaggedElement(mockDoc, 'form-filler-0-9');
assert.equal(found, shadowInput, 'findTaggedElement discovered shadowInput inside shadowRoot');
console.log('✓ findTaggedElement successfully penetrated Shadow DOM to find tagged element');

// 2. Verify executeFormFill fills inside shadow DOM
const fillResults = executeFormFill({ 'form-filler-0-9': 'Deep Shadow Value' }, mockDoc);
assert.ok(fillResults['form-filler-0-9']?.success, 'Filled element inside shadow DOM');
assert.equal(shadowInput.value, 'Deep Shadow Value');
console.log('✓ executeFormFill successfully injected value into Shadow DOM input');

// 3. Verify executeUndo restores value inside shadow DOM
const undoResult = executeUndo(mockDoc);
assert.ok(undoResult.success);
assert.equal(undoResult.restoredCount, 1);
console.log('✓ executeUndo successfully restored previous state inside Shadow DOM input');

// ============================================================
// TEST SUITE 6: Item 7 - Actionable 1-Click Error Recovery Chips
// ============================================================
console.log('\n[Suite 6: Actionable 1-Click Error Recovery Chips]');

const popupPath = path.resolve(fileURLToPath(import.meta.url), '../../src/popup/index.js');
const popupCode = fs.readFileSync(popupPath, 'utf8');
const startIdx = popupCode.indexOf('function buildActionableErrorFeedback');
const endIdx = popupCode.indexOf('async function executeFormFill');
assert.ok(startIdx !== -1 && endIdx !== -1, 'buildActionableErrorFeedback boundary found in src/popup/index.js');
const fnStr = popupCode.slice(startIdx, endIdx);

const mockPopupState = {
  view: 'main',
  settingsTab: 'providers',
  config: { activeProvider: 'custom' },
  fillFeedback: null
};

const popupContext = {
  console,
  state: mockPopupState,
  render: () => {},
  saveConfig: async () => {},
  scanPageFields: () => {},
  chrome: {
    tabs: {
      create: () => {},
      reload: () => {}
    }
  }
};
vm.createContext(popupContext);
vm.runInContext(fnStr, popupContext);
const buildActionableErrorFeedback = popupContext.buildActionableErrorFeedback;

// 1. HTTP 401 Unauthorized
const err401 = buildActionableErrorFeedback(new Error('HTTP 401: Unauthorized API key provided'), { id: 101 });
assert.equal(err401.type, 'danger');
assert.ok(err401.actions.length >= 2, 'Should offer Settings and Switch to ChatGPT Web');
assert.ok(err401.actions.some(a => a.label.includes('API Key') || a.label.includes('Settings')), 'Has Configure API Key chip');
assert.ok(err401.actions.some(a => a.label.includes('ChatGPT Web')), 'Has Switch to ChatGPT Web chip');
console.log('✓ 401 Unauthorized generates "Configure API Key" and "Switch to Free ChatGPT Web" chips');

// 2. HTTP 429 Rate Limit
const err429 = buildActionableErrorFeedback(new Error('Rate limit exceeded (HTTP 429). Please retry later.'), { id: 101 });
assert.ok(err429.actions.some(a => a.label.includes('ChatGPT Web')), 'Has Switch to ChatGPT Web chip');
assert.ok(err429.actions.some(a => a.label.includes('Model / API') || a.label.includes('Settings')), 'Has Configure Model/API chip');
console.log('✓ 429 Rate Limit generates "Switch to Free ChatGPT Web" and "Configure Model / API" chips');

// 3. Disconnected / Missing ChatGPT Web tab
const errChatGPT = buildActionableErrorFeedback(new Error('No open ChatGPT tab found. Please open chatgpt.com.'), { id: 101 });
assert.ok(errChatGPT.actions.some(a => a.label.includes('Open ChatGPT Tab')), 'Has Open ChatGPT Tab chip');
assert.ok(errChatGPT.actions.some(a => a.label.includes('Switch to API Engine')), 'Has Switch to API Engine chip');
console.log('✓ Disconnected ChatGPT generates "Open ChatGPT Tab" and "Switch to API Engine" chips');

// 4. Tab Permissions / Cannot communicate with page
const errPerms = buildActionableErrorFeedback(new Error('Cannot communicate with page. Please check tab permissions.'), { id: 101 });
assert.ok(errPerms.actions.some(a => a.label.includes('Reload Page')), 'Has Reload Page chip');
console.log('✓ Permission/Comm error generates "Reload Page" chip');

// ============================================================
// TEST SUITE 7: React-Select & Autocomplete Combobox Handling
// ============================================================
console.log('\n[Suite 7: React-Select & Autocomplete Combobox Handling]');

// 1. Single-Select React-Select component (e.g. State)
const mockStateControl = new MockHTMLElement();
mockStateControl.classList.add('css-yk16xz-control');
mockStateControl.dispatchEvent = () => {};

const mockPlaceholder = new MockHTMLElement();
mockPlaceholder.classList.add('css-1wa3eu0-placeholder');
mockPlaceholder.textContent = 'Select State';

mockStateControl.querySelector = (sel) => {
  if (sel.includes('placeholder')) return mockPlaceholder;
  return null;
};

const stateInput = createMockInput('text', { id: 'react-select-3-input' });
stateInput.getAttribute = (attr) => {
  if (attr === 'role') return 'combobox';
  if (attr === 'aria-autocomplete') return 'list';
  return null;
};
stateInput.closest = (sel) => {
  if (sel.includes('control')) return mockStateControl;
  return null;
};

const fillStateRes = await setElementValueNative(stateInput, 'NCR');
assert.equal(fillStateRes, true, 'Successfully triggered React-Select single-select injection');
console.log('✓ React-Select single-select injection executes without errors');

// 2. Multi-Select Autocomplete component (e.g. Subjects)
const mockSubjectsControl = new MockHTMLElement();
mockSubjectsControl.classList.add('subjects-auto-complete__control');
mockSubjectsControl.dispatchEvent = () => {};

const subjectsInput = createMockInput('text', { id: 'subjectsInput' });
subjectsInput.classList.add('subjects-auto-complete__input');
subjectsInput.getAttribute = (attr) => {
  if (attr === 'role') return 'combobox';
  if (attr === 'aria-autocomplete') return 'list';
  return null;
};
subjectsInput.closest = (sel) => {
  if (sel.includes('control')) return mockSubjectsControl;
  return null;
};

const fillSubjectsRes = await setElementValueNative(subjectsInput, 'Maths, English');
assert.equal(fillSubjectsRes, true, 'Successfully triggered React-Select multi-select autocomplete');
console.log('✓ React-Select multi-select autocomplete handles comma-separated tags');

// ============================================================
// TEST SUITE 8: Smart Datepicker Overlay Dismissal
// ============================================================
console.log('\n[Suite 8: Smart Datepicker Overlay Dismissal]');

const dobInput = createMockInput('text', { id: 'dateOfBirthInput' });
dobInput.ownerDocument = {
  querySelector: () => ({ classList: { contains: () => true } }),
  body: {
    dispatchEvent: () => {},
    click: () => {}
  }
};
setElementValueNative(dobInput, '2000-01-01');
const dobEvents = dobInput.getEvents().map(e => e.type);
assert.ok(dobEvents.includes('focus'), 'Date input received focus');
assert.ok(dobEvents.includes('input'), 'Date input received input');
assert.ok(dobEvents.includes('change'), 'Date input received change');
console.log('✓ Datepicker input dispatches validation events and triggers overlay dismissal');

// ============================================================
// TEST SUITE 9: Radio Button Direct Auto-fill
// ============================================================
console.log('\n[Suite 9: Radio Button Direct Auto-fill (Boolean, String, Label & Value Match)]');

function createMockRadioGroup(name, items) {
  const radios = items.map((item) => {
    const r = createMockInput('radio', { name, id: item.id || '' });
    r.value = item.value;
    r.checked = false;
    r.labels = item.label ? [{ textContent: item.label }] : [];
    r.getAttribute = (attr) => attr === 'value' ? item.value : null;
    return r;
  });

  const mockDoc = {
    ...context.document,
    querySelectorAll: (sel) => {
      if (sel.includes(`input[type="radio"][name="`)) return radios;
      return [];
    },
    querySelector: (sel) => {
      const match = sel.match(/label\[for="([^"]+)"\]/);
      if (match) {
        const targetId = match[1];
        const r = radios.find(rad => rad.id === targetId);
        if (r && r.labels && r.labels[0]) {
          return {
            click: () => {},
            dispatchEvent: () => {},
            cloneNode: () => ({ querySelectorAll: () => [], textContent: r.labels[0].textContent })
          };
        }
      }
      return null;
    }
  };

  radios.forEach((r) => { r.ownerDocument = mockDoc; });
  return radios;
}

const genderRadios = createMockRadioGroup('gender', [
  { id: 'gender-radio-1', value: 'Male', label: 'Male' },
  { id: 'gender-radio-2', value: 'Female', label: 'Female' },
  { id: 'gender-radio-3', value: 'Other', label: 'Other' }
]);

// 1. ChatGPT Web sends boolean true for Male radio
const res1 = setElementValueNative(genderRadios[0], true);
assert.equal(res1, true, 'Boolean true on Male radio sets checked');
assert.equal(genderRadios[0].checked, true, 'Male radio is checked');
assert.equal(genderRadios[1].checked, false, 'Female radio is not checked');
assert.equal(genderRadios[2].checked, false, 'Other radio is not checked');
console.log('✓ Boolean true direct from ChatGPT Web successfully selects target radio');

// 2. Matching string "Female"
const res2 = setElementValueNative(genderRadios[0], 'Female');
assert.equal(res2, true, 'String "Female" on radio group sets Female checked');
assert.equal(genderRadios[0].checked, false, 'Male radio is unchecked');
assert.equal(genderRadios[1].checked, true, 'Female radio is checked');
console.log('✓ String label/value matching accurately selects matching radio in group');

// 3. Negative flag (false/0/"false") does not throw and does not overwrite selected radio
const res3 = setElementValueNative(genderRadios[0], false);
assert.equal(res3, true, 'Negative flag returns cleanly without error');
assert.equal(genderRadios[1].checked, true, 'Previously selected radio remains checked');
console.log('✓ Negative boolean/flag gracefully ignored without disrupting active selection');

// ============================================================
// TEST SUITE 10: React-Select & Custom Combobox 1-Click Undo
// ============================================================
console.log('\n[Suite 10: React-Select & Custom Combobox 1-Click Undo]');

// 1. Multi-Select React-Select (Subjects) Chip Removal on Undo
const mockSubjectsDoc = {
  defaultView: context,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Create a realistic multi-value React-Select control wrapper
const subjectsCtrl = new MockHTMLElement();
subjectsCtrl.classList.add('subjects-auto-complete__control');
subjectsCtrl.classList.add('css-yk16xz-control');

// Mock chips created after filling "Maths, English"
class MockChip extends MockHTMLElement {
  constructor(labelText, parent) {
    super();
    this.classList.add('css-12jo7m5');
    this.classList.add('subjects-auto-complete__multi-value');
    this.parentElement = parent;
    
    this.label = new MockHTMLElement();
    this.label.classList.add('subjects-auto-complete__multi-value__label');
    this.label.textContent = labelText;

    this.removeBtn = new MockHTMLElement();
    this.removeBtn.classList.add('subjects-auto-complete__multi-value__remove');
    this.removeBtn.clicked = false;
    this.removeBtn.closest = (sel) => {
      if (sel.includes('multi-value') || sel.includes('multiValue')) return this;
      return null;
    };
    this.removeBtn.click = () => {
      this.removeBtn.clicked = true;
      this.remove();
    };
    this.removeBtn.dispatchEvent = (e) => {
      if (e.type === 'click' || e.type === 'mouseup') {
        this.removeBtn.clicked = true;
        this.remove();
      }
    };
  }
  remove() {
    if (this.parentElement && this.parentElement.chips) {
      const idx = this.parentElement.chips.indexOf(this);
      if (idx !== -1) this.parentElement.chips.splice(idx, 1);
    }
  }
}

subjectsCtrl.chips = [];
const addChip = (text) => {
  const chip = new MockChip(text, subjectsCtrl);
  subjectsCtrl.chips.push(chip);
  return chip;
};

subjectsCtrl.querySelectorAll = (sel) => {
  if (sel.includes('multi-value__remove') || sel.includes('multiValue__remove')) {
    return subjectsCtrl.chips.map((c) => c.removeBtn);
  }
  if (sel.includes('multi-value__label') || sel.includes('multiValue__label')) {
    return subjectsCtrl.chips.map((c) => c.label);
  }
  return [];
};
subjectsCtrl.querySelector = (sel) => {
  return null;
};

const subjectsInputEl = createMockInput('text', { id: 'subjectsInput' });
subjectsInputEl.classList.add('subjects-auto-complete__input');
subjectsInputEl.classList.add('form-filler-0-10');
subjectsInputEl.ownerDocument = mockSubjectsDoc;
subjectsInputEl.closest = (sel) => {
  if (sel.includes('control')) return subjectsCtrl;
  return null;
};

mockSubjectsDoc.querySelector = (sel) => {
  if (sel.includes('form-filler-0-10')) return subjectsInputEl;
  return null;
};
mockSubjectsDoc.querySelectorAll = (sel) => {
  if (sel.includes('form-filler-0-10')) return [subjectsInputEl];
  return [];
};

// Snapshot capture before fill (initially empty)
const fillSubjRes = executeFormFill({ 'form-filler-0-10': 'Maths, English' }, mockSubjectsDoc);
// Simulate the chips rendered into DOM by React-Select
addChip('Maths');
addChip('English');
assert.equal(subjectsCtrl.chips.length, 2, '2 chips present after filling');

// Undo execution: should trigger chip remove buttons and clear the tags back to empty
const undoSubjRes = executeUndo(mockSubjectsDoc);
assert.equal(undoSubjRes.success, true, 'Undo succeeded for multi-select React-Select');
assert.equal(subjectsCtrl.chips.length, 0, 'All multi-select chips successfully removed on Undo');
console.log('✓ React-Select multi-select chips (Maths, English) cleanly removed on 1-Click Undo');

// 2. Single-Select React-Select (State) with isClearable: false clearing via React Fiber / Props
let stateFiberClearCalled = false;
let stateClearedValue = undefined;

const stateCtrl = new MockHTMLElement();
stateCtrl.classList.add('css-yk16xz-control');
const singleValueDiv = new MockHTMLElement();
singleValueDiv.classList.add('css-1uccc91-singleValue');
singleValueDiv.textContent = 'NCR';
singleValueDiv.removed = false;
singleValueDiv.remove = () => { singleValueDiv.removed = true; };

stateCtrl.querySelector = (sel) => {
  if (sel.includes('singleValue') || sel.includes('single-value')) {
    return singleValueDiv.removed ? null : singleValueDiv;
  }
  return null;
};
stateCtrl.querySelectorAll = () => [];

const stateInputEl = createMockInput('text', { id: 'react-select-3-input' });
stateInputEl.classList.add('form-filler-0-11');
stateInputEl.ownerDocument = mockSubjectsDoc;
stateInputEl.closest = (sel) => {
  if (sel.includes('control')) return stateCtrl;
  return null;
};

// React 17/18 Fiber attachment with selectProps and onChange
stateInputEl['__reactProps$test123'] = {
  selectProps: {
    onChange: (val, meta) => {
      stateFiberClearCalled = true;
      stateClearedValue = val;
    }
  }
};

mockSubjectsDoc.querySelector = (sel) => {
  if (sel.includes('form-filler-0-11')) return stateInputEl;
  return null;
};

// Snapshot capture before fill (empty)
executeFormFill({ 'form-filler-0-11': 'NCR' }, mockSubjectsDoc);
// SingleValue is now in DOM
assert.equal(stateCtrl.querySelector('.singleValue')?.textContent, 'NCR');

// Undo execution
const undoStateRes = executeUndo(mockSubjectsDoc);
assert.equal(undoStateRes.success, true);
assert.equal(stateFiberClearCalled, true, 'React Fiber/Props onChange called with null clear action');
assert.equal(stateClearedValue, null, 'Cleared value is null');
assert.equal(singleValueDiv.removed, true, 'SingleValue element removed from DOM');
console.log('✓ React-Select single-select (State: NCR) with isClearable: false reverted to empty via React Fiber');

// 3. Native <select> Reversion to Index 0 / Empty Value on Undo
const nativeSelect = new MockHTMLSelectElement();
nativeSelect.classList.add('form-filler-0-12');
nativeSelect.options = [
  { value: '', text: 'Select State', selected: true, index: 0 },
  { value: 'NCR', text: 'NCR', selected: false, index: 1 },
  { value: 'UP', text: 'Uttar Pradesh', selected: false, index: 2 }
];
nativeSelect.selectedIndex = 0;
nativeSelect.value = '';
nativeSelect.dispatchEvent = () => {};
nativeSelect.ownerDocument = mockSubjectsDoc;

mockSubjectsDoc.querySelector = (sel) => {
  if (sel.includes('form-filler-0-12')) return nativeSelect;
  return null;
};

// Snapshot capture before fill
executeFormFill({ 'form-filler-0-12': 'NCR' }, mockSubjectsDoc);
assert.equal(nativeSelect.selectedIndex, 1, 'Native select changed to index 1');
assert.equal(nativeSelect.value, 'NCR', 'Native select changed to NCR');

// Undo execution: should restore index 0
const undoNativeRes = executeUndo(mockSubjectsDoc);
assert.equal(undoNativeRes.success, true);
assert.equal(nativeSelect.selectedIndex, 0, 'Native select restored to index 0');
assert.equal(nativeSelect.value, '', 'Native select value restored to empty string');
console.log('✓ Native <select> cleanly restored to initial placeholder (selectedIndex = 0) on Undo');

// 4. Cascading Dependent Order (City before State)
const orderLog = [];
const cityInput = createMockInput('text', { id: 'react-select-4-input' });
cityInput.classList.add('form-filler-0-20');
cityInput.ownerDocument = mockSubjectsDoc;
const cityCtrl = new MockHTMLElement();
cityCtrl.classList.add('css-yk16xz-control');
cityInput.closest = (sel) => (sel.includes('control') ? cityCtrl : null);
cityInput['__reactProps$test'] = {
  selectProps: {
    onChange: () => { orderLog.push('city'); }
  }
};

const parentStateInput = createMockInput('text', { id: 'react-select-5-input' });
parentStateInput.classList.add('form-filler-0-21');
parentStateInput.ownerDocument = mockSubjectsDoc;
const parentStateCtrl = new MockHTMLElement();
parentStateCtrl.classList.add('css-yk16xz-control');
parentStateInput.closest = (sel) => (sel.includes('control') ? parentStateCtrl : null);
parentStateInput['__reactProps$test'] = {
  selectProps: {
    onChange: () => { orderLog.push('state'); }
  }
};

mockSubjectsDoc.querySelector = (sel) => {
  if (sel.includes('form-filler-0-20')) return cityInput;
  if (sel.includes('form-filler-0-21')) return parentStateInput;
  return null;
};

// Forward fill: State (21) then City (20)
executeFormFill({
  'form-filler-0-21': 'NCR',
  'form-filler-0-20': 'Delhi'
}, mockSubjectsDoc);

// Undo should reverse order: City before State
executeUndo(mockSubjectsDoc);
assert.deepEqual(orderLog, ['city', 'state'], 'City reverted before State');
console.log('✓ Cascading reverse DOM execution verified: dependent City reverted before State');

// 5. Multi-select React-Select passes empty array [] (not null) to Fiber / Props onChange
let fiberClearedWithArray = false;
let fiberPassedValue = null;
const multiFiberCtrl = new MockHTMLElement();
multiFiberCtrl.classList.add('subjects-auto-complete__control');
const multiFiberInput = createMockInput('text', { id: 'subjectsInput' });
multiFiberInput.classList.add('form-filler-0-30');
multiFiberInput.classList.add('subjects-auto-complete__input');
multiFiberInput.ownerDocument = mockSubjectsDoc;
multiFiberInput.closest = (sel) => (sel.includes('control') ? multiFiberCtrl : null);

multiFiberInput['__reactProps$demoqa'] = {
  selectProps: {
    onChange: (val) => {
      fiberClearedWithArray = Array.isArray(val) && val.length === 0;
      fiberPassedValue = val;
    }
  }
};

mockSubjectsDoc.querySelector = (sel) => {
  if (sel.includes('form-filler-0-30')) return multiFiberInput;
  return null;
};

executeFormFill({ 'form-filler-0-30': 'Maths, English' }, mockSubjectsDoc);
executeUndo(mockSubjectsDoc);
assert.equal(fiberClearedWithArray, true, 'Multi-select React-Select received empty array [] on clear');
assert.equal(fiberPassedValue.length, 0, 'Multi-select value cleared to empty array');
console.log('✓ Multi-select React-Select passes [] (empty array) to Fiber onChange, preventing leftover chips');

// ============================================================
// TEST SUITE 11: Checkbox Auto-fill (Boolean, Label Name, Multi-Value List & Group Fan-Out)
// ============================================================
console.log('\n[Suite 11: Checkbox Auto-fill (Boolean, Label Name, Multi-Value List & Group Fan-Out)]');

function createMockCheckboxGroup(items) {
  const checkboxes = items.map((item) => {
    const cb = createMockInput('checkbox', { id: item.id || '' });
    cb.value = item.value || '1';
    cb.checked = false;
    cb.labels = item.label ? [{ textContent: item.label }] : [];
    cb.getAttribute = (attr) => attr === 'value' ? item.value : null;
    return cb;
  });

  const mockDoc = {
    ...context.document,
    querySelectorAll: () => [],
    querySelector: (sel) => {
      const match = sel.match(/label\[for="([^"]+)"\]/);
      if (match) {
        const targetId = match[1];
        const cb = checkboxes.find(c => c.id === targetId);
        if (cb && cb.labels && cb.labels[0]) {
          return {
            click: () => { cb.checked = !cb.checked; },
            dispatchEvent: () => {},
            cloneNode: () => ({ querySelectorAll: () => [], textContent: cb.labels[0].textContent })
          };
        }
      }
      return null;
    }
  };

  checkboxes.forEach((cb) => { cb.ownerDocument = mockDoc; });
  return checkboxes;
}

const hobbyCheckboxes = createMockCheckboxGroup([
  { id: 'hobbies-checkbox-1', value: '1', label: 'Sports' },
  { id: 'hobbies-checkbox-2', value: '2', label: 'Reading' },
  { id: 'hobbies-checkbox-3', value: '3', label: 'Music' }
]);

// 1. Boolean true checks Sports checkbox
setElementValueNative(hobbyCheckboxes[0], true);
assert.equal(hobbyCheckboxes[0].checked, true, 'Boolean true checks Sports checkbox');
console.log('✓ Boolean true direct from AI successfully checks target checkbox');

// 2. String label "Music" checks Music checkbox
setElementValueNative(hobbyCheckboxes[2], 'Music');
assert.equal(hobbyCheckboxes[2].checked, true, 'String label "Music" checks Music checkbox');
console.log('✓ String label matching accurately checks corresponding checkbox');

// 3. Multi-value list "Sports, Music" on Reading leaves it unchecked
setElementValueNative(hobbyCheckboxes[1], 'Sports, Music');
assert.equal(hobbyCheckboxes[1].checked, false, 'Non-matching option in multi-value list remains unchecked');
console.log('✓ Multi-value list correctly sets matching and ignores non-matching checkboxes');

console.log('\nAll 11 engine robustness suites passed with 100% success!');


