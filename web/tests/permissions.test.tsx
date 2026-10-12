import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/courses",
  useRouter: () => router,
}));

import { SessionHeader } from "@/components/layout/session-header";
import { AdminCourseList, CourseBuilder } from "@/features/courses";
import { MyCoursesDashboard } from "@/features/learning";
import { MembersView } from "@/features/members";
import { e2eMyCourses } from "@/lib/e2e-fixtures";

import { draftCourse } from "./fixtures";

import type { TenantBranding } from "@/lib/schemas/academy";

const branding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Acme Learning",
  time_zone: "UTC",
};

const adminSession = {
  membership: {
    org_role: "tenant_admin" as const,
    tenant_id: "00000000-0000-0000-0000-000000000203",
  },
  user: {
    email: "admin@example.com",
    full_name: "Admin User",
    id: "00000000-0000-0000-0000-000000000202",
  },
};

const memberSession = {
  membership: {
    org_role: "member" as const,
    tenant_id: "00000000-0000-0000-0000-000000000303",
  },
  user: {
    email: "member@example.com",
    full_name: "Member User",
    id: "00000000-0000-0000-0000-000000000302",
  },
};

describe("ADR-003 frontend permissions", () => {
  it("filters org admin navigation by membership role", () => {
    const adminHtml = renderToStaticMarkup(
      <SessionHeader branding={branding} initialSession={adminSession} />,
    );
    const memberHtml = renderToStaticMarkup(
      <SessionHeader branding={branding} initialSession={memberSession} />,
    );

    expect(adminHtml).toContain("Admin User");
    expect(adminHtml).toContain("Notifications");
    expect(adminHtml).not.toContain("Sign in");
    expect(adminHtml).not.toContain('href="/admin/members"');
    expect(adminHtml).not.toContain('href="/pricing"');
    expect(memberHtml).not.toContain('href="/admin/members"');
    expect(memberHtml).not.toContain('href="/pricing"');
    expect(memberHtml).toContain("Member User");
    expect(memberHtml).not.toContain("Sign in");
  });

  it("denies member management to non-admin memberships without rendering controls", () => {
    const html = renderToStaticMarkup(
      <MembersView
        initialMembers={[
          {
            email: "admin@example.com",
            full_name: "Admin User",
            id: "00000000-0000-0000-0000-000000000111",
            invitation_token: null,
            org_role: "tenant_admin",
            status: "active",
            user_id: "00000000-0000-0000-0000-000000000112",
          },
        ]}
        loadError={null}
        seats={{ adminSeatsIncluded: 3, adminSeatsUsed: 1 }}
        viewerRole="member"
      />,
    );

    expect(html).toContain("This area is for admins");
    expect(html).not.toContain("Create user");
    expect(html).not.toContain("00000000-0000-0000-0000-000000000112");
  });

  it("renders member identity and pending status without exposing ids", () => {
    const html = renderToStaticMarkup(
      <MembersView
        initialMembers={[
          {
            email: "active@example.com",
            full_name: "Active Member",
            id: "00000000-0000-0000-0000-000000000121",
            invitation_token: null,
            org_role: "member",
            status: "active",
            user_id: "00000000-0000-0000-0000-000000000122",
          },
          {
            email: "pending@example.com",
            full_name: "Pending Member",
            id: "00000000-0000-0000-0000-000000000131",
            invitation_token: null,
            org_role: "tenant_admin",
            status: "invited",
            user_id: "00000000-0000-0000-0000-000000000132",
          },
        ]}
        loadError={null}
        seats={{ adminSeatsIncluded: 3, adminSeatsUsed: 1 }}
        viewerRole="tenant_admin"
      />,
    );

    expect(html).toContain("Active Member");
    expect(html).toContain("active@example.com");
    expect(html).toContain("pending@example.com");
    expect(html).toContain("Pending Member");
    expect(html).toContain("Pending");
    expect(html).toContain('placeholder="Search by name or email"');
    expect(html).toContain(">All<");
    expect(html).toContain(">Active<");
    expect(html).not.toContain("Access management");
    expect(html).not.toContain("People in your academy and their access.");
    expect(html).not.toContain("Copy invite link");
    expect(html).not.toContain("00000000-0000-0000-0000-000000000122");
    expect(html).not.toContain("00000000-0000-0000-0000-000000000131");
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
    expect(html).toContain("Create user");
  });

  it("hides academy-wide course creation from ordinary members", () => {
    const html = renderToStaticMarkup(
      <AdminCourseList initialCourses={[draftCourse]} loadError={null} viewerRole="member" />,
    );

    expect(html).toContain("Onboarding Essentials");
    expect(html).not.toContain("New Course");
    expect(html).not.toContain("Create");
  });

  it("renders course controls once and moves the complete creation form into the shared dialog", () => {
    const listHtml = renderToStaticMarkup(
      <AdminCourseList initialCourses={[draftCourse]} loadError={null} />,
    );
    const emptyHtml = renderToStaticMarkup(
      <AdminCourseList initialCourses={[]} loadError={null} />,
    );

    expect(listHtml.match(/placeholder="Search courses"/g)).toHaveLength(1);
    expect(listHtml).toContain("Add course");
    expect(listHtml).toContain("1 visible");
    expect(listHtml).not.toContain("Course operations");
    expect(listHtml).not.toContain('role="dialog"');
    expect(emptyHtml).toContain('role="dialog"');
    expect(emptyHtml).toContain("Create a course");
    expect(emptyHtml).toContain("First content type");
    expect(emptyHtml).toContain("Course title");
    expect(emptyHtml).toContain("Course description");
    expect(emptyHtml).toContain("First lesson title");
    expect(emptyHtml).toContain("First lesson content");
    expect(emptyHtml).toContain("Create course");
    expect(emptyHtml).toContain("Cancel");
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
