import { z } from "zod";

import { courseStatusSchema, metaSchema } from "@/lib/schemas/common";
import {
  optionalTextSchema,
  requiredText,
  textSchema,
} from "@/lib/validation/primitives";

const mediaReferenceSchema = z.string().min(1).max(700).refine(
  (value) => value.startsWith("tenants/") || z.string().url().safeParse(value).success,
  "url",
);

export const courseSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3).max(200),
  slug: z.string(),
  description: z.string().nullable(),
  thumbnail_url: mediaReferenceSchema.nullable(),
  category: z.string().nullable(),
  tags: z.array(z.string()),
  language: z.string().nullable(),
  learning_outcomes: z.array(z.string()),
  target_audience: z.string().nullable(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).nullable(),
  delivery_format: z
    .enum(["self_paced", "instructor_led", "blended"])
    .nullable(),
  estimated_duration_minutes: z.number().int().nonnegative().nullable(),
  access: z.enum(["enrolled_only", "link"]).default("enrolled_only"),
  complete_in_order: z.boolean().default(false),
  certificate_on_completion: z.boolean().default(false),
  status: courseStatusSchema,
  lesson_count: z.number().int().nonnegative().default(0),
});

export const courseCreateRequestSchema = z.object({
  title: z.string().min(3).max(200),
  slug: z
    .string()
    .regex(/^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$/)
    .optional(),
  description: z.string().max(2000).nullable(),
});

export const courseUpdateRequestSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  thumbnail_url: mediaReferenceSchema.nullable().optional(),
  category: z.string().max(120).nullable().optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).nullable().optional(),
  language: z
    .string()
    .regex(/^[a-z]{2,3}(?:-[A-Z]{2})?$/)
    .max(16)
    .nullable()
    .optional(),
  learning_outcomes: z
    .array(z.string().min(1).max(500))
    .max(20)
    .nullable()
    .optional(),
  target_audience: z.string().max(2000).nullable().optional(),
  difficulty: z
    .enum(["beginner", "intermediate", "advanced"])
    .nullable()
    .optional(),
  delivery_format: z
    .enum(["self_paced", "instructor_led", "blended"])
    .nullable()
    .optional(),
  estimated_duration_minutes: z
    .number()
    .int()
    .nonnegative()
    .nullable()
    .optional(),
  access: z.enum(["enrolled_only", "link"]).optional(),
  complete_in_order: z.boolean().optional(),
  certificate_on_completion: z.boolean().optional(),
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
  description: z.string().nullable().default(null),
  image_url: mediaReferenceSchema.nullable().default(null),
});

export const sectionUpdateRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).nullable().optional(),
  image_url: mediaReferenceSchema.nullable().optional(),
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
  summary: z.string().nullable().default(null),
  image_url: mediaReferenceSchema.nullable().default(null),
  estimated_duration_minutes: z.number().int().nonnegative().nullable().default(null),
  required_for_completion: z.boolean().default(false),
});

export const lessonUpdateRequestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(2000).nullable().optional(),
  image_url: mediaReferenceSchema.nullable().optional(),
  estimated_duration_minutes: z.number().int().nonnegative().nullable().optional(),
  required_for_completion: z.boolean().optional(),
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

