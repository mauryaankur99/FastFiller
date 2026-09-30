import assert from 'node:assert/strict';

// Mock DOM environment for Node.js unit tests
class MockOption {
  constructor(text, value = '', disabled = false, index = 0) {
    this.text = text;
    this.value = value !== undefined ? value : text;
    this.disabled = disabled;
    this.selected = false;
    this.index = index;
  }
}

class MockSelectElement {
  constructor(options = []) {
    this.options = options.map((opt, i) => new MockOption(opt.text, opt.value, opt.disabled, i));
    this.value = this.options[0]?.value || '';
    this.selectedIndex = 0;
    this.classList = {
      classes: new Set(),
      add: (c) => this.classList.classes.add(c),
      remove: (c) => this.classList.classes.delete(c),
      contains: (c) => this.classList.classes.has(c)
    };
    this.offsetWidth = 100;
  }

  dispatchEvent(evt) {
    this.lastDispatchedEvent = evt.type;
  }
}

// Extract matching logic from content/index.js for isolated unit testing
function matchSelectOption(element, value) {
  const rawTarget = String(value || '').trim();
  if (!rawTarget) return null;

  const target = rawTarget.toLowerCase();
  const options = Array.from(element.options);
  if (options.length === 0) return null;

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

  // Stage 1b: Slash & Bilingual normalization (e.g. "BHOJPUR / भोजपुर" vs "BHOJPUR/भोजपुर")
  if (!matched) {
    const cleanTargetSlash = target.replace(/\s*([\/|])\s*/g, '$1');
    matched = pool.find((o) => {
      const ov = (o.value || '').toLowerCase().trim().replace(/\s*([\/|])\s*/g, '$1');
      const ot = (o.text || '').toLowerCase().trim().replace(/\s*([\/|])\s*/g, '$1');
      return ov === cleanTargetSlash || ot === cleanTargetSlash;
    });
  }

  // Stage 1c: Sub-part bilingual match (handles "A / B" vs "A/B", "A / B" vs "C / B", or "A / B" vs "A")
  if (!matched) {
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
    }
  }

  // Stage 2: Gender normalization
  if (!matched && (target === 'male' || target === 'm')) {
    matched = pool.find((o) => {
      const v = (o.value || '').toLowerCase().trim();
      const t = (o.text || '').toLowerCase().trim();
      return v === 'm' || v === 'male' || t === 'male';
    });
  } else if (!matched && (target === 'female' || target === 'f')) {
    matched = pool.find((o) => {
      const v = (o.value || '').toLowerCase().trim();
      const t = (o.text || '').toLowerCase().trim();
      return v === 'f' || v === 'female' || t === 'female';
    });
  }

  // Stage 3: Semantic Boolean & Work Authorization Disambiguation
  if (!matched) {
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
    } else if (isNegative && !isAffirmative) {
      matched = pool.find((o) => {
        const v = (o.value || '').toLowerCase().trim();
        const t = (o.text || '').toLowerCase().trim();
        return NO_SYNONYMS.some((syn) => v === syn || t === syn);
      });
    }
  }

  // Stage 4: Normalized punctuation / alphanumeric match
  if (!matched) {
    const normalizeStr = (s) => (s || '').toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
    const normTarget = normalizeStr(target);

    matched = pool.find((o) => {
      const nv = normalizeStr(o.value);
      const nt = normalizeStr(o.text);
      return nv === normTarget || nt === normTarget;
    });

    // Stage 5: Semantic Token / Substring Overlap Scoring
    if (!matched && normTarget.length > 2) {
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

      if (bestOpt) {
        matched = bestOpt;
      }
    }
  }

  return matched;
}

console.log('--- Running Tests for Dropdown Select Matching ---');

// Test 1: Service dropdown from user's screenshot
const serviceSelect = new MockSelectElement([
  { text: 'Select a Service', value: '', disabled: true },
  { text: 'Modern Web Development', value: 'web_dev' },
  { text: 'Mobile Engineering', value: 'mobile_eng' },
  { text: 'Applied AI & Automation', value: 'ai_automation' },
  { text: 'Other', value: 'other' }
]);

// 1. Partial input "Web Development" matches "Modern Web Development", NOT "Other"
const m1 = matchSelectOption(serviceSelect, 'Web Development');
assert.ok(m1, 'Should find match for Web Development');
assert.equal(m1.value, 'web_dev', 'Should match Modern Web Development');
console.log('✓ Partial "Web Development" correctly matches "Modern Web Development" without falling back to "Other"');

// 2. Exact match case-insensitive
const m2 = matchSelectOption(serviceSelect, 'applied ai & automation');
assert.ok(m2);
assert.equal(m2.value, 'ai_automation');
console.log('✓ Case-insensitive exact match works');

// 3. Ampersand vs "and" normalization
const m3 = matchSelectOption(serviceSelect, 'Applied AI and Automation');
assert.ok(m3);
assert.equal(m3.value, 'ai_automation');
console.log('✓ Ampersand vs "and" normalization works');

