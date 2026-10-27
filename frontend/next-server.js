const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { createRequire } = require('node:module');

// Resolve the pointer once. Existing Passenger workers keep serving their own
// complete release while a new worker starts with the newly promoted release.
const applicationRoot = __dirname;
const pointer = path.join(applicationRoot, 'current');
let pointerExists = false;
try {
  fs.lstatSync(pointer);
  pointerExists = true;
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
// A dangling pointer fails closed instead of serving an unrelated build.
const releaseRoot = pointerExists ? fs.realpathSync(pointer) : applicationRoot;

const releaseRequire = createRequire(path.join(releaseRoot, 'package.json'));
releaseRequire('@next/env').loadEnvConfig(applicationRoot);
const next = releaseRequire('next');
const buildId = fs.readFileSync(path.join(releaseRoot, '.next', 'BUILD_ID'), 'utf8').trim();
process.chdir(releaseRoot);

const port = Number.parseInt(process.env.PORT || '3000', 10);
const hostname = process.env.VOLOLEADS_BIND_ADDRESS || '0.0.0.0';
const app = next({
  dev: false,
  dir: releaseRoot,
  hostname,
  port,
});
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    const server = http.createServer((request, response) => {
      response.setHeader('X-VoloLeads-Build', buildId);
      return handle(request, response);
    });
    server.on('error', error => {
      console.error(`Unable to listen for frontend requests: ${error.message}`);
      process.exitCode = 1;
    });
    server.listen(port, hostname, () => {
      // Passenger can intercept listen() and return a non-TCP address.
      const address = server.address();
      const listeningPort = address && typeof address === 'object' ? address.port : port;
      console.log(`VoloLeads frontend listening: ${listeningPort}`);
    });
  })
  .catch(error => {
    console.error('Unable to start the Next.js frontend:', error);
    process.exitCode = 1;
  });
