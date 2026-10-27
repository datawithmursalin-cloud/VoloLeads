import fs from 'node:fs/promises';
import path from 'node:path';

const readScripts = {
  'app.js': () => fs.readFile(path.join(process.cwd(), 'app.js'), 'utf8'),
  'icons.js': () => fs.readFile(path.join(process.cwd(), 'icons.js'), 'utf8')
};

export async function GET(_request, { params }) {
  const { name } = await params;
  if (!Object.hasOwn(readScripts, name)) {
    return new Response('Not found', { status: 404 });
  }

  const source = await readScripts[name]();
  return new Response(source, {
    headers: {
      'Cache-Control': 'public, max-age=60',
      'Content-Type': 'application/javascript; charset=utf-8'
    }
  });
}
