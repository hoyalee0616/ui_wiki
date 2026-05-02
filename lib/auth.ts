import { createHash, createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "gomdol_admin_session";
const SECRET = process.env.ADMIN_SECRET ?? "fallback_dev_secret_key";
const MAX_AGE = 60 * 60 * 8; // 8시간

function hashPassword(password: string): string {
  return createHash("sha256").update(password + SECRET).digest("hex");
}

function signToken(payload: string): string {
  const sig = createHmac("sha256", SECRET).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

function verifyToken(token: string): string | null {
  const lastDot = token.lastIndexOf(".");
  if (lastDot === -1) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = createHmac("sha256", SECRET).update(payload).digest("hex");
  try {
    if (!timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"))) return null;
  } catch {
    return null;
  }
  return payload;
}

export function checkPassword(input: string): boolean {
  const stored = hashPassword(process.env.ADMIN_PASSWORD ?? "");
  const inputHash = hashPassword(input);
  try {
    return timingSafeEqual(Buffer.from(stored, "hex"), Buffer.from(inputHash, "hex"));
  } catch {
    return false;
  }
}

export function createSessionToken(): string {
  const payload = `admin:${Date.now()}`;
  return signToken(payload);
}

export function getSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: MAX_AGE,
    path: "/",
  };
}

export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const payload = verifyToken(token);
  if (!payload) return false;
  // 만료 확인 (8시간)
  const ts = parseInt(payload.split(":")[1] ?? "0", 10);
  return Date.now() - ts < MAX_AGE * 1000;
}

export { COOKIE_NAME };
