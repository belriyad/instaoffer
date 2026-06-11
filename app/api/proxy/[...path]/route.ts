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

const MAX_RETRIES = 3;
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
// SQLite contention / transient backend errors worth retrying.
const LOCK_RE = /database is locked|database table is locked|locked|busy|try again/i;

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

  // arrayBuffer is reusable across retries (immutable buffer)
  let body: ArrayBuffer | undefined;
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    body = await req.arrayBuffer();
  }
  const isSafe = req.method === 'GET' || req.method === 'HEAD';

  const t0 = Date.now();
  let backendRes: Response | null = null;
  let lastErr: unknown = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (attempt > 0) await sleep(120 * attempt); // 120/240/360ms backoff

    try {
      backendRes = await fetch(targetUrl, {
        method: req.method,
        headers: forwardHeaders,
        body,
        redirect: 'manual',
      });
    } catch (err) {
      lastErr = err;
      backendRes = null;
      if (isSafe && attempt < MAX_RETRIES) continue; // network blip — retry GETs
      break;
    }

    // Retry transient 5xx. For GET/HEAD any 5xx is safe to retry; for writes,
    // only retry a "database is locked" error (the write didn't commit).
    if (backendRes.status >= 500 && attempt < MAX_RETRIES) {
      const peek = await backendRes.clone().text().catch(() => '');
      const isLock = LOCK_RE.test(peek);
      const isTransient = backendRes.status === 502 || backendRes.status === 503;
      if (isLock || (isSafe && isTransient)) continue;
    }
    break;
  }

  const ms = Date.now() - t0;

  if (!backendRes) {
    console.error(JSON.stringify({ ts: new Date().toISOString(), method: req.method, path: `/${pathStr}${search}`, status: 502, ms, error: String(lastErr) }));
    return NextResponse.json({ message: 'The service is busy right now. Please try again in a moment.' }, { status: 503 });
  }

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

  // Sanitize raw DB/internal errors so they never reach end users.
  if (backendRes.status >= 500) {
    const text = new TextDecoder().decode(resBody);
    if (LOCK_RE.test(text) || /sqlite|traceback|exception/i.test(text)) {
      resHeaders.delete('content-length');
      resHeaders.set('content-type', 'application/json');
      return NextResponse.json(
        { message: 'The service is busy right now. Please try again in a moment.' },
        { status: 503, headers: resHeaders }
      );
    }
  }

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
