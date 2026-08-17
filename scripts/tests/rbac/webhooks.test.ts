import { GET as getWebhooks, POST as createWebhook, DELETE as deleteWebhook } from "../../../apps/app/src/app/api/internal/webhooks/route";
import { POST as replayWebhook } from "../../../apps/app/src/app/api/internal/webhooks/deliveries/[id]/replay/route";
import { NextRequest } from "next/server";
import { prisma } from "../../../apps/app/src/lib/prisma";
import { setMockUser } from "../../run-rbac-tests";
import { WebhookEvent } from "../../../apps/app/src/generated/prisma";

export async function testWebhooks(ctx: {
  workspace: any;
  users: Record<string, any>;
  assert: (name: string, condition: boolean, message?: string) => void;
}) {
  const { workspace, users, assert } = ctx;
  const suffix = Math.random().toString(36).substring(7);

  const roles = ["OWNER", "ADMIN", "EDITOR", "VIEWER"] as const;

  // 1. Test List Webhooks (GET)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    const req = new NextRequest(`http://localhost:3000/api/internal/webhooks`);
    const res = await getWebhooks();
    if (isAllowed) {
      assert(`${role} is allowed to view webhooks list`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from viewing webhooks list`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // 2. Test Create Webhook (POST)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    const req = new NextRequest(`http://localhost:3000/api/internal/webhooks`, {
      method: "POST",
      body: JSON.stringify({
        url: `https://example.com/webhook-${role.toLowerCase()}-${suffix}`,
        events: [WebhookEvent.ENTRY_CREATED],
      }),
    });

    const res = await createWebhook(req);
    if (isAllowed) {
      assert(`${role} is allowed to create webhook`, res.status === 200, `Status: ${res.status}`);
      if (res.status === 200) {
        const body = await res.json();
        await prisma.webhook.delete({ where: { id: body.data.id } }).catch(() => {});
      }
    } else {
      assert(`${role} is blocked from creating webhook`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // Set up static webhook for delete and replay tests
  const testWebhook = await prisma.webhook.create({
    data: {
      workspaceId: workspace.id,
      url: `https://example.com/webhook-test-${suffix}`,
      events: [WebhookEvent.ENTRY_CREATED],
      secret: "shhh-test-secret",
    },
  });

  // Set up static delivery log for replay tests
  const testDelivery = await prisma.webhookDelivery.create({
    data: {
      webhookId: testWebhook.id,
      event: WebhookEvent.ENTRY_CREATED,
      payload: { title: "Test" },
      statusCode: 200,
      success: true,
      duration: 10,
    },
  });

  // 3. Test Webhook Replay (POST deliveries/[id]/replay)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    const req = new NextRequest(`http://localhost:3000/api/internal/webhooks/deliveries/${testDelivery.id}/replay`, {
      method: "POST",
    });

    const res = await replayWebhook(req, { params: Promise.resolve({ id: testDelivery.id }) });
    if (isAllowed) {
      assert(`${role} is allowed to replay webhook delivery`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from replaying webhook delivery`, res.status === 403, `Status: ${res.status}`);
    }
  }

  // 4. Test Webhook Delete (DELETE)
  for (const role of roles) {
    setMockUser(users[role]);
    const isAllowed = role === "OWNER" || role === "ADMIN";

    const tempWebhook = await prisma.webhook.create({
      data: {
        workspaceId: workspace.id,
        url: `https://example.com/webhook-temp-${role.toLowerCase()}-${suffix}`,
        events: [WebhookEvent.ENTRY_CREATED],
        secret: "temp-secret",
      },
    });

    const req = new NextRequest(`http://localhost:3000/api/internal/webhooks?id=${tempWebhook.id}`, {
      method: "DELETE",
    });

    const res = await deleteWebhook(req);
    if (isAllowed) {
      assert(`${role} is allowed to delete webhook`, res.status === 200, `Status: ${res.status}`);
    } else {
      assert(`${role} is blocked from deleting webhook`, res.status === 403, `Status: ${res.status}`);
      await prisma.webhook.delete({ where: { id: tempWebhook.id } }).catch(() => {});
    }
  }

  // Cleanup static delivery and webhook
  await prisma.webhookDelivery.delete({ where: { id: testDelivery.id } }).catch(() => {});
  await prisma.webhook.delete({ where: { id: testWebhook.id } }).catch(() => {});
}
