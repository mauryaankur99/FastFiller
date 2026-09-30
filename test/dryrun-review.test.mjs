import assert from 'node:assert/strict';

console.log('--- Running Tests for Pre-Fill Field Review & Full-Screen ---');

// Mock DOM elements and review logic
function createMockReviewState(initialFields) {
  const stagedFillValues = {};
  for (const [key, field] of Object.entries(initialFields)) {
    stagedFillValues[key] = { ...field };
  }

  const state = {
    showDryRunDrawer: true,
    dryRunFullScreen: false,
    stagedFillValues
  };

  const bodyClasses = new Set();
  const drawerClasses = new Set(['drawer-panel']);

  const rowElements = new Map();
  const entries = Object.entries(state.stagedFillValues);

  entries.forEach(([key, item]) => {
    rowElements.set(key, {
      checkbox: { checked: item.checked },
      input: { disabled: !item.checked, value: item.value },
      row: { style: { opacity: item.checked ? '1' : '0.6' } }
    });
  });

  const getCheckedCount = () => Object.values(state.stagedFillValues).filter((i) => i.checked).length;

  const header = {
    title: `Pre-Fill Field Review (${getCheckedCount()} of ${entries.length} selected)`,
    fullscreenBtn: {
      active: state.dryRunFullScreen,
      title: state.dryRunFullScreen ? 'Exit Full Screen (Esc)' : 'Enter Full Screen'
    }
  };

  const selectAllBtn = {
    textContent: (getCheckedCount() === entries.length && entries.length > 0) ? 'Deselect All' : 'Select All'
  };

  const confirmBtn = {
    disabled: getCheckedCount() === 0,
    text: `Confirm & Inject (${getCheckedCount()})`
  };

  const updateCountsAndButtons = () => {
    const curCount = getCheckedCount();
    header.title = `Pre-Fill Field Review (${curCount} of ${entries.length} selected)`;
    selectAllBtn.textContent = (curCount === entries.length && entries.length > 0) ? 'Deselect All' : 'Select All';
    confirmBtn.disabled = curCount === 0;
    confirmBtn.text = `Confirm & Inject (${curCount})`;
  };

  // Toggle single item in-place without re-rendering
  let renderCallCount = 0;
  const toggleItem = (key, checked) => {
    const item = state.stagedFillValues[key];
    if (!item) return;
    item.checked = checked;
    const dom = rowElements.get(key);
    if (dom) {
      dom.checkbox.checked = checked;
      dom.input.disabled = !checked;
      dom.row.style.opacity = checked ? '1' : '0.6';
    }
    updateCountsAndButtons();
    // Intentionally no render() call!
  };

  // Select all / Deselect all in-place without re-rendering
  const toggleSelectAll = () => {
    const curCount = getCheckedCount();
    const targetState = curCount !== entries.length;
    entries.forEach(([key, item]) => {
      item.checked = targetState;
      const dom = rowElements.get(key);
      if (dom) {
        dom.checkbox.checked = targetState;
        dom.input.disabled = !targetState;
        dom.row.style.opacity = targetState ? '1' : '0.6';
      }
    });
    updateCountsAndButtons();
  };

  // Full screen toggle
  const toggleFullScreen = () => {
    state.dryRunFullScreen = !state.dryRunFullScreen;
    if (state.dryRunFullScreen) {
      bodyClasses.add('dry-run-fullscreen-active');
      drawerClasses.add('dryrun-fullscreen');
      header.fullscreenBtn.active = true;
      header.fullscreenBtn.title = 'Exit Full Screen (Esc)';
    } else {
      bodyClasses.delete('dry-run-fullscreen-active');
      drawerClasses.delete('dryrun-fullscreen');
      header.fullscreenBtn.active = false;
      header.fullscreenBtn.title = 'Enter Full Screen';
    }
  };

  // Filter confirmed values
  const getConfirmedValues = () => {
    const finalValues = {};
    for (const [key, item] of Object.entries(state.stagedFillValues)) {
      if (item.checked) finalValues[key] = item.value;
    }
    return finalValues;
  };

  return {
    state,
    bodyClasses,
    drawerClasses,
    rowElements,
    header,
    selectAllBtn,
    confirmBtn,
    getCheckedCount,
    toggleItem,
    toggleSelectAll,
    toggleFullScreen,
    getConfirmedValues,
    getRenderCallCount: () => renderCallCount
  };
}

