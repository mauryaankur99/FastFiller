/**
 * FastFiller — Modern Content Script Engine
 * Copyright (c) 2026 Maurya Ankur, Singh Sanjiv, aeigs.com
 * Licensed under the MIT License.
 * Authors: Maurya Ankur (https://www.linkedin.com/in/ankur-maurya1/), Singh Sanjiv (https://www.linkedin.com/in/sanjiv-singh/)
 * Organization: Aeigs (https://aeigs.com)
 */

const CLASS_PREFIX = 'form-filler-';
let lastFillSnapshot = null; // Stores previous values for 1-Click Undo

// ──────────────────────────────────────────
// 1. INJECT VISUAL PULSE STYLES
// ──────────────────────────────────────────

function ensureStylesInjected() {
  if (document.getElementById('fastfiller-styles')) return;
  const style = document.createElement('style');
  style.id = 'fastfiller-styles';
  style.textContent = `
    @keyframes fastfiller-pulse {
      0% {
        box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.65) !important;
      }
      50% {
        box-shadow: 0 0 0 6px rgba(16, 185, 129, 0.35) !important;
      }
      100% {
        box-shadow: 0 0 0 0 rgba(16, 185, 129, 0) !important;
      }
    }
    .fastfiller-filled-highlight {
      animation: fastfiller-pulse 1.4s cubic-bezier(0.2, 0.8, 0.2, 1) !important;
    }
    .fastfiller-hover-highlight {
      outline: 2px solid #0ea5e9 !important;
      box-shadow: 0 0 0 5px rgba(14, 165, 233, 0.35) !important;
      transition: box-shadow 160ms cubic-bezier(0.2, 0.8, 0.2, 1) !important;
    }
  `;
  (document.head || document.documentElement).appendChild(style);
}

// ──────────────────────────────────────────
// 2. PRIVACY & SECURITY SHIELD
// ──────────────────────────────────────────

const SENSITIVE_PATTERNS = /\b(password|passwd|pwd|credit[-_]?card|card[-_]?num|card[-_]?number|cvv|cvc|security[-_]?code|ssn|social[-_]?security|pin[-_]?code)\b/i;

function isSensitiveField(element) {
  if (element.type === 'password') return true;

  const autocomplete = (element.getAttribute('autocomplete') || '').toLowerCase();
  if (
    autocomplete.includes('password') ||
    autocomplete.includes('cc-') ||
    autocomplete.includes('cvc') ||
    autocomplete.includes('csc')
  ) {
    return true;
  }

  const identity = `${element.id || ''} ${element.name || ''} ${element.placeholder || ''} ${element.getAttribute('aria-label') || ''}`;
  if (SENSITIVE_PATTERNS.test(identity)) {
    return true;
  }

  return false;
}

// ──────────────────────────────────────────
// 3. VISIBILITY & GEOMETRY DETECTION
// ──────────────────────────────────────────

function isDateInput(el) {
  if (!el || el.nodeType !== 1) return false;
  if (el.type === 'date') return true;
  const str = (
    (el.id || '') + ' ' +
    (el.name || '') + ' ' +
    (typeof el.className === 'string' ? el.className : '') + ' ' +
    (el.placeholder || '') + ' ' +
    (el.getAttribute ? (el.getAttribute('aria-label') || '') : '')
  ).toLowerCase();
  return Boolean(
    str.includes('date') ||
    str.includes('dob') ||
    str.includes('birth') ||
    str.includes('calendar') ||
    (el.classList && (el.classList.contains('react-datepicker-ignore-onclickoutside') || el.classList.contains('flatpickr-input'))) ||
    (el.closest && el.closest('.react-datepicker-wrapper, .react-datepicker__input-container, .flatpickr-wrapper, .flatpickr-calendar, .p-datepicker, .ui-datepicker'))
  );
}

function findReactSelectControl(el) {
  if (!el || !el.closest) return null;
  const match = el.closest('[class*="-control"], [class*="__control"]');
  if (!match) return null;
  // An input or textarea is never the React-Select control wrapper
  if (match.tagName === 'INPUT' || match.tagName === 'TEXTAREA') return null;
  const cls = typeof match.className === 'string' ? match.className : '';
  // Exclude bootstrap form-control and generic form control wrappers
  if (cls.includes('form-control')) return null;
  return match;
}

function isReactSelectElement(element) {
  if (!element || isDateInput(element)) return false;
  if (findReactSelectControl(element)) return true;
  const id = element.id || '';
  if (id.startsWith('react-select-') || id.includes('auto-complete') || id.includes('autocomplete') || id === 'subjectsInput') return true;
  if (element.classList) {
    if (element.classList.contains('subjects-auto-complete__input')) return true;
    if (Array.from(element.classList).some((c) => c.includes('auto-complete') || c.includes('autocomplete'))) return true;
  }
  const role = element.getAttribute ? element.getAttribute('role') : null;
  if (role === 'combobox' && element.getAttribute && element.getAttribute('aria-autocomplete') === 'list') return true;
  return false;
}

function isStaticReadonly(el) {
  if (!el) return false;
  const isRo = Boolean(el.readOnly || (el.getAttribute && el.getAttribute('aria-readonly') === 'true'));
  if (!isRo) return false;
  // Date inputs with readonly are common in datepickers (e.g. flatpickr), allow them
  if (isDateInput(el)) return false;
  // React-Select and combobox inputs can have aria-readonly or readonly, allow them
  if (isReactSelectElement(el) || (el.getAttribute && el.getAttribute('role') === 'combobox')) return false;
  // Custom dropdowns/selects are not static readonly inputs
  if (el.tagName === 'SELECT' || (el.getAttribute && el.getAttribute('role') === 'listbox')) return false;
  return true;
}

function isPeripheralWidgetOrNav(el) {
  if (!el || !el.closest) return false;

  // 1. Chat widgets and support helpdesk embeds (Intercom, Zendesk, Drift, Tawk.to, etc.)
  const inChatWidget = Boolean(el.closest('[id*="intercom" i], [class*="intercom" i], [id*="zendesk" i], [class*="zendesk" i], [id*="drift" i], [id*="tawk" i], [class*="livechat" i], [id*="chatbot" i], [class*="chatbot" i], #launcher, [id*="chat-widget" i], [class*="chat-widget" i]'));
  if (inChatWidget) {
    const mainForm = el.closest('form');
    if (!mainForm || mainForm.closest('[id*="intercom" i], [id*="zendesk" i], [id*="drift" i], [id*="tawk" i], [class*="livechat" i], [id*="chatbot" i], [id*="chat-widget" i]')) {
      return true;
    }
  }

  // 2. Global search inputs in site navigation / header / banner
  const inNavOrHeader = Boolean(el.closest('header, nav, [role="banner"], [role="search"]'));
  if (inNavOrHeader) {
    const isSearch = el.type === 'search' ||
      (el.getAttribute && el.getAttribute('role') === 'searchbox') ||
      el.name === 'q' ||
      el.name === 'query' ||
      el.name === 'search' ||
      el.id === 'search' ||
      (el.placeholder && /search/i.test(el.placeholder));
    if (isSearch) return true;
  }

  // 3. Footer newsletter subscribe inputs
  const inFooter = Boolean(el.closest('footer, [role="contentinfo"]'));
  if (inFooter) {
    const isNewsletter = /newsletter|subscribe|email-signup/i.test(`${el.name || ''} ${el.id || ''} ${typeof el.className === 'string' ? el.className : ''} ${el.placeholder || ''}`);
    if (isNewsletter) return true;
  }

  return false;
}

function isElementVisible(element) {
  if (!element || !element.isConnected) return false;

  // 1. Ancestor visibility check: if any ancestor is explicitly hidden (inactive tab-pane, collapsed accordion, hidden modal)
  const hiddenAncestor = element.closest?.('[hidden], .tab-pane:not(.active):not(.show), .collapse:not(.show), .modal:not(.show):not(.in)');
  if (hiddenAncestor) {
    const rsControl = findReactSelectControl(element);
    if (!rsControl || !hiddenAncestor.contains(rsControl)) {
      const hStyle = window.getComputedStyle ? window.getComputedStyle(hiddenAncestor) : null;
      if (hStyle && (hStyle.display === 'none' || hStyle.visibility === 'hidden')) return false;
    }
  }

  const rect = element.getBoundingClientRect ? element.getBoundingClientRect() : { width: 1, height: 1 };
  const style = window.getComputedStyle ? window.getComputedStyle(element) : { display: 'block', visibility: 'visible', opacity: '1' };

  // Explicit display:none or visibility:hidden on the element itself
  if (style.display === 'none' || style.visibility === 'hidden') {
    // Exception: Select2 or Chosen hidden native <select> whose custom dropdown container is visible
    if (element.tagName === 'SELECT' && (element.classList?.contains('select2-hidden-accessible') || element.classList?.contains('chosen-select'))) {
      const customContainer = element.parentElement?.querySelector?.('.select2-container, .chosen-container') || (element.nextElementSibling?.classList?.contains('select2-container') ? element.nextElementSibling : null);
      if (customContainer) {
        const cStyle = window.getComputedStyle(customContainer);
        const cRect = customContainer.getBoundingClientRect();
        return cRect.width > 0 && cRect.height > 0 && cStyle.display !== 'none' && cStyle.visibility !== 'hidden';
      }
    }
    return false;
  }

  // 2. Radio or Checkbox (native or ARIA): often clipped or styled with width:0/height:0 by custom skins
  const role = element.getAttribute ? element.getAttribute('role') : null;
  if (element.type === 'radio' || element.type === 'checkbox' || role === 'checkbox' || role === 'radio') {
    if (rect.width > 0 && rect.height > 0) return true;
    const parent = element.parentElement;
    if (parent) {
      const pRect = parent.getBoundingClientRect ? parent.getBoundingClientRect() : { width: 1, height: 1 };
      const pStyle = window.getComputedStyle ? window.getComputedStyle(parent) : { display: 'block' };
      return pRect.width > 0 && pRect.height > 0 && pStyle.display !== 'none' && pStyle.visibility !== 'hidden';
    }
    return true;
  }

  // 3. React-Select or custom combobox inner input: may have small width (e.g. 2px) or opacity: 0
  const rsControl = findReactSelectControl(element);
  if (rsControl) {
    const cStyle = window.getComputedStyle(rsControl);
    const cRect = rsControl.getBoundingClientRect();
    return cRect.width > 0 && cRect.height > 0 && cStyle.display !== 'none' && cStyle.visibility !== 'hidden' && cStyle.opacity !== '0';
  }

  // 4. Standard input/textarea/select
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.opacity !== '0'
  );
}

// ──────────────────────────────────────────
// 4. INTELLIGENT LABEL RESOLUTION
// ──────────────────────────────────────────

function resolveLabelText(element) {
  const doc = element.ownerDocument;

  // 1. ARIA-labelledby
  const labelledBy = element.getAttribute('aria-labelledby');
  if (labelledBy) {
    const parts = labelledBy.split(/\s+/).map((id) => doc.getElementById(id)).filter(Boolean);
    if (parts.length > 0) {
      const combined = parts.map((p) => p.textContent.trim()).join(' ');
      if (combined) return combined;
    }
  }

  // 2. Direct ARIA-label
  const ariaLabel = element.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.trim()) {
    return ariaLabel.trim();
  }

  // 2b. Custom data-answer-value or data-value (Google Forms, custom option items)
  const dataVal = element.getAttribute ? (element.getAttribute('data-answer-value') || element.getAttribute('data-value')) : null;
  if (dataVal && dataVal.trim()) {
    return dataVal.trim();
  }

  // 3. Native <label for="elementId">
  if (element.id) {
    const labelEl = doc.querySelector(`label[for="${CSS.escape(element.id)}"]`);
    if (labelEl) {
      const clone = labelEl.cloneNode(true);
      clone.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
      const txt = clone.textContent?.trim();
      if (txt) return txt;
    }
  }

  // 4. Enclosing parent <label>
  let parent = element.parentElement;
  while (parent) {
    if (parent.tagName.toLowerCase() === 'label') {
      const clone = parent.cloneNode(true);
      clone.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
      const txt = clone.textContent?.trim();
      if (txt) return txt;
    }
    parent = parent.parentElement;
  }

  // 5. Preceding sibling label or span in same form group
  const group = element.closest('.form-group, .field, .form-row, .field-wrapper, [class*="form-item"]');
  if (group) {
    const groupLabel = group.querySelector('label, [class*="label"], [class*="title"]');
    if (groupLabel && groupLabel !== element) {
      const clone = groupLabel.cloneNode(true);
      clone.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
      const txt = clone.textContent?.trim();
      if (txt) return txt;
    }
  }

  // 5b. Grid row or wrapper label (.row, [id*="-wrapper"], [class*="-wrapper"])
  const rowGroup = element.closest('.row, [id*="-wrapper"], [class*="-wrapper"]');
  if (rowGroup && rowGroup !== group) {
    const rowLabel = rowGroup.querySelector('label, [class*="label"], [class*="title"]');
    if (rowLabel && rowLabel !== element && !rowLabel.contains(element)) {
      const clone = rowLabel.cloneNode(true);
      clone.querySelectorAll('input, select, textarea').forEach((n) => n.remove());
      const txt = clone.textContent?.trim();
      if (txt) return txt;
    }
  }

  // 6. Fieldset <legend>
  const fieldset = element.closest('fieldset');
  if (fieldset) {
    const legend = fieldset.querySelector('legend');
    if (legend && legend.textContent?.trim()) {
      return legend.textContent.trim();
    }
  }

  return undefined;
}

