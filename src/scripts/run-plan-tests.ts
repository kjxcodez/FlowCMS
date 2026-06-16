import { Plan } from "../generated/prisma";
import { PLANS } from "../lib/plans";

async function runPlanTests() {
  console.log("==================================================");
  console.log("   RUNNING FLOWCMS PLAN CONFIGURATION TESTS      ");
  console.log("==================================================");

  let failed = false;

  // 1. Get all enum values from database Client Plan type
  const prismaPlans = Object.values(Plan);
  const configPlans = Object.keys(PLANS);

  console.log(`Prisma DB Plans: ${JSON.stringify(prismaPlans)}`);
  console.log(`Configured Plans: ${JSON.stringify(configPlans)}`);

  // 2. Validate that every Prisma Plan enum value has a configuration mapped
  for (const plan of prismaPlans) {
    if (!PLANS[plan]) {
      console.error(`  ✗ [FAIL] Mapped Plan config missing for database variant: "${plan}"`);
      failed = true;
    } else {
      console.log(`  ✓ [PASS] Database variant "${plan}" is correctly configured in PLANS`);
    }
  }

  // 3. Verify configurations contain valid values
  for (const [key, config] of Object.entries(PLANS)) {
    if (!config.name || typeof config.rateLimitPerMinute !== 'number') {
      console.error(`  ✗ [FAIL] Plan config "${key}" is missing required limits fields`);
      failed = true;
    }
  }

  if (failed) {
    console.error("\n==================================================");
    console.error("   TEST RUN FAILED: PLAN MISMATCH DETECTED        ");
    console.error("==================================================");
    process.exit(1);
  } else {
    console.log("\n==================================================");
    console.log("   TEST RUN PASSED: ALL PLANS ALIGNED             ");
    console.log("==================================================");
    process.exit(0);
  }
}

runPlanTests().catch((err) => {
  console.error("Unhandled rejection in plan test runner:", err);
  process.exit(1);
});
