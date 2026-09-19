"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FieldProps = {
  autoComplete?: string;
  disabled?: boolean;
  error?: string;
  hint?: string;
  label: string;
  placeholder?: string;
  registration: UseFormRegisterReturn;
  suffix?: string;
  type?: string;
};

type TextareaFieldProps = Omit<FieldProps, "suffix" | "type"> & {
  rows?: number;
};

type SelectFieldProps = Omit<FieldProps, "autoComplete" | "placeholder" | "suffix" | "type"> & {
  children: ReactNode;
};

export function Field({
  autoComplete,
  disabled,
  error,
  hint,
  label,
  placeholder,
  registration,
  suffix,
  type = "text",
}: FieldProps) {
  const describedBy = error
    ? `${registration.name}-error`
    : hint
      ? `${registration.name}-hint`
      : undefined;

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600" htmlFor={registration.name}>
        {label}
      </label>
      <div
        className={cn(
          "mt-1 flex items-stretch",
          suffix ? "rounded-md border" : "",
          suffix ? borderColor(Boolean(error)) : "",
        )}
      >
        <input
          {...registration}
          aria-describedby={describedBy}
          aria-invalid={Boolean(error)}
          autoComplete={autoComplete}
          className={cn(
            "h-10 w-full px-3 text-sm text-[var(--foreground)] focus:outline-none disabled:bg-[var(--background)] disabled:text-slate-400",
            suffix
              ? "rounded-l-md focus:ring-1 focus:ring-[var(--primary)]"
              : cn("rounded-md border focus:ring-1", borderColor(Boolean(error))),
          )}
          disabled={disabled}
          id={registration.name}
          placeholder={placeholder}
          type={type}
        />
        {suffix ? (
          <span className="flex items-center rounded-r-md bg-[var(--background)] px-3 text-sm text-slate-500">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <FieldError id={`${registration.name}-error`}>{error}</FieldError>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500" id={`${registration.name}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function TextareaField({
  autoComplete,
  disabled,
  error,
  hint,
  label,
  placeholder,
  registration,
  rows = 4,
}: TextareaFieldProps) {
  const describedBy = error
    ? `${registration.name}-error`
    : hint
      ? `${registration.name}-hint`
      : undefined;

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600" htmlFor={registration.name}>
        {label}
      </label>
      <textarea
        {...registration}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className={cn(
          "mt-1 min-h-24 w-full resize-y rounded-md border px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 disabled:bg-[var(--background)] disabled:text-slate-400",
          borderColor(Boolean(error)),
        )}
        disabled={disabled}
        id={registration.name}
        placeholder={placeholder}
        rows={rows}
      />
      {error ? (
        <FieldError id={`${registration.name}-error`}>{error}</FieldError>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500" id={`${registration.name}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function SelectField({
  children,
  disabled,
  error,
  hint,
  label,
  registration,
}: SelectFieldProps) {
  const describedBy = error
    ? `${registration.name}-error`
    : hint
      ? `${registration.name}-hint`
      : undefined;

  return (
    <div>
      <label className="block text-xs font-medium text-slate-600" htmlFor={registration.name}>
        {label}
      </label>
      <select
        {...registration}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={cn(
          "mt-1 h-10 w-full rounded-md border bg-white px-3 text-sm text-[var(--foreground)] focus:outline-none focus:ring-1 disabled:bg-[var(--background)] disabled:text-slate-400",
          borderColor(Boolean(error)),
        )}
        disabled={disabled}
        id={registration.name}
      >
        {children}
      </select>
      {error ? (
        <FieldError id={`${registration.name}-error`}>{error}</FieldError>
      ) : hint ? (
        <span className="mt-1 block text-xs text-slate-500" id={`${registration.name}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function FieldError({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p className="mt-1 text-xs text-red-600" id={id} role="alert">
      {children}
    </p>
  );
}

export function FormError({ children }: { children: ReactNode }) {
  if (!children) {
    return null;
  }
  return (
    <div
      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
      role="alert"
    >
      {children}
    </div>
  );
}

export function SubmitButton({
  children,
  className,
  disabled,
  isSubmitting = false,
  pendingLabel = "Working...",
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  isSubmitting?: boolean;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  const isPending = pending || isSubmitting;

  return (
    <Button
      className={cn("h-11 w-full", className)}
      disabled={disabled}
      isProcessing={isPending}
      processingLabel={pendingLabel}
      type="submit"
    >
      {children}
    </Button>
  );
}

function borderColor(hasError: boolean) {
  return hasError
    ? "border-red-400 focus:border-red-500 focus:ring-red-500"
    : "border-[var(--border)] focus:border-[var(--primary)] focus:ring-[var(--primary)]";
}
