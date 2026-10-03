import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { LearnerCoursePlayer } from "@/features/learning";
import { courseId, coursePlayer } from "./fixtures";

describe("course player UI", () => {
  it("renders progress, resume, quiz, completion, certificate, and tutor surfaces", () => {
    const html = renderToStaticMarkup(
      <LearnerCoursePlayer courseId={courseId} initialPlayer={coursePlayer} loadError={null} />,
    );

    expect(html).toContain("Onboarding Essentials");
    expect(html).toContain("Progress");
    expect(html).toContain("50%");
    expect(html).toContain("Resume");
    expect(html).toContain("Done");
    expect(html).toContain("Complete");
    expect(html).toContain("Quiz");
    expect(html).toContain("Certificate");
    expect(html).toContain("Tutor");
  });
});
