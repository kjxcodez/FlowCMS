import { Plan } from "@/generated/prisma";

export interface PlanConfig {
  name: string;
  collections: number;          // -1 for unlimited
  apiRequestsPerMonth: number;  // -1 for unlimited
  rateLimitPerMinute: number;
  storageLimitGb: number;       // -1 for unlimited
  environments: number;         // -1 for unlimited
  webhooks: boolean;
  customRoles: boolean;
  sso: boolean;
  auditLogs: boolean;
}

export const PLANS: Record<Plan, PlanConfig> = {
  HOBBY: {
    name: "Hobby",
    collections: 3,
    apiRequestsPerMonth: 5_000,
    rateLimitPerMinute: 30,
    storageLimitGb: 5,
    environments: 1,
    webhooks: false,
    customRoles: false,
    sso: false,
    auditLogs: false,
  },
  PRO: {
    name: "Pro",
    collections: -1,
    apiRequestsPerMonth: 250_000,
    rateLimitPerMinute: 300,
    storageLimitGb: 50,
    environments: 2,
    webhooks: true,
    customRoles: false,
    sso: false,
    auditLogs: false,
  },
  AGENCY: {
    name: "Agency",
    collections: -1,
    apiRequestsPerMonth: 1_000_000,
    rateLimitPerMinute: 1000,
    storageLimitGb: 250,
    environments: 5,
    webhooks: true,
    customRoles: true,
    sso: false,
    auditLogs: true,
  },
  ENTERPRISE: {
    name: "Enterprise",
    collections: -1,
    apiRequestsPerMonth: -1,
    rateLimitPerMinute: 5000, // Safety baseline limit for manual enterprise contracts
    storageLimitGb: -1,
    environments: -1,
    webhooks: true,
    customRoles: true,
    sso: true,
    auditLogs: true,
  },
};

export function getPlanConfig(plan: Plan | string | null | undefined): PlanConfig {
  if (!plan) return PLANS.HOBBY;
  return PLANS[plan as Plan] ?? PLANS.HOBBY;
}
export type { Plan };
