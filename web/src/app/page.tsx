import {
  Award,
  BadgeCheck,
  Bot,
  BookOpen,
  CheckCircle2,
  CircleDashed,
  FileText,
  Image,
  ListChecks,
  PlaySquare,
  Plus,
  RotateCcw,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import type { Course, CoursePlayer } from "@/lib/schemas";

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

const player: CoursePlayer = {
  course_id: "00000000-0000-0000-0000-000000000102",
  title: "Customer Enablement",
  status: "published",
  sections: [
    {
      id: "00000000-0000-0000-0000-000000000201",
      title: "Product Basics",
      position: 0,
      lessons: [
        {
          id: "00000000-0000-0000-0000-000000000301",
          title: "Start here",
          position: 0,
          percent_complete: 100,
        },
        {
          id: "00000000-0000-0000-0000-000000000302",
          title: "Workspace tour",
          position: 1,
          percent_complete: 65,
        },
      ],
    },
    {
      id: "00000000-0000-0000-0000-000000000202",
      title: "Knowledge Check",
      position: 1,
      lessons: [
        {
          id: "00000000-0000-0000-0000-000000000303",
          title: "Implementation quiz",
          position: 0,
          percent_complete: 0,
        },
      ],
    },
  ],
};

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

      <section className="grid gap-4 border-t border-[var(--border)] pt-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="border border-[var(--border)] bg-white">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold">{player.title}</h2>
              <p className="mt-1 text-sm text-gray-600">Learner course player</p>
            </div>
            <Button className="gap-2 bg-white text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-gray-100">
              <RotateCcw aria-hidden="true" className="size-4" />
              Resume
            </Button>
          </div>

          <div className="grid gap-4 p-5">
            {player.sections.map((section) => (
              <article className="border border-[var(--border)]" key={section.id}>
                <div className="border-b border-[var(--border)] bg-gray-50 px-4 py-3">
                  <h3 className="text-sm font-semibold">{section.title}</h3>
                </div>
                <div className="divide-y divide-[var(--border)]">
                  {section.lessons.map((lesson) => (
                    <div className="grid gap-2 px-4 py-3" key={lesson.id}>
                      <div className="flex items-center justify-between gap-3">
                        <p className="min-w-0 truncate text-sm font-medium">{lesson.title}</p>
                        <span className="text-xs text-gray-500">{lesson.percent_complete}%</span>
                      </div>
                      <div className="h-2 bg-gray-100">
                        <div
                          className="h-2 bg-[var(--primary)]"
                          style={{ width: `${lesson.percent_complete}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="grid content-start gap-4">
          <section className="border border-[var(--border)] bg-white">
            <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-3">
              <Bot aria-hidden="true" className="size-4 text-gray-500" />
              <h2 className="text-sm font-semibold">Tutor</h2>
            </div>
            <div className="grid gap-3 px-4 py-4">
              <div className="border border-[var(--border)] bg-gray-50 px-3 py-3 text-sm leading-6 text-gray-700">
                AI-generated guidance will cite lesson chunks and stay inside this course.
              </div>
              <div className="grid gap-2">
                {["Where did I stop?", "Explain implementation planning", "Review quiz topic"].map(
                  (question) => (
                    <Button
                      className="h-10 justify-start bg-white text-gray-700 ring-1 ring-[var(--border)] hover:bg-gray-100"
                      key={question}
                    >
                      {question}
                    </Button>
                  ),
                )}
              </div>
            </div>
          </section>

          <section className="border border-[var(--border)] bg-white">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold">Quiz</h2>
            </div>
            <div className="grid gap-3 px-4 py-4">
              {["Create a project", "Invite a learner", "Publish a marketplace listing"].map(
                (answer) => (
                  <Button
                    className="h-11 justify-start bg-white text-gray-700 ring-1 ring-[var(--border)] hover:bg-gray-100"
                    key={answer}
                  >
                    {answer}
                  </Button>
                ),
              )}
              <Button className="gap-2">
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Submit
              </Button>
            </div>
          </section>

          <section className="border border-[var(--border)] bg-white">
            <div className="border-b border-[var(--border)] px-4 py-3">
              <h2 className="text-sm font-semibold">Completion</h2>
            </div>
            <div className="grid gap-3 px-4 py-4">
              <p className="text-sm text-gray-600">One lesson and one quiz remain.</p>
              <Button className="gap-2 bg-white text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-gray-100">
                <Award aria-hidden="true" className="size-4" />
                Certificate
              </Button>
            </div>
          </section>
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
