import { z } from "zod";

import { courseRoleSchema, courseStatusSchema, metaSchema } from "@/lib/schemas/common";
import { requiredText, textSchema } from "@/lib/validation/primitives";

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

export const courseProgressSummarySchema = z.object({
  completed_lessons: z.number().int().nonnegative(),
  total_lessons: z.number().int().nonnegative(),
  percent_complete: z.number().int().min(0).max(100),
});

export const myCourseSchema = z.object({
  course_id: z.string().uuid(),
  title: z.string(),
  slug: z.string(),
  status: courseStatusSchema,
  course_role: courseRoleSchema,
  progress: courseProgressSummarySchema.nullable(),
});

export const myCoursesSchema = z.object({
  courses: z.array(myCourseSchema),
});

export const myCoursesEnvelopeSchema = z.object({
  data: myCoursesSchema,
  error: z.null(),
  meta: metaSchema,
});

export const enrolmentSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  course_role: courseRoleSchema,
  status: z.string(),
});

export const enrolmentEnvelopeSchema = z.object({
  data: enrolmentSchema,
  error: z.null(),
  meta: metaSchema,
});

export const lessonProgressRequestSchema = z.object({
  last_position: z.number().int().nonnegative(),
  percent_complete: z.number().int().min(0).max(100),
});

export const lessonProgressSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  last_position: z.number().int().nonnegative(),
  percent_complete: z.number().int().min(0).max(100),
  completed_at: z.string().datetime().nullable(),
});

export const lessonProgressEnvelopeSchema = z.object({
  data: lessonProgressSchema,
  error: z.null(),
  meta: metaSchema,
});

export const quizAttemptRequestSchema = z.object({
  selected_option_id: z.string().min(1).max(64),
});

export const quizAttemptSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  lesson_id: z.string().uuid(),
  block_id: z.string().uuid(),
  selected_option_id: z.string(),
  score_percent: z.number().int().min(0).max(100),
  passed: z.boolean(),
});

export const quizAttemptEnvelopeSchema = z.object({
  data: quizAttemptSchema,
  error: z.null(),
  meta: metaSchema,
});

export const courseCompletionSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  status: z.string(),
  completed_at: z.string().datetime(),
});

export const courseCompletionEnvelopeSchema = z.object({
  data: courseCompletionSchema,
  error: z.null(),
  meta: metaSchema,
});

export const certificateSchema = z.object({
  id: z.string().uuid(),
  learner_id: z.string().uuid(),
  course_id: z.string().uuid(),
  completion_id: z.string().uuid(),
  certificate_number: z.string(),
  status: z.string(),
  pdf_object_key: z.string().nullable(),
});

export const certificateEnvelopeSchema = z.object({
  data: certificateSchema,
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

export const tutorEventSchema = z.object({
  event: z.string(),
  data: z.record(z.unknown()),
});

export const quizAttemptFormSchema = z.object({
  blockId: requiredText,
  selectedOptionId: requiredText,
});

export type QuizAttemptFormInput = z.infer<typeof quizAttemptFormSchema>;

export const tutorQuestionFormSchema = z.object({
  question: textSchema(3, 2000),
});

export type TutorQuestionFormInput = z.infer<typeof tutorQuestionFormSchema>;

export type CourseCompletion = z.infer<typeof courseCompletionSchema>;
export type CoursePlayer = z.infer<typeof coursePlayerSchema>;
export type Enrolment = z.infer<typeof enrolmentSchema>;
export type LessonProgress = z.infer<typeof lessonProgressSchema>;
export type LessonProgressRequest = z.infer<typeof lessonProgressRequestSchema>;
export type MyCourse = z.infer<typeof myCourseSchema>;
export type MyCourses = z.infer<typeof myCoursesSchema>;
export type Certificate = z.infer<typeof certificateSchema>;
export type QuizAttempt = z.infer<typeof quizAttemptSchema>;
export type TutorJob = z.infer<typeof tutorJobSchema>;
export type TutorEvent = z.infer<typeof tutorEventSchema>;
