import { z } from "zod";

import { metaSchema, orgRoleSchema } from "@/lib/schemas/common";
import {
  academyNameSchema,
  emailSchema,
  fullNameSchema,
  passwordSchema,
  subdomainSchema,
} from "@/lib/validation/primitives";

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1).max(128),
});

export const authenticatedUserSchema = z.object({
  id: z.string().uuid(),
  tenant_id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
  role: orgRoleSchema,
});

export const authResponseSchema = z.object({
  access_token: z.string(),
  token_type: z.literal("bearer"),
  user: authenticatedUserSchema,
});

export const authEnvelopeSchema = z.object({
  data: authResponseSchema,
  error: z.null(),
  meta: metaSchema,
});

export const sessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  full_name: z.string(),
});

export const sessionMembershipSchema = z.object({
  tenant_id: z.string().uuid(),
  org_role: orgRoleSchema,
});

export const sessionResponseSchema = z.object({
  user: sessionUserSchema,
  membership: sessionMembershipSchema.nullable(),
});

export const sessionEnvelopeSchema = z.object({
  data: sessionResponseSchema,
  error: z.null(),
  meta: metaSchema,
});

export const createAcademySchema = z.object({
  academyName: academyNameSchema,
  subdomain: subdomainSchema,
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export type CreateAcademyInput = z.infer<typeof createAcademySchema>;

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const acceptInvitationSchema = z.object({
  fullName: fullNameSchema,
  password: passwordSchema,
});

export type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>;
export type AuthResponse = z.infer<typeof authResponseSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type SessionResponse = z.infer<typeof sessionResponseSchema>;
