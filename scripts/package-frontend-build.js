const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const { sha256 } = require('./frontend-prebuilt');

async function main() {
  const revision = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  if (process.platform !== 'linux' || process.versions.node.split('.')[0] !== '22') throw new Error('Package releases on Linux with Node 22.');
  const metadata = { revision, lockHash: await sha256('frontend/package-lock.json'), platform: process.platform, arch: process.arch, nodeMajor: '22' };
  fs.writeFileSync('frontend/.next/vololeads-build.json', JSON.stringify(metadata));
  execFileSync('tar', ['--exclude=.next/cache', '--exclude=node_modules/.cache', '-czf', 'frontend-build.tar.gz', '-C', 'frontend', '.next', 'node_modules']);
  fs.writeFileSync('frontend-build.tar.gz.sha256', `${await sha256('frontend-build.tar.gz')}  frontend-build.tar.gz\n`);
}
main().catch(error => { console.error(error); process.exitCode = 1; });
