import { z } from "zod";

import { emailSchema, optionalTextSchema, requiredText, textSchema } from "@/lib/validation/primitives";

export const courseFormSchema = z.object({
  description: optionalTextSchema(2000),
  title: textSchema(3, 200),
});

export type CourseFormInput = z.infer<typeof courseFormSchema>;

export const courseDetailsFormSchema = courseFormSchema;
export type CourseDetailsFormInput = z.infer<typeof courseDetailsFormSchema>;

export const firstLessonFormSchema = z.object({
  body: textSchema(1, 20000),
  title: textSchema(2, 200),
});

export type FirstLessonFormInput = z.infer<typeof firstLessonFormSchema>;

export const courseWithFirstLessonFormSchema = z.object({
  courseDescription: optionalTextSchema(2000),
  courseTitle: textSchema(3, 200),
  lessonBody: textSchema(1, 20000),
  lessonTitle: textSchema(2, 200),
});

export type CourseWithFirstLessonFormInput = z.infer<typeof courseWithFirstLessonFormSchema>;

export const inviteMemberFormSchema = z.object({
  email: emailSchema,
  orgRole: z.enum(["member", "tenant_admin"]),
});

export type InviteMemberFormInput = z.infer<typeof inviteMemberFormSchema>;

export const sectionFormSchema = z.object({
  title: textSchema(2, 200),
});

export type SectionFormInput = z.infer<typeof sectionFormSchema>;

export const lessonFormSchema = z.object({
  sectionId: requiredText,
  title: textSchema(2, 200),
});

export type LessonFormInput = z.infer<typeof lessonFormSchema>;

export const blockFormSchema = z.object({
  blockType: z.enum(["content", "web_content", "video", "image", "quiz"], {
    required_error: "required",
  }),
  body: textSchema(1, 4000),
  lessonId: requiredText,
});

export type BlockFormInput = z.infer<typeof blockFormSchema>;

export const mediaFormSchema = z.object({
  byteSize: z.coerce.number().int("number").min(1, "min_value"),
  contentType: z.enum(["image/png", "image/jpeg", "video/mp4"]),
  fileName: textSchema(1, 255),
});

export type MediaFormInput = z.infer<typeof mediaFormSchema>;
