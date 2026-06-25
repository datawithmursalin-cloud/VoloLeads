require('dotenv').config();
const http = require('http');
const { URL } = require('url');
const { google } = require('googleapis');

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
const REDIRECT_URI = 'http://localhost:3333/oauth2callback';
const PORT = 3333;

function parseAuthCodeFromArgs() {
  for (const arg of process.argv.slice(2)) {
    if (arg.startsWith('--code=')) {
      return arg.slice('--code='.length).trim();
    }

    if (arg.startsWith('--url=')) {
      const callbackUrl = new URL(arg.slice('--url='.length).trim());
      return callbackUrl.searchParams.get('code');
    }
  }

  return null;
}

function waitForAuthCode() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${PORT}`);

        if (url.pathname !== '/oauth2callback') {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('Not found');
          return;
        }

        const error = url.searchParams.get('error');
        if (error) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end(`<h1>Authorization failed: ${error}</h1><p>Close this tab and run the setup script again.</p>`);
          server.close();
          reject(new Error(error));
          return;
        }

        const code = url.searchParams.get('code');
        if (!code) {
          res.writeHead(400, { 'Content-Type': 'text/html' });
          res.end('<h1>Missing authorization code.</h1>');
          return;
        }

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Google Calendar connected.</h1><p>You can close this tab and return to the terminal.</p>');
        server.close();
        resolve(code);
      } catch (err) {
        server.close();
        reject(err);
      }
    });

    server.on('error', reject);
    server.listen(PORT, '127.0.0.1');
  });
}

async function exchangeCode(oauth2Client, code) {
  const { tokens } = await oauth2Client.getToken(code);

  if (!tokens.refresh_token) {
    console.error('\nNo refresh token returned.');
    console.error('Revoke prior access at https://myaccount.google.com/permissions');
    console.error('Then run: npm run setup:google-calendar');
    process.exit(1);
  }

  console.log('\nAdd these lines to backend/.env:\n');
  console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
  console.log('GOOGLE_CALENDAR_ID=primary');
  console.log('CONTACT_EMAIL=vololeads@gmail.com');
  console.log('\nAlso add GOOGLE_REFRESH_TOKEN to production cPanel env and restart the Node app.');
}

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.error('Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in backend/.env first.');
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    clientSecret,
    REDIRECT_URI
  );

  const codeFromArgs = parseAuthCodeFromArgs();
  if (codeFromArgs) {
    await exchangeCode(oauth2Client, codeFromArgs);
    return;
  }

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES
  });

  console.log('\nGoogle Calendar setup for vololeads@gmail.com\n');
  console.log('1. Open this URL in your browser');
  console.log('2. Sign in as vololeads@gmail.com (not a personal alias)');
  console.log('3. Allow calendar access when prompted\n');
  console.log(authUrl);
  console.log('\nWaiting for authorization on http://localhost:3333 ...\n');

  const code = await waitForAuthCode();
  await exchangeCode(oauth2Client, code);
}

main().catch((error) => {
  console.error(`Setup failed: ${error.message}`);
  process.exit(1);
});
