import { NextRequest, NextResponse } from 'next/server';
import { authConfigured, getSession, leaderAuthConfigured, SESSION_COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const session = await getSession(req.cookies.get(SESSION_COOKIE)?.value);
  return NextResponse.json({
    configured: authConfigured(),
    leaderConfigured: leaderAuthConfigured(),
    authenticated: !!session,
    role: session?.role || null,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
