import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Generic server-side proxy — browsers call /api/proxy, this server
 * forwards the request to the real subqdocs backend (server→server, no CORS).
 *
 * Request body shape:
 * {
 *   method:  'GET' | 'POST' | ...
 *   url:     'https://dev-api.subqdocs.ai/admin/login'   (full target URL)
 *   headers: { ... }   (optional, forwarded as-is)
 *   body:    { ... }   (optional, forwarded for POST/PUT/PATCH)
 *   params:  { ... }   (optional, appended as query-string for GET)
 * }
 */
export async function POST(req: NextRequest) {
  let parsed: {
    method?: string;
    url?: string;
    headers?: Record<string, string>;
    body?: unknown;
    params?: Record<string, string>;
  };

  try {
    parsed = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { method = 'GET', url, headers = {}, body, params } = parsed;

  if (!url) {
    return NextResponse.json({ error: '`url` is required' }, { status: 400 });
  }

  // Build the target URL with optional query params
  let targetUrl: URL;
  try {
    targetUrl = new URL(url);
  } catch {
    return NextResponse.json({ error: `Invalid URL: ${url}` }, { status: 400 });
  }

  if (params) {
    Object.entries(params).forEach(([k, v]) => targetUrl.searchParams.set(k, v));
  }

  // Forward the request server-side (bypasses CORS completely)
  try {
    const upstream = await fetch(targetUrl.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...headers,
      },
      ...(body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())
        ? { body: JSON.stringify(body) }
        : {}),
    });

    const contentType = upstream.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');
    const data = isJson ? await upstream.json() : await upstream.text();

    return NextResponse.json(
      { success: upstream.ok, status: upstream.status, data },
      { status: upstream.ok ? 200 : upstream.status }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Upstream request failed';
    console.error('[proxy] Error:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