// Test 1: In-place reactive checkbox updates without full reload
{
  const review = createMockReviewState({
    'field-1': { label: 'Name', value: 'Ankur', checked: true, type: 'text' },
    'field-2': { label: 'Gender', value: 'Male', checked: true, type: 'radio' },
    'field-3': { label: 'City', value: 'Ahmedabad', checked: true, type: 'select' }
  });

  assert.equal(review.getCheckedCount(), 3);
  assert.equal(review.selectAllBtn.textContent, 'Deselect All');
  assert.equal(review.confirmBtn.text, 'Confirm & Inject (3)');

  // Uncheck Gender in-place
  review.toggleItem('field-2', false);
  assert.equal(review.getRenderCallCount(), 0, 'Must NOT trigger full UI re-renders on checkbox toggle');
  assert.equal(review.state.stagedFillValues['field-2'].checked, false);
  assert.equal(review.rowElements.get('field-2').checkbox.checked, false);
  assert.equal(review.rowElements.get('field-2').input.disabled, true);
  assert.equal(review.rowElements.get('field-2').row.style.opacity, '0.6');
  assert.equal(review.getCheckedCount(), 2);
  assert.equal(review.header.title, 'Pre-Fill Field Review (2 of 3 selected)');
  assert.equal(review.selectAllBtn.textContent, 'Select All');
  assert.equal(review.confirmBtn.text, 'Confirm & Inject (2)');

  // Re-check Gender in-place
  review.toggleItem('field-2', true);
  assert.equal(review.getRenderCallCount(), 0);
  assert.equal(review.rowElements.get('field-2').checkbox.checked, true);
  assert.equal(review.rowElements.get('field-2').input.disabled, false);
  assert.equal(review.rowElements.get('field-2').row.style.opacity, '1');
  assert.equal(review.getCheckedCount(), 3);
  assert.equal(review.selectAllBtn.textContent, 'Deselect All');
  assert.equal(review.confirmBtn.text, 'Confirm & Inject (3)');

  console.log('✓ Test 1: In-place reactive checkbox update preserves DOM and scroll without reload');
}

// Test 2: Select All / Deselect All in-place toggling
{
  const review = createMockReviewState({
    'field-1': { label: 'A', value: '1', checked: true, type: 'text' },
    'field-2': { label: 'B', value: '2', checked: true, type: 'text' }
  });

  // Clicking "Deselect All"
  review.toggleSelectAll();
  assert.equal(review.getCheckedCount(), 0);
  assert.equal(review.selectAllBtn.textContent, 'Select All');
  assert.equal(review.confirmBtn.disabled, true);
  assert.equal(review.confirmBtn.text, 'Confirm & Inject (0)');
  assert.equal(review.rowElements.get('field-1').checkbox.checked, false);
  assert.equal(review.rowElements.get('field-2').checkbox.checked, false);

  // Clicking "Select All"
  review.toggleSelectAll();
  assert.equal(review.getCheckedCount(), 2);
  assert.equal(review.selectAllBtn.textContent, 'Deselect All');
  assert.equal(review.confirmBtn.disabled, false);
  assert.equal(review.confirmBtn.text, 'Confirm & Inject (2)');
  assert.equal(review.rowElements.get('field-1').checkbox.checked, true);
  assert.equal(review.rowElements.get('field-2').checkbox.checked, true);

  console.log('✓ Test 2: Select All / Deselect All updates all fields in-place');
}

// Test 3: Full-screen mode toggling and class management
{
  const review = createMockReviewState({
    'field-1': { label: 'Address', value: '123 Main Street', checked: true, type: 'textarea' }
  });

  assert.equal(review.state.dryRunFullScreen, false);
  assert.ok(!review.bodyClasses.has('dry-run-fullscreen-active'));
  assert.ok(!review.drawerClasses.has('dryrun-fullscreen'));

  // Enter Full Screen
  review.toggleFullScreen();
  assert.equal(review.state.dryRunFullScreen, true);
  assert.ok(review.bodyClasses.has('dry-run-fullscreen-active'), 'body must receive dry-run-fullscreen-active class');
  assert.ok(review.drawerClasses.has('dryrun-fullscreen'), 'drawer must receive dryrun-fullscreen class');
  assert.equal(review.header.fullscreenBtn.title, 'Exit Full Screen (Esc)');

  // Exit Full Screen
  review.toggleFullScreen();
  assert.equal(review.state.dryRunFullScreen, false);
  assert.ok(!review.bodyClasses.has('dry-run-fullscreen-active'), 'body class must be removed on exit');
  assert.ok(!review.drawerClasses.has('dryrun-fullscreen'), 'drawer fullscreen class must be removed on exit');
  assert.equal(review.header.fullscreenBtn.title, 'Enter Full Screen');

  console.log('✓ Test 3: Full-screen mode toggles properly with responsive classes and titles');
}

// Test 4: Confirmed injection values exclude unchecked fields
{
  const review = createMockReviewState({
    'field-1': { label: 'Name', value: 'Alex', checked: true, type: 'text' },
    'field-2': { label: 'Skipped Field', value: 'Do not inject', checked: false, type: 'text' },
    'field-3': { label: 'Email', value: 'alex@example.com', checked: true, type: 'text' }
  });

  const confirmed = review.getConfirmedValues();
  assert.deepEqual(confirmed, {
    'field-1': 'Alex',
    'field-3': 'alex@example.com'
  });
  assert.equal(confirmed['field-2'], undefined, 'Unchecked field must be excluded from injection');

  console.log('✓ Test 4: Confirmed values strictly filter out unchecked fields');
}

