export type FieldType =
  | "text"
  | "textarea"
  | "richtext"
  | "number"
  | "boolean"
  | "date"
  | "media"
  | "reference";

export interface FieldDefinition {
  id: string;
  name: string;
  slug: string;
  type: FieldType;
  required: boolean;
  multiple: boolean;
  options?: Record<string, unknown>;
}

export type BlockType = "heading" | "text" | "image" | "cta" | "divider" | "quote" | "code" | "callout" | "accordion";

export interface Block {
  id: string;
  type: BlockType;
  props: Record<string, unknown>;
}

export interface PlanLimits {
  collections: number;
  apiRequestsPerMonth: number;
  environments: number;
  webhooks: boolean;
  customRoles: boolean;
  sso: boolean;
}

export const PLAN_LIMITS: Record<string, PlanLimits> = {
  HOBBY: {
    collections: 3,
    apiRequestsPerMonth: 5_000,
    environments: 1,
    webhooks: false,
    customRoles: false,
    sso: false,
  },
  PRO: {
    collections: -1,
    apiRequestsPerMonth: 250_000,
    environments: 2,
    webhooks: true,
    customRoles: false,
    sso: false,
  },
  AGENCY: {
    collections: -1,
    apiRequestsPerMonth: 1_000_000,
    environments: 5,
    webhooks: true,
    customRoles: true,
    sso: false,
  },
  ENTERPRISE: {
    collections: -1,
    apiRequestsPerMonth: -1,
    environments: -1,
    webhooks: true,
    customRoles: true,
    sso: true,
  },
};
