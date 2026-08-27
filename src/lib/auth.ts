import "server-only";
import { createHmac, timingSafeEqual, randomBytes } from "node:crypto";
import { cookies } from "next/headers";

export const COOKIE = "pnc_admin";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

/** The password from the brief. Override in production with ADMIN_PASSWORD. */
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "weed";

/**
 * Signing secret. Set ADMIN_SECRET in production so sessions survive restarts;
 * otherwise it is derived from the password, which is stable but weaker.
 */
const SECRET =
  process.env.ADMIN_SECRET || `pnc-${ADMIN_PASSWORD}-session-signing-key`;

function sign(payload: string): string {
  return createHmac("sha256", SECRET).update(payload).digest("base64url");
}

export function issueToken(): string {
  const payload = `${Date.now() + MAX_AGE_SECONDS * 1000}.${randomBytes(8).toString("hex")}`;
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token: string | undefined): boolean {
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return false;
  const payload = token.slice(0, lastDot);
  const provided = Buffer.from(token.slice(lastDot + 1));
  const expected = Buffer.from(sign(payload));
  if (provided.length !== expected.length) return false;
  if (!timingSafeEqual(provided, expected)) return false;
  const expiresAt = Number(payload.split(".")[0]);
  return Number.isFinite(expiresAt) && expiresAt > Date.now();
}

export function checkPassword(candidate: unknown): boolean {
  if (typeof candidate !== "string") return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(ADMIN_PASSWORD);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function isAuthed(): Promise<boolean> {
  const jar = await cookies();
  return verifyToken(jar.get(COOKIE)?.value);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE_SECONDS,
};
