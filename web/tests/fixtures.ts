import type {
  CourseCompletionAnalytics,
  LearnerProgressReportRow,
} from "@/features/analytics";
import type { BillingPlan } from "@/features/billing";
import type { Course, CourseStructure } from "@/features/courses/schemas";
import type { CoursePlayer } from "@/features/learning";

export const courseId = "00000000-0000-0000-0000-000000000101";
export const sectionId = "00000000-0000-0000-0000-000000000201";
export const lessonId = "00000000-0000-0000-0000-000000000301";
export const learnerId = "00000000-0000-0000-0000-000000000401";

export const draftCourse: Course = {
  category: null,
  description: "New hire onboarding",
  delivery_format: null,
  difficulty: null,
  estimated_duration_minutes: null,
  id: courseId,
  language: null,
  learning_outcomes: [],
  lesson_count: 1,
  slug: "onboarding",
  status: "draft",
  tags: [],
  target_audience: null,
  thumbnail_url: null,
  title: "Onboarding Essentials",
};

export const publishedCourse: Course = {
  ...draftCourse,
  status: "published",
};

export const courseStructure: CourseStructure = {
  ...draftCourse,
  sections: [
    {
      course_id: courseId,
      id: sectionId,
      position: 0,
      title: "Getting Started",
      lessons: [
        {
          blocks: [
            {
              block_type: "text",
              content: { type: "text", markdown: "Welcome content" },
              course_id: courseId,
              id: "00000000-0000-0000-0000-000000000601",
              lesson_id: lessonId,
              position: 0,
            },
          ],
          body: "Welcome content",
          course_id: courseId,
          id: lessonId,
          position: 0,
          section_id: sectionId,
          title: "Welcome",
        },
      ],
    },
  ],
};

export const coursePlayer: CoursePlayer = {
  course_id: courseId,
  sections: [
    {
      id: sectionId,
      lessons: [
        {
          id: lessonId,
          percent_complete: 50,
          position: 0,
          title: "Welcome",
        },
      ],
      position: 0,
      title: "Getting Started",
    },
  ],
  status: "published",
  title: "Onboarding Essentials",
};

export const analytics: CourseCompletionAnalytics[] = [
  {
    completed_count: 7,
    completion_percentage: 70,
    course_id: courseId,
    course_title: "Onboarding Essentials",
    enrolled_count: 10,
  },
];

export const learnerProgress: LearnerProgressReportRow[] = [
  {
    average_progress_percent: 80,
    completed_at: null,
    course_id: courseId,
    course_title: "Onboarding Essentials",
    enrolment_status: "active",
    learner_email: "learner@example.com",
    learner_id: learnerId,
    learner_name: "Learner One",
    lessons_completed: 4,
    lessons_total: 5,
  },
];

export const starterPlan: BillingPlan = {
  currency: "usd",
  id: "00000000-0000-0000-0000-000000000501",
  included_admin_seats: 3,
  included_learners: 50,
  included_storage_gb: 10,
  monthly_price_cents: 4900,
  name: "Starter",
  slug: "starter",
  trial_days: 14,
};
