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

export const coursePageSchema = z.object({
  items: z.array(courseSchema),
  next_cursor: z.string().nullable(),
});

export const coursePageEnvelopeSchema = z.object({
  data: coursePageSchema,
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

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  object_key: z.string().min(1).max(700),
  file_name: z.string().min(1).max(255),
  content_type: z.string().regex(/^(image|video)\/[a-z0-9.+-]+$/),
  byte_size: z.number().int().positive(),
  checksum_sha256: z.string().regex(/^[a-f0-9]{64}$/).nullable(),
});

export type Course = z.infer<typeof courseSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
