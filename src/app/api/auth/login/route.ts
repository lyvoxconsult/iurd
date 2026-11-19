import { NextRequest, NextResponse } from 'next/server';
import { authConfigured, createSession, SESSION_COOKIE, UserRole, verifyRolePassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (origin && origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 });
  }
  if (!authConfigured()) return NextResponse.json({ error: 'Acesso administrativo não configurado' }, { status: 503 });

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
  }

  const role: UserRole = body.role === 'LEADER' ? 'LEADER' : 'ADMIN';
  const password = body.password;

  if (typeof password !== 'string' || !await verifyRolePassword(role, password)) {
    return NextResponse.json({ error: 'Senha inválida' }, { status: 401 });
  }

  const { token, maxAge } = await createSession(role);
  const response = NextResponse.json({ authenticated: true, role });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: req.nextUrl.protocol === 'https:',
    path: '/',
    maxAge,
  });
  return response;
}
