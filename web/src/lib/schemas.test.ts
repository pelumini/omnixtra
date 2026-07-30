import { describe, expect, it } from "vitest";

import {
  blockContentSchema,
  coursePageEnvelopeSchema,
  coursePlayerEnvelopeSchema,
  healthEnvelopeSchema,
  mediaAssetSchema,
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
