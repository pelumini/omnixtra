import { z } from "zod";

import {
  academyNameSchema,
  emailSchema,
  fullNameSchema,
  passwordSchema,
  subdomainSchema,
} from "@/lib/validation/primitives";

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
