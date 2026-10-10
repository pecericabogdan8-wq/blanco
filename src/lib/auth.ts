import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { prisma } from "@/lib/db";
import type { Role, User } from "@prisma/client";

const COOKIE = "blanco_session";
const SESSION_DAYS = 30;

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars)");
  }
  return new TextEncoder().encode(s);
}

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: Role;
  settings: Record<string, unknown>;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export function parseSettings(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function toSessionUser(user: User): SessionUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    role: user.role,
    settings: parseSettings(user.settings),
  };
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  await prisma.session.create({ data: { token, userId, expiresAt } });

  const jwt = await new SignJWT({ sid: token, sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());

  const jar = await cookies();
  jar.set(COOKIE, jwt, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });

  return token;
}

export async function destroySession() {
  const jar = await cookies();
  const jwt = jar.get(COOKIE)?.value;
  if (jwt) {
    try {
      const { payload } = await jwtVerify(jwt, secretKey());
      const sid = typeof payload.sid === "string" ? payload.sid : null;
      if (sid) {
        await prisma.session.deleteMany({ where: { token: sid } });
      }
    } catch {
      /* ignore */
    }
  }
  jar.delete(COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const jwt = jar.get(COOKIE)?.value;
  if (!jwt) return null;

  try {
    const { payload } = await jwtVerify(jwt, secretKey());
    const sid = typeof payload.sid === "string" ? payload.sid : null;
    const sub = typeof payload.sub === "string" ? payload.sub : null;
    if (!sid || !sub) return null;

    const session = await prisma.session.findUnique({
      where: { token: sid },
      include: { user: true },
    });
    if (!session || session.expiresAt < new Date() || session.userId !== sub) {
      return null;
    }
    return toSessionUser(session.user);
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Unauthorized", 401);
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AuthError("Forbidden", 403);
  return user;
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Stable payment integrity hash (not a password hash). */
export function paymentPayloadHash(parts: Record<string, string | number>) {
  const body = Object.keys(parts)
    .sort()
    .map((k) => `${k}=${parts[k]}`)
    .join("&");
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("AUTH_SECRET must be set (min 16 chars)");
  }
  return createHash("sha256").update(`${body}|${secret}`).digest("hex");
}

export function safeEqualHex(a: string, b: string) {
  try {
    const ba = Buffer.from(a, "hex");
    const bb = Buffer.from(b, "hex");
    if (ba.length !== bb.length) return false;
    return timingSafeEqual(ba, bb);
  } catch {
    return false;
  }
}
