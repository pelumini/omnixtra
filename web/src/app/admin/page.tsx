import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminHome } from "@/components/admin/admin-home";
import { AdminShell } from "@/components/admin/admin-shell";
import { DeniedState } from "@/components/app/denied-state";
import { InvitationPending } from "@/components/app/invitation-pending";
import {
  getCompletionAnalytics,
  getLearnerProgressReport,
  learnerProgressCsvUrl,
} from "@/lib/api/analytics";
import { getCourses } from "@/features/courses";
import { getBrandingOrDefault } from "@/lib/auth/branding";
import { getSessionOrNull } from "@/lib/auth/session";
import { e2eFixturesEnabled } from "@/lib/e2e-enabled";
import type { TenantBranding } from "@/lib/schemas/academy";
import type {
  CourseCompletionAnalytics,
  LearnerProgressReportRow,
} from "@/lib/schemas/analytics";

const fallbackBranding: TenantBranding = {
  locale: "en",
  logo_url: null,
  primary_color: "#584ce1",
  tenant_name: "Academy",
  time_zone: "UTC",
};

export default async function AdminDashboardPage() {
  if (e2eFixturesEnabled()) {
    return (
      <AdminShell branding={fallbackBranding} viewerRole="tenant_admin">
        <AdminHome
          adminName="Admin"
          analytics={[]}
          courseCount={1}
          csvUrl={learnerProgressCsvUrl()}
          learnerProgress={[]}
          loadError={null}
        />
      </AdminShell>
    );
  }

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
  if (authSession.membership.org_role !== "tenant_admin") {
    return (
      <DeniedState
        description="Your academy access does not include admin permissions."
        title="This area is for admins"
      />
    );
  }

  let analytics: CourseCompletionAnalytics[] = [];
  let courseCount = 0;
  let learnerProgress: LearnerProgressReportRow[] = [];
  let loadError: string | null = null;
  const branding = await getBrandingOrDefault(context, fallbackBranding);

  try {
    const [analyticsResponse, progressResponse, coursesResponse] = await Promise.all([
      getCompletionAnalytics(context),
      getLearnerProgressReport(context),
      getCourses(context),
    ]);
    analytics = analyticsResponse.data;
    learnerProgress = progressResponse.data;
    courseCount = coursesResponse.data.items.length;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Dashboard data could not be loaded";
  }

  return (
    <AdminShell branding={branding} viewerRole={authSession.membership.org_role}>
      <AdminHome
        adminName={authSession.user.full_name}
        analytics={analytics}
        courseCount={courseCount}
        csvUrl={learnerProgressCsvUrl()}
        learnerProgress={learnerProgress}
        loadError={loadError}
      />
    </AdminShell>
  );
}
