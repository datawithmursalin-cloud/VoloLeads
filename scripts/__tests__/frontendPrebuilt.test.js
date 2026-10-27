const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { sha256, validateMetadata, installPrebuilt } = require('../frontend-prebuilt');
const runtime = { platform: 'linux', arch: 'x64', versions: { node: '22.23.4' } };
const metadata = { revision: 'a'.repeat(40), lockHash: 'lock', platform: 'linux', arch: 'x64', nodeMajor: '22' };

test('prebuilt metadata rejects mismatched commit, dependencies and runtime', () => {
  validateMetadata(metadata, metadata.revision, 'lock', runtime);
  for (const [key, value] of Object.entries({ revision: 'b'.repeat(40), lockHash: 'wrong', platform: 'win32', arch: 'arm64', nodeMajor: '24' })) {
    assert.throws(() => validateMetadata({ ...metadata, [key]: value }, metadata.revision, 'lock', runtime), /does not match/);
  }
});

test('archive hashing streams file contents', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuilt-hash-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'file'), 'abc');
  assert.equal(await sha256(path.join(root, 'file')), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('a corrupt downloaded archive is rejected before extraction or installation', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'prebuilt-invalid-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const commands = [];
  await assert.rejects(installPrebuilt({ candidate: root, repo: root, env: {}, logFile: '', revision: metadata.revision,
    async run(command, args) {
      commands.push(command);
      fs.writeFileSync(args[args.indexOf('--output') + 1], args.at(-1).endsWith('.sha256') ? '0'.repeat(64) : 'corrupted archive');
    }
  }), /checksum mismatch/);
  assert.deepEqual(commands, ['curl', 'curl']);
});