// ──────────────────────────────────────────
// 4b. CAPTCHA & TEMPORARY FIELD DETECTORS
// ──────────────────────────────────────────

const CAPTCHA_PATTERNS = /\b(captcha|recaptcha|cpatcha|turnstile|hcaptcha|security[-_]?(code|img|image)|verification[-_]?code|math[-_]?captcha)\b/i;

function isCaptchaField(element) {
  if (!element || element.nodeType !== 1) return false;
  const tag = element.tagName ? element.tagName.toLowerCase() : '';
  if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') return false;

  const id = (element.id || '').toLowerCase();
  const name = (element.name || '').toLowerCase();
  const cls = (typeof element.className === 'string' ? element.className : '').toLowerCase();
  const placeholder = (element.placeholder || '').toLowerCase();
  const ariaLabel = (element.getAttribute ? (element.getAttribute('aria-label') || '') : '').toLowerCase();

  if (
    CAPTCHA_PATTERNS.test(id) ||
    CAPTCHA_PATTERNS.test(name) ||
    CAPTCHA_PATTERNS.test(cls) ||
    CAPTCHA_PATTERNS.test(placeholder) ||
    CAPTCHA_PATTERNS.test(ariaLabel)
  ) {
    return true;
  }

  // Common pattern on ServicePlus and Indian gov portals: e.g. "56925_txt", "cpt_txt", "txtCaptcha", "captchaAnswer"
  if (/\b\d{4,6}_txt\b/i.test(id) || /\b\d{4,6}_txt\b/i.test(name) || /captcha.*answer/i.test(id + name)) {
    return true;
  }

  // Label text check
  const label = (resolveLabelText(element) || '').toLowerCase();
  if (
    CAPTCHA_PATTERNS.test(label) ||
    label.includes('captcha') ||
    label.includes('cpatcha') ||
    label.includes('कैप्चा') ||
    label.includes('सुरक्षा कोड')
  ) {
    return true;
  }

  // Parent / Sibling check for Captcha image or audio reload
  const formGroup = element.closest ? element.closest('.form-group, .field, .row, tr, td, div') : null;
  if (formGroup) {
    const hasCaptchaImg = formGroup.querySelector('img[src*="captcha" i], img[id*="captcha" i], [class*="captcha" i], [id*="captcha" i]');
    if (hasCaptchaImg && hasCaptchaImg !== element && !hasCaptchaImg.contains(element)) {
      return true;
    }
  }

  return false;
}

function isInternalTempField(element, root) {
  if (!element || (!element.id && !element.name)) return false;
  const id = element.id || '';
  const name = element.name || '';
  const isTemp = /temp$/i.test(id) || /_temp$/i.test(id) || /temp$/i.test(name) || /_temp$/i.test(name);
  if (!isTemp) return false;

  const baseId = id.replace(/_?temp$/i, '');
  const baseName = name.replace(/_?temp$/i, '');
  const doc = element.ownerDocument || root;
  if (baseId && baseId !== id && doc && doc.getElementById && doc.getElementById(baseId)) return true;
  if (baseName && baseName !== name && doc && doc.querySelector && doc.querySelector(`[name="${CSS.escape(baseName)}"]`)) return true;

  const label = (resolveLabelText(element) || '').toLowerCase();
  if (/\btemp\b/i.test(label)) return true;

  return false;
}

