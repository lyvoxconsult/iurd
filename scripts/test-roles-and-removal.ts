import { authConfigured, createSession, getSession, isAuthenticated, leaderAuthConfigured, verifyRolePassword } from '../src/lib/auth';

async function main() {
  console.log('--- TESTE DE AUTORIZAÇÃO E PERFIS ---');

  process.env.ADMIN_PASSWORD = 'adm-test-password-123';
  process.env.LEADER_PASSWORD = '@obreiro123';
  process.env.SESSION_SECRET = 'super-secret-key-that-is-at-least-thirty-two-chars-long';

  if (!authConfigured()) throw new Error('authConfigured falhou');
  if (!leaderAuthConfigured()) throw new Error('leaderAuthConfigured falhou');

  // 1. Verificação de senhas por perfil
  if (!await verifyRolePassword('ADMIN', 'adm-test-password-123')) throw new Error('Senha correta de ADM foi rejeitada');
  if (await verifyRolePassword('ADMIN', 'wrong-pass')) throw new Error('Senha incorreta de ADM foi aceita');
  if (await verifyRolePassword('ADMIN', '@obreiro123')) throw new Error('Senha de líder foi aceita como ADM');

  if (!await verifyRolePassword('LEADER', '@obreiro123')) throw new Error('Senha correta de Líder foi rejeitada');
  if (await verifyRolePassword('LEADER', 'wrong-pass')) throw new Error('Senha incorreta de Líder foi aceita');
  if (await verifyRolePassword('LEADER', 'adm-test-password-123')) throw new Error('Senha de ADM foi aceita como Líder');

  // Teste de fallback seguro sem LEADER_PASSWORD definida no ambiente (caso Vercel)
  delete process.env.LEADER_PASSWORD;
  if (!await verifyRolePassword('LEADER', '@obreiro123')) throw new Error('Fallback seguro de Líder rejeitou a senha correta');
  if (await verifyRolePassword('LEADER', 'wrong-pass')) throw new Error('Fallback seguro de Líder aceitou senha incorreta');
  process.env.LEADER_PASSWORD = '@obreiro123';

  console.log('✓ Verificação de senhas e segregação de perfis (incluindo fallback seguro): OK');

  // 2. Criação de sessões assinadas com papel
  const adminSession = await createSession('ADMIN');
  const leaderSession = await createSession('LEADER');

  const decodedAdmin = await getSession(adminSession.token);
  if (!decodedAdmin || decodedAdmin.role !== 'ADMIN') throw new Error('Sessão ADM não decodificou perfil correto');

  const decodedLeader = await getSession(leaderSession.token);
  if (!decodedLeader || decodedLeader.role !== 'LEADER') throw new Error('Sessão Líder não decodificou perfil correto');

  console.log('✓ Emissão e decodificação de tokens com perfis (ADMIN e LEADER): OK');

  // 3. Rejeição de tokens adulterados
  const tamperedSig = `${leaderSession.token.slice(0, -1)}${leaderSession.token.endsWith('a') ? 'b' : 'a'}`;
  if (await getSession(tamperedSig)) throw new Error('Assinatura adulterada foi aceita');

  // Tentativa de elevação de privilégio: trocar LEADER por ADMIN no token mantendo a mesma assinatura
  const tamperedRole = leaderSession.token.replace('.LEADER.', '.ADMIN.');
  if (await getSession(tamperedRole)) throw new Error('Tentativa de elevação de privilégio (troca de role no token) foi aceita');

  console.log('✓ Rejeição de assinaturas adulteradas e proteção anti-tamper de perfil: OK');

  // 4. Rejeição de tokens legados (sem perfil assinado)
  const legacyToken = `${Math.floor(Date.now() / 1000) + 3600}.12345678901234567890123456789012.abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890`;
  if (await getSession(legacyToken)) throw new Error('Token legado sem role foi aceito indevidamente');
  if (await isAuthenticated(legacyToken)) throw new Error('isAuthenticated aceitou token legado');

  console.log('✓ Tratamento seguro de sessões antigas (rejeitadas sem promoção a ADM): OK');

  console.log('\nTodos os testes de perfil e segurança passaram com sucesso!');
}

main().catch((err) => {
  console.error('Falha nos testes:', err);
  process.exitCode = 1;
});
