"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  CircleAlert,
  ExternalLink,
  FilePlus2,
  Filter,
  MoreHorizontal,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Dialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import {
  Field,
  FormError,
  SubmitButton,
  TextareaField,
} from "@/components/ui/form-controls";
import { SearchInput } from "@/components/ui/input";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { canCreateCourse } from "@/lib/permissions";

import { createCourse } from "../api";
import { courseFormSchema, type CourseFormInput } from "../schemas";

import type { Course } from "../schemas";
import type { OrgRole } from "@/lib/schemas/common";

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
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [status, setStatus] = useState<(typeof statusTabs)[number]>("all");
  const [message, setMessage] = useState(loadError);
  const canAuthor = canCreateCourse(viewerRole);

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return courses.filter((course) => {
      const matchesStatus = status === "all" || course.status === status;
      const matchesQuery =
        normalizedQuery.length === 0 ||
        course.title.toLowerCase().includes(normalizedQuery) ||
        course.slug.toLowerCase().includes(normalizedQuery) ||
        (course.description ?? "").toLowerCase().includes(normalizedQuery);
      return matchesStatus && matchesQuery;
    });
  }, [courses, query, status]);

  return (
    <main className="mx-auto grid min-h-screen max-w-[104rem] content-start gap-5 px-5 py-6 lg:px-8">
      <section className="rounded-lg border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            label="Search courses"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses"
            value={query}
          />
          <StatusFilter
            labels={{
              all: "All",
              archived: "Archived",
              draft: "Draft",
              published: "Published",
            }}
            onChange={setStatus}
            options={statusTabs}
            value={status}
          />
          <span className="text-sm text-[var(--color-text-sub-500)]">
            {filteredCourses.length} visible
          </span>
          {canAuthor ? (
            <button
              className="ml-auto inline-flex h-11 items-center gap-2 rounded-md bg-[var(--color-primary-base)] px-4 text-sm font-semibold text-[var(--color-text-white-0)] hover:bg-[var(--color-primary-dark)]"
              onClick={() => setShowCreate(true)}
              type="button"
            >
              <FilePlus2 aria-hidden="true" className="size-4" />
              Add course
            </button>
          ) : null}
        </div>
      </section>

      {message ? (
        <div className="flex items-start gap-2 rounded-md border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-4 py-3 text-sm text-[var(--color-text-sub-500)]">
          <CircleAlert
            aria-hidden="true"
            className="mt-0.5 size-4 shrink-0 text-[var(--color-primary-base)]"
          />
          <span>{message}</span>
        </div>
      ) : null}

      <section className="grid content-start gap-4">
        <div className="overflow-x-auto rounded-lg border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] text-xs uppercase text-[var(--color-text-sub-500)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Lessons</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-stroke-soft-200)]">
              {filteredCourses.map((course, index) => (
                <tr
                  className="hover:bg-[var(--color-bg-weak-100)]"
                  key={course.id}
                >
                  <td className="px-4 py-4">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--color-primary-lighter)] text-[var(--color-primary-base)]">
                        <BookOpen aria-hidden="true" className="size-5" />
                      </span>
                      <div className="min-w-0">
                        <h2 className="truncate font-semibold text-[var(--color-text-main-900)]">
                          {course.title}
                        </h2>
                        <p className="mt-1 truncate text-xs text-[var(--color-text-sub-500)]">
                          {course.description ?? course.slug}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-sub-500)]">
                    {String(index + 1).padStart(3, "0")}
                  </td>
                  <td className="px-4 py-4">
                    <CourseStatus status={course.status} />
                  </td>
                  <td className="px-4 py-4 text-[var(--color-text-sub-500)]">
                    {course.lesson_count}{" "}
                    {course.lesson_count === 1 ? "lesson" : "lessons"}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-primary-base)] px-3 text-sm font-semibold text-[var(--color-primary-base)] hover:bg-[var(--color-primary-lighter)]"
                        href={`/admin/courses/${course.id}`}
                      >
                        <ExternalLink aria-hidden="true" className="size-4" />
                        Builder
                      </Link>
                      <button
                        aria-label={`More actions for ${course.title}`}
                        className="grid size-9 place-items-center rounded-md text-[var(--color-text-sub-500)] hover:bg-[var(--color-bg-weak-100)]"
                        type="button"
                      >
                        <MoreHorizontal aria-hidden="true" className="size-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCourses.length === 0 ? (
            <div className="px-4 py-14 text-center text-sm text-[var(--color-text-sub-500)]">
              No courses found
            </div>
          ) : null}
        </div>
      </section>

      {canAuthor ? (
        <Dialog
          description="Name your course - you'll add details, sections and content next."
          onClose={() => setShowCreate(false)}
          open={showCreate}
          title="Create a course"
        >
          <NewCourseForm
            onCancel={() => setShowCreate(false)}
            onCreated={(course) => {
              setCourses((current) => [course, ...current]);
              setMessage("Course created");
              setShowCreate(false);
            }}
          />
        </Dialog>
      ) : null}
    </main>
  );
}

