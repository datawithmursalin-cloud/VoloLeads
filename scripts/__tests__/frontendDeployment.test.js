const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { test } = require('node:test');
const { deploy, probeCandidate } = require('../deploy-frontend-cpanel');

const root = path.resolve(__dirname, '../..');

function fixture(t) {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'vololeads-deploy-test-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const repo = path.join(temporary, 'repo');
  const base = path.join(temporary, 'account');
  const source = path.join(repo, 'frontend');
  const live = path.join(base, 'vololeads', 'frontend');
  const styles = path.join(base, 'public_html', 'styles.css');
  fs.mkdirSync(source, { recursive: true });
  fs.mkdirSync(path.join(live, '.next'), { recursive: true });
  fs.mkdirSync(path.dirname(styles), { recursive: true });
  fs.writeFileSync(path.join(source, 'package.json'), '{}');
  fs.writeFileSync(path.join(source, 'styles.css'), 'new styles');
  fs.writeFileSync(path.join(source, 'next-server.js'), 'new bootstrap');
  fs.writeFileSync(path.join(source, '.env'), 'DO_NOT_COPY=repository-value');
  fs.writeFileSync(path.join(live, '.env'), 'PRESERVE=private-application-value');
  fs.writeFileSync(path.join(live, '.next', 'BUILD_ID'), 'old-build');
  fs.writeFileSync(path.join(live, 'next-server.js'), 'old bootstrap');
  fs.writeFileSync(styles, 'old styles');
  const calls = [];
  const options = {
    repo, base, revision: 'test',
    loadEnvironment() {},
    async runCommand(command, args, settings) {
      calls.push({ command, args, settings });
      assert.equal(settings.env.UV_THREADPOOL_SIZE, '1');
      assert.match(settings.env.NODE_OPTIONS, /--v8-pool-size=1/);
      if (command === process.execPath) {
        fs.mkdirSync(path.join(settings.cwd, '.next'));
        fs.writeFileSync(path.join(settings.cwd, '.next', 'BUILD_ID'), 'new-build');
      }
    },
    async probeCandidate(candidate) {
      assert.equal(fs.readFileSync(path.join(live, 'next-server.js'), 'utf8'), 'old bootstrap');
      assert.equal(fs.existsSync(path.join(live, 'current')), false);
      assert.equal(fs.readFileSync(styles, 'utf8'), 'old styles');
      assert.equal(fs.existsSync(path.join(candidate, '.env')), false);
    },
    async checkPublic(buildId) { assert.equal(buildId, 'new-build'); },
  };
  const assertOldFiles = () => {
    assert.equal(fs.readFileSync(path.join(live, 'next-server.js'), 'utf8'), 'old bootstrap');
    assert.equal(fs.readFileSync(path.join(live, '.next', 'BUILD_ID'), 'utf8'), 'old-build');
    assert.equal(fs.readFileSync(path.join(live, '.env'), 'utf8'), 'PRESERVE=private-application-value');
    assert.equal(fs.readFileSync(styles, 'utf8'), 'old styles');
  };
  return { options, live, styles, calls, assertOldFiles };
}

for (const phase of ['install', 'build', 'startup']) {
  test(`${phase} failure leaves the running frontend unchanged`, async t => {
    const f = fixture(t);
    const originalRun = f.options.runCommand;
    f.options.runCommand = async (command, args, settings) => {
      if ((phase === 'install' && command === 'npm') || (phase === 'build' && command === process.execPath)) {
        throw new Error(`simulated ${phase} failure`);
      }
      return originalRun(command, args, settings);
    };
    if (phase === 'startup') f.options.probeCandidate = async () => { throw new Error('simulated startup failure'); };
    await assert.rejects(deploy(f.options), /simulated/);
    f.assertOldFiles();
    assert.equal(fs.existsSync(path.join(f.live, 'current')), false);
    assert.equal(fs.existsSync(path.join(f.live, 'tmp', 'restart.txt')), false);
  });
}

