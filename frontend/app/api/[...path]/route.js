async function proxyRequest(request, { params }) {
  const { path = [] } = await params;
  const apiBaseUrl = new URL(process.env.API_BASE_URL || 'http://localhost:5000');
  const backendPath = `${apiBaseUrl.pathname.replace(/\/$/, '')}/api/${path.join('/')}`;
  apiBaseUrl.pathname = backendPath;
  apiBaseUrl.search = new URL(request.url).search;

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');

  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  try {
    const response = await fetch(apiBaseUrl, {
      method: request.method,
      headers,
      body: body?.byteLength ? body : undefined,
      redirect: 'manual',
      cache: 'no-store'
    });

    const responseHeaders = new Headers(response.headers);
    responseHeaders.delete('content-encoding');
    responseHeaders.delete('content-length');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  } catch (error) {
    return Response.json({
      success: false,
      message: 'Backend API is unavailable.',
      error: error instanceof Error ? error.message : 'Unknown proxy error'
    }, { status: 502 });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const HEAD = proxyRequest;
export const OPTIONS = proxyRequest;
