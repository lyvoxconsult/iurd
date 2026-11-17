import { NextRequest, NextResponse } from 'next/server';
import { authConfigured, isAuthenticated, SESSION_COOKIE } from '@/lib/auth';

export async function GET(req: NextRequest) {
  return NextResponse.json({
    configured: authConfigured(),
    authenticated: await isAuthenticated(req.cookies.get(SESSION_COOKIE)?.value),
  }, { headers: { 'Cache-Control': 'no-store' } });
}
