import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminCourseList } from "@/components/admin/admin-course-list";
import { InvitationPending } from "@/components/app/invitation-pending";
import { getAuthSession, getCourses } from "@/lib/api";
import type { Course, OrgRole } from "@/lib/schemas";

export default async function AdminCoursesPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? undefined;
  const cookie = requestHeaders.get("cookie") ?? undefined;
  const context = { cookie, host };
  const authSession = await loadSession(context);

  if (authSession === null) {
    redirect("/login");
  }
  if (authSession.data.membership === null) {
    return <InvitationPending session={authSession.data} />;
  }

  let courses: Course[] = [];
  let loadError: string | null = null;
  const viewerRole: OrgRole = authSession.data.membership.org_role;

  try {
    const response = await getCourses(context);
    courses = response.data.items;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Courses could not be loaded";
  }

  return <AdminCourseList initialCourses={courses} loadError={loadError} viewerRole={viewerRole} />;
}

async function loadSession(context: { cookie?: string; host?: string }) {
  try {
    return await getAuthSession(context);
  } catch {
    return null;
  }
}
