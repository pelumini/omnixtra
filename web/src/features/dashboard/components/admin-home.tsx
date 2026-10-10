import { AdminDashboard } from "./admin-dashboard";
import { AdminFirstRunChecklist } from "./admin-first-run-checklist";

import type {
  CourseCompletionAnalytics,
  LearnerProgressReportRow,
} from "@/features/analytics";
import type { Course } from "@/features/courses/schemas";

type AdminHomeProps = {
  adminName?: string;
  analytics: CourseCompletionAnalytics[];
  courseCount: number;
  courses?: Course[];
  csvUrl: string;
  learnerProgress: LearnerProgressReportRow[];
  loadError: string | null;
  membersCount?: number;
};

export function AdminHome({
  adminName = "admin",
  analytics,
  courseCount,
  courses = [],
  csvUrl,
  learnerProgress,
  loadError,
  membersCount = 0,
}: AdminHomeProps) {
  if (courseCount === 0 && loadError === null) {
    return (
      <AdminFirstRunChecklist
        adminName={adminName}
        courseCount={courseCount}
        membersCount={membersCount}
      />
    );
  }

  return (
    <AdminDashboard
      adminName={adminName}
      analytics={analytics}
      courses={courses}
      csvUrl={csvUrl}
      learnerProgress={learnerProgress}
      loadError={loadError}
      membersCount={membersCount}
    />
  );
}
