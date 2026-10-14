import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CourseBuilder } from "@/features/courses";

import { courseStructure, draftCourse } from "./fixtures";

describe("course builder UI", () => {
  it("renders the full-screen outline and node-based lesson composer", () => {
    const html = renderToStaticMarkup(
      <CourseBuilder course={draftCourse} initialStructure={courseStructure} />,
    );

    expect(html).toContain("Onboarding Essentials");
    expect(html).toContain("Course outline");
    expect(html).toContain("Chapters and lessons");
    expect(html).toContain("Lesson editor");
    expect(html).toContain("Add content");
    expect(html).toContain("Preview");
    expect(html).toContain("Publish");
    expect(html).toContain("Getting Started");
    expect(html).toContain("Welcome");
    expect(html).toContain("Text content");
    expect(html).toContain("Save");
  });
});
