import { ArrowRight, BookOpen, CheckCircle2, Palette, Plus, UserPlus, UserRoundCheck, Users } from "lucide-react";
import Link from "next/link";

import { EmptyIllustration } from "./empty-illustration";

import type { Course } from "@/features/courses/schemas";
import type { ReactNode } from "react";

type DashboardFrameProps = { adminName: string; children: ReactNode; completionsCount: number; courseCount: number; firstRun?: boolean; membersCount: number };

export function DashboardFrame({ adminName, children, completionsCount, courseCount, firstRun = false, membersCount }: DashboardFrameProps) {
  return (
    <main className="mx-auto min-h-[calc(100vh-3.5rem)] max-w-[100rem] px-5 pb-24 pt-4 sm:px-6 sm:pt-6 lg:px-8 lg:pb-10">
      <header>
        <h1 className="text-2xl font-bold text-[var(--foreground)] sm:text-3xl">{firstRun ? "Welcome" : "Welcome Back"}, {firstName(adminName)}</h1>
        <p className="mt-1 text-sm text-[var(--color-text-sub-500)]">Here&apos;s what&apos;s happening with your academy.</p>
      </header>
      <section aria-label="Quick actions" className="mt-6 hidden gap-3 md:grid lg:grid-cols-3">
        <ActionCard href="/admin/courses" icon={<BookOpen className="size-5" />} title="Create your first course">Start building the learning content your members will come for.</ActionCard>
        <ActionCard href="/admin/members" icon={<UserPlus className="size-5" />} title="Invite your team">Build the people who will help build and run your academy.</ActionCard>
        <ActionCard featured href="/onboarding" icon={<Palette className="size-5" />} title="Add your branding">Give your academy a clear identity across the learning experience.</ActionCard>
      </section>
      <section aria-label="Quick actions" className="mt-6 grid gap-3 md:hidden">
        <MobileActionCard accent="#ca48a5" accentBackground="#faedf6" action="Create course" href="/admin/courses" title="Create your first course">Start building the learning content your members will come for.</MobileActionCard>
        <MobileActionCard accent="#57a9dc" accentBackground="#eef6fc" action="Invite members" href="/admin/members" title="Invite your team">Build the people who will help build and run your academy.</MobileActionCard>
        <MobileActionCard accent="#dc4838" accentBackground="#fcedeb" action="Add branding" href="/onboarding" title="Add your branding">Give your academy a clear identity across the learning experience.</MobileActionCard>
      </section>
      <section aria-label="Academy totals" className="mt-4 grid gap-3 sm:grid-cols-3">
        <Stat icon={<BookOpen className="size-5" />} label="Courses" tone="indigo" value={courseCount} />
        <Stat icon={<Users className="size-5" />} label="Members" tone="magenta" value={membersCount} />
        <Stat icon={<CheckCircle2 className="size-5" />} label="Completions" tone="green" value={completionsCount} />
      </section>
      {children}
      <Link className="fixed inset-x-5 bottom-4 z-30 flex h-12 items-center justify-center gap-2 rounded-full bg-[var(--primary)] text-sm font-semibold text-white shadow-lg sm:hidden" href="/admin/courses">
        <Plus aria-hidden="true" className="size-5" /> Add New Course
      </Link>
    </main>
  );
}

function MobileActionCard({ accent, accentBackground, action, children, href, title }: { accent: string; accentBackground: string; action: string; children: ReactNode; href: string; title: string }) {
  return <Link className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-[0_4px_10px_rgba(0,20,61,0.05)]" href={href}>
    <div className="flex items-start justify-between gap-4">
      <div><h2 className="text-base font-semibold">{title}</h2><p className="mt-1 text-sm leading-5 text-[var(--color-text-sub-500)]">{children}</p></div>
      <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ backgroundColor: accentBackground, color: accent }}><UserRoundCheck aria-hidden="true" className="size-5" /></span>
    </div>
    <span className="mt-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide" style={{ color: accent }}>{action}<ArrowRight aria-hidden="true" className="size-4" /></span>
  </Link>;
}

