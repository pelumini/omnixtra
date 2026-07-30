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
});

export const errorBodySchema = z.object({
  type: z.string(),
  message: z.string(),
  details: z.array(errorDetailSchema),
});

export const courseStatusSchema = z.enum(["draft", "published", "archived"]);

export const courseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200),
  slug: z.string(),
  description: z.string().nullable(),
  status: courseStatusSchema,
});

export const courseCreateRequestSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$/),
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
  section_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  position: z.number().int().nonnegative(),
});

export const lessonSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  section_id: z.string().uuid(),
  title: z.string(),
  position: z.number().int().nonnegative(),
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

export const playerLessonSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  position: z.number().int().nonnegative(),
  percent_complete: z.number().int().min(0).max(100),
});

export const playerSectionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  position: z.number().int().nonnegative(),
  lessons: z.array(playerLessonSchema),
});

export const coursePlayerSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string(),
  status: courseStatusSchema,
  sections: z.array(playerSectionSchema),
});

export const coursePlayerEnvelopeSchema = z.object({
  data: coursePlayerSchema,
  error: z.null(),
  meta: metaSchema,
});

export const tutorJobSchema = z.object({
  id: z.string().uuid(),
  conversation_id: z.string().uuid(),
  course_id: z.string().uuid(),
  status: z.enum(["queued", "running", "completed", "failed"]),
});

export const tutorJobEnvelopeSchema = z.object({
  data: tutorJobSchema,
  error: z.null(),
  meta: metaSchema,
});

export type Block = z.infer<typeof blockSchema>;
export type Course = z.infer<typeof courseSchema>;
export type CourseCreateRequest = z.infer<typeof courseCreateRequestSchema>;
export type CoursePlayer = z.infer<typeof coursePlayerSchema>;
export type CourseUpdateRequest = z.infer<typeof courseUpdateRequestSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonCreateRequest = z.infer<typeof lessonCreateRequestSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type MediaAssetCreateRequest = z.infer<typeof mediaAssetCreateRequestSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type SectionCreateRequest = z.infer<typeof sectionCreateRequestSchema>;
export type TutorJob = z.infer<typeof tutorJobSchema>;
