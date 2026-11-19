import { NextRequest } from 'next/server';
import { middleware } from '../src/middleware';
import { createSession, SESSION_COOKIE } from '../src/lib/auth';

async function main() {
  console.log('--- TESTE DA MATRIZ RBAC NO MIDDLEWARE ---');

  process.env.ADMIN_PASSWORD = 'adm-test-password-123';
  process.env.LEADER_PASSWORD = '@obreiro123';
  process.env.SESSION_SECRET = 'super-secret-key-that-is-at-least-thirty-two-chars-long';

  const adminSession = await createSession('ADMIN');
  const leaderSession = await createSession('LEADER');

  // 1. Chamada sem cookie -> 401
  const reqNoAuth = new NextRequest('http://localhost:3000/api/people');
  const resNoAuth = await middleware(reqNoAuth);
  if (resNoAuth.status !== 401) throw new Error(`Sem auth deveria retornar 401, retornou ${resNoAuth.status}`);
  console.log('✓ Sem autenticação -> 401 Unauthorized');

  // 2. Líder tentando rotas restritas de escrita -> 403
  const restrictedLeaderOperations = [
    { path: '/api/challenges', method: 'POST' },
    { path: '/api/scores/challenge', method: 'POST' },
    { path: '/api/scores/leader', method: 'POST' },
    { path: '/api/scores/void', method: 'POST' },
    { path: '/api/rally', method: 'POST' },
    { path: '/api/nations', method: 'PUT' },
    { path: '/api/tribes', method: 'POST' },
    { path: '/api/tribes', method: 'PUT' },
    { path: '/api/tribes', method: 'DELETE' },
  ];

  for (const op of restrictedLeaderOperations) {
    const req = new NextRequest(`http://localhost:3000${op.path}`, {
      method: op.method,
      headers: {
        cookie: `${SESSION_COOKIE}=${leaderSession.token}`,
        origin: 'http://localhost:3000',
      },
    });
    const res = await middleware(req);
    if (res.status !== 403) {
      throw new Error(`Líder em ${op.method} ${op.path} deveria retornar 403, retornou ${res.status}`);
    }
  }
  console.log('✓ Líder bloqueado (403) em todas as operações de escrita restritas');

  // 3. Líder em operações permitidas de leitura e gestão de integrantes -> next()
  const allowedLeaderOperations = [
    { path: '/api/rankings', method: 'GET' },
    { path: '/api/challenges', method: 'GET' },
    { path: '/api/history', method: 'GET' },
    { path: '/api/rally', method: 'GET' },
    { path: '/api/nations', method: 'GET' },
    { path: '/api/tribes', method: 'GET' },
    { path: '/api/people', method: 'GET' },
    { path: '/api/people', method: 'POST' },
    { path: '/api/people', method: 'PUT' },
    { path: '/api/people', method: 'DELETE' },
  ];

  for (const op of allowedLeaderOperations) {
    const req = new NextRequest(`http://localhost:3000${op.path}`, {
      method: op.method,
      headers: {
        cookie: `${SESSION_COOKIE}=${leaderSession.token}`,
        origin: 'http://localhost:3000',
      },
    });
    const res = await middleware(req);
    // NextResponse.next() tem status 200 e headers sem erro
    if (res.status !== 200) {
      throw new Error(`Líder em ${op.method} ${op.path} deveria ser permitido, retornou ${res.status}`);
    }
  }
  console.log('✓ Líder autorizado em leitura e em gestão de integrantes (/api/people)');

  // 4. ADM em operações de escrita -> next()
  for (const op of restrictedLeaderOperations) {
    const req = new NextRequest(`http://localhost:3000${op.path}`, {
      method: op.method,
      headers: {
        cookie: `${SESSION_COOKIE}=${adminSession.token}`,
        origin: 'http://localhost:3000',
      },
    });
    const res = await middleware(req);
    if (res.status !== 200) {
      throw new Error(`ADM em ${op.method} ${op.path} deveria ser permitido, retornou ${res.status}`);
    }
  }
  console.log('✓ ADM autorizado em todas as operações de escrita');

  console.log('\nMatriz de permissões RBAC validada com sucesso!');
}

main().catch((err) => {
  console.error('Falha no teste RBAC:', err);
  process.exitCode = 1;
});
