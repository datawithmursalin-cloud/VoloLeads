import fs from 'node:fs/promises';
import path from 'node:path';

const contentTypes = {
  '.mp3': 'audio/mpeg',
  '.png': 'image/png',
  '.webp': 'image/webp'
};

export async function GET(_request, { params }) {
  const { assetPath = [] } = await params;
  const [directory, ...segments] = assetPath;
  if (!['png', 'audio'].includes(directory) || segments.length === 0 ||
      segments.some(segment => !segment || segment === '.' || segment === '..' || /[\\/]/.test(segment))) {
    return new Response('Not found', { status: 404 });
  }

  // Keep each filesystem read anchored to a literal asset directory for tracing.
  const relativePath = segments.join('/');
  try {
    const file = directory === 'png'
      ? await fs.readFile(path.join(process.cwd(), 'png', relativePath))
      : await fs.readFile(path.join(process.cwd(), 'audio', relativePath));
    return new Response(file, {
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Type': contentTypes[path.extname(relativePath).toLowerCase()] || 'application/octet-stream'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
