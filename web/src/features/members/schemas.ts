import { z } from "zod";

import { metaSchema, orgRoleSchema } from "@/lib/schemas/common";
import { emailSchema } from "@/lib/validation/primitives";

export const invitationCreateRequestSchema = z.object({
  email: z.string().email(),
  org_role: orgRoleSchema.default("member"),
});

export const invitationCreateResponseSchema = z.object({
  accepted: z.boolean(),
  invitation_id: z.string().uuid().nullable().default(null),
  email: z.string().email().nullable().default(null),
  org_role: orgRoleSchema.nullable().default(null),
  status: z.literal("invited").nullable().default(null),
  token: z.string().nullable(),
});

export const invitationCreateEnvelopeSchema = z.object({
  data: invitationCreateResponseSchema,
  error: z.null(),
  meta: metaSchema,
});

export const invitationAcceptRequestSchema = z.object({
  token: z.string().min(32).max(256),
  email: z.string().email(),
  full_name: z.string().min(2).max(200),
  password: z.string().min(12).max(128),
});

export const invitationPreviewSchema = z.object({
  organization_name: z.string(),
  email: z.string().email(),
});

export const invitationPreviewEnvelopeSchema = z.object({
  data: invitationPreviewSchema,
  error: z.null(),
  meta: metaSchema,
});

export const membershipSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().nullable(),
  full_name: z.string().nullable(),
  email: z.string().email(),
  org_role: orgRoleSchema,
  status: z.enum(["active", "invited"]),
  invitation_token: z.string().nullable().default(null),
});

export const membershipsEnvelopeSchema = z.object({
  data: z.array(membershipSchema),
  error: z.null(),
  meta: metaSchema,
});

export const inviteMemberFormSchema = z.object({
  email: emailSchema,
  orgRole: z.enum(["member", "tenant_admin"]),
});

export type InvitationAcceptRequest = z.infer<typeof invitationAcceptRequestSchema>;
export type InvitationCreateRequest = z.infer<typeof invitationCreateRequestSchema>;
export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;
export type InviteMemberFormInput = z.infer<typeof inviteMemberFormSchema>;
export type Membership = z.infer<typeof membershipSchema>;
