import fs from "fs";
import path from "path";

const envPath = path.resolve(__dirname, "../apps/app/.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { captureCriticalError, normalizeErrorMessage, generateErrorFingerprint } from "../apps/app/src/lib/errors/capture-critical-error";
import { prisma } from "../apps/app/src/lib/prisma";

async function runCriticalErrorTests() {
  console.log("==================================================");
  console.log("   RUNNING FLOWCMS CRITICAL ERROR SYSTEM TESTS    ");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(name: string, condition: boolean, message?: string) {
    if (condition) {
      console.log(`  ✓ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${name}${message ? ` - ${message}` : ""}`);
      failed++;
    }
  }

  const suffix = Math.random().toString(36).substring(7);
  const testRoute = `/api/test/critical-${suffix}`;
  const testOperation = `testOperation_${suffix}`;

  try {
    // -----------------------------------------------------------------
    // Test 1: Message Normalization & Fingerprinting
    // -----------------------------------------------------------------
    {
      const rawMsg1 = "Database connection failed for workspace ws_123456789012345678901234 on item 42";
      const rawMsg2 = "Database connection failed for workspace ws_987654321098765432109876 on item 999";
      
      const norm1 = normalizeErrorMessage(rawMsg1);
      const norm2 = normalizeErrorMessage(rawMsg2);

      assert(
        "Dynamic IDs and numbers are normalized to identical template string",
        norm1 === norm2,
        `Norm1: "${norm1}", Norm2: "${norm2}"`
      );

      const fp1 = generateErrorFingerprint("DatabaseError", norm1, "/api/v1/test", "dbQuery");
      const fp2 = generateErrorFingerprint("DatabaseError", norm2, "/api/v1/test", "dbQuery");

      assert("Normalized errors produce identical fingerprint SHA256", fp1 === fp2, `fp1: ${fp1}, fp2: ${fp2}`);
    }

    // -----------------------------------------------------------------
    // Test 2: First Error Occurrence Persistence
    // -----------------------------------------------------------------
    const uniqueErrMessage = `Simulated primary database failure ${suffix}`;
    const firstError = new Error(uniqueErrMessage);

    await captureCriticalError(firstError, {
      route: testRoute,
      method: "POST",
      operation: testOperation,
      requestId: `req_${suffix}`,
      metadata: { debugFlag: true, sensitiveToken: "bearer_secret_12345" },
    });

    const expectedFp = generateErrorFingerprint("Error", normalizeErrorMessage(uniqueErrMessage), testRoute, testOperation);
    const dbRecord = await prisma.criticalError.findUnique({ where: { fingerprint: expectedFp } });

    assert("First occurrence creates database record", !!dbRecord, `Fingerprint: ${expectedFp}`);
    if (dbRecord) {
      assert("occurrenceCount is 1 on first occurrence", dbRecord.occurrenceCount === 1, `Count: ${dbRecord.occurrenceCount}`);
      assert("Initial status is OPEN", dbRecord.status === "OPEN", `Status: ${dbRecord.status}`);
      assert("Route & method are correctly saved", dbRecord.route === testRoute && dbRecord.method === "POST");
      
      // Test 5: Sensitive Metadata Key Sanitization
      const meta = dbRecord.metadata as Record<string, unknown> | null;
      assert("Normal metadata keys are preserved", meta?.debugFlag === true);
      assert("Sensitive token in metadata is sanitized to [REDACTED]", meta?.sensitiveToken === "[REDACTED]", `Actual: ${JSON.stringify(meta)}`);
    }

    // -----------------------------------------------------------------
    // Test 3: Duplicate Error Aggregation
    // -----------------------------------------------------------------
    // Short wait to ensure timestamp diff if any
    await new Promise((r) => setTimeout(r, 50));

    // Capture second occurrence of the same error
    await captureCriticalError(new Error(uniqueErrMessage), {
      route: testRoute,
      method: "POST",
      operation: testOperation,
      requestId: `req_${suffix}_2`,
    });

    const updatedRecord = await prisma.criticalError.findUnique({ where: { fingerprint: expectedFp } });
    assert("Duplicate occurrence updates existing record instead of creating new row", !!updatedRecord);
    if (updatedRecord) {
      assert("occurrenceCount is incremented to 2", updatedRecord.occurrenceCount === 2, `Count: ${updatedRecord.occurrenceCount}`);
      assert("lastSeenAt is updated", updatedRecord.lastSeenAt >= updatedRecord.firstSeenAt);
    }

    // -----------------------------------------------------------------
    // Test 4: Different Error Creates Separate Record
    // -----------------------------------------------------------------
    const differentError = new TypeError(`Different type error ${suffix}`);
    await captureCriticalError(differentError, {
      route: testRoute,
      method: "GET",
      operation: "differentOp",
    });

    const diffFp = generateErrorFingerprint("TypeError", normalizeErrorMessage(differentError.message), testRoute, "differentOp");
    const diffRecord = await prisma.criticalError.findUnique({ where: { fingerprint: diffFp } });
    assert("Different error creates a distinct database record", !!diffRecord && diffRecord.fingerprint !== expectedFp);

    // -----------------------------------------------------------------
    // Test 5: Fail-Safe Handling (Does Not Throw on Invalid Input / Failure)
    // -----------------------------------------------------------------
    let throwOccurred = false;
    try {
      // Pass null/circular objects / unexpected inputs to verify no thrown error
      const circular: any = {};
      circular.self = circular;
      await captureCriticalError(circular, { route: "invalid", metadata: circular });
    } catch {
      throwOccurred = true;
    }
    assert("captureCriticalError never throws outward exception on internal failure", !throwOccurred);

    // Clean up created test error records
    await prisma.criticalError.deleteMany({
      where: {
        fingerprint: { in: [expectedFp, diffFp] },
      },
    }).catch(() => {});

  } catch (err) {
    console.error("Unhandled test runner error:", err);
    failed++;
  }

  console.log("\n==================================================");
  console.log(`   CRITICAL ERROR TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runCriticalErrorTests().catch((err) => {
  console.error("Unhandled rejection in test runner:", err);
  process.exit(1);
});
