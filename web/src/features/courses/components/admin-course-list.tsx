"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  CircleAlert,
  ExternalLink,
  FilePlus2,
  Filter,
  Globe,
  Image,
  ListChecks,
  MoreHorizontal,
  PlaySquare,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Dialog } from "@/components/ui/dialog";
import { Field, FormError, SubmitButton, TextareaField } from "@/components/ui/form-controls";
import { SearchInput } from "@/components/ui/input";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { canCreateCourse } from "@/lib/permissions";

import { createCourse, createLesson } from "../api";
import {
  courseWithFirstLessonFormSchema,
  type CourseWithFirstLessonFormInput,
} from "../schemas";

import type { Course } from "../schemas";
import type { OrgRole } from "@/lib/schemas/common";

type AdminCourseListProps = {
  initialCourses: Course[];
  loadError: string | null;
  viewerRole?: OrgRole;
};

const statusTabs = ["all", "draft", "published", "archived"] as const;
const starterTypes = [
  {
    value: "content",
    label: "Content",
    description: "Start with learner-readable text.",
    icon: BookOpen,
  },
  {
    value: "web_content",
    label: "Web content",
    description: "Start from a URL or external resource.",
    icon: Globe,
  },
  {
    value: "video",
    label: "Video",
    description: "Start with a video lesson.",
    icon: PlaySquare,
  },
  {
    value: "image",
    label: "Image",
    description: "Start with an image-led lesson.",
    icon: Image,
  },
  {
    value: "quiz",
    label: "Quiz",
    description: "Start with a check question.",
    icon: ListChecks,
  },
] as const;
type StarterType = (typeof starterTypes)[number]["value"];

