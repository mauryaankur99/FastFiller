import assert from 'node:assert/strict';
import {
  PROVIDERS_REGISTRY,
  CUSTOM_PROVIDER_PRESETS,
  DEFAULT_SYSTEM_PROMPT,
  SYSTEM_PROMPT_PRESETS,
  buildMessages,
  parseAIResponse,
  repairTruncatedJSON,
  resolveDynamicTemplateVariables,
  prioritizeInputs,
  chunkInputs,
  fetchProviderModels,
  FALLBACK_MODELS_BY_PROVIDER,
  normalizeAIValuesToCanonicalFields,
  isNegativeDirectiveOrSkip,
  isFakeDataRequested,
  generateSyntheticFieldValue
} from '../src/popup/api-providers.js';

console.log('--- Running Tests for api-providers.js ---');

// Test 1: parseAIResponse with pure JSON
{
  const input = '{"form-filler-0-0": "Alex Morgan", "form-filler-0-1": "alex@example.com"}';
  const res = parseAIResponse(input);
  assert.equal(res['form-filler-0-0'], 'Alex Morgan');
  assert.equal(res['form-filler-0-1'], 'alex@example.com');
  console.log('✓ parseAIResponse: pure JSON');
}

// Test 2: parseAIResponse with <think> reasoning tags
{
  const input = `<think>
I need to map the user's name and email to the fields.
Field form-filler-0-0 is name.
Field form-filler-0-1 is email.
</think>
{"form-filler-0-0": "Alex Morgan", "form-filler-0-1": "alex@example.com"}`;
  const res = parseAIResponse(input);
  assert.equal(res['form-filler-0-0'], 'Alex Morgan');
  assert.equal(res['form-filler-0-1'], 'alex@example.com');
  console.log('✓ parseAIResponse: strips <think> reasoning tags');
}

// Test 3: parseAIResponse with markdown code blocks
{
  const input = '```json\n{"form-filler-0-0": "Alex Morgan"}\n```';
  const res = parseAIResponse(input);
  assert.equal(res['form-filler-0-0'], 'Alex Morgan');
  console.log('✓ parseAIResponse: handles markdown code block');
}

// Test 4: parseAIResponse with preambles and trailing commas
{
  const input = 'Here is the JSON you requested:\n{\n  "form-filler-0-0": "Alex Morgan",\n  "form-filler-0-1": "alex@example.com",\n}\nHope this helps!';
  const res = parseAIResponse(input);
  assert.equal(res['form-filler-0-0'], 'Alex Morgan');
  assert.equal(res['form-filler-0-1'], 'alex@example.com');
  console.log('✓ parseAIResponse: extracts outermost braces and handles trailing comma');
}

// Test 5: parseAIResponse with empty or invalid input throws
{
  assert.throws(() => parseAIResponse(''), /Empty response/);
  assert.throws(() => parseAIResponse('Sorry, I cannot do that'), /invalid JSON structure/);
  console.log('✓ parseAIResponse: handles invalid and empty inputs gracefully');
}

// Test 6: buildMessages filtering
{
  const inputs = [
    { class: 'form-filler-0-0', type: 'text', labelText: 'Full Name', isVisible: true },
    { class: 'form-filler-0-1', type: 'text', labelText: 'Hidden Field', isVisible: false },
    { class: 'form-filler-0-2', type: 'text', labelText: 'Disabled Field', isVisible: true, disabled: true },
    { class: 'form-filler-0-3', type: 'select', labelText: 'Country', isVisible: true, options: ['US', 'CA', 'UK'] }
  ];

  const messages = buildMessages('You are a form filler.', 'Name: Alex', inputs);
  assert.equal(messages.length, 2);
  assert.equal(messages[0].role, 'system');
  assert.equal(messages[1].role, 'user');
  assert.ok(messages[1].content.includes('Full Name'));
  assert.ok(messages[1].content.includes('Country'));
  assert.ok(!messages[1].content.includes('Hidden Field'));
  assert.ok(!messages[1].content.includes('Disabled Field'));
  console.log('✓ buildMessages: correctly filters invisible and disabled fields');
}

