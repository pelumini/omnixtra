import {
  BarChart3,
  BookOpen,
  Clock3,
  Download,
  GraduationCap,
  LineChart,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import type { CourseCompletionAnalytics, LearnerProgressReportRow } from "@/lib/schemas";

type AdminDashboardProps = {
  adminName?: string;
  analytics: CourseCompletionAnalytics[];
  learnerProgress: LearnerProgressReportRow[];
  csvUrl: string;
  loadError: string | null;
};

export function AdminDashboard({
  adminName = "admin",
  analytics,
  learnerProgress,
  csvUrl,
  loadError,
}: AdminDashboardProps) {
  const enrolled = analytics.reduce((total, course) => total + course.enrolled_count, 0);
  const completed = analytics.reduce((total, course) => total + course.completed_count, 0);
  const completionRate = enrolled === 0 ? 0 : Math.round((completed / enrolled) * 100);
  const activeLearners = new Set(learnerProgress.map((row) => row.learner_id)).size;
  const courseTotal = analytics.length;

  return (
    <main className="mx-auto grid min-h-screen max-w-[104rem] content-start gap-5 px-5 py-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#116149]">
            Admin dashboard
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#0c1726]">
            Welcome, {firstName(adminName)}!
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#116149] px-4 text-sm font-semibold text-[#116149] hover:bg-[#e8f5ef]"
            href="/admin/courses"
          >
            Add widgets
          </Link>
          <a
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[#116149] px-4 text-sm font-semibold text-white hover:bg-[#0d4f3b]"
            href={csvUrl}
          >
            <Download aria-hidden="true" className="size-4" />
            CSV
          </a>
        </div>
      </header>

      {loadError ? (
        <div className="rounded-md border border-[#efb4b4] bg-[#fff3f3] px-4 py-3 text-sm text-[#9f1d1d]">
          {loadError}
        </div>
      ) : null}

      <section className="grid gap-5 xl:grid-cols-2">
        <Widget title="Portal activity">
          <ActivityChart completionRate={completionRate} />
        </Widget>
        <Widget title="Quick actions">
          <div className="grid gap-2 sm:grid-cols-2">
            <Action href="/admin/members" icon={<UserPlus className="size-5" />} label="Add user" />
            <Action href="/admin/courses" icon={<BookOpen className="size-5" />} label="Add course" />
            <Action href="/onboarding" icon={<Settings className="size-5" />} label="Portal settings" />
            <Action href="/admin" icon={<LineChart className="size-5" />} label="Custom reports" />
          </div>
        </Widget>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Widget title="Overview">
          <div className="grid gap-4">
            <OverviewRow icon={<Users className="size-5" />} label="Active users" value={activeLearners} />
            <OverviewRow icon={<BookOpen className="size-5" />} label="Assigned courses" value={courseTotal} />
            <OverviewRow icon={<GraduationCap className="size-5" />} label="Completions" value={completed} />
            <OverviewRow icon={<Clock3 className="size-5" />} label="Training time" value="0h 0m" />
            <OverviewRow icon={<BarChart3 className="size-5" />} label="Completion rate" value={`${completionRate}%`} />
          </div>
        </Widget>

        <Widget title="Timeline">
          <div className="max-h-80 space-y-4 overflow-y-auto pr-2">
            {learnerProgress.slice(0, 6).map((row) => (
              <TimelineItem
                key={`${row.learner_id}-${row.course_id}`}
                tone={row.enrolment_status === "completed" ? "gold" : "green"}
                text={`${row.learner_name} progressed in ${row.course_title}`}
                time="Recently"
              />
            ))}
            {learnerProgress.length === 0 ? (
              <>
                <TimelineItem text="Academy dashboard opened" time="Now" tone="green" />
                <TimelineItem text="Create a course to begin tracking activity" time="Next" tone="gold" />
              </>
            ) : null}
          </div>
        </Widget>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Widget title="Users">
          <div className="grid min-h-72 place-items-center">
            <div
              aria-label={`${activeLearners} active users`}
              className="grid size-56 place-items-center rounded-full border-[28px] border-[#116149]"
            >
              <span className="text-4xl font-bold text-[#0c1726]">{activeLearners}</span>
            </div>
          </div>
        </Widget>

        <Widget title="Course Completion">
          <div className="divide-y divide-[#d6dee8]">
            {analytics.map((course) => (
              <div className="grid gap-2 py-4" key={course.course_id}>
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold">{course.course_title}</span>
                  <span className="text-sm font-semibold text-[#116149]">
                    {course.completion_percentage}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-md bg-[#e8eef4]">
                  <div
                    className="h-full bg-[#116149]"
                    style={{ width: `${course.completion_percentage}%` }}
                  />
                </div>
                <p className="text-xs text-[#52657a]">
                  {course.completed_count} of {course.enrolled_count} completed
                </p>
              </div>
            ))}
            {analytics.length === 0 ? <Empty label="No course analytics yet" /> : null}
          </div>
        </Widget>
      </section>

      <Widget title="Learner Progress">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="bg-[#f6f8fb] text-xs uppercase text-[#51647d]">
              <tr>
                <th className="px-4 py-3 font-semibold">Learner</th>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Lessons</th>
                <th className="px-4 py-3 font-semibold">Average</th>
                <th className="px-4 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#d6dee8]">
              {learnerProgress.map((row) => (
                <tr key={`${row.learner_id}-${row.course_id}`}>
                  <td className="px-4 py-3">
                    <div className="font-semibold">{row.learner_name}</div>
                    <div className="text-xs text-[#52657a]">{row.learner_email}</div>
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
      </Widget>
    </main>
  );
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || "admin";
}

function Widget({ children, title }: { children: ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-[#cbd5e1] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-bold text-[#0c1726]">{title}</h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ActivityChart({ completionRate }: { completionRate: number }) {
  const barHeight = Math.max(12, completionRate);
  return (
    <div>
      <div className="grid h-64 grid-cols-[40px_1fr] gap-3">
        <div className="grid text-sm text-[#6b7788]">
          <span>1</span>
          <span>0.8</span>
          <span>0.6</span>
          <span>0.4</span>
          <span>0.2</span>
          <span>0</span>
        </div>
        <div className="relative border-b border-[#8a96a7]">
          <div className="absolute inset-x-0 top-0 h-px bg-[#d9e1ec]" />
          <div className="absolute inset-x-0 top-[20%] h-px bg-[#d9e1ec]" />
          <div className="absolute inset-x-0 top-[40%] h-px bg-[#d9e1ec]" />
          <div className="absolute inset-x-0 top-[60%] h-px bg-[#d9e1ec]" />
          <div className="absolute inset-x-0 top-[80%] h-px bg-[#d9e1ec]" />
          <div
            className="absolute bottom-0 right-10 w-8 rounded-t-md bg-[#116149]"
            style={{ height: `${barHeight}%` }}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 text-sm">
        <Legend color="bg-[#116149]" label="Logins" />
        <Legend color="bg-[#e4b622]" label="Course completions" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span aria-hidden="true" className={`size-3 rounded-full ${color}`} />
      <span>{label}</span>
    </span>
  );
}

function Action({ href, icon, label }: { href: string; icon: ReactNode; label: string }) {
  return (
    <Link
      className="flex min-h-14 items-center gap-4 rounded-md px-3 text-sm font-semibold text-[#0c1726] hover:bg-[#f1f6ff]"
      href={href}
    >
      <span className="text-[#111827]">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

function OverviewRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-1">
      <span className="text-[#111827]">{icon}</span>
      <span className="text-base text-[#0c1726]">{label}</span>
      <span className="text-xl font-bold text-[#0c1726]">{value}</span>
    </div>
  );
}

function TimelineItem({ text, time, tone }: { text: string; time: string; tone: "gold" | "green" }) {
  return (
    <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-3">
      <span
        aria-hidden="true"
        className={`mt-1.5 size-3 rounded-full ${tone === "green" ? "bg-[#116149]" : "bg-[#e4b622]"}`}
      />
      <p className="truncate text-sm text-[#0c1726]">{text}</p>
      <span className="text-sm italic text-[#6b7788]">{time}</span>
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return <div className="px-4 py-10 text-center text-sm text-[#52657a]">{label}</div>;
}
