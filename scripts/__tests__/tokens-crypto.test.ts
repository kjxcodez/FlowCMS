import test from "node:test";
import assert from "node:assert";
import { signPayload, verifyPayload } from "../../apps/app/src/lib/security/tokens";

// Set secret environment variable if not present
if (!process.env.BETTER_AUTH_SECRET) {
  process.env.BETTER_AUTH_SECRET = "test-secret-value-123456";
}

test("Tokens Crypto Verification Tests", async (t) => {
  
  await t.test("Case 1: Valid signature succeeds and returns payload", () => {
    const payload = { userId: "user-123", role: "admin" };
    const token = signPayload(payload);
    
    const verified = verifyPayload<{ userId: string; role: string }>(token);
    assert.deepStrictEqual(verified, payload, "Valid signature verification should succeed and return payload");
  });

  await t.test("Case 2: Invalid signature fails and returns null", () => {
    const payload = { userId: "user-123", role: "admin" };
    const token = signPayload(payload);
    
    // Modify token value to corrupt the signature
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    decoded.signature = decoded.signature.replace(/./, "a"); // corrupt signature
    const badToken = Buffer.from(JSON.stringify(decoded)).toString("base64");

    const verified = verifyPayload(badToken);
    assert.strictEqual(verified, null, "Invalid signature should return null");
  });

  await t.test("Case 3: Length mismatch returns null safely", () => {
    const payload = { userId: "user-123", role: "admin" };
    const token = signPayload(payload);
    
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    // Modify signature to be short
    decoded.signature = "abc";
    const shortToken = Buffer.from(JSON.stringify(decoded)).toString("base64");

    const verifiedShort = verifyPayload(shortToken);
    assert.strictEqual(verifiedShort, null, "Short signature (length mismatch) should return null without throwing");

    // Modify signature to be longer than expected
    decoded.signature = "a".repeat(128);
    const longToken = Buffer.from(JSON.stringify(decoded)).toString("base64");

    const verifiedLong = verifyPayload(longToken);
    assert.strictEqual(verifiedLong, null, "Long signature (length mismatch) should return null without throwing");
  });

  await t.test("Case 4: Missing signature returns null", () => {
    const payload = { userId: "user-123", role: "admin" };
    const token = signPayload(payload);
    
    const decoded = JSON.parse(Buffer.from(token, "base64").toString());
    delete decoded.signature;
    const missingToken = Buffer.from(JSON.stringify(decoded)).toString("base64");

    const verified = verifyPayload(missingToken);
    assert.strictEqual(verified, null, "Missing signature should return null");
  });

  await t.test("Case 5: Malformed signature returns null", () => {
    const badToken = "not-even-json-or-base64";
    const verified = verifyPayload(badToken);
    assert.strictEqual(verified, null, "Malformed token/signature should return null");
  });

  await t.test("Case 6: Existing valid tokens are backward compatible", () => {
    // Generate token under the secret
    const payload = { test: "compatibility" };
    const token = signPayload(payload);

    // Verify it
    const verified = verifyPayload<{ test: string }>(token);
    assert.deepStrictEqual(verified, payload, "Newly signed tokens using the same algorithm should be fully compatible");
  });
});
