import crypto from "crypto";

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex"); // 64 chars
}

export function signPayload(payload: unknown): string {
  const secret = process.env.BETTER_AUTH_SECRET!;
  const data = JSON.stringify(payload);
  const signature = crypto
    .createHmac("sha256", secret)
    .update(data)
    .digest("hex");
  
  return Buffer.from(JSON.stringify({ data, signature })).toString("base64");
}

export function verifyPayload<T = unknown>(tokenValue: string): T | null {
  try {
    const secret = process.env.BETTER_AUTH_SECRET!;
    const parsed = JSON.parse(
      Buffer.from(tokenValue, "base64").toString()
    );

    if (!parsed || typeof parsed !== "object" || !("data" in parsed) || !("signature" in parsed)) {
      return null;
    }

    const { data, signature } = parsed as { data: string; signature: string };
    if (typeof data !== "string" || typeof signature !== "string") {
      return null;
    }
    
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(data)
      .digest("hex");
    
    const sigBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (sigBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return null;
    }
    
    return JSON.parse(data) as T;
  } catch {
    return null;
  }
}

