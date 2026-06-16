import { isAdminEmail } from "./admin";

export const FEATURES = {
  enableBilling: true,
  enableCustomDomains: false,
  enableTeamInvites: true,
  enableApiKeyGeneration: true,
  enableWebhooks: true,
};

export function canAccessFeature(
  feature: keyof typeof FEATURES,
  userEmail?: string
): boolean {
  if (userEmail && isAdminEmail(userEmail)) {
    return true;
  }
  return FEATURES[feature];
}
