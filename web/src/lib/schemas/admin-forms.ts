import { z } from "zod";

const text = (min: number, max: number) => z.string().trim().min(min, "min_length").max(max, "max_length");
const optionalText = (max: number) => z.string().trim().max(max, "max_length");

export const courseFormSchema = z.object({
  description: optionalText(2000),
  slug: z
    .string()
    .trim()
    .min(2, "min_length")
    .max(120, "max_length")
    .regex(/^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$/, "slug_format"),
  title: text(3, 200),
});

export type CourseFormInput = z.infer<typeof courseFormSchema>;

export const courseDetailsFormSchema = courseFormSchema.omit({ slug: true });
export type CourseDetailsFormInput = z.infer<typeof courseDetailsFormSchema>;

export const inviteMemberFormSchema = z.object({
  email: z.string().trim().min(1, "required").email("email"),
  orgRole: z.enum(["member", "tenant_admin"]),
});

export type InviteMemberFormInput = z.infer<typeof inviteMemberFormSchema>;

export const sectionFormSchema = z.object({
  title: text(2, 200),
});

export type SectionFormInput = z.infer<typeof sectionFormSchema>;

export const lessonFormSchema = z.object({
  sectionId: z.string().trim().min(1, "required"),
  title: text(2, 200),
});

export type LessonFormInput = z.infer<typeof lessonFormSchema>;

export const blockFormSchema = z.object({
  blockType: z.enum(["text", "video", "image", "quiz"], { required_error: "required" }),
  body: text(1, 4000),
  lessonId: z.string().trim().min(1, "required"),
});

export type BlockFormInput = z.infer<typeof blockFormSchema>;

export const mediaFormSchema = z.object({
  byteSize: z.coerce.number().int("number").min(1, "min_value"),
  contentType: z.enum(["image/png", "image/jpeg", "video/mp4"]),
  fileName: text(1, 255),
});

export type MediaFormInput = z.infer<typeof mediaFormSchema>;
