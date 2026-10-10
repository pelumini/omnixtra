import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminDashboard } from "@/features/dashboard";

import { analytics, draftCourse, learnerProgress } from "./fixtures";

describe("admin reporting UI", () => {
  it("renders completion analytics, learner progress, and CSV export", () => {
    const html = renderToStaticMarkup(
      <AdminDashboard
        analytics={analytics}
        courses={[draftCourse]}
        csvUrl="http://localhost:8000/api/v1/admin/reports/learner-progress.csv"
        learnerProgress={learnerProgress}
        loadError={null}
      />,
    );

    expect(html).toContain("Welcome Back, admin");
    expect(html).toContain("Completions");
    expect(html).toContain(">7<");
    expect(html).toContain("Recent Activity");
    expect(html).toContain("Onboarding Essentials");
  });
});
