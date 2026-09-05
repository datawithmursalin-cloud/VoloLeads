import fs from 'node:fs/promises';
import path from 'node:path';

const allowedScripts = new Set(['app.js', 'icons.js']);

export async function GET(_request, { params }) {
  const { name } = await params;
  if (!allowedScripts.has(name)) {
    return new Response('Not found', { status: 404 });
  }

  const source = await fs.readFile(path.join(process.cwd(), name), 'utf8');
  return new Response(source, {
    headers: {
      'Cache-Control': 'public, max-age=60',
      'Content-Type': 'application/javascript; charset=utf-8'
    }
  });
}
