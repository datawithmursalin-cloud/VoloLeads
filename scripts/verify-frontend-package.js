// Exercise the packaged Linux build in a different directory before publishing it.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { installPrebuilt } = require('./frontend-prebuilt');
const { probeCandidate } = require('./deploy-frontend-cpanel');

async function main() {
  const repo = path.resolve(__dirname, '..');
  const candidate = fs.mkdtempSync(path.join(os.tmpdir(), 'vololeads-package-'));
  try {
    fs.cpSync(path.join(repo, 'frontend'), candidate, { recursive: true, filter: source => !['node_modules', '.next'].includes(path.relative(path.join(repo, 'frontend'), source).split(path.sep)[0]) });
    fs.symlinkSync(path.join(repo, 'frontend', 'node_modules'), path.join(candidate, 'node_modules'));
    await installPrebuilt({ candidate, repo, env: process.env, logFile: '', revision: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      async run(command, args) {
        if (command === 'curl') fs.copyFileSync(path.join(repo, args.at(-1).endsWith('.sha256') ? 'frontend-build.tar.gz.sha256' : 'frontend-build.tar.gz'), args[args.indexOf('--output') + 1]);
        else execFileSync(command, args, { stdio: 'inherit' });
      }
    });
    await probeCandidate(candidate, process.env, path.join(os.tmpdir(), 'prebuilt-probe.log'), fs.readFileSync(path.join(candidate, '.next', 'BUILD_ID'), 'utf8').trim());
    console.log('Packaged build passed checks after relocation.');
  } finally { fs.rmSync(candidate, { recursive: true, force: true }); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
