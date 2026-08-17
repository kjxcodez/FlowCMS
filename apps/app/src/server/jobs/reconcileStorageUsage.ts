import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function reconcileStorageUsage(): Promise<void> {
  console.log("Starting active workspace storage reconciliation job...");
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // 1. Fetch all workspaces
  const workspaces = await prisma.workspace.findMany();
  console.log(`Found ${workspaces.length} workspaces to reconcile.`);

  for (const workspace of workspaces) {
    // 2. Aggregate actual storage consumption via PostgreSQL Media sum
    const aggregate = await prisma.media.aggregate({
      where: { workspaceId: workspace.id },
      _sum: { size: true },
    });
    const actualBytes = aggregate._sum.size ?? 0;

    // 3. Find current monthly usage record
    const usage = await prisma.monthlyUsage.findUnique({
      where: {
        workspaceId_year_month: {
          workspaceId: workspace.id,
          year,
          month,
        },
      },
    });

    const recordedBytes = usage?.storageBytes ?? 0;
    const drift = actualBytes - recordedBytes;

    if (drift !== 0) {
      console.log(
        `Drift detected for workspace ${workspace.name} (${workspace.id}): Recorded=${recordedBytes} bytes, Actual=${actualBytes} bytes. Drift=${drift} bytes. Repairing...`
      );

      await prisma.monthlyUsage.upsert({
        where: {
          workspaceId_year_month: {
            workspaceId: workspace.id,
            year,
            month,
          },
        },
        update: { storageBytes: actualBytes },
        create: {
          workspaceId: workspace.id,
          year,
          month,
          storageBytes: actualBytes,
        },
      });
      console.log(`Successfully repaired storage drift for workspace ${workspace.name}.`);
    } else {
      console.log(`Workspace ${workspace.name} (${workspace.id}) storage is accurate: ${actualBytes} bytes.`);
    }
  }

  console.log("Storage reconciliation job completed successfully.");
}

// Support direct execution via command line tsx tool
if (process.argv[1] && (process.argv[1].endsWith("reconcileStorageUsage.ts") || process.argv[1].endsWith("reconcileStorageUsage"))) {
  reconcileStorageUsage()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      logger.error("Reconciliation execution failure", { error: err });
      process.exit(1);
    });
}
