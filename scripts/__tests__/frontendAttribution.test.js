const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

const runtime = fs.readFileSync(path.resolve(__dirname, '../../frontend/app.js'), 'utf8');

function browser(storage = new Map(), blocked = false) {
  const inputs = new Map();
  const context = vm.createContext({
    URLSearchParams,
    window: { location: { search: '' }, addEventListener() {} },
    document: {
      readyState: 'loading', addEventListener() {},
      createElement: () => ({}),
      getElementById: () => ({
        querySelector: selector => inputs.get(selector.match(/name="([^"]+)"/)[1]),
        appendChild: input => inputs.set(input.name, input)
      })
    },
    sessionStorage: {
      getItem: key => { if (blocked) throw Error('blocked'); return storage.get(key) || null; },
      setItem: (key, value) => { if (blocked) throw Error('blocked'); storage.set(key, value); }
    }
  });
  vm.runInContext(runtime, context);
  return { capture: search => context.initFormAttribution(search), value: name => inputs.get(name)?.value, inputs };
}

test('source survives page navigation while a service CTA updates only the referring service', () => {
  const storage = new Map();
  browser(storage).capture('?src=email&utm_campaign=november&email=private&access_token=secret');
  const form = browser(storage);
  form.capture('?service=cold-callers');
  assert.equal(form.value('src'), 'email');
  assert.equal(form.value('utm_campaign'), 'november');
  assert.equal(form.value('tracking_service'), 'cold-callers');
  assert.equal(form.inputs.has('service'), false);
  assert.equal(form.inputs.has('email'), false);
  assert.doesNotMatch(storage.get('vololeads-attribution-v1'), /private|secret/);
  form.capture('');
  assert.equal(form.inputs.size, 7);
  assert.equal(form.value('tracking_service'), 'cold-callers');
});

test('a new campaign clears stale UTM tags and an explicit empty value clears the old service', () => {
  const form = browser();
  form.capture('?src=email&utm_campaign=november&service=cold-callers');
  form.capture('?src=phone&service=');
  assert.equal(form.value('src'), 'phone');
  assert.equal(form.value('utm_campaign'), '');
  assert.equal(form.value('tracking_service'), '');
});

test('blocked or malformed session storage still permits current-page attribution', () => {
  for (const form of [browser(new Map(), true), browser(new Map([['vololeads-attribution-v1', '{bad json']]))]) {
    form.capture('?src=email&service=crm-setup');
    assert.equal(form.value('src'), 'email');
    assert.equal(form.value('tracking_service'), 'crm-setup');
  }
});
