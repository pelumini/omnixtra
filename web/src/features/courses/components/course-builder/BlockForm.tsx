"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Boxes, FileText, Globe, Image, ListChecks, PlaySquare, Plus } from "lucide-react";
import { useForm } from "react-hook-form";

import { FieldError, FormError, SelectField, SubmitButton, TextareaField } from "@/components/ui/form-controls";
import { useFormSubmit } from "@/lib/forms/use-form-submit";

import { createBlock } from "../../api";
import { blockFormSchema, type Block, type BlockFormInput, type Lesson } from "../../schemas";

import { backendBlockType, blockContent, contentBodyLabel, formFieldError } from "./mappers";

const blockTypes = [
  { value: "content", label: "Content", hint: "Write lesson text, notes, or instructions.", icon: FileText },
  { value: "web_content", label: "Web content", hint: "Add a useful link or embedded-resource URL.", icon: Globe },
  { value: "video", label: "Video", hint: "Paste a video URL for the lesson.", icon: PlaySquare },
  { value: "image", label: "Image", hint: "Add an image URL or reference.", icon: Image },
  { value: "quiz", label: "Quiz", hint: "Add a quick check question.", icon: ListChecks },
] as const;

export function BlockForm({ blocks, courseId, disabled, lessons, onCreated, onLessonChange, selectedLessonId }: { blocks: Block[]; courseId: string; disabled: boolean; lessons: Lesson[]; onCreated: (block: Block) => void; onLessonChange: (lessonId: string) => void; selectedLessonId: string }) {
  const { formState: { errors }, handleSubmit, register, reset, setError, watch } = useForm<BlockFormInput>({ defaultValues: { blockType: "content", body: "", lessonId: selectedLessonId }, mode: "onTouched", reValidateMode: "onChange", resolver: zodResolver(blockFormSchema) });
  const selectedBlockType = watch("blockType");
  const selectedBlockOption = blockTypes.find((blockType) => blockType.value === selectedBlockType) ?? blockTypes[0];
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: BlockFormInput) => createBlock(courseId, { block_type: backendBlockType(input.blockType), content: blockContent(input.blockType, input.body), lesson_id: input.lessonId, position: blocks.filter((block) => block.lesson_id === input.lessonId).length }),
    errorMessage: "Content could not be added.",
    onSuccess: (response) => { onCreated(response.data); reset({ blockType: "content", body: "", lessonId: selectedLessonId }); }, setError, successMessage: "Content added.",
  });
  const fieldError = formFieldError(errors);
  return (
    <form className="grid gap-3 border border-[var(--border)] bg-white p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="flex items-center gap-2"><Boxes aria-hidden="true" className="size-4 text-gray-500" /><h2 className="text-sm font-semibold">Add standard content</h2></div>
      <p className="text-xs leading-5 text-slate-500">Choose the exact content type you want to add. OmniXtra does not group these behind separate course categories.</p>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting || disabled}>
        <SelectField error={fieldError("lessonId")} label="Lesson" registration={register("lessonId", { onChange: (event) => onLessonChange(event.target.value) })}>
          <option value="">Select lesson</option>{lessons.map((lesson) => <option key={lesson.id} value={lesson.id}>{lesson.title}</option>)}
        </SelectField>
        <fieldset className="grid gap-2"><legend className="text-xs font-medium text-slate-600">Content type</legend>
          {blockTypes.map((blockType) => { const Icon = blockType.icon; return (
            <label className="grid cursor-pointer grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-md border border-[var(--border)] bg-white px-3 py-3 text-sm hover:border-[var(--primary)] hover:bg-[var(--color-primary-lighter)]" key={blockType.value}>
              <input className="mt-1" {...register("blockType")} type="radio" value={blockType.value} />
              <span className="min-w-0"><span className="flex items-center gap-2 font-medium text-[var(--foreground)]"><Icon aria-hidden="true" className="size-4 text-[var(--primary)]" />{blockType.label}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{blockType.hint}</span></span>
            </label>
          ); })}
        </fieldset>
        {fieldError("blockType") ? <FieldError>{fieldError("blockType")}</FieldError> : null}
        <TextareaField error={fieldError("body")} label={contentBodyLabel(selectedBlockOption.value)} registration={register("body")} />
      </fieldset>
      <SubmitButton className="gap-2" disabled={disabled} isSubmitting={isSubmitting} pendingLabel="Adding..."><Plus aria-hidden="true" className="size-4" />Add content</SubmitButton>
    </form>
  );
}
