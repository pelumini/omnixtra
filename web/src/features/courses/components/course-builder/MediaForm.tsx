"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Upload } from "lucide-react";
import { useForm } from "react-hook-form";

import { Field, FormError, SelectField, SubmitButton } from "@/components/ui/form-controls";
import { useFormSubmit } from "@/lib/forms/use-form-submit";

import { createMediaAsset } from "../../api";
import { mediaFormSchema, type MediaAsset, type MediaFormInput } from "../../schemas";

import { formFieldError } from "./mappers";

export function MediaForm({ courseId, onCreated }: { courseId: string; onCreated: (asset: MediaAsset) => void }) {
  const { formState: { errors }, handleSubmit, register, reset, setError } = useForm<MediaFormInput>({
    defaultValues: { byteSize: 0, contentType: "image/png", fileName: "" },
    mode: "onTouched", reValidateMode: "onChange", resolver: zodResolver(mediaFormSchema),
  });
  const { formError, isSubmitting, submit } = useFormSubmit({
    action: (input: MediaFormInput) => createMediaAsset(courseId, {
      byte_size: input.byteSize, checksum_sha256: null, content_type: input.contentType,
      file_name: input.fileName, object_key: `tenants/current/courses/${courseId}/${input.fileName}`,
    }),
    errorMessage: "Media metadata could not be saved.",
    onSuccess: (response) => { onCreated(response.data); reset(); },
    setError, successMessage: "Media metadata saved.",
  });
  const fieldError = formFieldError(errors);

  return (
    <form className="grid gap-3 border border-[var(--border)] bg-white p-4" noValidate onSubmit={handleSubmit(submit)}>
      <div className="flex items-center gap-2"><Upload aria-hidden="true" className="size-4 text-gray-500" /><h2 className="text-sm font-semibold">Media</h2></div>
      <FormError>{formError}</FormError>
      <fieldset className="grid gap-3" disabled={isSubmitting}>
        <Field error={fieldError("fileName")} label="File" registration={register("fileName")} />
        <SelectField label="Content type" registration={register("contentType")}><option value="image/png">image/png</option><option value="image/jpeg">image/jpeg</option><option value="video/mp4">video/mp4</option></SelectField>
        <Field error={fieldError("byteSize")} label="Bytes" registration={register("byteSize", { valueAsNumber: true })} type="number" />
      </fieldset>
      <SubmitButton className="gap-2" isSubmitting={isSubmitting} pendingLabel="Saving..."><Upload aria-hidden="true" className="size-4" />Save</SubmitButton>
    </form>
  );
}
