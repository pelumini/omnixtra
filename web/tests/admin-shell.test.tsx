import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AdminShell } from "@/components/layout/admin-shell";
import { AppShell } from "@/components/layout/app-shell";
import { AdminHome } from "@/features/dashboard";

import { analytics, learnerProgress } from "./fixtures";

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
    expect(adminHtml).toContain("md:top-14");
    expect(adminHtml).toContain("Acme Learning");
    expect(adminHtml).toContain("Dashboard");
    expect(adminHtml).toContain("My Courses");
    expect(adminHtml).toContain("Courses");
    expect(adminHtml).toContain("Members");
    expect(adminHtml).toContain("Billing");
    expect(memberHtml).toContain('href="/my-courses"');
    expect(memberHtml).toContain("My Courses");
    expect(memberHtml).toContain("Courses");
    expect(memberHtml).not.toContain("Dashboard");
    expect(memberHtml).not.toContain("Members");
    expect(memberHtml).not.toContain("Billing");
  });

  it("can render collapsed navigation without visible labels", () => {
    const html = renderToStaticMarkup(
      <AdminShell branding={branding} initialCollapsed viewerRole="tenant_admin">
        <div>Admin body</div>
      </AdminShell>,
    );

    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('title="Dashboard"');
    expect(html).not.toContain(">Dashboard</span>");
    expect(html).not.toContain(">Acme Learning</span>");
  });

  it("skeletons only the brand identity while branding is loading", () => {
    const html = renderToStaticMarkup(
      <AdminShell brandLoading branding={branding} viewerRole="tenant_admin">
        <div>Admin body</div>
      </AdminShell>,
    );

    expect(html).toContain('aria-label="Acme Learning home"');
    expect(html).not.toContain(">Acme Learning</span>");
    expect(html).toContain("animate-pulse");
    expect(html).toContain("Dashboard");
    expect(html).toContain("Admin body");
  });
});

describe("admin home", () => {
  it("renders the first-run checklist when the academy has no courses", () => {
    const html = renderToStaticMarkup(
      <AdminHome
        analytics={[]}
        courseCount={0}
        csvUrl="/api/v1/admin/reports/learner-progress.csv"
        learnerProgress={[]}
        loadError={null}
      />,
    );

    expect(html).toContain("Welcome, admin!");
    expect(html).toContain("Portal activity");
    expect(html).toContain("Quick actions");
    expect(html).toContain("Get started");
    expect(html).toContain("Create your first course");
    expect(html).toContain("Invite your team");
    expect(html).toContain("Add your branding");
    expect(html).not.toContain("Course Completion");
  });

  it("renders analytics once courses exist", () => {
    const html = renderToStaticMarkup(
      <AdminHome
        analytics={analytics}
        courseCount={1}
        csvUrl="/api/v1/admin/reports/learner-progress.csv"
        learnerProgress={learnerProgress}
        loadError={null}
      />,
    );

    expect(html).toContain("Admin dashboard");
    expect(html).toContain("Portal activity");
    expect(html).toContain("Quick actions");
    expect(html).toContain("Course Completion");
    expect(html).toContain("Onboarding Essentials");
    expect(html).not.toContain("Create your first course");
  });
});
