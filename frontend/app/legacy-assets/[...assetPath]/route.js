import fs from 'node:fs/promises';
import path from 'node:path';

const contentTypes = {
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

export async function GET(_request, { params }) {
  const { assetPath = [] } = await params;
  const relativePath = assetPath.join('/');
  if (!relativePath.startsWith('png/') && !relativePath.startsWith('audio/')) {
    return new Response('Not found', { status: 404 });
  }

  const root = path.resolve(process.cwd());
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const file = await fs.readFile(filePath);
    return new Response(file, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
