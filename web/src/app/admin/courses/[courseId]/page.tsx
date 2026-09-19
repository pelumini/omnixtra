import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { CourseDetail } from "@/components/admin/course-detail";
import { AdminShell } from "@/components/admin/admin-shell";
import { InvitationPending } from "@/components/app/invitation-pending";
import { getAuthSession, getCourse, getTenantBranding } from "@/lib/api";
import type { OrgRole, TenantBranding } from "@/lib/schemas";

type CourseDetailPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

const fallbackBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#116149",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
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

  const [branding, course] = await Promise.all([loadBranding(context), loadCourse(courseId, context)]);
  if (course === null) {
    notFound();
  }

  const viewerRole: OrgRole = authSession.data.membership.org_role;

  return (
    <AdminShell branding={branding} viewerRole={viewerRole}>
      <CourseDetail course={course.data} />
    </AdminShell>
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

async function loadCourse(courseId: string, context: { cookie?: string; host?: string }) {
  try {
    return await getCourse(courseId, context);
  } catch {
    return null;
  }
}
