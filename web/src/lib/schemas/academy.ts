import { z } from "zod";

import { metaSchema } from "@/lib/schemas/common";

export const tenantBrandingSchema = z.object({
  tenant_name: z.string().min(1).max(200),
  logo_url: z.string().url().nullable(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  locale: z.string().min(2).max(16),
  time_zone: z.string().min(1).max(64),
});

export const tenantBrandingEnvelopeSchema = z.object({
  data: tenantBrandingSchema,
  error: z.null(),
  meta: metaSchema,
});

export const tenantCreateRequestSchema = z.object({
  tenant_name: z.string().min(2).max(200),
  tenant_description: z.string().max(1000).nullable().optional(),
  tenant_slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$/),
  logo_url: z.string().url().nullable().optional(),
  primary_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  locale: z.string().min(2).max(16).optional(),
  time_zone: z.string().min(1).max(64).optional(),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  phone: z.string().trim().min(1).max(32),
  email: z.string().email(),
  password: z.string().min(12).max(128),
});

export const tenantCreateResponseSchema = z.object({
  tenant_id: z.string().uuid(),
  tenant_slug: z.string(),
  user_id: z.string().uuid(),
  membership_id: z.string().uuid(),
  access_token: z.string(),
  token_type: z.literal("bearer"),
});

export const tenantCreateEnvelopeSchema = z.object({
  data: tenantCreateResponseSchema,
  error: z.null(),
  meta: metaSchema,
});

export type TenantBranding = z.infer<typeof tenantBrandingSchema>;
export type TenantCreateRequest = z.infer<typeof tenantCreateRequestSchema>;
export type TenantCreateResponse = z.infer<typeof tenantCreateResponseSchema>;
