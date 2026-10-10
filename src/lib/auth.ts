import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_hilokal_development_2026_xyz987";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const AUTH_COOKIE_NAME = "hilokal_auth_token";

export interface AuthTokenPayload {
  userId: string;
  username: string;
  email: string;
  isVip: boolean;
}

/**
 * Hash a plain-text password using bcrypt with 10 salt rounds
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

/**
 * Verify a plain-text password against a hashed password
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

/**
 * Generate a signed JWT token
 */
export function generateToken(payload: AuthTokenPayload): string {
  // @ts-expect-error - jsonwebtoken expiresIn type flexibility
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extract authenticated user payload from NextRequest (via cookie or Bearer header)
 */
export function getAuthUser(req: NextRequest): AuthTokenPayload | null {
  // 1. Check HTTP-only cookie
  const cookieToken = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieToken) {
    const payload = verifyToken(cookieToken);
    if (payload) return payload;
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const headerToken = authHeader.substring(7);
    const payload = verifyToken(headerToken);
    if (payload) return payload;
  }

  return null;
}

/**
 * Set HTTP-only secure cookie for authentication
 */
export function setAuthCookie(res: NextResponse, token: string): void {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
  });
}

/**
 * Clear authentication cookie
 */
export function clearAuthCookie(res: NextResponse): void {
  res.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
