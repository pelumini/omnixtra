import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { InvitationPending } from "@/components/app/invitation-pending";
import { AppShell } from "@/components/app/app-shell";
import { getMyCourses, MyCoursesDashboard, type MyCourse } from "@/features/learning";
import { getTenantBranding } from "@/lib/api/academy";
import { getAuthSession } from "@/lib/api/auth";
import { E2E_FIXTURES_ENABLED } from "@/lib/e2e-enabled";
import type { TenantBranding } from "@/lib/schemas/academy";

type MyCoursesPageProps = {
  searchParams?: Promise<{
    e2e?: string;
  }>;
};

const fallbackBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default async function MyCoursesPage({ searchParams }: MyCoursesPageProps) {
  if (E2E_FIXTURES_ENABLED) {
    const e2eState = (await searchParams)?.e2e;
    if (e2eState) {
      return e2eMyCoursesPage(e2eState);
    }
  }

  const requestHeaders = await headers();
  const context = {
    cookie: requestHeaders.get("cookie") ?? undefined,
    host: requestHeaders.get("host") ?? undefined,
  };
  const session = await loadSession(context);

  if (session === null) {
    redirect("/login");
  }
  if (session.data.membership === null) {
    return <InvitationPending session={session.data} />;
  }

  const branding = await loadBranding(context);
  let courses: MyCourse[] = [];
  let loadError: string | null = null;

  try {
    const response = await getMyCourses(context);
    courses = response.data.courses;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Courses could not be loaded";
  }

  return (
    <AppShell branding={branding} viewerRole={session.data.membership.org_role}>
      <MyCoursesDashboard
        courses={courses}
        loadError={loadError}
        tenantName={branding.tenant_name}
      />
    </AppShell>
  );
}

async function e2eMyCoursesPage(state: string) {
  const { e2eAdminSession, e2eBranding, e2eMemberSession, e2eMyCourses } = await import(
    "@/lib/e2e-fixtures"
  );
  const session = state === "admin" ? e2eAdminSession : e2eMemberSession;
  const courses =
    state === "empty"
      ? []
      : state === "learner-only"
        ? e2eMyCourses.filter((course) => course.course_role === "learner")
        : e2eMyCourses;

  return (
    <AppShell branding={e2eBranding} viewerRole={session.membership?.org_role ?? "member"}>
      <MyCoursesDashboard
        courses={courses}
        loadError={null}
        tenantName={e2eBranding.tenant_name}
      />
    </AppShell>
  );
}

async function loadSession(context: { cookie?: string; host?: string }) {
  try {
    return await getAuthSession(context);
  } catch {
    return null;
  }
}

async function loadBranding(context: { cookie?: string; host?: string }) {
  try {
    const response = await getTenantBranding(context);
    return response.data;
  } catch {
    return fallbackBranding;
  }
}
