import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import {
  AdminCourseList,
  CourseBuilder,
  type Course,
  type CourseStructure,
} from "@/features/courses";
import { LearnerCoursePlayer, type CoursePlayer } from "@/features/learning";
import { MembersView, type Membership } from "@/features/members";
import { e2eFixturesEnabled } from "@/lib/e2e-fixtures";

import type { TenantBranding } from "@/lib/schemas/academy";

type PermissionFixturePageProps = {
  params: Promise<{
    scenario: string;
  }>;
};

const branding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Acme Learning",
  time_zone: "UTC",
};

const course: Course = {
  description: "Role-gated onboarding course",
  id: "00000000-0000-0000-0000-000000000901",
  lesson_count: 1,
  slug: "role-gated-onboarding",
  status: "draft",
  title: "Role Gated Onboarding",
};

const structure: CourseStructure = { ...course, sections: [] };

const memberships: Membership[] = [
  {
    email: "admin-one@example.com",
    full_name: "Admin One",
    id: "00000000-0000-0000-0000-000000000911",
    invitation_token: null,
    org_role: "tenant_admin",
    status: "active",
    user_id: "00000000-0000-0000-0000-000000000921",
  },
  {
    email: "admin-two@example.com",
    full_name: "Admin Two",
    id: "00000000-0000-0000-0000-000000000912",
    invitation_token: null,
    org_role: "tenant_admin",
    status: "active",
    user_id: "00000000-0000-0000-0000-000000000922",
  },
  {
    email: "admin-three@example.com",
    full_name: "Admin Three",
    id: "00000000-0000-0000-0000-000000000913",
    invitation_token: null,
    org_role: "tenant_admin",
    status: "active",
    user_id: "00000000-0000-0000-0000-000000000923",
  },
];

const player: CoursePlayer = {
  course_id: course.id,
  sections: [
    {
      id: "00000000-0000-0000-0000-000000000931",
      lessons: [
        {
          id: "00000000-0000-0000-0000-000000000941",
          percent_complete: 25,
          position: 0,
          title: "Learner Welcome",
        },
      ],
      position: 0,
      title: "Getting Started",
    },
  ],
  status: "published",
  title: "Learner Course A",
};

export default async function PermissionFixturePage({
  params,
}: PermissionFixturePageProps) {
  if (!e2eFixturesEnabled()) {
    notFound();
  }

  const { scenario } = await params;

  if (scenario === "admin") {
    return (
      <AppShell branding={branding} viewerRole="tenant_admin">
        <AdminCourseList
          initialCourses={[course]}
          loadError={null}
          viewerRole="tenant_admin"
        />
      </AppShell>
    );
  }

  if (scenario === "member") {
    return (
      <AppShell branding={branding} viewerRole="member">
        <AdminCourseList
          initialCourses={[course]}
          loadError={null}
          viewerRole="member"
        />
      </AppShell>
    );
  }

  if (scenario === "member-direct-members") {
    return (
      <MembersView
        initialMembers={memberships}
        loadError={null}
        seats={{ adminSeatsIncluded: 3, adminSeatsUsed: 3 }}
        viewerRole="member"
      />
    );
  }

  if (scenario === "admin-seat-limit") {
    return (
      <MembersView
        initialInviteOpen
        initialInviteRole="tenant_admin"
        initialMembers={memberships}
        loadError={null}
        seats={{ adminSeatsIncluded: 3, adminSeatsUsed: 3 }}
        viewerRole="tenant_admin"
      />
    );
  }

  if (scenario === "learner-course") {
    return (
      <LearnerCoursePlayer
        courseId={course.id}
        initialPlayer={player}
        loadError={null}
      />
    );
  }

  if (scenario === "learner-builder") {
    return (
      <CourseBuilder
        course={course}
        courseRole="learner"
        initialStructure={structure}
      />
    );
  }

  if (scenario === "course-owner-builder") {
    return (
      <CourseBuilder
        course={course}
        courseRole="course_owner"
        initialStructure={structure}
      />
    );
  }

  notFound();
}
