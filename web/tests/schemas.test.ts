import { describe, expect, it } from "vitest";

import {
  courseCompletionAnalyticsEnvelopeSchema,
  learnerProgressReportEnvelopeSchema,
} from "@/features/analytics";
import {
  billingPlansEnvelopeSchema,
  billingSubscriptionEnvelopeSchema,
} from "@/features/billing";
import {
  blockCreateRequestSchema,
  blockContentSchema,
  courseCreateRequestSchema,
  courseDetailEnvelopeSchema,
  coursePageEnvelopeSchema,
  lessonCreateRequestSchema,
  mediaAssetCreateRequestSchema,
  mediaAssetSchema,
} from "@/features/courses";
import {
  courseCompletionEnvelopeSchema,
  coursePlayerEnvelopeSchema,
  enrolmentEnvelopeSchema,
  lessonProgressRequestSchema,
  myCoursesEnvelopeSchema,
  quizAttemptRequestSchema,
  tutorEventSchema,
  tutorJobEnvelopeSchema,
} from "@/features/learning";
import {
  invitationAcceptRequestSchema,
  invitationPreviewEnvelopeSchema,
  membershipsEnvelopeSchema,
  userCreateEnvelopeSchema,
} from "@/features/members";
import {
  tenantBrandingEnvelopeSchema,
  tenantCreateEnvelopeSchema,
  tenantCreateRequestSchema,
} from "@/lib/schemas/academy";
import { sessionEnvelopeSchema } from "@/lib/schemas/auth";
import { healthEnvelopeSchema } from "@/lib/schemas/common";

describe("healthEnvelopeSchema", () => {
  it("accepts the API health envelope", () => {
    expect(
      healthEnvelopeSchema.parse({
        data: { status: "ok" },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }),
    ).toEqual({
      data: { status: "ok" },
      error: null,
      meta: { request_id: "req_test", timestamp: null },
    });
  });
});