const richTextDocSchema = z
  .record(z.unknown())
  .refine((doc) => doc.type === "doc" && Array.isArray(doc.content), "Invalid rich-text document")
  .refine((doc) => JSON.stringify(doc).match(/"text":"\s*\S/) !== null, "Rich-text document is empty")
  .refine((doc) => JSON.stringify(doc).length <= 100000, "Rich-text document is too large");

export const textBlockContentSchema = z
  .object({
    type: z.literal("text"),
    markdown: z.string().min(1).max(20000).optional(),
    doc: richTextDocSchema.optional(),
  })
  .refine((content) => content.markdown !== undefined || content.doc !== undefined, {
    message: "Text content requires markdown or doc",
  });

export const videoBlockContentSchema = z.object({
  type: z.literal("video"),
  url: mediaReferenceSchema,
  asset_id: z.string().uuid().nullish(), object_key: z.string().nullish(),
  caption: z.string().max(500).nullable(),
});

export const imageBlockContentSchema = z.object({
  type: z.literal("image"),
  url: mediaReferenceSchema,
  asset_id: z.string().uuid().nullish(), object_key: z.string().nullish(),
  alt_text: z.string().min(1).max(300),
});

export const audioBlockContentSchema = z.object({
  type: z.literal("audio"),
  url: mediaReferenceSchema,
  asset_id: z.string().uuid().nullish(), object_key: z.string().nullish(),
  caption: z.string().max(500).nullable(),
});

export const fileBlockContentSchema = z.object({
  type: z.literal("file"),
  url: mediaReferenceSchema,
  asset_id: z.string().uuid().nullish(), object_key: z.string().nullish(),
  file_name: z.string().min(1).max(255),
  size_bytes: z.number().int().positive().nullable(),
});

export const quizBlockContentSchema = z
  .object({
    type: z.literal("quiz"),
    question: z.string().min(1).max(1000),
    options: z.array(quizOptionSchema).min(2).max(8),
    correct_option_id: z.string().min(1).max(64),
  })
  .refine(
    (quiz) =>
      quiz.options.some((option) => option.id === quiz.correct_option_id),
    "correct_option_id must match an option id",
  );

export const blockContentSchema = z.union([
  textBlockContentSchema,
  videoBlockContentSchema,
  imageBlockContentSchema,
  audioBlockContentSchema,
  fileBlockContentSchema,
  quizBlockContentSchema,
]);

export const blockUpdateRequestSchema = z.object({ content: blockContentSchema });

export const blockCreateRequestSchema = z
  .object({
    lesson_id: z.string().uuid(),
    block_type: z.enum(["text", "video", "image", "audio", "file", "quiz"]),
    content: blockContentSchema,
    position: z.number().int().nonnegative(),
  })
  .refine(
    (block) => block.block_type === block.content.type,
    "block_type must match content type",
  );

export const blockSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  block_type: z.enum(["text", "video", "image", "audio", "file", "quiz"]),
  content: blockContentSchema,
  position: z.number().int().nonnegative(),
});

export const blockEnvelopeSchema = z.object({
  data: blockSchema,
  error: z.null(),
  meta: metaSchema,
});

export const blocksEnvelopeSchema = z.object({
  data: z.array(blockSchema),
  error: z.null(),
  meta: metaSchema,
});

export const lessonNodeSchema = lessonSchema.extend({
  blocks: z.array(blockSchema),
});
export const sectionNodeSchema = sectionSchema.extend({
  lessons: z.array(lessonNodeSchema),
  rolled_duration_minutes: z.number().int().nonnegative().default(0),
});
export const courseStructureSchema = courseSchema.extend({
  sections: z.array(sectionNodeSchema),
  rolled_duration_minutes: z.number().int().nonnegative().default(0),
});
export const courseStructureEnvelopeSchema = z.object({
  data: courseStructureSchema,
  error: z.null(),
  meta: metaSchema,
});
export const sectionsEnvelopeSchema = z.object({
  data: z.array(sectionSchema),
  error: z.null(),
  meta: metaSchema,
});

export const mediaAssetCreateRequestSchema = z.object({
  object_key: z.string().min(1).max(700),
  file_name: z.string().min(1).max(255),
  content_type: z.string().min(1).max(120),
  byte_size: z.number().int().positive(),
  checksum_sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable(),
});

export const mediaAssetSchema = z.object({
  id: z.string().uuid(),
  course_id: z.string().uuid(),
  object_key: z.string().min(1).max(700),
  file_name: z.string().min(1).max(255),
  content_type: z.string().min(1).max(120),
  byte_size: z.number().int().positive(),
  checksum_sha256: z
    .string()
    .regex(/^[a-f0-9]{64}$/)
    .nullable(),
});

export const mediaAssetEnvelopeSchema = z.object({
  data: mediaAssetSchema,
  error: z.null(),
  meta: metaSchema,
});

