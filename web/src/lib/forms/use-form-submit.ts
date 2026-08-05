"use client";

import { useState } from "react";
import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

import { resolveMessage } from "@/lib/forms/messages";
import {
  isApiErrorEnvelope,
  partitionServerError,
  type ApiError,
  type ApiErrorEnvelope,
} from "@/lib/forms/server-errors";

type SubmitState = "idle" | "submitting" | "error";

type UseFormSubmitArgs<TInput extends FieldValues, TResult> = {
  action: (input: TInput) => Promise<TResult>;
  onSuccess: (result: TResult) => void | Promise<void>;
  setError: UseFormSetError<TInput>;
};

export function useFormSubmit<TInput extends FieldValues, TResult>({
  action,
  onSuccess,
  setError,
}: UseFormSubmitArgs<TInput, TResult>) {
  const [state, setState] = useState<SubmitState>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(input: TInput) {
    setState("submitting");
    setFormError(null);
    try {
      const result = await action(input);
      await onSuccess(result);
      setState("idle");
    } catch (error) {
      applyError(error);
      setState("error");
    }
  }

  function applyError(error: unknown) {
    const apiError = extractApiError(error);
    if (apiError === null) {
      setFormError("Something went wrong. Please try again.");
      return;
    }

    const { fieldErrors, formMessage } = partitionServerError(apiError);
    for (const fieldError of fieldErrors) {
      setError(fieldError.field as Path<TInput>, {
        message:
          fieldError.message ?? resolveMessage(fieldError.field, fieldError.constraint),
        type: "server",
      });
    }
    if (formMessage) {
      setFormError(formMessage);
    }
  }

  return {
    clearFormError: () => setFormError(null),
    formError,
    isSubmitting: state === "submitting",
    submit,
  };
}

function extractApiError(error: unknown): ApiError | null {
  if (isApiErrorEnvelope(error)) {
    return error.error;
  }
  if (
    typeof error === "object" &&
    error !== null &&
    "envelope" in error &&
    isApiErrorEnvelope((error as { envelope: unknown }).envelope)
  ) {
    return (error as { envelope: ApiErrorEnvelope }).envelope.error;
  }
  return null;
}
