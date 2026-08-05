import type { MyCourse, SessionResponse, TenantBranding } from "@/lib/schemas";

export const e2eBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Acme Learning",
  time_zone: "UTC",
};

export const e2eAdminSession: SessionResponse = {
  membership: {
    org_role: "tenant_admin",
    tenant_id: "00000000-0000-0000-0000-000000000701",
  },
  user: {
    email: "admin@example.com",
    full_name: "Admin User",
    id: "00000000-0000-0000-0000-000000000702",
  },
};

export const e2eMemberSession: SessionResponse = {
  membership: {
    org_role: "member",
    tenant_id: "00000000-0000-0000-0000-000000000701",
  },
  user: {
    email: "member@example.com",
    full_name: "Member User",
    id: "00000000-0000-0000-0000-000000000703",
  },
};

export const e2ePendingSession: SessionResponse = {
  membership: null,
  user: {
    email: "pending@example.com",
    full_name: "Pending User",
    id: "00000000-0000-0000-0000-000000000704",
  },
};

export const e2eMyCourses: MyCourse[] = [
  {
    course_id: "00000000-0000-0000-0000-000000000711",
    course_role: "learner",
    progress: {
      completed_lessons: 2,
      percent_complete: 40,
      total_lessons: 5,
    },
    slug: "security-basics",
    status: "published",
    title: "Security Basics",
  },
  {
    course_id: "00000000-0000-0000-0000-000000000712",
    course_role: "facilitator",
    progress: null,
    slug: "customer-enablement",
    status: "published",
    title: "Customer Enablement",
  },
  {
    course_id: "00000000-0000-0000-0000-000000000713",
    course_role: "course_owner",
    progress: {
      completed_lessons: 0,
      percent_complete: 0,
      total_lessons: 3,
    },
    slug: "manager-onboarding",
    status: "draft",
    title: "Manager Onboarding",
  },
];

export function e2eFixturesEnabled() {
  return process.env.OMNIXTRA_E2E_FIXTURES === "1";
}
