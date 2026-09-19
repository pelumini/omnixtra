import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { CourseBuilder } from "@/components/admin/course-builder";
import { draftCourse } from "./fixtures";

describe("course builder UI", () => {
  it("renders MVP authoring controls for course details, media, lessons, standard content, and publish", () => {
    const html = renderToStaticMarkup(<CourseBuilder course={draftCourse} />);

    expect(html).toContain("Onboarding Essentials");
    expect(html).toContain("Details");
    expect(html).toContain("Media");
    expect(html).toContain("Section");
    expect(html).toContain("Lesson");
    expect(html).toContain("Add standard content");
    expect(html).toContain("Content");
    expect(html).toContain("Web content");
    expect(html).toContain("Video");
    expect(html).toContain("Image");
    expect(html).toContain("Quiz");
    expect(html).not.toContain("TalentCraft");
    expect(html).not.toContain("Learning Activities");
    expect(html).toContain("Publish");
  });
});