// Test 7: PROVIDERS_REGISTRY integrity & CUSTOM_PROVIDER_PRESETS
{
  const expectedProviders = ['chatgpt_web', 'custom'];
  for (const p of expectedProviders) {
    assert.ok(PROVIDERS_REGISTRY[p], `Provider ${p} missing in registry`);
    assert.ok(PROVIDERS_REGISTRY[p].name, `Provider ${p} missing name`);
    assert.ok(PROVIDERS_REGISTRY[p].format, `Provider ${p} missing format`);
  }
  assert.equal(Object.keys(PROVIDERS_REGISTRY).length, 2);

  const presetIds = CUSTOM_PROVIDER_PRESETS.map((x) => x.id);
  assert.ok(presetIds.includes('groq'));
  assert.ok(presetIds.includes('openai'));
  assert.ok(presetIds.includes('gemini'));
  assert.ok(presetIds.includes('anthropic'));
  assert.ok(presetIds.includes('deepseek'));
  assert.ok(presetIds.includes('nvidia'));
  assert.ok(presetIds.includes('meta'));
  assert.ok(presetIds.includes('openrouter'));
  assert.ok(presetIds.includes('ollama'));
  assert.ok(presetIds.includes('opencode'));
  assert.equal(presetIds.length, 10);
  console.log(`✓ PROVIDERS_REGISTRY: 2 streamlined providers + 10 quick presets registered`);
}

// Test 8: Single Default System Prompt Strategy
{
  assert.ok(DEFAULT_SYSTEM_PROMPT.length > 50);
  assert.equal(SYSTEM_PROMPT_PRESETS.default, DEFAULT_SYSTEM_PROMPT);
  console.log('✓ DEFAULT_SYSTEM_PROMPT: verified baseline system prompt');
}

// Test 9: buildMessages compact schema, sectionHeader, and pageContext
{
  const inputs = [
    { class: 'form-filler-0-0', type: 'text', labelText: 'City', sectionHeader: 'Shipping Address', isVisible: true },
    { class: 'form-filler-0-1', type: 'text', labelText: 'City', sectionHeader: 'Billing Address', isVisible: true }
  ];
  const pageContext = { domain: 'checkout.stripe.com', pageTitle: 'Order Confirmation' };
  const messages = buildMessages('You are a form filler.', 'City: Seattle', inputs, pageContext);
  assert.ok(messages[1].content.includes('Domain: checkout.stripe.com'));
  assert.ok(messages[1].content.includes('section="Shipping Address"'));
  assert.ok(messages[1].content.includes('section="Billing Address"'));
  console.log('✓ buildMessages: preserves section headers and domain context in compact format');
}

// Test 10: repairTruncatedJSON handles cut-off values, keys, and unbalanced quotes/braces
{
  const truncatedVal = '{"form-filler-0-0": "Alex Morgan", "form-filler-0-1": "alex@example';
  const repairedVal = JSON.parse(repairTruncatedJSON(truncatedVal));
  assert.equal(repairedVal['form-filler-0-0'], 'Alex Morgan');

  const truncatedKey = '{"form-filler-0-0": "Alex", "form-filler-0-';
  const repairedKey = JSON.parse(repairTruncatedJSON(truncatedKey));
  assert.equal(repairedKey['form-filler-0-0'], 'Alex');

  const trailingColon = '{"form-filler-0-0": "Alex", "form-filler-0-1":';
  const repairedColon = JSON.parse(repairTruncatedJSON(trailingColon));
  assert.equal(repairedColon['form-filler-0-0'], 'Alex');

  const trailingComma = '{"form-filler-0-0": "Alex",';
  const repairedComma = JSON.parse(repairTruncatedJSON(trailingComma));
  assert.equal(repairedComma['form-filler-0-0'], 'Alex');

  assert.equal(repairTruncatedJSON(''), '{}');
  assert.equal(repairTruncatedJSON(null), '{}');
  console.log('✓ repairTruncatedJSON: recovers truncated JSON with cut-off values and keys');
}

// Test 11: parseAIResponse utilizes repairTruncatedJSON on incomplete streams
{
  const cutOffStream = '{"form-filler-0-0": "Alex Morgan", "form-filler-0-1": "ale';
  const res = parseAIResponse(cutOffStream);
  assert.equal(res['form-filler-0-0'], 'Alex Morgan');
  console.log('✓ parseAIResponse: auto-recovers cut-off JSON stream without throwing');
}

// Test 12: resolveDynamicTemplateVariables replaces dynamic dates and time tokens
{
  const template = 'Date: {{today}}, Tomorrow: {{tomorrow}}, Next: {{in_2_weeks}}, Year: {{year}}, Month: {{month}}, US: {{today_us}}';
  const resolved = resolveDynamicTemplateVariables(template);
  const now = new Date();
  const yyyy = String(now.getFullYear());
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');

  assert.ok(resolved.includes(`Date: ${yyyy}-${mm}-${dd}`));
  assert.ok(resolved.includes(`Year: ${yyyy}`));
  assert.ok(resolved.includes(`Month: ${mm}`));
  assert.ok(resolved.includes(`US: ${mm}/${dd}/${yyyy}`));
  assert.ok(!resolved.includes('{{today}}'));
  console.log('✓ resolveDynamicTemplateVariables: correctly resolves dynamic date tokens');
}

