import { NextRequest, NextResponse } from 'next/server';
import { isAuthenticated, SESSION_COOKIE } from '@/lib/auth';

export async function middleware(req: NextRequest) {
  if (req.nextUrl.pathname.startsWith('/api/auth/')) return NextResponse.next();
  if (!await isAuthenticated(req.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Acesso não autorizado' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 });
    }
  }
  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
