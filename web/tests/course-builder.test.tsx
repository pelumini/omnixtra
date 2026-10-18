import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CourseBuilder } from "@/features/courses";

import { courseStructure, draftCourse } from "./fixtures";

describe("course builder UI", () => {
  it("lands on course focus with persistent and contextual navigation", () => {
    const html = renderToStaticMarkup(
      <CourseBuilder course={draftCourse} initialStructure={courseStructure} />,
    );

    expect(html).toContain("Onboarding Essentials");
    expect(html).toContain("Course Builder");
    expect(html).toContain('aria-label="Builder breadcrumb"');
    expect(html).toContain("Course outline");
    expect(html).toContain("Chapters and lessons");
    expect(html).toContain("Add chapter");
    expect(html).toContain("Course settings");
    expect(html).toContain("Preview");
    expect(html).toContain("Publish");
    expect(html).toContain("Getting Started");
    expect(html).toContain("Welcome");
    expect(html).toContain("Saved");
    expect(html.match(/Saved/g)).toHaveLength(1);
    expect(html).not.toContain("Lesson editor");
    expect(html).not.toContain("Text content");
    expect(html).not.toContain("New chapter title");
    expect(html).not.toContain("New lesson title");
    expect(html).not.toContain("Move Getting Started up");
    expect(html).not.toContain("Save chapter details");
    expect(html).not.toContain("Save lesson details");
    expect(html).not.toContain("Save setup");
  });
});
