import { NextResponse } from 'next/server';

// Keep-warm endpoint. The backend is a SQLite-backed API that suffers slow cold
// starts; pinging /health on a schedule keeps the process and DB connection warm
// so real users don't eat the 8–15s cold start. Also warms the listings read path.
//
// Scheduling: the Hobby plan caps Vercel Cron at once/day, which is too infrequent
// to keep anything warm, so there is no cron in vercel.json. Drive this every few
// minutes from a free external uptime monitor (cron-job.org / UptimeRobot) hitting
// GET /api/keep-warm, or add a Vercel cron here after upgrading to Pro.
export const dynamic = 'force-dynamic';

const BACKEND = process.env.API_BASE_URL || 'http://174.165.78.29:8090/api';

export async function GET() {
  const t0 = Date.now();
  const ping = async (path: string) => {
    try {
      const res = await fetch(`${BACKEND}${path}`, { cache: 'no-store' });
      return res.status;
    } catch {
      return 0;
    }
  };

  const [health, filters] = await Promise.all([
    ping('/health'),
    ping('/wakalat/filters'),
  ]);

  const ms = Date.now() - t0;
  console.log(JSON.stringify({ ts: new Date().toISOString(), route: 'keep-warm', health, filters, ms }));

  return NextResponse.json(
    { ok: health === 200, health, filters, ms },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