function isNegativeDirectiveOrSkip(val) {
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

// ──────────────────────────────────────────
// 5. SECTION HEADER DETECTION
// ──────────────────────────────────────────

function resolveSectionHeader(element) {
  const headingSelector = 'h1, h2, h3, h4, h5, h6, [role="heading"], .section-title, .form-title, .heading, [class*="section-header"], .M7eMe, [class*="question-title"]';
  let current = element;
  const candidates = [];

  while (current && current !== document.body) {
    const parent = current.parentElement;
    if (!parent) break;

    const siblings = Array.from(parent.children);
    const selfIdx = siblings.indexOf(current);

    for (let i = 0; i < selfIdx; i++) {
      const sib = siblings[i];
      const match = sib.matches?.(headingSelector) ? sib : sib.querySelector?.(headingSelector);
      if (match) {
        const clone = match.cloneNode(true);
        // Strip out asterisks and required annotations
        clone.querySelectorAll?.('.vnumgf, [aria-label*="Required"], .required-asterisk')?.forEach((n) => n.remove());
        const txt = clone.textContent?.trim();
        if (txt) candidates.push(txt);
      }
    }

    if (candidates.length > 0) {
      return candidates[candidates.length - 1];
    }

    if (parent.tagName.toLowerCase().match(/^h[1-6]$/) || parent.matches?.('[role="heading"]')) {
      return parent.textContent?.trim() || undefined;
    }

    // Check parent question containers (e.g. Google Forms .geS5n, fieldsets, groups, rows, form-groups)
    if (parent.matches?.('.geS5n, fieldset, [role="group"], [role="radiogroup"], .row, .form-group, [id*="-wrapper"], [class*="-wrapper"], [id*="Wrapper"], [class*="Wrapper"]')) {
      const qHead = parent.querySelector?.('[role="heading"], legend, .M7eMe, label.form-label, .col-form-label, label[id*="label"]');
      if (qHead && qHead !== current && !current.contains(qHead) && !qHead.contains(current)) {
        const clone = qHead.cloneNode(true);
        clone.querySelectorAll?.('.vnumgf, [aria-label*="Required"], .required-asterisk, input, select, textarea')?.forEach((n) => n.remove());
        const txt = clone.textContent?.trim();
        if (txt) return txt;
      }
    }

    current = parent;
  }

  return undefined;
}

// ──────────────────────────────────────────
// 6. RADIO GROUP OPTIONS COLLECTOR
// ──────────────────────────────────────────

function getRadioOptions(element) {
  if (element.type !== 'radio' || !element.name) return undefined;
  const radios = element.ownerDocument.querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`);
  const options = [];

  radios.forEach((r) => {
    const label = resolveLabelText(r);
    if (label) options.push(label);
    else if (r.value) options.push(r.value);
  });

  return options.length > 0 ? options : undefined;
}

// ──────────────────────────────────────────
// 7. INPUT GATHERING & CLASS TAGGING
// ──────────────────────────────────────────

function queryEligibleInputs(root) {
  const inputs = [];

  const nativeSelector = 'input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([disabled]), textarea:not([disabled]), select';
  const ariaSelector = '[role="checkbox"]:not([aria-disabled="true"]), [role="radio"]:not([aria-disabled="true"]), [role="listbox"], [role="combobox"], [contenteditable="true"]:not([aria-disabled="true"])';

  const nodes = root.querySelectorAll(`${nativeSelector}, ${ariaSelector}`);

  for (const node of nodes) {
    const role = node.getAttribute ? node.getAttribute('role') : null;

    // Avoid double counting if native input is inside ARIA wrapper
    if (role === 'checkbox' || role === 'radio') {
      const inner = node.querySelector('input[type="checkbox"], input[type="radio"]');
      if (inner && !inner.disabled) {
        continue;
      }
    }

    // Avoid double counting if native input or select is inside ARIA combobox/listbox wrapper
    if (role === 'combobox' || role === 'listbox') {
      const inner = node.querySelector('input:not([type="hidden"]):not([type="file"]):not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="image"]):not([disabled]), select');
      if (inner && !inner.disabled) {
        continue;
      }
    }

    // Exclude static readonly fields that cannot be filled
    if (isStaticReadonly(node)) {
      continue;
    }

    // Exclude peripheral widgets (chatbots, header search, footer newsletter)
    if (isPeripheralWidgetOrNav(node)) {
      continue;
    }

    // Exclude password, sensitive fields, captchas, and internal temporary mirror fields
    if (!isSensitiveField(node) && !isCaptchaField(node) && !isInternalTempField(node, root)) {
      inputs.push(node);
    }
  }

  // Traverse Shadow DOM
  root.querySelectorAll('*').forEach((el) => {
    if (el.shadowRoot) {
      inputs.push(...queryEligibleInputs(el.shadowRoot));
    }
  });

  return inputs;
}

function tagInputsWithClasses(root, frameIndex, forceRetag = false) {
  const eligible = queryEligibleInputs(root);
  const prefix = `${CLASS_PREFIX}${frameIndex}-`;

  if (forceRetag) {
    // Clean old tags only on explicit fresh scan
    for (const el of eligible) {
      const toRemove = Array.from(el.classList).filter((c) => c.startsWith(CLASS_PREFIX));
      for (const c of toRemove) el.classList.remove(c);
    }
  }

  // Tag with unique frame-indexed classes, preserving existing tags
  eligible.forEach((el, idx) => {
    const hasTag = Array.from(el.classList).some((c) => c.startsWith(CLASS_PREFIX));
    if (!hasTag) {
      el.classList.add(`${prefix}${idx}`);
    }
  });
}

function collectFieldMetadata(root, frameIndex) {
  const prefix = `${CLASS_PREFIX}${frameIndex}-`;
  const inputs = queryEligibleInputs(root);
  const seenRadioGroups = new Set();

  return inputs
    .filter((el) => Array.from(el.classList).some((c) => c.startsWith(prefix)))
    .map((el) => {
      const cls = Array.from(el.classList).find((c) => c.startsWith(prefix)) || '';
      const visible = isElementVisible(el);
      const label = resolveLabelText(el);
      const section = resolveSectionHeader(el);
      const formEl = el.closest('form');

      let inViewport = false;
      try {
        if (typeof window !== 'undefined' && el.getBoundingClientRect) {
          const rect = el.getBoundingClientRect();
          inViewport = (
            rect.top < window.innerHeight &&
            rect.bottom > 0 &&
            rect.left < window.innerWidth &&
            rect.right > 0 &&
            rect.width > 0 &&
            rect.height > 0
          );
        }
      } catch {}

      const activeElement = document.activeElement;
      const activeForm = activeElement?.closest ? activeElement.closest('form') : null;
      const inActiveForm = Boolean(formEl && activeForm && formEl === activeForm);

      const role = el.getAttribute ? el.getAttribute('role') : null;
      const isAriaCheckbox = role === 'checkbox';
      const isAriaRadio = role === 'radio';
      const isAriaDropdown = role === 'listbox' || role === 'combobox';
      const isContentEditable = el.getAttribute && el.getAttribute('contenteditable') === 'true';
      const isNativeRadio = el.type === 'radio';

      let isRadioGroupSecondary = false;
      if (isNativeRadio || isAriaRadio) {
        let groupKey = null;
        if (isNativeRadio && el.name) {
          groupKey = `name:${el.name}`;
        } else {
          const group = el.closest?.('[role="radiogroup"], .geS5n, [class*="radiogroup"]');
          if (group) {
            groupKey = group.id ? `id:${group.id}` : (group.getAttribute?.('aria-label') || section || 'aria_group');
          }
        }

        if (groupKey) {
          if (seenRadioGroups.has(groupKey)) {
            isRadioGroupSecondary = true;
          } else {
            seenRadioGroups.add(groupKey);
          }
        }
      }

      // Check for React-Select / Autocomplete control wrapper and placeholder div
      const isDate = isDateInput(el);
      const rsControl = !isDate ? findReactSelectControl(el) : null;
      const rsContainer = !isDate && el.closest ? (el.closest('[class*="-container"], [class*="__container"]') || rsControl?.parentElement) : null;
      const isReactSelect = isReactSelectElement(el);

      let placeholder = el.placeholder || undefined;
      if (!placeholder && rsControl) {
        const ph = rsControl.querySelector('[class*="-placeholder"], [class*="__placeholder"]');
        if (ph && ph.textContent?.trim()) {
          placeholder = ph.textContent.trim();
        }
      }

      // Smart Label Disambiguation:
      // If label is missing, equals raw ID, or is a generic compound row label (e.g. "Name", "State and City"),
      // enrich it with placeholder text so distinct fields (First vs Last Name, State vs City) never collide
      let finalLabel = label;
      if (!finalLabel || finalLabel === el.id) {
        finalLabel = placeholder || el.name || el.id;
      } else if (placeholder && placeholder.toLowerCase() !== finalLabel.toLowerCase()) {
        const normLabel = finalLabel.toLowerCase();
        const normPh = placeholder.toLowerCase();
        if (normLabel === 'name' && (normPh.includes('first') || normPh.includes('last') || normPh.includes('middle'))) {
          finalLabel = placeholder;
        } else if (normLabel.includes('state') && normLabel.includes('city')) {
          finalLabel = normPh.includes('city') ? 'City' : (normPh.includes('state') ? 'State' : placeholder);
        } else if (!normLabel.includes(normPh)) {
          finalLabel = `${finalLabel} (${placeholder})`;
        }
      }

      // For the primary radio of a group, resolve the group question title if available
      if ((isNativeRadio || isAriaRadio) && !isRadioGroupSecondary) {
        const groupContainer = el.closest?.('[role="radiogroup"], fieldset, .form-group, .row, [class*="radio-group"], [class*="radiogroup"], .geS5n');
        const legendOrTitle = groupContainer?.querySelector?.('legend, [class*="label"], [class*="title"], [class*="header"], [role="heading"]');
        if (legendOrTitle && legendOrTitle !== el && (!legendOrTitle.contains || !legendOrTitle.contains(el))) {
          const clone = legendOrTitle.cloneNode(true);
          clone.querySelectorAll?.('input, select, textarea')?.forEach?.((n) => n.remove());
          const groupTitle = clone.textContent?.trim();
          if (groupTitle && groupTitle.length > 1) {
            finalLabel = groupTitle;
          }
        }
      }

      const isMulti = Boolean(
        rsControl?.querySelector?.('[class*="is-multi"], [class*="--is-multi"], [class*="multiValue"], [class*="multi-value"]') ||
        (el.classList && Array.from(el.classList).some((c) => c.includes('multi')))
      );

      const fieldType =
        el instanceof HTMLSelectElement || isAriaDropdown
          ? 'select'
          : el instanceof HTMLTextAreaElement || isContentEditable
          ? 'textarea'
          : isAriaCheckbox
          ? 'checkbox'
          : isAriaRadio
          ? 'radio'
          : el.type || 'text';

      const isChecked = (isAriaCheckbox || isAriaRadio)
        ? el.getAttribute('aria-checked') === 'true'
        : Boolean(el.checked);

      const fieldVal = isContentEditable
        ? (el.textContent || '')
        : el.value != null
        ? el.value
        : (el.getAttribute('data-answer-value') || el.getAttribute('data-value') || el.getAttribute('aria-label') || '');

      const isSelectLike = (el instanceof HTMLSelectElement) || isReactSelect || isAriaDropdown;
      let validSelectOptions = [];

      if (el instanceof HTMLSelectElement) {
        // Collect real selectable options, filtering out non-selectable placeholders
        validSelectOptions = Array.from(el.options).filter((o) => {
          if (o.disabled) return false;
          const val = (o.value || '').trim().toLowerCase();
          const txt = (o.text || '').trim().toLowerCase();
          if (!val && !txt) return false;
          if (['', '0', '-1', 'none', 'null'].includes(val) && /^(select|choose|pick|please select|--)/i.test(txt)) return false;
          if (/^(select|choose|pick|please select|--\s*select|select one)/i.test(txt) && o.index === 0) return false;
          return true;
        });
      }

      const isCascadingKeyword = /district|sub-?division|block|tehsil|taluk|mandal|ward|corporation|municipality|panchayat|village|post\s*office|police\s*station|जिला|प्रखंड|अनुमंडल|नगर\s*निगम|पंचायत|थाना|डाकघर/i.test(`${el.name || ''} ${el.id || ''} ${finalLabel || ''} ${placeholder || ''}`);
      const isSelectPlaceholderOnly = (el instanceof HTMLSelectElement) && (el.options.length <= 1 || validSelectOptions.length === 0);

      const isDependent = Boolean(
        isSelectLike && (
          el.disabled ||
          el.getAttribute('aria-disabled') === 'true' ||
          isSelectPlaceholderOnly ||
          isCascadingKeyword ||
          el.closest?.('[class*="cascad"], [id*="cascad"], #stateCity-wrapper')
        )
      );

      const meta = {
        class: cls,
        name: el.name || undefined,
        id: el.id || undefined,
        placeholder,
        type: fieldType,
        value: fieldVal,
        required: Boolean(el.required || el.getAttribute('aria-required') === 'true'),
        disabled: Boolean(el.disabled || el.getAttribute('aria-disabled') === 'true'),
        isDependent: isDependent || undefined,
        readonly: Boolean(el.readOnly || el.getAttribute('aria-readonly') === 'true'),
        checked: isChecked,
        autocomplete: el.autocomplete || undefined,
        'aria-label': el.getAttribute('aria-label') || undefined,
        labelText: finalLabel,
        sectionHeader: section,
        isVisible: visible,
        isRadioGroupSecondary: isRadioGroupSecondary || undefined,
        inViewport,
        inActiveForm,
        isReactSelect: isReactSelect || undefined,
        isMulti: isMulti || undefined,
        formAction: formEl?.action || undefined,
        formId: formEl?.id || undefined
      };

      if (el instanceof HTMLSelectElement) {
        if (validSelectOptions.length > 0) {
          const opts = validSelectOptions.map((o) => o.text.trim() || o.value.trim()).filter(Boolean);
          meta.options = opts.slice(0, 50);
          if (opts.length > 50) meta.optionsTruncated = true;
        } else {
          meta.options = [];
        }
      } else if (isAriaDropdown) {
        const doc = el.ownerDocument;
        const ownedId = el.getAttribute('aria-owns') || el.getAttribute('aria-controls');
        const container = ownedId ? doc.getElementById(ownedId) : (rsContainer || el);
        const opts = Array.from(container?.querySelectorAll('[role="option"], [class*="-option"], .goog-menuitem') || []);
        if (opts.length > 0) {
          meta.options = opts.map((o) => o.textContent?.trim() || o.getAttribute('data-value') || '').filter(Boolean).slice(0, 50);
        }
      }

      if (el instanceof HTMLInputElement && el.type === 'radio') {
        meta.radioGroupName = el.name;
        meta.radioOptions = getRadioOptions(el);
      } else if (isAriaRadio) {
        const group = el.closest('[role="radiogroup"], .geS5n, [class*="radiogroup"]');
        if (group) {
          const siblingRadios = Array.from(group.querySelectorAll('[role="radio"]'));
          meta.radioGroupName = group.id || section || 'radio_group';
          meta.radioOptions = siblingRadios.map((r) => resolveLabelText(r) || r.getAttribute('data-value') || '').filter(Boolean);
        }
      }

      if (el instanceof HTMLTextAreaElement || isContentEditable) {
        meta.rows = el.rows || 3;
      }

      return meta;
    });
}

// ──────────────────────────────────────────
// 8. ROBUST REACT/VUE SYNTHETIC VALUE SETTER
// ──────────────────────────────────────────

const SHORT_MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseDateComponents(val) {
  if (val == null) return null;
  const str = String(val).trim();
  if (!str) return null;

  // 1. Standard ISO YYYY-MM-DD or ISO timestamp
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    return {
      year: parseInt(isoMatch[1], 10),
      month: parseInt(isoMatch[2], 10),
      day: parseInt(isoMatch[3], 10)
    };
  }

  // 2. YYYY/MM/DD or YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymdMatch) {
    return {
      year: parseInt(ymdMatch[1], 10),
      month: parseInt(ymdMatch[2], 10),
      day: parseInt(ymdMatch[3], 10)
    };
  }

  // 3. DD-MM-YYYY or MM-DD-YYYY or DD/MM/YYYY or MM/DD/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    let m = p2;
    let d = p1;
    if (p1 <= 12 && p2 > 12) {
      m = p1;
      d = p2;
    }
    return { year: y, month: m, day: d };
  }

  // 4. Fallback via Date.parse (e.g. "December 25, 1995" or "12 May 1998")
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    if (y > 1000 && y < 3000) {
      return {
        year: y,
        month: parsed.getMonth() + 1,
        day: parsed.getDate()
      };
    }
  }

  return null;
}

function formatDateForElement(element, rawValue) {
  const parts = parseDateComponents(rawValue);
  if (!parts) return rawValue;

  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = String(parts.year);
  const mm = pad(parts.month);
  const dd = pad(parts.day);
  const mon = SHORT_MONTH_NAMES[parts.month - 1] || 'Jan';

  // 1. Native HTML5 <input type="date"> requires ISO YYYY-MM-DD
  if (element && element.type === 'date') {
    return `${yyyy}-${mm}-${dd}`;
  }

  // 2. Text datepickers: inspect existing value, placeholder, or data-format
  const hint = (
    (element?.value || '') + ' ' +
    (element?.placeholder || '') + ' ' +
    (element?.dataset?.format || '') + ' ' +
    (element?.getAttribute?.('data-date-format') || '')
  ).trim();

  // Pattern A: "DD MMM YYYY" or "26 Sep 2026" (e.g. DemoQA react-datepicker)
  if (/\b\d{1,2}\s+[A-Za-z]{3,}\s+\d{4}\b/i.test(hint) || /dd\s+mmm\s+yyyy/i.test(hint)) {
    return `${dd} ${mon} ${yyyy}`;
  }

  // Pattern B: "DD/MM/YYYY" or "DD-MM-YYYY"
  if (/dd[/]mm[/]yyyy/i.test(hint) || /\b\d{2}\/\d{2}\/\d{4}\b/.test(hint)) {
    return `${dd}/${mm}/${yyyy}`;
  }
  if (/dd[-]mm[-]yyyy/i.test(hint) || /\b\d{2}-\d{2}-\d{4}\b/.test(hint)) {
    return `${dd}-${mm}-${yyyy}`;
  }

  // Pattern C: "MM/DD/YYYY"
  if (/mm[/]dd[/]yyyy/i.test(hint)) {
    return `${mm}/${dd}/${yyyy}`;
  }

  // Pattern D: Detected react-datepicker (default is "DD MMM YYYY")
  if (
    element &&
    (
      (element.className && String(element.className).includes('react-datepicker')) ||
      (element.closest && element.closest('.react-datepicker-wrapper, .react-datepicker__input-container'))
    )
  ) {
    return `${dd} ${mon} ${yyyy}`;
  }

  // Default fallback for text datepickers
  return `${yyyy}-${mm}-${dd}`;
}

function normalizeDateValue(val) {
  if (val == null) return '';
  const str = String(val).trim();
  if (!str) return '';

  // 1. Standard ISO YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. ISO timestamp with T (e.g. 1995-12-25T00:00:00.000Z)
  const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})T/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // 3. YYYY/MM/DD or YYYY.MM.DD or YYYY-M-D
  const ymdMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, '0')}-${ymdMatch[3].padStart(2, '0')}`;
  }

  // 4. DD-MM-YYYY or MM-DD-YYYY or DD/MM/YYYY or MM/DD/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const p1 = parseInt(dmyMatch[1], 10);
    const p2 = parseInt(dmyMatch[2], 10);
    const y = dmyMatch[3];
    let m, d;
    if (p1 > 12 && p2 <= 12) {
      d = String(p1).padStart(2, '0');
      m = String(p2).padStart(2, '0');
    } else if (p2 > 12 && p1 <= 12) {
      m = String(p1).padStart(2, '0');
      d = String(p2).padStart(2, '0');
    } else {
      m = String(p1).padStart(2, '0');
      d = String(p2).padStart(2, '0');
    }
    return `${y}-${m}-${d}`;
  }

  // 5. Fallback via Date.parse (e.g. "December 25, 1995")
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    if (y > 1000 && y < 3000) {
      return `${y}-${m}-${d}`;
    }
  }

  return str;
}