// Test 13: DeepSeek custom provider preset verification
{
  const deepseek = CUSTOM_PROVIDER_PRESETS.find(p => p.id === 'deepseek');
  assert.ok(deepseek, 'DeepSeek preset not found');
  assert.equal(deepseek.defaultModel || deepseek.model, 'deepseek-chat');
  assert.ok(deepseek.endpoint.includes('deepseek.com'));
  console.log('✓ CUSTOM_PROVIDER_PRESETS: DeepSeek preset configured correctly');
}

// Test 14: chatgpt_web zero-key provider registry configuration
{
  const chatgptWeb = PROVIDERS_REGISTRY['chatgpt_web'];
  assert.ok(chatgptWeb, 'chatgpt_web provider missing from registry');
  assert.equal(chatgptWeb.format, 'web_session');
  assert.equal(chatgptWeb.requiresKey, false);
  assert.ok(chatgptWeb.models.length > 0);
  console.log('✓ PROVIDERS_REGISTRY: chatgpt_web zero-key web session provider configured');
}

// Test 15: parseAIResponse parses typical conversational ChatGPT Web responses
{
  const webOutput = `Certainly! Here is the JSON mapped for your form:
\`\`\`json
{
  "form-filler-0-0": "Alex Morgan",
  "form-filler-0-1": "alex.morgan@example.com",
  "form-filler-0-2": "Web development"
}
\`\`\`
Let me know if you need any adjustments!`;

  const parsed = parseAIResponse(webOutput);
  assert.equal(parsed['form-filler-0-0'], 'Alex Morgan');
  assert.equal(parsed['form-filler-0-1'], 'alex.morgan@example.com');
  assert.equal(parsed['form-filler-0-2'], 'Web development');
  console.log('✓ parseAIResponse: successfully extracts raw JSON from conversational ChatGPT Web outputs');
}

// Test 16: Gemini custom provider preset verification
{
  const gemini = CUSTOM_PROVIDER_PRESETS.find(p => p.id === 'gemini');
  assert.ok(gemini, 'Gemini preset not found');
  assert.equal(gemini.defaultModel, 'gemini-3.5-flash-lite');
  assert.ok(gemini.endpoint.includes('generativelanguage.googleapis.com'));
  assert.ok(gemini.keyUrl.includes('aistudio.google.com'));
  console.log('✓ CUSTOM_PROVIDER_PRESETS: Gemini preset configured correctly');
}

// Test 17: Anthropic custom provider preset verification
{
  const anthropic = CUSTOM_PROVIDER_PRESETS.find(p => p.id === 'anthropic');
  assert.ok(anthropic, 'Anthropic preset not found');
  assert.equal(anthropic.defaultModel, 'claude-3-5-sonnet-latest');
  assert.equal(anthropic.format, 'anthropic');
  assert.ok(anthropic.endpoint.includes('api.anthropic.com'));
  assert.ok(anthropic.keyUrl.includes('console.anthropic.com'));
  console.log('✓ CUSTOM_PROVIDER_PRESETS: Anthropic preset configured correctly');
}

// Test 18: Meta (Llama 3.3) custom provider preset verification
{
  const meta = CUSTOM_PROVIDER_PRESETS.find(p => p.id === 'meta');
  assert.ok(meta, 'Meta preset not found');
  assert.ok(meta.defaultModel.includes('Llama-3.3'));
  assert.ok(meta.endpoint.includes('together.xyz'));
  assert.ok(meta.keyUrl.includes('together.xyz'));
  console.log('✓ CUSTOM_PROVIDER_PRESETS: Meta Llama preset configured correctly');
}

// Test 19: NVIDIA NIM custom provider preset verification
{
  const nvidia = CUSTOM_PROVIDER_PRESETS.find(p => p.id === 'nvidia');
  assert.ok(nvidia, 'NVIDIA preset not found');
  assert.ok(nvidia.defaultModel.includes('llama-3.3'));
  assert.ok(nvidia.endpoint.includes('integrate.api.nvidia.com'));
  assert.ok(nvidia.keyUrl.includes('build.nvidia.com'));
  console.log('✓ CUSTOM_PROVIDER_PRESETS: NVIDIA preset configured correctly');
}

