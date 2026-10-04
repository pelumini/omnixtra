import {
  BookOpen,
  Check,
  Circle,
  Edit3,
  LineChart,
  Settings,
  UserPlus,
  Users,
} from "lucide-react";
import Link from "next/link";

import type { ReactNode } from "react";

type ChecklistItem = {
  completed: boolean;
  description: string;
  href: string;
  title: string;
};

type AdminFirstRunChecklistProps = {
  adminName?: string;
  courseCount: number;
};

export function AdminFirstRunChecklist({
  adminName = "admin",
  courseCount,
}: AdminFirstRunChecklistProps) {
  const items: ChecklistItem[] = [
    {
      completed: courseCount > 0,
      description: "Create a draft course and add the first lessons.",
      href: "/admin/courses",
      title: "Create your first course",
    },
    {
      completed: false,
      description: "Invite admins, facilitators, and learners when the course is ready.",
      href: "/admin/members",
      title: "Invite your team",
    },
    {
      completed: false,
      description: "Prepare logo and colour settings for the academy brand panel.",
      href: "/onboarding",
      title: "Add your branding",
    },
  ];

  return (
    <main className="mx-auto grid min-h-screen max-w-[104rem] content-start gap-5 px-5 py-6 lg:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
            Academy setup
          </p>
          <h1 className="mt-2 text-3xl font-bold text-[#0c1726]">
            Welcome, {firstName(adminName)}!
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            className="inline-flex h-11 items-center justify-center rounded-md border border-[var(--primary)] px-4 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--color-primary-lighter)]"
            href="/admin/courses"
          >
            Add widgets
          </Link>
          <Link
            className="inline-flex h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
            href="/admin/courses"
          >
            <Edit3 aria-hidden="true" className="size-4" />
            Add course
          </Link>
        </div>
      </header>

      <section className="grid gap-5 xl:grid-cols-2">
        <Widget title="Portal activity">
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
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <Legend color="bg-[var(--primary)]" label="Logins" />
            <Legend color="bg-[#e4b622]" label="Course completions" />
          </div>
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
            <OverviewRow icon={<Users className="size-5" />} label="Active users" value={1} />
            <OverviewRow icon={<BookOpen className="size-5" />} label="Assigned courses" value={courseCount} />
            <OverviewRow icon={<Users className="size-5" />} label="Groups" value={0} />
            <OverviewRow icon={<LineChart className="size-5" />} label="Completion rate" value="0%" />
          </div>
        </Widget>

        <Widget title="Get started">
          <div className="grid gap-3">
            {items.map((item) => (
              <Link
                className="group grid gap-3 rounded-md border border-[var(--border)] bg-white p-4 hover:border-[var(--primary)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                href={item.href}
                key={item.title}
              >
                <span
                  aria-label={item.completed ? "Completed" : "Not completed"}
                  className={`grid size-10 place-items-center rounded-full ${
                    item.completed
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--color-primary-lighter)] text-[var(--primary)]"
                  }`}
                >
                  {item.completed ? (
                    <Check aria-hidden="true" className="size-4" />
                  ) : (
                    <Circle aria-hidden="true" className="size-4" />
                  )}
                </span>
                <span>
                  <span className="block text-sm font-bold text-[#0c1726]">{item.title}</span>
                  <span className="mt-1 block text-sm text-[#52657a]">{item.description}</span>
                </span>
                <span className="text-sm font-semibold text-[var(--primary)] group-hover:underline">
                  Open
                </span>
              </Link>
            ))}
          </div>
        </Widget>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <Widget title="Users">
          <div className="grid min-h-72 place-items-center">
            <div className="grid size-56 place-items-center rounded-full border-[28px] border-[var(--primary)]">
              <span className="text-4xl font-bold text-[#0c1726]">1</span>
            </div>
          </div>
        </Widget>

        <Widget title="Courses' progress status">
          <div className="grid min-h-72 place-items-center text-center">
            <div>
              <BookOpen aria-hidden="true" className="mx-auto size-12 text-[var(--primary)]" />
              <h3 className="mt-5 text-xl font-bold text-[#0c1726]">No stats to show</h3>
              <p className="mt-3 text-sm text-[#52657a]">Create your first course now</p>
              <Link
                className="mt-6 inline-flex h-10 items-center justify-center rounded-md px-4 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--color-primary-lighter)]"
                href="/admin/courses"
              >
                Go to courses
              </Link>
            </div>
          </div>
        </Widget>
      </section>
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
