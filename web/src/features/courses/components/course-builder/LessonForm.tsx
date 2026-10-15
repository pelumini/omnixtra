"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import { Field, FormError, SelectField, SubmitButton } from "@/components/ui/form-controls";
import { useFormSubmit } from "@/lib/forms/use-form-submit";

import { createLesson } from "../../api";
import { lessonFormSchema, type Lesson, type LessonFormInput, type Section } from "../../schemas";

import { formFieldError } from "./mappers";

export function LessonForm({ courseId, disabled, lessons, onCreated, onSectionChange, sections, selectedSectionId }: { courseId: string; disabled: boolean; lessons: Lesson[]; onCreated: (lesson: Lesson) => void; onSectionChange: (sectionId: string) => void; sections: Section[]; selectedSectionId: string }) {
  const { formState: { errors }, handleSubmit, register, reset, setError } = useForm<LessonFormInput>({ defaultValues: { sectionId: selectedSectionId, title: "" }, mode: "onTouched", reValidateMode: "onChange", resolver: zodResolver(lessonFormSchema) });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: LessonFormInput) => createLesson(courseId, { position: lessons.filter((lesson) => lesson.section_id === input.sectionId).length, section_id: input.sectionId, title: input.title }),
    errorMessage: "Lesson could not be added.",
    onSuccess: (response) => { onCreated(response.data); reset({ sectionId: selectedSectionId, title: "" }); }, setError, successMessage: "Lesson added.",
  });
  const fieldError = formFieldError(errors);
  return (
    <form className="grid gap-3 border border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-white-0)] p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="flex items-center gap-2"><FileText aria-hidden="true" className="size-4 text-gray-500" /><h2 className="text-sm font-semibold">Lesson</h2></div>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting || disabled}>
        <SelectField error={fieldError("sectionId")} label="Section" registration={register("sectionId", { onChange: (event) => onSectionChange(event.target.value) })}>
          <option value="">Select section</option>{sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
        </SelectField>
        <Field error={fieldError("title")} label="Lesson Title" registration={register("title")} />
      </fieldset>
      <SubmitButton className="gap-2" disabled={disabled} isSubmitting={isSubmitting} pendingLabel="Adding..."><Plus aria-hidden="true" className="size-4" />Add</SubmitButton>
    </form>
  );
}
