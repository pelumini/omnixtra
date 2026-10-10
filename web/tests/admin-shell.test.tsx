import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/layout/app-shell";
import { AdminHome } from "@/features/dashboard";

import { analytics, draftCourse, learnerProgress } from "./fixtures";

import type { TenantBranding } from "@/lib/schemas/academy";

const branding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Acme Learning",
  time_zone: "UTC",
};

describe("admin shell", () => {
  it("renders role-filtered shared navigation and role-home logo links", () => {
    const adminHtml = renderToStaticMarkup(
      <AppShell branding={branding} viewerRole="tenant_admin">
        <div>Admin body</div>
      </AppShell>,
    );
    const memberHtml = renderToStaticMarkup(
      <AppShell branding={branding} viewerRole="member">
        <div>Member body</div>
      </AppShell>,
    );

    expect(adminHtml).toContain('href="/admin"');
    expect(adminHtml).toContain("md:sticky");
    expect(adminHtml).toContain("relative hidden border-b");
    expect(adminHtml).toContain("md:top-0");
    expect(adminHtml).toContain("md:h-screen");
    expect(adminHtml).toContain("md:w-52");
    expect(adminHtml).toContain("Acme Learning");
    expect(adminHtml).toContain("MAIN");
    expect(adminHtml).toContain("Dashboard");
    expect(adminHtml).toContain("My Courses");
    expect(adminHtml).toContain("Courses");
    expect(adminHtml).toContain("Members");
    expect(adminHtml).toContain("Billing");
    expect(adminHtml).toContain("pt-14 md:pt-16");
    expect(memberHtml).toContain('href="/my-courses"');
    expect(memberHtml).toContain("My Courses");
    expect(memberHtml).toContain("Courses");
    expect(memberHtml).not.toContain("Dashboard");
    expect(memberHtml).not.toContain("Members");
    expect(memberHtml).not.toContain("Billing");
  });

  it("can render collapsed navigation without visible labels", () => {
    const html = renderToStaticMarkup(
      <AppShell branding={branding} initialCollapsed viewerRole="tenant_admin">
        <div>Admin body</div>
      </AppShell>,
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain("md:w-20");
    expect(html).toContain('title="Dashboard"');
    expect(html).not.toContain(">Dashboard</span>");
    expect(html).not.toContain(">Acme Learning</span>");
  });
});

describe("admin home", () => {
  it("renders the first-run checklist when the academy has no courses", () => {
    const html = renderToStaticMarkup(
      <AdminHome
        analytics={[]}
        courseCount={0}
        membersCount={2}
        csvUrl="/api/v1/admin/reports/learner-progress.csv"
        learnerProgress={[]}
        loadError={null}
      />,
    );

    expect(html).toContain("Welcome Back, admin");
    expect(html).toContain("No Course Yet");
    expect(html).toContain("No Activity");
    expect(html).toContain("empty-state.svg");
    expect(html).toContain("Members");
    expect(html).toContain(">2<");
    expect(html).toContain("Create your first course");
    expect(html).toContain("Invite your team");
    expect(html).toContain("Add your branding");
    expect(html).toContain("Add New Course");
    expect(html).toContain("inset-x-5");
    expect(html).toContain("rounded-full");
    expect(html).toContain("hidden gap-3 md:grid");
    expect(html).toContain("grid gap-3 md:hidden");
  });

  it("renders analytics once courses exist", () => {
    const html = renderToStaticMarkup(
      <AdminHome
        analytics={analytics}
        courseCount={1}
        courses={[draftCourse]}
        csvUrl="/api/v1/admin/reports/learner-progress.csv"
        learnerProgress={learnerProgress}
        loadError={null}
      />,
    );

    expect(html).toContain("Welcome Back, admin");
    expect(html).toContain("Learning Content");
    expect(html).toContain("Recent Activity");
    expect(html).toContain("Onboarding Essentials");
    expect(html).toContain("Course published");
  });
});