async function fillReactSelect(element, value) {
  if (!element || value == null || String(value).trim() === '') return false;

  const doc = element.ownerDocument || document;
  const win = doc.defaultView || (typeof window !== 'undefined' ? window : {});
  const rsControl = findReactSelectControl(element) || element.parentElement;
  const rsContainer = element.closest ? (element.closest('[class*="-container"], [class*="__container"]') || rsControl?.parentElement) : null;

  // Split multiple values if value is comma/semicolon/newline separated or an array
  const rawValues = Array.isArray(value)
    ? value
    : String(value).split(/[,;\n]+/).map((s) => s.trim()).filter(Boolean);

  if (rawValues.length === 0) return false;

  const proto = win.HTMLInputElement?.prototype;
  const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;

  const setInputValue = (val) => {
    try {
      if (element._valueTracker) {
        element._valueTracker.setValue('');
      }
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, val);
      } else {
        element.value = val;
      }
    } catch {}
  };

  const dispatchKey = (key, keyCode) => {
    try {
      const KeyboardEvt = win.KeyboardEvent || (typeof KeyboardEvent !== 'undefined' ? KeyboardEvent : (win.Event || Event));
      const keyInit = { key, code: key, keyCode, which: keyCode, bubbles: true, cancelable: true };
      element.dispatchEvent(new KeyboardEvt('keydown', keyInit));
      element.dispatchEvent(new KeyboardEvt('keypress', keyInit));
      element.dispatchEvent(new KeyboardEvt('keyup', keyInit));
    } catch {}
  };

  const isCurrentlyDisabled = () => {
    return Boolean(
      element.disabled ||
      element.getAttribute?.('aria-disabled') === 'true' ||
      rsControl?.className?.includes('disabled') ||
      rsControl?.className?.includes('--is-disabled') ||
      rsContainer?.className?.includes('disabled') ||
      element.closest?.('[class*="--is-disabled"], [class*="is-disabled"]')
    );
  };

  const isMockEnv = !doc || !doc.body || typeof win.requestAnimationFrame !== 'function';
  const unlockTimeout = isMockEnv ? 30 : 1500;
  const menuTimeout = isMockEnv ? 30 : 800;

  try {
    // 1. If initially disabled (e.g. cascading City waiting for State to unlock), wait up to 1500ms
    const waitStart = Date.now();
    while (isCurrentlyDisabled() && (Date.now() - waitStart) < unlockTimeout) {
      await new Promise((r) => setTimeout(r, isMockEnv ? 10 : 40));
    }

    // 2. Process each value token sequentially with reactive DOM observation
    for (let i = 0; i < rawValues.length; i++) {
      const token = rawValues[i];

      // Activate & focus control
      try {
        element.focus?.();
        if (i === 0 && rsControl && !rsControl.className?.includes('is-focused')) {
          const MouseEvt = win.MouseEvent || (typeof MouseEvent !== 'undefined' ? MouseEvent : (win.Event || Event));
          rsControl.dispatchEvent(new MouseEvt('mousedown', { bubbles: true, cancelable: true }));
          rsControl.dispatchEvent(new MouseEvt('mouseup', { bubbles: true, cancelable: true }));
        }
      } catch {}

      // Type the token
      setInputValue(token);
      let inputDispatched = false;
      if (typeof win.InputEvent === 'function') {
        try {
          element.dispatchEvent(new win.InputEvent('input', {
            bubbles: true,
            cancelable: true,
            inputType: 'insertReplacementText',
            data: token
          }));
          inputDispatched = true;
        } catch {}
      }
      if (!inputDispatched) {
        try { element.dispatchEvent(new win.Event('input', { bubbles: true })); } catch {}
      }
      try { element.dispatchEvent(new win.Event('change', { bubbles: true })); } catch {}

      // 3. Reactive Observation: Poll for menu options to appear in DOM (up to 800ms)
      let matched = null;
      const menuStart = Date.now();
      while (Date.now() - menuStart < menuTimeout) {
        const ariaControls = element.getAttribute?.('aria-controls') || element.getAttribute?.('aria-owns');
        const menu = (ariaControls && doc.getElementById(ariaControls)) ||
                     rsContainer?.querySelector?.('[class*="-menu"], [class*="__menu"], [role="listbox"]') ||
                     doc.querySelector('[class*="auto-complete__menu"], [class*="-menu"], [role="listbox"]');

        if (menu) {
          const opts = Array.from(menu.querySelectorAll('[class*="-option"], [class*="__option"], [role="option"], [id*="-option-"]'))
            .filter((o) => !o.textContent?.toLowerCase().includes('no options'));

          if (opts.length > 0) {
            const norm = token.toLowerCase();
            matched = opts.find((o) => (o.textContent || '').toLowerCase().trim() === norm) ||
                      opts.find((o) => (o.textContent || '').toLowerCase().trim().startsWith(norm)) ||
                      opts.find((o) => (o.textContent || '').toLowerCase().includes(norm));

            // Fallback if typo/mismatch: pick first option
            if (!matched && opts.length > 0) {
              matched = opts[0];
            }
            if (matched) break;
          }
        }
        await new Promise((r) => setTimeout(r, isMockEnv ? 10 : 30));
      }

      // 4. Click the matched option or commit with keys
      let optionSelected = false;
      if (matched) {
        const MouseEvt = win.MouseEvent || (typeof MouseEvent !== 'undefined' ? MouseEvent : (win.Event || Event));
        const PointerEvt = win.PointerEvent || MouseEvt;
        try { matched.dispatchEvent(new PointerEvt('pointerdown', { bubbles: true, cancelable: true })); } catch {}
        try { matched.dispatchEvent(new MouseEvt('mousedown', { bubbles: true, cancelable: true })); } catch {}
        try { matched.dispatchEvent(new PointerEvt('pointerup', { bubbles: true, cancelable: true })); } catch {}
        try { matched.dispatchEvent(new MouseEvt('mouseup', { bubbles: true, cancelable: true })); } catch {}
        if (typeof matched.click === 'function') {
          try { matched.click(); } catch {}
        }
        optionSelected = true;
      } else {
        // Keyboard fallback: Enter and Tab to commit tag / creatable
        dispatchKey('Enter', 13);
        dispatchKey('Tab', 9);
      }

      // 5. Clean up search input only if option was selected
      if (optionSelected) {
        setInputValue('');
        try { element.dispatchEvent(new win.Event('input', { bubbles: true })); } catch {}
      }

      // 6. Pause briefly (100ms) for React state batching and chip render before next token
      if (!isMockEnv) {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
  } catch (err) {
    console.warn('[FastFiller] React-select sequential injection warning:', err);
  }

  dispatchChangeEvents(element, value);
  triggerHighlight(rsControl || element);
  return true;
}

function clickElementDirect(el) {
  if (!el) return;
  const doc = el.ownerDocument || document;
  const win = doc.defaultView || (typeof window !== 'undefined' ? window : {});
  const MouseEvt = win.MouseEvent || (typeof MouseEvent !== 'undefined' ? MouseEvent : (win.Event || Event));
  const PointerEvt = win.PointerEvent || MouseEvt;
  const opts = { bubbles: true, cancelable: true, view: win, button: 0, buttons: 1 };
  try { el.dispatchEvent(new PointerEvt('pointerdown', opts)); } catch {}
  try { el.dispatchEvent(new MouseEvt('mousedown', opts)); } catch {}
  try { el.dispatchEvent(new PointerEvt('pointerup', opts)); } catch {}
  try { el.dispatchEvent(new MouseEvt('mouseup', opts)); } catch {}
  try {
    if (typeof el.click === 'function') el.click();
    else el.dispatchEvent(new MouseEvt('click', opts));
  } catch {}
}

function resetSearchInput(element) {
  if (element && element.tagName === 'INPUT') {
    try {
      const doc = element.ownerDocument || document;
      const win = doc.defaultView || (typeof window !== 'undefined' ? window : {});
      const proto = win.HTMLInputElement?.prototype;
      const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
      if (descriptor && descriptor.set) {
        descriptor.set.call(element, '');
      } else {
        element.value = '';
      }
      element.dispatchEvent(new (win.Event || Event)('input', { bubbles: true }));
      element.dispatchEvent(new (win.Event || Event)('change', { bubbles: true }));
    } catch {}
  }
}

function clearReactSelectViaFiber(element, rsControl, isMulti) {
  const clearVal = isMulti ? [] : null;
  // CRITICAL: NEVER include 'element' (the DOM <input>) in nodes receiving onChange.
  // Calling onChange(null) on an <input>'s React synthetic event prop throws:
  // TypeError: Cannot read property of null (reading 'currentTarget')
  // which crashes the host page's React root and causes a BLANK WHITE SCREEN!
  const nodes = [
    rsControl,
    rsControl?.parentElement,
    element,
    element?.parentElement,
    element?.closest ? element.closest('[class*="-container"], [class*="__container"]') : null
  ].filter(Boolean);

  for (const node of nodes) {
    try {
      const keys = Object.keys(node);
      const propKey = keys.find((k) => k.startsWith('__reactProps$') || k.startsWith('__reactEventHandlers$'));
      if (propKey && node[propKey]) {
        const p = node[propKey];
        if (typeof p.clearValue === 'function') {
          p.clearValue();
          return true;
        }
        if (typeof p.setValue === 'function') {
          p.setValue(clearVal, 'clear');
          return true;
        }
        if (p.selectProps) {
          if (typeof p.selectProps.clearValue === 'function') {
            p.selectProps.clearValue();
            return true;
          }
          if (typeof p.selectProps.setValue === 'function') {
            p.selectProps.setValue(clearVal, 'clear');
            return true;
          }
          if (typeof p.selectProps.onChange === 'function') {
            p.selectProps.onChange(clearVal, { action: 'clear' });
            return true;
          }
        }
      }

      const fiberKey = keys.find((k) => k.startsWith('__reactFiber$') || k.startsWith('__reactInternalInstance$'));
      let fiber = fiberKey ? node[fiberKey] : null;
      let depth = 0;
      while (fiber && depth < 30) {
        depth++;
        const sn = fiber.stateNode;
        if (sn) {
          if (typeof sn.clearValue === 'function') {
            sn.clearValue();
            return true;
          }
          if (typeof sn.setValue === 'function') {
            sn.setValue(clearVal, 'clear');
            return true;
          }
          if (sn.selectProps && typeof sn.selectProps.onChange === 'function') {
            sn.selectProps.onChange(clearVal, { action: 'clear' });
            return true;
          }
        }

        const mp = fiber.memoizedProps;
        if (mp) {
          if (mp.selectProps) {
            if (typeof mp.selectProps.clearValue === 'function') {
              mp.selectProps.clearValue();
              return true;
            }
            if (typeof mp.selectProps.setValue === 'function') {
              mp.selectProps.setValue(clearVal, 'clear');
              return true;
            }
            if (typeof mp.selectProps.onChange === 'function') {
              mp.selectProps.onChange(clearVal, { action: 'clear' });
              return true;
            }
          }
          if (typeof mp.clearValue === 'function') {
            mp.clearValue();
            return true;
          }
          if (typeof mp.setValue === 'function') {
            mp.setValue(clearVal, 'clear');
            return true;
          }
        }

        fiber = fiber.return;
      }
    } catch {}
  }
  return false;
}

function clearReactSelect(element, rsControl) {
  if (!element && !rsControl) return false;
  const ctrl = rsControl || findReactSelectControl(element) || element?.parentElement;

  const isMulti = Boolean(
    ctrl?.querySelector?.('[class*="is-multi"], [class*="--is-multi"], [class*="multi-value"], [class*="multiValue"]') ||
    (element?.id && (element.id.includes('subjects') || element.id.includes('multi'))) ||
    (element?.classList && Array.from(element.classList).some((c) => c.includes('multi') || c.includes('subjects')))
  );

  // 1. Primary Strategy: Official Clear Indicator button (100% natural, safe, and clean)
  if (ctrl && ctrl.querySelector) {
    const clearBtn = ctrl.querySelector('[class*="clear-indicator"], [class*="clearIndicator"], [aria-label*="Clear"], [aria-label*="clear"]');
    if (clearBtn) {
      const clickTarget = clearBtn.querySelector('svg') || clearBtn;
      clickElementDirect(clickTarget);
      clickElementDirect(clearBtn);
      resetSearchInput(element);
      triggerHighlight(ctrl);
      return true;
    }

    // 2. Secondary Strategy: Individual remove buttons on multi-select chips
    const removeBtns = Array.from(ctrl.querySelectorAll('[class*="multi-value__remove"], [class*="multiValue__remove"], [aria-label*="Remove"]') || []);
    if (removeBtns.length > 0) {
      for (const btn of removeBtns) {
        clickElementDirect(btn);
      }
      resetSearchInput(element);
      triggerHighlight(ctrl);
      return true;
    }
  }

  // 3. Tertiary Strategy: React Component / Fiber State Reset (safely filtered)
  const fiberCleared = clearReactSelectViaFiber(element, ctrl, isMulti);
  if (fiberCleared) {
    // Synthetic/mock test environments cleanup only
    if (typeof window === 'undefined' || !ctrl?.ownerDocument?.defaultView) {
      if (ctrl && ctrl.querySelectorAll) {
        ctrl.querySelectorAll('[class*="multi-value"], [class*="multiValue"]').forEach((c) => c.remove?.());
        const sv = ctrl.querySelector?.('[class*="singleValue"], [class*="single-value"]');
        if (sv) sv.remove?.();
      }
    }
    resetSearchInput(element);
    if (ctrl) triggerHighlight(ctrl);
    else if (element) triggerHighlight(element);
    return true;
  }

  resetSearchInput(element);
  if (ctrl) triggerHighlight(ctrl);
  else if (element) triggerHighlight(element);
  return true;
}

async function revertReactSelect(element, priorState) {
  if (!element) return false;
  const rsControl = findReactSelectControl(element) || element.parentElement;

  // Case A: Prior state was empty or had no value -> clear completely
  if (!priorState || priorState.isEmpty || !priorState.value || (Array.isArray(priorState.value) && priorState.value.length === 0)) {
    return clearReactSelect(element, rsControl);
  }

  // Case B: Prior state had a specific value -> clear existing and re-fill previous value
  clearReactSelect(element, rsControl);
  return fillReactSelect(element, priorState.value);
}

function isCheckboxCheckedValue(element, value) {
  if (typeof value === 'boolean') return value;
  if (value == null) return false;
  const strVal = String(value).toLowerCase().trim();
  if (['true', 'yes', '1', 'on', 'checked', 'selected'].includes(strVal)) return true;
  if (['false', 'no', '0', 'off', 'unchecked', '', 'null', 'undefined'].includes(strVal)) return false;

  // Check against element's own value, label text, or name
  const elVal = String(element.value || '').toLowerCase().trim();
  const label = String(resolveLabelText(element) || '').toLowerCase().trim();
  const name = String(element.name || '').toLowerCase().trim();

  if (elVal && elVal !== 'on' && elVal !== 'true' && (strVal === elVal || strVal.split(/[,;\n]+/).map((s) => s.trim()).includes(elVal))) {
    return true;
  }
  if (label && (strVal === label || strVal.split(/[,;\n]+/).map((s) => s.trim()).includes(label) || (label.length > 2 && strVal.includes(label)))) {
    return true;
  }
  if (name && (strVal === name || strVal.split(/[,;\n]+/).map((s) => s.trim()).includes(name))) {
    return true;
  }

  return false;
}

function setCheckboxNativeChecked(element, isChecked) {
  try {
    if (element._valueTracker) {
      element._valueTracker.setValue(!isChecked);
    }
    const win = element.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : {});
    const proto = win.HTMLInputElement?.prototype;
    const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'checked') : null;
    if (descriptor && descriptor.set) {
      descriptor.set.call(element, isChecked);
    } else {
      element.checked = isChecked;
    }
  } catch {
    element.checked = isChecked;
  }
}

