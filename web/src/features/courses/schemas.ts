import { z } from "zod";

import { courseStatusSchema, metaSchema } from "@/lib/schemas/common";
import { optionalTextSchema, requiredText, textSchema } from "@/lib/validation/primitives";

export const courseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200),
  slug: z.string(),
  description: z.string().nullable(),
  status: courseStatusSchema,
  lesson_count: z.number().int().nonnegative().default(0),
});

export const courseCreateRequestSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$/).optional(),
  description: z.string().max(2000).nullable(),
});

export const courseUpdateRequestSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
});

export const sectionCreateRequestSchema = z.object({
  title: z.string().min(1).max(200),
  position: z.number().int().nonnegative(),
});

export const sectionSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  title: z.string(),
  position: z.number().int().nonnegative(),
});

export const lessonCreateRequestSchema = z.object({
  section_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  position: z.number().int().nonnegative().optional(),
  body: z.string().min(1).max(20000).optional(),
});

export const lessonSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  section_id: z.string().uuid(),
  title: z.string(),
  position: z.number().int().nonnegative(),
  body: z.string().nullable().default(null),
});

export const courseDetailSchema = courseSchema.extend({
  lessons: z.array(lessonSchema),
});

export const coursePageSchema = z.object({
  items: z.array(courseSchema),
  next_cursor: z.string().nullable(),
});

export const coursePageEnvelopeSchema = z.object({
  data: coursePageSchema,
  error: z.null(),
  meta: metaSchema,
});

export const courseEnvelopeSchema = z.object({
  data: courseSchema,
  error: z.null(),
  meta: metaSchema,
});

export const courseDetailEnvelopeSchema = z.object({
  data: courseDetailSchema,
  error: z.null(),
  meta: metaSchema,
});

export const sectionEnvelopeSchema = z.object({
  data: sectionSchema,
  error: z.null(),
  meta: metaSchema,
});

export const lessonEnvelopeSchema = z.object({
  data: lessonSchema,
  error: z.null(),
  meta: metaSchema,
});

export const lessonsEnvelopeSchema = z.object({
  data: z.array(lessonSchema),
  error: z.null(),
  meta: metaSchema,
});

export const quizOptionSchema = z.object({
  id: z.string().min(1).max(64),
  text: z.string().min(1).max(500),
});

export const textBlockContentSchema = z.object({
  type: z.literal("text"),
  markdown: z.string().min(1).max(20000),
});

export const videoBlockContentSchema = z.object({
  type: z.literal("video"),
  url: z.string().url(),
  caption: z.string().max(500).nullable(),
});

export const imageBlockContentSchema = z.object({
  type: z.literal("image"),
  url: z.string().url(),
  alt_text: z.string().min(1).max(300),
});

export const quizBlockContentSchema = z
  .object({
    type: z.literal("quiz"),
    question: z.string().min(1).max(1000),
    options: z.array(quizOptionSchema).min(2).max(8),
    correct_option_id: z.string().min(1).max(64),
  })
  .refine(
    (quiz) => quiz.options.some((option) => option.id === quiz.correct_option_id),
    "correct_option_id must match an option id",
  );

export const blockContentSchema = z.union([
  textBlockContentSchema,
  videoBlockContentSchema,
  imageBlockContentSchema,
  quizBlockContentSchema,
]);

export const blockCreateRequestSchema = z
  .object({
    lesson_id: z.string().uuid(),
    block_type: z.enum(["text", "video", "image", "quiz"]),
    content: blockContentSchema,
    position: z.number().int().nonnegative(),
  })
  .refine((block) => block.block_type === block.content.type, "block_type must match content type");

export const blockSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  block_type: z.enum(["text", "video", "image", "quiz"]),
  content: z.record(z.unknown()),
  position: z.number().int().nonnegative(),
});

export const blockEnvelopeSchema = z.object({
  data: blockSchema,
  error: z.null(),
  meta: metaSchema,
});

export const mediaAssetCreateRequestSchema = z.object({
  object_key: z.string().min(1).max(700),
  file_name: z.string().min(1).max(255),
  content_type: z.string().regex(/^(image|video)\/[a-z0-9.+-]+$/),
  byte_size: z.number().int().positive(),
  checksum_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
});

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  object_key: z.string().min(1).max(700),
  file_name: z.string().min(1).max(255),
  content_type: z.string().regex(/^(image|video)\/[a-z0-9.+-]+$/),
  byte_size: z.number().int().positive(),
  checksum_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
});

export const mediaAssetEnvelopeSchema = z.object({
  data: mediaAssetSchema,
  error: z.null(),
  meta: metaSchema,
});

export const courseFormSchema = z.object({
  description: optionalTextSchema(2000),
  title: textSchema(3, 200),
});

export const courseDetailsFormSchema = courseFormSchema;

export const firstLessonFormSchema = z.object({
  body: textSchema(1, 20000),
  title: textSchema(2, 200),
});

export const courseWithFirstLessonFormSchema = z.object({
  courseDescription: optionalTextSchema(2000),
  courseTitle: textSchema(3, 200),
  lessonBody: textSchema(1, 20000),
  lessonTitle: textSchema(2, 200),
});

export const sectionFormSchema = z.object({
  title: textSchema(2, 200),
});

export const lessonFormSchema = z.object({
  sectionId: requiredText,
  title: textSchema(2, 200),
});

export const blockFormSchema = z.object({
  blockType: z.enum(["content", "web_content", "video", "image", "quiz"], {
    required_error: "required",
  }),
  body: textSchema(1, 4000),
  lessonId: requiredText,
});

export const mediaFormSchema = z.object({
  byteSize: z.coerce.number().int("number").min(1, "min_value"),
  contentType: z.enum(["image/png", "image/jpeg", "video/mp4"], { required_error: "required" }),
  fileName: textSchema(1, 255),
});

export type Block = z.infer<typeof blockSchema>;
export type BlockFormInput = z.infer<typeof blockFormSchema>;
export type Course = z.infer<typeof courseSchema>;
export type CourseCreateRequest = z.infer<typeof courseCreateRequestSchema>;
export type CourseDetail = z.infer<typeof courseDetailSchema>;
export type CourseDetailsFormInput = z.infer<typeof courseDetailsFormSchema>;
export type CourseFormInput = z.infer<typeof courseFormSchema>;
export type CourseUpdateRequest = z.infer<typeof courseUpdateRequestSchema>;
export type CourseWithFirstLessonFormInput = z.infer<typeof courseWithFirstLessonFormSchema>;
export type FirstLessonFormInput = z.infer<typeof firstLessonFormSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonCreateRequest = z.infer<typeof lessonCreateRequestSchema>;
export type LessonFormInput = z.infer<typeof lessonFormSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type MediaAssetCreateRequest = z.infer<typeof mediaAssetCreateRequestSchema>;
export type MediaFormInput = z.infer<typeof mediaFormSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type SectionCreateRequest = z.infer<typeof sectionCreateRequestSchema>;
export type SectionFormInput = z.infer<typeof sectionFormSchema>;
