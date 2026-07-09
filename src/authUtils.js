// Lightweight client-side password hashing.
// No backend server exists in this app, so we can't do real bcrypt/argon2
// server-side hashing. This uses the browser's native Web Crypto API
// (SHA-256 with a random per-user salt) instead of storing plain text.
// It's a meaningful improvement over plaintext, but keep in mind anyone
// with your Supabase anon key and RLS set to "allow all" can still read
// the hashes — so don't reuse these passwords anywhere sensitive.

export function generateSalt() {
  // Random 16-byte salt, hex encoded
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Convenience: hash a fresh password + return both salt and hash for storage
export async function createCredentials(password) {
  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  return { salt, passwordHash };
}

// Convenience: verify a plaintext password against a stored salt+hash
export async function verifyPassword(password, salt, storedHash) {
  const hash = await hashPassword(password, salt);
  return hash === storedHash;
}
