import { authConfigured, createSession, isAuthenticated, verifyPassword } from '../src/lib/auth';

async function main() {
  process.env.ADMIN_PASSWORD = 'local-test-password-strong';
  process.env.SESSION_SECRET = 'local-test-secret-with-more-than-thirty-two-characters';
  if (!authConfigured()) throw new Error('Configuração de teste inválida');
  if (!await verifyPassword(process.env.ADMIN_PASSWORD)) throw new Error('Senha correta rejeitada');
  if (await verifyPassword('wrong-password')) throw new Error('Senha incorreta aceita');
  const { token } = await createSession();
  if (!await isAuthenticated(token)) throw new Error('Sessão válida rejeitada');
  if (await isAuthenticated(`${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`)) {
    throw new Error('Assinatura adulterada aceita');
  }
  console.log('Autenticação, sessão e rejeição de assinatura adulterada: OK');
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
