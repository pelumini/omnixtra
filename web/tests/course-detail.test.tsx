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
              estimated_duration_minutes: null,
              id: lessonId,
              image_url: null,
              position: 0,
              section_id: sectionId,
              summary: null,
              required_for_completion: false,
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
      <AdminCourseList
        initialCourses={[draftCourse]}
        loadError={null}
        viewerRole="tenant_admin"
      />,
    );

    expect(html).toContain("Onboarding Essentials");
    expect(html).toContain("1 lesson");
    expect(html).toContain("Add course");
    expect(html).toContain('role="link"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain("More actions for Onboarding Essentials");
    expect(html).not.toContain("Builder");
    expect(html).not.toContain("1 visible");
    expect(html).not.toContain("First content type");
    expect(html).not.toContain("First lesson title");
  });

  it("does not auto-open course creation for a new academy", () => {
    const html = renderToStaticMarkup(
      <AdminCourseList
        initialCourses={[]}
        loadError={null}
        viewerRole="tenant_admin"
      />,
    );

    expect(html).toContain("Add course");
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain("First content type");
  });
});
