const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { pipeline } = require('node:stream/promises');

async function sha256(file) {
  const hash = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(file), hash);
  return hash.digest('hex');
}

function validateMetadata(metadata, revision, lockHash, runtime = process) {
  if (metadata.revision !== revision || metadata.lockHash !== lockHash ||
      metadata.platform !== runtime.platform || metadata.arch !== runtime.arch ||
      metadata.nodeMajor !== runtime.versions.node.split('.')[0]) {
    throw new Error('Prebuilt frontend does not match this commit, lockfile or Node platform. Live application unchanged.');
  }
}

async function installPrebuilt({ candidate, repo, env, logFile, run, revision }) {
  if (!/^[a-f0-9]{40}$/.test(revision)) throw new Error('A full commit SHA is required for prebuilt deployment.');
  const archive = path.join(candidate, 'frontend-build.tar.gz');
  const checksum = `${archive}.sha256`;
  const url = `https://github.com/datawithmursalin-cloud/VoloLeads/releases/download/frontend-${revision}/frontend-build.tar.gz`;
  console.log(`Downloading prebuilt frontend for ${revision.slice(0, 12)}. No compilation runs on cPanel.`);
  try {
    for (const [destination, source] of [[checksum, `${url}.sha256`], [archive, url]]) {
      await run('curl', ['--fail', '--location', '--silent', '--show-error', '--retry', '2', '--connect-timeout', '15', '--max-time', '300', '--proto', '=https', '--proto-redir', '=https', '--output', destination, source], { cwd: candidate, env, logFile });
    }
  } catch (error) {
    throw new Error(`Prebuilt download failed. Wait for the GitHub Actions "Build cPanel frontend" run for this commit to succeed, then retry. ${error.message}`);
  }
  const expected = fs.readFileSync(checksum, 'utf8').trim().split(/\s+/)[0];
  if (!/^[a-f0-9]{64}$/.test(expected) || await sha256(archive) !== expected) throw new Error('Prebuilt archive checksum mismatch.');
  // Only our .next output belongs in this archive. Reject traversal before extraction.
  const entries = execFileSync('tar', ['-tzf', archive], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }).trim().split('\n');
  if (entries.some(entry => !entry.startsWith('.next/') || entry.split('/').includes('..') || entry.includes('\\'))) throw new Error('Unexpected prebuilt archive path.');
  await run('tar', ['-xzf', archive, '--no-same-owner', '--no-same-permissions', '-C', candidate], { cwd: candidate, env, logFile });
  const metadata = JSON.parse(fs.readFileSync(path.join(candidate, '.next', 'vololeads-build.json'), 'utf8'));
  validateMetadata(metadata, revision, await sha256(path.join(repo, 'frontend', 'package-lock.json')));
  fs.unlinkSync(archive);
  fs.unlinkSync(checksum);
}

module.exports = { sha256, validateMetadata, installPrebuilt };