test('only a built and checked candidate is promoted; live build and env are preserved', async t => {
  const f = fixture(t);
  const result = await deploy(f.options);
  assert.equal(fs.realpathSync(path.join(f.live, 'current')), fs.realpathSync(result.candidate));
  assert.equal(fs.readFileSync(path.join(f.live, 'next-server.js'), 'utf8'), 'new bootstrap');
  assert.equal(fs.readFileSync(f.styles, 'utf8'), 'new styles');
  assert.equal(fs.readFileSync(path.join(f.live, '.next', 'BUILD_ID'), 'utf8'), 'old-build');
  assert.equal(fs.readFileSync(path.join(f.live, '.env'), 'utf8'), 'PRESERVE=private-application-value');
  assert.equal(fs.readFileSync(path.join(result.backup, 'next-server.js'), 'utf8'), 'old bootstrap');
  assert.deepEqual(f.calls[0].args, ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund']);
});

for (const hasPreviousRelease of [false, true]) {
  test(`public-check failure restores ${hasPreviousRelease ? 'an existing release pointer' : 'the legacy application'}`, async t => {
    const f = fixture(t);
    const previous = path.join(f.options.base, 'vololeads', 'previous-release');
    if (hasPreviousRelease) {
      fs.mkdirSync(previous, { recursive: true });
      fs.symlinkSync(previous, path.join(f.live, 'current'));
      f.options.probeCandidate = async () => {};
    }
    f.options.checkPublic = async () => { throw new Error('new release is unhealthy'); };
    await assert.rejects(deploy(f.options), /unhealthy/);
    f.assertOldFiles();
    if (hasPreviousRelease) assert.equal(fs.realpathSync(path.join(f.live, 'current')), fs.realpathSync(previous));
    else assert.equal(fs.existsSync(path.join(f.live, 'current')), false);
    assert.match(fs.readFileSync(path.join(f.live, 'tmp', 'restart.txt'), 'utf8'), /^rollback-/);
  });
}

test('a dangling existing release pointer is rejected before installation', async t => {
  const f = fixture(t);
  fs.symlinkSync(path.join(f.options.base, 'missing'), path.join(f.live, 'current'));
  await assert.rejects(deploy(f.options), { code: 'ENOENT' });
  assert.equal(f.calls.length, 0);
  f.assertOldFiles();
});

test('build wrapper ignores a stale INIT_CWD and propagates low-thread settings to Node children', t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'vololeads-build-test-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const scripts = path.join(temporary, 'frontend', 'scripts');
  const cli = path.join(temporary, 'frontend', 'node_modules', 'next', 'dist', 'bin');
  fs.mkdirSync(scripts, { recursive: true });
  fs.mkdirSync(cli, { recursive: true });
  for (const file of ['build-next.js', 'build-environment.js']) {
    fs.copyFileSync(path.join(root, 'frontend', 'scripts', file), path.join(scripts, file));
  }
  fs.writeFileSync(path.join(cli, 'next.js'), `
    const fs = require('node:fs');
    const { spawnSync } = require('node:child_process');
    const nested = spawnSync(process.execPath, ['-p', 'process.env.UV_THREADPOOL_SIZE'], { encoding: 'utf8' });
    fs.writeFileSync(process.env.BUILD_TEST_RESULT, JSON.stringify({ cwd: process.cwd(), args: process.argv.slice(2), pool: process.env.UV_THREADPOOL_SIZE, options: process.env.NODE_OPTIONS, nested: nested.stdout.trim() }));
    process.exit(Number(process.env.BUILD_TEST_EXIT || 0));
  `);
  const resultFile = path.join(temporary, 'result.json');
  const env = { ...process.env, INIT_CWD: '/wrong-directory', BUILD_TEST_RESULT: resultFile, NODE_OPTIONS: '--max-old-space-size=256' };
  const result = spawnSync(process.execPath, [path.join(scripts, 'build-next.js')], { env, cwd: os.tmpdir(), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const recorded = JSON.parse(fs.readFileSync(resultFile));
  assert.equal(fs.realpathSync(recorded.cwd), fs.realpathSync(path.dirname(scripts)));
  assert.deepEqual(recorded.args, ['build', '--webpack']);
  assert.equal(recorded.pool, '1');
  assert.equal(recorded.nested, '1');
  assert.match(recorded.options, /--max-old-space-size=256/);
  assert.match(recorded.options, /--v8-pool-size=1/);
  const failed = spawnSync(process.execPath, [path.join(scripts, 'build-next.js')], { env: { ...env, BUILD_TEST_EXIT: '7' }, encoding: 'utf8' });
  assert.equal(failed.status, 7);
});

function fakeRelease(folder, name) {
  fs.mkdirSync(path.join(folder, 'node_modules', 'next'), { recursive: true });
  fs.mkdirSync(path.join(folder, 'node_modules', '@next', 'env'), { recursive: true });
  fs.mkdirSync(path.join(folder, '.next'));
  fs.writeFileSync(path.join(folder, '.next', 'BUILD_ID'), name);
  fs.writeFileSync(path.join(folder, 'package.json'), '{}');
  fs.writeFileSync(path.join(folder, 'page.html'), `<html>__next ${name}</html>`);
  fs.writeFileSync(path.join(folder, 'node_modules', '@next', 'env', 'index.js'), 'exports.loadEnvConfig = () => {};');
  fs.writeFileSync(path.join(folder, 'node_modules', 'next', 'index.js'), `
    const fs = require('node:fs');
    const path = require('node:path');
    module.exports = options => ({ prepare: async () => {}, getRequestHandler: () => (_request, response) => response.end(fs.readFileSync(path.join(options.dir, 'page.html'))) });
  `);
  fs.copyFileSync(path.join(root, 'frontend', 'next-server.js'), path.join(folder, 'next-server.js'));
}

async function startWorker(script, t) {
  const child = spawn(process.execPath, [script], {
    env: { ...process.env, PORT: '0', VOLOLEADS_BIND_ADDRESS: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  t.after(() => child.kill('SIGTERM'));
  return new Promise((resolve, reject) => {
    let output = '';
    child.stdout.on('data', chunk => {
      output += chunk;
      const match = output.match(/VoloLeads frontend listening: (\d+)/);
      if (match) resolve(`http://127.0.0.1:${match[1]}`);
    });
    child.stderr.on('data', chunk => { output += chunk; });
    child.once('error', reject);
    child.once('exit', () => reject(new Error(output)));
  });
}

test('Passenger-style non-TCP listen addresses do not crash startup', t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'vololeads-passenger-test-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const release = path.join(temporary, 'release');
  fakeRelease(release, 'passenger');
  const preload = path.join(temporary, 'passenger-preload.js');
  fs.writeFileSync(preload, `
    const Module = require('node:module');
    const original = Module._load;
    Module._load = function(name, ...args) {
      if (name === 'node:http') return { createServer() {
        return { on() {}, address() { return null; }, listen(_port, _host, ready) { ready(); } };
      } };
      return original.call(this, name, ...args);
    };
  `);
  const result = spawnSync(process.execPath, ['--require', preload, path.join(release, 'next-server.js')], {
    env: { ...process.env, PORT: '3000' }, encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /VoloLeads frontend listening: 3000/);
});

test('running Passenger workers stay pinned to their release after promotion', { timeout: 15000 }, async t => {
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'vololeads-runtime-test-'));
  t.after(() => fs.rmSync(temporary, { recursive: true, force: true }));
  const live = path.join(temporary, 'frontend');
  const first = path.join(temporary, 'release-one');
  const second = path.join(temporary, 'release-two');
  fs.mkdirSync(live);
  fakeRelease(first, 'one'); fakeRelease(second, 'two');
  fs.copyFileSync(path.join(root, 'frontend', 'next-server.js'), path.join(live, 'next-server.js'));
  fs.symlinkSync(first, path.join(live, 'current'));
  const firstUrl = await startWorker(path.join(live, 'next-server.js'), t);
  assert.match(await (await fetch(firstUrl)).text(), /__next one/);
  fs.symlinkSync(second, path.join(live, 'next'));
  fs.renameSync(path.join(live, 'next'), path.join(live, 'current'));
  const secondUrl = await startWorker(path.join(live, 'next-server.js'), t);
  assert.equal((await fetch(secondUrl)).headers.get('x-vololeads-build'), 'two');
  assert.match(await (await fetch(firstUrl)).text(), /__next one/);
  await probeCandidate(second, process.env, path.join(temporary, 'probe.log'), 'two');
});

test('prebuilt deployment downloads and checks the build without invoking compilation', async t => {
  const f = fixture(t);
  f.options.prebuilt = true;
  f.options.fullRevision = 'a'.repeat(40);
  let installed = false;
  f.options.installPrebuilt = async ({ candidate, revision }) => {
    assert.equal(revision, f.options.fullRevision);
    fs.mkdirSync(path.join(candidate, '.next'));
    fs.writeFileSync(path.join(candidate, '.next', 'BUILD_ID'), 'new-build');
    installed = true;
  };
  await deploy(f.options);
  assert.ok(installed);
  assert.deepEqual(f.calls.map(call => call.command), ['npm']);
});

test('prebuilt download failure preserves the live application without installing anything', async t => {
  const f = fixture(t);
  f.options.prebuilt = true;
  f.options.fullRevision = 'a'.repeat(40);
  f.options.installPrebuilt = async () => { throw new Error('artifact unavailable'); };
  await assert.rejects(deploy(f.options), /artifact unavailable/);
  assert.equal(f.calls.length, 0);
  f.assertOldFiles();
  assert.equal(fs.existsSync(path.join(f.live, 'current')), false);
});
