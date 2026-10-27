const fs = require('node:fs');
const path = require('node:path');
const { spawn, execFileSync } = require('node:child_process');
const { createRequire } = require('node:module');
const { installPrebuilt } = require('./frontend-prebuilt');
const { buildEnvironment } = require('../frontend/scripts/build-environment');

const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

function runCommand(command, args, { cwd, env, logFile }) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] });
    let logError;
    for (const [stream, output] of [[child.stdout, process.stdout], [child.stderr, process.stderr]]) {
      stream.on('data', chunk => {
        output.write(chunk);
        if (logError) return;
        try { fs.appendFileSync(logFile, chunk); }
        catch (error) {
          logError = new Error(`Cannot write deployment log (${error.code || error.message}). Check account disk quota.`, { cause: error });
          child.kill('SIGTERM');
        }
      });
    }
    child.once('error', reject);
    child.once('close', (code, signal) => {
      if (logError) reject(logError);
      else if (code === 0) resolve();
      else reject(new Error(`${path.basename(command)} failed (${signal || `exit ${code}`}).`));
    });
  });
}

async function restartFrontend() {
  if (process.env.VOLOLEADS_CPANEL_RESTART !== '1') return;
  // CloudLinux/LiteSpeed may keep workers alive after restart.txt changes.
  // Discard selector output because it can contain application environment data.
  await new Promise((resolve, reject) => {
    const child = spawn('cloudlinux-selector', ['restart', '--json', '--interpreter', 'nodejs', '--user', 'vololead', '--app-root', 'vololeads/frontend'], { stdio: 'ignore' });
    child.once('error', () => reject(new Error('Unable to request the cPanel frontend restart.')));
    child.once('close', code => code === 0 ? resolve() : reject(new Error('cPanel frontend restart failed. Inspect the frontend app status in cPanel.')));
  });
}

async function readPage(url, buildId) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000), redirect: 'error' });
  if (!response.ok) throw new Error(`Frontend check returned HTTP ${response.status}.`);
  if (response.headers.get('x-vololeads-build') !== buildId) throw new Error('Frontend is not serving the expected build yet.');
  const html = await response.text();
  if (!html.includes('__next')) throw new Error('Frontend did not return Next.js markup.');
  return html;
}

