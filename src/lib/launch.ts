export const LAUNCH_MODE = (process.env.NEXT_PUBLIC_LAUNCH_MODE ?? "waitlist") as "waitlist" | "early_access" | "open";

export const isWaitlistMode    = LAUNCH_MODE === "waitlist";
export const isEarlyAccessMode = LAUNCH_MODE === "early_access";
export const isOpenMode        = LAUNCH_MODE === "open";

export const FEATURES = {
  enableBilling: false,
  enableCustomDomains: false,
  enableTeamInvites: false,
  enableApiKeyGeneration: true, // keep on, devs need this
  enableWebhooks: false,        // not ready yet
} as const;