describe("tenantBrandingEnvelopeSchema", () => {
  it("accepts configurable tenant branding responses", () => {
    expect(
      tenantBrandingEnvelopeSchema.parse({
        data: {
          locale: "en-GB",
          logo_url: "https://cdn.example/acme.png",
          primary_color: "#224466",
          tenant_name: "Acme Learning",
          time_zone: "Europe/London",
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.primary_color,
    ).toBe("#224466");
  });
});

describe("billingPlansEnvelopeSchema", () => {
  it("accepts billing plan catalog responses", () => {
    expect(
      billingPlansEnvelopeSchema.parse({
        data: [
          {
            currency: "usd",
            id: "00000000-0000-0000-0000-000000000001",
            included_admin_seats: 3,
            included_learners: 50,
            included_storage_gb: 10,
            monthly_price_cents: 4900,
            name: "Starter",
            slug: "starter",
            trial_days: 14,
          },
        ],
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data[0]?.slug,
    ).toBe("starter");
  });
});

describe("billingSubscriptionEnvelopeSchema", () => {
  it("accepts nullable current subscription responses", () => {
    expect(
      billingSubscriptionEnvelopeSchema.parse({
        data: null,
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data,
    ).toBeNull();
  });
});

describe("ADR-003 identity schemas", () => {
  it("validates tenant creation and invitation payloads", () => {
    expect(
      tenantCreateRequestSchema.parse({
        email: "admin@example.com",
        first_name: "Admin",
        last_name: "User",
        password: "correct horse battery staple",
        phone: "+44000000000",
        tenant_name: "Acme",
        tenant_slug: "acme",
      }).tenant_slug,
    ).toBe("acme");

    expect(
      invitationAcceptRequestSchema.parse({
        email: "member@example.com",
        password: "correct horse battery staple",
        token: "x".repeat(32),
      }).email,
    ).toBe("member@example.com");
  });

  it("accepts tenant creation, invitation, and membership envelopes", () => {
    expect(
      tenantCreateEnvelopeSchema.parse({
        data: {
          access_token: "token",
          membership_id: "00000000-0000-0000-0000-000000000002",
          tenant_id: "00000000-0000-0000-0000-000000000001",
          tenant_slug: "acme",
          token_type: "bearer",
          user_id: "00000000-0000-0000-0000-000000000003",
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.tenant_slug,
    ).toBe("acme");

    expect(
      userCreateEnvelopeSchema.parse({
        data: {
          activation_link: "https://acme.example.com/join?token=raw-token",
          email: "member@example.com",
          first_name: "Member",
          id: "00000000-0000-0000-0000-000000000005",
          last_name: "User",
          org_role: "member",
          phone: "+44000000000",
          status: "invited",
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.status,
    ).toBe("invited");

    expect(
      invitationPreviewEnvelopeSchema.parse({
        data: {
          organization_name: "Acme",
          email: "member@example.com",
          first_name: "Member",
          last_name: "User",
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data,
    ).toEqual({
      organization_name: "Acme",
      email: "member@example.com",
      first_name: "Member",
      last_name: "User",
    });

    expect(
      membershipsEnvelopeSchema.parse({
        data: [
          {
            email: "admin@example.com",
            full_name: "Admin User",
            id: "00000000-0000-0000-0000-000000000004",
            invitation_token: null,
            org_role: "tenant_admin",
            status: "active",
            user_id: "00000000-0000-0000-0000-000000000003",
          },
          {
            email: "pending@example.com",
            full_name: "Pending User",
            id: "00000000-0000-0000-0000-000000000006",
            invitation_token: null,
            org_role: "member",
            status: "invited",
            user_id: "00000000-0000-0000-0000-000000000007",
          },
        ],
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data[0]?.org_role,
    ).toBe("tenant_admin");
  });

  it("accepts auth session responses with nullable memberships", () => {
    expect(
      sessionEnvelopeSchema.parse({
        data: {
          membership: {
            org_role: "member",
            tenant_id: "00000000-0000-0000-0000-000000000001",
          },
          user: {
            email: "member@example.com",
            full_name: "Member User",
            id: "00000000-0000-0000-0000-000000000002",
          },
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.membership?.org_role,
    ).toBe("member");

    expect(
      sessionEnvelopeSchema.parse({
        data: {
          membership: null,
          user: {
            email: "pending@example.com",
            full_name: "Pending User",
            id: "00000000-0000-0000-0000-000000000003",
          },
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.membership,
    ).toBeNull();
  });
});

describe("admin reporting schemas", () => {
  it("accepts completion analytics and learner progress responses", () => {
    expect(
      courseCompletionAnalyticsEnvelopeSchema.parse({
        data: [
          {
            completed_count: 7,
            completion_percentage: 70,
            course_id: "00000000-0000-0000-0000-000000000010",
            course_title: "Security Basics",
            enrolled_count: 10,
          },
        ],
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data[0]?.completion_percentage,
    ).toBe(70);

    expect(
      learnerProgressReportEnvelopeSchema.parse({
        data: [
          {
            average_progress_percent: 80,
            completed_at: null,
            course_id: "00000000-0000-0000-0000-000000000010",
            course_title: "Security Basics",
            enrolment_status: "active",
            learner_email: "learner@example.com",
            learner_id: "00000000-0000-0000-0000-000000000011",
            learner_name: "Learner User",
            lessons_completed: 4,
            lessons_total: 5,
          },
        ],
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data[0]?.average_progress_percent,
    ).toBe(80);
  });
});

describe("coursePageEnvelopeSchema", () => {
  it("accepts the backend course list envelope", () => {
    expect(
      coursePageEnvelopeSchema.parse({
        data: {
          items: [
            {
              id: "00000000-0000-0000-0000-000000000001",
              title: "Security Basics",
              slug: "security-basics",
              description: "Required onboarding",
              thumbnail_url: null,
              category: null,
              tags: [],
              language: null,
              learning_outcomes: [],
              target_audience: null,
              difficulty: null,
              delivery_format: null,
              estimated_duration_minutes: null,
              status: "draft",
              lesson_count: 1,
            },
          ],
          next_cursor: null,
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.items[0]?.status,
    ).toBe("draft");
  });
});

describe("blockContentSchema", () => {
  it("validates authoring block content variants", () => {
    expect(
      blockContentSchema.parse({ type: "text", markdown: "Welcome" }).type,
    ).toBe("text");
    expect(
      blockContentSchema.parse({
        type: "quiz",
        question: "Ready?",
        options: [
          { id: "yes", text: "Yes" },
          { id: "no", text: "No" },
        ],
        correct_option_id: "yes",
      }).type,
    ).toBe("quiz");
  });

  it.each([
    { type: "image", url: "https://example.com/image.png", alt_text: "Example" },
    { type: "video", url: "https://example.com/video.mp4", caption: null },
    { type: "audio", url: "https://example.com/audio.mp3", caption: null },
    { type: "file", url: "https://example.com/file.pdf", file_name: "file.pdf", size_bytes: null },
  ])("accepts backend null media references for $type blocks", (content) => {
    expect(
      blockContentSchema.parse({ ...content, asset_id: null, object_key: null }),
    ).toMatchObject({ asset_id: null, object_key: null, type: content.type });
  });
});

describe("courseCreateRequestSchema", () => {
  it("validates backend course creation payloads", () => {
    expect(
      courseCreateRequestSchema.parse({
        description: null,
        slug: "security-basics",
        title: "Security Basics",
      }).slug,
    ).toBe("security-basics");
  });

  it("allows slugless course creation so the backend can generate one", () => {
    expect(
      courseCreateRequestSchema.parse({
        description: "Created from the first-run authoring flow",
        title: "Security Basics",
      }).slug,
    ).toBeUndefined();
  });
});

describe("lessonCreateRequestSchema", () => {
  it("accepts a first text lesson without requiring a section from the UI", () => {
    expect(
      lessonCreateRequestSchema.parse({
        body: "Start here with the required training.",
        title: "Welcome",
      }).body,
    ).toBe("Start here with the required training.");
  });
});

describe("courseDetailEnvelopeSchema", () => {
  it("accepts a course with ordered readable lessons", () => {
    expect(
      courseDetailEnvelopeSchema.parse({
        data: {
          description: "Required onboarding",
          thumbnail_url: "https://cdn.example.com/security.png",
          category: "Security",
          tags: ["required"],
          language: "en",
          learning_outcomes: ["Recognize common threats"],
          target_audience: "All employees",
          difficulty: "beginner",
          delivery_format: "self_paced",
          estimated_duration_minutes: 45,
          id: "00000000-0000-0000-0000-000000000001",
          lesson_count: 1,
          lessons: [
            {
              body: "Welcome to the academy.",
              course_id: "00000000-0000-0000-0000-000000000001",
              id: "00000000-0000-0000-0000-000000000002",
              position: 0,
              section_id: "00000000-0000-0000-0000-000000000003",
              title: "Welcome",
            },
          ],
          slug: "security-basics",
          status: "draft",
          title: "Security Basics",
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.lessons[0]?.body,
    ).toBe("Welcome to the academy.");
  });
});

describe("blockCreateRequestSchema", () => {
  it("requires block_type to match content type", () => {
    expect(() =>
      blockCreateRequestSchema.parse({
        block_type: "video",
        content: { markdown: "Welcome", type: "text" },
        lesson_id: "00000000-0000-0000-0000-000000000012",
        position: 0,
      }),
    ).toThrow();
  });
});

describe("mediaAssetCreateRequestSchema", () => {
  it("validates tenant media metadata payloads", () => {
    expect(
      mediaAssetCreateRequestSchema.parse({
        byte_size: 2048,
        checksum_sha256: null,
        content_type: "video/mp4",
        file_name: "intro.mp4",
        object_key: "tenants/current/courses/course-id/intro.mp4",
      }).content_type,
    ).toBe("video/mp4");
  });
});

describe("mediaAssetSchema", () => {
  it("validates tenant-scoped media metadata responses", () => {
    const tenantId = "00000000-0000-0000-0000-000000000001";
    const courseId = "00000000-0000-0000-0000-000000000002";

    expect(
      mediaAssetSchema.parse({
        id: "00000000-0000-0000-0000-000000000003",
        course_id: courseId,
        object_key: `tenants/${tenantId}/courses/${courseId}/hero.png`,
        file_name: "hero.png",
        content_type: "image/png",
        byte_size: 1024,
        checksum_sha256: null,
      }).object_key,
    ).toContain(`/courses/${courseId}/`);
  });
});

describe("coursePlayerEnvelopeSchema", () => {
  it("accepts the backend course player envelope", () => {
    expect(
      coursePlayerEnvelopeSchema.parse({
        data: {
          course_id: "00000000-0000-0000-0000-000000000010",
          title: "Security Basics",
          status: "published",
          sections: [
            {
              id: "00000000-0000-0000-0000-000000000011",
              title: "Welcome",
              position: 0,
              lessons: [
                {
                  id: "00000000-0000-0000-0000-000000000012",
                  title: "Start here",
                  position: 0,
                  percent_complete: 80,
                },
              ],
            },
          ],
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.sections[0]?.lessons[0]?.percent_complete,
    ).toBe(80);
  });
});

describe("myCoursesEnvelopeSchema", () => {
  it("accepts flat my-courses responses tagged by enrolment course role", () => {
    expect(
      myCoursesEnvelopeSchema.parse({
        data: {
          courses: [
            {
              course_id: "00000000-0000-0000-0000-000000000010",
              course_role: "facilitator",
              progress: {
                completed_lessons: 1,
                percent_complete: 50,
                total_lessons: 2,
              },
              slug: "security-basics",
              status: "published",
              title: "Security Basics",
            },
          ],
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.courses[0]?.course_role,
    ).toBe("facilitator");
  });
});

describe("learning workflow schemas", () => {
  it("validates lesson progress and quiz attempt payloads", () => {
    expect(
      lessonProgressRequestSchema.parse({
        last_position: 30,
        percent_complete: 80,
      }),
    ).toEqual({
      last_position: 30,
      percent_complete: 80,
    });
    expect(
      quizAttemptRequestSchema.parse({ selected_option_id: "a" })
        .selected_option_id,
    ).toBe("a");
  });

  it("accepts course completion envelopes", () => {
    expect(
      courseCompletionEnvelopeSchema.parse({
        data: {
          completed_at: "2026-07-30T10:00:00Z",
          course_id: "00000000-0000-0000-0000-000000000010",
          id: "00000000-0000-0000-0000-000000000013",
          learner_id: "00000000-0000-0000-0000-000000000014",
          status: "completed",
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.status,
    ).toBe("completed");
  });

  it("accepts enrolment course roles", () => {
    expect(
      enrolmentEnvelopeSchema.parse({
        data: {
          course_id: "00000000-0000-0000-0000-000000000010",
          course_role: "learner",
          id: "00000000-0000-0000-0000-000000000015",
          learner_id: "00000000-0000-0000-0000-000000000014",
          status: "active",
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.course_role,
    ).toBe("learner");
  });
});

describe("tutorJobEnvelopeSchema", () => {
  it("accepts queued tutor job responses", () => {
    expect(
      tutorJobEnvelopeSchema.parse({
        data: {
          id: "00000000-0000-0000-0000-000000000020",
          conversation_id: "00000000-0000-0000-0000-000000000021",
          course_id: "00000000-0000-0000-0000-000000000010",
          status: "queued",
        },
        error: null,
        meta: { request_id: "req_test", timestamp: null },
      }).data.status,
    ).toBe("queued");
  });
});

describe("tutorEventSchema", () => {
  it("accepts Redis-backed tutor completion events", () => {
    expect(
      tutorEventSchema.parse({
        data: {
          answer: "AI-generated guidance",
          citations: [{ chunk_index: 0 }],
          status: "completed",
        },
        event: "completed",
      }).event,
    ).toBe("completed");
  });
});
