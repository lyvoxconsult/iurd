import { NextRequest, NextResponse } from 'next/server';
import { getSession, SESSION_COOKIE } from '@/lib/auth';

function isRestrictedToAdmin(pathname: string, method: string): boolean {
  // Operações de leitura (GET, HEAD, OPTIONS) são liberadas para todos os perfis autenticados
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return false;

  // A API de integrantes (/api/people) permite mutações para Líder e ADM (cadastro, edição e remoção/desativação)
  if (pathname === '/api/people') return false;

  // Todas as demais escritas (desafios, pontuações, estornos, gestão de rally, nações e tribos) são exclusivas do ADM
  return true;
}

export async function middleware(req: NextRequest) {
  // Rotas públicas de autenticação
  if (req.nextUrl.pathname.startsWith('/api/auth/')) return NextResponse.next();

  // Validar sessão e assinatura do perfil (sessões sem role assinada são rejeitadas)
  const session = await getSession(req.cookies.get(SESSION_COOKIE)?.value);
  if (!session) {
    return NextResponse.json(
      { error: 'Acesso não autorizado' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  // Verificação de origem para mutações
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    const origin = req.headers.get('origin');
    if (origin && origin !== req.nextUrl.origin) {
      return NextResponse.json({ error: 'Origem não autorizada' }, { status: 403 });
    }
  }

  // Autorização RBAC: bloquear operações exclusivas de ADM para perfil Líder
  if (session.role === 'LEADER' && isRestrictedToAdmin(req.nextUrl.pathname, req.method)) {
    return NextResponse.json(
      { error: 'Acesso negado: operação exclusiva para administradores (ADM).' },
      { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  return NextResponse.next();
}

export const config = { matcher: '/api/:path*' };
