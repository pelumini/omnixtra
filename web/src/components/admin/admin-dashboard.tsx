import { BarChart3, Download, GraduationCap, Users } from "lucide-react";
import type { ReactNode } from "react";

import type { CourseCompletionAnalytics, LearnerProgressReportRow } from "@/lib/schemas";

type AdminDashboardProps = {
  analytics: CourseCompletionAnalytics[];
  learnerProgress: LearnerProgressReportRow[];
  csvUrl: string;
  loadError: string | null;
};

export function AdminDashboard({
  analytics,
  learnerProgress,
  csvUrl,
  loadError,
}: AdminDashboardProps) {
  const enrolled = analytics.reduce((total, course) => total + course.enrolled_count, 0);
  const completed = analytics.reduce((total, course) => total + course.completed_count, 0);
  const completionRate = enrolled === 0 ? 0 : Math.round((completed / enrolled) * 100);

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-6 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center bg-[var(--primary)] text-[var(--primary-foreground)]">
            <BarChart3 aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Dashboard</h1>
            <p className="text-sm text-gray-600">Completion analytics and learner progress</p>
          </div>
        </div>
        <a
          className="inline-flex h-10 items-center gap-2 bg-[var(--primary)] px-4 text-sm font-medium text-white"
          href={csvUrl}
        >
          <Download aria-hidden="true" className="size-4" />
          CSV
        </a>
      </header>

      {loadError ? (
        <div className="border border-[var(--border)] bg-white px-4 py-3 text-sm text-gray-700">
          {loadError}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Enrolments" value={enrolled} icon={<Users className="size-4" />} />
        <Metric label="Completions" value={completed} icon={<GraduationCap className="size-4" />} />
        <Metric label="Completion" value={`${completionRate}%`} icon={<BarChart3 className="size-4" />} />
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
        <div className="border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold">Course Completion</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {analytics.map((course) => (
              <div className="grid gap-2 px-4 py-3" key={course.course_id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-medium">{course.course_title}</span>
                  <span className="text-sm text-gray-600">{course.completion_percentage}%</span>
                </div>
                <div className="h-2 bg-gray-100">
                  <div
                    className="h-2 bg-[var(--primary)]"
                    style={{ width: `${course.completion_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {course.completed_count} of {course.enrolled_count} completed
                </p>
              </div>
            ))}
            {analytics.length === 0 ? <Empty label="No course analytics yet" /> : null}
          </div>
        </div>

        <div className="overflow-hidden border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold">Learner Progress</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Learner</th>
                  <th className="px-4 py-3 font-medium">Course</th>
                  <th className="px-4 py-3 font-medium">Lessons</th>
                  <th className="px-4 py-3 font-medium">Average</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)]">
                {learnerProgress.map((row) => (
                  <tr key={`${row.learner_id}-${row.course_id}`}>
                    <td className="px-4 py-3">
                      <div className="font-medium">{row.learner_name}</div>
                      <div className="text-xs text-gray-500">{row.learner_email}</div>
                    </td>
                    <td className="px-4 py-3">{row.course_title}</td>
                    <td className="px-4 py-3">
                      {row.lessons_completed}/{row.lessons_total}
                    </td>
                    <td className="px-4 py-3">{row.average_progress_percent}%</td>
                    <td className="px-4 py-3">{row.enrolment_status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {learnerProgress.length === 0 ? <Empty label="No learner progress yet" /> : null}
          </div>
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value, icon }: { label: string; value: number | string; icon: ReactNode }) {
  return (
    <div className="flex items-center justify-between border border-[var(--border)] bg-white px-4 py-3">
      <div>
        <div className="text-xs uppercase text-gray-500">{label}</div>
        <div className="text-2xl font-semibold">{value}</div>
      </div>
      <div className="grid size-9 place-items-center bg-gray-100 text-[var(--primary)]">{icon}</div>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="px-4 py-10 text-center text-sm text-gray-600">{label}</div>;
}
