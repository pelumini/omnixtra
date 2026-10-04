"use client";

import { useState } from "react";


import { feedbackToast } from "@/lib/feedback/toast";
import { resolveMessage } from "@/lib/forms/messages";
import {
  isApiErrorEnvelope,
  partitionServerError,
  type ApiError,
  type ApiErrorEnvelope,
} from "@/lib/forms/server-errors";

import type { FieldValues, Path, UseFormSetError } from "react-hook-form";

type SubmitState = "idle" | "submitting" | "error";

type UseFormSubmitArgs<TInput extends FieldValues, TResult> = {
  action: (input: TInput) => Promise<TResult>;
  errorMessage?: string;
  onSuccess: (result: TResult) => void | Promise<void>;
  resetOnSuccess?: boolean;
  setError: UseFormSetError<TInput>;
  successMessage?: string;
};

export function useFormSubmit<TInput extends FieldValues, TResult>({
  action,
  errorMessage,
  onSuccess,
  resetOnSuccess = true,
  setError,
  successMessage,
}: UseFormSubmitArgs<TInput, TResult>) {
  const [state, setState] = useState<SubmitState>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  async function submit(input: TInput) {
    setState("submitting");
    setFormError(null);
    try {
      const result = await action(input);
      await onSuccess(result);
      if (successMessage) {
        feedbackToast.success(successMessage);
      }
      if (resetOnSuccess) {
        setState("idle");
      }
    } catch (error) {
      applyError(error);
      feedbackToast.error(errorMessage ?? "Something went wrong. Please try again.");
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