export function DashboardContent({ courses }: { courses: Course[] }) {
  return (
    <section className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <Panel title="Learning Content">
        {courses.length ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{courses.map((course) => <CourseCard course={course} key={course.id} />)}</div> : <Empty kind="courses" title="No Course Yet">Create your first course to start building your academy.</Empty>}
      </Panel>
      <Panel title="Recent Activity">
        {courses.length ? <div className="divide-y divide-[var(--border)]">{[
          ["Course published", "Your latest academy update", "2 hours ago"],
          ["Member joined", "A new learner joined the academy", "4 hours ago"],
          ["Course created", "A new draft is ready to edit", "Yesterday"],
        ].map(([title, copy, time]) => <div className="grid grid-cols-[auto_1fr] gap-3 py-4 first:pt-0" key={title}><span className="mt-1 size-2 rounded-full bg-[var(--primary)]" /><div><div className="flex justify-between gap-3"><p className="text-sm font-semibold">{title}</p><span className="whitespace-nowrap text-[10px] text-[var(--color-text-soft-400)]">{time}</span></div><p className="mt-1 text-xs text-[var(--color-text-sub-500)]">{copy}</p></div></div>)}</div> : <Empty kind="activity" title="No Activity">Recent academy activity will appear here.</Empty>}
        {/* TODO: replace placeholder activity items with the audit-feed endpoint. */}
      </Panel>
    </section>
  );
}

function ActionCard({ children, featured = false, href, icon, title }: { children: ReactNode; featured?: boolean; href: string; icon: ReactNode; title: string }) {
  return <Link className={`group min-h-36 rounded-md border p-5 transition-transform hover:-translate-y-0.5 ${featured ? "border-[var(--primary)] bg-[var(--primary)] text-white" : "border-[var(--border)] bg-white"}`} href={href}>
    <div className="flex items-start justify-between gap-3"><span className={`grid size-10 place-items-center rounded-full ${featured ? "bg-white/15" : "bg-[var(--color-primary-lighter)] text-[var(--primary)]"}`}>{icon}</span><ArrowRight className="size-4" /></div>
    <h2 className="mt-4 text-sm font-bold">{title}</h2><p className={`mt-1 text-xs leading-5 ${featured ? "text-white/80" : "text-[var(--color-text-sub-500)]"}`}>{children}</p>
  </Link>;
}

function Stat({ icon, label, tone, value }: { icon: ReactNode; label: string; tone: "green" | "indigo" | "magenta"; value: number }) {
  const tones = { green: "bg-[#e8faf3] text-[#38c793]", indigo: "bg-[var(--color-primary-lighter)] text-[var(--primary)]", magenta: "bg-[#fbedf7] text-[#ca48a5]" };
  return <div className="flex items-center gap-3 rounded-md border border-[var(--border)] bg-white p-4"><span className={`grid size-10 place-items-center rounded-full ${tones[tone]}`}>{icon}</span><div><p className="text-[10px] font-bold uppercase text-[var(--color-text-soft-400)]">{label}</p><p className="text-xl font-bold">{value}</p></div></div>;
}

function Panel({ children, title }: { children: ReactNode; title: string }) {
  return <section className="rounded-md border border-[var(--border)] bg-white p-5"><h2 className="text-base font-bold">{title}</h2><div className="mt-5">{children}</div></section>;
}

function CourseCard({ course }: { course: Course }) {
  return <Link className="overflow-hidden rounded-md border border-[var(--border)] bg-white hover:border-[var(--primary)]" href={`/admin/courses/${course.id}`}>
    <div className="grid aspect-[16/8] place-items-center bg-[var(--color-bg-weak-100)] text-[var(--primary)]"><BookOpen className="size-8" /></div>
    <div className="p-4"><h3 className="line-clamp-2 text-sm font-bold">{course.title}</h3>{course.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-[var(--color-text-sub-500)]">{course.description}</p> : null}<p className="mt-3 text-[11px] text-[var(--color-text-soft-400)]">{course.lesson_count} {course.lesson_count === 1 ? "lesson" : "lessons"}</p></div>
  </Link>;
}

function Empty({ children, kind, title }: { children: ReactNode; kind: "activity" | "courses"; title: string }) {
  return <div className="grid min-h-64 place-items-center rounded-md bg-[var(--color-bg-weak-100)] p-6 text-center"><div className="grid justify-items-center"><EmptyIllustration kind={kind} /><h3 className="mt-4 text-base font-bold">{title}</h3><p className="mt-2 text-sm text-[var(--color-text-sub-500)]">{children}</p></div></div>;
}

function firstName(name: string) { return name.trim().split(/\s+/)[0] || "admin"; }
