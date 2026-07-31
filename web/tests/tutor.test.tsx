import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TutorPanel } from "@/components/learning/tutor-panel";
import { courseId } from "./fixtures";

describe("tutor UI", () => {
  it("renders advisory AI disclosure, question entry, and ask action", () => {
    const html = renderToStaticMarkup(<TutorPanel courseId={courseId} />);

    expect(html).toContain("Tutor");
    expect(html).toContain("AI-generated guidance uses this course as its source.");
    expect(html).toContain("AI answers are advisory and should cite course material.");
    expect(html).toContain("Question");
    expect(html).toContain("Ask");
  });
});
