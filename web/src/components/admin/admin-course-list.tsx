"use client";

import { BookOpen, CircleAlert, ExternalLink, FilePlus2, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { createCourse } from "@/lib/api";
import type { Course } from "@/lib/schemas";

type AdminCourseListProps = {
  initialCourses: Course[];
  loadError: string | null;
};

const statusTabs = ["all", "draft", "published", "archived"] as const;

export function AdminCourseList({ initialCourses, loadError }: AdminCourseListProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [status, setStatus] = useState<(typeof statusTabs)[number]>("all");
  const [message, setMessage] = useState(loadError);
  const [isPending, startTransition] = useTransition();

  const filteredCourses = useMemo(
    () => courses.filter((course) => status === "all" || course.status === status),
    [courses, status],
  );

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = formString(form, "title");
    const slug = formString(form, "slug");
    const descriptionValue = formString(form, "description");

    startTransition(async () => {
      try {
        const response = await createCourse({
          description: descriptionValue === "" ? null : descriptionValue,
          slug,
          title,
        });
        setCourses((current) => [response.data, ...current]);
        setMessage("Course draft created");
        event.currentTarget.reset();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Course could not be created");
      }
    });
  }

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl content-start gap-6 px-5 py-5">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center bg-[var(--primary)] text-[var(--primary-foreground)]">
            <BookOpen aria-hidden="true" className="size-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">Courses</h1>
            <p className="text-sm text-gray-600">Org Admin</p>
          </div>
        </div>
        <div className="flex min-w-0 items-center gap-2 border border-[var(--border)] bg-white px-3 py-2">
          <Search aria-hidden="true" className="size-4 shrink-0 text-gray-500" />
          <span className="truncate text-sm text-gray-600">{filteredCourses.length} visible</span>
        </div>
      </header>

      {message ? (
        <div className="flex items-start gap-2 border border-[var(--border)] bg-white px-4 py-3 text-sm text-gray-700">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
          <span>{message}</span>
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[360px_minmax(0,1fr)]">
        <form className="grid content-start gap-4 border border-[var(--border)] bg-white p-4" onSubmit={handleCreate}>
          <div className="flex items-center gap-2">
            <FilePlus2 aria-hidden="true" className="size-4 text-gray-500" />
            <h2 className="text-sm font-semibold">New Course</h2>
          </div>
          <label className="grid gap-1 text-sm font-medium">
            Title
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm font-normal outline-none focus:border-[var(--primary)]"
              maxLength={200}
              minLength={3}
              name="title"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Slug
            <input
              className="h-10 border border-[var(--border)] px-3 text-sm font-normal outline-none focus:border-[var(--primary)]"
              name="slug"
              pattern="^[a-z0-9][a-z0-9-]{1,118}[a-z0-9]$"
              required
            />
          </label>
          <label className="grid gap-1 text-sm font-medium">
            Description
            <textarea
              className="min-h-24 resize-y border border-[var(--border)] px-3 py-2 text-sm font-normal outline-none focus:border-[var(--primary)]"
              maxLength={2000}
              name="description"
            />
          </label>
          <Button className="gap-2" disabled={isPending} type="submit">
            <FilePlus2 aria-hidden="true" className="size-4" />
            Create
          </Button>
        </form>

        <section className="grid content-start gap-4">
          <div className="flex flex-wrap gap-2">
            {statusTabs.map((tab) => (
              <button
                className={`h-9 border px-3 text-sm capitalize ${
                  status === tab
                    ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                    : "border-[var(--border)] bg-white text-gray-700"
                }`}
                key={tab}
                onClick={() => setStatus(tab)}
                type="button"
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="divide-y divide-[var(--border)] border border-[var(--border)] bg-white">
            {filteredCourses.map((course) => (
              <article className="grid gap-3 px-4 py-4" key={course.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-base font-semibold">{course.title}</h2>
                    <p className="mt-1 text-sm text-gray-600">{course.description ?? course.slug}</p>
                  </div>
                  <CourseStatus status={course.status} />
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="break-all text-xs text-gray-500">{course.id}</p>
                  <Link
                    className="inline-flex h-9 items-center gap-2 bg-[var(--primary)] px-3 text-sm font-medium text-white hover:bg-emerald-800"
                    href={`/admin/courses/${course.id}`}
                  >
                    <ExternalLink aria-hidden="true" className="size-4" />
                    Builder
                  </Link>
                </div>
              </article>
            ))}
            {filteredCourses.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-gray-600">No courses found</div>
            ) : null}
          </div>
        </section>
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

  return <span className={`px-2 py-1 text-xs font-medium ${styles[status]}`}>{status}</span>;
}

function formString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}
