"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import { Field, FormError, SubmitButton } from "@/components/ui/form-controls";
import { createSection } from "../../api";
import { useFormSubmit } from "@/lib/forms/use-form-submit";
import { sectionFormSchema, type Section, type SectionFormInput } from "../../schemas";
import { formFieldError } from "./mappers";

export function SectionForm({ courseId, onCreated, position }: { courseId: string; onCreated: (section: Section) => void; position: number }) {
  const { formState: { errors }, handleSubmit, register, reset, setError } = useForm<SectionFormInput>({
    defaultValues: { title: "" }, mode: "onTouched", reValidateMode: "onChange", resolver: zodResolver(sectionFormSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: SectionFormInput) => createSection(courseId, { position, title: input.title }),
    errorMessage: "Section could not be added.",
    onSuccess: (response) => { onCreated(response.data); reset(); },
    setError, successMessage: "Section added.",
  });
  const fieldError = formFieldError(errors);

  return (
    <form className="flex flex-wrap items-end gap-3 border border-[var(--border)] bg-white p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="min-w-56 flex-1"><FormError>{formError}</FormError><fieldset disabled={isSubmitting}><Field error={fieldError("title")} label="Section" registration={register("title")} /></fieldset></div>
      <SubmitButton className="w-auto gap-2" isSubmitting={isSubmitting} pendingLabel="Adding..."><Plus aria-hidden="true" className="size-4" />Add</SubmitButton>
    </form>
  );
}
