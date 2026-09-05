const { spawnSync } = require('node:child_process');
const path = require('node:path');

const projectRoot = process.env.INIT_CWD || path.resolve(__dirname, '..');
process.chdir(projectRoot);

const nextExecutable = process.platform === 'win32' ? 'next.cmd' : 'next';
const nextBin = path.join(projectRoot, 'node_modules', '.bin', nextExecutable);
const result = spawnSync(nextBin, ['build', '--webpack'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

if (result.error) {
  console.error(`Unable to start Next.js build: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
