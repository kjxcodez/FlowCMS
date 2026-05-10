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

export function signInvitePayload(payload: any): string {
  const secret = process.env.BETTER_AUTH_SECRET!;
  const data = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
  
  return Buffer.from(JSON.stringify({ data, signature })).toString("base64");
}

export function verifyInvitePayload(cookieValue: string): any | null {
  try {
    const secret = process.env.BETTER_AUTH_SECRET!;
    const { data, signature } = JSON.parse(
      Buffer.from(cookieValue, "base64").toString()
    );
    
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("hex");
    
    if (signature !== expectedSignature) return null;
    
    return JSON.parse(data);
  } catch {
    return null;
  }
}
