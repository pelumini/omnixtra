import { describe, expect, it } from "vitest";

import {
  blockCreateRequestSchema,
  blockContentSchema,
  courseCreateRequestSchema,
  courseCompletionEnvelopeSchema,
  coursePageEnvelopeSchema,
  coursePlayerEnvelopeSchema,
  healthEnvelopeSchema,
  lessonProgressRequestSchema,
  mediaAssetCreateRequestSchema,
  mediaAssetSchema,
  quizAttemptRequestSchema,
  tenantBrandingEnvelopeSchema,
  tutorEventSchema,
  tutorJobEnvelopeSchema,
} from "@/lib/schemas";

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
              status: "draft",
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
    expect(blockContentSchema.parse({ type: "text", markdown: "Welcome" }).type).toBe("text");
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

describe("learning workflow schemas", () => {
  it("validates lesson progress and quiz attempt payloads", () => {
    expect(lessonProgressRequestSchema.parse({ last_position: 30, percent_complete: 80 })).toEqual({
      last_position: 30,
      percent_complete: 80,
    });
    expect(quizAttemptRequestSchema.parse({ selected_option_id: "a" }).selected_option_id).toBe("a");
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
