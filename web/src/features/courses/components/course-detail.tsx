"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpen, FilePlus2, FileText } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Field, FormError, SubmitButton, TextareaField } from "@/components/ui/form-controls";
import { resolveMessage } from "@/lib/forms/messages";
import { useFormSubmit } from "@/lib/forms/use-form-submit";

import { createLesson } from "../api";
import {
  firstLessonFormSchema,
  type CourseDetail as CourseDetailType,
  type FirstLessonFormInput,
  type Lesson,
} from "../schemas";

type CourseDetailProps = {
  course: CourseDetailType;
};

export function CourseDetail({ course }: CourseDetailProps) {
  const [lessons, setLessons] = useState(course.lessons);
  const orderedLessons = useMemo(
    () => [...lessons].sort((left, right) => left.position - right.position),
    [lessons],
  );

  return (
    <main className="mx-auto grid min-h-screen max-w-6xl content-start gap-6 px-5 py-5">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--color-stroke-soft-200)] pb-5">
        <div className="min-w-0">
          <Link className="text-sm text-[var(--color-text-sub-500)] hover:text-[var(--color-primary-base)]" href="/admin/courses">
            Courses
          </Link>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--foreground)]">{course.title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
            {course.description ?? "Draft course"}
          </p>
        </div>
        <span className="border border-amber-200 bg-amber-50 px-3 py-1 text-sm font-medium capitalize text-amber-800">
          {course.status}
        </span>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="grid content-start gap-4">
          <div className="flex items-center gap-2">
            <BookOpen aria-hidden="true" className="size-5 text-[var(--color-primary-base)]" />
            <h2 className="text-base font-semibold">Lessons</h2>
          </div>

          {orderedLessons.map((lesson, index) => (
            <LessonCard index={index + 1} key={lesson.id} lesson={lesson} />
          ))}

          {orderedLessons.length === 0 ? (
            <div className="border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] px-4 py-10 text-center text-sm text-[var(--color-text-sub-500)]">
              No lessons yet
            </div>
          ) : null}
        </section>

        <AddLessonForm
          courseId={course.id}
          onCreated={(lesson) => {
            setLessons((current) => [...current, lesson]);
          }}
        />
      </section>
    </main>
  );
}

function LessonCard({ index, lesson }: { index: number; lesson: Lesson }) {
  return (
    <article className="border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)]">
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-stroke-soft-200)] px-4 py-3">
        <span className="grid size-8 place-items-center bg-slate-100 text-sm font-semibold text-slate-700">
          {index}
        </span>
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{lesson.title}</h3>
          <p className="text-xs text-slate-500">Lesson {lesson.position + 1}</p>
        </div>
      </div>
      <div className="grid gap-3 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <FileText aria-hidden="true" className="size-4 text-[var(--color-primary-base)]" />
          Text content
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">
          {lesson.body ?? "No text content yet."}
        </p>
      </div>
    </article>
  );
}

function AddLessonForm({
  courseId,
  onCreated,
}: {
  courseId: string;
  onCreated: (lesson: Lesson) => void;
}) {
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setError,
  } = useForm<FirstLessonFormInput>({
    defaultValues: { body: "", title: "" },
    mode: "onTouched",
    reValidateMode: "onChange",
    resolver: zodResolver(firstLessonFormSchema),
  });
  const { formError, submit } = useFormSubmit({
    action: (input: FirstLessonFormInput) =>
      createLesson(courseId, {
        body: input.body,
        title: input.title,
      }),
    errorMessage: "Lesson could not be added.",
    onSuccess: (response) => {
      onCreated(response.data);
      reset();
    },
    setError,
    successMessage: "Lesson added.",
  });
  const fieldError = (field: keyof FirstLessonFormInput) => {
    const message = errors[field]?.message;
    return message ? resolveMessage(field, message) : undefined;
  };

  return (
    <form
      className="grid content-start gap-3 border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4"
      noValidate
      onSubmit={handleSubmit(submit)}
    >
      <div className="flex items-center gap-2">
        <FilePlus2 aria-hidden="true" className="size-4 text-slate-500" />
        <h2 className="text-sm font-semibold">Add lesson</h2>
      </div>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting}>
        <Field error={fieldError("title")} label="Lesson Title" registration={register("title")} />
        <TextareaField error={fieldError("body")} label="Lesson Text" registration={register("body")} />
      </fieldset>
      <SubmitButton className="gap-2" isSubmitting={isSubmitting} pendingLabel="Saving...">
        <FilePlus2 aria-hidden="true" className="size-4" />
        Add lesson
      </SubmitButton>
    </form>
  );
}
