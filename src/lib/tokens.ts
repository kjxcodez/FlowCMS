import crypto from "crypto";

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

export function generateReferralCode(name?: string): string {
  const prefix = name
    ? name.toLowerCase().replace(/[^a-z]/g, "").slice(0, 8)
    : "user";
  const suffix = crypto.randomBytes(3).toString("hex"); // 6 chars
  return `${prefix}-${suffix}`; // e.g. "kapil-a3f9c2"
}
