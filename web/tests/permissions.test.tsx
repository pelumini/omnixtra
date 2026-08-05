import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AppShell } from "@/components/app/app-shell";
import { MembersView } from "@/components/admin/members-view";
import { CourseBuilder } from "@/components/admin/course-builder";
import { AdminCourseList } from "@/components/admin/admin-course-list";
import { MyCoursesDashboard } from "@/components/learning/my-courses-dashboard";
import type { TenantBranding } from "@/lib/schemas";
import { e2eMyCourses } from "@/lib/e2e-fixtures";
import { draftCourse } from "./fixtures";

const branding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Acme Learning",
  time_zone: "UTC",
};

describe("ADR-003 frontend permissions", () => {
  it("filters org admin navigation by membership role", () => {
    const adminHtml = renderToStaticMarkup(
      <AppShell branding={branding} viewerRole="tenant_admin">
        <main>Loaded</main>
      </AppShell>,
    );
    const memberHtml = renderToStaticMarkup(
      <AppShell branding={branding} viewerRole="member">
        <main>Loaded</main>
      </AppShell>,
    );

    expect(adminHtml).toContain("Members");
    expect(adminHtml).toContain("Billing");
    expect(memberHtml).not.toContain("Members");
    expect(memberHtml).not.toContain("Billing");
    expect(memberHtml).toContain("Courses");
  });

  it("denies member management to non-admin memberships without rendering controls", () => {
    const html = renderToStaticMarkup(
      <MembersView
        initialMembers={[
          {
            id: "00000000-0000-0000-0000-000000000111",
            org_role: "tenant_admin",
            user_id: "00000000-0000-0000-0000-000000000112",
          },
        ]}
        loadError={null}
        seats={{ adminSeatsIncluded: 3, adminSeatsUsed: 1 }}
        viewerRole="member"
      />,
    );

    expect(html).toContain("This area is for admins");
    expect(html).not.toContain("Invite member");
    expect(html).not.toContain("00000000-0000-0000-0000-000000000112");
  });

  it("renders admin-seat limit feedback while still allowing member invitations", () => {
    const html = renderToStaticMarkup(
      <MembersView
        initialMembers={[]}
        initialInviteOpen
        initialInviteRole="tenant_admin"
        loadError={null}
        seats={{ adminSeatsIncluded: 1, adminSeatsUsed: 1 }}
        viewerRole="tenant_admin"
      />,
    );

    expect(html).toContain("used all 1 admin seats");
    expect(html).toContain("Send invitation");
  });

  it("hides academy-wide course creation from ordinary members", () => {
    const html = renderToStaticMarkup(
      <AdminCourseList initialCourses={[draftCourse]} loadError={null} viewerRole="member" />,
    );

    expect(html).toContain("Onboarding Essentials");
    expect(html).not.toContain("New Course");
    expect(html).not.toContain("Create");
  });

  it("denies authoring controls to non-owner course roles", () => {
    const html = renderToStaticMarkup(<CourseBuilder course={draftCourse} courseRole="learner" />);

    expect(html).toContain("This course is not yours to edit");
    expect(html).not.toContain("Publish");
    expect(html).not.toContain("Block");
  });

  it("renders only my-courses sections backed by enrolled course roles", () => {
    const html = renderToStaticMarkup(
      <MyCoursesDashboard
        courses={e2eMyCourses.filter((course) => course.course_role === "learner")}
        loadError={null}
        tenantName="Acme Learning"
      />,
    );

    expect(html).toContain("Courses I&#x27;m taking");
    expect(html).toContain("Security Basics");
    expect(html).not.toContain("Courses I facilitate");
    expect(html).not.toContain("Courses I own");
  });
});