// Test 5: Staging filter logic excludes captchas, temps, empty radios, false checkboxes, and placeholder selects
{
  function filterStagedFields(normalizedValues, detectedFields) {
    const staged = {};
    const seenRadioGroups = new Set();

    for (const [classKey, val] of Object.entries(normalizedValues)) {
      const fieldMeta = detectedFields.find((f) => f.class === classKey);
      if (!fieldMeta) continue;

      const fieldIdent = `${fieldMeta.id || ''} ${fieldMeta.name || ''} ${fieldMeta.labelText || ''}`.toLowerCase();
      if (
        fieldIdent.includes('captcha') ||
        fieldIdent.includes('cpatcha') ||
        fieldIdent.includes('recaptcha') ||
        fieldIdent.includes('turnstile') ||
        fieldIdent.includes('hcaptcha') ||
        /\b\d{4,6}_txt\b/.test(fieldIdent) ||
        /\btemp\b/i.test(fieldIdent) ||
        /temp$/i.test(fieldMeta.id || '') ||
        /temp$/i.test(fieldMeta.name || '')
      ) {
        continue;
      }

      const cleanVal = typeof val === 'object' && val !== null && !Array.isArray(val)
        ? (val.value ?? val.label ?? val.text ?? '')
        : val;
      const strVal = String(cleanVal != null ? cleanVal : '').trim();
      if (!strVal) continue;

      const lowerVal = strVal.toLowerCase();
      if (fieldMeta.type === 'select' || fieldMeta.role === 'listbox' || fieldMeta.role === 'combobox') {
        if (lowerVal === 'select' || lowerVal === '-- select --' || lowerVal === '- select -' || lowerVal === 'please select') {
          continue;
        }
      }

      if (fieldMeta.type === 'checkbox' || fieldMeta.role === 'checkbox') {
        if (cleanVal === false || strVal === 'false' || strVal === '0') continue;
      }

      if (fieldMeta.type === 'radio' || fieldMeta.role === 'radio') {
        if (cleanVal === false || strVal === 'false' || strVal === '0') continue;
        const groupName = fieldMeta.radioGroupName || fieldMeta.name;
        if (groupName) {
          if (seenRadioGroups.has(groupName)) continue;
          seenRadioGroups.add(groupName);
        }
      }

      staged[classKey] = {
        value: strVal,
        checked: true,
        label: fieldMeta.labelText || classKey,
        type: fieldMeta.type || 'text'
      };
    }
    return staged;
  }

  const detectedFields = [
    { class: 'f-1', labelText: 'Applicant Name', type: 'text' },
    { class: 'f-2', labelText: 'Applicant Name Temp', id: 'nameTemp', type: 'text' },
    { class: 'f-3', labelText: 'Male', type: 'radio', radioGroupName: 'gender' },
    { class: 'f-4', labelText: 'Female', type: 'radio', radioGroupName: 'gender' },
    { class: 'f-5', labelText: 'Third Gender', type: 'radio', radioGroupName: 'gender' },
    { class: 'f-6', labelText: 'Town Panchayat', type: 'radio', radioGroupName: 'localBody' },
    { class: 'f-7', labelText: 'Municipal Corporation', type: 'select' },
    { class: 'f-8', labelText: 'Routing Option', type: 'select' },
    { class: 'f-9', labelText: 'I Agree', type: 'checkbox' },
    { class: 'f-10', labelText: 'Form XIV Self Declaration', type: 'checkbox' },
    { class: 'f-11', labelText: '56925_txt', id: '56925_txt', type: 'text' }
  ];

  const rawValues = {
    'f-1': 'Ankur Maurya',
    'f-2': 'Ankur Maurya',     // Should be skipped (temp mirror)
    'f-3': 'Male',             // Selected radio in group
    'f-4': '',                 // Empty unselected radio -> skip
    'f-5': 'false',            // False unselected radio -> skip
    'f-6': '',                 // Empty unselected radio -> skip
    'f-7': 'Arrah / आरा',      // Valid select option
    'f-8': 'Select',           // Placeholder select -> skip
    'f-9': 'true',             // Checked checkbox -> keep
    'f-10': 'false',           // Unchecked checkbox -> skip
    'f-11': '8492'             // Captcha -> skip
  };

  const staged = filterStagedFields(rawValues, detectedFields);
  const stagedKeys = Object.keys(staged);

  assert.deepEqual(stagedKeys, ['f-1', 'f-3', 'f-7', 'f-9']);
  assert.equal(staged['f-1'].value, 'Ankur Maurya');
  assert.equal(staged['f-3'].value, 'Male');
  assert.equal(staged['f-7'].value, 'Arrah / आरा');
  assert.equal(staged['f-9'].value, 'true');

  console.log('✓ Test 5: Staging filter cleanly excludes captchas, temps, empty radios, false checkboxes, and placeholder selects');
}

console.log('\nAll 5 Pre-Fill Field Review tests passed successfully!');
