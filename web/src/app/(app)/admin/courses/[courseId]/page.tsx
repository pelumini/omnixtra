import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { AdminShell } from "@/components/layout/admin-shell";
import { InvitationPending } from "@/features/auth";
import { CourseDetail, getCourse } from "@/features/courses";
import { getBrandingOrDefault } from "@/lib/auth/branding";
import { getSessionOrNull } from "@/lib/auth/session";

import type { TenantBranding } from "@/lib/schemas/academy";
import type { OrgRole } from "@/lib/schemas/common";

type CourseDetailPageProps = {
  params: Promise<{
    courseId: string;
  }>;
};

const fallbackBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default async function CourseDetailPage({ params }: CourseDetailPageProps) {
  const { courseId } = await params;
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

  const [branding, course] = await Promise.all([
    getBrandingOrDefault(context, fallbackBranding),
    loadCourse(courseId, context),
  ]);
  if (course === null) {
    notFound();
  }

  const viewerRole: OrgRole = authSession.membership.org_role;

  return (
    <AdminShell branding={branding} viewerRole={viewerRole}>
      <CourseDetail course={course.data} />
    </AdminShell>
  );
}

async function loadCourse(courseId: string, context: { cookie?: string; host?: string }) {
  try {
    return await getCourse(courseId, context);
  } catch {
    return null;
  }
}
