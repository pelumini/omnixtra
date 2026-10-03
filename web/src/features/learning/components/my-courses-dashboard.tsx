import { BookOpen, CircleAlert, GraduationCap, Presentation, ShieldCheck } from "lucide-react";
import Link from "next/link";

import type { CourseRole } from "@/lib/schemas/common";
import type { MyCourse } from "../schemas";

type MyCoursesDashboardProps = {
  courses: MyCourse[];
  loadError: string | null;
  tenantName: string;
};

const sections: Array<{
  role: CourseRole;
  title: string;
  description: string;
  icon: typeof BookOpen;
}> = [
  {
    description: "Continue lessons, complete quizzes, and track your learning progress.",
    icon: GraduationCap,
    role: "learner",
    title: "Courses I'm taking",
  },
  {
    description: "Support learners and monitor course activity where you facilitate.",
    icon: Presentation,
    role: "facilitator",
    title: "Courses I facilitate",
  },
  {
    description: "Open courses you own and continue improving the learning experience.",
    icon: ShieldCheck,
    role: "course_owner",
    title: "Courses I own",
  },
];

export function MyCoursesDashboard({ courses, loadError, tenantName }: MyCoursesDashboardProps) {
  const totalCourses = courses.length;

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-6 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center bg-[var(--primary)] text-white">
            <BookOpen aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">My Courses</h1>
            <p className="text-sm text-slate-600">{tenantName}</p>
          </div>
        </div>
        <div className="border border-[var(--border)] bg-white px-3 py-2 text-sm text-slate-600">
          {totalCourses} active {totalCourses === 1 ? "course" : "courses"}
        </div>
      </header>

      {loadError ? (
        <div className="flex items-start gap-2 border border-[var(--border)] bg-white px-4 py-3 text-sm text-slate-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
          <span>{loadError}</span>
        </div>
      ) : null}

      {totalCourses === 0 ? (
        <section className="border border-[var(--border)] bg-white px-5 py-12 text-center">
          <h2 className="text-lg font-semibold">
            You are in {tenantName} but have not been added to any courses yet.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
            Ask an admin or course owner to enrol you. Your learner and teaching work will appear here.
          </p>
        </section>
      ) : (
        <div className="grid gap-6">
          {sections.map((section) => {
            const roleCourses = courses.filter((course) => course.course_role === section.role);
            if (roleCourses.length === 0) {
              return null;
            }
            const Icon = section.icon;

            return (
              <section className="grid gap-3" key={section.role}>
                <div className="flex items-start gap-3">
                  <div className="grid size-9 shrink-0 place-items-center border border-[var(--border)] bg-white text-[var(--primary)]">
                    <Icon aria-hidden="true" className="size-4" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold">{section.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{section.description}</p>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {roleCourses.map((course) => (
                    <CourseCard course={course} key={course.course_id} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}

function CourseCard({ course }: { course: MyCourse }) {
  const href =
    course.course_role === "course_owner"
      ? `/admin/courses/${course.course_id}`
      : `/learn/courses/${course.course_id}`;

  return (
    <article className="grid min-h-44 content-between gap-4 border border-[var(--border)] bg-white p-4">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="truncate text-base font-semibold">{course.title}</h3>
          <span className="bg-slate-100 px-2 py-1 text-xs font-medium capitalize text-slate-700">
            {course.status}
          </span>
        </div>
        <p className="mt-1 break-all text-xs text-slate-500">{course.slug}</p>
        {course.progress ? (
          <div className="mt-4">
            <div className="flex justify-between gap-3 text-xs text-slate-600">
              <span>{course.progress.completed_lessons} of {course.progress.total_lessons} lessons</span>
              <span>{course.progress.percent_complete}%</span>
            </div>
            <div className="mt-2 h-2 bg-slate-100">
              <div
                className="h-2 bg-[var(--primary)]"
                style={{ width: `${course.progress.percent_complete}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-slate-600">Progress starts when lessons are available.</p>
        )}
      </div>
      <Link
        className="inline-flex h-9 w-fit items-center justify-center bg-[var(--primary)] px-3 text-sm font-medium text-white hover:bg-[var(--color-primary-dark)]"
        href={href}
      >
        Open
      </Link>
    </article>
  );
}
