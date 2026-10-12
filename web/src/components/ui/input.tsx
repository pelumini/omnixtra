import { Search } from "lucide-react";
import { forwardRef } from "react";

import { cn } from "@/lib/utils";

import type { ComponentPropsWithoutRef } from "react";

type ControlSurfaceOptions = {
  disabled?: boolean;
  focusWithin?: boolean;
  hasError?: boolean;
};

export function controlSurface({
  disabled = false,
  focusWithin = false,
  hasError = false,
}: ControlSurfaceOptions = {}) {
  return cn(
    "rounded-[10px] border bg-[var(--color-bg-white-0)] shadow-[var(--shadow-x-small)] transition-[border-color,box-shadow] hover:border-[var(--color-stroke-soft-200)]",
    hasError && !focusWithin &&
      "border-[var(--color-state-error)] focus:border-[var(--color-state-error)] focus:shadow-[var(--shadow-button-focus-error)]",
    hasError && focusWithin &&
      "border-[var(--color-state-error)] focus-within:border-[var(--color-state-error)] focus-within:shadow-[var(--shadow-button-focus-error)]",
    !hasError && !focusWithin &&
      "border-[var(--color-stroke-soft-200)] focus:border-[var(--color-stroke-strong-900)] focus:shadow-[var(--shadow-button-focus-important)]",
    !hasError && focusWithin &&
      "border-[var(--color-stroke-soft-200)] focus-within:border-[var(--color-stroke-strong-900)] focus-within:shadow-[var(--shadow-button-focus-important)]",
    disabled &&
      "border-[var(--color-stroke-soft-200)] bg-[var(--color-bg-weak-100)] text-[var(--color-text-disabled-300)] shadow-none",
  );
}

type InputProps = ComponentPropsWithoutRef<"input"> & {
  bare?: boolean;
  hasError?: boolean;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { bare = false, className, disabled, hasError = false, ...props },
  ref,
) {
  return (
    <input
      {...props}
      aria-invalid={props["aria-invalid"] ?? (hasError || undefined)}
      className={cn(
        !bare &&
          "h-10 w-full px-3 text-xs leading-4 text-[var(--color-text-main-900)] placeholder:text-[var(--color-text-soft-400)] focus:outline-none disabled:cursor-not-allowed disabled:placeholder:text-[var(--color-text-disabled-300)]",
        !bare && controlSurface({ disabled, hasError }),
        className,
      )}
      disabled={disabled}
      ref={ref}
    />
  );
});

type TextareaProps = ComponentPropsWithoutRef<"textarea"> & {
  hasError?: boolean;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { className, disabled, hasError = false, ...props },
  ref,
) {
  return (
    <textarea
      {...props}
      aria-invalid={props["aria-invalid"] ?? (hasError || undefined)}
      className={cn(
        "min-h-24 w-full resize-y px-3 py-2.5 text-xs leading-4 text-[var(--color-text-main-900)] placeholder:text-[var(--color-text-soft-400)] focus:outline-none disabled:cursor-not-allowed disabled:placeholder:text-[var(--color-text-disabled-300)]",
        controlSurface({ disabled, hasError }),
        className,
      )}
      disabled={disabled}
      ref={ref}
    />
  );
});

type SelectProps = ComponentPropsWithoutRef<"select"> & {
  hasError?: boolean;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, disabled, hasError = false, ...props },
  ref,
) {
  return (
    <select
      {...props}
      aria-invalid={props["aria-invalid"] ?? (hasError || undefined)}
      className={cn(
        "h-10 w-full px-3 text-xs leading-4 text-[var(--color-text-main-900)] focus:outline-none disabled:cursor-not-allowed",
        controlSurface({ disabled, hasError }),
        className,
      )}
      disabled={disabled}
      ref={ref}
    />
  );
});

type SearchInputProps = Omit<InputProps, "bare" | "type"> & {
  label: string;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput(
  { className, disabled, hasError = false, label, ...props },
  ref,
) {
  return (
    <label
      className={cn(
        "flex h-11 min-w-64 flex-1 items-center gap-3 px-3 text-sm text-[var(--color-text-sub-500)] sm:max-w-md",
        controlSurface({ disabled, focusWithin: true, hasError }),
        "rounded-md bg-[var(--color-bg-weak-100)] shadow-none",
        className,
      )}
    >
      <Search aria-hidden="true" className="size-4 shrink-0" />
      <span className="sr-only">{label}</span>
      <Input
        {...props}
        bare
        className="min-w-0 flex-1 bg-transparent text-[var(--color-text-main-900)] outline-none placeholder:text-[var(--color-text-soft-400)]"
        disabled={disabled}
        ref={ref}
        type="search"
      />
    </label>
  );
});