function findSelectOptionMatch(element, rawTarget) {
  if (!element || !element.options || element.options.length === 0) return null;
  const target = String(rawTarget || '').trim().toLowerCase();
  if (!target) return null;

  const options = Array.from(element.options);
  if (options.length === 0) return null;

  // Helper to detect non-selectable placeholder options (e.g. "Select a service", "-- Choose --", value="")
  const isPlaceholder = (opt) => {
    if (opt.disabled) return true;
    const val = (opt.value || '').trim().toLowerCase();
    const txt = (opt.text || '').trim().toLowerCase();
    if (!val && !txt) return true;
    if (['', '0', '-1', 'none', 'null', 'undefined'].includes(val) && /^(select|choose|pick|please select|--)/i.test(txt)) return true;
    if (/^(select|choose|pick|please select|--\s*select|select one)/i.test(txt) && opt.index === 0) return true;
    return false;
  };

  const validOptions = options.filter((o) => !isPlaceholder(o));
  const pool = validOptions.length > 0 ? validOptions : options;

  // Stage 1: Exact match on value or text (case-insensitive)
  let matched = pool.find(
    (o) => (o.value || '').toLowerCase().trim() === target || (o.text || '').toLowerCase().trim() === target
  );
  if (matched) return matched;

  // Stage 1b: Slash & Bilingual normalization (e.g. "BHOJPUR / भोजपुर" vs "BHOJPUR/भोजपुर")
  const cleanTargetSlash = target.replace(/\s*([\/|])\s*/g, '$1');
  matched = pool.find((o) => {
    const ov = (o.value || '').toLowerCase().trim().replace(/\s*([\/|])\s*/g, '$1');
    const ot = (o.text || '').toLowerCase().trim().replace(/\s*([\/|])\s*/g, '$1');
    return ov === cleanTargetSlash || ot === cleanTargetSlash;
  });
  if (matched) return matched;

  // Stage 1c: Sub-part bilingual match (handles "A / B" vs "A/B", "A / B" vs "C / B", or "A / B" vs "A")
  const targetSubParts = target.split(/\s*[\/|]\s*/).map((p) => p.trim()).filter((p) => p.length > 1);
  if (targetSubParts.length > 0) {
    matched = pool.find((o) => {
      const ov = (o.value || '').toLowerCase().trim();
      const ot = (o.text || '').toLowerCase().trim();
      const optParts = [
        ov,
        ot,
        ...ov.split(/\s*[\/|]\s*/).map((p) => p.trim()).filter((p) => p.length > 1),
        ...ot.split(/\s*[\/|]\s*/).map((p) => p.trim()).filter((p) => p.length > 1)
      ];
      return targetSubParts.some((tp) => optParts.includes(tp));
    });
    if (matched) return matched;
  }

  // Stage 2: Gender normalization
  if (target === 'male' || target === 'm') {
    matched = pool.find((o) => {
      const v = (o.value || '').toLowerCase().trim();
      const t = (o.text || '').toLowerCase().trim();
      return v === 'm' || v === 'male' || t === 'male';
    });
    if (matched) return matched;
  } else if (target === 'female' || target === 'f') {
    matched = pool.find((o) => {
      const v = (o.value || '').toLowerCase().trim();
      const t = (o.text || '').toLowerCase().trim();
      return v === 'f' || v === 'female' || t === 'female';
    });
    if (matched) return matched;
  }

  // Stage 2b: International Phone Country Code / Dial Code Matching (+1, +91, +44, etc.)
  const dialMatch = target.match(/^\+?(\d{1,4})$/);
  if (dialMatch) {
    const dialDigits = dialMatch[1];
    const dialPlus = `+${dialDigits}`;
    const dialRegex = new RegExp(`(?:\\(\\+?|\\+)${dialDigits}(?:\\)|\\b|$)`, 'i');
    matched = pool.find((o) => {
      const v = (o.value || '').trim();
      const t = (o.text || '').trim();
      return v === dialPlus ||
             v === dialDigits ||
             t.includes(`(${dialPlus})`) ||
             t.includes(`(${dialDigits})`) ||
             t.includes(`[${dialPlus}]`) ||
             t.includes(`${dialPlus} `) ||
             t.endsWith(dialPlus) ||
             dialRegex.test(t) ||
             dialRegex.test(v);
    });
    if (matched) return matched;
  }

  // Stage 3: Semantic Boolean & Work Authorization Disambiguation
  const YES_SYNONYMS = ['yes', 'authorized', 'true', '1', 'eligible', 'citizen', 'y'];
  const NO_SYNONYMS = ['no', 'unauthorized', 'false', '0', 'sponsorship required', 'ineligible', 'n'];
  const isAffirmative = YES_SYNONYMS.includes(target) || YES_SYNONYMS.some((syn) => target.startsWith(syn));
  const isNegative = NO_SYNONYMS.includes(target) || NO_SYNONYMS.some((syn) => target.startsWith(syn));

  if (isAffirmative && !isNegative) {
    matched = pool.find((o) => {
      const v = (o.value || '').toLowerCase().trim();
      const t = (o.text || '').toLowerCase().trim();
      return YES_SYNONYMS.some((syn) => v === syn || t === syn);
    });
    if (matched) return matched;
  } else if (isNegative && !isAffirmative) {
    matched = pool.find((o) => {
      const v = (o.value || '').toLowerCase().trim();
      const t = (o.text || '').toLowerCase().trim();
      return NO_SYNONYMS.some((syn) => v === syn || t === syn);
    });
    if (matched) return matched;
  }

  // Stage 4: Normalized punctuation / alphanumeric match (supporting Unicode & Devanagari letters)
  const normalizeStr = (s) => (s || '').toLowerCase().replace(/[^\p{L}\p{N}]/gu, ' ').replace(/\s+/g, ' ').trim();
  const normTarget = normalizeStr(target);

  matched = pool.find((o) => {
    const nv = normalizeStr(o.value);
    const nt = normalizeStr(o.text);
    return (nv && nv === normTarget) || (nt && nt === normTarget);
  });
  if (matched) return matched;

  // Stage 5: Semantic Token / Substring Overlap Scoring
  if (normTarget.length > 2) {
    const targetWords = normTarget.split(' ').filter((w) => w.length > 1 && !['and', 'the', 'for', 'with', 'or', 'services'].includes(w));
    let bestScore = 0;
    let bestOpt = null;

    for (const opt of pool) {
      const optTextNorm = normalizeStr(opt.text);
      const optValNorm = normalizeStr(opt.value);
      const optWords = (optTextNorm + ' ' + optValNorm).split(' ').filter((w) => w.length > 1);

      let score = 0;
      if (optTextNorm.includes(normTarget) || (normTarget.length >= 4 && normTarget.includes(optTextNorm))) {
        score += 60;
      }
      if (targetWords.length > 0) {
        const matchedWords = targetWords.filter((w) => optWords.some((ow) => ow.includes(w) || w.includes(ow)));
        const overlapRatio = matchedWords.length / targetWords.length;
        score += overlapRatio * 50;
      }
      if ((optTextNorm === 'other' || optValNorm === 'other') && normTarget !== 'other') {
        score -= 30;
      }
      if (score > bestScore && score >= 40) {
        bestScore = score;
        bestOpt = opt;
      }
    }
    if (bestOpt) return bestOpt;
  }

  return null;
}

function applySelectOption(element, matched) {
  if (!element || !matched) return false;

  const alreadySelected = (element.value === matched.value) && (element.selectedIndex === matched.index);

  const win = element.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : {});
  const proto = win.HTMLSelectElement?.prototype;
  const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, matched.value);
  } else {
    element.value = matched.value;
  }

  matched.selected = true;
  element.selectedIndex = matched.index;

  dispatchChangeEvents(element);
  triggerHighlight(element);
  return true;
}