export function AdminCourseList({
  initialCourses,
  loadError,
  viewerRole = "tenant_admin",
}: AdminCourseListProps) {
  const [courses, setCourses] = useState(initialCourses);
  const [query, setQuery] = useState("");
  const [showCreate, setShowCreate] = useState(initialCourses.length === 0);
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
      <section className="rounded-lg border border-[var(--border)] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <SearchInput
            label="Search courses"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses"
            value={query}
          />
          <div className="flex items-center gap-2 text-sm text-[var(--color-text-sub-500)]">
            <Filter aria-hidden="true" className="size-4" />
            <span>{filteredCourses.length} visible</span>
          </div>
          {canAuthor ? (
            <button
              className="ml-auto inline-flex h-11 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:bg-[var(--color-primary-dark)]"
              onClick={() => setShowCreate(true)}
              type="button"
            >
              <FilePlus2 aria-hidden="true" className="size-4" />
              Add course
            </button>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <button
              className={`h-9 rounded-md border px-3 text-sm font-semibold capitalize ${
                status === tab
                  ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                  : "border-[var(--border)] bg-white text-[var(--color-text-sub-500)] hover:border-[var(--primary)] hover:text-[var(--primary)]"
              }`}
              key={tab}
              onClick={() => setStatus(tab)}
              type="button"
            >
              {tab}
            </button>
          ))}
        </div>
      </section>

      {message ? (
        <div className="flex items-start gap-2 rounded-md border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#52657a]">
          <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-[var(--primary)]" />
          <span>{message}</span>
        </div>
      ) : null}

      <section className="grid content-start gap-4">
        <div className="overflow-x-auto rounded-lg border border-[#cbd5e1] bg-white shadow-sm">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="border-b border-[#cbd5e1] bg-[#f6f8fb] text-xs uppercase text-[#51647d]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Course</th>
                  <th className="px-4 py-3 font-semibold">Code</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Lessons</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf1f5]">
                {filteredCourses.map((course, index) => (
                  <tr className="hover:bg-[#f8fbf9]" key={course.id}>
                    <td className="px-4 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--color-primary-lighter)] text-[var(--primary)]">
                          <BookOpen aria-hidden="true" className="size-5" />
                        </span>
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-[#0c1726]">{course.title}</h2>
                          <p className="mt-1 truncate text-xs text-[#52657a]">
                            {course.description ?? course.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[#52657a]">
                      {String(index + 1).padStart(3, "0")}
                    </td>
                    <td className="px-4 py-4">
                      <CourseStatus status={course.status} />
                    </td>
                    <td className="px-4 py-4 text-[#52657a]">
                      {course.lesson_count} {course.lesson_count === 1 ? "lesson" : "lessons"}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--primary)] px-3 text-sm font-semibold text-[var(--primary)] hover:bg-[var(--color-primary-lighter)]"
                          href={`/admin/courses/${course.id}`}
                        >
                          <ExternalLink aria-hidden="true" className="size-4" />
                          Builder
                        </Link>
                        <button
                          aria-label={`More actions for ${course.title}`}
                          className="grid size-9 place-items-center rounded-md text-[#52657a] hover:bg-[#f3f6f9]"
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
            <div className="px-4 py-14 text-center text-sm text-[#52657a]">No courses found</div>
          ) : null}
        </div>
      </section>

      {canAuthor ? (
        <Dialog
          description="Choose the first content type, then create the course and its first lesson."
          onClose={() => setShowCreate(false)}
          open={showCreate}
          title="Create a course"
        >
          <NewCourseForm
            onCancel={() => setShowCreate(false)}
            onCreated={(course) => {
              setCourses((current) => [course, ...current]);
              setMessage("Course and first lesson created");
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
  const [starterType, setStarterType] = useState<StarterType>("content");
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<CourseWithFirstLessonFormInput>({
    defaultValues: {
      courseDescription: "",
      courseTitle: "",
      lessonBody: "",
      lessonTitle: "",
    },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(courseWithFirstLessonFormSchema),
  });
  const { formError, submit } = useFormSubmit({
    action: async (input: CourseWithFirstLessonFormInput) => {
      const courseResponse = await createCourse({
        description: input.courseDescription === "" ? null : input.courseDescription,
        title: input.courseTitle,
      });
      await createLesson(courseResponse.data.id, {
        body: input.lessonBody,
        title: input.lessonTitle,
      });
      return courseResponse;
    },
    errorMessage: "Course could not be created.",
    onSuccess: async (response) => {
      onCreated({ ...response.data, lesson_count: 1 });
      reset();
      router.push(`/admin/courses/${response.data.id}`);
    },
    setError,
    successMessage: "Course created.",
  });
  const fieldError = (field: keyof CourseWithFirstLessonFormInput) => {
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
        <fieldset className="grid gap-2">
          <legend className="text-xs font-medium text-slate-600">First content type</legend>
          <div className="grid gap-2">
            {starterTypes.map((type) => {
              const Icon = type.icon;
              const selected = starterType === type.value;

              return (
                <button
                  className={`grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border px-3 py-3 text-left ${
                    selected
                      ? "border-[var(--primary)] bg-[var(--color-primary-lighter)]"
                      : "border-[var(--border)] bg-white hover:border-[var(--primary)]"
                  }`}
                  key={type.value}
                  onClick={() => setStarterType(type.value)}
                  type="button"
                >
                  <Icon aria-hidden="true" className="mt-0.5 size-5 text-[var(--primary)]" />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-[#0c1726]">{type.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-[#52657a]">
                      {type.description}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <Field
          error={fieldError("courseTitle")}
          label="Course title"
          registration={register("courseTitle")}
        />
        <TextareaField
          error={fieldError("courseDescription")}
          label="Course description"
          registration={register("courseDescription")}
        />
        <Field
          error={fieldError("lessonTitle")}
          label="First lesson title"
          registration={register("lessonTitle")}
        />
        <TextareaField
          error={fieldError("lessonBody")}
          label={starterBodyLabel(starterType)}
          registration={register("lessonBody")}
        />
      </fieldset>
      <div className="flex flex-wrap items-center gap-2">
        <SubmitButton className="w-auto gap-2" isSubmitting={isSubmitting} pendingLabel="Creating...">
          <FilePlus2 aria-hidden="true" className="size-4" />
          Create course
        </SubmitButton>
        <button
          className="h-10 rounded-md px-3 text-sm font-semibold text-[#52657a] hover:bg-[#f3f6f9]"
          onClick={onCancel}
          type="button"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function starterBodyLabel(starterType: StarterType) {
  if (starterType === "web_content") {
    return "First web content URL";
  }
  if (starterType === "video") {
    return "First video URL or notes";
  }
  if (starterType === "image") {
    return "First image URL or notes";
  }
  if (starterType === "quiz") {
    return "First quiz question";
  }
  return "First lesson content";
}

function CourseStatus({ status }: { status: Course["status"] }) {
  const styles = {
    archived: "bg-slate-100 text-slate-700",
    draft: "bg-[#fff2dc] text-[#9a5b00]",
    published: "bg-[var(--color-primary-lighter)] text-[var(--primary)]",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {status}
    </span>
  );
}
