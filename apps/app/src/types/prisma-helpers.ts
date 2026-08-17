import { Prisma } from "@/generated/prisma";

export interface FieldDefinition {
  id: string;
  name: string;
  slug: string;
  type: string;
  required: boolean;
}

export type CollectionFieldsInput = FieldDefinition[];
export type EntryDataInput = Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Casts a collection fields array safely to Prisma JSON value.
 */
export function toCollectionFieldsJson(fields: CollectionFieldsInput): Prisma.InputJsonValue {
  return fields as unknown as Prisma.InputJsonValue;
}

/**
 * Casts entry data record safely to Prisma JSON value.
 */
export function toEntryDataJson(data: EntryDataInput): Prisma.InputJsonValue {
  return data as unknown as Prisma.InputJsonValue;
}
