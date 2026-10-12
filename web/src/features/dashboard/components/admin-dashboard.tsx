import { DashboardContent, DashboardFrame } from "./dashboard-ui";

import type {
  CourseCompletionAnalytics,
  LearnerProgressReportRow,
} from "@/features/analytics";
import type { Course } from "@/features/courses/schemas";

type AdminDashboardProps = {
  adminName?: string;
  analytics: CourseCompletionAnalytics[];
  courses?: Course[];
  csvUrl: string;
  learnerProgress: LearnerProgressReportRow[];
  loadError: string | null;
  membersCount?: number;
};

export function AdminDashboard({
  adminName = "admin",
  analytics,
  courses = [],
  loadError,
  membersCount = 0,
}: AdminDashboardProps) {
  const completionsCount = analytics.reduce(
    (total, course) => total + course.completed_count,
    0,
  );

  return (
    <DashboardFrame
      adminName={adminName}
      completionsCount={completionsCount}
      courseCount={courses.length || analytics.length}
      membersCount={membersCount}
    >
      {loadError ? (
        <div className="mt-5 rounded-md border border-[var(--color-state-error)] bg-[var(--color-red-lighter)] px-4 py-3 text-sm text-[var(--color-state-error)]">
          {loadError}
        </div>
      ) : null}
      <DashboardContent courses={courses} />
    </DashboardFrame>
  );
}
