const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { runCommand } = require('../deploy-frontend-cpanel');

test('log write failure rejects cleanly and terminates a running child', { timeout: 10000 }, async t => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'deployment-log-failure-'));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  // A directory reliably makes appendFileSync fail without needing a full disk.
  await assert.rejects(runCommand(process.execPath, ['-e', 'console.log("child started"); setInterval(() => {}, 1000)'], {
    cwd: folder, env: process.env, logFile: folder,
  }), /Cannot write deployment log.*Check account disk quota/);
});

test('successful subprocess output is saved to the log', async t => {
  const folder = fs.mkdtempSync(path.join(os.tmpdir(), 'deployment-log-success-'));
  t.after(() => fs.rmSync(folder, { recursive: true, force: true }));
  const logFile = path.join(folder, 'build.log');
  await runCommand(process.execPath, ['-e', 'console.log("saved output")'], { cwd: folder, env: process.env, logFile });
  assert.match(fs.readFileSync(logFile, 'utf8'), /saved output/);
});
