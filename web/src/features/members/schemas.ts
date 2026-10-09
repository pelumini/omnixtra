import { z } from "zod";

import { metaSchema, orgRoleSchema } from "@/lib/schemas/common";
import { emailSchema } from "@/lib/validation/primitives";

export const userCreateRequestSchema = z.object({
  email: z.string().email(),
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  phone: z.string().min(1).max(32),
  org_role: orgRoleSchema.default("member"),
});

export const userCreateResponseSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
  phone: z.string(),
  org_role: orgRoleSchema,
  status: z.literal("invited"),
  activation_link: z.string().url(),
});

export const userCreateEnvelopeSchema = z.object({
  data: userCreateResponseSchema,
  error: z.null(),
  meta: metaSchema,
});

export const invitationAcceptRequestSchema = z.object({
  token: z.string().min(32).max(256),
  email: z.string().email(),
  password: z.string().min(12).max(128),
});

export const invitationPreviewSchema = z.object({
  organization_name: z.string(),
  email: z.string().email(),
  first_name: z.string(),
  last_name: z.string(),
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

export const createUserFormSchema = z.object({
  email: emailSchema,
  firstName: z.string().trim().min(1, "required").max(100, "max_length"),
  lastName: z.string().trim().min(1, "required").max(100, "max_length"),
  phone: z.string().trim().min(1, "required").max(32, "max_length"),
  orgRole: z.enum(["member", "tenant_admin"]),
});

export type InvitationAcceptRequest = z.infer<typeof invitationAcceptRequestSchema>;
export type UserCreateRequest = z.infer<typeof userCreateRequestSchema>;
export type InvitationPreview = z.infer<typeof invitationPreviewSchema>;
export type CreateUserFormInput = z.infer<typeof createUserFormSchema>;
export type Membership = z.infer<typeof membershipSchema>;
