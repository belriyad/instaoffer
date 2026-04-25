import { NextRequest, NextResponse } from 'next/server';

// Server-side only — never exposed to the browser
const BACKEND = process.env.API_BASE_URL || 'http://174.165.78.29:8090/api';

// Headers we do NOT forward to the backend
const HOP_BY_HOP = new Set([
  'host',
  'connection',
  'keep-alive',
  'transfer-encoding',
  'te',
  'trailer',
  'upgrade',
]);

async function handler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');

  // Preserve query string
  const search = req.nextUrl.search ?? '';
  const targetUrl = `${BACKEND}/${pathStr}${search}`;

  // Forward safe headers
  const forwardHeaders: Record<string, string> = {};
  req.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      forwardHeaders[key] = value;
    }
  });
  // Ensure host points at backend
  forwardHeaders['host'] = new URL(BACKEND).host;

  let body: BodyInit | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }

  const t0 = Date.now();
  let backendRes: Response;
  try {
    backendRes = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body,
      // Don't follow redirects — pass them through
      redirect: 'manual',
    });
  } catch (err) {
    const ms = Date.now() - t0;
    console.error(JSON.stringify({ ts: new Date().toISOString(), method: req.method, path: `/${pathStr}${search}`, status: 502, ms, error: String(err) }));
    return NextResponse.json({ message: 'Backend unreachable' }, { status: 502 });
  }

  const ms = Date.now() - t0;
  console.log(JSON.stringify({
    ts:     new Date().toISOString(),
    method: req.method,
    path:   `/${pathStr}${search}`,
    status: backendRes.status,
    ms,
  }));

  // Copy response headers (strip hop-by-hop)
  const resHeaders = new Headers();
  backendRes.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      resHeaders.set(key, value);
    }
  });

  const resBody = await backendRes.arrayBuffer();

  return new NextResponse(resBody, {
    status: backendRes.status,
    headers: resHeaders,
  });
}

export const GET     = handler;
export const POST    = handler;
export const PUT     = handler;
export const PATCH   = handler;
export const DELETE  = handler;
export const OPTIONS = handler;
