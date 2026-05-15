export const LAUNCH_MODE = (process.env.NEXT_PUBLIC_LAUNCH_MODE ?? "waitlist") as "waitlist" | "early_access" | "open";

export const isWaitlistMode    = LAUNCH_MODE === "waitlist";
export const isEarlyAccessMode = LAUNCH_MODE === "early_access";
export const isOpenMode        = LAUNCH_MODE === "open";

import { isAdminEmail } from "./admin";

export const FEATURES = {
  enableBilling: true,
  enableCustomDomains: false,
  enableTeamInvites: false,
  enableApiKeyGeneration: true,
  enableWebhooks: true,
};

/**
 * Checks if a user has access to a specific feature.
 * Administrators bypass feature flags for internal testing.
 */
export function canAccessFeature(
  feature: keyof typeof FEATURES,
  userEmail?: string
): boolean {
  if (userEmail && isAdminEmail(userEmail)) {
    return true;
  }
  return FEATURES[feature];
}
