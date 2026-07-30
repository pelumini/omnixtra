import {
  BadgeCheck,
  BookOpen,
  CircleDashed,
  FileText,
  Image,
  ListChecks,
  PlaySquare,
  Plus,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Course } from "@/lib/schemas";

const courses: Course[] = [
  {
    id: "00000000-0000-0000-0000-000000000101",
    title: "Security Basics",
    slug: "security-basics",
    description: "Required onboarding for all new team members.",
    status: "draft",
  },
  {
    id: "00000000-0000-0000-0000-000000000102",
    title: "Customer Enablement",
    slug: "customer-enablement",
    description: "Product education for implementation partners.",
    status: "published",
  },
  {
    id: "00000000-0000-0000-0000-000000000103",
    title: "Manager Essentials",
    slug: "manager-essentials",
    description: "Practical guides for first-time managers.",
    status: "draft",
  },
];

const outline = [
  { title: "Welcome", lessons: ["How OmniXtra training works", "Completion expectations"] },
  { title: "Core Policy", lessons: ["Password handling", "Reporting incidents", "Quiz"] },
];

const blockTools = [
  { label: "Text", icon: FileText },
  { label: "Video", icon: PlaySquare },
  { label: "Image", icon: Image },
  { label: "Quiz", icon: ListChecks },
];

export default function Home() {
  const selectedCourse = courses[0];

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-6 py-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center bg-[var(--primary)] text-[var(--primary-foreground)]">
            <BookOpen aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Course Authoring</h1>
            <p className="text-sm text-gray-600">Acme Learning / Org Admin</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button className="gap-2 bg-white text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-gray-100">
            <Upload aria-hidden="true" className="size-4" />
            Media
          </Button>
          <Button className="gap-2">
            <Plus aria-hidden="true" className="size-4" />
            Course
          </Button>
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)_280px]">
        <aside className="border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold">Courses</h2>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {courses.map((course) => (
              <article
                className="grid gap-2 px-4 py-3 transition-colors hover:bg-gray-50"
                key={course.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-sm font-semibold">{course.title}</h3>
                  <CourseStatus status={course.status} />
                </div>
                <p className="text-sm leading-5 text-gray-600">{course.description}</p>
                <p className="text-xs text-gray-500">{course.slug}</p>
              </article>
            ))}
          </div>
        </aside>

        <section className="min-w-0 border border-[var(--border)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">{selectedCourse.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{selectedCourse.description}</p>
            </div>
            <Button className="gap-2">
              <BadgeCheck aria-hidden="true" className="size-4" />
              Publish
            </Button>
          </div>

          <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_220px]">
            <div className="grid gap-4">
              {outline.map((section, sectionIndex) => (
                <article className="border border-[var(--border)]" key={section.title}>
                  <div className="flex items-center justify-between border-b border-[var(--border)] bg-gray-50 px-4 py-3">
                    <h3 className="text-sm font-semibold">
                      {sectionIndex + 1}. {section.title}
                    </h3>
                    <Button className="h-8 bg-white px-3 text-gray-700 ring-1 ring-[var(--border)] hover:bg-gray-100">
                      <Plus aria-hidden="true" className="size-4" />
                    </Button>
                  </div>
                  <div className="divide-y divide-[var(--border)]">
                    {section.lessons.map((lesson, lessonIndex) => (
                      <div
                        className="flex items-center justify-between gap-3 px-4 py-3"
                        key={lesson}
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{lesson}</p>
                          <p className="text-xs text-gray-500">Lesson {lessonIndex + 1}</p>
                        </div>
                        <CircleDashed aria-hidden="true" className="size-4 shrink-0 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <aside className="grid content-start gap-3">
              <h3 className="text-sm font-semibold">Blocks</h3>
              <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
                {blockTools.map((tool) => {
                  const Icon = tool.icon;

                  return (
                    <Button
                      className="h-12 justify-start gap-2 bg-white text-gray-700 ring-1 ring-[var(--border)] hover:bg-gray-100"
                      key={tool.label}
                    >
                      <Icon aria-hidden="true" className="size-4" />
                      {tool.label}
                    </Button>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>

        <aside className="border border-[var(--border)] bg-white">
          <div className="border-b border-[var(--border)] px-4 py-3">
            <h2 className="text-sm font-semibold">Media</h2>
          </div>
          {[
            ["hero.png", "image/png", "tenants/acme/courses/security-basics/hero.png"],
            ["intro.mp4", "video/mp4", "tenants/acme/courses/security-basics/intro.mp4"],
          ].map(([name, type, key]) => (
            <article className="border-b border-[var(--border)] px-4 py-3" key={key}>
              <div className="flex items-center gap-2">
                <Upload aria-hidden="true" className="size-4 text-gray-500" />
                <h3 className="truncate text-sm font-medium">{name}</h3>
              </div>
              <p className="mt-1 text-xs text-gray-500">{type}</p>
              <p className="mt-2 break-all text-xs leading-5 text-gray-500">{key}</p>
            </article>
          ))}
        </aside>
      </section>
    </main>
  );
}

function CourseStatus({ status }: { status: Course["status"] }) {
  const styles = {
    archived: "bg-gray-100 text-gray-700",
    draft: "bg-amber-100 text-amber-800",
    published: "bg-emerald-100 text-emerald-800",
  };

  return (
    <span className={`shrink-0 px-2 py-1 text-xs font-medium ${styles[status]}`}>
      {status}
    </span>
  );
}
