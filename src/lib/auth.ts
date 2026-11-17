export const SESSION_COOKIE = 'iurd_admin_session';
const SESSION_SECONDS = 60 * 60 * 12;

export function authConfigured() {
  return !!process.env.ADMIN_PASSWORD && process.env.ADMIN_PASSWORD.length >= 12 &&
    !!process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32;
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

export async function verifyPassword(password: string) {
  if (!authConfigured()) return false;
  const encoder = new TextEncoder();
  const [given, expected] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(password)),
    crypto.subtle.digest('SHA-256', encoder.encode(process.env.ADMIN_PASSWORD!)),
  ]);
  const a = new Uint8Array(given);
  const b = new Uint8Array(expected);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}

export async function createSession() {
  if (!authConfigured()) throw new Error('Autenticação não configurada');
  const expiry = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const nonce = bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${expiry}.${nonce}`;
  const signature = await crypto.subtle.sign('HMAC', await hmacKey(), new TextEncoder().encode(payload));
  return { token: `${payload}.${bytesToHex(new Uint8Array(signature))}`, maxAge: SESSION_SECONDS };
}

export async function isAuthenticated(token: string | undefined) {
  if (!authConfigured() || !token) return false;
  const match = /^(\d{10})\.([0-9a-f]{32})\.([0-9a-f]{64})$/.exec(token);
  if (!match || Number(match[1]) <= Math.floor(Date.now() / 1000)) return false;
  const signature = hexToBytes(match[3]);
  if (!signature) return false;
  return crypto.subtle.verify('HMAC', await hmacKey(), signature,
    new TextEncoder().encode(`${match[1]}.${match[2]}`));
}
