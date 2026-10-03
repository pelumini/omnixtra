import { z } from "zod";

export const metaSchema = z.object({
  request_id: z.string(),
  timestamp: z.string().datetime().nullable(),
});

export const healthEnvelopeSchema = z.object({
  data: z.object({
    status: z.literal("ok"),
  }),
  error: z.null(),
  meta: metaSchema,
});

export const errorDetailSchema = z.object({
  field: z.string(),
  constraint: z.string(),
  message: z.string().nullable().optional(),
});

export const errorBodySchema = z.object({
  type: z.string(),
  message: z.string(),
  details: z.array(errorDetailSchema),
});

export const orgRoleSchema = z.enum(["tenant_admin", "member"]);
export const courseRoleSchema = z.enum(["course_owner", "facilitator", "learner"]);
export const courseStatusSchema = z.enum(["draft", "published", "archived"]);

export type CourseRole = z.infer<typeof courseRoleSchema>;
export type OrgRole = z.infer<typeof orgRoleSchema>;
