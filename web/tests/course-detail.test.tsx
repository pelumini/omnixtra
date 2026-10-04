import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

import { AdminCourseList, CourseDetail } from "@/features/courses";

import { courseId, draftCourse, lessonId, sectionId } from "./fixtures";

describe("course detail authoring slice", () => {
  it("renders a course with ordered readable text lessons and the add-lesson form", () => {
    const html = renderToStaticMarkup(
      <CourseDetail
        course={{
          ...draftCourse,
          lessons: [
            {
              body: "This is the learner-readable first lesson.",
              course_id: courseId,
              id: lessonId,
              position: 0,
              section_id: sectionId,
              title: "Welcome",
            },
          ],
        }}
      />,
    );

    expect(html).toContain("Onboarding Essentials");
    expect(html).toContain("draft");
    expect(html).toContain("Welcome");
    expect(html).toContain("This is the learner-readable first lesson.");
    expect(html).toContain("Add lesson");
  });

  it("renders created courses with lesson count on the admin course list", () => {
    const html = renderToStaticMarkup(
      <AdminCourseList initialCourses={[draftCourse]} loadError={null} viewerRole="tenant_admin" />,
    );

    expect(html).toContain("Onboarding Essentials");
    expect(html).toContain("1 lesson");
    expect(html).toContain("Add course");
    expect(html).not.toContain("First content type");
  });

  it("shows standard content choices when a new academy starts its first course", () => {
    const html = renderToStaticMarkup(
      <AdminCourseList initialCourses={[]} loadError={null} viewerRole="tenant_admin" />,
    );

    expect(html).toContain("First content type");
    expect(html).toContain("Content");
    expect(html).toContain("Web content");
    expect(html).toContain("Video");
    expect(html).toContain("Image");
    expect(html).toContain("Quiz");
  });
});
