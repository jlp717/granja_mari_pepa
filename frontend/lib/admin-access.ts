const encoder = () => new TextEncoder();

export const ADMIN_ACCESS_COOKIE = "gmp_admin_access";
export const ADMIN_ACCESS_DAYS = 30;

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (let i = 0; i < bytes.length; i += 1) {
    out += bytes[i].toString(16).padStart(2, "0");
  }
  return out;
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder().encode(payload),
  );
  return toHex(new Uint8Array(signature));
}

function randomHex(size: number): string {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

/** Token format: v1.<expEpochSeconds>.<nonce>.<hmacHex>. Stateless and revocable
 * by rotating ADMIN_ACCESS_SECRET. */
export async function createAdminAccessToken(
  secret: string,
  days = ADMIN_ACCESS_DAYS,
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + days * 86400;
  const payload = `v1.${exp}.${randomHex(8)}`;
  return `${payload}.${await hmacHex(secret, payload)}`;
}

export async function verifyAdminAccessToken(
  token: string,
  secret: string,
): Promise<boolean> {
  if (!secret || secret.length < 32) return false;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return false;
  const exp = Number(parts[1]);
  if (!Number.isFinite(exp) || exp <= Math.floor(Date.now() / 1000)) {
    return false;
  }
  const expected = await hmacHex(secret, `${parts[0]}.${parts[1]}.${parts[2]}`);
  if (expected.length !== parts[3].length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i += 1) {
    diff |= expected.charCodeAt(i) ^ parts[3].charCodeAt(i);
  }
  return diff === 0;
}