async function probeCandidate(candidate, env, logFile, buildId) {
  const child = spawn(process.execPath, [path.join(candidate, 'next-server.js')], {
    cwd: candidate,
    env: { ...env, PORT: '0', VOLOLEADS_BIND_ADDRESS: '127.0.0.1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  let failure;
  const record = chunk => {
    if (failure) return;
    try { fs.appendFileSync(logFile, chunk); }
    catch (error) { failure = new Error(`Cannot write candidate log (${error.code || error.message}). Check account disk quota.`); child.kill('SIGTERM'); }
  };
  child.stdout.on('data', chunk => { output += chunk; record(chunk); });
  child.stderr.on('data', record);
  child.once('error', error => { failure = error; });
  child.once('exit', (code, signal) => { failure ||= new Error(`Candidate server exited (${signal || code}).`); });
  try {
    for (let attempt = 0; attempt < 80; attempt++) {
      if (failure) throw failure;
      const match = output.match(/VoloLeads frontend listening: (\d+)/);
      if (match) {
        for (const route of ['/', '/compliance.html', '/terms-condition.html']) {
          await readPage(`http://127.0.0.1:${match[1]}${route}`, buildId);
        }
        return;
      }
      await delay(250);
    }
    throw new Error('Candidate server did not become ready.');
  } finally {
    if (child.exitCode === null && child.signalCode === null) {
      const exited = new Promise(resolve => child.once('exit', resolve));
      child.kill('SIGTERM');
      await Promise.race([exited, delay(2000)]);
      if (child.exitCode === null && child.signalCode === null) child.kill('SIGKILL');
    }
  }
}

function replaceFile(destination, contents, mode = 0o644) {
  const temporary = `${destination}.deploy-${process.pid}`;
  fs.writeFileSync(temporary, contents, { mode });
  fs.renameSync(temporary, destination);
}

function replacePointer(pointer, target) {
  const temporary = `${pointer}.deploy-${process.pid}`;
  fs.symlinkSync(target, temporary);
  fs.renameSync(temporary, pointer);
}

async function checkPublic(buildId) {
  let lastError;
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      for (const route of ['/', '/compliance.html', '/terms-condition.html']) {
        await readPage(`https://vololeads.com${route}?deployment=${encodeURIComponent(buildId)}`, buildId);
      }
      return;
    } catch (error) { lastError = error; }
    await delay(2000);
  }
  throw lastError;
}

async function deploy(options = {}) {
  const repo = options.repo || path.resolve(__dirname, '..');
  const base = options.base || '/home/vololead';
  const live = path.join(base, 'vololeads', 'frontend');
  const styles = path.join(base, 'public_html', 'styles.css');
  const pointer = path.join(live, 'current');
  const run = options.runCommand || runCommand;
  const probe = options.probeCandidate || probeCandidate;
  const verifyPublic = options.checkPublic || checkPublic;
  const restart = options.restartFrontend || restartFrontend;
  const revision = options.revision || execFileSync('git', ['-C', repo, 'rev-parse', '--short=12', 'HEAD'], { encoding: 'utf8' }).trim();
  const prebuilt = options.prebuilt ?? process.env.VOLOLEADS_PREBUILT === '1';
  const fullRevision = prebuilt ? (options.fullRevision || execFileSync('git', ['-C', repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()) : null;
  const release = `${new Date().toISOString().replace(/[:.]/g, '-')}-${revision}-${process.pid}`;
  const candidate = path.join(base, 'vololeads', 'frontend-releases', release);
  const logs = path.join(base, 'deployment-logs');
  const backup = path.join(base, 'deployment-backups', `frontend-${release}`);
  fs.mkdirSync(logs, { recursive: true, mode: 0o700 });
  fs.mkdirSync(candidate, { recursive: true, mode: 0o700 });
  const logFile = path.join(logs, `frontend-${release}.log`);
  fs.writeFileSync(logFile, '', { mode: 0o600 });
  let previousPointer;
  let pointerStat;
  try {
    pointerStat = fs.lstatSync(pointer);
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (pointerStat) {
    if (!pointerStat.isSymbolicLink()) throw new Error('The current release pointer must be a symbolic link.');
    previousPointer = fs.readlinkSync(pointer);
    fs.realpathSync(pointer);
  }
  const oldBootstrap = fs.readFileSync(path.join(live, 'next-server.js'));
  const oldStyles = fs.existsSync(styles) ? fs.readFileSync(styles) : null;
  let promoted = false;

  try {
    console.log(`Preparing isolated frontend release: ${release}`);
    console.log(`Build log: ${logFile}`);
    fs.cpSync(path.join(repo, 'frontend'), candidate, {
      recursive: true,
      filter: source => {
        const relative = path.relative(path.join(repo, 'frontend'), source);
        const first = relative.split(path.sep)[0];
        return !['node_modules', '.next', 'tmp', 'current', '.git'].includes(first) && !first.startsWith('.env');
      },
    });
    let env = buildEnvironment();
    if (prebuilt) await (options.installPrebuilt || installPrebuilt)({ candidate, repo, env, logFile, run, revision: fullRevision });
    if (!prebuilt) await run('npm', ['ci', '--omit=dev', '--ignore-scripts', '--no-audit', '--no-fund'], { cwd: candidate, env, logFile });
    // Load the existing application's env for the build without copying or logging it.
    if (options.loadEnvironment) options.loadEnvironment(live, candidate);
    else createRequire(path.join(candidate, 'package.json'))('@next/env').loadEnvConfig(live);
    env = buildEnvironment();
    if (!prebuilt) await run(process.execPath, [path.join(candidate, 'scripts', 'build-next.js')], { cwd: candidate, env, logFile });
    const buildId = fs.readFileSync(path.join(candidate, '.next', 'BUILD_ID'), 'utf8').trim();
    if (!buildId) throw new Error('The candidate build has no BUILD_ID.');
    await probe(candidate, env, logFile, buildId);

    // Nothing above this point writes to the running application or its dependencies.
    fs.mkdirSync(backup, { recursive: true, mode: 0o700 });
    fs.writeFileSync(path.join(backup, 'next-server.js'), oldBootstrap);
    fs.writeFileSync(path.join(backup, 'release.json'), JSON.stringify({ previousPointer: previousPointer || null, candidate }));
    if (oldStyles !== null) fs.writeFileSync(path.join(backup, 'styles.css'), oldStyles);
    promoted = true;
    replacePointer(pointer, candidate);
    replaceFile(path.join(live, 'next-server.js'), fs.readFileSync(path.join(candidate, 'next-server.js')));
    replaceFile(styles, fs.readFileSync(path.join(candidate, 'styles.css')));
    fs.mkdirSync(path.join(live, 'tmp'), { recursive: true });
    fs.writeFileSync(path.join(live, 'tmp', 'restart.txt'), release);
    await restart();
    await verifyPublic(buildId);
    console.log(`Frontend release is healthy: ${release}`);
    console.log(`Previous release and activation backup retained: ${backup}`);
    return { candidate, buildId, backup };
  } catch (error) {
    if (promoted) {
      try {
        if (previousPointer) replacePointer(pointer, previousPointer);
        else if (fs.existsSync(pointer)) fs.unlinkSync(pointer);
        replaceFile(path.join(live, 'next-server.js'), oldBootstrap);
        if (oldStyles !== null) replaceFile(styles, oldStyles);
        else if (fs.existsSync(styles)) fs.unlinkSync(styles);
        fs.writeFileSync(path.join(live, 'tmp', 'restart.txt'), `rollback-${release}`);
        await restart();
        console.error('Frontend activation failed; restored the previous release and requested a restart.');
      } catch (rollbackError) {
        console.error(`Automatic rollback failed: ${rollbackError.message}. Restore from ${backup}.`);
      }
    } else {
      console.error('Deployment stopped before activation. The running frontend was not modified.');
      // Only this run's newly created candidate is disposable. Never prune older
      // releases here: running Passenger workers may still be using them.
      try {
        fs.rmSync(candidate, { recursive: true, force: true });
        console.error('Removed this failed candidate to reclaim deployment disk space.');
      } catch (cleanupError) { console.error(`Failed candidate cleanup: ${cleanupError.message}. Path: ${candidate}`); }
    }
    if (promoted) console.error(`Candidate retained for rollback investigation: ${candidate}`);
    console.error(`Build/startup log: ${logFile}`);
    throw error;
  }
}

module.exports = { runCommand, deploy, probeCandidate, readPage };

if (require.main === module) {
  deploy().catch(error => { console.error(error.message); process.exitCode = 1; });
}