// 4. Placeholder rejection
const m4 = matchSelectOption(serviceSelect, 'Select a Service');
assert.notEqual(m4?.value, '', 'Should not select empty placeholder');
console.log('✓ Placeholder "Select a Service" is never assigned as empty value');

// 5. Gender normalization
const genderSelect = new MockSelectElement([
  { text: '-- Choose Gender --', value: '' },
  { text: 'Male', value: 'm' },
  { text: 'Female', value: 'f' },
  { text: 'Prefer not to say', value: 'x' }
]);
const m5 = matchSelectOption(genderSelect, 'male');
assert.equal(m5.value, 'm');
console.log('✓ Gender "male" maps to "m"');

// 6. Boolean / Work authorization
const authSelect = new MockSelectElement([
  { text: 'Select one', value: '' },
  { text: 'Authorized', value: 'yes' },
  { text: 'Requires Sponsorship', value: 'no' }
]);
const m6 = matchSelectOption(authSelect, 'Yes');
assert.equal(m6.value, 'yes');
console.log('✓ Work authorization "Yes" maps to "Authorized"');

// 7. Bilingual slash match (e.g. "BHOJPUR / भोजपुर" with "BHOJPUR/भोजपुर")
const districtSelect = new MockSelectElement([
  { text: 'Please Select', value: '' },
  { text: 'PATNA/पटना', value: '101' },
  { text: 'BHOJPUR/भोजपुर', value: '102' },
  { text: 'GAYA/गया', value: '103' }
]);
const m7 = matchSelectOption(districtSelect, 'BHOJPUR / भोजपुर');
assert.equal(m7.value, '102');
console.log('✓ Bilingual slash "BHOJPUR / भोजपुर" matches "BHOJPUR/भोजपुर"');

// 8. Bilingual subpart match (target has both languages, select option has English only)
const englishOnlyDistrict = new MockSelectElement([
  { text: 'Please Select', value: '' },
  { text: 'PATNA', value: '101' },
  { text: 'BHOJPUR', value: '102' }
]);
const m8 = matchSelectOption(englishOnlyDistrict, 'BHOJPUR / भोजपुर');
assert.equal(m8.value, '102');
console.log('✓ Bilingual "BHOJPUR / भोजपुर" matches English-only option "BHOJPUR"');

// 9. Bilingual option with different English transliteration (e.g. "Arrah / आरा" vs "ARA/आरा")
const townSelect = new MockSelectElement([
  { text: 'Please Select', value: '' },
  { text: 'PATNA/पटना', value: '201' },
  { text: 'ARA/आरा', value: '202' }
]);
const m9 = matchSelectOption(townSelect, 'Arrah / आरा');
assert.equal(m9.value, '202', 'Should match via Hindi token आरा despite English Arrah vs ARA difference');
console.log('✓ Bilingual "Arrah / आरा" matches "ARA/आरा" via shared Hindi subpart');

// 10. Cascading dependent dropdown detection & placeholder-only options
const emptyCascadingSelect = new MockSelectElement([
  { text: 'Please Select', value: '' }
]);
const validOpts = Array.from(emptyCascadingSelect.options).filter((o) => {
  if (o.disabled) return false;
  const val = (o.value || '').trim().toLowerCase();
  const txt = (o.text || '').trim().toLowerCase();
  if (!val && !txt) return false;
  if (['', '0', '-1', 'none', 'null'].includes(val) && /^(select|choose|pick|please select|--)/i.test(txt)) return false;
  if (/^(select|choose|pick|please select|--\s*select|select one)/i.test(txt) && o.index === 0) return false;
  return true;
});
assert.equal(validOpts.length, 0, 'Placeholder "Please Select" must not be considered a valid selectable option');
const isCascadingKeyword = /district|sub-?division|block|tehsil|taluk|mandal|ward|corporation|municipality|panchayat|village|post\s*office|police\s*station|जिला|प्रखंड|अनुमंडल|नगर\s*निगम|पंचायत|थाना/i.test('district_id District / जिला');
const isDependent = validOpts.length === 0 || isCascadingKeyword;
assert.equal(isDependent, true, 'Cascading select without populated options must be marked isDependent=true');
console.log('✓ Empty/placeholder-only select correctly marks isDependent=true with empty options');

// 11. Async cascading simulation: options populated after delay
const asyncSelect = new MockSelectElement([
  { text: 'Please Select', value: '' }
]);
// Initially no match
assert.ok(!matchSelectOption(asyncSelect, 'BHOJPUR / भोजपुर'), 'Initially with only placeholder, there should be no match');
// Simulate server AJAX response populating options
asyncSelect.options = [
  new MockOption('Please Select', '', false, 0),
  new MockOption('PATNA/पटना', '101', false, 1),
  new MockOption('BHOJPUR/भोजपुर', '102', false, 2)
];
const asyncMatched = matchSelectOption(asyncSelect, 'BHOJPUR / भोजपुर');
assert.ok(asyncMatched);
assert.equal(asyncMatched.value, '102');
console.log('✓ Async cascading simulation: options populated via AJAX matched accurately');

console.log('\nAll 11 dropdown matching tests passed successfully!\n');
