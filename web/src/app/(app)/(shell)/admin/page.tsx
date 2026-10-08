import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { DeniedState } from "@/components/layout/denied-state";
import {
  getCompletionAnalytics,
  getLearnerProgressReport,
  learnerProgressCsvUrl,
} from "@/features/analytics";
import { InvitationPending } from "@/features/auth";
import { getCourses } from "@/features/courses";
import { AdminHome } from "@/features/dashboard";
import { getSessionOrNull } from "@/lib/auth/session";
import { e2eFixturesEnabled } from "@/lib/e2e-enabled";

import type {
  CourseCompletionAnalytics,
  LearnerProgressReportRow,
} from "@/features/analytics";
import type { TenantBranding } from "@/lib/schemas/academy";

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
      <AppShell branding={fallbackBranding} viewerRole="tenant_admin">
        <AdminHome
          adminName="Admin"
          analytics={[]}
          courseCount={1}
          csvUrl={learnerProgressCsvUrl()}
          learnerProgress={[]}
          loadError={null}
        />
      </AppShell>
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
  try {
    const [analyticsResponse, progressResponse, coursesResponse] =
      await Promise.all([
        getCompletionAnalytics(context),
        getLearnerProgressReport(context),
        getCourses(context),
      ]);
    analytics = analyticsResponse.data;
    learnerProgress = progressResponse.data;
    courseCount = coursesResponse.data.items.length;
  } catch (error) {
    loadError =
      error instanceof Error
        ? error.message
        : "Dashboard data could not be loaded";
  }

  return (
    <AdminHome
      adminName={authSession.user.full_name}
      analytics={analytics}
      courseCount={courseCount}
      csvUrl={learnerProgressCsvUrl()}
      learnerProgress={learnerProgress}
      loadError={loadError}
    />
  );
}
