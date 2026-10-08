import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { InvitationPending } from "@/features/auth";
import { AdminCourseList, getCourses, type Course } from "@/features/courses";
import { getSessionOrNull } from "@/lib/auth/session";

import type { OrgRole } from "@/lib/schemas/common";

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
  try {
    const response = await getCourses(context);
    courses = response.data.items;
  } catch (error) {
    loadError =
      error instanceof Error ? error.message : "Courses could not be loaded";
  }

  return (
    <AdminCourseList
      initialCourses={courses}
      loadError={loadError}
      viewerRole={viewerRole}
    />
  );
}
