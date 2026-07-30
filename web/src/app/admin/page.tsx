import { headers } from "next/headers";

import { AdminDashboard } from "@/components/admin/admin-dashboard";
import {
  getCompletionAnalytics,
  getLearnerProgressReport,
  learnerProgressCsvUrl,
} from "@/lib/api";
import type { CourseCompletionAnalytics, LearnerProgressReportRow } from "@/lib/schemas";

export default async function AdminDashboardPage() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? undefined;
  const cookie = requestHeaders.get("cookie") ?? undefined;
  const context = { cookie, host };
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
