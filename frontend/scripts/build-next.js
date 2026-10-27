const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { buildEnvironment } = require('./build-environment');

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const nextBin = require.resolve('next/dist/bin/next');
const result = spawnSync(process.execPath, [nextBin, 'build', '--webpack'], {
  stdio: 'inherit',
  env: buildEnvironment(),
});

if (result.error) {
  console.error(`Unable to start Next.js build: ${result.error.message}`);
  process.exit(1);
}

if (result.signal) {
  console.error(`Next.js build aborted with ${result.signal}. Check the build log and cPanel PMEM/NPROC faults.`);
}

process.exit(result.status ?? 1);
