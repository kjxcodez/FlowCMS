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

import { PLANS } from "@/lib/plans";
import type { PlanConfig } from "@/lib/plans";

export type PlanLimits = PlanConfig;
export const PLAN_LIMITS = PLANS;