// Test 20: prioritizeInputs correctly ranks active form > viewport > required > remaining
{
  const inputs = [
    { class: 'f-normal', name: 'hobby', inViewport: false, inActiveForm: false, required: false },
    { class: 'f-required', name: 'age', inViewport: false, inActiveForm: false, required: true },
    { class: 'f-viewport', name: 'email', inViewport: true, inActiveForm: false, required: false },
    { class: 'f-active-form', name: 'fullname', inViewport: false, inActiveForm: true, required: false },
    { class: 'f-super-active', name: 'phone', inViewport: true, inActiveForm: true, required: true }
  ];

  const sorted = prioritizeInputs(inputs);
  assert.equal(sorted[0].class, 'f-super-active', 'Highest priority should be active form + viewport + required');
  assert.equal(sorted[1].class, 'f-active-form', 'Active form should precede viewport only');
  assert.equal(sorted[2].class, 'f-viewport', 'Viewport should precede required only');
  assert.equal(sorted[3].class, 'f-required', 'Required should precede normal');
  assert.equal(sorted[4].class, 'f-normal', 'Normal non-viewport non-active should be last');
  console.log('✓ prioritizeInputs: correctly ranks active form > viewport > required > remaining');
}

// Test 21: chunkInputs splits massive forms without loss
{
  const massiveInputs = Array.from({ length: 100 }, (_, i) => ({ class: `f-${i}`, name: `field_${i}` }));
  const chunks = chunkInputs(massiveInputs, 45);

  assert.equal(chunks.length, 3, '100 inputs should chunk into 3 batches (45, 45, 10)');
  assert.equal(chunks[0].length, 45);
  assert.equal(chunks[1].length, 45);
  assert.equal(chunks[2].length, 10);
  assert.equal(chunks.flat().length, 100, 'All 100 inputs preserved across chunks');
  console.log('✓ chunkInputs: splits massive 100-input forms into manageable batches without data loss');
}

// Test 22: FALLBACK_MODELS_BY_PROVIDER covers all major providers with valid models
{
  const expectedProviders = ['groq', 'openrouter', 'gemini', 'openai', 'anthropic', 'deepseek', 'nvidia', 'meta', 'ollama'];
  for (const p of expectedProviders) {
    assert.ok(Array.isArray(FALLBACK_MODELS_BY_PROVIDER[p]), `Missing fallback models for provider ${p}`);
    assert.ok(FALLBACK_MODELS_BY_PROVIDER[p].length > 0, `Fallback models empty for provider ${p}`);
    for (const m of FALLBACK_MODELS_BY_PROVIDER[p]) {
      assert.ok(m.id, `Model missing id in provider ${p}`);
      assert.ok(typeof m.isFree === 'boolean', `Model missing isFree boolean in provider ${p}`);
    }
  }
  console.log('✓ FALLBACK_MODELS_BY_PROVIDER: all 9 major providers configured with rich fallback models');
}

// Test 23: fetchProviderModels graceful fallback on network failure
{
  // When fetch throws (e.g. no internet or mock), it gracefully returns fallback models
  const origFetch = globalThis.fetch;
  globalThis.fetch = async () => { throw new Error('Offline network error'); };

  const models = await fetchProviderModels('groq', { apiKey: 'test-key' });
  assert.ok(Array.isArray(models));
  assert.ok(models.length >= 4);
  assert.ok(models.some(m => m.id === 'llama-3.3-70b-versatile'));
  assert.ok(models.every(m => m.isFree === true));
  console.log('✓ fetchProviderModels: falls back smoothly to curated models on network failure');

  globalThis.fetch = origFetch;
}