function waitForSelectOptionMatch(element, rawTarget, timeoutMs = 2500, fieldMeta = null, classKey = null) {
  return new Promise((resolve) => {
    let matched = findSelectOptionMatch(element, rawTarget);
    if (matched) {
      applySelectOption(element, matched);
      return resolve(true);
    }

    let observer = null;
    let pollInterval = null;
    let finished = false;

    const cleanup = () => {
      finished = true;
      if (observer) {
        try { observer.disconnect(); } catch {}
        observer = null;
      }
      if (pollInterval) {
        clearInterval(pollInterval);
        pollInterval = null;
      }
    };

    const resolveLiveElement = () => {
      let el = element;
      if (!el.isConnected && el.ownerDocument) {
        const doc = el.ownerDocument;
        if (el.id) {
          el = doc.getElementById(el.id) || el;
        } else if (el.name) {
          el = doc.querySelector(`[name="${CSS.escape ? CSS.escape(el.name) : el.name}"]`) || el;
        } else if (classKey) {
          el = findTaggedElement(doc, classKey, fieldMeta) || el;
        }
      }
      return el;
    };

    const tryMatch = () => {
      if (finished) return;
      const el = resolveLiveElement();
      matched = findSelectOptionMatch(el, rawTarget);
      if (matched) {
        cleanup();
        applySelectOption(el, matched);
        resolve(true);
      }
    };

    if (typeof MutationObserver !== 'undefined' && element.nodeType === 1) {
      try {
        observer = new MutationObserver(() => tryMatch());
        const observeTarget = element.parentElement || element;
        observer.observe(observeTarget, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
      } catch {}
    }

    pollInterval = setInterval(tryMatch, 40);

    setTimeout(() => {
      if (!finished) {
        cleanup();
        const el = resolveLiveElement();
        matched = findSelectOptionMatch(el, rawTarget);
        if (matched) {
          applySelectOption(el, matched);
          resolve(true);
        } else {
          resolve(false);
        }
      }
    }, timeoutMs);
  });
}

function setElementValueNative(element, value, fieldMeta = null, classKey = null) {
  try {
    ensureStylesInjected();

    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      value = value.value ?? value.label ?? value.text ?? value.name ?? '';
    }



    // 1. SELECT ELEMENT
    const isSelect = (element.tagName === 'SELECT') || (typeof HTMLSelectElement !== 'undefined' && element instanceof HTMLSelectElement);
    if (isSelect) {
      const rawTarget = String(value || '').trim();
      if (!rawTarget) {
        element.selectedIndex = 0;
        const win = element.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : {});
        const proto = win.HTMLSelectElement?.prototype;
        const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
        if (descriptor && descriptor.set) {
          descriptor.set.call(element, element.options?.[0]?.value || '');
        } else {
          element.value = element.options?.[0]?.value || '';
        }
        dispatchChangeEvents(element);
        triggerHighlight(element);
        return true;
      }

      // Check synchronous match first (instant 0ms for pre-populated dropdowns & unit tests)
      const instantMatch = findSelectOptionMatch(element, rawTarget);
      if (instantMatch) {
        return applySelectOption(element, instantMatch);
      }

      // If no options or only placeholders exist, wait asynchronously for AJAX/cascade
      if (typeof window !== 'undefined' && (typeof setTimeout === 'function')) {
        return waitForSelectOptionMatch(element, rawTarget, 2500, fieldMeta, classKey);
      }

      return false;
    }

    // 1b. REACT-SELECT / COMBOBOX / AUTOCOMPLETE
    const isDate = isDateInput(element);
    const rsControl = !isDate ? findReactSelectControl(element) : null;
    const isReactSelect = isReactSelectElement(element);

    if (isReactSelect) {
      if (value == null || String(value).trim() === '' || (Array.isArray(value) && value.length === 0)) {
        return clearReactSelect(element, rsControl);
      }
      return fillReactSelect(element, value);
    }

    // 1c. CUSTOM ARIA DROPDOWN (role="listbox" or role="combobox")
    const isAriaDropdown = element.getAttribute && (element.getAttribute('role') === 'listbox' || element.getAttribute('role') === 'combobox');
    if (isAriaDropdown) {
      const target = String(value || '').toLowerCase().trim();
      const doc = element.ownerDocument;
      const ownedId = element.getAttribute('aria-owns') || element.getAttribute('aria-controls');
      const container = ownedId ? doc.getElementById(ownedId) : element;
      const options = Array.from(container?.querySelectorAll('[role="option"], .goog-menuitem') || []);
      const matched = options.find((opt) => {
        const t = (opt.textContent || '').toLowerCase().trim();
        const v = (opt.getAttribute('data-value') || '').toLowerCase().trim();
        return t === target || v === target || (target.length > 2 && t.includes(target));
      });

      if (matched) {
        simulateUserClick(matched);
      } else {
        simulateUserClick(element);
        setTimeout(() => {
          const popup = doc.querySelector('[role="listbox"]:not([aria-hidden="true"]), .exportSelectPopup, [role="menu"]');
          if (popup) {
            const popupOpts = Array.from(popup.querySelectorAll('[role="option"], .goog-menuitem'));
            const match2 = popupOpts.find((opt) => {
              const t = (opt.textContent || '').toLowerCase().trim();
              const v = (opt.getAttribute('data-value') || '').toLowerCase().trim();
              return t === target || v === target || (target.length > 2 && t.includes(target));
            });
            if (match2) simulateUserClick(match2);
          }
        }, 80);
      }
      triggerHighlight(element);
      return true;
    }

    // 2. RADIO BUTTON (Native and ARIA role="radio")
    const isAriaRadio = element.getAttribute && element.getAttribute('role') === 'radio';
    if (element instanceof HTMLInputElement && element.type === 'radio') {
      const groupName = element.name;
      if (!groupName) return false;

      const radios = Array.from(element.ownerDocument.querySelectorAll(`input[type="radio"][name="${CSS.escape(groupName)}"]`));
      const target = String(value != null ? value : '').toLowerCase().trim();

      if (target === 'false' || target === '0' || target === 'no') {
        return true; // Explicit negative for this individual radio option, ignore
      }

      const setRadioChecked = (r, isChecked) => {
        try {
          const proto = window.HTMLInputElement.prototype;
          const descriptor = Object.getOwnPropertyDescriptor(proto, 'checked');
          if (descriptor && descriptor.set) {
            descriptor.set.call(r, isChecked);
          } else {
            r.checked = isChecked;
          }
        } catch {
          r.checked = isChecked;
        }
      };

      if (target === 'true' || target === 'yes' || target === '1' || target === 'on') {
        radios.forEach((r) => {
          setRadioChecked(r, r === element);
        });
        simulateUserClick(element);
        dispatchChangeEvents(element);
        triggerHighlight(element);
        return true;
      }

      let matchedRadio = radios.find((r) => {
        const v = String(r.value || '').toLowerCase().trim();
        const l = String(resolveLabelText(r) || '').toLowerCase().trim();
        return v === target || l === target;
      });

      if (!matchedRadio) {
        matchedRadio = radios.find((r) => {
          const v = String(r.value || '').toLowerCase().trim();
          const l = String(resolveLabelText(r) || '').toLowerCase().trim();
          return (target.length > 2 && (l.startsWith(target) || v.startsWith(target))) ||
                 (l.length > 2 && target.startsWith(l)) ||
                 (v.length > 2 && target.startsWith(v));
        });
      }

      if (matchedRadio) {
        radios.forEach((r) => {
          setRadioChecked(r, r === matchedRadio);
        });
        simulateUserClick(matchedRadio);
        dispatchChangeEvents(matchedRadio);
        triggerHighlight(matchedRadio);
        return true;
      }
      return false;
    } else if (isAriaRadio) {
      const target = String(value || '').toLowerCase().trim();
      if (!target) return false;

      // Group resolution: find sibling radios in the radiogroup container
      const group = element.closest('[role="radiogroup"], .geS5n, [class*="radiogroup"], fieldset');
      const radios = group ? Array.from(group.querySelectorAll('[role="radio"]')) : [element];

      if (target === 'true' || target === 'yes' || target === '1') {
        if (element.getAttribute('aria-checked') !== 'true') simulateUserClick(element);
        triggerHighlight(element);
        return true;
      }

      // Find matching radio in group by label, answer-value, or data-value
      const matched = radios.find((r) => {
        const l = (resolveLabelText(r) || '').toLowerCase().trim();
        const v = (r.getAttribute('data-answer-value') || r.getAttribute('data-value') || r.getAttribute('aria-label') || '').toLowerCase().trim();
        return l === target || v === target || (target.length > 2 && (l.includes(target) || target.includes(l) || v.includes(target)));
      });

      if (matched) {
        if (matched.getAttribute('aria-checked') !== 'true') {
          simulateUserClick(matched);
        }
        triggerHighlight(matched);
        return true;
      }
      return false;
    }

    // 3. CHECKBOX (Native and ARIA role="checkbox")
    const isAriaCheckbox = element.getAttribute && element.getAttribute('role') === 'checkbox';
    const isNativeCheckbox = element instanceof HTMLInputElement && element.type === 'checkbox';

    if (isNativeCheckbox || isAriaCheckbox) {
      const shouldCheck = isCheckboxCheckedValue(element, value);

      if (isNativeCheckbox) {
        const currentlyChecked = Boolean(element.checked);
        if (currentlyChecked !== shouldCheck) {
          // 1. Simulate real user click (clicks associated <label> or input)
          simulateUserClick(element);

          // 2. If click didn't toggle state (e.g. React controlled input where click was intercepted),
          // force value via HTMLInputElement.prototype checked descriptor and update React _valueTracker
          if (element.checked !== shouldCheck) {
            setCheckboxNativeChecked(element, shouldCheck);
            try { element.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
            try { element.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
          }
        }
        dispatchChangeEvents(element);
        triggerHighlight(element);
        return true;
      }

      if (isAriaCheckbox) {
        const currentlyChecked = element.getAttribute('aria-checked') === 'true';
        if (currentlyChecked !== shouldCheck) {
          simulateUserClick(element);
        }
        triggerHighlight(element);
        return true;
      }
    }

    // 4. CONTENTEDITABLE (Rich-text editors)
    if (element.isContentEditable || (element.getAttribute && element.getAttribute('contenteditable') === 'true')) {
      element.focus();
      element.textContent = String(value || '');
      dispatchChangeEvents(element);
      triggerHighlight(element);
      return true;
    }

    // 5. TEXT, TEXTAREA, EMAIL, TEL, DATE INPUTS (React / Vue prototype setter)
    const elTag = (element.tagName || '').toUpperCase();
    const isTextInput = elTag === 'INPUT' || elTag === 'TEXTAREA' ||
      (typeof HTMLInputElement !== 'undefined' && element instanceof HTMLInputElement) ||
      (typeof HTMLTextAreaElement !== 'undefined' && element instanceof HTMLTextAreaElement);

    if (isTextInput) {
      if (elTag === 'INPUT' && isDateInput(element)) {
        value = formatDateForElement(element, value);
      }

      if (element.maxLength && element.maxLength > 0) {
        let valStr = String(value != null ? value : '');
        const isPhoneField = element.type === 'tel' ||
          (element.autocomplete && element.autocomplete.includes('tel')) ||
          /(phone|tel|mobile|cell)/i.test(`${element.name || ''} ${element.id || ''} ${element.placeholder || ''}`);

        if (isPhoneField && valStr.length > element.maxLength) {
          const digitsOnly = valStr.replace(/\D/g, '');
          if (digitsOnly.length === 11 && digitsOnly.startsWith('1') && element.maxLength === 10) {
            valStr = digitsOnly.slice(1);
          } else if (digitsOnly.length <= element.maxLength) {
            valStr = digitsOnly;
          } else {
            valStr = digitsOnly.slice(0, element.maxLength);
          }
        } else if (valStr.length > element.maxLength) {
          valStr = valStr.slice(0, element.maxLength);
        }
        value = valStr;
      }

      const isArea = elTag === 'TEXTAREA' || (typeof HTMLTextAreaElement !== 'undefined' && element instanceof HTMLTextAreaElement);
      const win = element.ownerDocument?.defaultView || (typeof window !== 'undefined' ? window : {});
      const proto = isArea ? win.HTMLTextAreaElement?.prototype : win.HTMLInputElement?.prototype;
      const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;

      if (descriptor && descriptor.set) {
        descriptor.set.call(element, value);
      } else {
        element.value = value;
      }

      dispatchChangeEvents(element, value);
      triggerHighlight(element);

      // If element is a datepicker or calendar input, dismiss popup overlay so it does not block the form
      const isDatepicker = isDateInput(element);

      if (isDatepicker) {
        setTimeout(() => {
          try {
            const KeyboardEvt = window.KeyboardEvent || Event;
            const escInit = { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true };
            element.dispatchEvent(new KeyboardEvt('keydown', escInit));
            element.dispatchEvent(new KeyboardEvt('keyup', escInit));
            element.blur?.();

            const doc = element.ownerDocument || document;
            const popper = doc.querySelector?.('.react-datepicker-popper, .flatpickr-calendar.open');
            if (popper) {
              const body = doc.body;
              if (body) {
                const MouseEvt = window.MouseEvent || Event;
                body.dispatchEvent(new MouseEvt('mousedown', { bubbles: true }));
                body.dispatchEvent(new MouseEvt('mouseup', { bubbles: true }));
              }
            }
          } catch {}
        }, 80);
      }

      return true;
    }

    return false;
  } catch (err) {
    console.error('[FastFiller] Error setting element value:', err);
    return false;
  }
}

function simulateUserClick(element) {
  if (!element) return;
  try { element.focus(); } catch {}

  const doc = element.ownerDocument;
  const isAria = element.getAttribute && (element.getAttribute('role') === 'checkbox' || element.getAttribute('role') === 'radio');
  let target = element;

  // Only redirect target to label for native inputs (checkbox/radio/text), not for custom ARIA divs
  if (!isAria) {
    if (element.id) {
      const label = doc.querySelector(`label[for="${CSS.escape(element.id)}"]`);
      if (label) target = label;
    }
    if (target === element) {
      const parentLabel = element.closest('label');
      if (parentLabel) target = parentLabel;
    }
  }

  const defaultView = doc.defaultView || window;
  const mouseOpts = { bubbles: true, cancelable: true, view: defaultView };

  try { target.dispatchEvent(new PointerEvent('pointerdown', mouseOpts)); } catch {}
  try { target.dispatchEvent(new MouseEvent('mousedown', mouseOpts)); } catch {}
  try { target.dispatchEvent(new PointerEvent('pointerup', mouseOpts)); } catch {}
  try { target.dispatchEvent(new MouseEvent('mouseup', mouseOpts)); } catch {}

  try {
    target.click();
  } catch {
    try { target.dispatchEvent(new MouseEvent('click', mouseOpts)); } catch {}
  }

  // Fallback: if aria element didn't toggle state, click the enclosing parent/label
  if (isAria) {
    const parentContainer = element.closest('.docssharedWizToggleLabeledContainer, .enBD9d, .lLfZXe, label');
    if (parentContainer && parentContainer !== element) {
      try { parentContainer.click(); } catch {}
    }
  }

  try { element.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
  try { element.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
}

function dispatchChangeEvents(element, value) {
  const doc = element.ownerDocument || document;
  const defaultView = doc.defaultView || window;

  // 1. Focus
  try { element.dispatchEvent(new Event('focus', { bubbles: true })); } catch {}

  // 2. Synthetic InputEvent with inputType: 'insertReplacementText' for modern reactive frameworks
  let inputDispatched = false;
  if (typeof defaultView.InputEvent === 'function') {
    try {
      const inputEvt = new defaultView.InputEvent('input', {
        bubbles: true,
        cancelable: true,
        composed: true,
        inputType: 'insertReplacementText',
        data: value != null ? String(value) : (element.value || '')
      });
      element.dispatchEvent(inputEvt);
      inputDispatched = true;
    } catch {}
  }
  if (!inputDispatched) {
    try { element.dispatchEvent(new Event('input', { bubbles: true, cancelable: true, composed: true })); } catch {}
  }

  // 3. Change event
  try { element.dispatchEvent(new Event('change', { bubbles: true, cancelable: true, composed: true })); } catch {}

  // 3b. Direct onchange invocation for legacy portals (ServicePlus, JSP, ASP.NET)
  try {
    if (typeof element.onchange === 'function') {
      element.onchange.call(element, new Event('change', { bubbles: true, cancelable: true, composed: true }));
    }
  } catch {}

  // 4. Blur event to trigger touched validation and clear errors in Formik / React Hook Form / Vue
  try { element.dispatchEvent(new Event('blur', { bubbles: true, composed: true })); } catch {}
}

function triggerHighlight(element) {
  element.classList.remove('fastfiller-filled-highlight');
  // Trigger reflow to restart keyframe animation
  void element.offsetWidth;
  element.classList.add('fastfiller-filled-highlight');
  setTimeout(() => {
    try {
      element.classList.remove('fastfiller-filled-highlight');
    } catch {}
  }, 1500);
}

// ──────────────────────────────────────────
// 9. SHADOW DOM HELPER & FORM FILL / UNDO EXECUTION
// ──────────────────────────────────────────

function findTaggedElement(root, classKey, fieldMeta = null) {
  if (!root || !classKey) return null;

  const rawKey = String(classKey).trim();
  const cleanKey = rawKey.replace(/^[\[\"\']+|[\]\"\']+$/g, '');
  const dashedKey = cleanKey.replace(/_/g, '-');

  // Tier 1: Direct class query
  const escaped = CSS.escape ? CSS.escape(cleanKey) : cleanKey;
  if (root.querySelector) {
    try {
      const found = root.querySelector(`.${escaped}`);
      if (found) return found;
    } catch {}
  }

  // Tier 2: Dash-normalized class query (e.g. form_filler_0_0 -> form-filler-0-0)
  if (dashedKey !== cleanKey && root.querySelector) {
    try {
      const escapedDashed = CSS.escape ? CSS.escape(dashedKey) : dashedKey;
      const found = root.querySelector(`.${escapedDashed}`);
      if (found) return found;
    } catch {}
  }

  // Tier 3: Match by element ID (resilient against dynamic re-renders and AJAX dropdown replacement)
  const targetId = fieldMeta?.id || (!cleanKey.startsWith('form-filler-') && !cleanKey.startsWith('form_filler_') ? cleanKey : null);
  if (targetId && root.querySelector) {
    try {
      const escapedId = CSS.escape ? CSS.escape(targetId) : targetId;
      const byId = root.querySelector(`#${escapedId}`);
      if (byId) {
        if (byId.matches?.('input, select, textarea, [role="checkbox"], [role="radio"], [contenteditable="true"]')) {
          return byId;
        }
        const inner = byId.querySelector?.('input, select, textarea, [role="checkbox"], [role="radio"]');
        if (inner) return inner;
      }
    } catch {}
  }

  // Tier 4: Match by element name attribute
  const targetName = fieldMeta?.name || (!cleanKey.startsWith('form-filler-') && !cleanKey.startsWith('form_filler_') ? cleanKey : null);
  if (targetName && root.querySelector) {
    try {
      const escapedName = CSS.escape ? CSS.escape(targetName) : targetName;
      const byName = root.querySelector(`[name="${escapedName}"]`);
      if (byName) return byName;
    } catch {}
  }

  // Tier 5: Positional Frame & DOM Index Match (resilient against virtual DOM / Astro / React re-renders without IDs)
  const match = dashedKey.match(/form-filler-(\d+)-(\d+)/i);
  if (match) {
    const frameIdx = parseInt(match[1], 10);
    const inputIdx = parseInt(match[2], 10);
    if (frameIdx === 0) {
      const eligible = queryEligibleInputs(root);
      if (eligible && eligible[inputIdx]) {
        return eligible[inputIdx];
      }
    }
  }

  // Tier 6: Match by label text or placeholder
  const targetLabel = fieldMeta?.labelText || cleanKey;
  if (targetLabel && typeof targetLabel === 'string' && targetLabel.length > 1) {
    const cleanLabel = targetLabel.replace(/[*:]/g, '').trim().toLowerCase();
    const eligible = queryEligibleInputs(root);
    for (const el of eligible) {
      const elLabel = (resolveLabelText(el) || el.getAttribute?.('aria-label') || el.placeholder || '').replace(/[*:]/g, '').trim().toLowerCase();
      if (elLabel && (elLabel === cleanLabel || elLabel.includes(cleanLabel) || cleanLabel.includes(elLabel))) {
        return el;
      }
    }
  }

  // Tier 7: Recursively search inside all shadow roots
  const elements = root.querySelectorAll ? root.querySelectorAll('*') : [];
  for (const el of elements) {
    if (el.shadowRoot) {
      const shadowFound = findTaggedElement(el.shadowRoot, classKey, fieldMeta);
      if (shadowFound) return shadowFound;
    }
  }
  return null;
}

function clearHighlights(root) {
  if (!root) return;
  if (root.querySelectorAll) {
    root.querySelectorAll('.fastfiller-hover-highlight').forEach((el) => {
      el.classList.remove('fastfiller-hover-highlight');
    });
    root.querySelectorAll('*').forEach((el) => {
      if (el.shadowRoot) clearHighlights(el.shadowRoot);
    });
  }
}

let activeExecutionRunId = null;

function executeFormFill(values, doc, runId, fieldsMeta = null) {
  if (!values || typeof values !== 'object') {
    const emptyRes = {};
    emptyRes.then = (fn) => Promise.resolve(emptyRes).then(fn);
    emptyRes.catch = () => Promise.resolve(emptyRes);
    return emptyRes;
  }

  // Ensure fresh tags on live inputs before filling while preserving existing tags
  try {
    tagInputsWithClasses(doc, 0, false);
  } catch {}

  const currentRun = runId || ('run-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6));
  activeExecutionRunId = currentRun;

  const results = {};
  const currentSnapshot = {};

  // 1. Resolve all elements and preserve order
  const entries = Object.entries(values);
  const items = entries.map(([classKey, val]) => {
    const fieldMeta = fieldsMeta?.find?.((f) => f.class === classKey || f.id === classKey || f.name === classKey) || null;
    const targetEl = findTaggedElement(doc, classKey, fieldMeta);
    return { classKey, val, targetEl };
  });

  // 2. Sort items by natural DOM tree order to prevent out-of-order execution (e.g. State before City)
  items.sort((a, b) => {
    if (!a.targetEl || !b.targetEl) return 0;
    if (a.targetEl === b.targetEl) return 0;
    try {
      if (typeof a.targetEl.compareDocumentPosition === 'function') {
        const pos = a.targetEl.compareDocumentPosition(b.targetEl);
        // Node.DOCUMENT_POSITION_FOLLOWING = 4 (b follows a -> a comes before b: -1)
        if (pos & 4) return -1;
        // Node.DOCUMENT_POSITION_PRECEDING = 2 (b precedes a -> a comes after b: 1)
        if (pos & 2) return 1;
      }
    } catch {}
    return 0;
  });

  // 3. Pre-populate initial / synchronous results & snapshots so synchronous unit tests work immediately
  for (const item of items) {
    const { classKey, val, targetEl } = item;
    const fieldMeta = fieldsMeta?.find?.((f) => f.class === classKey || f.id === classKey || f.name === classKey) || null;
    const isValEmpty = val == null || String(val).trim() === '' || isNegativeDirectiveOrSkip(val);
    const isCaptcha = Boolean(
      (targetEl?.id && /captcha/i.test(targetEl.id)) ||
      (targetEl?.name && /captcha/i.test(targetEl.name)) ||
      (fieldMeta?.id && /captcha/i.test(fieldMeta.id)) ||
      (fieldMeta?.name && /captcha/i.test(fieldMeta.name)) ||
      (fieldMeta?.labelText && /captcha/i.test(fieldMeta.labelText))
    );

    if (isCaptcha) {
      results[classKey] = { success: false, isCaptcha: true, skipped: true, reason: 'Captcha protected' };
      continue;
    }

    if (isValEmpty) {
      if (fieldMeta?.required) {
        results[classKey] = { success: false, skipped: true, reason: 'Required field not in profile' };
      } else {
        results[classKey] = { success: false, skipped: true, emptyOptional: true, reason: 'Empty optional field' };
      }
      continue;
    }
    if (!targetEl) {
      results[classKey] = { success: false, error: 'Element not found' };
      continue;
    }

    const role = targetEl.getAttribute ? targetEl.getAttribute('role') : null;
    const isAriaCheckbox = role === 'checkbox';
    const isAriaRadio = role === 'radio';
    const isContentEditable = targetEl.getAttribute && targetEl.getAttribute('contenteditable') === 'true';

    // Snapshot previous state for 1-Click Undo
    const isDate = isDateInput(targetEl);
    const rsControl = !isDate ? findReactSelectControl(targetEl) : null;
    const isReactSelect = isReactSelectElement(targetEl);

    if (isReactSelect) {
      const rsCtrl = rsControl || targetEl.parentElement;
      const multiChips = rsCtrl && rsCtrl.querySelectorAll
        ? Array.from(rsCtrl.querySelectorAll('[class*="multi-value__label"], [class*="multiValue__label"]')).map((c) => c.textContent.trim()).filter(Boolean)
        : [];
      const singleValEl = rsCtrl && rsCtrl.querySelector
        ? rsCtrl.querySelector('[class*="singleValue"], [class*="single-value"]')
        : null;
      const singleVal = singleValEl ? singleValEl.textContent.trim() : '';

      const isMulti = multiChips.length > 0 || Boolean(
        rsCtrl?.querySelector?.('[class*="is-multi"], [class*="--is-multi"]') ||
        (targetEl.id && (targetEl.id.includes('subjects') || targetEl.id.includes('multi'))) ||
        (targetEl.classList && Array.from(targetEl.classList).some((c) => c.includes('multi') || c.includes('subjects')))
      );

      currentSnapshot[classKey] = {
        value: isMulti ? multiChips : singleVal,
        isReactSelect: true,
        isMulti,
        isEmpty: isMulti ? (multiChips.length === 0) : (!singleVal),
        type: 'react-select'
      };
    } else if (targetEl.tagName === 'SELECT' || (typeof HTMLSelectElement !== 'undefined' && targetEl instanceof HTMLSelectElement)) {
      currentSnapshot[classKey] = {
        value: targetEl.value,
        selectedIndex: targetEl.selectedIndex,
        type: 'select-one',
        isNativeSelect: true
      };
    } else {
      currentSnapshot[classKey] = {
        value: isContentEditable ? targetEl.textContent : targetEl.value,
        checked: (isAriaCheckbox || isAriaRadio)
          ? targetEl.getAttribute('aria-checked') === 'true'
          : Boolean(targetEl.checked),
        type: isAriaCheckbox ? 'checkbox' : isAriaRadio ? 'radio' : isContentEditable ? 'textarea' : targetEl.type,
        isAria: Boolean(isAriaCheckbox || isAriaRadio)
      };

      if (targetEl.type === 'radio' && targetEl.name && doc?.querySelectorAll) {
        const siblingRadios = doc.querySelectorAll(`input[type="radio"][name="${CSS.escape ? CSS.escape(targetEl.name) : targetEl.name}"]`);
        siblingRadios.forEach((r) => {
          const rCls = Array.from(r.classList || []).find((c) => c.startsWith(CLASS_PREFIX));
          if (rCls && rCls !== classKey) {
            currentSnapshot[rCls] = {
              checked: Boolean(r.checked),
              type: 'radio',
              isAria: false
            };
          }
        });
      }
    }

    results[classKey] = { success: true };
  }
  lastFillSnapshot = currentSnapshot;

  // 4. Sequential Async Runner: sequentially executes each field, protecting focus and waiting for async comboboxes
  const runnerPromise = (async () => {
    const pendingRetry = [];

    // Pass 1: Primary fill in natural DOM tree order (e.g. State before District)
    for (const item of items) {
      if (activeExecutionRunId !== currentRun) {
        console.log('[FastFiller] Form fill halted for invalidated run:', currentRun);
        break;
      }
      const { classKey, val, targetEl } = item;
      if (!targetEl || val == null || String(val).trim() === '' || isNegativeDirectiveOrSkip(val)) continue;

      try {
        const fieldMeta = fieldsMeta?.find?.((f) => f.class === classKey || f.id === classKey || f.name === classKey) || null;
        let elToFill = targetEl;
        if (!elToFill.isConnected) {
          elToFill = findTaggedElement(doc, classKey, fieldMeta) || targetEl;
          item.targetEl = elToFill;
        }

        const fillOutcome = setElementValueNative(elToFill, val, fieldMeta, classKey);
        const resolved = (fillOutcome && typeof fillOutcome.then === 'function')
          ? await fillOutcome
          : fillOutcome;
        results[classKey] = { success: Boolean(resolved) };
        if (!resolved && (elToFill.tagName === 'SELECT' || elToFill.getAttribute?.('role') === 'listbox')) {
          pendingRetry.push(item);
        } else if (resolved && elToFill.tagName === 'SELECT') {
          // Allow parent select change event to settle in browser event loop before downstream dependent selects
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch (err) {
        console.warn(`[FastFiller] Error filling field ${classKey}:`, err);
        results[classKey] = { success: false, error: err.message };
      }
    }

    // Pass 2 & 3: Multi-level cascade retries for nested dependent dropdowns (e.g. State -> District -> Sub-Division -> Block)
    for (let cascadePass = 0; cascadePass < 2; cascadePass++) {
      if (activeExecutionRunId !== currentRun) break;

      // Identify any select whose options may have loaded asynchronously or been wiped by a parent cascade
      const needingRetry = items.filter((item) => {
        const { classKey, targetEl, val } = item;
        if (!targetEl || !val) return false;
        const fieldMeta = fieldsMeta?.find?.((f) => f.class === classKey || f.id === classKey || f.name === classKey) || null;
        const currentEl = (!targetEl.isConnected) ? (findTaggedElement(doc, classKey, fieldMeta) || targetEl) : targetEl;
        item.targetEl = currentEl;
        if (currentEl.tagName === 'SELECT') {
          const isPlaceholder = currentEl.selectedIndex <= 0 && (!currentEl.value || currentEl.value === '0' || currentEl.value === '-1');
          return isPlaceholder;
        }
        return false;
      });

      if (needingRetry.length === 0) break;

      // Allow network roundtrip for dependent AJAX options to populate (500ms)
      await new Promise((r) => setTimeout(r, 500));

      for (const item of needingRetry) {
        if (activeExecutionRunId !== currentRun) break;
        const { classKey, val, targetEl } = item;
        const fieldMeta = fieldsMeta?.find?.((f) => f.class === classKey || f.id === classKey || f.name === classKey) || null;
        let elToFill = targetEl;
        if (!elToFill.isConnected) {
          elToFill = findTaggedElement(doc, classKey, fieldMeta) || targetEl;
          item.targetEl = elToFill;
        }
        try {
          const fillOutcome = setElementValueNative(elToFill, val, fieldMeta, classKey);
          const resolved = (fillOutcome && typeof fillOutcome.then === 'function')
            ? await fillOutcome
            : fillOutcome;
          if (resolved) {
            results[classKey] = { success: true };
            await new Promise((r) => setTimeout(r, 300));
          }
        } catch {}
      }
    }

    // Final DOM Verification: Ensure success counts strictly reflect the actual live DOM state
    for (const item of items) {
      const { classKey, val, targetEl } = item;
      const isValEmpty = val == null || String(val).trim() === '' || isNegativeDirectiveOrSkip(val);
      const fieldMeta = fieldsMeta?.find?.((f) => f.class === classKey || f.id === classKey || f.name === classKey) || null;
      const isCaptcha = Boolean(
        (targetEl?.id && /captcha/i.test(targetEl.id)) ||
        (targetEl?.name && /captcha/i.test(targetEl.name)) ||
        (fieldMeta?.id && /captcha/i.test(fieldMeta.id))
      );

      if (isCaptcha) {
        results[classKey] = { success: false, isCaptcha: true, skipped: true, reason: 'Captcha protected' };
        continue;
      }

      if (isValEmpty) {
        if (fieldMeta?.required) {
          results[classKey] = { success: false, skipped: true, reason: 'Required field not in profile' };
        } else {
          results[classKey] = { success: false, skipped: true, emptyOptional: true, reason: 'Empty optional field' };
        }
        continue;
      }

      const liveEl = (!targetEl?.isConnected) ? (findTaggedElement(doc, classKey, fieldMeta) || targetEl) : targetEl;
      item.targetEl = liveEl;

      if (liveEl && liveEl.tagName === 'SELECT') {
        const isStillEmpty = liveEl.selectedIndex <= 0 && (!liveEl.value || liveEl.value === '0' || liveEl.value === '-1');
        if (isStillEmpty) {
          results[classKey] = { success: false, reason: 'Dropdown option not populated or not matched' };
        } else {
          results[classKey] = { success: true };
        }
      }
    }

    return results;
  })();

  // Synchronously attach results keys onto the returned Promise instance for synchronous unit tests
  Object.assign(runnerPromise, results);

  return runnerPromise;
}

function executeUndo(doc) {
  if (!lastFillSnapshot || Object.keys(lastFillSnapshot).length === 0) {
    const emptyRes = { success: false, message: 'No fill history to undo.' };
    const p = Promise.resolve(emptyRes);
    Object.assign(p, emptyRes);
    return p;
  }

  let restoredCount = 0;
  const asyncReverts = [];
  // Reverse order so dependent/child fields (e.g. City) are reverted BEFORE parent fields (e.g. State)
  const entries = Object.entries(lastFillSnapshot).reverse();

  for (const [classKey, priorState] of entries) {
    try {
      const targetEl = findTaggedElement(doc, classKey);
      if (targetEl) {
        if (priorState.isAria) {
          const currentlyChecked = targetEl.getAttribute('aria-checked') === 'true';
          if (currentlyChecked !== priorState.checked) {
            simulateUserClick(targetEl);
          }
        } else if (targetEl.type === 'checkbox' || targetEl.type === 'radio') {
          const targetChecked = Boolean(priorState.checked);
          if (Boolean(targetEl.checked) !== targetChecked) {
            simulateUserClick(targetEl);
            if (Boolean(targetEl.checked) !== targetChecked) {
              setCheckboxNativeChecked(targetEl, targetChecked);
              try { targetEl.dispatchEvent(new Event('input', { bubbles: true })); } catch {}
              try { targetEl.dispatchEvent(new Event('change', { bubbles: true })); } catch {}
            }
          }
          dispatchChangeEvents(targetEl);
        } else if (targetEl.getAttribute && targetEl.getAttribute('contenteditable') === 'true') {
          targetEl.textContent = priorState.value || '';
          dispatchChangeEvents(targetEl);
        } else if (priorState.isReactSelect) {
          const rev = revertReactSelect(targetEl, priorState);
          if (rev && typeof rev.then === 'function') {
            asyncReverts.push(rev);
          }
        } else if (priorState.isNativeSelect || targetEl.tagName === 'SELECT' || (typeof HTMLSelectElement !== 'undefined' && targetEl instanceof HTMLSelectElement)) {
          if (priorState.selectedIndex != null && targetEl.options && targetEl.options[priorState.selectedIndex]) {
            targetEl.selectedIndex = priorState.selectedIndex;
            const win = doc?.defaultView || (typeof window !== 'undefined' ? window : {});
            const proto = win.HTMLSelectElement?.prototype;
            const descriptor = proto ? Object.getOwnPropertyDescriptor(proto, 'value') : null;
            if (descriptor && descriptor.set) {
              descriptor.set.call(targetEl, targetEl.options[priorState.selectedIndex].value);
            } else {
              targetEl.value = targetEl.options[priorState.selectedIndex].value;
            }
            dispatchChangeEvents(targetEl);
            triggerHighlight(targetEl);
          } else {
            setElementValueNative(targetEl, priorState.value || '');
          }
        } else {
          setElementValueNative(targetEl, priorState.value);
        }
        restoredCount++;
      }
    } catch (itemErr) {
      console.warn('[FastFiller] Field undo error for', classKey, itemErr);
    }
  }

  lastFillSnapshot = null;
  const syncResult = { success: true, restoredCount };

  if (asyncReverts.length > 0) {
    const p = (async () => {
      await Promise.all(asyncReverts);
      return syncResult;
    })();
    Object.assign(p, syncResult);
    return p;
  }

  const p = Promise.resolve(syncResult);
  Object.assign(p, syncResult);
  return p;
}

// ──────────────────────────────────────────
// 10. IFRAME & TOP-LEVEL MESSAGE COORDINATION
// ──────────────────────────────────────────

const isBrowserEnv = typeof window !== 'undefined';
const isIframe = isBrowserEnv ? (window !== window.top) : false;

function getFrameTargetOrigin(frame) {
  try {
    if (frame && frame.src && !frame.src.startsWith('about:') && !frame.src.startsWith('javascript:')) {
      return new URL(frame.src, window.location.href).origin;
    }
  } catch {}
  return window.location.origin;
}

if (isBrowserEnv && isIframe) {
  window.addEventListener('message', (event) => {
    if (event.source === window) return;
    if (event.source !== window.top) return;

    if (event.data?.type === 'FORM_FILLER_COLLECT') {
      const frameIndex = event.data.frameIndex || 1;
      tagInputsWithClasses(document, frameIndex, true);
      const inputs = collectFieldMetadata(document, frameIndex);
      let topOrigin = '*';
      try {
        if (document.referrer && !document.referrer.startsWith('about:')) {
          topOrigin = new URL(document.referrer).origin;
        }
      } catch {}
      window.top?.postMessage({ type: 'FORM_FILLER_RESPONSE', frameIndex, inputs }, topOrigin);
    } else if (event.data?.type === 'FORM_FILLER_FILL') {
      if (event.data.data) {
        executeFormFill(event.data.data, document, event.data.runId, event.data.fieldsMeta);
      }
    } else if (event.data?.type === 'FORM_FILLER_STOP_RUN') {
      if (!event.data.runId || activeExecutionRunId === event.data.runId) {
        activeExecutionRunId = null;
        clearHighlights(document);
      }
    } else if (event.data?.type === 'FORM_FILLER_UNDO') {
      executeUndo(document);
    }
  });
}

if (isBrowserEnv && !isIframe) {
  async function collectPageData() {
    tagInputsWithClasses(document, 0, true);
    const topInputs = collectFieldMetadata(document, 0);
    const result = { inputs: topInputs };

    // Broadcast to iframes
    const iframes = Array.from(document.querySelectorAll('iframe'));
    if (iframes.length > 0) {
      for (const [idx, frame] of iframes.entries()) {
        try {
          frame.contentWindow?.postMessage({ type: 'FORM_FILLER_COLLECT', frameIndex: idx + 1 }, getFrameTargetOrigin(frame));
        } catch {}
      }
    }

    return result;
  }

  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    (async () => {
      try {
        switch (msg.type) {
          case 'PING':
            sendResponse({ success: true, pong: true });
            break;

          case 'COLLECT_DATA': {
            const data = await collectPageData();
            sendResponse({
              success: true,
              inputs: data.inputs,
              pageTitle: document.title,
              domain: window.location.hostname
            });
            break;
          }

          case 'FILL_FORM': {
            if (msg.data) {
              const results = await executeFormFill(msg.data, document, msg.runId, msg.fieldsMeta);

              // Broadcast fill to child iframes
              const iframes = document.querySelectorAll('iframe');
              iframes.forEach((f, idx) => {
                try {
                  f.contentWindow?.postMessage({ type: 'FORM_FILLER_FILL', data: msg.data, runId: msg.runId, frameIndex: idx + 1, fieldsMeta: msg.fieldsMeta }, getFrameTargetOrigin(f));
                } catch {}
              });

              const filledCount = Object.values(results).filter((r) => r.success).length;
              const totalCount = Object.keys(results).length;

              sendResponse({
                success: true,
                fillResults: results,
                summary: `${filledCount}/${totalCount} fields filled`
              });
            }
            break;
          }

          case 'STOP_FILL_RUN': {
            if (!msg.runId || activeExecutionRunId === msg.runId) {
              activeExecutionRunId = null;
              clearHighlights(document);
            }
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach((f) => {
              try { f.contentWindow?.postMessage({ type: 'FORM_FILLER_STOP_RUN', runId: msg.runId }, getFrameTargetOrigin(f)); } catch {}
            });
            sendResponse({ success: true, stopped: true });
            break;
          }

          case 'UNDO_FILL': {
            const undoResult = await executeUndo(document);
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach((f) => {
              try { f.contentWindow?.postMessage({ type: 'FORM_FILLER_UNDO' }, getFrameTargetOrigin(f)); } catch {}
            });
            sendResponse(undoResult);
            break;
          }

          case 'HIGHLIGHT_FIELD': {
            ensureStylesInjected();
            clearHighlights(document);
            if (msg.classKey || msg.fieldMeta) {
              const el = findTaggedElement(document, msg.classKey, msg.fieldMeta);
              if (el) {
                el.classList.add('fastfiller-hover-highlight');
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            }
            sendResponse({ success: true });
            break;
          }

          case 'PASTE_INTO_TARGET': {
            const target = lastRightClickedElement || document.activeElement;
            if (target && (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target.isContentEditable)) {
              if (target.isContentEditable) {
                target.textContent = msg.text || '';
              } else {
                setElementValueNative(target, msg.text || '');
              }
              triggerHighlight(target);
              sendResponse({ success: true });
            } else {
              sendResponse({ success: false, error: 'No editable input focused.' });
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('[FastFiller] Message error:', err);
        sendResponse({ success: false, error: err.message || 'Unknown error' });
      }
    })();

    return true; // Keep message channel open for async response
  });
  }

  // Track element under right-click for targeted context menu pasting
  let lastRightClickedElement = null;
  document.addEventListener('contextmenu', (e) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target.isContentEditable) {
      lastRightClickedElement = e.target;
    }
  }, true);
}

if (typeof globalThis !== 'undefined') {
  const contentScriptApi = {
    tagInputsWithClasses,
    findTaggedElement,
    clearHighlights,
    normalizeDateValue,
    dispatchChangeEvents,
    setElementValueNative,
    executeFormFill,
    executeUndo,
    clearReactSelect,
    revertReactSelect,
    queryEligibleInputs,
    collectFieldMetadata,
    isElementVisible,
    findSelectOptionMatch,
    waitForSelectOptionMatch,
    stopFillRun: (runId) => {
      if (!runId || activeExecutionRunId === runId) {
        activeExecutionRunId = null;
      }
    }
  };
  globalThis.__fastFillerContentScript = contentScriptApi;
}

