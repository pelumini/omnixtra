"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input, Select, Textarea, controlSurface } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";


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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isPassword = type === "password";
  const describedBy = error
    ? `${registration.name}-error`
    : hint
      ? `${registration.name}-hint`
      : undefined;

  return (
    <div className="grid gap-1">
      <div
        className={cn(
          "group relative mt-2 flex h-11 items-stretch",
          controlSurface({ disabled, focusWithin: true, hasError: Boolean(error) }),
        )}
      >
        <label
          className={cn(
            "absolute left-4 top-[-10px] z-10 bg-[var(--color-bg-white-0)] px-1 text-[13px] font-medium leading-4 text-[var(--color-text-main-900)]",
            error ? "text-[var(--color-state-error)]" : "",
            disabled ? "bg-[var(--color-bg-weak-100)] text-[var(--color-text-disabled-300)]" : "",
          )}
          htmlFor={registration.name}
        >
          {label}
        </label>
        <Input
          {...registration}
          aria-describedby={describedBy}
          bare
          hasError={Boolean(error)}
          autoComplete={autoComplete}
          className={cn(
            "min-w-0 flex-1 rounded-[10px] bg-transparent py-2.5 pl-3 pr-2.5 text-sm leading-5 text-[var(--color-text-main-900)] placeholder:text-[var(--color-text-soft-400)] focus:outline-none disabled:cursor-not-allowed disabled:text-[var(--color-text-disabled-300)] disabled:placeholder:text-[var(--color-text-disabled-300)]",
            suffix ? "rounded-r-none" : "",
          )}
          disabled={disabled}
          id={registration.name}
          placeholder={placeholder}
          type={isPassword && passwordVisible ? "text" : type}
        />
        {isPassword ? (
          <button
            aria-label={passwordVisible ? "Hide password" : "Show password"}
            className="grid w-10 shrink-0 place-items-center text-[var(--color-text-soft-400)] hover:text-[var(--color-text-main-900)]"
            onClick={() => setPasswordVisible((visible) => !visible)}
            type="button"
          >
            {passwordVisible ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
          </button>
        ) : null}
        {suffix ? (
          <span className="flex items-center rounded-r-[10px] border-l border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] px-3 text-xs leading-4 text-[var(--color-text-sub-500)]">
            {suffix}
          </span>
        ) : null}
      </div>
      {error ? (
        <FieldError id={`${registration.name}-error`}>{error}</FieldError>
      ) : hint ? (
        <span
          className="block text-xs leading-4 text-[var(--color-text-sub-500)]"
          id={`${registration.name}-hint`}
        >
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
    <div className="grid gap-1">
      <div className="group relative mt-2">
        <label className={cn("absolute left-4 top-[-10px] z-10 bg-[var(--color-bg-white-0)] px-1 text-[13px] font-medium leading-4 text-[var(--color-text-main-900)]", error ? "text-[var(--color-state-error)]" : "", disabled ? "bg-[var(--color-bg-weak-100)] text-[var(--color-text-disabled-300)]" : "")} htmlFor={registration.name}>{label}</label>
        <Textarea {...registration} aria-describedby={describedBy} hasError={Boolean(error)} autoComplete={autoComplete} disabled={disabled} id={registration.name} placeholder={placeholder} rows={rows} />
      </div>
      {error ? (
        <FieldError id={`${registration.name}-error`}>{error}</FieldError>
      ) : hint ? (
        <span
          className="block text-xs leading-4 text-[var(--color-text-sub-500)]"
          id={`${registration.name}-hint`}
        >
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
    <div className="grid gap-1">
      <div className="group relative mt-2">
        <label className={cn("absolute left-4 top-[-10px] z-10 bg-[var(--color-bg-white-0)] px-1 text-[13px] font-medium leading-4 text-[var(--color-text-main-900)]", error ? "text-[var(--color-state-error)]" : "", disabled ? "bg-[var(--color-bg-weak-100)] text-[var(--color-text-disabled-300)]" : "")} htmlFor={registration.name}>{label}</label>
        <Select {...registration} aria-describedby={describedBy} hasError={Boolean(error)} disabled={disabled} id={registration.name}>{children}</Select>
      </div>
      {error ? (
        <FieldError id={`${registration.name}-error`}>{error}</FieldError>
      ) : hint ? (
        <span
          className="block text-xs leading-4 text-[var(--color-text-sub-500)]"
          id={`${registration.name}-hint`}
        >
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export function FieldError({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <p className="text-xs leading-4 text-[var(--color-state-error)]" id={id} role="alert">
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
      className="rounded-[10px] border border-[var(--color-state-error)] bg-[var(--color-red-lighter)] px-3 py-2 text-sm text-[var(--color-state-error)]"
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
