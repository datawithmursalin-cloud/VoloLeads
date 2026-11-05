const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { nodeFileTrace } = require('../../frontend/node_modules/next/dist/compiled/@vercel/nft');

const frontend = path.resolve(__dirname, '../../frontend');

test('legacy file tracing includes content without scanning dependencies or build output', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vololeads-trace-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const entries = ['lib/legacy-pages.js', 'app/legacy-runtime/[name]/route.js', 'app/legacy-assets/[...assetPath]/route.js'];
  for (const entry of entries) {
    fs.mkdirSync(path.dirname(path.join(root, entry)), { recursive: true });
    fs.copyFileSync(path.join(frontend, entry), path.join(root, entry));
  }
  for (const file of ['index.html', 'compliance.html', 'terms-condition.html', 'app.js', 'icons.js', 'png/image.png', 'audio/sound.mp3', 'node_modules/unrelated/sentinel.js', '.next/sentinel.js', '.env']) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.writeFileSync(path.join(root, file), 'fixture');
  }
  const result = await nodeFileTrace(entries.map(entry => path.join(root, entry)), { base: root, processCwd: root });
  const files = [...result.fileList].map(file => file.replace(/\\/g, '/'));
  for (const file of ['index.html', 'compliance.html', 'terms-condition.html', 'app.js', 'icons.js', 'png/image.png', 'audio/sound.mp3']) {
    assert.ok(files.includes(file), `Missing runtime content: ${file}`);
  }
  assert.deepEqual(files.filter(file => /^(node_modules\/|\.next\/|\.env$)/.test(file)), []);
});

test('legacy asset route serves allowed files and rejects traversal', async t => {
  const source = fs.readFileSync(path.join(frontend, 'app/legacy-assets/[...assetPath]/route.js'), 'utf8');
  const { GET } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
  const previous = process.cwd();
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'vololeads-assets-'));
  fs.mkdirSync(path.join(root, 'png'));
  const asset = 'image.png';
  fs.writeFileSync(path.join(root, 'png', asset), Buffer.from([137, 80, 78, 71]));
  process.chdir(root);
  t.after(() => { process.chdir(previous); fs.rmSync(root, { recursive: true, force: true }); });
  const response = await GET(null, { params: Promise.resolve({ assetPath: ['png', asset] }) });
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.deepEqual(Buffer.from(await response.arrayBuffer()), fs.readFileSync(path.join(root, 'png', asset)));
  for (const assetPath of [['png', '..', 'app.js'], ['audio', '../app.js'], ['png', '..\\app.js'], ['node_modules', 'next', 'package.json']]) {
    assert.equal((await GET(null, { params: Promise.resolve({ assetPath }) })).status, 404);
  }
});

test('all legacy pages and allowed runtime scripts still load', async t => {
  const load = relative => import(`data:text/javascript;base64,${fs.readFileSync(path.join(frontend, relative)).toString('base64')}`);
  const { getLegacyPage, legacyRouteParams } = await load('lib/legacy-pages.js');
  const { GET } = await load('app/legacy-runtime/[name]/route.js');
  const previous = process.cwd();
  process.chdir(frontend);
  t.after(() => process.chdir(previous));
  for (const route of ['', ...legacyRouteParams.map(({ slug }) => slug.join('/'))]) {
    const page = getLegacyPage(route);
    assert.ok(page?.bodyHtml, `Missing page: ${route}`);
    assert.ok(page.title);
    const skipTarget = page.bodyHtml.match(/<a href="#([^"]+)" class="site-skip-link">/);
    assert.ok(skipTarget, `Missing skip link: ${route}`);
    assert.ok(page.bodyHtml.includes(`id="${skipTarget[1]}"`), `Missing skip target: ${route}`);
    assert.equal((page.bodyHtml.match(/Skip to main content/g) || []).length, 1, route);
    assert.equal(page.canonical, ['pricing', 'contact', 'call-recordings', 'about', 'testimonials'].includes(route) ? '/' : `/${route}`);
    const draft = route.startsWith('resources/') && JSON.parse(fs.readFileSync('content/blueprint.json', 'utf8')).pages.some(item => `resources/${item.slug}` === route && item.status === 'draft');
    const privatePage = ['success', 'cancel', 'thank-you', 'manage-subscription', 'schedule-onboarding', 'maintenance.html'].includes(route);
    if (draft || privatePage) assert.equal(page.robots.index, false, route);
    if (route.startsWith('services') || route.startsWith('plans/') || route === '') assert.equal(page.robots.index, true, route);
  }
  assert.equal(getLegacyPage('missing.html'), null);
  for (const name of ['app.js', 'icons.js']) {
    const response = await GET(null, { params: Promise.resolve({ name }) });
    assert.equal(response.status, 200);
    assert.equal(await response.text(), fs.readFileSync(path.join(frontend, name), 'utf8'));
  }
  for (const name of ['package.json', '__proto__', '../app.js']) {
    assert.equal((await GET(null, { params: Promise.resolve({ name }) })).status, 404);
  }
});

test('clean redirects resolve to traced pages and preserve resource articles', async t => {
  const config = require('../../frontend/next.config');
  const redirects = await config.redirects();
  const source = fs.readFileSync(path.join(frontend, 'lib/legacy-pages.js'));
  const { getLegacyPage, legacyRouteParams } = await import(`data:text/javascript;base64,${source.toString('base64')}`);
  const previous = process.cwd();
  process.chdir(frontend);
  t.after(() => process.chdir(previous));
  const routes = new Set(['', ...legacyRouteParams.map(({ slug }) => slug.join('/'))]);
  for (const redirect of redirects) {
    const route = redirect.destination.slice(1);
    assert.equal(redirect.statusCode, 301);
    assert.ok(routes.has(route), `Untraced redirect: ${redirect.source}`);
    assert.ok(getLegacyPage(route)?.bodyHtml, `Missing redirect target: ${route}`);
  }
  for (const route of ['pricing', 'contact', 'call-recordings', 'about', 'testimonials']) {
    assert.equal(getLegacyPage(route).canonical, '/');
    assert.ok(getLegacyPage(route).bodyHtml.includes('id="contact"'));
  }
  for (const route of routes) {
    const html = getLegacyPage(route).bodyHtml;
    for (const [, serviceRoute] of html.matchAll(/href="\/(services(?:\/[a-z-]+)?)"/g)) {
      assert.ok(routes.has(serviceRoute), `Untraced service link: ${serviceRoute}`);
      assert.ok(getLegacyPage(serviceRoute), `Missing service link: ${serviceRoute}`);
    }
    assert.doesNotMatch(html, /(?:href|action)=["'][^"']*\.html(?:["'?#])/);
  }
});
