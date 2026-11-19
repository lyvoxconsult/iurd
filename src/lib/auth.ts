export const SESSION_COOKIE = 'iurd_admin_session';
const SESSION_SECONDS = 60 * 60 * 12;

export type UserRole = 'ADMIN' | 'LEADER';

export function authConfigured() {
  return !!process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 8 &&
    !!process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32;
}

export function leaderAuthConfigured() {
  return !!process.env.LEADER_PASSWORD && process.env.LEADER_PASSWORD.length >= 8;
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function hexToBytes(value: string) {
  if (!/^[0-9a-f]{64}$/.test(value)) return null;
  return Uint8Array.from(value.match(/../g)!, (part) => parseInt(part, 16));
}

async function hmacKey() {
  return crypto.subtle.importKey('raw', new TextEncoder().encode(process.env.SESSION_SECRET!),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function verifyRolePassword(role: UserRole, password: string) {
  if (!authConfigured()) return false;
  const expectedPassword = role === 'ADMIN' ? process.env.ADMIN_PASSWORD : process.env.LEADER_PASSWORD;
  if (!expectedPassword) return false;
  const encoder = new TextEncoder();
  const [given, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
    crypto.subtle.digest('SHA-256', encoder.encode(expectedPassword)),
  ]);
  const a = new Uint8Array(given);
  const b = new Uint8Array(expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function verifyPassword(password: string) {
  return verifyRolePassword('ADMIN', password);
}

export async function createSession(role: UserRole = 'ADMIN') {
  if (!authConfigured()) throw new Error('Autenticação não configurada');
  const expiry = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${expiry}.${nonce}.${role}`;
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(payload));
  return { token: `${payload}.${bytesToHex(new Uint8Array(signature))}`, maxAge: SESSION_SECONDS, role };
}

export async function getSession(token: string | undefined): Promise<{ role: UserRole; expiry: number } | null> {
  if (!authConfigured() || !token) return null;
  // Tokens válidos devem conter explicitamente o perfil assinado (ADMIN ou LEADER).
  // Tokens legados sem perfil são rejeitados para evitar promoção indevida a ADM.
  const match = /^(\d{10})\.([0-9a-f]{32})\.(ADMIN|LEADER)\.([0-9a-f]{64})$/.exec(token);
  if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return null;
  const signature = hexToBytes(match[4]);
  if (!signature) return null;
  const valid = await crypto.subtle.verify('HMAC', await hmacKey(), signature,
    new TextEncoder().encode(`${match[1]}.${match[2]}.${match[3]}`));
  if (!valid) return null;
  return { role: match[3] as UserRole, expiry: Number(match[1]) };
}

export async function isAuthenticated(token: string | undefined) {
  return (await getSession(token)) !== null;
}
