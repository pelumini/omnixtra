"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  CircleAlert,
  FilePlus2,
  Filter,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
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

import { createCourse, deleteCourse, publishCourse } from "../api";
import { courseFormSchema, type CourseFormInput } from "../schemas";

import type { Course } from "../schemas";
import type { OrgRole } from "@/lib/schemas/common";
import type { ReactNode } from "react";

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
  const router = useRouter();
  const [courses, setCourses] = useState(initialCourses);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [status, setStatus] = useState<(typeof statusTabs)[number]>("all");
  const [message, setMessage] = useState(loadError);
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Course | null>(null);
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

  async function handlePublish(course: Course) {
    setPendingCourseId(course.id);
    setMessage(null);
    try {
      const response = await publishCourse(course.id);
      setCourses((current) =>
        current.map((item) =>
          item.id === response.data.id ? response.data : item,
        ),
      );
      setMessage(`${course.title} published`);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Course could not be published.",
      );
    } finally {
      setPendingCourseId(null);
    }
  }

  async function handleDelete() {
    if (deleteTarget === null) return;

    const course = deleteTarget;
    const previousCourses = courses;
    setDeleteTarget(null);
    setCourses((current) => current.filter((item) => item.id !== course.id));
    setMessage(null);
    try {
      await deleteCourse(course.id);
      setMessage(`${course.title} deleted`);
    } catch (error) {
      setCourses(previousCourses);
      setMessage(
        error instanceof Error ? error.message : "Course could not be deleted.",
      );
    }
  }

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
        <div className="overflow-x-auto rounded-lg border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] px-2 pb-2 shadow-sm">
          <table className="w-full min-w-[760px] border-separate border-spacing-y-2 text-left text-sm">
            <thead className="border-b border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] text-xs uppercase text-[var(--color-text-sub-500)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Course</th>
                <th className="px-4 py-3 font-semibold">Code</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Lessons</th>
                <th className="px-4 py-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCourses.map((course, index) => (
                <tr
                  aria-label={`Open ${course.title}`}
                  className="cursor-pointer bg-[var(--color-bg-white-0)] shadow-[var(--shadow-x-small)] transition-shadow hover:shadow-[var(--shadow-small)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2"
                  key={course.id}
                  onClick={() => router.push(`/admin/courses/${course.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(`/admin/courses/${course.id}`);
                    }
                  }}
                  role="link"
                  tabIndex={0}
                >
                  <td className="rounded-l-md px-4 py-4">
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
                  <td
                    className="rounded-r-md px-4 py-4"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <CourseActions
                      course={course}
                      disabled={pendingCourseId === course.id}
                      onDelete={setDeleteTarget}
                      onOpen={() => router.push(`/admin/courses/${course.id}`)}
                      onPublish={handlePublish}
                    />
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

      <Dialog
        description="This removes the course and its authoring content from the academy."
        onClose={() => setDeleteTarget(null)}
        open={deleteTarget !== null}
        title={`Delete ${deleteTarget?.title ?? "course"}?`}
      >
        <div className="flex justify-end gap-2">
          <Button onClick={() => setDeleteTarget(null)} variant="secondary">
            Cancel
          </Button>
          <Button onClick={() => void handleDelete()}>Delete course</Button>
        </div>
      </Dialog>
    </main>
  );
}

function CourseActions({
  course,
  disabled,
  onDelete,
  onOpen,
  onPublish,
}: {
  course: Course;
  disabled: boolean;
  onDelete: (course: Course) => void;
  onOpen: () => void;
  onPublish: (course: Course) => Promise<void>;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <IconAction
        ariaLabel={`Open ${course.title} in builder`}
        icon={<Pencil aria-hidden="true" className="size-4" />}
        onClick={onOpen}
        tooltip="Open in builder"
        tooltipAlignment="left"
      />
      {course.status === "draft" ? (
        <IconAction
          ariaLabel={`Publish ${course.title}`}
          disabled={disabled}
          icon={<Send aria-hidden="true" className="size-4" />}
          onClick={() => void onPublish(course)}
          tooltip="Publish"
        />
      ) : null}
      <IconAction
        ariaLabel={`Delete ${course.title}`}
        destructive
        disabled={disabled}
        icon={<Trash2 aria-hidden="true" className="size-4" />}
        onClick={() => onDelete(course)}
        tooltip="Delete"
        tooltipAlignment="right"
      />
    </div>
  );
}

function IconAction({
  ariaLabel,
  destructive = false,
  disabled = false,
  icon,
  onClick,
  tooltip,
  tooltipAlignment = "center",
}: {
  ariaLabel: string;
  destructive?: boolean;
  disabled?: boolean;
  icon: ReactNode;
  onClick: () => void;
  tooltip: string;
  tooltipAlignment?: "center" | "left" | "right";
}) {
  const tooltipId = useId();
  const alignment = {
    center: "left-1/2 -translate-x-1/2",
    left: "left-0",
    right: "right-0",
  }[tooltipAlignment];

  return (
    <span className="group relative inline-flex">
      <button
        aria-describedby={tooltipId}
        aria-label={ariaLabel}
        className={`grid size-9 place-items-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${destructive ? "text-[var(--color-state-error)] hover:bg-[var(--color-red-lighter)]" : "text-[var(--color-text-sub-500)] hover:bg-[var(--color-bg-soft-200)] hover:text-[var(--color-primary-base)]"}`}
        disabled={disabled}
        onClick={onClick}
        type="button"
      >
        {icon}
      </button>
      <span
        className={`pointer-events-none absolute bottom-[calc(100%+0.375rem)] z-40 whitespace-nowrap rounded-md border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-2 py-1 text-xs font-medium text-[var(--color-text-main-900)] opacity-0 shadow-[var(--shadow-small)] transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 ${alignment}`}
        id={tooltipId}
        role="tooltip"
      >
        {tooltip}
      </span>
    </span>
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
          label="Course Title"
          registration={register("title")}
        />
        <TextareaField
          error={fieldError("description")}
          label="Course Description"
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
