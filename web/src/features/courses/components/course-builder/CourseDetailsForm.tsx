"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil } from "lucide-react";
import { useForm } from "react-hook-form";

import { Field, FormError, SubmitButton, TextareaField } from "@/components/ui/form-controls";
import { useFormSubmit } from "@/lib/forms/use-form-submit";

import { updateCourse } from "../../api";
import {
  courseDetailsFormSchema,
  type Course,
  type CourseDetailsFormInput,
} from "../../schemas";

import { formFieldError } from "./mappers";

export function CourseDetailsForm({
  course,
  onSaved,
}: {
  course: Course;
  onSaved: (course: Course) => void;
}) {
  const {
    formState: { errors }, handleSubmit, register, setError,
  } = useForm<CourseDetailsFormInput>({
    defaultValues: { description: course.description ?? "", title: course.title },
    mode: "onTouched", reValidateMode: "onChange", resolver: zodResolver(courseDetailsFormSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: CourseDetailsFormInput) => updateCourse(course.id, {
      description: input.description === "" ? null : input.description, title: input.title,
    }),
    errorMessage: "Course details could not be saved.",
    onSuccess: (response) => onSaved(response.data), setError, successMessage: "Course details saved.",
  });
  const fieldError = formFieldError(errors);

  return (
    <form className="grid gap-3 border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="flex items-center gap-2"><Pencil aria-hidden="true" className="size-4 text-gray-500" /><h2 className="text-sm font-semibold">Details</h2></div>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting}>
        <Field error={fieldError("title")} label="Title" registration={register("title")} />
        <TextareaField error={fieldError("description")} label="Description" registration={register("description")} />
      </fieldset>
      <SubmitButton isSubmitting={isSubmitting} pendingLabel="Saving...">Save</SubmitButton>
    </form>
  );
}
