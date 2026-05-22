import crypto from "crypto";

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

export function signPayload(payload: any): string { // eslint-disable-line @typescript-eslint/no-explicit-any
  const secret = process.env.BETTER_AUTH_SECRET!;
  const data = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
  
  return Buffer.from(JSON.stringify({ data, signature })).toString("base64");
}

export function verifyPayload(tokenValue: string): any | null { // eslint-disable-line @typescript-eslint/no-explicit-any
  try {
    const secret = process.env.BETTER_AUTH_SECRET!;
    const { data, signature } = JSON.parse(
      Buffer.from(tokenValue, "base64").toString()
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
