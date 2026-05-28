import { EventEmitter } from "events";
import { logger } from "@/lib/logger";
import { dispatchWebhooks } from "@/lib/webhooks";
import { logAction } from "@/lib/audit";

export const platformEmitter = new EventEmitter();

// --- PLATFORM EVENT LISTS ---
export const PLATFORM_EVENTS = {
  ENTRY_CREATED: "entry.created",
  ENTRY_UPDATED: "entry.updated",
  ENTRY_PUBLISHED: "entry.published",
  ENTRY_DELETED: "entry.deleted",
  COLLECTION_CREATED: "collection.created",
  COLLECTION_UPDATED: "collection.updated",
  COLLECTION_DELETED: "collection.deleted",
  MEDIA_UPLOADED: "media.uploaded",
  MEDIA_DELETED: "media.deleted",
  API_KEY_CREATED: "api_key.created",
  API_KEY_REVOKED: "api_key.revoked",
  WEBHOOK_CREATED: "webhook.created",
  WEBHOOK_DELETED: "webhook.deleted",
  WORKSPACE_PROVISIONED: "workspace.provisioned",
} as const;

export type PlatformEvent = typeof PLATFORM_EVENTS[keyof typeof PLATFORM_EVENTS];

/**
 * Emits a system event and executes all registered async listeners.
 */
export function emitPlatformEvent(event: PlatformEvent, payload: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
  logger.info(`Platform Event Emitted: ${event}`, { event });
  platformEmitter.emit(event, payload);
}

// ==========================================
//           EVENT SIDE-EFFECT LISTENERS
// ==========================================

// 1. Unified Audit Log Listener
platformEmitter.on("*", async (event: string, _payload: unknown) => { // Wildcard listening fallback helper
  logger.debug(`Wildcard listener observed event: ${event}`);
});

// Outbound Webhooks Dispatcher
const WEBHOOK_TRIGGERABLE_EVENTS: Record<string, string> = {
  [PLATFORM_EVENTS.ENTRY_CREATED]: "ENTRY_CREATED",
  [PLATFORM_EVENTS.ENTRY_UPDATED]: "ENTRY_UPDATED",
  [PLATFORM_EVENTS.ENTRY_PUBLISHED]: "ENTRY_PUBLISHED",
  [PLATFORM_EVENTS.ENTRY_DELETED]: "ENTRY_DELETED",
};

Object.entries(WEBHOOK_TRIGGERABLE_EVENTS).forEach(([event, webhookEventName]) => {
  platformEmitter.on(event, (payload: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (payload.workspaceId && payload.entry) {
      dispatchWebhooks(payload.workspaceId, webhookEventName, payload.entry).catch((err) => {
        logger.error(`Webhook dispatch failure on event: ${event}`, { error: String(err) });
      });
    }
  });
});

// Audit Logging Handlers
platformEmitter.on(PLATFORM_EVENTS.API_KEY_CREATED, (payload) => {
  logAction({
    workspaceId: payload.workspaceId,
    userId: payload.userId,
    action: "API_KEY_CREATED",
    resourceType: "API_KEY",
    resourceId: payload.keyId,
    resourceName: payload.keyName,
  }).catch(() => {});
});

platformEmitter.on(PLATFORM_EVENTS.API_KEY_REVOKED, (payload) => {
  logAction({
    workspaceId: payload.workspaceId,
    userId: payload.userId,
    action: "API_KEY_REVOKED",
    resourceType: "API_KEY",
    resourceId: payload.keyId,
  }).catch(() => {});
});

platformEmitter.on(PLATFORM_EVENTS.WEBHOOK_CREATED, (payload) => {
  logAction({
    workspaceId: payload.workspaceId,
    userId: payload.userId,
    action: "WEBHOOK_CREATED",
    resourceType: "WEBHOOK",
    resourceId: payload.webhookId,
    resourceName: payload.webhookUrl,
  }).catch(() => {});
});

platformEmitter.on(PLATFORM_EVENTS.WEBHOOK_DELETED, (payload) => {
  logAction({
    workspaceId: payload.workspaceId,
    userId: payload.userId,
    action: "WEBHOOK_DELETED",
    resourceType: "WEBHOOK",
    resourceId: payload.webhookId,
  }).catch(() => {});
});
