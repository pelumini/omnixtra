import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { DeniedState } from "@/components/app/denied-state";
import { InvitationPending } from "@/components/app/invitation-pending";
import {
  getCompletionAnalytics,
  getAuthSession,
  getLearnerProgressReport,
  learnerProgressCsvUrl,
} from "@/lib/api";
import { e2eFixturesEnabled } from "@/lib/e2e-fixtures";
import type { CourseCompletionAnalytics, LearnerProgressReportRow } from "@/lib/schemas";

export default async function AdminDashboardPage() {
  if (e2eFixturesEnabled()) {
    return (
      <AdminDashboard
        analytics={[]}
        csvUrl={learnerProgressCsvUrl()}
        learnerProgress={[]}
        loadError={null}
      />
    );
  }

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
  if (authSession.data.membership.org_role !== "tenant_admin") {
    return (
      <DeniedState
        description="Your academy access does not include admin permissions."
        title="This area is for admins"
      />
    );
  }

  let analytics: CourseCompletionAnalytics[] = [];
  let learnerProgress: LearnerProgressReportRow[] = [];
  let loadError: string | null = null;

  try {
    const [analyticsResponse, progressResponse] = await Promise.all([
      getCompletionAnalytics(context),
      getLearnerProgressReport(context),
    ]);
    analytics = analyticsResponse.data;
    learnerProgress = progressResponse.data;
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Dashboard data could not be loaded";
  }

  return (
    <AdminDashboard
      analytics={analytics}
      csvUrl={learnerProgressCsvUrl()}
      learnerProgress={learnerProgress}
      loadError={loadError}
    />
  );
}

async function loadSession(context: { cookie?: string; host?: string }) {
  try {
    return await getAuthSession(context);
  } catch {
    return null;
  }
}
