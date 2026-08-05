"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, CircleAlert, ExternalLink, FilePlus2, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FormError, SubmitButton, TextareaField } from "@/components/ui/form-controls";
import { createCourse } from "@/lib/api";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { canCreateCourse } from "@/lib/permissions";
import { courseFormSchema, type CourseFormInput } from "@/lib/schemas/admin-forms";
import type { Course } from "@/lib/schemas";
import type { OrgRole } from "@/lib/schemas";

type AdminCourseListProps = {
  initialCourses: Course[];
  loadError: string | null;
  viewerRole?: OrgRole;
};

const statusTabs = ["all", "draft", "published", "archived"] as const;

export function AdminCourseList({
  initialCourses,
  loadError,
  viewerRole = "tenant_admin",
}: AdminCourseListProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [status, setStatus] = useState<(typeof statusTabs)[number]>("all");
  const [message, setMessage] = useState(loadError);

  const filteredCourses = useMemo(
    () => courses.filter((course) => status === "all" || course.status === status),
    [courses, status],
  );

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
        {canCreateCourse(viewerRole) ? (
          <NewCourseForm
            onCreated={(course) => {
              setCourses((current) => [course, ...current]);
              setMessage("Course draft created");
            }}
          />
        ) : (
          <div className="hidden lg:block" />
        )}

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

function NewCourseForm({ onCreated }: { onCreated: (course: Course) => void }) {
  const {
    formState: { errors },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CourseFormInput>({
    defaultValues: { description: "", slug: "", title: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(courseFormSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: CourseFormInput) =>
      createCourse({
        description: input.description === "" ? null : input.description,
        slug: input.slug,
        title: input.title,
      }),
    onSuccess: (response) => {
      onCreated(response.data);
      reset();
    },
    setError,
  });
  const fieldError = (field: keyof CourseFormInput) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };

  return (
    <form
      className="grid content-start gap-4 border border-[var(--border)] bg-white p-4"
      noValidate
      onSubmit={handleSubmit(submit)}
    >
      <div className="flex items-center gap-2">
        <FilePlus2 aria-hidden="true" className="size-4 text-gray-500" />
        <h2 className="text-sm font-semibold">New Course</h2>
      </div>
      <FormError>{formError}</FormError>
      <Field error={fieldError("title")} label="Title" registration={register("title")} />
      <Field
        error={fieldError("slug")}
        label="Slug"
        registration={register("slug", {
          setValueAs: (value: unknown) =>
            typeof value === "string"
              ? value.toLowerCase().replace(/[^a-z0-9-]/g, "")
              : value,
        })}
      />
      <TextareaField
        error={fieldError("description")}
        label="Description"
        registration={register("description")}
      />
      <SubmitButton className="gap-2" isSubmitting={isSubmitting}>
        <FilePlus2 aria-hidden="true" className="size-4" />
        Create
      </SubmitButton>
    </form>
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