function NewCourseForm({
  onCancel,
  onCreated,
}: {
  onCancel: () => void;
  onCreated: (course: Course) => void;
}) {
  const router = useRouter();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CourseFormInput>({
    defaultValues: {
      description: "",
      title: "",
    },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(courseFormSchema),
  });
  const { formError, submit } = useFormSubmit({
    action: (input: CourseFormInput) =>
      createCourse({
        description: input.description === "" ? null : input.description,
        title: input.title,
      }),
    errorMessage: "Course could not be created.",
    onSuccess: async (response) => {
      onCreated(response.data);
      reset();
      router.push(`/admin/courses/${response.data.id}`);
    },
    setError,
    successMessage: "Course created.",
  });
  const fieldError = (field: keyof CourseFormInput) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };

  return (
    <form
      className="grid max-h-[calc(100dvh-12rem)] content-start gap-4 overflow-y-auto pr-1"
      id="new-course"
      noValidate
      onSubmit={handleSubmit(submit)}
    >
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-4" disabled={isSubmitting}>
        <Field
          error={fieldError("title")}
          label="Course title"
          registration={register("title")}
        />
        <TextareaField
          error={fieldError("description")}
          label="Course description"
          registration={register("description")}
        />
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton
          className="w-auto gap-2"
          isSubmitting={isSubmitting}
          pendingLabel="Creating..."
        >
          <FilePlus2 aria-hidden="true" className="size-4" />
          Create course
        </SubmitButton>
        <button
          className="h-10 rounded-md px-3 text-sm font-semibold text-[var(--color-text-sub-500)] hover:bg-[var(--color-bg-weak-100)]"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function StatusFilter<T extends string>({
  labels,
  onChange,
  options,
  value,
}: {
  labels: Record<T, string>;
  onChange: (value: T) => void;
  options: readonly T[];
  value: T;
}) {
  return (
    <Dropdown
      panelClassName="absolute left-0 z-30 mt-2 min-w-44 rounded-md border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-1.5 shadow-lg"
      trigger={
        <>
          <Filter aria-hidden="true" className="size-4" />
          <span>
            {value === options[0] ? "Filter" : `Filter: ${labels[value]}`}
          </span>
        </>
      }
      triggerClassName="inline-flex h-11 items-center gap-2 rounded-md border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-3 text-sm font-semibold text-[var(--color-text-sub-500)] hover:border-[var(--color-primary-base)] hover:text-[var(--color-primary-base)]"
      triggerLabel="Filter by status"
    >
      {(close) =>
        options.map((option) => (
          <button
            aria-checked={value === option}
            className={`flex w-full items-center justify-between rounded px-3 py-2 text-left text-sm ${value === option ? "bg-[var(--color-primary-lighter)] font-semibold text-[var(--color-primary-base)]" : "text-[var(--color-text-sub-500)] hover:bg-[var(--color-bg-weak-100)]"}`}
            key={option}
            onClick={() => {
              onChange(option);
              close();
            }}
            role="menuitemradio"
            type="button"
          >
            {labels[option]}
            <span
              aria-hidden="true"
              className={`size-2 rounded-full ${value === option ? "bg-[var(--color-primary-base)]" : "bg-transparent"}`}
            />
          </button>
        ))
      }
    </Dropdown>
  );
}

function CourseStatus({ status }: { status: Course["status"] }) {
  const styles = {
    archived: "bg-[var(--color-bg-weak-100)] text-[var(--color-text-sub-500)]",
    draft: "bg-[var(--color-orange-lighter)] text-[var(--color-state-warning)]",
    published:
      "bg-[var(--color-primary-lighter)] text-[var(--color-primary-base)]",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {status}
    </span>
  );
}