export const mediaKindSchema = z.enum(["image", "video", "audio", "file", "thumbnail"]);
export const mediaPresignEnvelopeSchema = z.object({
  data: z.object({
    upload_url: z.string().url(),
    method: z.literal("PUT"),
    headers: z.record(z.string()),
    object_key: z.string(),
    asset_id: z.string().uuid(),
    expires_in: z.number().int().positive(),
  }),
  error: z.null(), meta: metaSchema,
});
export const mediaConfirmEnvelopeSchema = z.object({
  data: mediaAssetSchema.extend({ delivery_url: z.string().url() }),
  error: z.null(), meta: metaSchema,
});
export const mediaUrlEnvelopeSchema = z.object({
  data: z.object({
    url: z.string().url(), expires_in: z.number().int().positive().nullable(),
    file_name: z.string().optional(), content_type: z.string().optional(),
    byte_size: z.number().int().positive().optional(),
  }),
  error: z.null(), meta: metaSchema,
});

export const courseFormSchema = z.object({
  description: optionalTextSchema(2000),
  title: textSchema(3, 200),
});

export const courseDetailsFormSchema = courseFormSchema.extend({
  access: z.enum(["enrolled_only", "link"]),
  certificateOnCompletion: z.boolean(),
  category: optionalTextSchema(120),
  completeInOrder: z.boolean(),
  deliveryFormat: z.enum(["", "self_paced", "instructor_led", "blended"]),
  difficulty: z.enum(["", "beginner", "intermediate", "advanced"]),
  durationUnit: z.enum(["minutes", "hours"]),
  durationValue: z
    .string()
    .refine(
      (value) =>
        value === "" || (Number.isFinite(Number(value)) && Number(value) >= 0),
      "min_value",
    ),
  language: z.enum(["", "en", "fr", "es", "de", "pt"]),
  learningOutcomes: z.array(z.string().min(1).max(500)).max(20),
  tags: z.array(z.string().min(1).max(50)).max(20),
  targetAudience: optionalTextSchema(2000),
  thumbnailUrl: optionalTextSchema(700).refine(
    (value) => value === "" || mediaReferenceSchema.safeParse(value).success,
    "url",
  ),
});

export const firstLessonFormSchema = z.object({
  body: textSchema(1, 20000),
  title: textSchema(2, 200),
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
  contentType: z.enum(["image/png", "image/jpeg", "video/mp4"], {
    required_error: "required",
  }),
  fileName: textSchema(1, 255),
});

export type Block = z.infer<typeof blockSchema>;
export type BlockContent = z.infer<typeof blockContentSchema>;
export type MediaKind = z.infer<typeof mediaKindSchema>;
export type BlockFormInput = z.infer<typeof blockFormSchema>;
export type Course = z.infer<typeof courseSchema>;
export type CourseCreateRequest = z.infer<typeof courseCreateRequestSchema>;
export type CourseDetail = z.infer<typeof courseDetailSchema>;
export type CourseDetailsFormInput = z.infer<typeof courseDetailsFormSchema>;
export type CourseFormInput = z.infer<typeof courseFormSchema>;
export type CourseUpdateRequest = z.infer<typeof courseUpdateRequestSchema>;
export type FirstLessonFormInput = z.infer<typeof firstLessonFormSchema>;
export type Lesson = z.infer<typeof lessonSchema>;
export type LessonCreateRequest = z.infer<typeof lessonCreateRequestSchema>;
export type LessonUpdateRequest = z.infer<typeof lessonUpdateRequestSchema>;
export type LessonFormInput = z.infer<typeof lessonFormSchema>;
export type MediaAsset = z.infer<typeof mediaAssetSchema>;
export type MediaAssetCreateRequest = z.infer<
  typeof mediaAssetCreateRequestSchema
>;
export type MediaFormInput = z.infer<typeof mediaFormSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type SectionCreateRequest = z.infer<typeof sectionCreateRequestSchema>;
export type SectionUpdateRequest = z.infer<typeof sectionUpdateRequestSchema>;
export type SectionFormInput = z.infer<typeof sectionFormSchema>;
export type CourseStructure = z.infer<typeof courseStructureSchema>;
