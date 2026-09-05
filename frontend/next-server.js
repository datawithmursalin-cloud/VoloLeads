const http = require('http');
const next = require('next');

const port = Number.parseInt(process.env.PORT || '3000', 10);
const app = next({
  dev: false,
  hostname: '0.0.0.0',
  port
});
const handle = app.getRequestHandler();

app.prepare()
  .then(() => {
    http.createServer((request, response) => handle(request, response))
      .listen(port, '0.0.0.0', () => {
        console.log(`Next.js frontend running on port ${port}`);
      });
  })
  .catch(error => {
    console.error('Unable to start the Next.js frontend:', error);
    process.exitCode = 1;
  });
