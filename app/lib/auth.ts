import crypto from "crypto";
import { COOKIE_NAME } from "./constants";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const password = process.env.DASHBOARD_PASSWORD;
  if (!password) throw new Error("DASHBOARD_PASSWORD env var is not set");
  return password;
}

/**
 * Verify a plain-text password against the env var.
 */
export function verifyPassword(input: string): boolean {
  const expected = process.env.DASHBOARD_PASSWORD?.trim();
  if (!expected) return false;
  const inputTrimmed = input.trim();
  if (inputTrimmed.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(inputTrimmed, "utf-8"),
    Buffer.from(expected, "utf-8")
  );
}

/**
 * Create an HMAC-signed session cookie value.
 * Format: `expiry.signature`
 */
export function createSessionCookie(): {
  value: string;
  expires: Date;
} {
  const expires = new Date(Date.now() + SEVEN_DAYS_MS);
  const payload = expires.getTime().toString();
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  return {
    value: `${payload}.${signature}`,
    expires,
  };
}

/**
 * Verify an HMAC-signed session cookie.
 * Returns true if the cookie is valid and not expired.
 */
export function verifySessionCookie(cookieValue: string): boolean {
  try {
    const [payload, signature] = cookieValue.split(".");
    if (!payload || !signature) return false;

    const secret = getSecret();
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    // Constant-time comparison for signature
    if (signature.length !== expectedSignature.length) return false;
    const valid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
    if (!valid) return false;

    // Check expiry
    const expiry = parseInt(payload, 10);
    if (isNaN(expiry) || Date.now() > expiry) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Cookie options for setting the session cookie.
 */
export function getCookieOptions(expires: Date) {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    expires,
  };
}
