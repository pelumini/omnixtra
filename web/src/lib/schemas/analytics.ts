import { z } from "zod";

import { metaSchema } from "@/lib/schemas/common";

export const courseCompletionAnalyticsSchema = z.object({
  course_id: z.string().uuid(),
  course_title: z.string(),
  enrolled_count: z.number().int().nonnegative(),
  completed_count: z.number().int().nonnegative(),
  completion_percentage: z.number().int().min(0).max(100),
});

export const courseCompletionAnalyticsEnvelopeSchema = z.object({
  data: z.array(courseCompletionAnalyticsSchema),
  error: z.null(),
  meta: metaSchema,
});

export const learnerProgressReportRowSchema = z.object({
  learner_id: z.string().uuid(),
  learner_name: z.string(),
  learner_email: z.string().email(),
  course_id: z.string().uuid(),
  course_title: z.string(),
  enrolment_status: z.string(),
  lessons_total: z.number().int().nonnegative(),
  lessons_completed: z.number().int().nonnegative(),
  average_progress_percent: z.number().int().min(0).max(100),
  completed_at: z.string().datetime().nullable(),
});

export const learnerProgressReportEnvelopeSchema = z.object({
  data: z.array(learnerProgressReportRowSchema),
  error: z.null(),
  meta: metaSchema,
});

export type CourseCompletionAnalytics = z.infer<typeof courseCompletionAnalyticsSchema>;
export type LearnerProgressReportRow = z.infer<typeof learnerProgressReportRowSchema>;
