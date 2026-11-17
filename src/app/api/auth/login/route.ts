import { NextRequest, NextResponse } from 'next/server';
import { authConfigured, createSession, SESSION_COOKIE, verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 });
  }
  if (!authConfigured()) return NextResponse.json({ error: 'Acesso administrativo não configurado' }, { status: 503 });
  let password: unknown;
  try { password = (await req.json()).password; } catch { return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 }); }
  if (typeof password !== 'string' || !await verifyPassword(password)) {
    return NextResponse.json({ error: 'Senha inválida' }, { status: 401 });
  }
  const { token, maxAge } = await createSession();
  const response = NextResponse.json({ authenticated: true });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: req.nextUrl.protocol === 'https:',
    path: '/',
    maxAge,
  });
  return response;
}
