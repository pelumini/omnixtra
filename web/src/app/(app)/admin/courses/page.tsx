import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { InvitationPending } from "@/features/auth";
import { AdminCourseList, getCourses, type Course } from "@/features/courses";
import { getBrandingOrDefault } from "@/lib/auth/branding";
import { getSessionOrNull } from "@/lib/auth/session";

import type { TenantBranding } from "@/lib/schemas/academy";
import type { OrgRole } from "@/lib/schemas/common";

const fallbackBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default async function AdminCoursesPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? undefined;
  const cookie = requestHeaders.get("cookie") ?? undefined;
  const context = { cookie, host };
  const authSession = await getSessionOrNull(context);

  if (authSession === null) {
    redirect("/login");
  }
  if (authSession.membership === null) {
    return <InvitationPending session={authSession} />;
  }

  let courses: Course[] = [];
  let loadError: string | null = null;
  const viewerRole: OrgRole = authSession.membership.org_role;
  const branding = await getBrandingOrDefault(context, fallbackBranding);

  try {
    const response = await getCourses(context);
    courses = response.data.items;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Courses could not be loaded";
  }

  return (
    <AdminShell branding={branding} viewerRole={viewerRole}>
      <AdminCourseList initialCourses={courses} loadError={loadError} viewerRole={viewerRole} />
    </AdminShell>
  );
}