// Test 24: fetchProviderModels accurately identifies free models from OpenRouter and Ollama
{
  const origFetch = globalThis.fetch;
  // Mock OpenRouter response
  globalThis.fetch = async (url) => {
    if (url.includes('openrouter.ai')) {
      return {
        ok: true,
        json: async () => ({
          data: [
            { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Llama 3.3 Free', pricing: { prompt: '0', completion: '0' } },
            { id: 'openai/gpt-4o', name: 'GPT-4o', pricing: { prompt: '0.000005', completion: '0.000015' } }
          ]
        })
      };
    }
    if (url.includes('11434')) {
      return {
        ok: true,
        json: async () => ({
          models: [
            { name: 'llama3.2:latest', size: 2000000000 }
          ]
        })
      };
    }
    throw new Error('Unknown URL');
  };

  const orModels = await fetchProviderModels('openrouter', {});
  assert.equal(orModels.length, 2);
  assert.equal(orModels[0].id, 'meta-llama/llama-3.3-70b-instruct:free');
  assert.equal(orModels[0].isFree, true);
  assert.equal(orModels[1].id, 'openai/gpt-4o');
  assert.equal(orModels[1].isFree, false);

  const ollamaModels = await fetchProviderModels('ollama', { endpoint: 'http://localhost:11434/v1/chat/completions' });
  assert.equal(ollamaModels.length, 1);
  assert.equal(ollamaModels[0].id, 'llama3.2:latest');
  assert.equal(ollamaModels[0].isFree, true);

  console.log('✓ fetchProviderModels: parses dynamic models and accurately flags [FREE] tiers');

  globalThis.fetch = origFetch;
}

// Test 25: Custom BYOK mode has no hardcoded models or fallbacks and strictly requires endpoint
{
  assert.equal(FALLBACK_MODELS_BY_PROVIDER['custom'], undefined, 'Custom provider must not have hardcoded fallback models');
  assert.deepEqual(PROVIDERS_REGISTRY['custom'].models, [], 'Custom registry models must be empty array');
  assert.equal(PROVIDERS_REGISTRY['custom'].defaultModel, '', 'Custom defaultModel must be empty string');

  // fetchProviderModels with empty endpoint must fail immediately without fallbacks
  await assert.rejects(
    async () => {
      await fetchProviderModels('custom', { endpoint: '' }, true);
    },
    (err) => err.message.includes('Endpoint URL is required'),
    'fetchProviderModels must throw when endpoint is empty'
  );

  console.log('✓ Custom BYOK: verified no hardcoded models or fallbacks exist in registry/fallbacks');
}

// Test 26: normalizeAIValuesToCanonicalFields stops false-positive mapping of Type of Residence to Application Ref. No.
{
  const userText = `
**Applicant Details**
Gender: Male / पुरुष
Type of Residence: Permanent / स्थायी
`;
  const detectedFields = [
    { class: 'form-filler-0-1', labelText: 'आवेदन क्रमांक संख्या / Application Ref. No. of Caste/Income/Residence', name: 'applRefNo', id: 'applRefNo' },
    { class: 'form-filler-0-2', labelText: 'निवास का प्रकार / Type of Residence', name: 'residenceType', id: 'residenceType' }
  ];

  const rawValues = {};
  const normalized = normalizeAIValuesToCanonicalFields(rawValues, detectedFields, userText);

  assert.equal(normalized['form-filler-0-1'], undefined, 'Application Ref. No. must NOT receive Type of Residence');
  assert.equal(normalized['form-filler-0-2'], 'Permanent / स्थायी', 'Type of Residence must correctly map to residence field');
  console.log('✓ normalizeAIValuesToCanonicalFields: prevents false positive mapping of Type of Residence to Application Ref No');
}

// Test 27: normalizeAIValuesToCanonicalFields blocks captchas and temporary mirror fields
{
  const userText = `
Name of Applicant: Ankur Maurya / अंकुर मौर्य
`;
  const detectedFields = [
    { class: 'form-filler-0-10', labelText: 'Name of Applicant', id: 'applicantName', name: 'applicantName' },
    { class: 'form-filler-0-11', labelText: 'Name of Applicant Temp', id: 'applicantNameTemp', name: 'applicantNameTemp' },
    { class: 'form-filler-0-12', labelText: 'Enter Captcha', id: 'captchaAnswer', name: 'captchaAnswer' },
    { class: 'form-filler-0-13', labelText: '56925_txt', id: '56925_txt', name: '56925_txt' }
  ];

  const rawValues = {};
  const normalized = normalizeAIValuesToCanonicalFields(rawValues, detectedFields, userText);

  assert.equal(normalized['form-filler-0-10'], 'Ankur Maurya / अंकुर मौर्य');
  assert.equal(normalized['form-filler-0-11'], undefined, 'Temporary mirror fields must be excluded from auto-mapping');
  assert.equal(normalized['form-filler-0-12'], undefined, 'Captcha fields must be excluded from auto-mapping');
  assert.equal(normalized['form-filler-0-13'], undefined, 'ServicePlus dynamic captcha inputs must be excluded from auto-mapping');
  console.log('✓ normalizeAIValuesToCanonicalFields: blocks captchas and temp mirror fields');
}

// Test 28: buildMessages excludes captchas and temp mirror fields from serialization
{
  const inputs = [
    { class: 'form-filler-0-1', type: 'text', labelText: 'Full Name', isVisible: true },
    { class: 'form-filler-0-2', type: 'text', labelText: 'Enter Captcha', id: 'captchaAnswer', isVisible: true },
    { class: 'form-filler-0-3', type: 'text', labelText: 'Name Temp', id: 'nameTemp', isVisible: true },
    { class: 'form-filler-0-4', type: 'text', labelText: 'Captcha Image Input', name: '56925_txt', isVisible: true }
  ];

  const messages = buildMessages(DEFAULT_SYSTEM_PROMPT, 'Name: Alex', inputs);
  assert.ok(messages[1].content.includes('Full Name'));
  assert.ok(!messages[1].content.includes('captchaAnswer'));
  assert.ok(!messages[1].content.includes('Enter Captcha'));
  assert.ok(!messages[1].content.includes('nameTemp'));
  assert.ok(!messages[1].content.includes('56925_txt'));
  console.log('✓ buildMessages: excludes captchas and temp mirror fields from AI prompt serialization');
}

// Test 29: isNegativeDirectiveOrSkip identifies filler directives while allowing legitimate values like N/A, None, Not Applicable
{
  // Explicit filler directives -> true (must leave blank and never inject)
  assert.equal(isNegativeDirectiveOrSkip('dont fill this'), true);
  assert.equal(isNegativeDirectiveOrSkip("don't fill this"), true);
  assert.equal(isNegativeDirectiveOrSkip('Do Not Fill'), true);
  assert.equal(isNegativeDirectiveOrSkip('leave blank'), true);
  assert.equal(isNegativeDirectiveOrSkip('leave empty'), true);
  assert.equal(isNegativeDirectiveOrSkip('keep blank'), true);
  assert.equal(isNegativeDirectiveOrSkip('skip'), true);
  assert.equal(isNegativeDirectiveOrSkip('skip this'), true);
  assert.equal(isNegativeDirectiveOrSkip('ignore this'), true);
  assert.equal(isNegativeDirectiveOrSkip('मत भरना'), true);
  assert.equal(isNegativeDirectiveOrSkip('खाली छोड़ें'), true);
  assert.equal(isNegativeDirectiveOrSkip('खाली रखो'), true);
  assert.equal(isNegativeDirectiveOrSkip('छोड़ दो'), true);
  assert.equal(isNegativeDirectiveOrSkip(''), true);
  assert.equal(isNegativeDirectiveOrSkip(null), true);
  assert.equal(isNegativeDirectiveOrSkip(undefined), true);

  // Legitimate form values -> false (allowed to be filled or selected as user requested)
  assert.equal(isNegativeDirectiveOrSkip('N/A'), false, '"N/A" is a legitimate entry in forms');
  assert.equal(isNegativeDirectiveOrSkip('n/a'), false);
  assert.equal(isNegativeDirectiveOrSkip('Not Applicable'), false, '"Not Applicable" is a valid form entry/option');
  assert.equal(isNegativeDirectiveOrSkip('Not Applicable / लागू नहीं'), false);
  assert.equal(isNegativeDirectiveOrSkip('None'), false, '"None" is a valid option in forms');
  assert.equal(isNegativeDirectiveOrSkip('No'), false, '"No" is a valid boolean/radio answer');
  assert.equal(isNegativeDirectiveOrSkip('Yes'), false);
  assert.equal(isNegativeDirectiveOrSkip('Rajesh Kumar'), false);
  assert.equal(isNegativeDirectiveOrSkip('Permanent / स्थायी'), false);
  assert.equal(isNegativeDirectiveOrSkip('Male / पुरुष'), false);
  assert.equal(isNegativeDirectiveOrSkip(false), false, 'boolean false is a valid checkbox/radio value');
  assert.equal(isNegativeDirectiveOrSkip(true), false);
  console.log('✓ isNegativeDirectiveOrSkip: correctly distinguishes filler directives from legitimate N/A and Not Applicable values');
}

// Test 30: normalizeAIValuesToCanonicalFields drops negative directives from raw AI output and purges from userText safety-net
{
  const userText = `
**Applicant Details**
Name of Applicant: Ankur Maurya / अंकुर मौर्य
Name of Father: Rajesh Kumar
Name of Husband: dont fill this
Mobile No: 9876543210
`;
  const detectedFields = [
    { class: 'form-filler-0-1', labelText: 'Name of Applicant', id: 'applName', name: 'applName' },
    { class: 'form-filler-0-2', labelText: 'Name of Husband', id: 'husbandName', name: 'husbandName' },
    { class: 'form-filler-0-3', labelText: 'Name of Father', id: 'fatherName', name: 'fatherName' },
    { class: 'form-filler-0-4', labelText: 'Mobile No', id: 'mobileNo', name: 'mobileNo' }
  ];

  // Case A: AI hallucinated and echoed "dont fill this" into the raw output
  const rawValuesWithDirective = {
    'form-filler-0-1': 'Ankur Maurya / अंकुर मौर्य',
    'form-filler-0-2': 'dont fill this'
  };
  const normalizedA = normalizeAIValuesToCanonicalFields(rawValuesWithDirective, detectedFields, userText);

  assert.equal(normalizedA['form-filler-0-1'], 'Ankur Maurya / अंकुर मौर्य');
  assert.equal(normalizedA['form-filler-0-2'], undefined, 'Field with "dont fill this" must be completely purged');
  assert.equal(normalizedA['form-filler-0-3'], 'Rajesh Kumar', 'Safety-net fills missing father name');
  assert.equal(normalizedA['form-filler-0-4'], '9876543210', 'Safety-net fills missing mobile');

  // Case B: Raw output omitted the field, userText specifies "dont fill this"
  const rawValuesEmpty = {};
  const normalizedB = normalizeAIValuesToCanonicalFields(rawValuesEmpty, detectedFields, userText);

  assert.equal(normalizedB['form-filler-0-1'], 'Ankur Maurya / अंकुर मौर्य');
  assert.equal(normalizedB['form-filler-0-2'], undefined, 'Safety-net must NEVER populate field with "dont fill this"');
  assert.equal(normalizedB['form-filler-0-3'], 'Rajesh Kumar');
  assert.equal(normalizedB['form-filler-0-4'], '9876543210');
  console.log('✓ normalizeAIValuesToCanonicalFields: purges and blocks "dont fill this" directives');
}

// Test 31: normalizeAIValuesToCanonicalFields allows legitimate "N/A" and "Not Applicable" entries
{
  const userText = `
Name of Applicant: Ankur Maurya
Middle Name: N/A
Previous Employer: Not Applicable / लागू नहीं
Name of Father: Rajesh Kumar
`;
  const detectedFields = [
    { class: 'form-filler-0-1', labelText: 'Name of Applicant', id: 'applName', name: 'applName' },
    { class: 'form-filler-0-2', labelText: 'Middle Name', id: 'middleName', name: 'middleName' },
    { class: 'form-filler-0-3', labelText: 'Previous Employer', id: 'prevEmp', name: 'prevEmp' },
    { class: 'form-filler-0-4', labelText: 'Name of Father', id: 'fatherName', name: 'fatherName' }
  ];

  const rawValues = {
    'form-filler-0-1': 'Ankur Maurya',
    'form-filler-0-2': 'N/A',
    'form-filler-0-3': 'Not Applicable / लागू नहीं'
  };
  const normalized = normalizeAIValuesToCanonicalFields(rawValues, detectedFields, userText);

  assert.equal(normalized['form-filler-0-1'], 'Ankur Maurya');
  assert.equal(normalized['form-filler-0-2'], 'N/A', 'Legitimate N/A value must be preserved');
  assert.equal(normalized['form-filler-0-3'], 'Not Applicable / लागू नहीं', 'Legitimate Not Applicable value must be preserved');
  assert.equal(normalized['form-filler-0-4'], 'Rajesh Kumar');
  console.log('✓ normalizeAIValuesToCanonicalFields: preserves legitimate N/A and Not Applicable values');
}

// Test 32: buildMessages correctly handles cascading dependent dropdowns
{
  const inputs = [
    { class: 'form-filler-0-12', labelText: 'State / राज्य', type: 'select-one', required: true, options: ['BIHAR'] },
    { class: 'form-filler-0-13', labelText: 'District / जिला', type: 'select-one', required: true, isDependent: true, options: [] },
    { class: 'form-filler-0-14', labelText: 'Sub-Division / अनुमंडल', type: 'select-one', required: true, isDependent: true, options: [] }
  ];
  const userText = 'State: BIHAR / बिहार\nDistrict: BHOJPUR / भोजपुर\nSub-Division: JAGDISHPUR / जगदीशपुर';
  const messages = buildMessages(null, userText, inputs, {});

  const promptText = messages[1].content;
  // State should have options
  assert.ok(promptText.includes('[form-filler-0-12] type=select-one | label="State / राज्य" | req=true | options=["BIHAR"]'));
  // District should have dependent=true and NO placeholder options
  assert.ok(promptText.includes('[form-filler-0-13] type=select-one | label="District / जिला" | req=true | dependent=true'));
  assert.ok(!promptText.includes('[form-filler-0-13] type=select-one | label="District / जिला" | req=true | options=["Please Select"]'));
  // Sub-Division should have dependent=true
  assert.ok(promptText.includes('[form-filler-0-14] type=select-one | label="Sub-Division / अनुमंडल" | req=true | dependent=true'));
  // Prompt reminder should mention cascading dropdowns
  assert.ok(promptText.includes('For cascading/dependent dropdowns (District, Sub-Division, Block, Tehsil, Ward, Municipal Corporation, etc. marked dependent=true)'));
  console.log('✓ buildMessages: correctly serializes dependent=true without placeholder options for cascading dropdowns');
}

// Test 33: isFakeDataRequested accurately detects fake/dummy/demo directives vs factual profiles
{
  assert.equal(isFakeDataRequested('Fill form with fake details'), true);
  assert.equal(isFakeDataRequested('Fill with dummy data'), true);
  assert.equal(isFakeDataRequested('fake details bhar do'), true);
  assert.equal(isFakeDataRequested('dummy details daal do'), true);
  assert.equal(isFakeDataRequested('kuch bhi details bhar do'), true);
  assert.equal(isFakeDataRequested('test data fill karo'), true);
  assert.equal(isFakeDataRequested('fake'), true);
  assert.equal(isFakeDataRequested('dummy'), true);
  assert.equal(isFakeDataRequested('generate fake profile'), true);
  assert.equal(isFakeDataRequested('Random data se fill karo'), true);

  // Factual profiles should NOT trigger fake data detection
  assert.equal(isFakeDataRequested('Name: Alex Morgan\nEmail: alex@example.com'), false);
  assert.equal(isFakeDataRequested('Address: 123 Fake Street\nCity: Chicago'), false);
  assert.equal(isFakeDataRequested('Name: Ankur Maurya\nState: BIHAR'), false);
  console.log('✓ isFakeDataRequested: accurately detects fake/dummy directives without false-positives on factual profiles');
}

// Test 34: normalizeAIValuesToCanonicalFields populates all eligible fields when fake data is requested
{
  const detectedFields = [
    { class: 'form-filler-0-0', type: 'text', labelText: 'Full Name *', id: 'name', name: 'name' },
    { class: 'form-filler-0-1', type: 'email', labelText: 'Email Address *', id: 'email', name: 'email' },
    { class: 'form-filler-0-2', type: 'select', labelText: 'Service Interested In', id: 'service', name: 'service', options: ['Select a Service', 'Web Development', 'Mobile App', 'SEO'] },
    { class: 'form-filler-0-3', type: 'textarea', labelText: 'Message *', id: 'message', name: 'message' }
  ];

  const emptyAIOutput = {};
  const fakeDirective = 'Fill form with fake details';
  const result = normalizeAIValuesToCanonicalFields(emptyAIOutput, detectedFields, fakeDirective);

  assert.equal(result['form-filler-0-0'], 'Alex Morgan');
  assert.ok(result['form-filler-0-1'].includes('@example.com'));
  assert.equal(result['form-filler-0-2'], 'Web Development', 'Must pick first non-placeholder option');
  assert.ok(result['form-filler-0-3'].length > 10, 'Must generate meaningful message');
  console.log('✓ normalizeAIValuesToCanonicalFields: populates all fields with realistic synthetic data when "Fill form with fake details" is given');
}

// Test 35: Hybrid profile preserves explicit user values and generates synthetic data for remaining fields
{
  const detectedFields = [
    { class: 'form-filler-0-0', type: 'text', labelText: 'Full Name', id: 'name' },
    { class: 'form-filler-0-1', type: 'email', labelText: 'Email Address', id: 'email' },
    { class: 'form-filler-0-2', type: 'tel', labelText: 'Phone Number', id: 'phone' },
    { class: 'form-filler-0-3', type: 'textarea', labelText: 'Message', id: 'message' }
  ];

  const hybridText = `Full Name: Rohan Gupta
fill remaining fields with fake data`;

  const emptyAIOutput = {};
  const result = normalizeAIValuesToCanonicalFields(emptyAIOutput, detectedFields, hybridText);

  assert.equal(result['form-filler-0-0'], 'Rohan Gupta', 'User explicit name must be preserved');
  assert.ok(result['form-filler-0-1'].includes('@example.com'), 'Email must be synthetically generated');
  assert.ok(result['form-filler-0-2'].length >= 10, 'Phone must be synthetically generated');
  assert.ok(result['form-filler-0-3'].length > 10, 'Message must be synthetically generated');
  console.log('✓ normalizeAIValuesToCanonicalFields: preserves explicit values and generates synthetic data for remaining fields');
}

// Test 36: buildMessages injects clear synthetic directive when fake data is requested
{
  const inputs = [
    { class: 'form-filler-0-0', type: 'text', labelText: 'Full Name', isVisible: true },
    { class: 'form-filler-0-1', type: 'email', labelText: 'Email Address', isVisible: true }
  ];
  const fakeMessages = buildMessages(null, 'Fill form with fake details', inputs, {});
  assert.ok(fakeMessages[1].content.includes('[DIRECTIVE: User explicitly requested fake/dummy/demo details'));
  assert.ok(fakeMessages[1].content.includes('generate realistic synthetic values for all detected fields'));

  const factualMessages = buildMessages(null, 'Name: Alex Morgan', inputs, {});
  assert.ok(!factualMessages[1].content.includes('[DIRECTIVE: User explicitly requested fake/dummy/demo details'));
  console.log('✓ buildMessages: injects explicit synthetic directive only when fake data is requested');
}

console.log('\nAll 36 unit tests passed successfully!');

