import { AdminDashboard } from "@/components/admin/admin-dashboard";
import { AdminFirstRunChecklist } from "@/components/admin/admin-first-run-checklist";
import type { CourseCompletionAnalytics, LearnerProgressReportRow } from "@/lib/schemas";

type AdminHomeProps = {
  adminName?: string;
  analytics: CourseCompletionAnalytics[];
  courseCount: number;
  csvUrl: string;
  learnerProgress: LearnerProgressReportRow[];
  loadError: string | null;
};

export function AdminHome({
  adminName = "admin",
  analytics,
  courseCount,
  csvUrl,
  learnerProgress,
  loadError,
}: AdminHomeProps) {
  if (courseCount === 0 && loadError === null) {
    return <AdminFirstRunChecklist adminName={adminName} courseCount={courseCount} />;
  }

  return (
    <AdminDashboard
      adminName={adminName}
      analytics={analytics}
      csvUrl={csvUrl}
      learnerProgress={learnerProgress}
      loadError={loadError}
    />
  );
}
