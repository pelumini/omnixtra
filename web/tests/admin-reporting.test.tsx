import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { analytics, learnerProgress } from "./fixtures";

describe("admin reporting UI", () => {
  it("renders completion analytics, learner progress, and CSV export", () => {
    const html = renderToStaticMarkup(
      <AdminDashboard
        analytics={analytics}
        csvUrl="http://localhost:8000/api/v1/admin/reports/learner-progress.csv"
        learnerProgress={learnerProgress}
        loadError={null}
      />,
    );

    expect(html).toContain("Dashboard");
    expect(html).toContain("Course Completion");
    expect(html).toContain("Learner Progress");
    expect(html).toContain("CSV");
    expect(html).toContain("Onboarding Essentials");
    expect(html).toContain("learner@example.com");
  });
});
